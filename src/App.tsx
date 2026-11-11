import { FormEvent, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import AdminView from "./admin/AdminView"
import {
  fetchProducts,
  fetchGallery,
  sendContactEnquiry,
  ContactError,
  ProductItem,
  GalleryItem,
} from "./services/api"

gsap.registerPlugin(ScrollTrigger)

// Stops the pinned hero from refreshing/jumping when the mobile address bar shows/hides
ScrollTrigger.config({ ignoreMobileResize: true })

const A = "/assets"

// Sections that can be highlighted in the navigation (order = page order)
const NAV_SECTION_IDS = ["products", "story", "process", "gallery", "contact"]

// Tablet range = 2-column gallery layout in CSS (601px – 900px)
const TABLET_QUERY = "(min-width: 601px) and (max-width: 900px)"

// Initial product data preserved as fallback and default state
const defaultProducts: ProductItem[] = [
  { _id: "init-1", name: "Coconut Burfi", type: "Sweet", image: "fe393.png" },
  { _id: "init-2", name: "Coconut Laddu", type: "Sweet", image: "736d2.png" },
  { _id: "init-3", name: "Coconut Oil", type: "Plant Care", image: "e7e2a.png" },
  { _id: "init-4", name: "Coconut Water", type: "Plant Care", image: "d452e.png" },
]

// Initial gallery data preserved as fallback and default state
const defaultGallery: GalleryItem[] = [
  {
    _id: "init-g1",
    image: "f4680.png",
    caption: "Shop only the orders you want.",
  },
  {
    _id: "init-g2",
    image: "40a51.png",
    caption: "Go to the store to pick items for the order.",
  },
  {
    _id: "init-g3",
    image: "df085.png",
    caption: "Chat with customers for questions or changes.",
  },
  {
    _id: "init-g4",
    image: "f4680.png",
    caption: "Shop only the orders you want.",
  },
]

const reviews = [
  {
    name: "Sophia Jenkins",
    text: "The freshness and care are obvious in every product. It feels honest, thoughtful and deeply connected to nature.",
  },
  {
    name: "Maya Wilson",
    text: "Beautifully made coconut essentials with flavours that remind me of home. The quality is consistently wonderful.",
  },
  {
    name: "Arun Kumar",
    text: "From the coconut oil to the traditional sweets, every order has arrived fresh, carefully packed and full of goodness.",
  },
]

const faqs = [
  [
    "Where do you source your coconuts?",
    "We work with trusted local growers and select mature coconuts for their flavour, purity and natural richness.",
  ],
  [
    "Are your products made in small batches?",
    "Yes. Small-batch production helps us protect freshness, texture and the traditional character of every recipe.",
  ],
  [
    "Do you use artificial flavours?",
    "No. Our focus is on simple ingredients, familiar flavours and thoughtful preparation.",
  ],
  [
    "How should coconut products be stored?",
    "Keep them sealed in a cool, dry place. Product-specific guidance is included with every order.",
  ],
  [
    "Can I place a bulk or gifting order?",
    "Yes. Contact us with your event, quantity and timeline and our team will help create the right selection.",
  ],
]

function BrandLogo({ light = false }: { light?: boolean }) {
  return (
    <a
      className={`brand-logo ${light ? "brand-logo--light" : ""}`}
      href="#top"
      aria-label="Jeya Greens home"
    >
      <img src={`${A}/43927.png`} alt="Jeya Greens & Co." />
    </a>
  )
}

function ArrowIcon({
  direction = "down",
}: {
  direction?: "down" | "left" | "right"
}) {
  const turns = { down: "0deg", left: "90deg", right: "-90deg" }
  return (
    <img
      className="arrow-icon"
      src={`${A}/affe9.svg`}
      alt=""
      style={{ transform: `rotate(${turns[direction]})` }}
    />
  )
}

function checkIsAdminRoute(): boolean {
  if (typeof window === "undefined") return false
  const path = window.location.pathname || ""
  const hash = window.location.hash || ""
  return path.startsWith("/admin") || hash.startsWith("#/admin")
}

export default function App() {
  const [isAdminRoute, setIsAdminRoute] = useState<boolean>(checkIsAdminRoute)

  // Listen for browser navigation (popstate & hashchange)
  useEffect(() => {
    const handleLocationChange = () => {
      setIsAdminRoute(checkIsAdminRoute())
    }
    window.addEventListener("popstate", handleLocationChange)
    window.addEventListener("hashchange", handleLocationChange)
    return () => {
      window.removeEventListener("popstate", handleLocationChange)
      window.removeEventListener("hashchange", handleLocationChange)
    }
  }, [])

  const handleBackToPublicSite = () => {
    if (window.location.hash.startsWith("#/admin")) {
      window.location.hash = "#top"
    } else {
      window.history.pushState({}, "", "/")
      setIsAdminRoute(false)
    }
  }

  // Render Admin Portal if visiting /admin or /#/admin
  if (isAdminRoute) {
    return <AdminView onBackToSite={handleBackToPublicSite} />
  }

  return <PublicWebsite />
}

function PublicWebsite() {
  const root = useRef<HTMLDivElement>(null)
  const categoryWrapRef = useRef<HTMLDivElement>(null)
  const [categoryOpen, setCategoryOpen] = useState(false)
  const [galleryStart, setGalleryStart] = useState(0)
  const [openFaq, setOpenFaq] = useState(0)
  const [submitted, setSubmitted] = useState(false)
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
  const [menuOpen, setMenuOpen] = useState(false)
  const [navVisible, setNavVisible] = useState(true)
  const [navFilled, setNavFilled] = useState(false)
  const menuOpenRef = useRef(false)

  // Which section is currently in view (for nav highlighting)
  const [activeSection, setActiveSection] = useState<string | null>(null)

  // Tablet detection (gallery shows 4 cards in a 2x2 grid on tablet)
  const [isTablet, setIsTablet] = useState<boolean>(() =>
    typeof window !== "undefined" ? window.matchMedia(TABLET_QUERY).matches : false,
  )

  // Dynamic API state with initial fallbacks
  const [products, setProducts] = useState<ProductItem[]>(defaultProducts)
  const [gallery, setGallery] = useState<GalleryItem[]>(defaultGallery)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  // Derive unique categories automatically from loaded products
  const availableCategories = useMemo(() => {
    const set = new Set<string>()
    products.forEach((p) => {
      const cat = (p.category || p.type)?.trim()
      if (cat) {
        set.add(cat.replace(/\s+/g, " "))
      }
    })
    return Array.from(set).sort((a, b) => a.localeCompare(b))
  }, [products])

  // Automatically reset selected category if its last product is deleted or reassigned
  useEffect(() => {
    if (
      selectedCategory &&
      !availableCategories.some((c) => c.toLowerCase() === selectedCategory.toLowerCase())
    ) {
      setSelectedCategory(null)
    }
  }, [availableCategories, selectedCategory])

  // Close category dropdown on click outside or Escape key
  useEffect(() => {
    if (!categoryOpen) return

    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (categoryWrapRef.current && !categoryWrapRef.current.contains(e.target as Node)) {
        setCategoryOpen(false)
      }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setCategoryOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    document.addEventListener("touchstart", handleClickOutside)
    document.addEventListener("keydown", handleKeyDown)

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      document.removeEventListener("touchstart", handleClickOutside)
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [categoryOpen])

  // Track tablet breakpoint
  useEffect(() => {
    const mql = window.matchMedia(TABLET_QUERY)
    const onChange = () => setIsTablet(mql.matches)
    onChange()
    mql.addEventListener("change", onChange)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  // Fetch dynamic products and gallery from backend
  useEffect(() => {
    let active = true

    async function loadData() {
      try {
        const [apiProducts, apiGallery] = await Promise.all([
          fetchProducts().catch(() => null),
          fetchGallery().catch(() => null),
        ])

        if (!active) return

        if (apiProducts && apiProducts.length > 0) {
          setProducts(apiProducts)
        }
        if (apiGallery && apiGallery.length > 0) {
          setGallery(apiGallery)
        }

        // Refresh GSAP ScrollTrigger after content renders
        setTimeout(() => {
          ScrollTrigger.refresh()
        }, 100)
      } catch {
        // Fallback already populated
      }
    }

    loadData()
    return () => {
      active = false
    }
  }, [])

  useLayoutEffect(() => {
    if (!root.current) return
    const context = gsap.context(() => {
      const getMaskStartScale = () =>
        window.innerWidth <= 600 ? 1.35 : window.innerWidth <= 900 ? 1.2 : 1

      gsap.set(".hero-coconut-mask", {
        force3D: true,
        transformOrigin: "50% 23.5%",
        scale: getMaskStartScale,
        opacity: 1,
      })

      const heroEntrance = gsap.timeline()
      heroEntrance.fromTo(".hero-title .line", { yPercent: 115 }, {
        yPercent: 0,
        duration: 0.85,
        stagger: 0.08,
        ease: "power4.out",
      })

      gsap
        .timeline({
          scrollTrigger: {
            trigger: ".hero",
            start: "top top",
            end: () =>
              `+=${window.innerHeight * (window.innerWidth < 768 ? 2.2 : 2.8)}`,
            // small smoothing removes the jitter/flicker while scrubbing the mask
            scrub: 0.5,
            pin: true,
            anticipatePin: 1,
            invalidateOnRefresh: true,
          },
        })
        .to(".hero-landing", { yPercent: -100, duration: 1, ease: "none" })
        .to(
          ".hero-transition",
          { yPercent: -100, duration: 1, ease: "none" },
          0,
        )
        // fromTo with an explicit start scale = no value-recording glitch on refresh / reverse scroll
        .fromTo(
          ".hero-coconut-mask",
          { scale: getMaskStartScale },
          {
            scale: 13.8,
            duration: 2,
            ease: "none",
            force3D: true,
          },
          0.85,
        )
        .to(".hero-coconut-mask", { opacity: 0, duration: 0.2 }, 2.65)
        .to(".hero-final-copy", { opacity: 1, duration: 0.45 }, 2.45)
        .to(
          ".hero-plantation",
          { scale: 1.04, duration: 0.7, ease: "none" },
          2.65,
        )

      gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach((element) => {
        gsap.from(element, {
          y: 55,
          opacity: 0,
          duration: 0.9,
          ease: "power3.out",
          scrollTrigger: { trigger: element, start: "top 86%", once: true },
        })
      })

      gsap.to(".ticker-track", {
        xPercent: -50,
        duration: 22,
        repeat: -1,
        ease: "none",
      })
      gsap.to(".process-orbit", {
        rotation: 360,
        duration: 42,
        repeat: -1,
        ease: "none",
      })
    }, root)
    return () => context.revert()
  }, [])

  // Number of gallery cards: 4 on tablet (2x2 grid), 3 everywhere else
  const galleryCount = isTablet ? Math.min(4, gallery.length) : 3

  useEffect(() => {
    if (!root.current) return
    gsap.fromTo(".gallery-card", { x: 24, opacity: 0 }, {
      x: 0,
      opacity: 1,
      duration: 0.45,
      stagger: 0.08,
      ease: "power2.out",
    })
  }, [galleryStart, gallery, galleryCount])

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

  const moveGallery = (direction: number) => {
    if (gallery.length === 0) return
    setGalleryStart(
      (current) => (current + direction + gallery.length) % gallery.length,
    )
  }

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

  const displayedProducts = selectedCategory
    ? products.filter(
        (p) =>
          (p.type || p.category)?.trim().replace(/\s+/g, " ").toLowerCase() ===
          selectedCategory.trim().toLowerCase(),
      )
    : products

  return (
    <div ref={root} id="top" className="site-shell">
      <header
        className={`nav ${navVisible ? "nav--visible" : "nav--hidden"} ${
          navFilled ? "nav--filled" : ""
        } ${menuOpen ? "nav--menu-open" : ""}`}
      >
        <BrandLogo />
        <nav className="desktop-nav" aria-label="Primary navigation">
          <a href="#products" {...navLink("products")}>Our Product</a>
          <a href="#story" {...navLink("story")}>Our Story</a>
          <a href="#process" {...navLink("process")}>Our Process</a>
          <a href="#gallery" {...navLink("gallery")}>Gallery</a>
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
            <a href="#products" onClick={closeMenu} {...navLink("products")}>
              Our Product
            </a>
            <a href="#story" onClick={closeMenu} {...navLink("story")}>
              Our Story
            </a>
            <a href="#process" onClick={closeMenu} {...navLink("process")}>
              Our Process
            </a>
            <a href="#gallery" onClick={closeMenu} {...navLink("gallery")}>
              Gallery
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

      <main>
        <section className="hero">
          <div className="hero-landing">
            <img
              className="hero-palms"
              src={`${A}/88383.png`}
              alt="A vibrant coconut palm grove"
            />
            <div className="hero-shade" />
            <img className="hero-wave" src={`${A}/2ba95.svg`} alt="" />
            <div className="hero-intro">
              <h1 className="hero-title ">
                <span>
                  <span className="line">Plants That</span>
                </span>
                <span>
                  <span className="line">Make You Smile</span>
                </span>
              </h1>
              <p>
                Green, modern,
                <br />
                life-enhancing plants
              </p>
              <a className="button button--green" href="#products">
                Shop Now
              </a>
            </div>
          </div>
          <div className="hero-transition">
            <img
              className="hero-plantation"
              src={`${A}/dc6e9.png`}
              alt="A coconut grower resting in a plantation"
            />
            <div className="hero-plantation-shade" />
            <div className="hero-coconut-mask" aria-hidden="true">
              <img src={`${A}/coconut-mask.png`} alt="" />
              <span className="mask-bar mask-bar--top" />
              <span className="mask-bar mask-bar--bottom" />
              <span className="mask-bar mask-bar--left" />
              <span className="mask-bar mask-bar--right" />
            </div>
            <div className="hero-final-copy">
              <p>
                At <strong>Jeya Greens &amp; Co</strong>, every great product
                begins with the goodness of nature and carefully sourced
                coconuts.
              </p>
              <p>
                From pure coconut oil to traditional sweets, we bring coconut
                goodness to everyday life.
              </p>
              <p>
                Celebrating familiar flavours and the timeless goodness of
                coconuts.
              </p>
            </div>
          </div>
        </section>

        <section id="products" className="products section-pad">
          <div className="section-head" data-reveal>
            <h2>
              Plants That
              <br />
              Make You Smile
            </h2>

            <div className="split-wrap" ref={categoryWrapRef}>
              <div className={`split-button ${categoryOpen ? "is-open" : ""}`}>
                <button
                  className="split-main"
                  type="button"
                  onClick={() => setCategoryOpen(!categoryOpen)}
                >
                  {selectedCategory ? selectedCategory : "Categories"}
                </button>

                <button
                  className="split-toggle"
                  type="button"
                  onClick={() => setCategoryOpen(!categoryOpen)}
                  aria-expanded={categoryOpen}
                  aria-label="Open categories"
                >
                  <ArrowIcon />
                </button>

                {categoryOpen && (
                  <div className="category-menu" role="menu">
                    <button
                      type="button"
                      className={`category-menu-btn ${selectedCategory === null ? "is-active" : ""}`}
                      onClick={() => {
                        setSelectedCategory(null)
                        setCategoryOpen(false)
                      }}
                    >
                      <span>All Products</span>
                      <span className="cat-count">({products.length})</span>
                    </button>
                    {availableCategories.map((cat) => {
                      const count = products.filter(
                        (p) =>
                          (p.type || p.category)?.trim().replace(/\s+/g, " ").toLowerCase() ===
                          cat.toLowerCase(),
                      ).length
                      return (
                        <button
                          key={cat}
                          type="button"
                          className={`category-menu-btn ${
                            selectedCategory?.trim().toLowerCase() === cat.toLowerCase() ? "is-active" : ""
                          }`}
                          onClick={() => {
                            setSelectedCategory(cat)
                            setCategoryOpen(false)
                          }}
                        >
                          <span>{cat}</span>
                          <span className="cat-count">({count})</span>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div id="product-grid" className="product-grid">
            {displayedProducts.length === 0 ? (
              <div
                style={{
                  gridColumn: "1 / -1",
                  textAlign: "center",
                  padding: "50px 20px",
                  background: "rgba(0, 123, 95, 0.05)",
                  borderRadius: "16px",
                  margin: "20px 0",
                }}
              >
                <p style={{ color: "var(--ink)", fontSize: "18px", fontWeight: 600, marginBottom: "14px" }}>
                  No products found in category &ldquo;{selectedCategory}&rdquo;.
                </p>
                <button
                  className="button button--green"
                  type="button"
                  onClick={() => setSelectedCategory(null)}
                >
                  View All Products
                </button>
              </div>
            ) : (
              displayedProducts.map((product, index) => (
                <article className="product-card" data-reveal key={product._id || product.name}>
                  <img
                    src={product.image.startsWith("http") ? product.image : `${A}/${product.image}`}
                    alt={product.name}
                  />

                  <div className="product-gradient" />

                  <span className="product-tag">{product.type || product.category}</span>

                  <div className="product-copy">
                    <span>Organic</span>
                    <h3>{product.name}</h3>
                  </div>

                  <span className="product-index">0{index + 1}</span>
                </article>
              ))
            )}
          </div>
        </section>

        <div className="ticker" aria-hidden="true">
          <div className="ticker-track">
            {[0, 1].map((group) => (
              <div className="ticker-group" key={group}>
                {[
                  "Plant Care",
                  "Coconut Goodness",
                  "Made With Care",
                  "Traditional Taste",
                ].map((text) => (
                  <span key={`${group}-${text}`}>
                    {text}
                    <img src={`${A}/coconut_trace.png`} alt="" />
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>

        <section id="story" className="story">
          <h2 data-reveal>
            The Story Behind
            <br />
            Jeya Greens.
          </h2>

          <div className="story-copy" data-reveal>
            <p>
              At <strong>Jeya Greens &amp; Co</strong>, our journey begins with a
              deep-rooted love for coconuts and the goodness they bring to
              everyday life.
            </p>
            <p>
              With a commitment to quality and a passion for preserving
              traditional flavours, we bring together the richness of nature and
              the art of thoughtful craftsmanship.
            </p>
            <p>
              Every product reflects our belief in nature, quality and the
              simple joy of sharing goodness with every family.
            </p>
          </div>
          <div className="founder" data-reveal>
            <p className="founder-label">Founder</p>
            <img
              src={`${A}/72a88.png`}
              alt="Founder of Jeya Greens as a young man"
            />
            <p className="founder-name">
              Ashwin
              <br />
              Sivakurnanthan
            </p>
          </div>
        </section>

        <section id="process" className="process section-pad">
          <h2 data-reveal>Our Process</h2>
          <p className="eyebrow" data-reveal>
            A place you eat healthy
          </p>
          <p className="process-lead" data-reveal>
            Simple ingredients, careful hands and time-honoured methods come
            together in every Jeya Greens product.
          </p>
          <div className="process-map" data-reveal>
            <img className="process-orbit" src={`${A}/13780.svg`} alt="" />
            <img
              className="process-image"
              src={`${A}/6845e.png`}
              alt="Coconuts, sweets and Jeya Greens products"
            />
            {[
              "Natural Source",
              "Hand Selected",
              "Made Fresh",
              "Packed With Care",
              "Shared With Joy",
            ].map((step, i) => (
              <span className={`process-step step-${i + 1}`} key={step}>
                {step}
              </span>
            ))}
          </div>
        </section>

        <section id="gallery" className="gallery section-pad">
          <h2 data-reveal>Our Gallery</h2>
          <p data-reveal>
            Explore fresh market moments, genuine conversations and a process
            that brings goodness closer to you.
          </p>
          <div className="gallery-grid">
            {Array.from({ length: galleryCount }, (_, offset) => offset).map((offset) => {
              if (gallery.length === 0) return null
              const item = gallery[(galleryStart + offset) % gallery.length]
              return (
                <article
                  className="gallery-card"
                  key={`${galleryStart}-${offset}-${item._id || item.image}`}
                >
                  <img
                    src={item.image.startsWith("http") ? item.image : `${A}/${item.image}`}
                    alt={item.caption}
                  />
                  <p>{item.caption}</p>
                </article>
              )
            })}
          </div>
          <div className="gallery-controls">
            <button
              onClick={() => moveGallery(-1)}
              aria-label="Previous gallery image"
            >
              <ArrowIcon direction="left" />
            </button>
            <button
              onClick={() => moveGallery(1)}
              aria-label="Next gallery image"
            >
              <ArrowIcon direction="right" />
            </button>
          </div>
        </section>

        <section className="reviews section-pad">
          <h2 data-reveal>What People says ?</h2>
          <div className="review-grid">
            {reviews.map((review) => (
              <article className="review-card" data-reveal key={review.name}>
                <img className="review-avatar" src={`${A}/f3931.png`} alt="" />
                <div className="stars">
                  {[0, 1, 2, 3, 4].map((star) => (
                    <img src={`${A}/d751f.svg`} alt="" key={star} />
                  ))}
                </div>
                <p>{review.text}</p>
                <strong>From: {review.name}</strong>
              </article>
            ))}
          </div>
          <button className="button button--cream">See More</button>
        </section>

        <section className="faq section-pad">
          <h2 data-reveal>What People says ?</h2>
          <div className="faq-list" data-reveal>
            {faqs.map(([question, answer], index) => (
              <article
                className={`faq-item ${openFaq === index ? "is-open" : ""}`}
                key={question}
              >
                <button
                  onClick={() => setOpenFaq(openFaq === index ? -1 : index)}
                  aria-expanded={openFaq === index}
                >
                  <span>{question}</span>
                  <span className="faq-plus">
                    {openFaq === index ? "−" : "+"}
                  </span>
                </button>
                <div className="faq-answer">
                  <p>{answer}</p>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>

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
                  style={
                    contactFieldErrors.name
                      ? { borderColor: "#f87171", outline: "1px solid #f87171" }
                      : undefined
                  }
                />
                {contactFieldErrors.name && (
                  <span
                    style={{
                      color: "#ffd2cc",
                      fontSize: "13px",
                      marginTop: "6px",
                      display: "block",
                    }}
                  >
                    {contactFieldErrors.name}
                  </span>
                )}
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
                  style={
                    contactFieldErrors.email
                      ? { borderColor: "#f87171", outline: "1px solid #f87171" }
                      : undefined
                  }
                />
                {contactFieldErrors.email && (
                  <span
                    style={{
                      color: "#ffd2cc",
                      fontSize: "13px",
                      marginTop: "6px",
                      display: "block",
                    }}
                  >
                    {contactFieldErrors.email}
                  </span>
                )}
              </div>

              <div>
                <input
                  name="enquiry"
                  placeholder="Enquire"
                  aria-label="Enquiry"
                  value={contactValues.enquiry}
                  onChange={handleContactChange}
                  disabled={contactSubmitting}
                  style={
                    contactFieldErrors.enquiry
                      ? { borderColor: "#f87171", outline: "1px solid #f87171" }
                      : undefined
                  }
                />
                {contactFieldErrors.enquiry && (
                  <span
                    style={{
                      color: "#ffd2cc",
                      fontSize: "13px",
                      marginTop: "6px",
                      display: "block",
                    }}
                  >
                    {contactFieldErrors.enquiry}
                  </span>
                )}
              </div>

              <div>
                <textarea
                  name="message"
                  placeholder="Message"
                  aria-label="Message"
                  value={contactValues.message}
                  onChange={handleContactChange}
                  disabled={contactSubmitting}
                  style={
                    contactFieldErrors.message
                      ? { borderColor: "#f87171", outline: "1px solid #f87171" }
                      : undefined
                  }
                />
                {contactFieldErrors.message && (
                  <span
                    style={{
                      color: "#ffd2cc",
                      fontSize: "13px",
                      marginTop: "6px",
                      display: "block",
                    }}
                  >
                    {contactFieldErrors.message}
                  </span>
                )}
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
              <a href="#story">Our Story</a>
              <a href="#process">Our Process</a>
              <a href="#gallery">Gallery</a>
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
    </div>
  )
}