import { Router } from "express";
import {
  createCategory,
  deleteCategory,
  getCategoryById,
  listCategories,
  replaceCategory,
  updateCategory,
} from "../controllers/category.controllers";

const categoryRouter = Router();

categoryRouter.get("/", listCategories);
categoryRouter.get("/:categoryId", getCategoryById);
categoryRouter.post("/", createCategory);
categoryRouter.put("/:categoryId", replaceCategory);
categoryRouter.patch("/:categoryId", updateCategory);
categoryRouter.delete("/:categoryId", deleteCategory);

export default categoryRouter;
