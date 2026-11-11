import { Router } from "express"
import {
  getGalleryItems,
  getGalleryItemById,
  createGalleryItem,
  updateGalleryItem,
  deleteGalleryItem,
} from "../controllers/galleryController.js"
import { protect } from "../middleware/authMiddleware.js"
import { uploadSingleImage, requireImage } from "../middleware/uploadMiddleware.js"
import { validateObjectId } from "../middleware/errorMiddleware.js"

const router = Router()

router
  .route("/")
  .get(getGalleryItems)
  .post(protect, uploadSingleImage, requireImage, createGalleryItem)

router
  .route("/:id")
  .all(validateObjectId)
  .get(getGalleryItemById)
  .put(protect, uploadSingleImage, updateGalleryItem)
  .delete(protect, deleteGalleryItem)

export default router
