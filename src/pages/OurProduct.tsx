
import { useEffect, useMemo, useRef, useState } from "react"
import Menu from "../components/Menu"
import Footer from "../components/Footer"
import { fetchProducts, ProductItem } from "../services/api"

const A = "/assets"

// Fallback products (same as home page)
const defaultProducts: ProductItem[] = [
  { _id: "init-1", name: "Coconut Burfi", type: "Sweet", image: "fe393.png" },
  { _id: "init-2", name: "Coconut Laddu", type: "Sweet", image: "736d2.png" },
  { _id: "init-3", name: "Coconut Oil", type: "Plant Care", image: "e7e2a.png" },
  { _id: "init-4", name: "Coconut Water", type: "Plant Care", image: "d452e.png" },
]

function ArrowIcon() {
  return <img className="arrow-icon" src={`${A}/affe9.svg`} alt="" />
}

export default function OurProduct() {
  const categoryWrapRef = useRef<HTMLDivElement>(null)

  const [categoryOpen, setCategoryOpen] = useState(false)
  const [products, setProducts] = useState<ProductItem[]>(defaultProducts)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  // Load products from backend
  useEffect(() => {
    let active = true

    fetchProducts()
      .then((apiProducts) => {
        if (active && apiProducts && apiProducts.length > 0) {
          setProducts(apiProducts)
        }
      })
      .catch(() => {
        // Fallback products already set
      })

    return () => {
      active = false
    }
  }, [])

  // Unique categories from products
  const availableCategories = useMemo(() => {
    const set = new Set<string>()

    products.forEach((p) => {
      const cat = (p.category || p.type)?.trim()
      if (cat) set.add(cat.replace(/\s+/g, " "))
    })

    return Array.from(set).sort((a, b) => a.localeCompare(b))
  }, [products])

  // Reset category if it no longer exists
  useEffect(() => {
    if (
      selectedCategory &&
      !availableCategories.some(
        (c) => c.toLowerCase() === selectedCategory.toLowerCase()
      )
    ) {
      setSelectedCategory(null)
    }
  }, [availableCategories, selectedCategory])

  // Close dropdown on outside click / Escape
  useEffect(() => {
    if (!categoryOpen) return

    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (
        categoryWrapRef.current &&
        !categoryWrapRef.current.contains(e.target as Node)
      ) {
        setCategoryOpen(false)
      }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setCategoryOpen(false)
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

  // Display products based on selected category
  const displayedProducts = selectedCategory
    ? products.filter(
        (p) =>
          (p.type || p.category)
            ?.trim()
            .replace(/\s+/g, " ")
            .toLowerCase() === selectedCategory.trim().toLowerCase()
      )
    : products

  return (
    <div id="top" className="site-shell">

      {/* ---------- MENU ---------- */}
      <Menu />

      <main>
        {/* ---------- PRODUCTS ---------- */}
        <section
          id="products"
          className="products section-pad"
          style={{ marginTop: "52px" }}
        >
          <div className="section-head">
            <h2>Our Products</h2>

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
                      className={`category-menu-btn ${
                        selectedCategory === null ? "is-active" : ""
                      }`}
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
                          (p.type || p.category)
                            ?.trim()
                            .replace(/\s+/g, " ")
                            .toLowerCase() === cat.toLowerCase()
                      ).length

                      return (
                        <button
                          key={cat}
                          type="button"
                          className={`category-menu-btn ${
                            selectedCategory?.trim().toLowerCase() ===
                            cat.toLowerCase()
                              ? "is-active"
                              : ""
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

          {/* ---------- PRODUCT GRID ---------- */}
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
                <p
                  style={{
                    color: "var(--ink)",
                    fontSize: "18px",
                    fontWeight: 600,
                    marginBottom: "14px",
                  }}
                >
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
                <article
                  className="product-card"
                  key={product._id || product.name}
                >
                  <img
                    src={
                      product.image.startsWith("http")
                        ? product.image
                        : `${A}/${product.image}`
                    }
                    alt={product.name}
                  />

                  <div className="product-gradient" />

                  <span className="product-tag">
                    {product.type || product.category}
                  </span>

                  <div className="product-copy">
                    <span>Organic</span>
                    <h3>{product.name}</h3>
                  </div>

                  <span className="product-index">
                    0{index + 1}
                  </span>
                </article>
              ))
            )}

          </div>
        </section>
      </main>

      {/* ---------- FOOTER ---------- */}
      <Footer />

    </div>
  )
}
