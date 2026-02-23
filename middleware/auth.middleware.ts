import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../lib/jwt";

type AuthUser = {
  id?: string;
  role?: "admin" | "customer" | "deliveryPartner";
};

type RequestWithUser = Request & { user?: AuthUser };

const unauthorized = (res: Response, message: string): Response =>
  res.status(401).json({ message, result: {} });

const forbidden = (res: Response, message: string): Response =>
  res.status(403).json({ message, result: {} });

export const requireAuth = (req: Request, res: Response, next: NextFunction): Response | void => {
  try {
    const authorization = req.headers.authorization;
    if (!authorization || !authorization.startsWith("Bearer ")) {
      return unauthorized(res, "Unauthorized");
    }

    const token = authorization.slice(7).trim();
    if (!token) return unauthorized(res, "Unauthorized");

    const decoded = verifyToken(token) as AuthUser;
    (req as RequestWithUser).user = decoded;
    return next();
  } catch {
    return unauthorized(res, "Unauthorized");
  }
};

export const requireAdmin = (req: Request, res: Response, next: NextFunction): Response | void => {
  const user = (req as RequestWithUser).user;
  if (!user || user.role !== "admin") {
    return forbidden(res, "Admin access required");
  }
  return next();
};
