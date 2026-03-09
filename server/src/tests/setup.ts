/**
 * setupFiles: runs in each test worker before any module is imported.
 * Loading .env.test here ensures DATABASE_URL points to fintrack_test
 * before db.ts creates the pg Pool.
 */
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(__dirname, "../../.env.test"), override: true });
