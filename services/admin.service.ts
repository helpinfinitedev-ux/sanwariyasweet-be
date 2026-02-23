import Order from "../models/order.model";
import Product from "../models/product.model";
import User, { IUser } from "../models/user.model";
import { IOrder } from "../models/order.model";
import { IProduct } from "../models/product.model";

export interface AdminListQuery {
  page: number;
  limit: number;
  sort?: string;
}

const parseSort = (sort: string | undefined, allowedFields: string[]): Record<string, 1 | -1> => {
  if (!sort) return { createdAt: -1 };
  const [field, direction = "desc"] = sort.split(":");
  if (!allowedFields.includes(field)) return { createdAt: -1 };
  return { [field]: direction.toLowerCase() === "asc" ? 1 : -1 };
};

const paginate = async <T>(
  modelQuery: Promise<T[]>,
  countQuery: Promise<number>,
  page: number,
  limit: number
): Promise<{ data: T[]; pagination: { page: number; limit: number; total: number; totalPages: number } }> => {
  const [data, total] = await Promise.all([modelQuery, countQuery]);
  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  };
};

export const AdminService = {
  async listAllOrders(query: AdminListQuery): Promise<{
    orders: IOrder[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }> {
    const { page, limit, sort } = query;
    const skip = (page - 1) * limit;
    const result = await paginate<IOrder>(
      Order.find({})
        .sort(parseSort(sort, ["createdAt", "updatedAt", "expectedDeliveryDate"]))
        .skip(skip)
        .limit(limit),
      Order.countDocuments({}),
      page,
      limit
    );
    return { orders: result.data, pagination: result.pagination };
  },

  async listAllProducts(query: AdminListQuery): Promise<{
    products: IProduct[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }> {
    const { page, limit, sort } = query;
    const skip = (page - 1) * limit;
    const result = await paginate<IProduct>(
      Product.find({})
        .sort(parseSort(sort, ["createdAt", "updatedAt", "name", "price"]))
        .skip(skip)
        .limit(limit),
      Product.countDocuments({}),
      page,
      limit
    );
    return { products: result.data, pagination: result.pagination };
  },

  async listAllUsers(query: AdminListQuery): Promise<{
    users: Omit<IUser, "password">[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }> {
    const { page, limit, sort } = query;
    const skip = (page - 1) * limit;
    const result = await paginate<Omit<IUser, "password">>(
      User.find({})
        .select("-password")
        .sort(parseSort(sort, ["createdAt", "updatedAt", "firstName", "phoneNumber", "orders"]))
        .populate("orders")
        .skip(skip)
        .limit(limit),
      User.countDocuments({}),
      page,
      limit
    );
    return { users: result.data, pagination: result.pagination };
  },
};
