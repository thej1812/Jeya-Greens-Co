import { FormEvent, useState } from "react"
import gsap from "gsap"
import { sendContactEnquiry, ContactError } from "../services/api"
import BrandLogo from "./BrandLogo"

const A = "/assets"

export default function Footer() {
  const [, setSubmitted] = useState(false)
  const [contactValues, setContactValues] = useState({
    name: "",
    email: "",
    enquiry: "",
    message: "",
  })
  const [contactFieldErrors, setContactFieldErrors] = useState<Record<string, string>>({})
  const [contactSubmitting, setContactSubmitting] = useState(false)
  const [contactSuccess, setContactSuccess] = useState<string | null>(null)
  const [contactError, setContactError] = useState<string | null>(null)

  const handleContactChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target
    setContactValues((prev) => ({ ...prev, [name]: value }))
    if (contactFieldErrors[name]) {
      setContactFieldErrors((prev) => {
        const next = { ...prev }
        delete next[name]
        return next
      })
    }
    if (contactError) {
      setContactError(null)
    }
  }

  const validateContactForm = () => {
    const errors: Record<string, string> = {}
    const name = contactValues.name.trim()
    const email = contactValues.email.trim()
    const enquiry = contactValues.enquiry.trim()
    const message = contactValues.message.trim()

    if (!name) {
      errors.name = "Please enter your name."
    } else if (name.length < 2) {
      errors.name = "Name must be at least 2 characters."
    } else if (name.length > 100) {
      errors.name = "Name must be 100 characters or fewer."
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!email) {
      errors.email = "Please enter your email address."
    } else if (!emailRegex.test(email) || email.length > 150) {
      errors.email = "Please enter a valid email address."
    }

    if (!enquiry) {
      errors.enquiry = "Please enter an enquiry topic."
    } else if (enquiry.length < 2) {
      errors.enquiry = "Enquiry must be at least 2 characters."
    } else if (enquiry.length > 150) {
      errors.enquiry = "Enquiry must be 150 characters or fewer."
    }

    if (!message) {
      errors.message = "Please provide your message."
    } else if (message.length < 2) {
      errors.message = "Message must be at least 2 characters."
    } else if (message.length > 3000) {
      errors.message = "Message must be 3000 characters or fewer."
    }

    return errors
  }

  const submitForm = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (contactSubmitting) return

    setContactError(null)
    setContactSuccess(null)

    const form = event.currentTarget

    const errors = validateContactForm()
    if (Object.keys(errors).length > 0) {
      setContactFieldErrors(errors)
      setContactError("Please correct the highlighted fields.")
      return
    }

    setContactFieldErrors({})
    setContactSubmitting(true)

    try {
      const confirmation = await sendContactEnquiry({
        name: contactValues.name.trim(),
        email: contactValues.email.trim(),
        enquiry: contactValues.enquiry.trim(),
        message: contactValues.message.trim(),
      })
      setContactSuccess(confirmation)
      setContactValues({ name: "", email: "", enquiry: "", message: "" })
      setSubmitted(true)
      form.reset()
      gsap.fromTo(
        ".form-success",
        { y: 8, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.35,
        },
      )
    } catch (err) {
      if (err instanceof ContactError) {
        setContactError(err.message)
        if (err.fieldErrors && Object.keys(err.fieldErrors).length > 0) {
          setContactFieldErrors(err.fieldErrors)
        }
      } else if (err instanceof Error) {
        setContactError(err.message)
      } else {
        setContactError("Failed to send your message. Please try again later.")
      }
    } finally {
      setContactSubmitting(false)
    }
  }

  const errorStyle = (field: string) =>
    contactFieldErrors[field]
      ? { borderColor: "#f87171", outline: "1px solid #f87171" }
      : undefined

  const errorText = (field: string) =>
    contactFieldErrors[field] && (
      <span
        style={{
          color: "#ffd2cc",
          fontSize: "13px",
          marginTop: "6px",
          display: "block",
        }}
      >
        {contactFieldErrors[field]}
      </span>
    )

  return (
    <footer id="contact" className="footer section-pad">
      <div className="footer-top">
        <div>
          <BrandLogo light />
          <form onSubmit={submitForm} noValidate>
            <h2>Contact us</h2>

            <div>
              <input
                name="name"
                placeholder="Name"
                aria-label="Name"
                value={contactValues.name}
                onChange={handleContactChange}
                disabled={contactSubmitting}
                style={errorStyle("name")}
              />
              {errorText("name")}
            </div>

            <div>
              <input
                type="email"
                name="email"
                placeholder="Email"
                aria-label="Email"
                value={contactValues.email}
                onChange={handleContactChange}
                disabled={contactSubmitting}
                style={errorStyle("email")}
              />
              {errorText("email")}
            </div>

            <div>
              <input
                name="enquiry"
                placeholder="Enquire"
                aria-label="Enquiry"
                value={contactValues.enquiry}
                onChange={handleContactChange}
                disabled={contactSubmitting}
                style={errorStyle("enquiry")}
              />
              {errorText("enquiry")}
            </div>

            <div>
              <textarea
                name="message"
                placeholder="Message"
                aria-label="Message"
                value={contactValues.message}
                onChange={handleContactChange}
                disabled={contactSubmitting}
                style={errorStyle("message")}
              />
              {errorText("message")}
            </div>

            <button
              className="button button--cream"
              type="submit"
              disabled={contactSubmitting}
            >
              {contactSubmitting ? "Sending..." : "Send Message"}
            </button>
            {contactSuccess && (
              <p className="form-success" role="status">
                {contactSuccess}
              </p>
            )}
            {contactError && (
              <p
                className="form-error"
                role="alert"
                style={{
                  color: "#ffd2cc",
                  fontSize: "14px",
                  marginTop: "6px",
                  lineHeight: "1.4",
                }}
              >
                {contactError}
              </p>
            )}
          </form>
        </div>
        <div className="footer-links">
          <div>
            <strong>Quick Links</strong>
            <a href="/our-products">Products</a>
            <a href="/about-us">About Us</a>
            <a href="/gallery">Gallery</a>
            <a href="/reviews">Testimonials</a>
            <a href="/faq">FAQ</a>
            
          </div>
          <div>
            <strong>Links</strong>
            <a href="#contact">Location</a>
            <a href="#contact">Whatsapp</a>
            <a href="#contact">Instagram</a>
          </div>
        </div>
        <img
          className="footer-bottles"
          src={`${A}/9ea99.png`}
          alt="Two bottles of golden coconut oil"
        />
      </div>
      <div className="footer-bottom">
        <p>Copyright 2026 — JEYA GREENS &amp; CO.</p>
        <p>
          <a href="#top">Terms of services</a>
          <a href="#top">Privacy Policy</a>
        </p>
      </div>
    </footer>
  )
}