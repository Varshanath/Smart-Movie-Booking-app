import { randomUUID } from "crypto";

import { CreateUserInput, User } from "./user.model";

type SaveUserInput = Omit<CreateUserInput, "password"> & {
  passwordHash: string;
};

const users = new Map<string, User>();

export async function findUserByEmail(email: string) {
  return Array.from(users.values()).find((user) => user.email === email);
}

export async function findUserByPhoneNumber(phoneNumber: string) {
  return Array.from(users.values()).find(
    (user) => user.phoneNumber === phoneNumber,
  );
}

export async function saveUser(input: SaveUserInput) {
  const now = new Date();
  const user: User = {
    id: randomUUID(),
    ...input,
    createdAt: now,
    updatedAt: now,
  };

  users.set(user.id, user);
  return user;
}

export async function updateUserPasswordHash(
  userId: string,
  passwordHash: string,
) {
  const user = users.get(userId);
  if (!user) {
    return undefined;
  }

  const updatedUser: User = {
    ...user,
    passwordHash,
    updatedAt: new Date(),
  };

  users.set(userId, updatedUser);
  return updatedUser;
}

export function clearUsersForTests() {
  users.clear();
}
