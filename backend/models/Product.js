import mongoose from "mongoose"

export const PRODUCT_LIMITS = { name: 100, type: 50 }

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Product name is required."],
      trim: true,
      maxlength: PRODUCT_LIMITS.name,
    },
    type: {
      type: String,
      required: [true, "Product type is required."],
      trim: true,
      maxlength: PRODUCT_LIMITS.type,
    },
    image: {
      type: String,
      required: [true, "Product image URL is required."],
      trim: true,
    },
    imagePublicId: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
)

// Backwards compatibility alias for imageUrl
productSchema.virtual("imageUrl").get(function () {
  return this.image
}).set(function (val) {
  this.image = val
})

productSchema.index({ createdAt: 1 })

export default mongoose.model("Product", productSchema)
