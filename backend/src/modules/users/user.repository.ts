import { randomUUID } from "crypto";

import { CreateUserInput, User } from "./user.model";

const users = new Map<string, User>();

export async function findUserByEmail(email: string) {
  return Array.from(users.values()).find((user) => user.email === email);
}

export async function findUserByPhoneNumber(phoneNumber: string) {
  return Array.from(users.values()).find(
    (user) => user.phoneNumber === phoneNumber,
  );
}

export async function saveUser(input: CreateUserInput) {
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

export function clearUsersForTests() {
  users.clear();
}
