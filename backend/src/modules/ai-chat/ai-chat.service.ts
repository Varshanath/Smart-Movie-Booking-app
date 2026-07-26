import { ApiError } from "../../shared/utils/api-error";
import { listAiChatMessages, saveAiChatMessage } from "./ai-chat.repository";

export function getAiChatHistory(userId: string) {
  return listAiChatMessages(userId);
}

export function sendAiChatMessage(userId: string, payload: unknown) {
  const prompt = readPrompt(payload);
  return saveAiChatMessage(userId, prompt, generateResponse(prompt));
}

// No real AI/LLM integration is wired up yet; this gives a plausible,
// deterministic reply so the chat endpoint is usable end-to-end.
function generateResponse(prompt: string): string {
  const lower = prompt.toLowerCase();

  if (lower.includes("book")) {
    return "I can help you book tickets — pick a show and seats and I'll take you to checkout.";
  }
  if (lower.includes("recommend") || lower.includes("suggest")) {
    return "Here are a few highly-rated picks based on what you usually watch.";
  }
  if (lower.includes("like") || lower.includes("similar")) {
    return "If you enjoyed that, here are a few similar movies worth checking out.";
  }
  if (lower.includes("imax") || lower.includes("4dx") || lower.includes("3d")) {
    return "Here are the premium-format shows available near you.";
  }
  if (lower.includes("cheap") || lower.includes("price") || lower.includes("offer")) {
    return "Here are the lowest-priced shows and any active coupons you can apply.";
  }

  return "I can help you find movies, check showtimes, or book tickets — what would you like to do?";
}

function readPrompt(payload: unknown): string {
  if (typeof payload !== "object" || payload === null || Array.isArray(payload)) {
    throw new ApiError(400, "Request body is required");
  }
  const value = (payload as Record<string, unknown>).prompt;
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new ApiError(400, "prompt is required");
  }
  return value.trim();
}
