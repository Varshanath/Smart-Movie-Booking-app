import { randomUUID } from "crypto";

import { isPostgresEnabled, pool } from "../../database/postgres";
import { CreateUserInput, User } from "./user.model";

type SaveUserInput = Omit<CreateUserInput, "password"> & {
  passwordHash: string;
};

const users = new Map<string, User>();

export async function findUserByEmail(email: string) {
  if (isPostgresEnabled && pool) {
    const result = await pool.query(
      `
        SELECT
          id,
          name,
          gender,
          location,
          movie_preference AS "moviePreference",
          email,
          phone_number AS "phoneNumber",
          password_hash AS "passwordHash",
          created_at AS "createdAt",
          updated_at AS "updatedAt"
        FROM users
        WHERE email = $1
      `,
      [email],
    );

    return result.rows[0] as User | undefined;
  }

  return Array.from(users.values()).find((user) => user.email === email);
}

export async function findUserById(id: string) {
  if (isPostgresEnabled && pool) {
    const result = await pool.query(
      `
        SELECT
          id,
          name,
          gender,
          location,
          movie_preference AS "moviePreference",
          email,
          phone_number AS "phoneNumber",
          password_hash AS "passwordHash",
          created_at AS "createdAt",
          updated_at AS "updatedAt"
        FROM users
        WHERE id = $1
      `,
      [id],
    );

    return result.rows[0] as User | undefined;
  }

  return users.get(id);
}

export async function findUserByPhoneNumber(phoneNumber: string) {
  if (isPostgresEnabled && pool) {
    const result = await pool.query(
      `
        SELECT
          id,
          name,
          gender,
          location,
          movie_preference AS "moviePreference",
          email,
          phone_number AS "phoneNumber",
          password_hash AS "passwordHash",
          created_at AS "createdAt",
          updated_at AS "updatedAt"
        FROM users
        WHERE phone_number = $1
      `,
      [phoneNumber],
    );

    return result.rows[0] as User | undefined;
  }

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

  if (isPostgresEnabled && pool) {
    await pool.query(
      `
        INSERT INTO users (
          id,
          name,
          gender,
          location,
          movie_preference,
          email,
          phone_number,
          password_hash,
          created_at,
          updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `,
      [
        user.id,
        user.name,
        user.gender,
        user.location,
        user.moviePreference,
        user.email,
        user.phoneNumber,
        user.passwordHash,
        user.createdAt,
        user.updatedAt,
      ],
    );
    return user;
  }

  users.set(user.id, user);
  return user;
}

export async function updateUserPasswordHash(
  userId: string,
  passwordHash: string,
) {
  if (isPostgresEnabled && pool) {
    const existingUser = await pool.query(
      `
        SELECT
          id,
          name,
          gender,
          location,
          movie_preference AS "moviePreference",
          email,
          phone_number AS "phoneNumber",
          password_hash AS "passwordHash",
          created_at AS "createdAt",
          updated_at AS "updatedAt"
        FROM users
        WHERE id = $1
      `,
      [userId],
    );
    const user = existingUser.rows[0] as User | undefined;
    if (!user) {
      return undefined;
    }

    const updatedUser: User = {
      ...user,
      passwordHash,
      updatedAt: new Date(),
    };

    await pool.query(
      `
        UPDATE users
        SET password_hash = $1, updated_at = $2
        WHERE id = $3
      `,
      [updatedUser.passwordHash, updatedUser.updatedAt, userId],
    );
    return updatedUser;
  }

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

export async function clearUsersForTests() {
  if (isPostgresEnabled && pool) {
    await pool.query("DELETE FROM users");
    return;
  }

  users.clear();
}
