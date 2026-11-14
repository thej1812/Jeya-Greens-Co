import { Router } from "express"
import {
  getTestimonials,
  getTestimonialById,
  createTestimonial,
  updateTestimonial,
  deleteTestimonial,
} from "../controllers/testimonialController.js"
import { protect } from "../middleware/authMiddleware.js"
import { validateObjectId } from "../middleware/errorMiddleware.js"

const router = Router()

router
  .route("/")
  .get(getTestimonials)
  .post(protect, createTestimonial)

router
  .route("/:id")
  .all(validateObjectId)
  .get(getTestimonialById)
  .put(protect, updateTestimonial)
  .delete(protect, deleteTestimonial)

export default router

