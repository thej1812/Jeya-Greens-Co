import { Router } from "express"
import rateLimit from "express-rate-limit"
import { login, getMe, logout } from "../controllers/authController.js"
import { protect } from "../middleware/authMiddleware.js"

const router = Router()

// Slows down password guessing: 10 failed attempts per 15 min per IP
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skipSuccessfulRequests: true,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many login attempts. Please try again in 15 minutes.",
  },
})

router.post("/login", loginLimiter, login)
router.get("/me", protect, getMe)
router.post("/logout", logout)

export default router
