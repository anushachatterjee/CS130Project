/**
 * Tests for User Story 6: Natural-Language Spending Queries (Optional)
 *
 * Acceptance Criteria:
 * - The system supports natural-language questions about spending.
 * - Each question is answered using the user's stored financial data.
 * - The response summarizes results in plain language.
 *
 * Note: Gemini API is mocked — no real API calls are made in tests.
 */
import request from "supertest";
import { app } from "../app";
import { setupTestDb, clearTables, closePool } from "./helpers/testDb";

// ─── Mock Gemini before any imports touch it ─────────────────────────────────
jest.mock("../lib/gemini", () => ({
  aiModel: {
    startChat: jest.fn().mockReturnValue({
      sendMessage: jest.fn().mockResolvedValue({
        response: {
          text: () => "You spent $17.00 on Food this month.",
        },
      }),
    }),
  },
  genAI: {},
}));

let token: string;

async function register(username: string): Promise<string> {
  const res = await request(app)
    .post("/api/auth/register")
    .send({ username, password: "Password1!" });
  return res.body.token;
}

function auth(t: string) {
  return { Authorization: `Bearer ${t}` };
}

beforeAll(async () => {
  await setupTestDb();
});

beforeEach(async () => {
  await clearTables();
  token = await register("alice");
});

afterAll(async () => {
  await closePool();
});

// ─── POST /api/ai/chat ────────────────────────────────────────────────────────

describe("POST /api/ai/chat", () => {
  it("returns 401 without a token", async () => {
    const res = await request(app)
      .post("/api/ai/chat")
      .send({ message: "How much did I spend?" });

    expect(res.status).toBe(401);
  });

  it("returns 400 when message is missing", async () => {
    const res = await request(app)
      .post("/api/ai/chat")
      .set(auth(token))
      .send({});

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
  });

  it("returns a reply string for a valid message (200)", async () => {
    const res = await request(app)
      .post("/api/ai/chat")
      .set(auth(token))
      .send({ message: "How much did I spend on food?" });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("reply");
    expect(typeof res.body.reply).toBe("string");
    expect(res.body.reply.length).toBeGreaterThan(0);
  });

  it("accepts optional chat history alongside the message", async () => {
    const res = await request(app)
      .post("/api/ai/chat")
      .set(auth(token))
      .send({
        message: "What about last month?",
        history: [
          { role: "user", content: "How much did I spend on food?" },
          { role: "assistant", content: "You spent $17.00 on Food." },
        ],
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("reply");
  });
});

// ─── GET /api/ai/prompts/analysis ────────────────────────────────────────────

describe("GET /api/ai/prompts/analysis", () => {
  it("returns 401 without a token", async () => {
    const res = await request(app).get("/api/ai/prompts/analysis");
    expect(res.status).toBe(401);
  });

  it("returns the analysis prompt string (200)", async () => {
    const res = await request(app)
      .get("/api/ai/prompts/analysis")
      .set(auth(token));

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("prompt");
    expect(typeof res.body.prompt).toBe("string");
  });
});
