import mongoose, { Document, Schema } from "mongoose";

export interface ITestimonial extends Document {
  rating: number;
  comment: string;
  images?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export const testimonialSchema = new Schema<ITestimonial>(
  {
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      required: true,
    },
    images: {
      type: [String],
      required: false,
      default: [],
    },
  },
  { timestamps: true }
);

const Testimonial = mongoose.model<ITestimonial>("Testimonial", testimonialSchema);
export default Testimonial;
