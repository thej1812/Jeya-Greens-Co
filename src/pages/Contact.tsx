import { FormEvent, useState } from "react"
import Menu from "../components/Menu"
import { sendContactEnquiry, ContactError } from "../services/api"

/* ---- Edit your real business details here ---- */
const CONTACT = {
  phone: "Add business phone number",
  email: "Add business email address",
  address: "Add business address",
  hours: "Add business hours",
  whatsapp: "https://wa.me/", // + your number
  instagram: "https://instagram.com/", // + your handle
}

type IconName =
  | "phone" | "mail" | "pin" | "clock" | "user" | "building"
  | "lines" | "whatsapp" | "instagram" | "arrow"

const PATHS: Record<IconName, React.ReactNode> = {
  phone: <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" />,
  mail: <><rect x="3" y="5" width="18" height="14" rx="1.5" /><path d="m3 7 9 6 9-6" /></>,
  pin: <><path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z" /><circle cx="12" cy="10" r="2.5" /></>,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  user: <><circle cx="12" cy="8" r="3.5" /><path d="M5 20c0-4 3-6 7-6s7 2 7 6" /></>,
  building: <><rect x="5" y="3" width="14" height="18" rx="1" /><path d="M9 7h2M13 7h2M9 11h2M13 11h2M10 21v-4h4v4" /></>,
  lines: <path d="M4 8h16M4 12h16M4 16h10" />,
  whatsapp: <><path d="M3 21l1.6-4.8A8.5 8.5 0 1 1 8 19.5z" /><path d="M9 9c0 3 3 6 6 6l1.2-1.4-2-1-1 .7c-1-.4-2-1.4-2.4-2.4l.7-1-1-2z" /></>,
  instagram: <><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.2" cy="6.8" r=".6" /></>,
  arrow: <path d="M7 17 17 7M9 7h8v8" />,
}

function Icon({ name, size = 24 }: { name: IconName; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {PATHS[name]}
    </svg>
  )
}

const INFO: { icon: IconName; label: string; value: string }[] = [
  { icon: "phone", label: "Call us", value: CONTACT.phone },
  { icon: "mail", label: "Email us", value: CONTACT.email },
  { icon: "pin", label: "Visit us", value: CONTACT.address },
  { icon: "clock", label: "Opening hours", value: CONTACT.hours },
]

const EMPTY = {
  firstName: "", lastName: "", email: "", phone: "",
  company: "", subject: "", message: "",
}

type Field = {
  name: keyof typeof EMPTY
  label: string
  placeholder: string
  icon: IconName
  type?: string
}

const FIELDS: Field[] = [
  { name: "firstName", label: "First name", placeholder: "Enter first name", icon: "user" },
  { name: "lastName", label: "Last name", placeholder: "Enter last name", icon: "user" },
  { name: "email", label: "Email", placeholder: "Enter email address", icon: "mail", type: "email" },
  { name: "phone", label: "Phone", placeholder: "Enter phone number", icon: "phone", type: "tel" },
  { name: "company", label: "Company name", placeholder: "Enter company name", icon: "building" },
  { name: "subject", label: "Subject", placeholder: "How can we help?", icon: "lines" },
]

export default function Contact() {
  const [values, setValues] = useState(EMPTY)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const onChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target
    setValues((p) => ({ ...p, [name]: value }))
    setErrors((p) => {
      if (!p[name]) return p
      const n = { ...p }
      delete n[name]
      return n
    })
    setError(null)
  }

  const validate = () => {
    const e: Record<string, string> = {}
    const v = (k: keyof typeof EMPTY) => values[k].trim()
    if (v("firstName").length < 2) e.firstName = "Please enter your first name."
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v("email")) || v("email").length > 150)
      e.email = "Please enter a valid email address."
    if (v("phone") && !/^[+\d\s()-]{7,20}$/.test(v("phone")))
      e.phone = "Please enter a valid phone number."
    if (v("subject").length < 2) e.subject = "Please tell us what this is about."
    if (v("message").length < 2) e.message = "Please write a message."
    else if (v("message").length > 3000) e.message = "Message must be 3000 characters or fewer."
    return e
  }

  const submit = async (ev: FormEvent<HTMLFormElement>) => {
    ev.preventDefault()
    if (submitting) return
    setError(null)
    setSuccess(null)

    const errs = validate()
    if (Object.keys(errs).length) {
      setErrors(errs)
      setError("Please correct the highlighted fields.")
      return
    }

    setSubmitting(true)
    try {
      // Maps this form onto the existing API shape (name / email / enquiry / message)
      const extra = [
        values.phone.trim() && `Phone: ${values.phone.trim()}`,
        values.company.trim() && `Company: ${values.company.trim()}`,
      ].filter(Boolean)

      const confirmation = await sendContactEnquiry({
        name: `${values.firstName} ${values.lastName}`.trim(),
        email: values.email.trim(),
        enquiry: values.subject.trim(),
        message: [values.message.trim(), ...extra].join("\n\n"),
      })
      setSuccess(confirmation)
      setValues(EMPTY)
    } catch (err) {
      if (err instanceof ContactError) {
        setError(err.message)
        if (err.fieldErrors) setErrors(err.fieldErrors)
      } else {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to send your message. Please try again later.",
        )
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="site-shell">
      <Menu />

      <main className="contact-page section-pad">
        <header className="contact-hero">
          <p className="contact-eyebrow">Rooted in goodness. Here for you.</p>
          <h1>Let’s grow a conversation.</h1>
          <p className="contact-sub">
            From coconut goodness to everyday questions, we’d love to hear from you.
          </p>
        </header>

        <section className="contact-card">
          {/* ---------- Left: contact information ---------- */}
          <div className="contact-info">
            <h2>Contact information</h2>
            <p className="contact-lead">
              Questions about our products, orders or partnerships? We’re here to
              help you find a little goodness.
            </p>

            <ul className="contact-list">
              {INFO.map((i) => (
                <li key={i.label}>
                  <Icon name={i.icon} />
                  <div>
                    <span>{i.label}</span>
                    <p>{i.value}</p>
                  </div>
                </li>
              ))}
            </ul>

            <p className="contact-kicker">A little closer, a little greener</p>

            <a
              className="social-card social-card--solid"
              href={CONTACT.whatsapp}
              target="_blank"
              rel="noreferrer"
            >
              <Icon name="whatsapp" size={30} />
              <div>
                <h3>WhatsApp</h3>
                <p>Product enquiries &amp; order support</p>
                <strong>Chat with us</strong>
              </div>
              <Icon name="arrow" size={22} />
            </a>

            <a
              className="social-card"
              href={CONTACT.instagram}
              target="_blank"
              rel="noreferrer"
            >
              <Icon name="instagram" size={30} />
              <div>
                <h3>Instagram</h3>
                <p>Stories, fresh updates &amp; coconut goodness</p>
                <strong>Follow along</strong>
              </div>
              <Icon name="arrow" size={22} />
            </a>
          </div>

          {/* ---------- Right: form ---------- */}
          <form className="contact-form" onSubmit={submit} noValidate>
            <h2>Send us a message</h2>
            <p className="contact-lead">
              Tell us what’s on your mind and our team will get back to you soon.
            </p>

            <div className="contact-fields">
              {FIELDS.map((f) => (
                <label key={f.name} className="field">
                  <span className="field-label">{f.label}</span>
                  <span className={`field-box${errors[f.name] ? " has-error" : ""}`}>
                    <Icon name={f.icon} size={18} />
                    <input
                      name={f.name}
                      type={f.type ?? "text"}
                      placeholder={f.placeholder}
                      value={values[f.name]}
                      onChange={onChange}
                      disabled={submitting}
                    />
                  </span>
                  {errors[f.name] && <em className="field-error">{errors[f.name]}</em>}
                </label>
              ))}
            </div>

            <label className="field">
              <span className="field-label">Message</span>
              <textarea
                className={`field-box field-area${errors.message ? " has-error" : ""}`}
                name="message"
                placeholder="Write your message here..."
                value={values.message}
                onChange={onChange}
                disabled={submitting}
              />
              {errors.message && <em className="field-error">{errors.message}</em>}
            </label>

            <div className="contact-actions">
              <button className="button button--green" type="submit" disabled={submitting}>
                {submitting ? "Sending..." : "Send Message"}
              </button>
              <small>Your details stay between us.</small>
            </div>

            {success && <p className="contact-status" role="status">{success}</p>}
            {error && <p className="contact-status contact-status--error" role="alert">{error}</p>}
          </form>
        </section>
      </main>

    
    </div>
  )
}