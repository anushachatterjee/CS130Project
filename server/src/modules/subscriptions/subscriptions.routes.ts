import { Router } from "express";
import { requireAuth } from "../auth/middlewares/requireAuth";
import { asyncHandler } from "../../shared/http/asyncHandler";
import { subscriptionsController } from "./subscriptions.controller";

export const subscriptionsRouter = Router();

subscriptionsRouter.use(requireAuth);

subscriptionsRouter.get("/", asyncHandler(subscriptionsController.list));
subscriptionsRouter.post("/", asyncHandler(subscriptionsController.create));
subscriptionsRouter.put("/:id", asyncHandler(subscriptionsController.update));
subscriptionsRouter.delete("/:id", asyncHandler(subscriptionsController.remove));
