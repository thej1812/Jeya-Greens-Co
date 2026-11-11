import Product, { PRODUCT_LIMITS } from "../models/Product.js"
import Category from "../models/Category.js"
import imageResourceController from "./imageResourceController.js"

const baseController = imageResourceController({
  Model: Product,
  folder: "products",
  label: "Product",
  fields: {
    name: { label: "Product name", max: PRODUCT_LIMITS.name },
    type: { label: "Product category", max: PRODUCT_LIMITS.type },
  },
})

export const getProducts = baseController.list
export const getProductById = baseController.getOne

export const createProduct = async (req, res, next) => {
  if (req.body) {
    if (req.body.category && !req.body.type) {
      req.body.type = req.body.category
    } else if (req.body.type && !req.body.category) {
      req.body.category = req.body.type
    }
  }
  if (req.body?.type) {
    const trimmed = req.body.type.trim()
    if (trimmed) {
      await Category.findOneAndUpdate(
        { name: { $regex: new RegExp(`^${trimmed.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") } },
        { name: trimmed },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      ).catch(() => {})
    }
  }
  return baseController.create(req, res, next)
}

export const updateProduct = async (req, res, next) => {
  if (req.body) {
    if (req.body.category && !req.body.type) {
      req.body.type = req.body.category
    } else if (req.body.type && !req.body.category) {
      req.body.category = req.body.type
    }
  }
  if (req.body?.type) {
    const trimmed = req.body.type.trim()
    if (trimmed) {
      await Category.findOneAndUpdate(
        { name: { $regex: new RegExp(`^${trimmed.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") } },
        { name: trimmed },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      ).catch(() => {})
    }
  }
  return baseController.update(req, res, next)
}

export const deleteProduct = baseController.remove
