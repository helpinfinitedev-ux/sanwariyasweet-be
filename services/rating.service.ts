import Rating, { IRating } from "../models/rating.model";
import User from "../models/user.model";
import Product from "../models/product.model";

export class RatingServiceError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = "RatingServiceError";
    this.statusCode = statusCode;
  }
}

export interface CreateRatingPayload {
  userId: string;
  productId: string;
  rating: number;
  comment?: string;
}

export interface UpdateRatingPayload {
  rating?: number;
  comment?: string;
}

export interface RatingListQuery {
  page: number;
  limit: number;
  sort?: string;
  userId?: string;
  productId?: string;
}

const parseSort = (sort?: string): Record<string, 1 | -1> => {
  if (!sort) return { createdAt: -1 };
  const [field, direction = "desc"] = sort.split(":");
  const allowedFields = new Set(["createdAt", "updatedAt", "rating"]);
  if (!allowedFields.has(field)) return { createdAt: -1 };
  return { [field]: direction.toLowerCase() === "asc" ? 1 : -1 };
};

const ensureUserExists = async (userId: string): Promise<void> => {
  const userExists = await User.exists({ _id: userId });
  if (!userExists) throw new RatingServiceError("User not found", 404);
};

const ensureProductExists = async (productId: string): Promise<void> => {
  const productExists = await Product.exists({ _id: productId });
  if (!productExists) throw new RatingServiceError("Product not found", 404);
};

export const RatingService = {
  async listRatings(query: RatingListQuery): Promise<{
    ratings: IRating[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }> {
    const { page, limit, sort, userId, productId } = query;
    const skip = (page - 1) * limit;
    const filter: Record<string, unknown> = {};
    if (userId) filter.userId = userId;
    if (productId) filter.productId = productId;

    const [ratings, total] = await Promise.all([
      Rating.find(filter).sort(parseSort(sort)).skip(skip).limit(limit),
      Rating.countDocuments(filter),
    ]);

    return {
      ratings,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  },

  async getRatingById(ratingId: string): Promise<IRating | null> {
    return Rating.findById(ratingId);
  },

  async createRating(payload: CreateRatingPayload): Promise<IRating> {
    await ensureUserExists(payload.userId);
    await ensureProductExists(payload.productId);
    return Rating.create(payload);
  },

  async replaceRating(ratingId: string, payload: CreateRatingPayload): Promise<IRating | null> {
    await ensureUserExists(payload.userId);
    await ensureProductExists(payload.productId);

    return Rating.findByIdAndUpdate(ratingId, payload, {
      new: true,
      runValidators: true,
      overwrite: true,
    });
  },

  async updateRating(ratingId: string, payload: UpdateRatingPayload): Promise<IRating | null> {
    return Rating.findByIdAndUpdate(ratingId, payload, {
      new: true,
      runValidators: true,
    });
  },

  async deleteRating(ratingId: string): Promise<IRating | null> {
    return Rating.findByIdAndDelete(ratingId);
  },
};
