import Order, { IOrder } from "../models/order.model";
import User from "../models/user.model";
import Product from "../models/product.model";

export class OrderServiceError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = "OrderServiceError";
    this.statusCode = statusCode;
  }
}

type OrderItemPayload = {
  productId: string;
  quantity: number;
  price: number;
  unit: "kg" | "g" | "pcs";
};

export interface CreateOrderPayload {
  userId: string;
  items: OrderItemPayload[];
  address: string;
  phoneNumber: string;
  expectedDeliveryDate: Date;
  status?: "pending" | "shipped" | "in-transit" | "delivered";
}

export interface UpdateOrderPayload {
  items?: OrderItemPayload[];
  address?: string;
  phoneNumber?: string;
  expectedDeliveryDate?: Date;
  status?: "pending" | "shipped" | "in-transit" | "delivered";
}

export interface OrderListQuery {
  page: number;
  limit: number;
  sort?: string;
  userId?: string;
  status?: "pending" | "shipped" | "in-transit" | "delivered";
}

const parseSort = (sort?: string): Record<string, 1 | -1> => {
  if (!sort) return { createdAt: -1 };
  const [field, direction = "desc"] = sort.split(":");
  const allowedFields = new Set(["createdAt", "updatedAt", "expectedDeliveryDate"]);
  if (!allowedFields.has(field)) return { createdAt: -1 };
  return { [field]: direction.toLowerCase() === "asc" ? 1 : -1 };
};

const ensureUserExists = async (userId: string): Promise<void> => {
  const userExists = await User.exists({ _id: userId });
  if (!userExists) throw new OrderServiceError("User not found", 404);
};

const ensureProductsExist = async (items: OrderItemPayload[]): Promise<void> => {
  const productIds = [...new Set(items.map((item) => item.productId))];
  const count = await Product.countDocuments({ _id: { $in: productIds } });
  if (count !== productIds.length) {
    throw new OrderServiceError("One or more products were not found", 404);
  }
};

const calculateTotalAmount = (items: OrderItemPayload[]): number =>
  items.reduce((acc, item) => acc + item.price * item.quantity, 0);

export const OrderService = {
  async listOrders(query: OrderListQuery): Promise<{
    orders: IOrder[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }> {
    const { page, limit, sort, userId, status } = query;
    const skip = (page - 1) * limit;
    const filter: Record<string, unknown> = {};
    if (userId) filter.userId = userId;
    if (status) filter.status = status;

    const [orders, total] = await Promise.all([
      Order.find(filter).sort(parseSort(sort)).skip(skip).limit(limit),
      Order.countDocuments(filter),
    ]);

    return {
      orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  },

  async getOrderById(orderId: string): Promise<IOrder | null> {
    return Order.findById(orderId);
  },

  async createOrder(payload: CreateOrderPayload): Promise<IOrder> {
    await ensureUserExists(payload.userId);
    await ensureProductsExist(payload.items);

    return Order.create({
      ...payload,
      totalAmount: calculateTotalAmount(payload.items),
    });
  },

  async replaceOrder(orderId: string, payload: CreateOrderPayload): Promise<IOrder | null> {
    await ensureUserExists(payload.userId);
    await ensureProductsExist(payload.items);

    return Order.findByIdAndUpdate(
      orderId,
      { ...payload, totalAmount: calculateTotalAmount(payload.items) },
      {
        new: true,
        runValidators: true,
        overwrite: true,
      }
    );
  },

  async updateOrder(orderId: string, payload: UpdateOrderPayload): Promise<IOrder | null> {
    const updatePayload: Record<string, unknown> = { ...payload };

    if (payload.items) {
      await ensureProductsExist(payload.items);
      updatePayload.totalAmount = calculateTotalAmount(payload.items);
    }

    return Order.findByIdAndUpdate(orderId, updatePayload, {
      new: true,
      runValidators: true,
    });
  },

  async deleteOrder(orderId: string): Promise<IOrder | null> {
    return Order.findByIdAndDelete(orderId);
  },
};
