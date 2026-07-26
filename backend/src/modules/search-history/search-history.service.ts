import { ApiError } from "../../shared/utils/api-error";
import { listSearchHistory, saveSearchHistoryEntry } from "./search-history.repository";

export function getSearchHistory(userId: string) {
  return listSearchHistory(userId);
}

export function addSearchHistoryEntry(userId: string, payload: unknown) {
  const query = readQuery(payload);
  return saveSearchHistoryEntry(userId, query);
}

function readQuery(payload: unknown): string {
  if (typeof payload !== "object" || payload === null || Array.isArray(payload)) {
    throw new ApiError(400, "Request body is required");
  }
  const value = (payload as Record<string, unknown>).query;
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new ApiError(400, "query is required");
  }
  return value.trim();
}
