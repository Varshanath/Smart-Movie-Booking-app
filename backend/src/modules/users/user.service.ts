import { ApiError } from "../../shared/utils/api-error";
import { CreateUserInput, Gender } from "./user.model";
import {
  findUserByEmail,
  findUserByPhoneNumber,
  saveUser,
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

  return saveUser(input);
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
