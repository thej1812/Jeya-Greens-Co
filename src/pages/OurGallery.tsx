
import { useEffect, useState } from "react"
import Menu from "../components/Menu"
import Footer from "../components/Footer"
import {
  fetchGallery,
  GalleryItem,
} from "../services/api"

const A = "/assets"

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

// Single description shown when an item has no caption
const GALLERY_PANEL_TEXT =
  "Explore fresh market moments, genuine conversations and a process that brings goodness closer to you. Every picture in our gallery tells the story of honest coconut goodness, from the farm to your family's table."

export default function OurGallery() {
  const [gallery, setGallery] = useState<GalleryItem[]>(defaultGallery)

  // Start at the top of the page
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  // Fetch gallery from backend
  useEffect(() => {
    let active = true

    async function loadData() {
      try {
        const apiGallery = await fetchGallery().catch(() => null)

        if (!active) return

        if (apiGallery && apiGallery.length > 0) {
          setGallery(apiGallery)
        }
      } catch {
        // Fallback already populated
      }
    }

    loadData()

    return () => {
      active = false
    }
  }, [])

  return (
    <div id="top" className="site-shell">

      {/* ===== MENU ===== */}
      <Menu />

      {/* ===== GALLERY: one by one boxes ===== */}
      <main>
        <section id="gallery" className="gallery section-pad" style={{ marginTop: "52px" }}>
          <h2>Our Gallery</h2>

          <p className="gallery-desc">
            Explore fresh market moments, genuine conversations and a process
            that brings goodness closer to you.
          </p>

          {gallery.map((item) => (
            <div
              style={{ marginTop: 0, marginBottom: "1.5rem" }}
              className="gallery-panel"
              key={item._id || item.image}
            >
              <div className="gallery-panel-text">
                <p>{item.caption || GALLERY_PANEL_TEXT}</p>
              </div>

              <div className="gallery-panel-media">
                <div className="gallery-frame">
                  <img
                    className="gallery-frame-img"
                    src={
                      item.image.startsWith("http")
                        ? item.image
                        : `${A}/${item.image}`
                    }
                    alt={item.caption || "Jeya Greens gallery"}
                  />
                </div>
              </div>
            </div>
          ))}
        </section>
      </main>

      {/* ===== FOOTER ===== */}
      <Footer />

    </div>
  )
}
