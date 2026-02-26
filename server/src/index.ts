import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { dashboardRouter } from "./modules/dashboard/dashboard.routes";
import { subscriptionsRouter } from "./modules/subscriptions/subscriptions.routes";
import { expensesRouter } from "./modules/expenses/expenses.routes";
import { authRouter } from "./modules/auth/auth.routes";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => res.json({ ok: true }));

// Mount module routers
app.use("/api/auth", authRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/subscriptions", subscriptionsRouter);
app.use("/api/expenses", expensesRouter);

const port = Number(process.env.PORT ?? 4000);
app.listen(port, () => console.log(`API http://localhost:${port}`));
