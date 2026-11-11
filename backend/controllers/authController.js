import bcrypt from "bcryptjs"
import { config } from "../config/env.js"
import Admin from "../models/Admin.js"
import AppError from "../utils/AppError.js"
import generateToken from "../utils/generateToken.js"

const BCRYPT_HASH = /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/
const BCRYPT_ROUNDS = 12

let envHashPromise

export function getEnvPasswordHash() {
  if (!envHashPromise) {
    const configured = config.adminPassword
    envHashPromise = BCRYPT_HASH.test(configured)
      ? Promise.resolve(configured)
      : bcrypt.hash(configured, BCRYPT_ROUNDS)
  }
  return envHashPromise
}

/**
 * Ensures at most one admin exists in MongoDB.
 * If no admin is in MongoDB and env credentials are configured, initializes it.
 */
export async function ensureAdminInitialized() {
  try {
    const count = await Admin.countDocuments()
    if (count === 0 && config.adminUsername && config.adminPassword) {
      const hash = await getEnvPasswordHash()
      await Admin.create({
        username: config.adminUsername,
        password: hash,
      })
      console.log(`Initialized primary admin: ${config.adminUsername}`)
    }
  } catch (err) {
    console.warn("Notice: Admin check skipped (DB may not be connected yet):", err.message)
  }
}

export async function login(req, res) {
  const username = typeof req.body?.username === "string" ? req.body.username.trim().toLowerCase() : ""
  const password = typeof req.body?.password === "string" ? req.body.password : ""

  if (!username || !password) {
    throw new AppError("Username and password are required.", 400)
  }

  // Look for admin in DB first, fallback to env configuration
  let adminDoc = null
  try {
    adminDoc = await Admin.findOne({ username })
  } catch (err) {
    // DB not ready or running in test mode without Admin collection
  }

  let hashToCompare
  let validUser = false

  if (adminDoc) {
    hashToCompare = adminDoc.password
    validUser = true
  } else {
    // If not found in DB, check env admin
    hashToCompare = await getEnvPasswordHash()
    validUser = username === config.adminUsername
  }

  // Constant-time comparison
  const passwordMatches = await bcrypt.compare(password, hashToCompare)

  if (!passwordMatches || !validUser) {
    throw new AppError("Invalid username or password.", 401)
  }

  const token = generateToken(username)

  // Secure HttpOnly cookie
  res.cookie("adminToken", token, {
    httpOnly: true,
    secure: config.isProduction,
    sameSite: config.isProduction ? "none" : "lax",
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    path: "/",
  })

  res.json({
    success: true,
    message: "Logged in successfully.",
    data: {
      token,
      admin: { username },
    },
  })
}

export function getMe(req, res) {
  res.json({
    success: true,
    data: { admin: req.admin },
  })
}

export function logout(_req, res) {
  res.clearCookie("adminToken", {
    httpOnly: true,
    secure: config.isProduction,
    sameSite: config.isProduction ? "none" : "lax",
    path: "/",
  })
  res.json({ success: true, message: "Logged out successfully." })
}
