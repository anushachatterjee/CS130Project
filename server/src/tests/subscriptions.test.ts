/**
 * Tests for User Story 4: Subscription and Recurring Transaction Management
 *
 * Acceptance Criteria:
 * - Users can add recurring transactions with name, amount, billing cycle, and next renewal date.
 * - Users can mark recurring items as trial, active, or canceled.
 * - The system displays upcoming renewals.
 * - Canceled subscriptions do not appear in active renewal reminders.
 */
import request from "supertest";
import { app } from "../app";
import { setupTestDb, clearTables, closePool } from "./helpers/testDb";

let tokenA: string;
let tokenB: string;

const VALID_SUBSCRIPTION = {
  subscription_title: "Netflix",
  subscription_category: "Entertainment",
  subscription_amount: 15.99,
  billing_cycle: "monthly",
  next_renewal_date: "2026-04-01",
  subscription_status: "active",
};

async function register(username: string): Promise<string> {
  const res = await request(app)
    .post("/api/auth/register")
    .send({ username, password: "Password1!" });
  return res.body.token;
}

function auth(token: string) {
  return { Authorization: `Bearer ${token}` };
}

beforeAll(async () => {
  await setupTestDb();
});

beforeEach(async () => {
  await clearTables();
  tokenA = await register("alice");
  tokenB = await register("bob");
});

afterAll(async () => {
  await closePool();
});

// ─── Create ───────────────────────────────────────────────────────────────────

describe("POST /api/subscriptions", () => {
  it("creates a subscription and returns 201", async () => {
    const res = await request(app)
      .post("/api/subscriptions")
      .set(auth(tokenA))
      .send(VALID_SUBSCRIPTION);

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("subscription_id");
    expect(res.body.subscription_title).toBe("Netflix");
    expect(res.body.subscription_status).toBe("active");
  });

  it("creates a subscription with status 'trial'", async () => {
    const res = await request(app)
      .post("/api/subscriptions")
      .set(auth(tokenA))
      .send({ ...VALID_SUBSCRIPTION, subscription_status: "trial" });

    expect(res.status).toBe(201);
    expect(res.body.subscription_status).toBe("trial");
  });

  it("creates a subscription with status 'canceled'", async () => {
    const res = await request(app)
      .post("/api/subscriptions")
      .set(auth(tokenA))
      .send({ ...VALID_SUBSCRIPTION, subscription_status: "canceled" });

    expect(res.status).toBe(201);
    expect(res.body.subscription_status).toBe("canceled");
  });

  it("returns 400 when required fields are missing", async () => {
    const res = await request(app)
      .post("/api/subscriptions")
      .set(auth(tokenA))
      .send({ subscription_title: "Netflix" }); // missing most fields

    expect(res.status).toBe(400);
  });

  it("returns 401 without a token", async () => {
    const res = await request(app)
      .post("/api/subscriptions")
      .send(VALID_SUBSCRIPTION);

    expect(res.status).toBe(401);
  });
});

// ─── List ─────────────────────────────────────────────────────────────────────

describe("GET /api/subscriptions", () => {
  it("returns only the authenticated user's subscriptions", async () => {
    await request(app).post("/api/subscriptions").set(auth(tokenA)).send(VALID_SUBSCRIPTION);
    await request(app).post("/api/subscriptions").set(auth(tokenA)).send({ ...VALID_SUBSCRIPTION, subscription_title: "Spotify" });

    const resA = await request(app).get("/api/subscriptions").set(auth(tokenA));
    expect(resA.status).toBe(200);
    expect(resA.body.length).toBe(2);

    // User B should see none of user A's subscriptions
    const resB = await request(app).get("/api/subscriptions").set(auth(tokenB));
    expect(resB.status).toBe(200);
    expect(resB.body.length).toBe(0);
  });

  it("returns an empty array when user has no subscriptions", async () => {
    const res = await request(app).get("/api/subscriptions").set(auth(tokenA));
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});

// ─── Update ───────────────────────────────────────────────────────────────────

describe("PUT /api/subscriptions/:id", () => {
  it("updates a subscription's status and returns the updated record", async () => {
    const created = await request(app)
      .post("/api/subscriptions")
      .set(auth(tokenA))
      .send(VALID_SUBSCRIPTION);
    const id = created.body.subscription_id;

    const res = await request(app)
      .put(`/api/subscriptions/${id}`)
      .set(auth(tokenA))
      .send({ ...VALID_SUBSCRIPTION, subscription_status: "canceled" });

    expect(res.status).toBe(200);
    expect(res.body.subscription_status).toBe("canceled");
  });

  it("returns 404 for a non-existent subscription", async () => {
    const res = await request(app)
      .put("/api/subscriptions/00000000-0000-0000-0000-000000000000")
      .set(auth(tokenA))
      .send(VALID_SUBSCRIPTION);

    expect(res.status).toBe(404);
  });
});

// ─── Delete ───────────────────────────────────────────────────────────────────

describe("DELETE /api/subscriptions/:id", () => {
  it("deletes a subscription and confirms it's gone", async () => {
    const created = await request(app)
      .post("/api/subscriptions")
      .set(auth(tokenA))
      .send(VALID_SUBSCRIPTION);
    const id = created.body.subscription_id;

    const del = await request(app)
      .delete(`/api/subscriptions/${id}`)
      .set(auth(tokenA));

    expect(del.status).toBe(200);
    expect(del.body.success).toBe(true);

    // Confirm it no longer appears in the list
    const list = await request(app).get("/api/subscriptions").set(auth(tokenA));
    expect(list.body.find((s: any) => s.subscription_id === id)).toBeUndefined();
  });

  it("returns 404 for a non-existent subscription", async () => {
    const res = await request(app)
      .delete("/api/subscriptions/00000000-0000-0000-0000-000000000000")
      .set(auth(tokenA));

    expect(res.status).toBe(404);
  });
});
