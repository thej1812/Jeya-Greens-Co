import { sendContactEmail } from "../config/nodemailer.js"
import AppError from "../utils/AppError.js"

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function submitContact(req, res) {
  // Silent bot trap: real users never see or fill the website field
  if (req.body?.website) {
    return res.status(200).json({
      success: true,
      message: "Thank you. We’ll be in touch soon.",
    })
  }

  const name = typeof req.body?.name === "string" ? req.body.name.trim() : ""
  const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : ""
  const enquiry = typeof req.body?.enquiry === "string" ? req.body.enquiry.trim() : ""
  const message = typeof req.body?.message === "string"
    ? req.body.message.trim()
    : typeof req.body?.description === "string"
      ? req.body.description.trim()
      : ""

  const errors = {}

  if (!name || name.length < 2) {
    errors.name = "Please enter your name (at least 2 characters)."
  } else if (name.length > 100) {
    errors.name = "Name must be 100 characters or fewer."
  }

  if (!email) {
    errors.email = "Please enter your email address."
  } else if (!EMAIL_REGEX.test(email) || email.length > 150) {
    errors.email = "Please enter a valid email address."
  }

  if (!enquiry || enquiry.length < 2) {
    errors.enquiry = "Please enter the enquiry topic (at least 2 characters)."
  } else if (enquiry.length > 150) {
    errors.enquiry = "Enquiry must be 150 characters or fewer."
  }

  if (!message || message.length < 2) {
    errors.message = "Please provide your message (at least 2 characters)."
  } else if (message.length > 3000) {
    errors.message = "Message must be 3000 characters or fewer."
  }

  if (Object.keys(errors).length > 0) {
    throw new AppError("Please correct the highlighted fields.", 400, errors)
  }

  const result = await sendContactEmail({ name, email, enquiry, message })

  res.status(200).json({
    success: true,
    message: "Thank you. We’ll be in touch soon.",
    data: {
      messageId: result?.messageId || "accepted",
    },
  })
}
