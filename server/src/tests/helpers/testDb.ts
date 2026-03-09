import { pool } from "../../db";
import fs from "fs";
import path from "path";

/**
 * Drop and recreate all tables from schema.sql.
 * Call in beforeAll of each test file.
 */
export async function setupTestDb(): Promise<void> {
  await pool.query(`
    DROP TABLE IF EXISTS expenses CASCADE;
    DROP TABLE IF EXISTS subscriptions CASCADE;
    DROP TABLE IF EXISTS budgets CASCADE;
    DROP TABLE IF EXISTS users CASCADE;
  `);
  const schema = fs.readFileSync(
    path.join(__dirname, "../../../src/schema.sql"),
    "utf-8"
  );
  await pool.query(schema);
}

/** Truncate all user-data tables between tests for isolation. */
export async function clearTables(): Promise<void> {
  await pool.query(
    "TRUNCATE TABLE expenses, subscriptions, budgets, users CASCADE"
  );
}

/** Close the pg pool — call in afterAll to let Jest exit cleanly. */
export async function closePool(): Promise<void> {
  await pool.end();
}
