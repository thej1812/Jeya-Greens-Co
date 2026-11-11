import jwt from "jsonwebtoken"
import { config } from "../config/env.js"
import AppError from "../utils/AppError.js"

/**
 * Requires a valid admin JWT, provided either via the secure `adminToken` HttpOnly cookie
 * or the `Authorization: Bearer <token>` header.
 */
export function protect(req, _res, next) {
  let token = null

  // 1. Check HttpOnly cookie first
  if (req.cookies && req.cookies.adminToken) {
    token = req.cookies.adminToken
  }

  // 2. Fall back to Authorization header
  if (!token && req.headers?.authorization) {
    const parts = req.headers.authorization.split(" ")
    if (parts[0] === "Bearer" && parts[1]) {
      token = parts[1]
    }
  }

  if (!token) {
    return next(new AppError("Not authorized. Please log in.", 401))
  }

  try {
    const payload = jwt.verify(token, config.jwtSecret, {
      algorithms: ["HS256"],
    })

    if (payload.role !== "admin") {
      return next(new AppError("Not authorized. Admin access required.", 403))
    }

    req.admin = { username: payload.username }
    next()
  } catch (error) {
    const message =
      error?.name === "TokenExpiredError"
        ? "Your session has expired. Please log in again."
        : "Not authorized. Please log in."
    next(new AppError(message, 401))
  }
}
