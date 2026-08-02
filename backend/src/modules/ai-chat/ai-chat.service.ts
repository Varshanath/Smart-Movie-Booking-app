import { ApiError } from "../../shared/utils/api-error";
import { callAgentService } from "./ai-agent-client";
import { listAiChatMessages, saveAiChatMessage } from "./ai-chat.repository";

export function getAiChatHistory(userId: string) {
  return listAiChatMessages(userId);
}

export async function sendAiChatMessage(
  userId: string,
  payload: unknown,
  agentClient: typeof callAgentService = callAgentService,
) {
  const prompt = readPrompt(payload);
  // userId doubles as the ADK session id for now — see ai-agent-client.ts.
  const { response } = await agentClient(userId, prompt, userId);
  return saveAiChatMessage(userId, prompt, response);
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
