
import { useLayoutEffect, useRef } from "react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import Menu from "../components/Menu"
import Footer from "../components/Footer"

gsap.registerPlugin(ScrollTrigger)

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

export default function Review() {
  const root = useRef<HTMLDivElement>(null)

  // Scroll reveal animation
  useLayoutEffect(() => {
    if (!root.current) return

    const context = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach((element) => {
        gsap.from(element, {
          y: 55,
          opacity: 0,
          duration: 0.9,
          ease: "power3.out",
          scrollTrigger: {
            trigger: element,
            start: "top 86%",
            once: true,
          },
        })
      })
    }, root)

    return () => context.revert()
  }, [])

  return (
    <div ref={root} id="top" className="site-shell">

      {/* ===== MENU ===== */}
      <Menu />

      <main>
        <section className="review-page reviews section-pad" style={{ marginTop: "52px" }}>
          <h2 data-reveal>What Scientists Say?</h2>

          <div className="review-grid">
            {reviews.map((review) => (
              <article
                className="review-card-page review-card"
                data-reveal
                key={review.name}
              >
                <p>{review.text}</p>
                <strong>From: {review.name}</strong>
              </article>
            ))}
          </div>
        </section>
      </main>

      {/* ===== FOOTER ===== */}
      <Footer />

    </div>
  )
}
