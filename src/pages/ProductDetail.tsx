import { useEffect, useState, useMemo } from "react"
import { useParams, useNavigate, Link } from "react-router-dom"
import Menu from "../components/Menu"
import Footer from "../components/Footer"
import { fetchProducts, fetchProductById, ProductItem } from "../services/api"

const A = "/assets"

// Baseline fallback products (no dummy descriptions or nutrients - only real admin data is shown)
const fallbackProducts: ProductItem[] = [
  { _id: "init-1", name: "Coconut Burfi", type: "Sweet", category: "Sweet", image: "fe393.png" },
  { _id: "init-2", name: "Coconut Laddu", type: "Sweet", category: "Sweet", image: "736d2.png" },
  { _id: "init-3", name: "Coconut Oil", type: "Plant Care", category: "Plant Care", image: "e7e2a.png" },
  { _id: "init-4", name: "Coconut Water", type: "Plant Care", category: "Plant Care", image: "d452e.png" },
]

function getImageUrl(img?: string) {
  if (!img) return `${A}/fe393.png`
  if (img.startsWith("http")) return img
  return `${A}/${img}`
}

/** Parses admin-provided nutrients value into individual badges; returns empty array if none provided. */
function parseNutrients(nutrientsValue?: string): string[] {
  if (!nutrientsValue || !nutrientsValue.trim()) {
    return []
  }
  return nutrientsValue
    .split(/[,;\n]+/)
    .map((s) => s.trim())
    .filter(Boolean)
}

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [products, setProducts] = useState<ProductItem[]>(fallbackProducts)
  const [product, setProduct] = useState<ProductItem | null>(null)
  const [loading, setLoading] = useState(true)

  // Scroll to top whenever ID changes
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [id])

  // Fetch product list and current product from live API
  useEffect(() => {
    let active = true

    async function loadData() {
      setLoading(true)
      try {
        const all = await fetchProducts().catch(() => [])
        if (!active) return

        const activeList = all && all.length > 0 ? all : fallbackProducts
        setProducts(activeList)

        // Try to find product by id or slug
        let matched = activeList.find(
          (p) => p._id === id || p.name.toLowerCase().replace(/\s+/g, "-") === id?.toLowerCase()
        )

        // If not found in loaded array, attempt direct single product fetch by ID
        if (!matched && id && !id.startsWith("init-")) {
          try {
            const single = await fetchProductById(id)
            if (active && single) {
              matched = single
            }
          } catch {
            // Handled below
          }
        }

        // If still not matched, fallback to first item
        if (!matched && activeList.length > 0) {
          matched = activeList[0]
        }

        if (active) {
          setProduct(matched || null)
        }
      } catch {
        if (active && fallbackProducts.length > 0) {
          setProducts(fallbackProducts)
          setProduct(fallbackProducts[0])
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    loadData()

    return () => {
      active = false
    }
  }, [id])

  // Related products (exclude current product)
  const relatedProducts = useMemo(() => {
    if (!product) return []
    const others = products.filter((p) => p._id !== product._id)
    const sameCat = others.filter(
      (p) => (p.category || p.type)?.trim().toLowerCase() === (product.category || product.type)?.trim().toLowerCase()
    )
    const otherCat = others.filter(
      (p) => (p.category || p.type)?.trim().toLowerCase() !== (product.category || product.type)?.trim().toLowerCase()
    )
    return [...sameCat, ...otherCat].slice(0, 3)
  }, [products, product])

  if (loading) {
    return (
      <div id="top" className="site-shell min-h-screen bg-[#fdffe2]">
        <Menu />
        <div style={{ paddingTop: "clamp(120px, 14vw, 170px)", paddingBottom: "100px", textAlign: "center" }}>
          <div className="flex flex-col items-center justify-center gap-4">
           
            <span className="text-sm font-semibold tracking-wider text-[#007b5f] uppercase">
              Loading Product Details...
            </span>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  if (!product) {
    return (
      <div id="top" className="site-shell min-h-screen bg-[#fdffe2]">
        <Menu />
        <main
          className="section-pad text-center"
          style={{ paddingTop: "clamp(120px, 14vw, 170px)", paddingBottom: "100px" }}
        >
          <h2 style={{ fontFamily: "var(--serif)" }} className="text-4xl text-[#007b5f] mb-4">
            Product Not Found
          </h2>
          <p className="text-[#003226]/80 text-base mb-8">
            The product you are looking for is currently unavailable or has been removed.
          </p>
          <Link to="/our-product" className="button button--green inline-block">
            Browse All Products
          </Link>
        </main>
        <Footer />
      </div>
    )
  }

  // Only parse nutrients if admin provided them
  const nutrientBadges = parseNutrients(product.nutrientsValue)
  const hasDescription = Boolean(product.description && product.description.trim())

  return (
    <div id="top" className="site-shell min-h-screen bg-[#fdffe2]">
      {/* Header Menu */}
      <Menu />

      {/* Main section: paddingTop clears the fixed navbar completely */}
      <main
        className="section-pad"
        style={{
          paddingTop: "clamp(120px, 14vw, 170px)",
          paddingBottom: "80px",
        }}
      >
        <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 clamp(16px, 3vw, 40px)" }}>
          {/* Back to Products button: Positioned clearly below navbar */}
          <div style={{ marginBottom: "clamp(24px, 3.5vw, 44px)" }}>
            <Link
              to="/our-product"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                
                fontSize: "14px",
                fontWeight: 600,
                textDecoration: "none",
                transition: "all 0.25s ease",
              }}
              
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              <span>Back to Products</span>
            </Link>
          </div>

          {/* Main Product Details: Left Image Card | Right Content */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
              gap: "clamp(32px, 5vw, 70px)",
              alignItems: "start",
            }}
          >
            {/* Left Column: Product Card Image */}
            <div
              style={{
                position: "relative",
                width: "100%",
                border:"0px",
                overflow: "hidden",
               borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {/* Category Pill Tag */}
              <span
                style={{
                  position: "absolute",
                  top: "20px",
                  left: "20px",
                  padding: "8px 16px",
                  borderRadius: "4px",
                  background: "var(--cream)",
                  color: "var(--green)",
                  fontSize: "12px",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.06)",
                  zIndex: 2,
                }}
              >
                {product.category || product.type}
              </span>

              {/* Product Photo */}
              <img
                src={getImageUrl(product.image)}
                alt={product.name}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                  filter: "drop-shadow(0 15px 25px rgba(0, 50, 38, 0.15))",
                  transition: "transform 0.4s ease",
                }}
              />
            </div>

            {/* Right Column: Title, Description, Nutrients Value */}
            <div style={{ display: "flex", flexDirection: "column" }}>
              <h1
                style={{
                  fontFamily: "var(--serif)",
                  fontSize: "clamp(36px, 4.2vw, 64px)",
                  fontWeight: 400,
                  lineHeight: 1.05,
                  color: "var(--green)",
                  margin: 0,
                  letterSpacing: "-0.01em",
                }}
              >
                {product.name}
              </h1>

              {/* Description: ONLY displayed if admin entered it; NO dummy data */}
              {hasDescription && (
                <div
                  style={{
                    marginTop: "clamp(18px, 2.5vw, 28px)",
                    fontSize: "clamp(15px, 1.15vw, 17px)",
                    lineHeight: 1.8,
                    color: "rgba(0, 50, 38, 0.88)",
                    whiteSpace: "pre-line",
                  }}
                >
                  {product.description?.trim()}
                </div>
              )}

              {/* Nutrients Value: ONLY displayed if admin entered it; NO dummy data */}
              {nutrientBadges.length > 0 && (
                <div style={{ marginTop: hasDescription ? "clamp(28px, 4vw, 44px)" : "24px" }}>
                  <h2
                    style={{
                      fontFamily: "var(--serif)",
                      fontSize: "clamp(26px, 2.5vw, 36px)",
                      fontWeight: 400,
                      color: "var(--green)",
                      margin: "0 0 16px 0",
                    }}
                  >
                    Nutrients Value
                  </h2>

                  {/* Nutrient Badges entered by admin */}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                    {nutrientBadges.map((badge, idx) => (
                      <span
                        key={idx}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          padding: "8px 18px",
                          background: "var(--green)",
                          color: "var(--cream)",
                          fontSize: "13px",
                          fontWeight: 600,
                          borderRadius: "4px",
                          letterSpacing: "0.02em",
                        }}
                      >
                        {badge}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Related Products Section */}
          {relatedProducts.length > 0 && (
            <div
              style={{
                marginTop: "clamp(60px, 8vw, 110px)",
                paddingTop: "clamp(40px, 5vw, 60px)",
                borderTop: "1px solid rgba(0, 123, 95, 0.15)",
              }}
            >
              <h2
                style={{
                  fontFamily: "var(--serif)",
                  fontSize: "clamp(30px, 3.2vw, 46px)",
                  fontWeight: 400,
                  color: "var(--green)",
                  margin: "0 0 clamp(24px, 3.5vw, 42px) 0",
                }}
              >
                Related Product
              </h2>

              {/* Related Product Cards Grid */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                  gap: "24px",
                }}
              >
                {relatedProducts.map((rel, index) => (
                  <article
                    className="product-card"
                    key={rel._id || rel.name}
                    onClick={() => {
                      navigate(`/product/${rel._id}`)
                      window.scrollTo({ top: 0, behavior: "smooth" })
                    }}
                    style={{
                      cursor: "pointer",
                      width: "100%",
                      aspectRatio: "0.78",
                      borderRadius: "6px",
                    }}
                  >
                    <img
                      src={getImageUrl(rel.image)}
                      alt={rel.name}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />

                    <div className="product-gradient" />

                    <span className="product-tag">{rel.type || rel.category}</span>

                    <div className="product-copy">
                      <span>Organic</span>
                      <h3>{rel.name}</h3>
                    </div>

                    <span className="product-index">0{index + 1}</span>
                  </article>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
     
    </div>
  )
}
