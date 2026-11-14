import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { BrowserRouter, Routes, Route, Link, useLocation } from "react-router-dom"
import AdminView from "./admin/AdminView"
import FAQ from "./pages/Faq";
import OurProduct from "./pages/OurProduct"
import AboutUs from "./pages/AboutUs"
import OurGallery from "./pages/OurGallery"
import Review from "./pages/Review"
import Menu from "./components/Menu"
import Footer from "./components/Footer"
import Contact from "./pages/Contact"
import {
  fetchProducts,
  fetchGallery,
  fetchTestimonials,
  ProductItem,
  GalleryItem,
  TestimonialItem,
} from "./services/api"

gsap.registerPlugin(ScrollTrigger)

// Stops the pinned hero from refreshing/jumping when the mobile address bar shows/hides
ScrollTrigger.config({ ignoreMobileResize: true })

const A = "/assets"

// Single description shown inside the gallery panel
const GALLERY_PANEL_TEXT =
  "Explore fresh market moments, genuine conversations and a process that brings goodness closer to you. Every picture in our gallery tells the story of honest coconut goodness, from the farm to your family's table."

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

const defaultReviews: (TestimonialItem | { _id?: string; name: string; text: string })[] = [
  {
    _id: "init-rev-1",
    name: "Sophia Jenkins",
    text: "The freshness and care are obvious in every product. It feels honest, thoughtful and deeply connected to nature.",
  },
  {
    _id: "init-rev-2",
    name: "Maya Wilson",
    text: "Beautifully made coconut essentials with flavours that remind me of home. The quality is consistently wonderful.",
  },
  {
    _id: "init-rev-3",
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

// Scrolls to the top whenever the route (page) changes
function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
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

  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<PublicWebsite />} />
        
        <Route path="/our-product" element={<OurProduct />} />
        <Route path="/about-us" element={<AboutUs />} />
        <Route path="/faq" element={<FAQ />} />
        <Route path="/gallery" element={<OurGallery />} />
        <Route path="/reviews" element={<Review />} />
           <Route path="/contact" element={<Contact />} />
        {/* Gallery page route: import your Gallery page, then uncomment
        <Route path="/gallery" element={<Gallery />} /> */}
        {/* Add more pages here, e.g.
        <Route path="/shop" element={<Shop />} /> */}
        <Route path="*" element={<PublicWebsite />} />
      </Routes>
    </BrowserRouter>
  )
}

function PublicWebsite() {
  const root = useRef<HTMLDivElement>(null)
  const categoryWrapRef = useRef<HTMLDivElement>(null)
  const [categoryOpen, setCategoryOpen] = useState(false)
  const [openFaq, setOpenFaq] = useState(0)

  // Dynamic API state with initial fallbacks
  const [products, setProducts] = useState<ProductItem[]>(defaultProducts)
  const [gallery, setGallery] = useState<GalleryItem[]>(defaultGallery)
  const [reviews, setReviews] = useState<(TestimonialItem | { _id?: string; name: string; text: string })[]>(defaultReviews)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  // Gallery slider: which image is currently shown in the gallery panel
  const [galleryIndex, setGalleryIndex] = useState(0)
  const galleryFirstRender = useRef(true)

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

  // Fetch dynamic products and gallery from backend
  useEffect(() => {
    let active = true

    async function loadData() {
      try {
        const [apiProducts, apiGallery, apiTestimonials] = await Promise.all([
          fetchProducts().catch(() => null),
          fetchGallery().catch(() => null),
          fetchTestimonials().catch(() => null),
        ])

        if (!active) return

        if (apiProducts && apiProducts.length > 0) {
          setProducts(apiProducts)
        }
        if (apiGallery && apiGallery.length > 0) {
          setGallery(apiGallery)
        }
        if (apiTestimonials && apiTestimonials.length > 0) {
          setReviews(apiTestimonials)
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

  // Keep the gallery slider index valid when the gallery list changes
  useEffect(() => {
    setGalleryIndex((prev) => (prev >= gallery.length ? 0 : prev))
  }, [gallery])

  // Fade the gallery image in whenever the slide changes
  useEffect(() => {
    if (galleryFirstRender.current) {
      galleryFirstRender.current = false
      return
    }
    if (!root.current) return
    gsap.fromTo(
      ".gallery-frame-img",
      { x: 24, opacity: 0 },
      { x: 0, opacity: 1, duration: 0.45, ease: "power2.out" },
    )
    gsap.fromTo(
      ".gallery-panel-text p",
      { y: 12, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.45, ease: "power2.out" },
    )
  }, [galleryIndex])

  // Auto-advance the gallery every 2 seconds (timer restarts after a manual arrow click)
  useEffect(() => {
    if (gallery.length < 2) return
    const timer = window.setTimeout(() => {
      setGalleryIndex((i) => (i + 1) % gallery.length)
    }, 2000)
    return () => window.clearTimeout(timer)
  }, [galleryIndex, gallery.length])

  const goPrevGallery = () =>
    setGalleryIndex((i) => (gallery.length ? (i - 1 + gallery.length) % gallery.length : 0))
  const goNextGallery = () =>
    setGalleryIndex((i) => (gallery.length ? (i + 1) % gallery.length : 0))

  const currentGalleryItem = gallery[galleryIndex] || gallery[0]

  const displayedProducts = selectedCategory
    ? products.filter(
        (p) =>
          (p.type || p.category)?.trim().replace(/\s+/g, " ").toLowerCase() ===
          selectedCategory.trim().toLowerCase(),
      )
    : products

  return (
    <div ref={root} id="top" className="site-shell">
      <Menu />

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
                  <span className="line">Crack Open</span>
                </span>
                <span>
                  <span className="line">Pure
Goodness</span>
                </span>
              </h1>
              <p>
                Green, modern,
                <br />
                life-enhancing plants
              </p>
              <Link className="button button--green" to="/our-product">
  Shop Now
</Link>
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
                At <strong>Jeya Greens &amp; Co</strong>, every product
begins with responsibly sourced coconuts, selectively purchased from trusted
farmers.
              </p>
              <p>
                From farm fresh coconuts
into VCO and healthy coconut beverages, and wholesome snacks.
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
              At <strong>Jeya Greens &amp; Co</strong>, Our journey began with a simple yet powerful mission: to
bring the purest, most authentic gifts of nature directly from the farm to your family&#39;s
table. Inspired by traditional agricultural heritage, we set out to craft coconut and
food essentials that honor natural goodness without compromise.
            </p>
            <p>
              It all began with a simple commitment to purity extracting cold-pressed Virgin
Coconut Oil the way nature intended, without compromises or chemical shortcuts.
But as our roots took hold, so did a bigger vision: to bring that same unadulterated
goodness to every corner of your kitchen.
            </p>
            <p>
              We believe that good health starts with honest food. That is why our products remain
free from artificial additives, preserving the essential antioxidants, healthy medium-
chain fats, and natural flavors that nature intended. At JEYA GREENS &amp; CO, we
aren&#39;t just making food; we are creating a healthier, higher-quality lifestyle for
generations to come.
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
              "Pure Sourcing",
              "Touchless Craft",
              "Quality Extract",
              "Chemical-Free Foods",
              "Sealed Delivery",
            ].map((step, i) => (
              <span className={`process-step step-${i + 1}`} key={step}>
                {step}
              </span>
            ))}
          </div>
        </section>

        <section id="gallery" className="gallery section-pad">
          <h2 data-reveal>Our Gallery</h2>
          <p className="gallery-desc" data-reveal>
            Explore fresh market moments, genuine conversations and a process
            that brings goodness closer to you.
          </p>

          <div className="gallery-panel" data-reveal>
            <div className="gallery-panel-text">
              <p>{currentGalleryItem?.caption || GALLERY_PANEL_TEXT}</p>
            </div>

            <div className="gallery-panel-media">
              <div className="gallery-frame">
                {currentGalleryItem && (
                  <img
                    className="gallery-frame-img"
                    src={
                      currentGalleryItem.image.startsWith("http")
                        ? currentGalleryItem.image
                        : `${A}/${currentGalleryItem.image}`
                    }
                    alt={currentGalleryItem.caption || "Jeya Greens gallery"}
                  />
                )}
                <div className="gallery-arrows">
                  <button
                    type="button"
                    className="gallery-arrow"
                    onClick={goPrevGallery}
                    aria-label="Previous image"
                  >
                    &larr;
                  </button>
                  <button
                    type="button"
                    className="gallery-arrow"
                    onClick={goNextGallery}
                    aria-label="Next image"
                  >
                    &rarr;
                  </button>
                </div>
              </div>
            </div>
          </div>

          <Link className="button button--green gallery-cta" to="/gallery">
            Explore more
          </Link>
        </section>

        <section className="reviews section-pad">
          <h2 data-reveal>What Scientists Say?</h2>
          <div className="review-grid">
            {reviews.map((review, idx) => (
              <article className="review-card" data-reveal key={(review as any)._id || review.name || idx}>
                <p>{review.text}</p>
                <strong>From: {review.name}</strong>
              </article>
            ))}
          </div>
          <Link className="button button--cream" to="/reviews">
            See More
          </Link>
        </section>

        <section className="faq section-pad">
          <h2 data-reveal>FAQ</h2>
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

      <Footer />
    </div>
  )
}