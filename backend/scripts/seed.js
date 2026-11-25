/**
 * One-time idempotent migration script to import existing products
 * and gallery items from the frontend (src/App.tsx) into MongoDB and Cloudinary.
 *
 *   npm run seed
 *
 * Each collection is only seeded when empty, ensuring duplicate items are never created.
 */
import fs from "node:fs/promises"
import fsSync from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { assertEnv } from "../config/env.js"
import { connectDB, disconnectDB } from "../config/db.js"
import { uploadImage } from "../config/cloudinary.js"
import Product from "../models/Product.js"
import Gallery from "../models/Gallery.js"
import Category from "../models/Category.js"
import { seedInitialTestimonials } from "../controllers/testimonialController.js"

const here = path.dirname(fileURLToPath(import.meta.url))
const possibleDirs = [
  path.resolve(here, "../public/assets"),
  path.resolve(here, "../../public/assets"),
  path.resolve(process.cwd(), "public/assets"),
  path.resolve(process.cwd(), "../public/assets"),
]
const assetsDir = possibleDirs.find((p) => fsSync.existsSync(p)) || possibleDirs[0]

export const initialProducts = [
  {
    name: "Coconut Burfi",
    type: "Sweet",
    file: "fe393.png",
    description:
      "Traditional south Indian delicacy made with freshly grated coconut, aromatic cardamom, and pure cane sugar. Soft, melt-in-the-mouth texture offering authentic festive sweetness.",
    nutrientsValue: "Sweetness 45%, Energy 140kcal",
  },
  {
    name: "Coconut Laddu",
    type: "Sweet",
    file: "736d2.png",
    description:
      "Handcrafted golden coconut laddus prepared with roasted coconut flakes and organic condensed milk. A wholesome, energy-boosting treat perfect for any occasion.",
    nutrientsValue: "Sweetness 50%, Fiber 15%",
  },
  {
    name: "Coconut Oil",
    type: "Plant Care",
    file: "e7e2a.png",
    description:
      "Cold-pressed extra virgin coconut oil extracted from fresh coconut milk without heat or chemical refining. Highly nourishing for plant vitality, organic soil health, and eco-friendly conditioning.",
    nutrientsValue: "100% Pure, Zero Chemicals",
  },
  {
    name: "Coconut Water",
    type: "Plant Care",
    file: "d452e.png",
    description:
      "Pure, electrolyte-rich tender coconut water tapped straight from fresh green coconuts. Natural plant growth stimulant packed with natural cytokinins, potassium, and active bio-nutrients.",
    nutrientsValue: "Hydration 95%, Minerals 80%",
  },
]

export const initialCategories = ["Sweet", "Plant Care"]

export const initialGallery = [
  {
    category: "EVENT",
    title: "PONGAL EVENT",
    description:
      "Growth and earning profit alone is not the objective of the company but also to part with a portion of its earning / profit for the welfare of the society which is responsible for the company's growth, particularly the economically poor, women and physically and mentally challenged. These activities are implemented through Sakthidevi Charitable Trust a social arm of Sakthi Masala Group of Companies. Thus the company fulfills its corporate social responsibility as per the expectation of the State. SAKTHIDEVI CHARITABLE TRUST was founded in the year 1997 by Dr. P.C. Duraisamy, Managing Director & Dr. SanthiDuraisamy, Director, Sakthi Masala Group of Companies to promote the cause of community development. The trust renders services for upliftment of physically challenged and mentally retarded, helps poor students to pursue their education, mass tree plantations and to promote tree plantation activities by supplying saplings at free of cost.",
    caption: "PONGAL EVENT",
    file: "f4680.png",
  },
  {
    category: "HARVEST",
    title: "COCONUT SELECTION",
    description:
      "Every coconut is selectively handpicked from trusted local orchards, ensuring rich natural sweetness and peak nutritional goodness from farm to family.",
    caption: "Shop only the orders you want.",
    file: "40a51.png",
  },
  {
    category: "COMMUNITY",
    title: "COMMUNITY GOODNESS",
    description:
      "From sustainable plant care to healthy refreshments, our mission is cultivating conscious living and sharing nature's bounty with our community.",
    caption: "Chat with customers for questions or changes.",
    file: "df085.png",
  },
]

export async function seedInitialCategories() {
  const existing = await Category.countDocuments()
  if (existing > 0) return
  for (const name of initialCategories) {
    await Category.create({ name })
    console.log(`[Seed] Added default category: "${name}"`)
  }
}

export async function seedInitialProducts() {
  const existing = await Product.countDocuments()
  if (existing > 0) return

  console.log(`[Seed] Seeding ${initialProducts.length} initial products...`)
  for (const item of initialProducts) {
    const filePath = path.join(assetsDir, item.file)
    if (!fsSync.existsSync(filePath)) {
      console.warn(`[Seed] Asset not found for product: ${filePath}`)
      continue
    }
    const buffer = await fs.readFile(filePath)
    const uploadResult = await uploadImage(buffer, "products")

    await Product.create({
      name: item.name,
      type: item.type,
      category: item.type,
      description: item.description || "",
      nutrientsValue: item.nutrientsValue || "",
      image: uploadResult.url,
      imagePublicId: uploadResult.publicId,
    })
    console.log(`[Seed] Added product: "${item.name}" -> ${uploadResult.url}`)
  }
}

export async function seedInitialGallery() {
  const existing = await Gallery.countDocuments()
  if (existing > 0) return

  console.log(`[Seed] Seeding ${initialGallery.length} initial gallery items...`)
  for (const item of initialGallery) {
    const filePath = path.join(assetsDir, item.file)
    if (!fsSync.existsSync(filePath)) {
      console.warn(`[Seed] Asset not found for gallery: ${filePath}`)
      continue
    }
    const buffer = await fs.readFile(filePath)
    const uploadResult = await uploadImage(buffer, "gallery")

    await Gallery.create({
      category: item.category,
      title: item.title,
      description: item.description,
      caption: item.caption,
      image: uploadResult.url,
      imagePublicId: uploadResult.publicId,
    })
    console.log(`[Seed] Added gallery: "${item.title}" -> ${uploadResult.url}`)
  }
}

export async function runSeed() {
  assertEnv()
  await connectDB()
  console.log("Connected to MongoDB for initial data migration...")

  await seedInitialCategories()
  await seedInitialProducts()
  await seedInitialGallery()
  await seedInitialTestimonials()

  console.log("Data migration completed successfully.")
}

// Auto-run when executed directly via `node scripts/seed.js`
if (process.argv[1] && process.argv[1].endsWith("seed.js")) {
  runSeed()
    .catch((err) => {
      console.error("Migration failed:", err.message)
      process.exitCode = 1
    })
    .finally(() => disconnectDB())
}
