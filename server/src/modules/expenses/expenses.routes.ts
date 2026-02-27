import { Router } from "express";
import { requireAuth } from "../auth/middlewares/requireAuth";
import { asyncHandler } from "../../shared/http/asyncHandler";
import { expensesController } from "./expenses.controller";

export const expensesRouter = Router();

expensesRouter.use(requireAuth);

expensesRouter.post("/", asyncHandler(expensesController.create));
expensesRouter.get("/", asyncHandler(expensesController.list));
expensesRouter.get("/:id", asyncHandler(expensesController.getOne));
expensesRouter.patch("/:id", asyncHandler(expensesController.update));
expensesRouter.delete("/:id", asyncHandler(expensesController.remove));
