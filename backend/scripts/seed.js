/**
 * One-time idempotent migration script to import existing hardcoded products
 * and gallery images from the frontend (src/App.tsx) into MongoDB and Cloudinary.
 *
 *   npm run seed
 *
 * Each collection is only seeded when empty, ensuring duplicate items are never created.
 */
import fs from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { assertEnv } from "../config/env.js"
import { connectDB, disconnectDB } from "../config/db.js"
import { uploadImage } from "../config/cloudinary.js"
import Product from "../models/Product.js"
import Gallery from "../models/Gallery.js"
import { seedInitialTestimonials } from "../controllers/testimonialController.js"

const here = path.dirname(fileURLToPath(import.meta.url))
const assetsDir = path.resolve(
  process.env.SEED_ASSETS_DIR || path.join(here, "../../Jeya-Greens-Co/public/assets"),
)

const initialProducts = [
  { name: "Coconut Burfi", type: "Sweet", file: "fe393.png" },
  { name: "Coconut Laddu", type: "Sweet", file: "736d2.png" },
  { name: "Coconut Oil", type: "Plant Care", file: "e7e2a.png" },
  { name: "Coconut Water", type: "Plant Care", file: "d452e.png" },
]

const initialGallery = [
  { caption: "Shop only the orders you want.", file: "f4680.png" },
  { caption: "Go to the store to pick items for the order.", file: "40a51.png" },
  { caption: "Chat with customers for questions or changes.", file: "df085.png" },
]

async function seedCollection(Model, items, folder, label, isProduct = false) {
  const existing = await Model.countDocuments()
  if (existing > 0) {
    console.log(`${label}: ${existing} records already present in database, skipping.`)
    return
  }

  console.log(`Seeding ${items.length} initial ${label}...`)
  for (const item of items) {
    const filePath = path.join(assetsDir, item.file)
    const buffer = await fs.readFile(filePath)
    const uploadResult = await uploadImage(buffer, folder)

    if (isProduct) {
      await Model.create({
        name: item.name,
        type: item.type,
        image: uploadResult.url,
        imagePublicId: uploadResult.publicId,
      })
      console.log(`  Added product: "${item.name}"`)
    } else {
      await Model.create({
        caption: item.caption,
        image: uploadResult.url,
        imagePublicId: uploadResult.publicId,
      })
      console.log(`  Added gallery: "${item.caption}"`)
    }
  }
}

try {
  assertEnv()
  await connectDB()
  console.log("Connected to MongoDB for initial data migration...")

  await seedCollection(Product, initialProducts, "products", "Products", true)
  await seedCollection(Gallery, initialGallery, "gallery", "Gallery", false)
  await seedInitialTestimonials()

  console.log("Data migration completed successfully.")
} catch (error) {
  console.error("Migration failed:", error.message)
  process.exitCode = 1
} finally {
  await disconnectDB()
}
