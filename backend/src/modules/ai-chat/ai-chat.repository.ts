import { randomUUID } from "crypto";

import { isPostgresEnabled, pool } from "../../database/postgres";
import { AiChatMessage } from "./ai-chat.model";

const messages = new Map<string, AiChatMessage>();

const SELECT_COLUMNS = `id, user_id AS "userId", prompt, response, created_at AS "createdAt"`;

export async function listAiChatMessages(userId: string) {
  if (isPostgresEnabled && pool) {
    const result = await pool.query(
      `SELECT ${SELECT_COLUMNS} FROM ai_chat_messages WHERE user_id = $1 ORDER BY created_at DESC`,
      [userId],
    );
    return result.rows as AiChatMessage[];
  }
  return Array.from(messages.values())
    .filter((message) => message.userId === userId)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export async function saveAiChatMessage(userId: string, prompt: string, response: string) {
  const message: AiChatMessage = { id: randomUUID(), userId, prompt, response, createdAt: new Date() };

  if (isPostgresEnabled && pool) {
    await pool.query(
      `INSERT INTO ai_chat_messages (id, user_id, prompt, response, created_at) VALUES ($1, $2, $3, $4, $5)`,
      [message.id, message.userId, message.prompt, message.response, message.createdAt],
    );
    return message;
  }

  messages.set(message.id, message);
  return message;
}

export async function clearAiChatMessagesForTests() {
  if (isPostgresEnabled && pool) {
    await pool.query("DELETE FROM ai_chat_messages");
    return;
  }
  messages.clear();
}
