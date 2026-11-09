import mongoose from "mongoose"
import multer from "multer"
import { config } from "../config/env.js"
import AppError from "../utils/AppError.js"

export function validateObjectId(req, _res, next) {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return next(new AppError("Invalid ID.", 400))
  }
  next()
}

export function notFound(req, _res, next) {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404))
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(error, _req, res, _next) {
  let status = 500
  let message = "Something went wrong. Please try again later."
  let errors

  if (error instanceof AppError) {
    status = error.statusCode
    message = error.message
    errors = error.errors
  } else if (error instanceof multer.MulterError) {
    status = error.code === "LIMIT_FILE_SIZE" ? 413 : 400
    message =
      error.code === "LIMIT_FILE_SIZE"
        ? `The uploaded image exceeds the ${config.maxImageSizeMb} MB size limit. Please upload an image under ${config.maxImageSizeMb} MB.`
        : error.code === "LIMIT_UNEXPECTED_FILE"
          ? 'Upload a single image using the "image" field.'
          : "Invalid upload."
  } else if (error instanceof mongoose.Error.ValidationError) {
    status = 400
    message = "Please correct the highlighted fields."
    errors = Object.fromEntries(
      Object.entries(error.errors).map(([key, value]) => [key, value.message]),
    )
  } else if (error instanceof mongoose.Error.CastError) {
    status = 400
    message = "Invalid ID."
  } else if (error?.type === "entity.parse.failed") {
    status = 400
    message = "Malformed JSON body."
  } else if (error?.type === "entity.too.large") {
    status = 413
    message = "Request body is too large."
  }

  if (status >= 500) console.error(error)

  res.status(status).json({
    success: false,
    message,
    ...(errors && { errors }),
  })
}
