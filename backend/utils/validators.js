import AppError from "./AppError.js"

/**
 * Reads and validates string fields from a request body.
 *
 * @param {Record<string, unknown>} body
 * @param {Record<string, { label: string, max: number }>} rules
 * @param {{ partial?: boolean }} options  partial = fields are optional (updates)
 * @returns {Record<string, string>} only the fields that were provided
 */
export function validateTextFields(body, rules, { partial = false } = {}) {
  const values = {}
  const errors = {}

  for (const [field, { label, max }] of Object.entries(rules)) {
    const raw = body?.[field]

    if (raw === undefined || raw === null) {
      if (!partial) errors[field] = `${label} is required.`
      continue
    }
    if (typeof raw !== "string") {
      errors[field] = `${label} must be text.`
      continue
    }

    const value = raw.trim().replace(/\s+/g, " ")
    if (!value) errors[field] = `${label} cannot be empty.`
    else if (value.length > max)
      errors[field] = `${label} must be ${max} characters or fewer.`
    else values[field] = value
  }

  if (Object.keys(errors).length > 0) {
    throw new AppError("Please correct the highlighted fields.", 400, errors)
  }
  return values
}
