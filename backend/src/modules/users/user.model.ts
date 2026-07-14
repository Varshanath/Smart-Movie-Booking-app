export type Gender = "male" | "female" | "other" | "prefer_not_to_say";

export interface User {
  id: string;
  name: string;
  gender: Gender;
  location: string;
  moviePreference: string[];
  email: string;
  phoneNumber: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserInput {
  name: string;
  gender: Gender;
  location: string;
  moviePreference: string[];
  email: string;
  phoneNumber: string;
}
