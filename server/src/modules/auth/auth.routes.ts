import { Router } from "express";
import { asyncHandler } from "../../shared/http/asyncHandler";
import { authController } from "./auth.controller";

export const authRouter = Router();

authRouter.post("/register", asyncHandler(authController.register));
authRouter.post("/login", asyncHandler(authController.login));
