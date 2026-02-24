import { Router } from "express";
import {
  createRating,
  deleteRating,
  getRatingById,
  listRatings,
  replaceRating,
  updateRating,
} from "../controllers/rating.controllers";

const ratingRouter = Router();

ratingRouter.get("/", listRatings);
ratingRouter.get("/:ratingId", getRatingById);
ratingRouter.post("/", createRating);
ratingRouter.put("/:ratingId", replaceRating);
ratingRouter.patch("/:ratingId", updateRating);
ratingRouter.delete("/:ratingId", deleteRating);

export default ratingRouter;
