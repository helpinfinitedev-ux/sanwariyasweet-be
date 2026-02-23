import Cart, { ICart } from "../models/cart.model";
import User from "../models/user.model";
import Product from "../models/product.model";

export class CartServiceError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = "CartServiceError";
    this.statusCode = statusCode;
  }
}

type CartItemPayload = {
  productId: string;
  quantity: number;
  price: number;
  unit: "kg" | "g" | "pcs";
};

export interface CreateCartPayload {
  userId: string;
  items: CartItemPayload[];
}

export interface UpdateCartPayload {
  items?: CartItemPayload[];
}

export interface CartListQuery {
  page: number;
  limit: number;
  sort?: string;
  userId?: string;
}

const parseSort = (sort?: string): Record<string, 1 | -1> => {
  if (!sort) return { createdAt: -1 };
  const [field, direction = "desc"] = sort.split(":");
  const allowedFields = new Set(["createdAt", "updatedAt"]);
  if (!allowedFields.has(field)) return { createdAt: -1 };
  return { [field]: direction.toLowerCase() === "asc" ? 1 : -1 };
};

const ensureUserExists = async (userId: string): Promise<void> => {
  const userExists = await User.exists({ _id: userId });
  if (!userExists) throw new CartServiceError("User not found", 404);
};

const ensureProductsExist = async (items: CartItemPayload[]): Promise<void> => {
  const productIds = [...new Set(items.map((item) => item.productId))];
  const count = await Product.countDocuments({ _id: { $in: productIds } });
  if (count !== productIds.length) {
    throw new CartServiceError("One or more products were not found", 404);
  }
};

export const CartService = {
  async listCarts(query: CartListQuery): Promise<{
    carts: ICart[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }> {
    const { page, limit, sort, userId } = query;
    const skip = (page - 1) * limit;
    const filter: Record<string, unknown> = {};
    if (userId) filter.userId = userId;

    const [carts, total] = await Promise.all([
      Cart.find(filter).sort(parseSort(sort)).skip(skip).limit(limit),
      Cart.countDocuments(filter),
    ]);

    return {
      carts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  },

  async getCartById(cartId: string): Promise<ICart | null> {
    return Cart.findById(cartId);
  },

  async createCart(payload: CreateCartPayload): Promise<ICart> {
    await ensureUserExists(payload.userId);
    await ensureProductsExist(payload.items);

    const existing = await Cart.findOne({ userId: payload.userId });
    if (existing) {
      throw new CartServiceError("Cart already exists for this user", 409);
    }

    return Cart.create(payload);
  },

  async replaceCart(cartId: string, payload: CreateCartPayload): Promise<ICart | null> {
    await ensureUserExists(payload.userId);
    await ensureProductsExist(payload.items);

    const anotherCartForUser = await Cart.findOne({
      userId: payload.userId,
      _id: { $ne: cartId },
    });
    if (anotherCartForUser) {
      throw new CartServiceError("Cart already exists for this user", 409);
    }

    return Cart.findByIdAndUpdate(cartId, payload, {
      new: true,
      runValidators: true,
      overwrite: true,
    });
  },

  async updateCart(cartId: string, payload: UpdateCartPayload): Promise<ICart | null> {
    if (payload.items) await ensureProductsExist(payload.items);

    return Cart.findByIdAndUpdate(cartId, payload, {
      new: true,
      runValidators: true,
    });
  },

  async deleteCart(cartId: string): Promise<ICart | null> {
    return Cart.findByIdAndDelete(cartId);
  },
};
