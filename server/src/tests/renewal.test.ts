/**
 * Tests for subscription renewal business logic (renewal.service.ts)
 *
 * Covers:
 * - Next renewal date calculation for all billing cycles
 * - renewSubscription: creates expense + advances renewal date
 * - processRenewals: only processes due subscriptions (active/trial, past due date)
 * - Canceled subscriptions are NOT renewed
 */
import request from "supertest";
import { app } from "../app";
import { setupTestDb, clearTables, closePool } from "./helpers/testDb";
import { renewalService } from "../modules/subscriptions/services/renewal.service";
import { pool } from "../db";

let token: string;
let userId: string;

async function register(username: string) {
  const res = await request(app)
    .post("/api/auth/register")
    .send({ username, password: "Password1!" });
  return res.body;
}

function auth(t: string) {
  return { Authorization: `Bearer ${t}` };
}

function today(): string {
  return new Date().toISOString().split("T")[0];
}

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split("T")[0];
}

beforeAll(async () => {
  await setupTestDb();
});

beforeEach(async () => {
  await clearTables();
  const body = await register("alice");
  token = body.token;
  userId = body.user_id;
});

afterAll(async () => {
  await closePool();
});

// ─── Date calculation (pure logic, no DB needed) ──────────────────────────────

describe("calculateNextRenewalDate", () => {
  // Use noon UTC to avoid midnight boundary issues across timezones
  const base = new Date("2026-01-15T12:00:00Z");

  function localDate(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }

  it("weekly: adds 7 days", () => {
    const next = renewalService.calculateNextRenewalDate(base, "weekly");
    expect(localDate(next)).toBe("2026-01-22");
  });

  it("bi-weekly: adds 14 days", () => {
    const next = renewalService.calculateNextRenewalDate(base, "bi-weekly");
    expect(localDate(next)).toBe("2026-01-29");
  });

  it("monthly: adds 1 month", () => {
    const next = renewalService.calculateNextRenewalDate(base, "monthly");
    expect(localDate(next)).toBe("2026-02-15");
  });

  it("quarterly: adds 3 months", () => {
    const next = renewalService.calculateNextRenewalDate(base, "quarterly");
    expect(localDate(next)).toBe("2026-04-15");
  });

  it("yearly: adds 1 year", () => {
    const next = renewalService.calculateNextRenewalDate(base, "yearly");
    expect(next.toISOString().split("T")[0]).toBe("2027-01-15");
  });

  it("throws for unknown billing cycle", () => {
    expect(() =>
      renewalService.calculateNextRenewalDate(base, "daily")
    ).toThrow("Unsupported billing cycle");
  });
});

// ─── renewSubscription ────────────────────────────────────────────────────────

describe("renewSubscription", () => {
  it("creates an expense with the correct amount and title", async () => {
    // Create a subscription due yesterday
    const createRes = await request(app)
      .post("/api/subscriptions")
      .set(auth(token))
      .send({
        subscription_title: "Netflix",
        subscription_category: "Entertainment",
        subscription_amount: 15.99,
        billing_cycle: "monthly",
        next_renewal_date: daysAgo(1),
        subscription_status: "active",
      });
    const sub = createRes.body;

    // Fetch the raw subscription row for renewSubscription
    const { rows } = await pool.query(
      "SELECT * FROM subscriptions WHERE subscription_id = $1",
      [sub.subscription_id]
    );
    await renewalService.renewSubscription(rows[0]);

    // Verify expense was created
    const expensesRes = await request(app)
      .get("/api/expenses")
      .set(auth(token));
    const renewal = expensesRes.body.find((e: any) =>
      e.expense_title.includes("Netflix")
    );

    expect(renewal).toBeDefined();
    expect(renewal.expense_amount_cents).toBe(1599); // $15.99
    expect(renewal.expense_title).toContain("Subscription Renewal");
  });

  it("advances the renewal date by one billing cycle", async () => {
    const pastDate = daysAgo(1);
    const createRes = await request(app)
      .post("/api/subscriptions")
      .set(auth(token))
      .send({
        subscription_title: "Spotify",
        subscription_category: "Entertainment",
        subscription_amount: 9.99,
        billing_cycle: "monthly",
        next_renewal_date: pastDate,
        subscription_status: "active",
      });
    const sub = createRes.body;

    const { rows } = await pool.query(
      "SELECT * FROM subscriptions WHERE subscription_id = $1",
      [sub.subscription_id]
    );
    await renewalService.renewSubscription(rows[0]);

    // Check updated renewal date in DB — verify it advanced by ~1 month
    const { rows: updated } = await pool.query(
      "SELECT next_renewal_date FROM subscriptions WHERE subscription_id = $1",
      [sub.subscription_id]
    );
    const newDate = new Date(updated[0].next_renewal_date);
    const oldDate = new Date(pastDate);
    const diffDays = Math.round(
      (newDate.getTime() - oldDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    // Monthly = 28–31 days depending on the month
    expect(diffDays).toBeGreaterThanOrEqual(28);
    expect(diffDays).toBeLessThanOrEqual(31);
  });
});

// ─── processRenewals ──────────────────────────────────────────────────────────

describe("processRenewals", () => {
  it("processes only active/trial subscriptions that are past due", async () => {
    // Due yesterday (active) — should be renewed
    await request(app).post("/api/subscriptions").set(auth(token)).send({
      subscription_title: "Due Active",
      subscription_category: "Entertainment",
      subscription_amount: 10.0,
      billing_cycle: "monthly",
      next_renewal_date: daysAgo(1),
      subscription_status: "active",
    });

    // Due yesterday (trial) — should also be renewed
    await request(app).post("/api/subscriptions").set(auth(token)).send({
      subscription_title: "Due Trial",
      subscription_category: "Entertainment",
      subscription_amount: 5.0,
      billing_cycle: "monthly",
      next_renewal_date: daysAgo(1),
      subscription_status: "trial",
    });

    // Due yesterday (canceled) — should NOT be renewed
    await request(app).post("/api/subscriptions").set(auth(token)).send({
      subscription_title: "Canceled",
      subscription_category: "Entertainment",
      subscription_amount: 8.0,
      billing_cycle: "monthly",
      next_renewal_date: daysAgo(1),
      subscription_status: "canceled",
    });

    // Renewal in the future (active) — should NOT be renewed yet
    await request(app).post("/api/subscriptions").set(auth(token)).send({
      subscription_title: "Future",
      subscription_category: "Entertainment",
      subscription_amount: 12.0,
      billing_cycle: "monthly",
      next_renewal_date: "2099-12-31",
      subscription_status: "active",
    });

    const result = await renewalService.processRenewals();

    expect(result.processed).toBe(2); // active + trial
    expect(result.failed).toBe(0);

    // Verify 2 expenses created (one per renewal)
    const expensesRes = await request(app)
      .get("/api/expenses")
      .set(auth(token));
    expect(expensesRes.body.length).toBe(2);
  });

  it("canceled subscriptions do not appear in active renewal reminders", async () => {
    await request(app).post("/api/subscriptions").set(auth(token)).send({
      subscription_title: "Old Sub",
      subscription_category: "Entertainment",
      subscription_amount: 8.0,
      billing_cycle: "monthly",
      next_renewal_date: daysAgo(1),
      subscription_status: "canceled",
    });

    const result = await renewalService.processRenewals();
    expect(result.processed).toBe(0);

    const expensesRes = await request(app)
      .get("/api/expenses")
      .set(auth(token));
    expect(expensesRes.body.length).toBe(0);
  });
});
