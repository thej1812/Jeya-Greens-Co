import { Resend } from "resend"
import { config } from "./env.js"
import AppError from "../utils/AppError.js"

let resendClient = null

function getResendClient() {
  if (!config.resendApiKey) {
    return null
  }
  if (!resendClient) {
    resendClient = new Resend(config.resendApiKey)
  }
  return resendClient
}

function escapeHtml(text) {
  if (!text) return ""
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
}

/**
 * Startup status check helper.
 * Confirms whether Resend API key is configured.
 */
export async function verifyMailer() {
  if (process.env.NODE_ENV === "test") return true

  if (!config.resendApiKey) {
    console.warn(
      "[Email Service] Notice: RESEND_API_KEY is not set. Outbound contact emails will be disabled until configured.",
    )
    return false
  }

  console.log(
    `[Email Service] Resend HTTPS API configured (sender: ${config.contactSenderEmail}, receiver: ${config.contactReceiverEmail || "not set"}).`,
  )
  return true
}

/**
 * Cleanup helper for server shutdown (no-op for stateless HTTPS API).
 */
export function closeTransporter() {
  resendClient = null
}

/**
 * Sends customer contact enquiry email via Resend HTTPS REST API.
 * Never uses SMTP ports (works seamlessly on Render Free web services).
 * Sets Reply-To to the customer's email.
 */
export async function sendContactEmail({ name, email, enquiry, message }) {
  // Test environment mock
  if (
    process.env.NODE_ENV === "test" ||
    process.env.MOCK_EMAIL === "true" ||
    process.env.MOCK_SMTP === "true"
  ) {
    return {
      id: `mock-resend-${Date.now()}`,
      messageId: `mock-resend-${Date.now()}`,
      accepted: [config.contactReceiverEmail || "customer@example.com"],
    }
  }

  if (!config.resendApiKey) {
    console.error("[Email Service] Contact submission attempted but RESEND_API_KEY is missing.")
    throw new AppError(
      "The contact email service is currently unavailable. Please reach us via WhatsApp or try again later.",
      503,
    )
  }

  const receiver = config.contactReceiverEmail
  if (!receiver) {
    console.error("[Email Service] Contact submission attempted but CONTACT_RECEIVER_EMAIL is missing.")
    throw new AppError(
      "The contact form recipient is not configured. Please reach us via WhatsApp.",
      503,
    )
  }

  const client = getResendClient()
  const timestamp = new Date().toLocaleString("en-IN", {
    timeZone: config.contactTimezone || "Asia/Kolkata",
  })

  // Format sender: must be onboarding@resend.dev (for free test) or verified domain
  let sender = config.contactSenderEmail
  if (!sender.includes("<") && sender.includes("@")) {
    sender = `Jeya Greens & Co. <${sender}>`
  }

  const textContent = [
    "New Customer Enquiry via Jeya Greens Website",
    "---------------------------------------------",
    `Customer Name: ${name}`,
    `Customer Email: ${email}`,
    `Enquiry Type:  ${enquiry}`,
    `Received:      ${timestamp} IST`,
    "",
    "Message:",
    message,
    "",
    "Reply directly to this email to respond to the customer.",
  ].join("\n")

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #fdffe2;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h2 style="color: #007b5f; margin: 0; font-size: 24px;">Jeya Greens &amp; Co.</h2>
        <p style="color: #666; font-size: 13px; margin: 4px 0 0 0;">Customer Contact Submission</p>
      </div>

      <div style="background-color: #ffffff; padding: 20px; border-radius: 10px; border: 1px solid #e0e0e0; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr>
            <td style="padding: 8px 0; color: #718096; width: 130px; font-weight: bold;">Customer Name:</td>
            <td style="padding: 8px 0; color: #1a202c; font-weight: 600;">${escapeHtml(name)}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #718096; font-weight: bold;">Customer Email:</td>
            <td style="padding: 8px 0; color: #007b5f; font-weight: 600;">
              <a href="mailto:${escapeHtml(email)}" style="color: #007b5f; text-decoration: none;">${escapeHtml(email)}</a>
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #718096; font-weight: bold;">Enquiry:</td>
            <td style="padding: 8px 0; color: #1a202c;">${escapeHtml(enquiry)}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #718096; font-weight: bold;">Date &amp; Time:</td>
            <td style="padding: 8px 0; color: #4a5568;">${timestamp} IST</td>
          </tr>
        </table>

        <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #edf2f7;">
          <p style="color: #718096; font-size: 13px; font-weight: bold; margin: 0 0 8px 0;">Message / Description:</p>
          <div style="background-color: #f7fafc; padding: 14px; border-radius: 8px; color: #2d3748; line-height: 1.6; white-space: pre-wrap; font-size: 14px;">${escapeHtml(message)}</div>
        </div>
      </div>

      <div style="text-align: center; margin-top: 20px; font-size: 12px; color: #718096;">
        <p style="margin: 0;">You can reply directly to this email to respond to <strong>${escapeHtml(name)}</strong> at <strong>${escapeHtml(email)}</strong>.</p>
        <p style="margin: 6px 0 0 0;">&copy; ${new Date().getFullYear()} Jeya Greens &amp; Co.</p>
      </div>
    </div>
  `

  try {
    const { data, error } = await client.emails.send({
      from: sender,
      to: [receiver],
      replyTo: `"${name}" <${email}>`,
      reply_to: `"${name}" <${email}>`,
      subject: `New Customer Enquiry: ${enquiry} - ${name}`,
      text: textContent,
      html: htmlContent,
    })

    if (error) {
      console.error("[Resend API Error]:", error?.message || error, `(code: ${error?.statusCode || error?.name})`)

      if (
        error.message?.includes("testing emails to your own email") ||
        error.message?.includes("can only send testing emails")
      ) {
        throw new AppError(
          "Notice: In Resend free testing mode, emails can only be sent to the account owner's registered email address. Please verify your receiver email matches your Resend login or verify your custom domain in Resend.",
          502,
        )
      }

      throw new AppError(
        "The mail server was unable to deliver your enquiry. Please try again or reach us via WhatsApp.",
        502,
      )
    }

    if (!data || !data.id) {
      console.error("[Resend API Error]: Unconfirmed response without email id:", data)
      throw new AppError(
        "The mail server was unable to confirm delivery. Please try again or reach us via WhatsApp.",
        502,
      )
    }

    return {
      id: data.id,
      messageId: data.id,
      accepted: [receiver],
    }
  } catch (err) {
    if (err instanceof AppError) throw err
    console.error("[Resend Request Exception]:", err?.message || err)
    throw new AppError(
      "The mail server was unable to deliver your enquiry. Please try again or reach us via WhatsApp.",
      502,
    )
  }
}

export default {
  sendContactEmail,
  verifyMailer,
  closeTransporter,
}
