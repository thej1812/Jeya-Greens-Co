import Gallery, { GALLERY_LIMITS } from "../models/Gallery.js"
import imageResourceController from "./imageResourceController.js"

export function normalizeGalleryBody(req, _res, next) {
  if (req.body) {
    if (!req.body.title && req.body.caption) {
      req.body.title = req.body.caption
    }
    if (!req.body.description && req.body.caption) {
      req.body.description = req.body.caption
    }
    if (!req.body.caption && req.body.title) {
      req.body.caption = req.body.title
    }
    if (!req.body.category) {
      req.body.category = "EVENT"
    }
  }
  next()
}

const controller = imageResourceController({
  Model: Gallery,
  folder: "gallery",
  label: "Gallery item",
  fields: {
    category: { label: "Category", max: GALLERY_LIMITS.category, optional: true },
    title: { label: "Title / Event Name", max: GALLERY_LIMITS.title, optional: false },
    description: { label: "Description", max: GALLERY_LIMITS.description, optional: false },
    caption: { label: "Caption", max: GALLERY_LIMITS.caption, optional: true },
    eventDate: { label: "Event date", max: 50, optional: true },
  },
})

export const getGalleryItems = controller.list
export const getGalleryItemById = controller.getOne
export const createGalleryItem = controller.create
export const updateGalleryItem = controller.update
export const deleteGalleryItem = controller.remove
