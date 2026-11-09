import dns from "node:dns"
import nodemailer from "nodemailer"
import { config } from "./env.js"
import AppError from "../utils/AppError.js"

// Prefer IPv4 for outbound SMTP connections to avoid IPv6 timeouts
try {
  dns.setDefaultResultOrder("ipv4first")
} catch {}

let transporterInstance = null

export function getTransporter() {
  if (!transporterInstance) {
    if (!config.smtpUser || !config.smtpPass) {
      throw new AppError("SMTP service is not configured. Missing SMTP_USER or SMTP_PASS.", 500)
    }

    transporterInstance = nodemailer.createTransport({
      host: config.smtpHost,
      port: config.smtpPort,
      secure: config.smtpSecure,
      auth: {
        user: config.smtpUser,
        pass: config.smtpPass.replace(/\s+/g, ""),
      },
      connectionTimeout: 15000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
    })
  }

  return transporterInstance
}

/**
 * Non-blocking startup verification helper.
 * Tests connection to the SMTP provider and logs the status.
 */
export async function verifyMailer() {
  if (process.env.NODE_ENV === "test" || process.env.MOCK_SMTP === "true") {
    return true
  }
  try {
    const transporter = getTransporter()
    await transporter.verify()
    console.log("[SMTP] Connection verified successfully (Gmail SMTP).")
    return true
  } catch (err) {
    console.warn("[SMTP] Verification note:", err?.message || err)
    return false
  }
}

/**
 * Closes the active transporter on server shutdown.
 */
export function closeTransporter() {
  if (transporterInstance) {
    try {
      transporterInstance.close()
    } catch {}
    transporterInstance = null
  }
}

/**
 * Sends a customer contact enquiry email to the website administrator.
 * Configures the customer's email as `Reply-To`.
 */
export async function sendContactEmail({ name, email, enquiry, message }) {
  if (process.env.NODE_ENV === "test" && process.env.MOCK_SMTP === "true") {
    return {
      messageId: `mock-email-${Date.now()}`,
      accepted: [config.contactReceiverEmail || "test@example.com"],
      response: "250 Mock Email OK",
    }
  }

  const transporter = getTransporter()
  const timestamp = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })

  const mailOptions = {
    from: `"Jeya Greens & Co. Contact" <${config.contactSenderEmail}>`,
    to: config.contactReceiverEmail,
    replyTo: `"${name}" <${email}>`,
    subject: `New Customer Enquiry: ${enquiry} - ${name}`,
    text: `New Customer Enquiry via Jeya Greens Website\n\nName: ${name}\nEmail: ${email}\nEnquiry Type: ${enquiry}\n\nMessage:\n${message}\n\nReceived: ${timestamp} IST\nReply directly to this email to respond to the customer.`,
    html: `
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
            <div style="background-color: #f7fafc; padding: 14px; border-radius: 8px; color: #2d3748; line-height: 1.6; white-space: pre-wrap; font-size: 14px;">
${escapeHtml(message)}
            </div>
          </div>
        </div>

        <div style="text-align: center; margin-top: 20px; font-size: 12px; color: #718096;">
          <p style="margin: 0;">You can reply directly to this email to respond to <strong>${escapeHtml(name)}</strong> at <strong>${escapeHtml(email)}</strong>.</p>
          <p style="margin: 6px 0 0 0;">&copy; ${new Date().getFullYear()} Jeya Greens &amp; Co.</p>
        </div>
      </div>
    `,
  }

  try {
    return await transporter.sendMail(mailOptions)
  } catch (err) {
    console.error("Nodemailer sendMail failed:", err?.message || err)
    throw new AppError("Failed to send your message. Please try again later.", 502)
  }
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

export default {
  getTransporter,
  sendContactEmail,
  verifyMailer,
  closeTransporter,
}

