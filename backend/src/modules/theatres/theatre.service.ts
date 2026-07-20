import { ApiError } from "../../shared/utils/api-error";
import { CreateTheatreInput } from "./theatre.model";
import { listTheatres, saveTheatre } from "./theatre.repository";

export async function getTheatres() {
  return listTheatres();
}

export async function createTheatre(payload: unknown) {
  return saveTheatre(validateCreateTheatreInput(payload));
}

function validateCreateTheatreInput(payload: unknown): CreateTheatreInput {
  if (!isRecord(payload)) {
    throw new ApiError(400, "Request body is required");
  }

  return {
    name: readRequiredString(payload, "name"),
    location: readRequiredString(payload, "location"),
    totalSeats: readPositiveNumber(payload, "totalSeats"),
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

function readPositiveNumber(payload: Record<string, unknown>, key: string) {
  const value = payload[key];
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    throw new ApiError(400, `${key} must be a positive number`);
  }
  return value;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
