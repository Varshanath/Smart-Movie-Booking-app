export interface AiChatMessage {
  id: string;
  userId: string;
  prompt: string;
  response: string;
  createdAt: Date;
}
