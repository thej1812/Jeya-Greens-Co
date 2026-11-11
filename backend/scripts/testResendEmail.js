import dotenv from "dotenv"
dotenv.config()

import { Resend } from "resend"

async function main() {
  console.log("=== Testing Resend Email API ===")

  const apiKey = process.env.RESEND_API_KEY?.trim()
  const receiver = process.env.CONTACT_RECEIVER_EMAIL?.trim()
  const sender =
    process.env.CONTACT_SENDER_EMAIL?.trim() ||
    "Jeya Greens & Co. <onboarding@resend.dev>"

  if (!apiKey) {
    console.error("❌ RESEND_API_KEY is not set in backend/.env.")
    console.error("   Please add RESEND_API_KEY=re_... to backend/.env and re-run.")
    process.exit(1)
  }

  if (!receiver) {
    console.error("❌ CONTACT_RECEIVER_EMAIL is not set in backend/.env.")
    process.exit(1)
  }

  console.log(`📡 Using Sender:   ${sender}`)
  console.log(`📬 Target Receiver: ${receiver}`)
  console.log(`🔑 API Key:         ${apiKey.slice(0, 5)}...${apiKey.slice(-4)}`)

  const resend = new Resend(apiKey)

  try {
    const { data, error } = await resend.emails.send({
      from: sender,
      to: [receiver],
      replyTo: "Customer Test <customer.test@example.com>",
      subject: "Jeya Greens Test: Resend Integration Verification",
      text: "This is a verification test email sent from the Jeya Greens backend via the Resend HTTPS API.",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; border-radius: 8px; border: 1px solid #ddd; background: #fdffe2;">
          <h2 style="color: #007b5f;">Jeya Greens &amp; Co. - Resend Test</h2>
          <p>This email confirms that the <strong>Resend HTTPS REST API</strong> is working properly.</p>
          <p>Outbound email delivery is unblocked on Render Free web services!</p>
          <hr style="border: 0; border-top: 1px solid #ccc; margin: 15px 0;">
          <small style="color: #666;">Sent at: ${new Date().toISOString()}</small>
        </div>
      `,
    })

    if (error) {
      console.error("❌ Resend API Error:", error.message || error)
      if (
        error.message?.includes("testing emails to your own email") ||
        error.message?.includes("can only send testing emails")
      ) {
        console.warn("\n⚠️  FREE ACCOUNT LIMITATION:")
        console.warn(
          "   When using onboarding@resend.dev, Resend ONLY allows sending to your own signup email address.",
        )
        console.warn(
          `   Make sure CONTACT_RECEIVER_EMAIL matches the email address you signed up with at resend.com!`,
        )
      }
      process.exit(1)
    }

    console.log("✅ Email successfully accepted by Resend!")
    console.log("🆔 Message ID:", data.id)
    console.log("\nCheck your inbox at:", receiver)
  } catch (err) {
    console.error("❌ Unexpected Error:", err.message || err)
    process.exit(1)
  }
}

main()
