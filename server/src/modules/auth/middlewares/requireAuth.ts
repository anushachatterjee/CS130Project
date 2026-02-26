import type { Response, NextFunction } from "express";
import type * as express from "express";
import jwt from "jsonwebtoken";

function getJwtSecret() {
  return process.env.JWT_SECRET || "dev-secret-change-in-production";
}

export interface AuthRequest extends express.Request {
  userId: string;
}

export function requireAuth(
  req: express.Request,
  res: Response,
  next: NextFunction
) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing or invalid authorization header" });
    return;
  }

  const token = header.slice(7);

  try {
    const payload = jwt.verify(token, getJwtSecret()) as { sub: string };
    (req as AuthRequest).userId = payload.sub;
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}
