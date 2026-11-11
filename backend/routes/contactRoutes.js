import { Router } from "express"
import rateLimit from "express-rate-limit"
import { submitContact } from "../controllers/contactController.js"
import { config } from "../config/env.js"

const router = Router()

// Contact form submission rate limiter: prevents spam flooding
const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: config.contactRateLimitMax,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many messages sent from this IP address. Please wait a few minutes before trying again.",
  },
})

router.post("/", contactLimiter, submitContact)

export default router

