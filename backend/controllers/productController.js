import Product, { PRODUCT_LIMITS } from "../models/Product.js"
import imageResourceController from "./imageResourceController.js"

const controller = imageResourceController({
  Model: Product,
  folder: "products",
  label: "Product",
  fields: {
    name: { label: "Product name", max: PRODUCT_LIMITS.name },
    type: { label: "Product type", max: PRODUCT_LIMITS.type },
  },
})

export const getProducts = controller.list
export const getProductById = controller.getOne
export const createProduct = controller.create
export const updateProduct = controller.update
export const deleteProduct = controller.remove
