import type { Response } from "express";
import type { AuthRequest } from "../auth/middlewares/requireAuth";
import { CreateBudgetSchema, UpdateBudgetSchema, ListBudgetsQuerySchema } from "./budgets.schemas";
import { budgetsRepo } from "./repositories/budgets.repo";

export const budgetsController = {
  async create(req: AuthRequest, res: Response) {
    const dto = CreateBudgetSchema.parse(req.body);

    const budget = await budgetsRepo.create(req.userId, {
      category: dto.category,
      monthly_limit_cents: dto.monthly_limit_cents,
      budget_month: dto.budget_month,
    });

    return res.status(201).json({ budget });
  },

  async list(req: AuthRequest, res: Response) {
    const q = ListBudgetsQuerySchema.parse(req.query);
    const budgets = await budgetsRepo.listByUserWithSpent(req.userId, q.month);
    res.json(budgets);
  },

  async update(req: AuthRequest, res: Response) {
    const parsed = UpdateBudgetSchema.parse(req.body);

    const updated = await budgetsRepo.update(
      req.userId,
      req.params.id as string,
      parsed
    );

    if (!updated) {
      return res.status(404).json({ message: "Budget not found" });
    }

    res.json(updated);
  },

  async remove(req: AuthRequest, res: Response) {
    const deleted = await budgetsRepo.delete(
      req.userId,
      req.params.id as string
    );

    if (!deleted) {
      return res.status(404).json({ message: "Budget not found" });
    }

    res.status(204).send();
  },
};
