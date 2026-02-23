import Category, { ICategory } from "../models/category.model";

export class CategoryServiceError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = "CategoryServiceError";
    this.statusCode = statusCode;
  }
}

export interface CreateCategoryPayload {
  name: string;
  description?: string;
  image?: string;
}

export interface UpdateCategoryPayload {
  name?: string;
  description?: string;
  image?: string;
}

export interface CategoryListQuery {
  page: number;
  limit: number;
  sort?: string;
}

const parseSort = (sort?: string): Record<string, 1 | -1> => {
  if (!sort) return { createdAt: -1 };

  const [field, direction = "desc"] = sort.split(":");
  const allowedFields = new Set(["createdAt", "updatedAt", "name"]);
  if (!allowedFields.has(field)) return { createdAt: -1 };

  return { [field]: direction.toLowerCase() === "asc" ? 1 : -1 };
};

const ensureCategoryNameIsUnique = async (
  name: string,
  categoryIdToExclude?: string
): Promise<void> => {
  const existingCategory = await Category.findOne({
    name,
    ...(categoryIdToExclude ? { _id: { $ne: categoryIdToExclude } } : {}),
  });

  if (existingCategory) {
    throw new CategoryServiceError("Category with this name already exists", 409);
  }
};

export const CategoryService = {
  async listCategories(query: CategoryListQuery): Promise<{
    categories: ICategory[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }> {
    const { page, limit, sort } = query;
    const skip = (page - 1) * limit;

    const [categories, total] = await Promise.all([
      Category.find({}).sort(parseSort(sort)).skip(skip).limit(limit),
      Category.countDocuments({}),
    ]);

    return {
      categories,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  },

  async getCategoryById(categoryId: string): Promise<ICategory | null> {
    return Category.findById(categoryId);
  },

  async createCategory(payload: CreateCategoryPayload): Promise<ICategory> {
    await ensureCategoryNameIsUnique(payload.name);
    return Category.create(payload);
  },

  async replaceCategory(
    categoryId: string,
    payload: CreateCategoryPayload
  ): Promise<ICategory | null> {
    await ensureCategoryNameIsUnique(payload.name, categoryId);

    return Category.findByIdAndUpdate(categoryId, payload, {
      new: true,
      runValidators: true,
      overwrite: true,
    });
  },

  async updateCategory(
    categoryId: string,
    payload: UpdateCategoryPayload
  ): Promise<ICategory | null> {
    if (payload.name) {
      await ensureCategoryNameIsUnique(payload.name, categoryId);
    }

    return Category.findByIdAndUpdate(categoryId, payload, {
      new: true,
      runValidators: true,
    });
  },

  async deleteCategory(categoryId: string): Promise<ICategory | null> {
    return Category.findByIdAndDelete(categoryId);
  },
};
