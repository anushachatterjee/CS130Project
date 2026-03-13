import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { ZodError } from "zod";
import type { Request, Response, NextFunction } from "express";
import { dashboardRouter } from "./modules/dashboard/dashboard.routes";
import { subscriptionsRouter } from "./modules/subscriptions/subscriptions.routes";
import { expensesRouter } from "./modules/expenses/expenses.routes";
import { authRouter } from "./modules/auth/auth.routes";
import { aiRouter } from "./modules/ai/ai.routes";
import { budgetsRouter } from "./modules/budgets/budgets.routes";

dotenv.config();

export const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.use("/api/auth", authRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/subscriptions", subscriptionsRouter);
app.use("/api/expenses", expensesRouter);
app.use("/api/ai", aiRouter);
app.use("/api/budgets", budgetsRouter);

// Global error handler — converts ZodErrors to 400, everything else to 500
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof ZodError) {
    res.status(400).json({ error: err.issues[0].message });
    return;
  }
  const status: number = typeof err.status === "number" ? err.status : 500;
  res.status(status).json({ error: err.message ?? "Internal server error" });
});
