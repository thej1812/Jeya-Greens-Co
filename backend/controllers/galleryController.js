import Gallery, { GALLERY_LIMITS } from "../models/Gallery.js"
import imageResourceController from "./imageResourceController.js"

const controller = imageResourceController({
  Model: Gallery,
  folder: "gallery",
  label: "Gallery image",
  fields: {
    caption: { label: "Caption", max: GALLERY_LIMITS.caption },
  },
})

export const getGalleryItems = controller.list
export const getGalleryItemById = controller.getOne
export const createGalleryItem = controller.create
export const updateGalleryItem = controller.update
export const deleteGalleryItem = controller.remove
