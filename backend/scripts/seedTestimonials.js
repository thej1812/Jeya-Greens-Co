/**
 * Standalone migration script to safely and idempotently seed initial testimonials into MongoDB.
 *
 *   node scripts/seedTestimonials.js
 */
import { assertEnv } from "../config/env.js"
import { connectDB, disconnectDB } from "../config/db.js"
import { seedInitialTestimonials } from "../controllers/testimonialController.js"

try {
  assertEnv()
  await connectDB()
  console.log("Connected to MongoDB. Running testimonial migration...")
  await seedInitialTestimonials()
  console.log("Testimonial migration completed successfully.")
} catch (error) {
  console.error("Testimonial migration failed:", error.message)
  process.exitCode = 1
} finally {
  await disconnectDB()
}

