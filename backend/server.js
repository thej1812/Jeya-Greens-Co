import { assertEnv, config } from "./config/env.js"
import { connectDB, disconnectDB } from "./config/db.js"
import { ensureAdminInitialized } from "./controllers/authController.js"
import { seedInitialTestimonials } from "./controllers/testimonialController.js"
import { createApp } from "./app.js"
import { verifyMailer, closeTransporter } from "./config/mailer.js"

async function start() {
  assertEnv()
  await connectDB()
  await ensureAdminInitialized()
  await seedInitialTestimonials()

  const app = createApp()
  const server = app.listen(config.port, () => {
    console.log(
      `Coconut API listening on port ${config.port} (allowed origins: ${config.clientOrigins.join(", ")})`,
    )
  })

  // Non-blocking: reports SMTP misconfiguration in the logs without delaying startup
  verifyMailer()

  const shutdown = (signal) => {
    console.log(`${signal} received, shutting down gracefully...`)
    server.close(async () => {
      closeTransporter()
      await disconnectDB()
      process.exit(0)
    })
    setTimeout(() => process.exit(1), 10_000).unref()
  }
  process.on("SIGTERM", () => shutdown("SIGTERM"))
  process.on("SIGINT", () => shutdown("SIGINT"))
}

start().catch((error) => {
  console.error("Failed to start server:", error.message)
  process.exit(1)
})
