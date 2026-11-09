import { uploadImage, deleteImage } from "../config/cloudinary.js"
import AppError from "../utils/AppError.js"
import { validateTextFields } from "../utils/validators.js"

/**
 * Builds CRUD handlers for a model that pairs text fields with one
 * Cloudinary image (`image` + `imagePublicId`).
 *
 * @param {object} options
 * @param {import("mongoose").Model} options.Model
 * @param {"products" | "gallery"} options.folder  Cloudinary sub-folder
 * @param {string} options.label  human name, e.g. "Product"
 * @param {Record<string, { label: string, max: number }>} options.fields
 */
export default function imageResourceController({ Model, folder, label, fields }) {
  const findOr404 = async (id) => {
    const doc = await Model.findById(id)
    if (!doc) throw new AppError(`${label} not found.`, 404)
    return doc
  }

  const list = async (_req, res) => {
    const items = await Model.find().sort({ createdAt: 1, _id: 1 }).lean()
    res.json({ success: true, count: items.length, data: items })
  }

  const getOne = async (req, res) => {
    const item = await Model.findById(req.params.id).lean()
    if (!item) throw new AppError(`${label} not found.`, 404)
    res.json({ success: true, data: item })
  }

  const create = async (req, res) => {
    // Validate text before uploading so bad input never creates an orphan Cloudinary image.
    const values = validateTextFields(req.body, fields)
    const image = await uploadImage(req.file.buffer, folder)

    try {
      const item = await Model.create({
        ...values,
        image: image.url,
        imagePublicId: image.publicId,
      })
      res.status(201).json({
        success: true,
        message: `${label} created successfully.`,
        data: item,
      })
    } catch (error) {
      // Clean up orphaned upload if DB write fails
      await deleteImage(image.publicId)
      throw error
    }
  }

  const update = async (req, res) => {
    const values = validateTextFields(req.body, fields, { partial: true })
    if (Object.keys(values).length === 0 && !req.file) {
      throw new AppError("Nothing to update.", 400)
    }

    const item = await findOr404(req.params.id)
    const previousPublicId = item.imagePublicId
    let newImage

    if (req.file) {
      newImage = await uploadImage(req.file.buffer, folder)
      item.image = newImage.url
      item.imagePublicId = newImage.publicId
    }
    Object.assign(item, values)

    try {
      await item.save()
    } catch (error) {
      // If DB update fails, remove the newly uploaded image
      if (newImage) await deleteImage(newImage.publicId)
      throw error
    }

    // Only delete the previous asset once the database update succeeds
    if (newImage && previousPublicId && previousPublicId !== newImage.publicId) {
      await deleteImage(previousPublicId)
    }

    res.json({
      success: true,
      message: `${label} updated successfully.`,
      data: item,
    })
  }

  const remove = async (req, res) => {
    const item = await Model.findByIdAndDelete(req.params.id)
    if (!item) throw new AppError(`${label} not found.`, 404)
    if (item.imagePublicId) {
      await deleteImage(item.imagePublicId)
    }
    res.json({
      success: true,
      message: `${label} deleted successfully.`,
      data: { _id: item._id },
    })
  }

  return { list, getOne, create, update, remove }
}
