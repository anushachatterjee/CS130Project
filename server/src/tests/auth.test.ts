/**
 * Tests for User Story 1: Account Registration and Login
 *
 * Acceptance Criteria:
 * - Users can sign up and log in using a username and password.
 * - Unauthenticated users cannot access any dashboard pages.
 * - Logged-in users can only view and modify their own data.
 */
import request from "supertest";
import { app } from "../app";
import { setupTestDb, clearTables, closePool } from "./helpers/testDb";

beforeAll(async () => {
  await setupTestDb();
});

beforeEach(async () => {
  await clearTables();
});

afterAll(async () => {
  await closePool();
});

// ─── Registration ────────────────────────────────────────────────────────────

describe("POST /api/auth/register", () => {
  it("registers a new user and returns a token (201)", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ username: "alice", password: "Password1!" });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("token");
    expect(res.body).toHaveProperty("user_id");
  });

  it("returns 409 when username is already taken", async () => {
    await request(app)
      .post("/api/auth/register")
      .send({ username: "alice", password: "Password1!" });

    const res = await request(app)
      .post("/api/auth/register")
      .send({ username: "alice", password: "DifferentPass1!" });

    expect(res.status).toBe(409);
    expect(res.body).toHaveProperty("error");
  });

  it("returns 400 when username is missing", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ password: "Password1!" });

    expect(res.status).toBe(400);
  });

  it("returns 400 when password is missing", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ username: "alice" });

    expect(res.status).toBe(400);
  });
});

// ─── Login ───────────────────────────────────────────────────────────────────

describe("POST /api/auth/login", () => {
  beforeEach(async () => {
    await request(app)
      .post("/api/auth/register")
      .send({ username: "alice", password: "Password1!" });
  });

  it("logs in with correct credentials and returns a token (200)", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ username: "alice", password: "Password1!" });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("token");
    expect(res.body).toHaveProperty("user_id");
  });

  it("returns 401 for wrong password", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ username: "alice", password: "WrongPass!" });

    expect(res.status).toBe(401);
  });

  it("returns 401 for unknown username", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ username: "nobody", password: "Password1!" });

    expect(res.status).toBe(401);
  });

  it("returns 400 when body is empty", async () => {
    const res = await request(app).post("/api/auth/login").send({});

    expect(res.status).toBe(400);
  });
});

// ─── Auth middleware ──────────────────────────────────────────────────────────

describe("Auth middleware", () => {
  it("returns 401 when Authorization header is missing", async () => {
    const res = await request(app).get("/api/expenses");
    expect(res.status).toBe(401);
  });

  it("returns 401 when token is invalid", async () => {
    const res = await request(app)
      .get("/api/expenses")
      .set("Authorization", "Bearer this-is-not-a-valid-token");
    expect(res.status).toBe(401);
  });

  it("grants access with a valid token", async () => {
    const reg = await request(app)
      .post("/api/auth/register")
      .send({ username: "bob", password: "Password1!" });

    const res = await request(app)
      .get("/api/expenses")
      .set("Authorization", `Bearer ${reg.body.token}`);

    expect(res.status).toBe(200);
  });
});
