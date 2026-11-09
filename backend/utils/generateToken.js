import jwt from "jsonwebtoken"
import { config } from "../config/env.js"

export default function generateToken(username) {
  return jwt.sign({ role: "admin", username }, config.jwtSecret, {
    subject: "admin",
    expiresIn: config.jwtExpiresIn,
    algorithm: "HS256",
  })
}
