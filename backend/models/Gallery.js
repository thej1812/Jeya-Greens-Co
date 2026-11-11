import mongoose from "mongoose"

export const GALLERY_LIMITS = { caption: 300 }

const gallerySchema = new mongoose.Schema(
  {
    caption: {
      type: String,
      required: [true, "Caption is required."],
      trim: true,
      maxlength: GALLERY_LIMITS.caption,
    },
    image: {
      type: String,
      required: [true, "Gallery image URL is required."],
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
gallerySchema.virtual("imageUrl").get(function () {
  return this.image
}).set(function (val) {
  this.image = val
})

gallerySchema.index({ createdAt: 1 })

export default mongoose.model("Gallery", gallerySchema, "gallery")
