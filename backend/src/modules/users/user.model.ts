export type Gender = "male" | "female" | "other" | "prefer_not_to_say";

export interface User {
  id: string;
  name: string;
  gender: Gender;
  location: string;
  moviePreference: string[];
  email: string;
  phoneNumber: string;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
}

export type PublicUser = Omit<User, "passwordHash">;

export interface CreateUserInput {
  name: string;
  gender: Gender;
  location: string;
  moviePreference: string[];
  email: string;
  phoneNumber: string;
  password: string;
}

export interface LoginUserInput {
  email: string;
  password: string;
}

export interface ChangePasswordInput {
  email: string;
  currentPassword: string;
  newPassword: string;
}
