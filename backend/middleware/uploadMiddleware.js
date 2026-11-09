import multer from "multer"
import { config } from "../config/env.js"
import AppError from "../utils/AppError.js"

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
])

/** Checks the file's magic bytes so a renamed non-image is rejected. */
function looksLikeImage(buffer) {
  if (!buffer || buffer.length < 12) return false
  const hex = buffer.subarray(0, 12).toString("hex")
  const ascii = buffer.subarray(0, 12).toString("latin1")
  return (
    hex.startsWith("ffd8ff") || // JPEG / JPG
    hex.startsWith("89504e470d0a1a0a") || // PNG
    (ascii.startsWith("RIFF") && ascii.slice(8, 12) === "WEBP") // WebP
  )
}

/**
 * Creates a Multer instance dynamically using the current MAX_IMAGE_SIZE_MB setting.
 * Files never touch the server's disk; they are streamed to Cloudinary from memory buffer.
 */
function createMulterUploader() {
  const maxBytes = config.maxImageSizeMb * 1024 * 1024
  return multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: maxBytes,
      files: 1,
      fields: 10,
    },
    fileFilter: (_req, file, cb) => {
      if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
        return cb(
          new AppError("Only JPG, JPEG, PNG, and WebP images are allowed.", 400),
        )
      }
      cb(null, true)
    },
  })
}

/** Parses a single optional `image` field and validates its size and content. */
export function uploadSingleImage(req, res, next) {
  const uploader = createMulterUploader()
  uploader.single("image")(req, res, (error) => {
    if (error) {
      if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
        return next(
          new AppError(
            `The uploaded image exceeds the ${config.maxImageSizeMb} MB size limit. Please upload an image under ${config.maxImageSizeMb} MB.`,
            413,
            { image: `Image must be ${config.maxImageSizeMb} MB or smaller.` },
          ),
        )
      }
      return next(error)
    }

    if (req.file && !looksLikeImage(req.file.buffer)) {
      return next(
        new AppError(
          "The uploaded file is not a valid image. Only JPG, JPEG, PNG, and WebP are supported.",
          400,
        ),
      )
    }

    next()
  })
}

/** Use after uploadSingleImage on create routes. */
export function requireImage(req, _res, next) {
  if (!req.file) {
    return next(
      new AppError("Please choose an image to upload.", 400, {
        image: "Image is required.",
      }),
    )
  }
  next()
}
