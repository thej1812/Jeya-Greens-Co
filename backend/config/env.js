import dotenv from "dotenv"

dotenv.config({ quiet: true })

const REQUIRED = [
  "JWT_SECRET",
  "ADMIN_USERNAME",
  "ADMIN_PASSWORD",
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET",
]

/**
 * Validates environment variables.
 * Only variable names are printed in error messages, never values.
 */
export function assertEnv() {
  if (process.env.NODE_ENV === "test") return

  const hasMongo = Boolean(process.env.MONGODB_URI?.trim() || process.env.MONGO_URI?.trim())
  const missing = REQUIRED.filter((key) => !process.env[key]?.trim())
  if (!hasMongo) {
    missing.unshift("MONGODB_URI")
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}. ` +
        "Copy .env.example to .env and fill them in.",
    )
  }
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    throw new Error("JWT_SECRET must be at least 32 characters long.")
  }
}

const PRODUCTION_ORIGINS = ["https://jeya-greens-co.vercel.app"]
const LOCAL_ORIGINS = ["http://localhost:8443", "http://localhost:5173", "http://localhost:3000"]

const parseOrigins = (value) => {
  const defaults = [...PRODUCTION_ORIGINS, ...LOCAL_ORIGINS]
  if (!value) return defaults
  const parsed = value
    .split(/[,\s;]+/)
    .map((origin) => origin.trim().replace(/^["']|["']$/g, "").replace(/\/+$/, ""))
    .filter(Boolean)
  return Array.from(new Set([...PRODUCTION_ORIGINS, ...parsed, ...LOCAL_ORIGINS]))
}

export const config = {
  get isProduction() {
    return process.env.NODE_ENV === "production"
  },
  get port() {
    return Number(process.env.PORT) || 5000
  },
  get mongoUri() {
    return process.env.MONGODB_URI || process.env.MONGO_URI || "mongodb://127.0.0.1:27017/coconut"
  },
  get jwtSecret() {
    return process.env.JWT_SECRET || "development-secret-key-at-least-32-chars-long!"
  },
  get jwtExpiresIn() {
    return process.env.JWT_EXPIRES_IN || "1d"
  },
  get adminUsername() {
    return (process.env.ADMIN_USERNAME || "admin").trim().toLowerCase()
  },
  get adminPassword() {
    return process.env.ADMIN_PASSWORD || "admin123456"
  },
  get clientOrigins() {
    return parseOrigins(process.env.CLIENT_URL)
  },
  get maxImageSizeMb() {
    return Number(process.env.MAX_IMAGE_SIZE_MB) || 10
  },
  get cloudinaryFolder() {
    return process.env.CLOUDINARY_FOLDER || "jeya-greens"
  },
  // Resend HTTPS Email Configuration
  get resendApiKey() {
    return process.env.RESEND_API_KEY?.trim() || ""
  },
  get contactSenderEmail() {
    return (
      process.env.CONTACT_SENDER_EMAIL?.trim() ||
      "Jeya Greens & Co. <onboarding@resend.dev>"
    )
  },
  get contactReceiverEmail() {
    return (
      process.env.CONTACT_RECEIVER_EMAIL?.trim() ||
      process.env.SMTP_USER?.trim() ||
      ""
    )
  },
  // Legacy / fallback SMTP configuration
  get smtpHost() {
    return process.env.SMTP_HOST || "smtp.gmail.com"
  },
  get smtpPort() {
    return Number(process.env.SMTP_PORT) || 465
  },
  get smtpSecure() {
    return process.env.SMTP_SECURE === "true" || process.env.SMTP_PORT === "465"
  },
  get smtpUser() {
    return process.env.SMTP_USER?.trim() || ""
  },
  get smtpPass() {
    return process.env.SMTP_PASS?.trim() || ""
  },
  get contactTimezone() {
    return process.env.CONTACT_TIMEZONE?.trim() || "Asia/Kolkata"
  },
  get contactRateLimitMax() {
    return Number(process.env.CONTACT_RATE_LIMIT_MAX) || 5
  },
}
