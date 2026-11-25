import { useEffect, useState, useMemo } from "react"
import { useParams, useNavigate, Link } from "react-router-dom"
import Menu from "../components/Menu"
import Footer from "../components/Footer"
import { fetchProducts, fetchProductById, ProductItem } from "../services/api"

const A = "/assets"

// Initial products fallback
const defaultProducts: ProductItem[] = [
  {
    _id: "init-1",
    name: "Coconut Burfi",
    type: "Sweet",
    category: "Sweet",
    image: "fe393.png",
    description:
      "Traditional south Indian delicacy made with freshly grated coconut, aromatic cardamom, and pure cane sugar. Soft, melt-in-the-mouth texture offering authentic festive sweetness.",
    nutrientsValue: "Sweetness 45%, Energy 140kcal",
  },
  {
    _id: "init-2",
    name: "Coconut Laddu",
    type: "Sweet",
    category: "Sweet",
    image: "736d2.png",
    description:
      "Handcrafted golden coconut laddus prepared with roasted coconut flakes and organic condensed milk. A wholesome, energy-boosting treat perfect for any occasion.",
    nutrientsValue: "Sweetness 50%, Spicy 60%",
  },
  {
    _id: "init-3",
    name: "Coconut Oil",
    type: "Plant Care",
    category: "Plant Care",
    image: "e7e2a.png",
    description:
      "Cold-pressed extra virgin coconut oil extracted from fresh coconut milk without heat or chemical refining. Highly nourishing for plant vitality, organic soil health, and eco-friendly conditioning.",
    nutrientsValue: "100% Pure, Zero Chemicals",
  },
  {
    _id: "init-4",
    name: "Coconut Water",
    type: "Plant Care",
    category: "Plant Care",
    image: "d452e.png",
    description:
      "Pure, electrolyte-rich tender coconut water tapped straight from fresh green coconuts. Natural plant growth stimulant packed with natural cytokinins, potassium, and active bio-nutrients.",
    nutrientsValue: "Hydration 95%, Minerals 80%",
  },
]

function getImageUrl(img?: string) {
  if (!img) return `${A}/fe393.png`
  if (img.startsWith("http")) return img
  return `${A}/${img}`
}

function parseNutrients(nutrientsValue?: string, category?: string): string[] {
  if (nutrientsValue && nutrientsValue.trim()) {
    return nutrientsValue
      .split(/[,;\n]+/)
      .map((s) => s.trim())
      .filter(Boolean)
  }
  const isSweet = (category || "").toLowerCase().includes("sweet")
  if (isSweet) {
    return ["Sweetness 50%", "Spicy 60%"]
  }
  return ["100% Organic", "Pure Extract", "Eco Friendly"]
}

function getFallbackDescription(name: string, category?: string): string {
  const isSweet = (category || "").toLowerCase().includes("sweet")
  if (isSweet) {
    return `Indulge in the authentic taste of our ${name}, handcrafted from pure grated coconuts freshly harvested from our coastal orchards. Prepared following traditional time-honored recipes, this sweet treat captures the rich natural aroma, wholesome sweetness, and velvety texture that brings genuine festive joy to your family.`
  }
  return `Discover the natural excellence of our ${name}, sustainably harvested and processed from premier coconut groves. Rich in essential bio-nutrients and minerals, it offers pristine purity, exceptional quality, and environmentally conscious nourishment for your everyday plant care and lifestyle.`
}

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [products, setProducts] = useState<ProductItem[]>(defaultProducts)
  const [product, setProduct] = useState<ProductItem | null>(null)
  const [loading, setLoading] = useState(true)

  // Scroll to top whenever ID changes
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [id])

  // Fetch product list and current product
  useEffect(() => {
    let active = true

    async function loadData() {
      setLoading(true)
      try {
        const all = await fetchProducts().catch(() => [])
        if (!active) return

        const activeList = all && all.length > 0 ? all : defaultProducts
        setProducts(activeList)

        // Try to find by id in loaded list
        let matched = activeList.find(
          (p) => p._id === id || p.name.toLowerCase().replace(/\s+/g, "-") === id?.toLowerCase()
        )

        // If not found in list, attempt specific fetch
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

        // Fallback to first product if invalid id
        if (!matched && activeList.length > 0) {
          matched = activeList[0]
        }

        if (active) {
          setProduct(matched || null)
        }
      } catch {
        if (active && defaultProducts.length > 0) {
          setProducts(defaultProducts)
          setProduct(defaultProducts[0])
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
        <div className="flex flex-col items-center justify-center py-40 gap-4">
          <svg className="animate-spin h-9 w-9 text-[#007b5f]" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          <span className="text-sm font-semibold tracking-wider text-[#007b5f] uppercase">
            Loading Product Details...
          </span>
        </div>
        <Footer />
      </div>
    )
  }

  if (!product) {
    return (
      <div id="top" className="site-shell min-h-screen bg-[#fdffe2]">
        <Menu />
        <main className="section-pad text-center py-32">
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

  const nutrientBadges = parseNutrients(product.nutrientsValue, product.category || product.type)
  const descriptionText = product.description || getFallbackDescription(product.name, product.category || product.type)

  return (
    <div id="top" className="site-shell min-h-screen bg-[#fdffe2]">
      {/* Header Menu */}
      <Menu />

      <main className="section-pad" style={{ marginTop: "32px", paddingBottom: "80px" }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 clamp(16px, 3vw, 40px)" }}>
          {/* Breadcrumb Navigation */}
          <div style={{ marginBottom: "clamp(24px, 3vw, 40px)" }}>
            <Link
              to="/our-product"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                color: "var(--green)",
                fontSize: "14px",
                fontWeight: 600,
                textDecoration: "none",
                transition: "opacity 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.75")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
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
                aspectRatio: "0.85",
                borderRadius: "16px",
                overflow: "hidden",
                background: "linear-gradient(180deg, #f7f3e8 0%, #ebe4d0 100%)",
                boxShadow: "0 10px 30px rgba(0, 50, 38, 0.08)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "clamp(20px, 3vw, 40px)",
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

              {/* Description */}
              <div
                style={{
                  marginTop: "clamp(18px, 2.5vw, 28px)",
                  fontSize: "clamp(15px, 1.15vw, 17px)",
                  lineHeight: 1.8,
                  color: "rgba(0, 50, 38, 0.88)",
                  whiteSpace: "pre-line",
                }}
              >
                {descriptionText}
              </div>

              {/* Nutrients Value Section */}
              <div style={{ marginTop: "clamp(28px, 4vw, 44px)" }}>
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

                {/* Nutrient Badges */}
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
            </div>
          </div>

          {/* Related Products Section */}
          {relatedProducts.length > 0 && (
            <div style={{ marginTop: "clamp(60px, 8vw, 110px)", paddingTop: "clamp(40px, 5vw, 60px)", borderTop: "1px solid rgba(0, 123, 95, 0.15)" }}>
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

              {/* Related Product Cards Grid matching reference image */}
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
      <Footer />
    </div>
  )
}
