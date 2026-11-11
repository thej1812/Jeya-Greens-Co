/**
 * Prints a bcrypt hash to use as ADMIN_PASSWORD, so the plain-text password
 * never has to be stored in .env or on Render.
 *
 *   npm run hash-password -- "your-strong-password"
 */
import bcrypt from "bcryptjs"

const password = process.argv[2]
if (!password) {
  console.error('Usage: npm run hash-password -- "your-strong-password"')
  process.exit(1)
}
if (password.length < 8) {
  console.error("Use a password of at least 8 characters.")
  process.exit(1)
}

console.log(await bcrypt.hash(password, 12))
