import { Router } from "express"
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../controllers/productController.js"
import { protect } from "../middleware/authMiddleware.js"
import { uploadSingleImage, requireImage } from "../middleware/uploadMiddleware.js"
import { validateObjectId } from "../middleware/errorMiddleware.js"

const router = Router()

router
  .route("/")
  .get(getProducts)
  .post(protect, uploadSingleImage, requireImage, createProduct)

router
  .route("/:id")
  .all(validateObjectId)
  .get(getProductById)
  .put(protect, uploadSingleImage, updateProduct)
  .delete(protect, deleteProduct)

export default router
