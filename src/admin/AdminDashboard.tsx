import React, { useState, useEffect, useRef, useMemo } from "react"
import {
  fetchProducts,
  fetchGallery,
  createProduct,
  updateProduct,
  deleteProduct,
  createGalleryItem,
  updateGalleryItem,
  deleteGalleryItem,
  logoutAdmin,
  ProductItem,
  GalleryItem,
} from "../services/api"

interface AdminDashboardProps {
  adminUsername: string
  onLogout: () => void
  onBackToSite: () => void
}

type TabType = "products" | "gallery"

export default function AdminDashboard({ adminUsername, onLogout, onBackToSite }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<TabType>("products")

  // Products state
  const [products, setProducts] = useState<ProductItem[]>([])
  const [productsLoading, setProductsLoading] = useState(true)
  const [productFormOpen, setProductFormOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null)
  const [productName, setProductName] = useState("")
  const [productType, setProductType] = useState("Sweet")
  const [isCustomCategory, setIsCustomCategory] = useState(false)
  const [customCategoryInput, setCustomCategoryInput] = useState("")
  const [productFile, setProductFile] = useState<File | null>(null)
  const [productPreview, setProductPreview] = useState<string | null>(null)
  const [productSubmitting, setProductSubmitting] = useState(false)
  const productFileInputRef = useRef<HTMLInputElement>(null)

  // Derive unique categories automatically from current products
  const existingCategories = useMemo(() => {
    const set = new Set<string>()
    products.forEach((p) => {
      const cat = (p.category || p.type)?.trim()
      if (cat) {
        set.add(cat.replace(/\s+/g, " "))
      }
    })
    if (set.size === 0) {
      set.add("Sweet")
      set.add("Plant Care")
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b))
  }, [products])

  // Gallery state
  const [gallery, setGallery] = useState<GalleryItem[]>([])
  const [galleryLoading, setGalleryLoading] = useState(true)
  const [galleryFormOpen, setGalleryFormOpen] = useState(false)
  const [editingGallery, setEditingGallery] = useState<GalleryItem | null>(null)
  const [galleryCaption, setGalleryCaption] = useState("")
  const [galleryFile, setGalleryFile] = useState<File | null>(null)
  const [galleryPreview, setGalleryPreview] = useState<string | null>(null)
  const [gallerySubmitting, setGallerySubmitting] = useState(false)
  const galleryFileInputRef = useRef<HTMLInputElement>(null)

  // Feedback notifications
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null)

  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message })
    setTimeout(() => {
      setNotification((current) => (current?.message === message ? null : current))
    }, 4500)
  }

  // Load products
  const loadProducts = async () => {
    setProductsLoading(true)
    try {
      const data = await fetchProducts()
      setProducts(data)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load products"
      showNotification("error", msg)
    } finally {
      setProductsLoading(false)
    }
  }

  // Load gallery
  const loadGallery = async () => {
    setGalleryLoading(true)
    try {
      const data = await fetchGallery()
      setGallery(data)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load gallery"
      showNotification("error", msg)
    } finally {
      setGalleryLoading(false)
    }
  }

  useEffect(() => {
    loadProducts()
    loadGallery()
  }, [])

  // Product Form Handlers
  const openNewProductForm = () => {
    setEditingProduct(null)
    setProductName("")
    setProductType(existingCategories[0] || "Sweet")
    setIsCustomCategory(false)
    setCustomCategoryInput("")
    setProductFile(null)
    setProductPreview(null)
    setProductFormOpen(true)
    if (productFileInputRef.current) productFileInputRef.current.value = ""
  }

  const openEditProductForm = (product: ProductItem) => {
    setEditingProduct(product)
    setProductName(product.name)
    const currentCat = (product.category || product.type || "Sweet").trim()
    setProductType(currentCat)
    setIsCustomCategory(false)
    setCustomCategoryInput("")
    setProductFile(null)
    setProductPreview(product.image)
    setProductFormOpen(true)
    if (productFileInputRef.current) productFileInputRef.current.value = ""
  }

  const handleProductFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setProductFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setProductPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const finalCategory = (isCustomCategory ? customCategoryInput : productType).trim().replace(/\s+/g, " ")

    if (!productName.trim() || !finalCategory) {
      showNotification("error", "Category is mandatory. Please select or enter a category.")
      return
    }

    if (!editingProduct && !productFile) {
      showNotification("error", "Please choose an image for the new product.")
      return
    }

    setProductSubmitting(true)
    try {
      const formData = new FormData()
      formData.append("name", productName.trim())
      formData.append("type", finalCategory)
      formData.append("category", finalCategory)
      if (productFile) {
        formData.append("image", productFile)
      }

      if (editingProduct) {
        await updateProduct(editingProduct._id, formData)
        showNotification("success", `Updated product "${productName}".`)
      } else {
        await createProduct(formData)
        showNotification("success", `Created product "${productName}".`)
      }

      setProductFormOpen(false)
      loadProducts()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save product."
      showNotification("error", msg)
    } finally {
      setProductSubmitting(false)
    }
  }

  const handleDeleteProduct = async (product: ProductItem) => {
    const confirmed = window.confirm(`Are you sure you want to delete "${product.name}"? This cannot be undone.`)
    if (!confirmed) return

    try {
      await deleteProduct(product._id)
      showNotification("success", `Deleted product "${product.name}".`)
      loadProducts()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete product."
      showNotification("error", msg)
    }
  }

  // Gallery Form Handlers
  const openNewGalleryForm = () => {
    setEditingGallery(null)
    setGalleryCaption("")
    setGalleryFile(null)
    setGalleryPreview(null)
    setGalleryFormOpen(true)
    if (galleryFileInputRef.current) galleryFileInputRef.current.value = ""
  }

  const openEditGalleryForm = (item: GalleryItem) => {
    setEditingGallery(item)
    setGalleryCaption(item.caption)
    setGalleryFile(null)
    setGalleryPreview(item.image)
    setGalleryFormOpen(true)
    if (galleryFileInputRef.current) galleryFileInputRef.current.value = ""
  }

  const handleGalleryFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setGalleryFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setGalleryPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleGallerySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!galleryCaption.trim()) {
      showNotification("error", "Please provide a caption.")
      return
    }

    if (!editingGallery && !galleryFile) {
      showNotification("error", "Please choose a gallery image to upload.")
      return
    }

    setGallerySubmitting(true)
    try {
      const formData = new FormData()
      formData.append("caption", galleryCaption.trim())
      if (galleryFile) {
        formData.append("image", galleryFile)
      }

      if (editingGallery) {
        await updateGalleryItem(editingGallery._id, formData)
        showNotification("success", "Gallery image updated successfully.")
      } else {
        await createGalleryItem(formData)
        showNotification("success", "Gallery image uploaded successfully.")
      }

      setGalleryFormOpen(false)
      loadGallery()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save gallery image."
      showNotification("error", msg)
    } finally {
      setGallerySubmitting(false)
    }
  }

  const handleDeleteGallery = async (item: GalleryItem) => {
    const confirmed = window.confirm("Are you sure you want to delete this gallery image? This cannot be undone.")
    if (!confirmed) return

    try {
      await deleteGalleryItem(item._id)
      showNotification("success", "Deleted gallery image.")
      loadGallery()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete gallery image."
      showNotification("error", msg)
    }
  }

  const handleLogoutClick = async () => {
    await logoutAdmin()
    onLogout()
  }

  return (
    <div className="min-h-screen bg-[#fafaf7] text-[#343434] font-sans pb-16 overflow-x-clip">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap justify-between items-center gap-x-3 gap-y-1 min-h-16 py-2">
          <div className="flex items-center gap-3 min-w-0">
            <span className="font-serif text-lg sm:text-2xl font-bold text-[#007b5f] truncate">
              Jeya Greens &amp; Co.
            </span>
            <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#007b5f]/10 text-[#007b5f]">
              Admin Panel
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-4 ml-auto">
            <button
              onClick={onBackToSite}
              type="button"
              className="min-h-11 px-2 -mx-2 sm:mx-0 sm:px-0 text-sm font-medium text-[#007b5f] hover:underline flex items-center gap-1 cursor-pointer whitespace-nowrap"
            >
              <span>&larr;</span> View Site
            </button>
            <div className="hidden sm:block h-4 w-px bg-gray-300" />
            <span className="text-xs text-gray-500 hidden md:inline">
              Logged in as <strong className="text-gray-800">{adminUsername}</strong>
            </span>
            <button
              onClick={handleLogoutClick}
              type="button"
              className="min-h-10 px-3.5 py-1.5 rounded-lg text-sm font-semibold bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 transition-colors cursor-pointer"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Floating Notifications */}
      {notification && (
        <div className="fixed top-20 left-4 right-4 sm:left-auto z-[60] sm:max-w-sm" role="status" aria-live="polite">
          <div
            className={`p-4 rounded-xl shadow-lg border flex items-start gap-3 ${
              notification.type === "success"
                ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                : "bg-red-50 border-red-300 text-red-800"
            }`}
          >
            <span className="font-bold text-lg">
              {notification.type === "success" ? "\u2713" : "!"}
            </span>
            <div className="text-sm font-medium">{notification.message}</div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8">
        {/* Tab Selection Navigation */}
        <div className="flex border-b border-gray-200 mb-6 gap-1 sm:gap-2 overflow-x-auto" role="tablist">
          <button
            onClick={() => setActiveTab("products")}
            type="button"
            className={`flex-1 sm:flex-none min-h-11 pb-3 pt-2 px-2 sm:px-4 font-semibold text-sm whitespace-nowrap transition-all border-b-2 cursor-pointer ${
              activeTab === "products"
                ? "border-[#007b5f] text-[#007b5f]"
                : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
          >
            <span className="sm:hidden">Products</span>
            <span className="hidden sm:inline">Product Management</span> ({products.length})
          </button>
          <button
            onClick={() => setActiveTab("gallery")}
            type="button"
            className={`flex-1 sm:flex-none min-h-11 pb-3 pt-2 px-2 sm:px-4 font-semibold text-sm whitespace-nowrap transition-all border-b-2 cursor-pointer ${
              activeTab === "gallery"
                ? "border-[#007b5f] text-[#007b5f]"
                : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
          >
            <span className="sm:hidden">Gallery</span>
            <span className="hidden sm:inline">Gallery Management</span> ({gallery.length})
          </button>
        </div>

        {/* ========================================================= */}
        {/* TAB 1: PRODUCT MANAGEMENT */}
        {/* ========================================================= */}
        {activeTab === "products" && (
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-serif font-bold text-[#007b5f]">Products</h2>
                <p className="text-xs text-gray-500">Upload, edit, or remove products shown on the public website</p>
              </div>
              <button
                onClick={openNewProductForm}
                type="button"
                className="w-full sm:w-auto min-h-11 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#007b5f] text-white font-semibold text-sm shadow hover:bg-[#00634c] transition-colors cursor-pointer"
              >
                <span>+</span> Add New Product
              </button>
            </div>

            {/* Product Modal Form */}
            {productFormOpen && (
              <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-xs" role="dialog" aria-modal="true">
                <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl max-w-lg w-full p-5 sm:p-6 border border-gray-200 max-h-[92dvh] sm:max-h-[90vh] overflow-y-auto overscroll-contain">
                  <div className="flex justify-between items-start gap-3 pb-4 border-b border-gray-100 mb-5">
                    <h3 className="min-w-0 break-words text-lg sm:text-xl font-serif font-bold text-[#007b5f]">
                      {editingProduct ? `Edit Product: ${editingProduct.name}` : "Add New Product"}
                    </h3>
                    <button
                      onClick={() => setProductFormOpen(false)}
                      type="button"
                      aria-label="Close"
                      className="shrink-0 -mr-2 -mt-2 w-11 h-11 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 text-2xl font-bold cursor-pointer"
                    >
                      &times;
                    </button>
                  </div>

                  <form onSubmit={handleProductSubmit} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1" htmlFor="prod-name">
                        Product Name *
                      </label>
                      <input
                        id="prod-name"
                        type="text"
                        required
                        value={productName}
                        onChange={(e) => setProductName(e.target.value)}
                        placeholder="e.g. Coconut Burfi"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#007b5f]/20 focus:border-[#007b5f] text-base sm:text-sm"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-700" htmlFor="prod-type">
                          Product Category *
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            setIsCustomCategory(!isCustomCategory)
                            if (!isCustomCategory) {
                              setCustomCategoryInput("")
                            }
                          }}
                          className="text-xs font-semibold text-[#007b5f] hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          {isCustomCategory ? "← Choose Existing" : "+ Enter New Category"}
                        </button>
                      </div>

                      {isCustomCategory ? (
                        <div>
                          <input
                            id="prod-type-custom"
                            type="text"
                            required
                            autoFocus
                            placeholder="Enter category name (e.g. Snacks, Sweet)"
                            value={customCategoryInput}
                            onChange={(e) => setCustomCategoryInput(e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#007b5f]/20 focus:border-[#007b5f] text-base sm:text-sm"
                          />
                          <p className="text-[11px] text-gray-400 mt-1">
                            This category will be automatically assigned and updated across the website.
                          </p>
                        </div>
                      ) : (
                        <select
                          id="prod-type"
                          required
                          value={productType}
                          onChange={(e) => {
                            if (e.target.value === "__NEW__") {
                              setIsCustomCategory(true)
                              setCustomCategoryInput("")
                            } else {
                              setProductType(e.target.value)
                            }
                          }}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#007b5f]/20 focus:border-[#007b5f] text-base sm:text-sm cursor-pointer"
                        >
                          {existingCategories.map((cat) => (
                            <option key={cat} value={cat}>
                              {cat}
                            </option>
                          ))}
                          <option value="__NEW__">+ Enter New Category...</option>
                        </select>
                      )}

                      <div className="mt-1 flex items-center gap-1.5 text-xs text-gray-500">
                        <span>Selected Category:</span>
                        <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#007b5f]/10 text-[#007b5f]">
                          {(isCustomCategory ? customCategoryInput.trim() : productType) || "None"}
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1" htmlFor="prod-img">
                        Product Image {editingProduct ? "(leave empty to keep current)" : "*"}
                      </label>
                      <input
                        id="prod-img"
                        ref={productFileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handleProductFileChange}
                        className="w-full min-w-0 text-xs text-gray-500 file:mr-3 file:py-2.5 sm:file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#007b5f]/10 file:text-[#007b5f] hover:file:bg-[#007b5f]/20 cursor-pointer"
                      />
                      <p className="text-[11px] text-gray-400 mt-1">Supports JPG, PNG, and WebP (up to 10MB).</p>
                    </div>

                    {/* Image Live Preview */}
                    {productPreview && (
                      <div className="mt-2 p-3 bg-gray-50 rounded-xl border border-gray-200">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-2">Image Preview:</p>
                        <div className="relative aspect-4/3 w-full max-h-48 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
                          <img
                            src={productPreview}
                            alt="Product preview"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>
                    )}

                    <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:gap-3 pt-4 border-t border-gray-100 mt-6">
                      <button
                        type="button"
                        onClick={() => setProductFormOpen(false)}
                        disabled={productSubmitting}
                        className="w-full sm:w-auto min-h-11 px-4 py-2 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-100 cursor-pointer disabled:opacity-60"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={productSubmitting}
                        className="w-full sm:w-auto min-h-11 px-5 py-2 rounded-xl bg-[#007b5f] text-white text-sm font-semibold shadow hover:bg-[#00634c] transition-colors cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2"
                      >
                        {productSubmitting ? "Uploading & Saving..." : editingProduct ? "Save Changes" : "Save Product"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Products List Grid */}
            {productsLoading ? (
              <div className="p-12 text-center text-gray-400">Loading products...</div>
            ) : products.length === 0 ? (
              <div className="p-6 sm:p-12 bg-white rounded-2xl border border-dashed border-gray-300 text-center">
                <p className="text-gray-500 font-medium">No products found.</p>
                <button
                  onClick={openNewProductForm}
                  type="button"
                  className="mt-3 min-h-11 px-4 py-2 rounded-xl bg-[#007b5f] text-white text-sm font-semibold shadow cursor-pointer"
                >
                  Add your first product
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                {products.map((p, idx) => (
                  <div
                    key={p._id}
                    className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
                  >
                    <div>
                      <div className="aspect-4/3 w-full bg-gray-100 overflow-hidden relative">
                        <img
                          src={p.image.startsWith("http") ? p.image : `/assets/${p.image}`}
                          alt={p.name}
                          className="w-full h-full object-cover"
                        />
                        <span className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-white/90 backdrop-blur-xs text-[#007b5f]">
                          {p.type}
                        </span>
                        <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-md text-[11px] font-mono bg-black/60 text-white">
                          0{idx + 1}
                        </span>
                      </div>

                      <div className="p-4">
                        <h4 className="font-serif text-lg font-bold text-[#007b5f] line-clamp-1">{p.name}</h4>
                        <p className="text-xs text-gray-400 mt-0.5">
                          Added: {p.createdAt ? new Date(p.createdAt).toLocaleDateString() : "Initial"}
                        </p>
                      </div>
                    </div>

                    <div className="px-4 pb-4 pt-1 flex gap-2 border-t border-gray-50">
                      <button
                        onClick={() => openEditProductForm(p)}
                        type="button"
                        className="flex-1 min-h-11 sm:min-h-0 py-2.5 sm:py-1.5 px-3 text-sm sm:text-xs font-semibold rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 transition-colors cursor-pointer"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(p)}
                        type="button"
                        className="min-h-11 sm:min-h-0 py-2.5 sm:py-1.5 px-4 sm:px-3 text-sm sm:text-xs font-semibold rounded-lg bg-red-50 hover:bg-red-100 text-red-600 border border-red-100 transition-colors cursor-pointer"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}



        {/* ========================================================= */}
        {/* TAB 3: GALLERY MANAGEMENT */}
        {/* ========================================================= */}
        {activeTab === "gallery" && (
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-serif font-bold text-[#007b5f]">Gallery</h2>
                <p className="text-xs text-gray-500">Manage photos and captions in the dynamic gallery carousel</p>
              </div>
              <button
                onClick={openNewGalleryForm}
                type="button"
                className="w-full sm:w-auto min-h-11 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#007b5f] text-white font-semibold text-sm shadow hover:bg-[#00634c] transition-colors cursor-pointer"
              >
                <span>+</span> Add Gallery Image
              </button>
            </div>

            {/* Gallery Modal Form */}
            {galleryFormOpen && (
              <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-xs" role="dialog" aria-modal="true">
                <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl max-w-lg w-full p-5 sm:p-6 border border-gray-200 max-h-[92dvh] sm:max-h-[90vh] overflow-y-auto overscroll-contain">
                  <div className="flex justify-between items-start gap-3 pb-4 border-b border-gray-100 mb-5">
                    <h3 className="min-w-0 break-words text-lg sm:text-xl font-serif font-bold text-[#007b5f]">
                      {editingGallery ? "Edit Gallery Item" : "Upload Gallery Image"}
                    </h3>
                    <button
                      onClick={() => setGalleryFormOpen(false)}
                      type="button"
                      aria-label="Close"
                      className="shrink-0 -mr-2 -mt-2 w-11 h-11 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 text-2xl font-bold cursor-pointer"
                    >
                      &times;
                    </button>
                  </div>

                  <form onSubmit={handleGallerySubmit} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1" htmlFor="gal-img">
                        Gallery Image {editingGallery ? "(leave empty to keep current)" : "*"}
                      </label>
                      <input
                        id="gal-img"
                        ref={galleryFileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handleGalleryFileChange}
                        className="w-full min-w-0 text-xs text-gray-500 file:mr-3 file:py-2.5 sm:file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#007b5f]/10 file:text-[#007b5f] hover:file:bg-[#007b5f]/20 cursor-pointer"
                      />
                      <p className="text-[11px] text-gray-400 mt-1">Supports JPG, PNG, and WebP (up to 10MB).</p>
                    </div>

                    {/* Image Live Preview */}
                    {galleryPreview && (
                      <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-2">Image Preview:</p>
                        <div className="relative aspect-4/3 w-full max-h-48 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
                          <img
                            src={galleryPreview}
                            alt="Gallery preview"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1" htmlFor="gal-cap">
                        Caption *
                      </label>
                      <textarea
                        id="gal-cap"
                        rows={3}
                        required
                        value={galleryCaption}
                        onChange={(e) => setGalleryCaption(e.target.value)}
                        placeholder="e.g. Freshly picked mature coconuts from our coastal groves."
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#007b5f]/20 focus:border-[#007b5f] text-base sm:text-sm"
                      />
                    </div>

                    <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:gap-3 pt-4 border-t border-gray-100 mt-6">
                      <button
                        type="button"
                        onClick={() => setGalleryFormOpen(false)}
                        disabled={gallerySubmitting}
                        className="w-full sm:w-auto min-h-11 px-4 py-2 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-100 cursor-pointer disabled:opacity-60"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={gallerySubmitting}
                        className="w-full sm:w-auto min-h-11 px-5 py-2 rounded-xl bg-[#007b5f] text-white text-sm font-semibold shadow hover:bg-[#00634c] transition-colors cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2"
                      >
                        {gallerySubmitting ? "Uploading..." : editingGallery ? "Save Changes" : "Save to Gallery"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Gallery List Grid */}
            {galleryLoading ? (
              <div className="p-12 text-center text-gray-400">Loading gallery...</div>
            ) : gallery.length === 0 ? (
              <div className="p-6 sm:p-12 bg-white rounded-2xl border border-dashed border-gray-300 text-center">
                <p className="text-gray-500 font-medium">No gallery images found.</p>
                <button
                  onClick={openNewGalleryForm}
                  type="button"
                  className="mt-3 min-h-11 px-4 py-2 rounded-xl bg-[#007b5f] text-white text-sm font-semibold shadow cursor-pointer"
                >
                  Upload your first gallery image
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {gallery.map((item) => (
                  <div
                    key={item._id}
                    className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
                  >
                    <div>
                      <div className="aspect-4/3 w-full bg-gray-100 overflow-hidden relative">
                        <img
                          src={item.image.startsWith("http") ? item.image : `/assets/${item.image}`}
                          alt={item.caption}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="p-4">
                        <p className="text-sm text-gray-700 line-clamp-3 leading-relaxed">{item.caption}</p>
                        <p className="text-xs text-gray-400 mt-2">
                          Added: {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "Initial"}
                        </p>
                      </div>
                    </div>

                    <div className="px-4 pb-4 pt-1 flex gap-2 border-t border-gray-50">
                      <button
                        onClick={() => openEditGalleryForm(item)}
                        type="button"
                        className="flex-1 min-h-11 sm:min-h-0 py-2.5 sm:py-1.5 px-3 text-sm sm:text-xs font-semibold rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 transition-colors cursor-pointer"
                      >
                        Edit Caption / Image
                      </button>
                      <button
                        onClick={() => handleDeleteGallery(item)}
                        type="button"
                        className="min-h-11 sm:min-h-0 py-2.5 sm:py-1.5 px-4 sm:px-3 text-sm sm:text-xs font-semibold rounded-lg bg-red-50 hover:bg-red-100 text-red-600 border border-red-100 transition-colors cursor-pointer"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}

