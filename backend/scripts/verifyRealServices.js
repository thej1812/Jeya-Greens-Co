/**
 * Real End-to-End Live Integration Verification Script.
 * Connects directly to real MongoDB Atlas and real Cloudinary using .env credentials.
 * Performs real live operations without mocks.
 */
import fs from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { v2 as cloudinary } from "cloudinary"
import mongoose from "mongoose"
import { config, assertEnv } from "../config/env.js"
import { connectDB, disconnectDB } from "../config/db.js"
import { uploadImage, deleteImage } from "../config/cloudinary.js"
import Product from "../models/Product.js"
import Gallery from "../models/Gallery.js"

import fsSync from "node:fs"

const here = path.dirname(fileURLToPath(import.meta.url))
const assetsDir = fsSync.existsSync(path.resolve(here, "../../public/assets"))
  ? path.resolve(here, "../../public/assets")
  : path.resolve(here, "../../Jeya-Greens-Co/public/assets")

async function run() {
  console.log("==================================================")
  console.log("STARTING LIVE REAL-SERVICES E2E VERIFICATION")
  console.log("==================================================")

  // 1. Check environment variables
  assertEnv()
  console.log("[1/8] Environment variables validated.")
  console.log(`      MongoDB Target: ${config.mongoUri.replace(/:([^:@]+)@/, ":****@")}`)
  console.log(`      Cloudinary Cloud: ${process.env.CLOUDINARY_CLOUD_NAME}`)
  console.log(`      Cloudinary Folder: ${config.cloudinaryFolder}`)

  // 2. Connect to real MongoDB Atlas
  console.log("\n[2/8] Connecting to live MongoDB Atlas...")
  const conn = await connectDB()
  console.log(`      Connected to MongoDB host: ${conn.connection.host}`)
  console.log(`      Database Name: ${conn.connection.name}`)

  // 3. Verify Cloudinary credentials with ping
  console.log("\n[3/8] Verifying live Cloudinary credentials...")
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  })
  const pingResult = await cloudinary.api.ping()
  console.log("      Cloudinary Ping:", JSON.stringify(pingResult))
  if (pingResult?.status !== "ok") {
    throw new Error(`Cloudinary ping failed: ${JSON.stringify(pingResult)}`)
  }

  // 4. Test Real Product Image Upload to Cloudinary & MongoDB Atlas
  console.log("\n[4/8] Testing Product Upload with actual asset (fe393.png)...")
  const productAssetBuffer = await fs.readFile(path.join(assetsDir, "fe393.png"))
  console.log(`      Read local asset file: ${productAssetBuffer.length} bytes`)

  const uploadResult = await uploadImage(productAssetBuffer, "products")
  console.log("      Cloudinary Upload Succeeded!")
  console.log(`      - Secure URL: ${uploadResult.url}`)
  console.log(`      - Public ID: ${uploadResult.publicId}`)

  if (!uploadResult.url.startsWith("https://res.cloudinary.com/")) {
    throw new Error(`Expected real Cloudinary URL, received: ${uploadResult.url}`)
  }

  // Create real product record in MongoDB
  const createdProduct = await Product.create({
    name: "E2E Test Fresh Coconut Burfi",
    type: "Sweet",
    image: uploadResult.url,
    imagePublicId: uploadResult.publicId,
  })
  console.log(`      MongoDB Product Created: ID = ${createdProduct._id}`)

  // Verify in MongoDB Atlas
  const fetchedProduct = await Product.findById(createdProduct._id).lean()
  console.log("      MongoDB Product Verification:")
  console.log(`      - Name: "${fetchedProduct.name}"`)
  console.log(`      - Type: "${fetchedProduct.type}"`)
  console.log(`      - Stored Image: ${fetchedProduct.image}`)
  console.log(`      - Stored Public ID: ${fetchedProduct.imagePublicId}`)

  if (fetchedProduct.image !== uploadResult.url || fetchedProduct.imagePublicId !== uploadResult.publicId) {
    throw new Error("MongoDB record does not match Cloudinary upload response!")
  }

  // 5. Test Product Image Replacement
  console.log("\n[5/8] Testing Product Image Replacement (with 736d2.png)...")
  const replaceAssetBuffer = await fs.readFile(path.join(assetsDir, "736d2.png"))
  const replaceResult = await uploadImage(replaceAssetBuffer, "products")
  console.log(`      New Cloudinary Image uploaded: ${replaceResult.url}`)

  const oldPublicId = fetchedProduct.imagePublicId
  await Product.findByIdAndUpdate(createdProduct._id, {
    name: "E2E Test Fresh Coconut Laddu (Updated)",
    image: replaceResult.url,
    imagePublicId: replaceResult.publicId,
  })

  // Destroy old Cloudinary asset
  await deleteImage(oldPublicId)
  console.log(`      Previous Cloudinary asset destroyed: ${oldPublicId}`)

  const updatedProduct = await Product.findById(createdProduct._id).lean()
  console.log(`      Updated Product in MongoDB: name="${updatedProduct.name}", image="${updatedProduct.image}"`)
  if (updatedProduct.image !== replaceResult.url) {
    throw new Error("Product replacement failed in MongoDB!")
  }

  // 6. Test Gallery Upload & Verification
  console.log("\n[6/8] Testing Gallery Upload with actual asset (40a51.png)...")
  const galleryAssetBuffer = await fs.readFile(path.join(assetsDir, "40a51.png"))
  const galleryUploadResult = await uploadImage(galleryAssetBuffer, "gallery")
  console.log("      Cloudinary Gallery Upload Succeeded!")
  console.log(`      - Secure URL: ${galleryUploadResult.url}`)
  console.log(`      - Public ID: ${galleryUploadResult.publicId}`)

  const createdGallery = await Gallery.create({
    caption: "E2E Test: Fresh coconuts harvested directly from our coastal trees.",
    image: galleryUploadResult.url,
    imagePublicId: galleryUploadResult.publicId,
  })
  console.log(`      MongoDB Gallery Created: ID = ${createdGallery._id}`)

  const fetchedGallery = await Gallery.findById(createdGallery._id).lean()
  console.log(`      Fetched Gallery from MongoDB: caption="${fetchedGallery.caption}"`)
  if (fetchedGallery.image !== galleryUploadResult.url) {
    throw new Error("Gallery record does not match Cloudinary upload response!")
  }

  // 7. Test Gallery Replacement
  console.log("\n[7/8] Testing Gallery Update & Image Replacement (df085.png)...")
  const replaceGalleryBuffer = await fs.readFile(path.join(assetsDir, "df085.png"))
  const replaceGalleryResult = await uploadImage(replaceGalleryBuffer, "gallery")
  const oldGalleryPublicId = fetchedGallery.imagePublicId

  await Gallery.findByIdAndUpdate(createdGallery._id, {
    caption: "E2E Test: Updated caption for packaging inspection.",
    image: replaceGalleryResult.url,
    imagePublicId: replaceGalleryResult.publicId,
  })
  await deleteImage(oldGalleryPublicId)
  console.log(`      Previous Gallery asset destroyed: ${oldGalleryPublicId}`)

  const updatedGallery = await Gallery.findById(createdGallery._id).lean()
  console.log(`      Updated Gallery in MongoDB: caption="${updatedGallery.caption}", image="${updatedGallery.image}"`)

  // 8. Test Clean Deletion from MongoDB Atlas & Cloudinary
  console.log("\n[8/8] Testing Clean Deletion from MongoDB & Cloudinary...")
  await Product.findByIdAndDelete(createdProduct._id)
  await deleteImage(replaceResult.publicId)
  console.log(`      Deleted test Product ${createdProduct._id} and destroyed ${replaceResult.publicId}`)

  await Gallery.findByIdAndDelete(createdGallery._id)
  await deleteImage(replaceGalleryResult.publicId)
  console.log(`      Deleted test Gallery ${createdGallery._id} and destroyed ${replaceGalleryResult.publicId}`)

  // Confirm deletion from MongoDB
  const checkProduct = await Product.findById(createdProduct._id)
  const checkGallery = await Gallery.findById(createdGallery._id)
  if (checkProduct !== null || checkGallery !== null) {
    throw new Error("Items were not completely removed from MongoDB Atlas!")
  }
  console.log("      Confirmed: Both test records completely removed from MongoDB Atlas.")

  console.log("\n==================================================")
  console.log("SUCCESS: ALL REAL END-TO-END VERIFICATION CHECKS PASSED!")
  console.log("==================================================")
}

run()
  .catch((err) => {
    console.error("\nE2E VERIFICATION FAILED:", err.message)
    if (err.stack) console.error(err.stack)
    process.exitCode = 1
  })
  .finally(async () => {
    try {
      await disconnectDB()
    } catch {}
  })

