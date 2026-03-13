import { Router } from "express";
import { requireAuth } from "../auth/middlewares/requireAuth";
import { asyncHandler } from "../../shared/http/asyncHandler";
import { budgetsController } from "./budgets.controller";

export const budgetsRouter = Router();

budgetsRouter.use(requireAuth);

budgetsRouter.post("/", asyncHandler(budgetsController.create));
budgetsRouter.get("/", asyncHandler(budgetsController.list));
budgetsRouter.patch("/:id", asyncHandler(budgetsController.update));
budgetsRouter.delete("/:id", asyncHandler(budgetsController.remove));
