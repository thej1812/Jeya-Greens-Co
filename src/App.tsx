import { FormEvent, useEffect, useLayoutEffect, useRef, useState } from "react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

gsap.registerPlugin(ScrollTrigger)

const A = "/assets"

const products = [
  { name: "Coconut Burfi", type: "Sweet", image: "fe393.png" },
  { name: "Coconut Laddu", type: "Sweet", image: "736d2.png" },
  { name: "Coconut Oil", type: "Plant Care", image: "e7e2a.png" },
  { name: "Coconut Water", type: "Plant Care", image: "d452e.png" },
]

const gallery = [
  { image: "f4680.png", caption: "Shop only the orders you want." },
  {
    image: "40a51.png",
    caption: "Go to the store to pick items for the order.",
  },
  {
    image: "df085.png",
    caption: "Chat with customers for questions or changes.",
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

export default function App() {
  const root = useRef<HTMLDivElement>(null)
  const [categoryOpen, setCategoryOpen] = useState(false)
  const [galleryStart, setGalleryStart] = useState(0)
  const [openFaq, setOpenFaq] = useState(0)
  const [submitted, setSubmitted] = useState(false)

  useLayoutEffect(() => {
    if (!root.current) return
    const context = gsap.context(() => {
      gsap.set(".hero-coconut-stage", { xPercent: -50 })

      const heroEntrance = gsap.timeline()
      heroEntrance
        .fromTo(".hero-title .line", { yPercent: 115 }, {
          yPercent: 0,
          duration: 0.85,
          stagger: 0.08,
          ease: "power4.out",
        })
        .fromTo(
          ".hero-coconut",
          { scale: 0.8, y: 80, rotate: -12, opacity: 0 },
          {
            scale: 1,
            y: 0,
            rotate: 0,
            opacity: 1,
            duration: 0.8,
            ease: "back.out(1.5)",
          },
          0.2,
        )
        .to(".hero-coconut", {
          y: -10,
          duration: 0.8,
          yoyo: true,
          repeat: 1,
          ease: "sine.inOut",
        })

      gsap
        .timeline({
          scrollTrigger: {
            trigger: ".hero",
            start: "top top",
            end: "+=220%",
            scrub: true,
            pin: true,
            anticipatePin: 1,
            invalidateOnRefresh: true,
          },
        })
        .to(".hero-coconut-stage", {
          top: 0,
          left: 0,
          xPercent: 0,
          width: "100vw",
          height: "100svh",
          scale: 1.01,
          duration: 1,
          ease: "none",
        })
        .to(".hero-intro", { y: -260, opacity: 0, ease: "none" }, 0)
        .to(".hero-coconut", { scale: 1.06, duration: 1, ease: "none" }, 0)
        .to(".hero-palms", { scale: 1.08, duration: 1, ease: "none" }, 0)
        .to(".hero-coconut", {
          scale: 1.08,
          duration: 1.25,
          ease: "none",
        })

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

  useEffect(() => {
    if (!root.current) return
    gsap.fromTo(".gallery-card", { x: 24, opacity: 0 }, {
      x: 0,
      opacity: 1,
      duration: 0.45,
      stagger: 0.08,
      ease: "power2.out",
    })
  }, [galleryStart])

  const moveGallery = (direction: number) =>
    setGalleryStart(
      (current) => (current + direction + gallery.length) % gallery.length,
    )

  const submitForm = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitted(true)
    gsap.fromTo(".form-success", { y: 8, opacity: 0 }, {
      y: 0,
      opacity: 1,
      duration: 0.35,
    })
    event.currentTarget.reset()
  }

  return (
    <div ref={root} id="top" className="site-shell">
      <header className="nav">
        <BrandLogo />
        <nav aria-label="Primary navigation">
          <a href="#products">Our Product</a>
          <a href="#story">Our Story</a>
          <a href="#process">Our Process</a>
          <a href="#gallery">Gallery</a>
        </nav>
        <a className="button button--green nav-cta" href="#contact">
          Contact Now
        </a>
      </header>

      <main>
        <section className="hero">
          <img
            className="hero-palms"
            src={`${A}/88383.png`}
            alt="A vibrant coconut palm grove"
          />
          <div className="hero-shade" />
          <div className="hero-intro">
            <h1 className="hero-title">
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
          <div className="hero-coconut-stage">
            <img
              className="hero-coconut"
              src={`${A}/58600.png`}
              alt="Coconut sweets"
            />
          </div>
        </section>

        <section id="products" className="products section-pad">
          <div className="section-head" data-reveal>
            <h2>
              Plants That
              <br />
              Make You Smile
            </h2>
            <a className="button button--green" href="#product-grid">
              Shop Now
            </a>
          </div>
          <div id="product-grid" className="product-grid">
            {products.map((product, index) => (
              <article className="product-card" data-reveal key={product.name}>
                <img src={`${A}/${product.image}`} alt={product.name} />
                <div className="product-gradient" />
                <span className="product-tag">{product.type}</span>
                <button className="heart" aria-label={`Save ${product.name}`}>
                  <img src={`${A}/c9e65.svg`} alt="" />
                </button>
                <div className="product-copy">
                  <span>Organic</span>
                  <h3>{product.name}</h3>
                </div>
                <span className="product-index">0{index + 1}</span>
              </article>
            ))}
          </div>
          <div className="split-wrap">
            <div className={`split-button ${categoryOpen ? "is-open" : ""}`}>
              <button
                className="split-main"
                onClick={() => setCategoryOpen(!categoryOpen)}
              >
                Categories
              </button>
              <button
                className="split-toggle"
                onClick={() => setCategoryOpen(!categoryOpen)}
                aria-expanded={categoryOpen}
                aria-label="Open categories"
              >
                <ArrowIcon />
              </button>
              {categoryOpen && (
                <div className="category-menu">
                  <a href="#product-grid">Traditional sweets</a>
                  <a href="#product-grid">Coconut oils</a>
                  <a href="#product-grid">Fresh drinks</a>
                </div>
              )}
            </div>
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
                    <img src={`${A}/d681d.svg`} alt="" />
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
          <div className="story-visual" data-reveal>
            <img src={`${A}/dc6e9.png`} alt="A man enjoying a coconut grove" />
            <div className="story-overlay" />
            <p className="story-note story-note--one">
              At <strong>Jeya Greens & Co</strong>, every great product begins
              with the goodness of nature and carefully sourced coconuts.
            </p>
            <p className="story-note story-note--two">
              From pure coconut oil to traditional sweets, we bring coconut
              goodness to everyday life.
            </p>
            <p className="story-note story-note--three">
              Celebrating familiar flavours and the timeless goodness of
              coconuts.
            </p>
          </div>
          <div className="story-copy" data-reveal>
            <p>
              At <strong>Jeya Greens & Co</strong>, our journey begins with a
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
            {[0, 1, 2].map((offset) => {
              const item = gallery[(galleryStart + offset) % gallery.length]
              return (
                <article
                  className="gallery-card"
                  key={`${galleryStart}-${offset}`}
                >
                  <img src={`${A}/${item.image}`} alt={item.caption} />
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
            <form onSubmit={submitForm}>
              <h2>Contact us</h2>
              <input
                required
                name="name"
                placeholder="Name"
                aria-label="Name"
              />
              <input
                required
                name="enquiry"
                placeholder="Enquire"
                aria-label="Enquiry"
              />
              <textarea
                required
                name="description"
                placeholder="Description"
                aria-label="Description"
              />
              <button className="button button--cream" type="submit">
                Send Message
              </button>
              {submitted && (
                <p className="form-success" role="status">
                  Thank you. We’ll be in touch soon.
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
          <p>Copyright 2026 — JEYA GREENS & CO.</p>
          <p>
            <a href="#top">Terms of services</a>
            <a href="#top">Privacy Policy</a>
          </p>
        </div>
      </footer>
    </div>
  )
}
