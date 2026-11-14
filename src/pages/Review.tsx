import { useEffect, useLayoutEffect, useRef, useState } from "react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import Menu from "../components/Menu"
import Footer from "../components/Footer"
import { fetchTestimonials, TestimonialItem } from "../services/api"

gsap.registerPlugin(ScrollTrigger)

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

export default function Review() {
  const root = useRef<HTMLDivElement>(null)
  const [reviews, setReviews] = useState<(TestimonialItem | { _id?: string; name: string; text: string })[]>(defaultReviews)
  const [loading, setLoading] = useState(false)

  // Fetch dynamic testimonials from the shared API
  useEffect(() => {
    let active = true

    async function loadTestimonials() {
      setLoading(true)
      try {
        const data = await fetchTestimonials()
        if (active && data && data.length > 0) {
          setReviews(data)
        }
      } catch {
        // Fallback to defaultReviews is already active
      } finally {
        if (active) setLoading(false)
        setTimeout(() => {
          ScrollTrigger.refresh()
        }, 100)
      }
    }

    loadTestimonials()
    return () => {
      active = false
    }
  }, [])

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
  }, [reviews])

  return (
    <div ref={root} id="top" className="site-shell">

      {/* ===== MENU ===== */}
      <Menu />

      <main>
        <section className="review-page reviews section-pad" style={{ marginTop: "52px" }}>
          <h2 data-reveal>What Scientists Say?</h2>

          {loading && reviews.length === 0 ? (
            <div className="p-12 text-center text-gray-500">Loading reviews...</div>
          ) : (
            <div className="review-grid">
              {reviews.map((review, idx) => (
                <article
                  className="review-card-page review-card"
                  data-reveal
                  key={(review as any)._id || review.name || idx}
                >
                  <p>{review.text}</p>
                  <strong>From: {review.name}</strong>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* ===== FOOTER ===== */}
      <Footer />

    </div>
  )
}
