import type { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { authCredentialsSchema } from "./auth.schemas";
import { authRepo } from "./auth.repo";

function getJwtSecret() {
  return process.env.JWT_SECRET || "dev-secret-change-in-production";
}
const SALT_ROUNDS = 10;

export const authController = {
  async register(req: Request, res: Response) {
    const parsed = authCredentialsSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0].message });
      return;
    }

    const { username, password } = parsed.data;

    const existing = await authRepo.findByUsername(username);
    if (existing) {
      res.status(409).json({ error: "Username already taken" });
      return;
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const userId = await authRepo.create(username, passwordHash);

    const token = jwt.sign({ sub: userId, username }, getJwtSecret(), {
      expiresIn: "7d",
    });

    res.status(201).json({ user_id: userId, token });
  },

  async login(req: Request, res: Response) {
    const parsed = authCredentialsSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0].message });
      return;
    }

    const { username, password } = parsed.data;

    const user = await authRepo.findByUsername(username);
    if (!user) {
      res.status(401).json({ error: "Invalid username or password" });
      return;
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      res.status(401).json({ error: "Invalid username or password" });
      return;
    }

    const token = jwt.sign({ sub: user.user_id, username }, getJwtSecret(), {
      expiresIn: "7d",
    });

    res.json({ user_id: user.user_id, token });
  },
};
