import { Request, Response } from "express";
import { AdminService } from "../services/admin.service";

const parsePaginationNumber = (
  value: unknown,
  fallback: number,
  min: number,
  max: number
): number => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  const integer = Math.trunc(parsed);
  if (integer < min) return min;
  if (integer > max) return max;
  return integer;
};

export const adminListOrders = async (req: Request, res: Response): Promise<Response> => {
  try {
    const page = parsePaginationNumber(req.query.page, 1, 1, 100000);
    const limit = parsePaginationNumber(req.query.limit, 10, 1, 100);
    const sort = typeof req.query.sort === "string" ? req.query.sort : undefined;
    const result = await AdminService.listAllOrders({ page, limit, sort });
    return res.status(200).json({ message: "All orders fetched successfully", result });
  } catch (error) {
    console.error("Admin list orders error:", error);
    return res.status(500).json({ message: "Internal server error", result: {} });
  }
};

export const adminListProducts = async (req: Request, res: Response): Promise<Response> => {
  try {
    const page = parsePaginationNumber(req.query.page, 1, 1, 100000);
    const limit = parsePaginationNumber(req.query.limit, 10, 1, 100);
    const sort = typeof req.query.sort === "string" ? req.query.sort : undefined;
    const result = await AdminService.listAllProducts({ page, limit, sort });
    return res.status(200).json({ message: "All products fetched successfully", result });
  } catch (error) {
    console.error("Admin list products error:", error);
    return res.status(500).json({ message: "Internal server error", result: {} });
  }
};

export const adminListUsers = async (req: Request, res: Response): Promise<Response> => {
  try {
    const page = parsePaginationNumber(req.query.page, 1, 1, 100000);
    const limit = parsePaginationNumber(req.query.limit, 10, 1, 100);
    const sort = typeof req.query.sort === "string" ? req.query.sort : undefined;
    const result = await AdminService.listAllUsers({ page, limit, sort });
    return res.status(200).json({ message: "All users fetched successfully", result });
  } catch (error) {
    console.error("Admin list users error:", error);
    return res.status(500).json({ message: "Internal server error", result: {} });
  }
};
