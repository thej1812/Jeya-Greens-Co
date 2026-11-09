import Product from "../models/Product.js"
import Gallery from "../models/Gallery.js"

export async function getDashboard(_req, res) {
  const [totalProducts, totalGalleryImages, recentProducts, recentGallery] =
    await Promise.all([
      Product.countDocuments(),
      Gallery.countDocuments(),
      Product.find().sort({ createdAt: -1 }).limit(4).lean(),
      Gallery.find().sort({ createdAt: -1 }).limit(4).lean(),
    ])

  res.json({
    success: true,
    data: { totalProducts, totalGalleryImages, recentProducts, recentGallery },
  })
}
