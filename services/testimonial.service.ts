import Testimonial, { ITestimonial } from "../models/testimonial.model";

export class TestimonialServiceError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = "TestimonialServiceError";
    this.statusCode = statusCode;
  }
}

export interface CreateTestimonialPayload {
  rating: number;
  comment: string;
  images?: string[];
}

export interface UpdateTestimonialPayload {
  rating?: number;
  comment?: string;
  images?: string[];
}

export interface TestimonialListQuery {
  page: number;
  limit: number;
  sort?: string;
}

const parseSort = (sort?: string): Record<string, 1 | -1> => {
  if (!sort) return { createdAt: -1 };
  const [field, direction = "desc"] = sort.split(":");
  const allowedFields = new Set(["createdAt", "updatedAt", "rating"]);
  if (!allowedFields.has(field)) return { createdAt: -1 };
  return { [field]: direction.toLowerCase() === "asc" ? 1 : -1 };
};

export const TestimonialService = {
  async listTestimonials(query: TestimonialListQuery): Promise<{
    testimonials: ITestimonial[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }> {
    const { page, limit, sort } = query;
    const skip = (page - 1) * limit;

    const [testimonials, total] = await Promise.all([
      Testimonial.find({}).sort(parseSort(sort)).skip(skip).limit(limit),
      Testimonial.countDocuments({}),
    ]);

    return {
      testimonials,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  },

  async getTestimonialById(testimonialId: string): Promise<ITestimonial | null> {
    return Testimonial.findById(testimonialId);
  },

  async createTestimonial(payload: CreateTestimonialPayload): Promise<ITestimonial> {
    return Testimonial.create(payload);
  },

  async replaceTestimonial(
    testimonialId: string,
    payload: CreateTestimonialPayload
  ): Promise<ITestimonial | null> {
    return Testimonial.findByIdAndUpdate(testimonialId, payload, {
      new: true,
      runValidators: true,
      overwrite: true,
    });
  },

  async updateTestimonial(
    testimonialId: string,
    payload: UpdateTestimonialPayload
  ): Promise<ITestimonial | null> {
    return Testimonial.findByIdAndUpdate(testimonialId, payload, {
      new: true,
      runValidators: true,
    });
  },

  async deleteTestimonial(testimonialId: string): Promise<ITestimonial | null> {
    return Testimonial.findByIdAndDelete(testimonialId);
  },
};
