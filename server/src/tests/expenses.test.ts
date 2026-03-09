/**
 * Tests for User Story 2: Manual Expense Management
 *
 * Acceptance Criteria:
 * - Users can add an expense with amount, date, category, and optional notes.
 * - Users can edit or delete existing expenses.
 * - Expense data persists after page refresh (verified via GET after POST).
 * - The system validates that expense amounts are positive and dates are valid.
 */
import request from "supertest";
import { app } from "../app";
import { setupTestDb, clearTables, closePool } from "./helpers/testDb";

let tokenA: string;
let tokenB: string;

const VALID_EXPENSE = {
  title: "Coffee",
  category: "Food",
  amount_cents: 450,
  date: "2026-03-01",
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

describe("POST /api/expenses", () => {
  it("creates an expense and returns 201 with the expense object", async () => {
    const res = await request(app)
      .post("/api/expenses")
      .set(auth(tokenA))
      .send(VALID_EXPENSE);

    expect(res.status).toBe(201);
    expect(res.body.expense).toMatchObject({
      expense_title: "Coffee",
      expense_category: "Food",
      expense_amount_cents: 450,
    });
    expect(res.body.expense).toHaveProperty("expense_id");
  });

  it("creates an expense with an optional note", async () => {
    const res = await request(app)
      .post("/api/expenses")
      .set(auth(tokenA))
      .send({ ...VALID_EXPENSE, note: "morning brew" });

    expect(res.status).toBe(201);
    expect(res.body.expense.expense_note).toBe("morning brew");
  });

  it("returns 400 for an invalid category", async () => {
    const res = await request(app)
      .post("/api/expenses")
      .set(auth(tokenA))
      .send({ ...VALID_EXPENSE, category: "Subscription" });

    expect(res.status).toBe(400);
  });

  it("returns 400 when amount_cents is zero", async () => {
    const res = await request(app)
      .post("/api/expenses")
      .set(auth(tokenA))
      .send({ ...VALID_EXPENSE, amount_cents: 0 });

    expect(res.status).toBe(400);
  });

  it("returns 400 when amount_cents is negative", async () => {
    const res = await request(app)
      .post("/api/expenses")
      .set(auth(tokenA))
      .send({ ...VALID_EXPENSE, amount_cents: -100 });

    expect(res.status).toBe(400);
  });

  it("returns 400 when date format is invalid", async () => {
    const res = await request(app)
      .post("/api/expenses")
      .set(auth(tokenA))
      .send({ ...VALID_EXPENSE, date: "03-01-2026" }); // wrong format

    expect(res.status).toBe(400);
  });

  it("returns 400 when title is missing", async () => {
    const { title: _, ...noTitle } = VALID_EXPENSE;
    const res = await request(app)
      .post("/api/expenses")
      .set(auth(tokenA))
      .send(noTitle);

    expect(res.status).toBe(400);
  });

  it("returns 401 without a token", async () => {
    const res = await request(app).post("/api/expenses").send(VALID_EXPENSE);
    expect(res.status).toBe(401);
  });
});

// ─── List ─────────────────────────────────────────────────────────────────────

describe("GET /api/expenses", () => {
  it("returns an array of expenses for the authenticated user", async () => {
    await request(app).post("/api/expenses").set(auth(tokenA)).send(VALID_EXPENSE);
    await request(app).post("/api/expenses").set(auth(tokenA)).send({ ...VALID_EXPENSE, title: "Lunch" });

    const res = await request(app).get("/api/expenses").set(auth(tokenA));

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(2);
  });

  it("does not return another user's expenses (data isolation)", async () => {
    await request(app).post("/api/expenses").set(auth(tokenA)).send(VALID_EXPENSE);

    const res = await request(app).get("/api/expenses").set(auth(tokenB));
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(0);
  });

  it("data persists — expense added then retrieved is the same", async () => {
    await request(app)
      .post("/api/expenses")
      .set(auth(tokenA))
      .send(VALID_EXPENSE);

    const res = await request(app).get("/api/expenses").set(auth(tokenA));
    expect(res.body[0].expense_title).toBe("Coffee");
    expect(res.body[0].expense_amount_cents).toBe(450);
  });
});

// ─── Get One ──────────────────────────────────────────────────────────────────

describe("GET /api/expenses/:id", () => {
  it("returns the expense by id (200)", async () => {
    const created = await request(app)
      .post("/api/expenses")
      .set(auth(tokenA))
      .send(VALID_EXPENSE);
    const id = created.body.expense.expense_id;

    const res = await request(app)
      .get(`/api/expenses/${id}`)
      .set(auth(tokenA));

    expect(res.status).toBe(200);
    expect(res.body.expense_id).toBe(id);
  });

  it("returns 404 for a non-existent id", async () => {
    const res = await request(app)
      .get("/api/expenses/00000000-0000-0000-0000-000000000000")
      .set(auth(tokenA));

    expect(res.status).toBe(404);
  });

  it("returns 404 when accessing another user's expense", async () => {
    const created = await request(app)
      .post("/api/expenses")
      .set(auth(tokenA))
      .send(VALID_EXPENSE);
    const id = created.body.expense.expense_id;

    const res = await request(app)
      .get(`/api/expenses/${id}`)
      .set(auth(tokenB));

    expect(res.status).toBe(404);
  });
});

// ─── Update ───────────────────────────────────────────────────────────────────

describe("PATCH /api/expenses/:id", () => {
  it("updates an expense and returns the updated record (200)", async () => {
    const created = await request(app)
      .post("/api/expenses")
      .set(auth(tokenA))
      .send(VALID_EXPENSE);
    const id = created.body.expense.expense_id;

    const res = await request(app)
      .patch(`/api/expenses/${id}`)
      .set(auth(tokenA))
      .send({ title: "Espresso", amount_cents: 600 });

    expect(res.status).toBe(200);
    expect(res.body.expense_title).toBe("Espresso");
    expect(res.body.expense_amount_cents).toBe(600);
  });

  it("returns 404 for a non-existent expense", async () => {
    const res = await request(app)
      .patch("/api/expenses/00000000-0000-0000-0000-000000000000")
      .set(auth(tokenA))
      .send({ title: "Ghost" });

    expect(res.status).toBe(404);
  });
});

// ─── Delete ───────────────────────────────────────────────────────────────────

describe("DELETE /api/expenses/:id", () => {
  it("deletes an expense and returns 204", async () => {
    const created = await request(app)
      .post("/api/expenses")
      .set(auth(tokenA))
      .send(VALID_EXPENSE);
    const id = created.body.expense.expense_id;

    const res = await request(app)
      .delete(`/api/expenses/${id}`)
      .set(auth(tokenA));

    expect(res.status).toBe(204);

    // Verify it's gone
    const check = await request(app)
      .get(`/api/expenses/${id}`)
      .set(auth(tokenA));
    expect(check.status).toBe(404);
  });

  it("returns 404 for a non-existent expense", async () => {
    const res = await request(app)
      .delete("/api/expenses/00000000-0000-0000-0000-000000000000")
      .set(auth(tokenA));

    expect(res.status).toBe(404);
  });
});
