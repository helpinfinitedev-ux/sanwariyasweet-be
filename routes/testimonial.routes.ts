import { Router } from "express";
import {
  createTestimonial,
  deleteTestimonial,
  getTestimonialById,
  listTestimonials,
  replaceTestimonial,
  updateTestimonial,
} from "../controllers/testimonial.controllers";

const testimonialRouter = Router();

testimonialRouter.get("/", listTestimonials);
testimonialRouter.get("/:testimonialId", getTestimonialById);
testimonialRouter.post("/", createTestimonial);
testimonialRouter.put("/:testimonialId", replaceTestimonial);
testimonialRouter.patch("/:testimonialId", updateTestimonial);
testimonialRouter.delete("/:testimonialId", deleteTestimonial);

export default testimonialRouter;
