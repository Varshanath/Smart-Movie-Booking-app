import request from "supertest";

import { createApp } from "../src/app";
import { callAgentService } from "../src/modules/ai-chat/ai-agent-client";
import { clearAiChatMessagesForTests } from "../src/modules/ai-chat/ai-chat.repository";
import { clearUsersForTests } from "../src/modules/users/user.repository";

jest.mock("../src/modules/ai-chat/ai-agent-client");

const mockedCallAgentService = callAgentService as jest.MockedFunction<typeof callAgentService>;

describe("cross-user ownership enforcement", () => {
  const app = createApp();

  beforeEach(async () => {
    mockedCallAgentService.mockReset();
    await clearAiChatMessagesForTests();
    await clearUsersForTests();
  });

  it("rejects User A's token reading User B's preferences", async () => {
    const userA = await registerUser("user-a@test.com", "9876543210");
    const userB = await registerUser("user-b@test.com", "9876543211");

    const response = await request(app)
      .get(`/api/users/${userB.id}/preferences`)
      .set("Authorization", `Bearer ${userA.token}`)
      .expect(403);

    expect(response.body.message).toBe("You do not have access to this resource");
  });

  it("rejects User A's token reading User B's watch history", async () => {
    const userA = await registerUser("user-a@test.com", "9876543210");
    const userB = await registerUser("user-b@test.com", "9876543211");

    const response = await request(app)
      .get(`/api/users/${userB.id}/watch-history`)
      .set("Authorization", `Bearer ${userA.token}`)
      .expect(403);

    expect(response.body.message).toBe("You do not have access to this resource");
  });

  it("rejects User A's token sending an AI chat message as User B, and never calls the agent", async () => {
    const userA = await registerUser("user-a@test.com", "9876543210");
    const userB = await registerUser("user-b@test.com", "9876543211");

    const response = await request(app)
      .post(`/api/users/${userB.id}/ai-chat`)
      .set("Authorization", `Bearer ${userA.token}`)
      .send({ prompt: "Recommend a thriller." })
      .expect(403);

    expect(response.body.message).toBe("You do not have access to this resource");
    expect(mockedCallAgentService).not.toHaveBeenCalled();
  });

  it("rejects User A's token reading User B's AI chat history", async () => {
    const userA = await registerUser("user-a@test.com", "9876543210");
    const userB = await registerUser("user-b@test.com", "9876543211");

    const response = await request(app)
      .get(`/api/users/${userB.id}/ai-chat`)
      .set("Authorization", `Bearer ${userA.token}`)
      .expect(403);

    expect(response.body.message).toBe("You do not have access to this resource");
  });

  it("passes only the authenticated caller's id to the AI agent, never a spoofed one", async () => {
    mockedCallAgentService.mockResolvedValueOnce({
      sessionId: "session-a",
      response: "Here are some picks.",
    });
    const userA = await registerUser("user-a@test.com", "9876543210");

    await request(app)
      .post(`/api/users/${userA.id}/ai-chat`)
      .set("Authorization", `Bearer ${userA.token}`)
      .send({ prompt: "Recommend something." })
      .expect(201);

    expect(mockedCallAgentService).toHaveBeenCalledWith(userA.id, "Recommend something.", userA.id);
  });

  async function registerUser(email: string, phoneNumber: string) {
    const response = await request(app).post("/api/users/register").send({
      name: "Ownership Test User",
      gender: "female",
      location: "Bengaluru",
      moviePreference: ["Action"],
      email,
      phoneNumber,
      password: "password123",
    });
    return { ...response.body.user, token: response.body.token as string };
  }
});
