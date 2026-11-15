import { sendContactEmail } from "../config/mailer.js"
import AppError from "../utils/AppError.js"

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_REGEX = /^[+\d\s()-]{7,20}$/

export async function submitContact(req, res) {
  const firstName = typeof req.body?.firstName === "string" ? req.body.firstName.trim() : ""
  const lastName = typeof req.body?.lastName === "string" ? req.body.lastName.trim() : ""
  const rawName = typeof req.body?.name === "string" ? req.body.name.trim() : ""

  // Combine first and last name into customer name where required
  const combinedName = [firstName, lastName].filter(Boolean).join(" ").trim()
  const name = combinedName || rawName

  const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : ""
  const phone = typeof req.body?.phone === "string" ? req.body.phone.trim() : ""
  const company = typeof req.body?.company === "string"
    ? req.body.company.trim()
    : typeof req.body?.companyName === "string"
      ? req.body.companyName.trim()
      : ""
  const subject = typeof req.body?.subject === "string"
    ? req.body.subject.trim()
    : typeof req.body?.enquiry === "string"
      ? req.body.enquiry.trim()
      : ""
  const enquiry = subject
  const message = typeof req.body?.message === "string"
    ? req.body.message.trim()
    : typeof req.body?.description === "string"
      ? req.body.description.trim()
      : ""

  const errors = {}
  const isDedicatedContactPage = req.body?.firstName !== undefined || req.body?.subject !== undefined

  // 1. Name validation
  if (isDedicatedContactPage) {
    if (!firstName || firstName.length < 2) {
      errors.firstName = "Please enter your first name (at least 2 characters)."
    } else if (firstName.length > 50) {
      errors.firstName = "First name must be 50 characters or fewer."
    }
    if (lastName && lastName.length > 50) {
      errors.lastName = "Last name must be 50 characters or fewer."
    }
  } else {
    if (!name || name.length < 2) {
      errors.name = "Please enter your name (at least 2 characters)."
    } else if (name.length > 100) {
      errors.name = "Name must be 100 characters or fewer."
    }
  }

  // 2. Email validation
  if (!email) {
    errors.email = "Please enter your email address."
  } else if (!EMAIL_REGEX.test(email) || email.length > 150) {
    errors.email = "Please enter a valid email address."
  }

  // 3. Phone validation (optional, but validated if provided)
  if (phone && !PHONE_REGEX.test(phone)) {
    errors.phone = "Please enter a valid phone number (7 to 20 digits, symbols +, -, () allowed)."
  }

  // 4. Company validation (optional)
  if (company && company.length > 150) {
    errors.company = "Company name must be 150 characters or fewer."
  }

  // 5. Subject / Enquiry validation
  if (!subject || subject.length < 2) {
    if (isDedicatedContactPage) {
      errors.subject = "Please enter what this is about (at least 2 characters)."
    } else {
      errors.enquiry = "Please enter the enquiry topic (at least 2 characters)."
    }
  } else if (subject.length > 150) {
    if (isDedicatedContactPage) {
      errors.subject = "Subject must be 150 characters or fewer."
    } else {
      errors.enquiry = "Enquiry must be 150 characters or fewer."
    }
  }

  // 6. Message validation
  if (!message || message.length < 2) {
    errors.message = "Please provide your message (at least 2 characters)."
  } else if (message.length > 3000) {
    errors.message = "Message must be 3000 characters or fewer."
  }

  if (Object.keys(errors).length > 0) {
    throw new AppError("Please correct the highlighted fields.", 400, errors)
  }

  // Dispatch email through Resend HTTPS API
  const result = await sendContactEmail({
    name,
    firstName,
    lastName,
    email,
    phone,
    company,
    subject,
    enquiry,
    message,
  })

  if (!result || !result.accepted || result.accepted.length === 0) {
    console.error("[Contact Form] Email rejected by provider:", result?.rejected)
    throw new AppError(
      "The mail server was unable to deliver your enquiry. Please try again or reach us via WhatsApp.",
      502,
    )
  }

  res.status(200).json({
    success: true,
    message: "Thank you. We’ll be in touch soon.",
    data: {
      messageId: result.messageId || "accepted",
      accepted: result.accepted,
    },
  })
}
