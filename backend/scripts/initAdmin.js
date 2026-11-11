/**
 * One-time admin account initializer.
 * Ensures that only ONE administrator can ever exist.
 *
 * Usage:
 *   node scripts/initAdmin.js <username> <password>
 * or (using values configured in .env):
 *   npm run init-admin
 */
import bcrypt from "bcryptjs"
import { assertEnv, config } from "../config/env.js"
import { connectDB, disconnectDB } from "../config/db.js"
import Admin from "../models/Admin.js"

const args = process.argv.slice(2)
const username = (args[0] || config.adminUsername || "").trim().toLowerCase()
const password = args[1] || config.adminPassword || ""

if (!username || !password) {
  console.error("Error: Admin username and password must be provided via arguments or .env")
  console.error("Usage: node scripts/initAdmin.js <username> <password>")
  process.exit(1)
}

if (password.length < 8) {
  console.error("Error: Password must be at least 8 characters long.")
  process.exit(1)
}

try {
  assertEnv()
  await connectDB()

  const existingCount = await Admin.countDocuments()
  if (existingCount > 0) {
    const existing = await Admin.findOne()
    console.warn(`Admin already exists (username: "${existing.username}").`)
    console.warn("Multiple administrators are prohibited. Script exiting without changes.")
    process.exit(0)
  }

  const hashedPassword = await bcrypt.hash(password, 12)
  await Admin.create({
    username,
    password: hashedPassword,
  })

  console.log(`Administrator "${username}" created successfully!`)
} catch (error) {
  console.error("Failed to initialize admin:", error.message)
  process.exitCode = 1
} finally {
  await disconnectDB()
}

