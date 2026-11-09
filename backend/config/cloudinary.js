import { v2 as cloudinary } from "cloudinary"
import { config } from "./env.js"
import AppError from "../utils/AppError.js"

let configured = false

function ensureConfigured() {
  if (configured) return
  if (!process.env.CLOUDINARY_CLOUD_NAME && process.env.NODE_ENV === "test") {
    return
  }
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  })
  configured = true
}

/**
 * Streams an in-memory image buffer straight to Cloudinary.
 * Nothing is written to the server's filesystem, so uploads survive
 * redeploys on ephemeral hosts such as Render.
 *
 * @param {Buffer} buffer
 * @param {"products" | "gallery"} subfolder
 * @returns {Promise<{ url: string, publicId: string }>}
 */
export function uploadImage(buffer, subfolder) {
  ensureConfigured()
  if (process.env.NODE_ENV === "test" && !process.env.CLOUDINARY_CLOUD_NAME) {
    return Promise.resolve({
      url: `https://res.cloudinary.com/demo/image/upload/v1234567890/${subfolder}/test-mock.jpg`,
      publicId: `${config.cloudinaryFolder}/${subfolder}/test-mock-${Date.now()}`,
    })
  }

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: `${config.cloudinaryFolder}/${subfolder}`,
        resource_type: "image",
        overwrite: false,
      },
      (error, result) => {
        if (error || !result?.secure_url) {
          console.error("Cloudinary upload failed:", error?.message || error)
          return reject(
            new AppError("Image upload failed. Please try again.", 502),
          )
        }
        resolve({ url: result.secure_url, publicId: result.public_id })
      },
    )
    stream.end(buffer)
  })
}

/**
 * Removes an asset from Cloudinary. Failures are logged but never thrown:
 * a leftover orphan image is preferable to failing the user's request
 * after the database has already been updated.
 */
export async function deleteImage(publicId) {
  if (!publicId) return
  if (process.env.NODE_ENV === "test" && !process.env.CLOUDINARY_CLOUD_NAME) {
    return
  }
  ensureConfigured()
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: "image",
      invalidate: true,
    })
    if (result?.result !== "ok" && result?.result !== "not found") {
      console.warn(`Cloudinary delete returned "${result?.result}" for ${publicId}`)
    }
  } catch (error) {
    console.error(`Cloudinary delete failed for ${publicId}:`, error?.message || error)
  }
}
