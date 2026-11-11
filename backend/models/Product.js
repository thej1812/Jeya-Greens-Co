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
    category: {
      type: String,
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

// Ensure type and category stay in sync
productSchema.pre("save", function (next) {
  if (this.category && !this.type) {
    this.type = this.category
  } else if (this.type) {
    this.category = this.type
  }
  if (typeof next === "function") {
    next()
  }
})

// Backwards compatibility alias for imageUrl and category
productSchema.virtual("imageUrl").get(function () {
  return this.image
}).set(function (val) {
  this.image = val
})

productSchema.index({ createdAt: 1 })

export default mongoose.model("Product", productSchema)
