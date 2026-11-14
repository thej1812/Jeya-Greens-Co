import express from "express"
import cors from "cors"
import helmet from "helmet"
import mongoose from "mongoose"
import { config } from "./config/env.js"
import { cookieParser } from "./middleware/cookieParser.js"
import AppError from "./utils/AppError.js"
import authRoutes from "./routes/authRoutes.js"
import productRoutes from "./routes/productRoutes.js"
import galleryRoutes from "./routes/galleryRoutes.js"
import dashboardRoutes from "./routes/dashboardRoutes.js"
import contactRoutes from "./routes/contactRoutes.js"
import categoryRoutes from "./routes/categoryRoutes.js"
import testimonialRoutes from "./routes/testimonialRoutes.js"
import { notFound, errorHandler } from "./middleware/errorMiddleware.js"

export function createApp() {
  const app = express()

  // Reverse proxy support (Render, Vercel, Railway) for accurate client IPs in rate limiters
  app.set("trust proxy", 1)
  app.disable("x-powered-by")

  // HTTP security headers
  app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }))

  // CORS configuration
  app.use(
    cors({
      origin(origin, callback) {
        // Allow requests without Origin (curl, server-to-server, health checks)
        if (!origin) return callback(null, true)

        const normalizedOrigin = origin.trim().replace(/\/+$/, "")

        const isAllowed =
          config.clientOrigins.includes(normalizedOrigin) ||
          normalizedOrigin === "https://jeya-greens-co.vercel.app" ||
          /^https:\/\/jeya-greens-co(-[a-z0-9-]+)?\.vercel\.app$/i.test(normalizedOrigin) ||
          (!config.isProduction && /^http:\/\/localhost(:\d+)?$/.test(normalizedOrigin))

        if (isAllowed) {
          return callback(null, true)
        }
        callback(new AppError(`Origin ${origin} not allowed by CORS.`, 403))
      },
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
      exposedHeaders: ["Set-Cookie"],
      maxAge: 600,
      optionsSuccessStatus: 204,
    }),
  )

  app.use(cookieParser)
  app.use(express.json({ limit: "100kb" }))

  // Public health check (supports both /api/health and /health)
  app.get(["/api/health", "/health"], (_req, res) => {
    res.json({
      success: true,
      data: {
        status: "ok",
        uptime: process.uptime(),
        database: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
      },
    })
  })

  // API endpoints (mounted under both /api and root fallback for client resilience)
  app.use(["/api/auth", "/auth"], authRoutes)
  app.use(["/api/products", "/products"], productRoutes)
  app.use(["/api/gallery", "/gallery"], galleryRoutes)
  app.use(["/api/admin", "/admin"], dashboardRoutes)
  app.use(["/api/contact", "/contact"], contactRoutes)
  app.use(["/api/categories", "/categories"], categoryRoutes)
  app.use(["/api/testimonials", "/testimonials"], testimonialRoutes)

  // 404 & Global error handlers
  app.use(notFound)
  app.use(errorHandler)

  return app
}
