import { useEffect, useRef, useState } from "react"
import BrandLogo from "./BrandLogo"

// Sections that can be highlighted in the navigation (order = page order)
const NAV_SECTION_IDS = ["products", "story", "process", "gallery", "contact"]

export default function Menu() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [navVisible, setNavVisible] = useState(true)
  const [navFilled, setNavFilled] = useState(false)
  const menuOpenRef = useRef(false)

  // Which section is currently in view (for nav highlighting)
  const [activeSection, setActiveSection] = useState<string | null>(null)

  useEffect(() => {
    menuOpenRef.current = menuOpen
    document.body.style.overflow = menuOpen ? "hidden" : ""
    if (menuOpen) {
      setNavVisible(true)
      setNavFilled(true)
    }

    return () => {
      document.body.style.overflow = ""
    }
  }, [menuOpen])

  useEffect(() => {
    let lastScrollY = window.scrollY
    let ticking = false

    const updateNavigation = () => {
      const currentScrollY = window.scrollY

      if (currentScrollY <= 24) {
        setNavVisible(true)
        setNavFilled(false)
      } else {
        setNavFilled(true)
        if (currentScrollY < lastScrollY - 4) setNavVisible(true)
        if (currentScrollY > lastScrollY + 4 && !menuOpenRef.current) {
          setNavVisible(false)
        }
      }

      lastScrollY = currentScrollY
      ticking = false
    }

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(updateNavigation)
        ticking = true
      }
    }

    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  // Scroll-spy: highlight the nav link of the section currently in view (desktop + mobile menu)
  useEffect(() => {
    let ticking = false

    const updateActiveSection = () => {
      ticking = false
      const line = window.innerHeight * 0.35
      let current: string | null = null

      for (const id of NAV_SECTION_IDS) {
        const el = document.getElementById(id)
        if (!el) continue
        const rect = el.getBoundingClientRect()
        if (rect.top <= line && rect.bottom > line) {
          current = id
          break
        }
      }

      // Reached the very bottom of the page -> contact/footer
      const atBottom =
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 4
      if (atBottom) current = "contact"

      setActiveSection((prev) => (prev === current ? prev : current))
    }

    const onScrollOrResize = () => {
      if (!ticking) {
        window.requestAnimationFrame(updateActiveSection)
        ticking = true
      }
    }

    updateActiveSection()
    const initTimer = window.setTimeout(updateActiveSection, 400)

    window.addEventListener("scroll", onScrollOrResize, { passive: true })
    window.addEventListener("resize", onScrollOrResize)
    window.addEventListener("load", onScrollOrResize)
    return () => {
      window.clearTimeout(initTimer)
      window.removeEventListener("scroll", onScrollOrResize)
      window.removeEventListener("resize", onScrollOrResize)
      window.removeEventListener("load", onScrollOrResize)
    }
  }, [])

  const closeMenu = () => setMenuOpen(false)

  // Helper: props for nav links so the active one is highlighted
  const navLink = (id: string, extraClass = "") => {
    const isActive = activeSection === id
    return {
      className: `${extraClass} ${isActive ? "is-active" : ""}`.trim() || undefined,
      "aria-current": isActive ? ("true" as const) : undefined,
    }
  }

  return (
    <header
      className={`nav ${navVisible ? "nav--visible" : "nav--hidden"} ${
        navFilled ? "nav--filled" : ""
      } ${menuOpen ? "nav--menu-open" : ""}`}
    >
      <BrandLogo />
      <nav className="desktop-nav" aria-label="Primary navigation">
        <a href="/our-product" {...navLink("products")}>Product</a>
        <a href="/about-us" {...navLink("story")}>About Us</a>

        <a href="/gallery" {...navLink("gallery")}>Gallery</a>
                <a href="/reviews" {...navLink("reviews")}>Testimonials</a>
        <a href="/faq" {...navLink("process")}>FAQ</a>


      </nav>
      <a
        href="#contact"
        {...navLink("contact", "button button--green nav-cta")}
      >
        Contact Now
      </a>
      <button
        className="menu-toggle"
        type="button"
        aria-label={menuOpen ? "Close menu" : "Open menu"}
        aria-expanded={menuOpen}
        onClick={() => setMenuOpen((open) => !open)}
      >
        <span />
        <span />
        <span />
      </button>
      <div className={`mobile-menu ${menuOpen ? "is-open" : ""}`}>
        <nav aria-label="Mobile navigation">
          <a href="/our-product" onClick={closeMenu} {...navLink("products")}>
           Product
          </a>
          <a href="/about-us" onClick={closeMenu} {...navLink("story")}>
            About Us
          </a>
          <a href="/gallery" onClick={closeMenu} {...navLink("gallery")}>
            Gallery
          </a>
          <a href="/reviews" onClick={closeMenu} {...navLink("reviews")}>
            Testimonials
          </a>

          <a href="/faq" onClick={closeMenu} {...navLink("process")}>
            FAQ
          </a>
          
          
          <a href="#contact" onClick={closeMenu} {...navLink("contact")}>
            Contact
          </a>
        </nav>
        <div className="mobile-menu-meta">
          <p>
            <strong>Jeya Greens &amp; Co.</strong>
          </p>
          <p>Natural coconut goodness, thoughtfully made.</p>
        </div>
      </div>
    </header>
  )
}