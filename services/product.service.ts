import Product, { IProduct } from "../models/product.model";
import Category from "../models/category.model";

export class ProductServiceError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = "ProductServiceError";
    this.statusCode = statusCode;
  }
}

export interface CreateProductPayload {
  name: string;
  description?: string;
  images: string[];
  price: number;
  category: string;
}

export interface UpdateProductPayload {
  name?: string;
  description?: string;
  images?: string[];
  price?: number;
  category?: string;
}

export interface ProductListQuery {
  page: number;
  limit: number;
  sort?: string;
  categoryId?: string;
}

const parseSort = (sort?: string): Record<string, 1 | -1> => {
  if (!sort) return { createdAt: -1 };

  const [field, direction = "desc"] = sort.split(":");
  const allowedFields = new Set(["createdAt", "updatedAt", "name", "price"]);
  if (!allowedFields.has(field)) return { createdAt: -1 };

  return { [field]: direction.toLowerCase() === "asc" ? 1 : -1 };
};

const ensureCategoryExists = async (categoryId: string): Promise<void> => {
  const categoryExists = await Category.exists({ _id: categoryId });
  if (!categoryExists) {
    throw new ProductServiceError("Category not found", 404);
  }
};

export const ProductService = {
  async listProducts(query: ProductListQuery): Promise<{
    products: IProduct[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }> {
    const { page, limit, sort, categoryId } = query;
    const skip = (page - 1) * limit;
    const filter: Record<string, unknown> = {};

    if (categoryId) {
      filter.category = categoryId;
    }

    const [products, total] = await Promise.all([
      Product.find(filter).populate("category").sort(parseSort(sort)).skip(skip).limit(limit),
      Product.countDocuments(filter),
    ]);

    return {
      products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  },

  async getProductById(productId: string): Promise<IProduct | null> {
    return Product.findById(productId).populate("category");
  },

  async createProduct(payload: CreateProductPayload): Promise<IProduct> {
    await ensureCategoryExists(payload.category);

    const createdProduct = await Product.create(payload);
    const product = await Product.findById(createdProduct._id).populate("category");

    if (!product) {
      throw new ProductServiceError("Product not found", 404);
    }

    return product;
  },

  async replaceProduct(productId: string, payload: CreateProductPayload): Promise<IProduct | null> {
    await ensureCategoryExists(payload.category);

    return Product.findByIdAndUpdate(productId, payload, {
      new: true,
      runValidators: true,
      overwrite: true,
    }).populate("category");
  },

  async updateProduct(productId: string, payload: UpdateProductPayload): Promise<IProduct | null> {
    if (payload.category) {
      await ensureCategoryExists(payload.category);
    }

    return Product.findByIdAndUpdate(productId, payload, {
      new: true,
      runValidators: true,
    }).populate("category");
  },

  async deleteProduct(productId: string): Promise<IProduct | null> {
    return Product.findByIdAndDelete(productId);
  },
};
