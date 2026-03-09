/**
 * Tests for User Story 5: Spending Insights and Visualization
 *
 * Acceptance Criteria:
 * - The dashboard displays monthly spending trends.
 * - The dashboard shows spending breakdowns by category.
 * - High-cost recurring expenses are visually highlighted (data provided).
 */
import request from "supertest";
import { app } from "../app";
import { setupTestDb, clearTables, closePool } from "./helpers/testDb";

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

// Get current month in YYYY-MM format
function currentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

// Get today's date in YYYY-MM-DD format
function today(): string {
  return new Date().toISOString().split("T")[0];
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

// ─── Summary structure ────────────────────────────────────────────────────────

describe("GET /api/dashboard/summary", () => {
  it("returns 401 without a token", async () => {
    const res = await request(app).get("/api/dashboard/summary");
    expect(res.status).toBe(401);
  });

  it("returns the correct response shape with an empty account", async () => {
    const res = await request(app)
      .get("/api/dashboard/summary")
      .set(auth(token));

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("totalSpending");
    expect(res.body).toHaveProperty("categorySpending");
    expect(res.body).toHaveProperty("budgetUsage");
    expect(res.body).toHaveProperty("upcomingRenewals");
    expect(res.body).toHaveProperty("currentMonth");
    expect(Array.isArray(res.body.categorySpending)).toBe(true);
    expect(Array.isArray(res.body.upcomingRenewals)).toBe(true);
  });

  it("totalSpending is 0 when user has no expenses", async () => {
    const res = await request(app)
      .get("/api/dashboard/summary")
      .set(auth(token));

    expect(res.status).toBe(200);
    expect(res.body.totalSpending).toBe(0);
  });

  it("totalSpending reflects current-month expenses in dollars", async () => {
    // Add two expenses this month
    await request(app).post("/api/expenses").set(auth(token)).send({
      title: "Coffee",
      category: "Food",
      amount_cents: 500,
      date: today(),
    });
    await request(app).post("/api/expenses").set(auth(token)).send({
      title: "Bus",
      category: "Transportation",
      amount_cents: 300,
      date: today(),
    });

    const res = await request(app)
      .get("/api/dashboard/summary")
      .set(auth(token));

    expect(res.status).toBe(200);
    // 500 + 300 = 800 cents = $8.00
    expect(res.body.totalSpending).toBeCloseTo(8.0);
  });

  it("categorySpending groups expenses by category", async () => {
    await request(app).post("/api/expenses").set(auth(token)).send({
      title: "Coffee",
      category: "Food",
      amount_cents: 500,
      date: today(),
    });
    await request(app).post("/api/expenses").set(auth(token)).send({
      title: "Lunch",
      category: "Food",
      amount_cents: 1200,
      date: today(),
    });
    await request(app).post("/api/expenses").set(auth(token)).send({
      title: "Bus",
      category: "Transportation",
      amount_cents: 300,
      date: today(),
    });

    const res = await request(app)
      .get("/api/dashboard/summary")
      .set(auth(token));

    const food = res.body.categorySpending.find(
      (c: any) => c.category === "Food"
    );
    const transport = res.body.categorySpending.find(
      (c: any) => c.category === "Transportation"
    );

    expect(food).toBeDefined();
    expect(food.amount).toBeCloseTo(17.0); // 500 + 1200 = 1700 cents = $17
    expect(transport).toBeDefined();
    expect(transport.amount).toBeCloseTo(3.0);
  });

  it("upcomingRenewals includes active subscriptions", async () => {
    await request(app).post("/api/subscriptions").set(auth(token)).send({
      subscription_title: "Netflix",
      subscription_category: "Entertainment",
      subscription_amount: 15.99,
      billing_cycle: "monthly",
      next_renewal_date: today(),
      subscription_status: "active",
    });

    const res = await request(app)
      .get("/api/dashboard/summary")
      .set(auth(token));

    expect(res.body.upcomingRenewals.length).toBeGreaterThan(0);
    expect(res.body.upcomingRenewals[0].title).toBe("Netflix");
  });

  it("currentMonth matches YYYY-MM format", async () => {
    const res = await request(app)
      .get("/api/dashboard/summary")
      .set(auth(token));

    expect(res.body.currentMonth).toBe(currentMonth());
    expect(res.body.currentMonth).toMatch(/^\d{4}-(0[1-9]|1[0-2])$/);
  });
});
