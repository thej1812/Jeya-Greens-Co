import { Router } from "express"
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../controllers/categoryController.js"
import { protect } from "../middleware/authMiddleware.js"
import { validateObjectId } from "../middleware/errorMiddleware.js"

const router = Router()

router
  .route("/")
  .get(getCategories)
  .post(protect, createCategory)

router
  .route("/:id")
  .all(validateObjectId)
  .put(protect, updateCategory)
  .delete(protect, deleteCategory)

export default router

