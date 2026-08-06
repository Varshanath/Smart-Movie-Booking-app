import { randomBytes, scryptSync, timingSafeEqual } from "crypto";

import { signAuthToken } from "../auth/token";
import { ApiError } from "../../shared/utils/api-error";
import { logLoginAttempt } from "../../shared/utils/login-logger";
import {
  ChangePasswordInput,
  CreateUserInput,
  Gender,
  LoginUserInput,
  PublicUser,
  User,
} from "./user.model";
import {
  findUserByEmail,
  findUserByPhoneNumber,
  saveUser,
  searchUsers as searchUsersRepository,
  updateUserPasswordHash,
  updateUserProfile as updateUserProfileRepository,
} from "./user.repository";

const allowedGenders: Gender[] = [
  "male",
  "female",
  "other",
  "prefer_not_to_say",
];

export async function createUser(payload: unknown) {
  const input = validateCreateUserInput(payload);

  const existingEmail = await findUserByEmail(input.email);
  if (existingEmail) {
    throw new ApiError(409, "Email ID is already registered");
  }

  const existingPhoneNumber = await findUserByPhoneNumber(input.phoneNumber);
  if (existingPhoneNumber) {
    throw new ApiError(409, "Phone number is already registered");
  }

  const { password, ...profile } = input;
  const user = await saveUser({
    ...profile,
    passwordHash: hashPassword(password),
  });
  // Token payload is just `sub: user.id` (see modules/auth/token.ts) — never
  // email/name/preferences/etc., since a JWT is signed but not encrypted.
  return { user: toPublicUser(user), token: signAuthToken(user.id) };
}

export async function loginUser(payload: unknown) {
  const input = validateLoginUserInput(payload);
  const user = await findUserByEmail(input.email);

  if (!user || !verifyPassword(input.password, user.passwordHash)) {
    logLoginAttempt({
      outcome: "failure",
      email: input.email,
      reason: "Email ID or password is incorrect",
    });
    throw new ApiError(401, "Email ID or password is incorrect");
  }

  logLoginAttempt({ outcome: "success", email: user.email, userId: user.id });

  return { user: toPublicUser(user), token: signAuthToken(user.id) };
}

export async function searchUsers(rawQuery: unknown, rawExcludeUserId: unknown) {
  const query = typeof rawQuery === "string" ? rawQuery.trim() : "";
  const excludeUserId =
    typeof rawExcludeUserId === "string" && rawExcludeUserId.trim().length > 0
      ? rawExcludeUserId.trim()
      : undefined;

  return searchUsersRepository({ query, excludeUserId, limit: 20 });
}

export async function updateUserProfile(userId: string, payload: unknown) {
  if (!isRecord(payload)) {
    throw new ApiError(400, "Request body is required");
  }

  const location = readRequiredString(payload, "location");
  const moviePreference = readMoviePreference(payload.moviePreference);

  const updatedUser = await updateUserProfileRepository(userId, {
    location,
    moviePreference,
  });
  if (!updatedUser) {
    throw new ApiError(404, "User not found");
  }

  return toPublicUser(updatedUser);
}

export async function changeUserPassword(payload: unknown) {
  const input = validateChangePasswordInput(payload);
  const user = await findUserByEmail(input.email);

  if (!user || !verifyPassword(input.currentPassword, user.passwordHash)) {
    throw new ApiError(401, "Current password is incorrect");
  }

  const updatedUser = await updateUserPasswordHash(
    user.id,
    hashPassword(input.newPassword),
  );
  if (!updatedUser) {
    throw new ApiError(404, "User not found");
  }

  return toPublicUser(updatedUser);
}

function validateCreateUserInput(payload: unknown): CreateUserInput {
  if (!isRecord(payload)) {
    throw new ApiError(400, "Request body is required");
  }

  const name = readRequiredString(payload, "name");
  const gender = readRequiredString(payload, "gender") as Gender;
  const location = readRequiredString(payload, "location");
  const email = readRequiredString(payload, "email").toLowerCase();
  const phoneNumber = readRequiredString(payload, "phoneNumber");
  const password = readPassword(payload, "password");
  const moviePreference = readMoviePreference(payload.moviePreference);

  if (!allowedGenders.includes(gender)) {
    throw new ApiError(400, "Gender is not valid");
  }

  if (!email.includes("@")) {
    throw new ApiError(400, "Email ID is not valid");
  }

  return {
    name,
    gender,
    location,
    moviePreference,
    email,
    phoneNumber,
    password,
  };
}

function validateLoginUserInput(payload: unknown): LoginUserInput {
  if (!isRecord(payload)) {
    throw new ApiError(400, "Request body is required");
  }

  return {
    email: readRequiredString(payload, "email").toLowerCase(),
    password: readRequiredString(payload, "password"),
  };
}

function validateChangePasswordInput(payload: unknown): ChangePasswordInput {
  if (!isRecord(payload)) {
    throw new ApiError(400, "Request body is required");
  }

  const newPassword = readPassword(payload, "newPassword");

  return {
    email: readRequiredString(payload, "email").toLowerCase(),
    currentPassword: readRequiredString(payload, "currentPassword"),
    newPassword,
  };
}

function readRequiredString(
  payload: Record<string, unknown>,
  key: string,
): string {
  const value = payload[key];
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new ApiError(400, `${key} is required`);
  }

  return value.trim();
}

function readPassword(payload: Record<string, unknown>, key: string): string {
  const password = readRequiredString(payload, key);
  if (password.length < 6) {
    throw new ApiError(400, `${key} must be at least 6 characters`);
  }

  return password;
}

function readMoviePreference(value: unknown) {
  if (!Array.isArray(value) || value.length === 0) {
    throw new ApiError(400, "moviePreference is required");
  }

  const preferences = value.map((item) => {
    if (typeof item !== "string" || item.trim().length === 0) {
      throw new ApiError(400, "moviePreference must contain text values");
    }
    return item.trim();
  });

  return preferences;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function toPublicUser(user: User): PublicUser {
  const { passwordHash: _passwordHash, ...publicUser } = user;
  return publicUser;
}

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, passwordHash: string): boolean {
  const [salt, hash] = passwordHash.split(":");
  if (!salt || !hash) {
    return false;
  }

  const actualHash = Buffer.from(hash, "hex");
  const expectedHash = scryptSync(password, salt, 64);

  return (
    actualHash.length === expectedHash.length &&
    timingSafeEqual(actualHash, expectedHash)
  );
}
