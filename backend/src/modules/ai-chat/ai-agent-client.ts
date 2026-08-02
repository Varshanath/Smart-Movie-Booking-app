import { ApiError } from "../../shared/utils/api-error";

const AGENT_CHAT_TIMEOUT_MS = 15_000;

export interface AgentChatResult {
  sessionId: string;
  response: string;
}

function agentServiceUrl(): string {
  return process.env.AI_AGENT_SERVICE_URL ?? "http://localhost:8001";
}

// Calls the standalone Python ADK agent service (see ../../../../ai-agent).
// userId doubles as the ADK session id for now, so a user's chat stays one
// continuous agent session — see backend/README or the ai-chat module notes
// if that needs to become a real per-conversation id later.
export async function callAgentService(
  userId: string,
  message: string,
  sessionId: string,
): Promise<AgentChatResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), AGENT_CHAT_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(`${agentServiceUrl()}/agent/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId, message, session_id: sessionId }),
      signal: controller.signal,
    });
  } catch (error) {
    throw new ApiError(503, "AI agent service is unavailable");
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    throw new ApiError(502, "AI agent service returned an error");
  }

  let data: unknown;
  try {
    data = await response.json();
  } catch (error) {
    throw new ApiError(502, "AI agent service returned an invalid response");
  }

  if (
    typeof data !== "object" ||
    data === null ||
    typeof (data as Record<string, unknown>).response !== "string"
  ) {
    throw new ApiError(502, "AI agent service returned an invalid response");
  }

  const result = data as { response: string; session_id?: unknown };
  return {
    response: result.response,
    sessionId: typeof result.session_id === "string" ? result.session_id : sessionId,
  };
}
