
import { useEffect, useState, useMemo, useRef } from "react"
import Menu from "../components/Menu"
import Footer from "../components/Footer"
import { fetchGallery, GalleryItem } from "../services/api"

const A = "/assets"

// Initial gallery data preserved as fallback and default state
export const defaultGallery: GalleryItem[] = [
  {
    _id: "init-g1",
    category: "EVENT",
    title: "PONGAL EVENT",
    description:
      "Growth and earning profit alone is not the objective of the company but also to part with a portion of its earning / profit for the welfare of the society which is responsible for the company's growth, particularly the economically poor, women and physically and mentally challenged. These activities are implemented through Sakthidevi Charitable Trust a social arm of Sakthi Masala Group of Companies. Thus the company fulfills its corporate social responsibility as per the expectation of the State. SAKTHIDEVI CHARITABLE TRUST was founded in the year 1997 by Dr. P.C. Duraisamy, Managing Director & Dr. SanthiDuraisamy, Director, Sakthi Masala Group of Companies to promote the cause of community development. The trust renders services for upliftment of physically challenged and mentally retarded, helps poor students to pursue their education, mass tree plantations and to promote tree plantation activities by supplying saplings at free of cost.",
    caption: "PONGAL EVENT",
    image: "f4680.png",
    eventDate: "2026-01-15",
  },
  {
    _id: "init-g2",
    category: "HARVEST",
    title: "COCONUT SELECTION",
    description:
      "Every coconut is selectively handpicked from trusted local orchards, ensuring rich natural sweetness and peak nutritional goodness from farm to family.",
    caption: "Shop only the orders you want.",
    image: "40a51.png",
    eventDate: "2026-02-10",
  },
  {
    _id: "init-g3",
    category: "COMMUNITY",
    title: "COMMUNITY GOODNESS",
    description:
      "From sustainable plant care to healthy refreshments, our mission is cultivating conscious living and sharing nature's bounty with our community.",
    caption: "Chat with customers for questions or changes.",
    image: "df085.png",
    eventDate: "2026-03-05",
  },
]

// Single description shown when an item has no description or caption
const GALLERY_PANEL_TEXT =
  "Explore fresh market moments, genuine conversations and a process that brings goodness closer to you. Every picture in our gallery tells the story of honest coconut goodness, from the farm to your family's table."

function ArrowIcon() {
  return <img className="arrow-icon" src={`${A}/affe9.svg`} alt="" />
}

export default function OurGallery() {
  const [gallery, setGallery] = useState<GalleryItem[]>(defaultGallery)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState<string>("")
  const [filterOpen, setFilterOpen] = useState(false)
  const filterWrapRef = useRef<HTMLDivElement>(null)

  // Start at the top of the page
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  // Close filter dropdown when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (filterWrapRef.current && !filterWrapRef.current.contains(e.target as Node)) {
        setFilterOpen(false)
      }
    }
    document.addEventListener("mousedown", handleOutsideClick)
    return () => document.removeEventListener("mousedown", handleOutsideClick)
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

  // Derive unique categories from gallery items
  const availableCategories = useMemo(() => {
    const set = new Set<string>()
    gallery.forEach((item) => {
      const cat = item.category?.trim()
      if (cat) {
        set.add(cat.replace(/\s+/g, " "))
      }
    })
    return Array.from(set).sort((a, b) => a.localeCompare(b))
  }, [gallery])

  // Filter gallery items by category and/or date
  const filteredGallery = useMemo(() => {
    return gallery.filter((item) => {
      if (selectedCategory) {
        const itemCat = (item.category || "").trim().toLowerCase()
        if (itemCat !== selectedCategory.trim().toLowerCase()) {
          return false
        }
      }
      if (selectedDate) {
        const rawDate = item.eventDate || item.createdAt
        if (!rawDate) return false
        try {
          const dateStr = new Date(rawDate).toISOString().split("T")[0]
          if (dateStr !== selectedDate) return false
        } catch {
          return false
        }
      }
      return true
    })
  }, [gallery, selectedCategory, selectedDate])

  // Button label matching category section convention
  const buttonLabel = useMemo(() => {
    if (selectedCategory && selectedDate) {
      return `${selectedCategory} (${selectedDate})`
    }
    if (selectedCategory) {
      return selectedCategory
    }
    if (selectedDate) {
      return `Date: ${selectedDate}`
    }
    return "Categories"
  }, [selectedCategory, selectedDate])

  return (
    <div id="top" className="site-shell">
      {/* ===== MENU ===== */}
      <Menu />

      {/* ===== GALLERY: one by one boxes ===== */}
      <main>
        <section id="gallery" className="gallery section-pad" style={{ marginTop: "52px" }}>
          <h2>Our Gallery</h2>

          {/* Split Filter Button matching Our Products Category button */}
          <div className="split-wrap" ref={filterWrapRef} style={{ margin: "4px auto clamp(24px, 3vw, 42px)" }}>
            <div className={`split-button ${filterOpen ? "is-open" : ""}`}>
              <button
                className="split-main"
                type="button"
                onClick={() => setFilterOpen(!filterOpen)}
              >
                {buttonLabel}
              </button>

              <button
                className="split-toggle"
                type="button"
                onClick={() => setFilterOpen(!filterOpen)}
                aria-expanded={filterOpen}
                aria-label="Open categories and date filter"
              >
                <ArrowIcon />
              </button>

              {filterOpen && (
                <div className="category-menu" role="menu">
                  <button
                    type="button"
                    className={`category-menu-btn ${
                      selectedCategory === null && !selectedDate ? "is-active" : ""
                    }`}
                    onClick={() => {
                      setSelectedCategory(null)
                      setSelectedDate("")
                      setFilterOpen(false)
                    }}
                  >
                    <span>All Events</span>
                    <span className="cat-count">({gallery.length})</span>
                  </button>

                  {availableCategories.map((cat) => {
                    const count = gallery.filter(
                      (g) => (g.category || "").trim().toLowerCase() === cat.toLowerCase()
                    ).length

                    return (
                      <button
                        key={cat}
                        type="button"
                        className={`category-menu-btn ${
                          selectedCategory?.trim().toLowerCase() === cat.toLowerCase()
                            ? "is-active"
                            : ""
                        }`}
                        onClick={() => {
                          setSelectedCategory(cat)
                          setFilterOpen(false)
                        }}
                      >
                        <span>{cat}</span>
                        <span className="cat-count">({count})</span>
                      </button>
                    )
                  })}

                  <div className="gallery-menu-date-section">
                    <div className="gallery-menu-date-label">
                      <span>Search by Date</span>
                      {selectedDate && (
                        <button
                          type="button"
                          className="gallery-menu-date-clear"
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedDate("")
                          }}
                        >
                          Clear Date
                        </button>
                      )}
                    </div>
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => {
                        setSelectedDate(e.target.value)
                        setFilterOpen(false)
                      }}
                      className="gallery-menu-date-input"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          <p className="gallery-desc">
            Explore fresh market moments, genuine conversations and a process
            that brings goodness closer to you.
          </p>

          {filteredGallery.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "60px 20px",
                background: "rgba(0, 123, 95, 0.05)",
                borderRadius: "16px",
                margin: "24px 0",
              }}
            >
              <p style={{ color: "var(--ink)", fontSize: "18px", fontWeight: 600, marginBottom: "14px" }}>
                No events found matching your filter.
              </p>
              <button
                className="button button--green"
                type="button"
                onClick={() => {
                  setSelectedCategory(null)
                  setSelectedDate("")
                }}
              >
                View All Events
              </button>
            </div>
          ) : (
            filteredGallery.map((item) => {
              const category = item.category || "EVENT"
              const title = item.title || item.caption || "GALLERY EVENT"
              const description = item.description || item.caption || GALLERY_PANEL_TEXT
              const formattedDate = item.eventDate
                ? new Date(item.eventDate).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })
                : null

              return (
                <div
                  style={{ marginTop: 0, marginBottom: "2rem" }}
                  className="gallery-panel"
                  key={item._id || item.image}
                >
                  {/* Left Column: Category Label, Prominent Title, Detailed Description */}
                  <div className="gallery-panel-text">
                    <span className="gallery-card-category">{category}</span>
                    <h3 className="gallery-card-title">{title}</h3>
                    <p className="gallery-card-desc">{description}</p>
                    {formattedDate && <span className="gallery-card-date">{formattedDate}</span>}
                  </div>

                  {/* Right Column: Uploaded Event Image */}
                  <div className="gallery-panel-media">
                    <div className="gallery-frame">
                      <img
                        className="gallery-frame-img"
                        src={
                          item.image.startsWith("http")
                            ? item.image
                            : `${A}/${item.image}`
                        }
                        alt={title}
                      />
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </section>
      </main>

      {/* ===== FOOTER ===== */}
      <Footer />
    </div>
  )
}
