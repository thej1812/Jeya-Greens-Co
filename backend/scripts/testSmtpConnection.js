/**
 * SMTP Connection & Verification Test Script.
 * Verifies Gmail SMTP transporter and sends ONE test email if authentication succeeds.
 * Never prints passwords or credentials to the console.
 */
import dns from "node:dns"
import nodemailer from "nodemailer"
import dotenv from "dotenv"

// Prioritize IPv4 over IPv6 to prevent Windows DNS/timeout issues when IPv6 is unrouted
dns.setDefaultResultOrder("ipv4first")

dotenv.config({ quiet: true })

const host = process.env.SMTP_HOST || "smtp.gmail.com"
const port = Number(process.env.SMTP_PORT) || 465
const secure = process.env.SMTP_SECURE === "true" || port === 465
const user = process.env.SMTP_USER?.trim()
const pass = process.env.SMTP_PASS?.trim()
const senderEmail = process.env.CONTACT_SENDER_EMAIL?.trim() || user
const receiverEmail = process.env.CONTACT_RECEIVER_EMAIL?.trim() || user

async function verifyAndTest() {
  console.log("==================================================")
  console.log("GMAIL SMTP INTEGRATION TEST")
  console.log("==================================================")

  console.log("\n[1/3] Checking SMTP Environment Configuration...")
  console.log(`- SMTP_HOST: ${host}`)
  console.log(`- SMTP_PORT: ${port}`)
  console.log(`- SMTP_SECURE: ${secure}`)
  console.log(`- SMTP_USER: ${user ? `${user.slice(0, 3)}***@${user.split("@")[1] || ""}` : "MISSING"}`)
  console.log(`- SMTP_PASS configured: ${Boolean(pass)} (${pass ? `${pass.length} chars` : "MISSING"})`)
  console.log(`- CONTACT_SENDER_EMAIL: ${senderEmail}`)
  console.log(`- CONTACT_RECEIVER_EMAIL: ${receiverEmail}`)

  if (!user || !pass) {
    throw new Error("Missing SMTP_USER or SMTP_PASS in backend/.env")
  }

  // Create Nodemailer Transporter
  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass: pass.replace(/\s+/g, ""), // Support both spaced and unspaced app passwords
    },
    connectionTimeout: 15000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  })

  // Step 2: transporter.verify()
  console.log("\n[2/3] Verifying SMTP Connection with transporter.verify()...")
  try {
    const verified = await transporter.verify()
    console.log("SUCCESS: Gmail SMTP connection and authentication verified successfully!", verified)
  } catch (verifyError) {
    console.error("FAILED: transporter.verify() encountered an error.")
    console.error(`Error Code: ${verifyError.code || "N/A"}`)
    console.error(`Error Message: ${verifyError.message}`)
    if (verifyError.response) {
      console.error(`SMTP Response: ${verifyError.response}`)
    }
    throw verifyError
  }

  // Step 3: Send ONE test email to CONTACT_RECEIVER_EMAIL
  console.log("\n[3/3] Sending single test email to CONTACT_RECEIVER_EMAIL...")
  const timestamp = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })

  const mailOptions = {
    from: `"Jeya Greens & Co." <${senderEmail}>`,
    to: receiverEmail,
    subject: "Jeya Greens - SMTP Integration Test",
    text: `Jeya Greens - SMTP Integration Test\n\nThis is an automated test email confirming that the Gmail SMTP service is properly configured and operational.\n\nTimestamp: ${timestamp} IST\nStatus: Verified\n`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e0e0e0; border-radius: 12px; background-color: #fdffe2;">
        <h2 style="color: #007b5f; margin-top: 0;">Jeya Greens &amp; Co.</h2>
        <h3 style="color: #343434;">SMTP Integration Test</h3>
        <p style="color: #555; line-height: 1.6;">
          This is an automated verification email confirming that your Gmail SMTP credentials are functioning correctly and able to dispatch customer enquiry notifications.
        </p>
        <div style="background-color: #ffffff; padding: 16px; border-radius: 8px; border-left: 4px solid #007b5f; margin: 20px 0;">
          <p style="margin: 4px 0;"><strong>Status:</strong> Connected &amp; Authenticated</p>
          <p style="margin: 4px 0;"><strong>Recipient:</strong> ${receiverEmail}</p>
          <p style="margin: 4px 0;"><strong>Sent At:</strong> ${timestamp} IST</p>
        </div>
        <p style="font-size: 12px; color: #888;">
          &copy; ${new Date().getFullYear()} Jeya Greens &amp; Co. All rights reserved.
        </p>
      </div>
    `,
  }

  const sendResult = await transporter.sendMail(mailOptions)
  console.log("SUCCESS: Test email accepted by SMTP server!")
  console.log(`- Message ID: ${sendResult.messageId}`)
  console.log(`- Accepted Recipients: ${JSON.stringify(sendResult.accepted)}`)
  console.log(`- Rejected Recipients: ${JSON.stringify(sendResult.rejected)}`)
  console.log(`- Server Response: ${sendResult.response}`)

  console.log("\n==================================================")
  console.log("SMTP INTEGRATION TEST COMPLETED SUCCESSFULLY")
  console.log("==================================================")
}

verifyAndTest().catch((err) => {
  console.error("\nTEST TERMINATED WITH ERROR:", err.message)
  process.exitCode = 1
})
