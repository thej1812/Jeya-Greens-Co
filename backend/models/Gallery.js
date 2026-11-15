import mongoose from "mongoose"

export const GALLERY_LIMITS = {
  category: 50,
  title: 150,
  description: 2000,
  caption: 300,
}

const gallerySchema = new mongoose.Schema(
  {
    category: {
      type: String,
      trim: true,
      default: "EVENT",
      maxlength: GALLERY_LIMITS.category,
    },
    title: {
      type: String,
      trim: true,
      default: "",
      maxlength: GALLERY_LIMITS.title,
    },
    description: {
      type: String,
      trim: true,
      default: "",
      maxlength: GALLERY_LIMITS.description,
    },
    eventDate: {
      type: Date,
      default: Date.now,
    },
    caption: {
      type: String,
      trim: true,
      default: "",
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

// Ensure backwards compatibility between caption, title, and description
gallerySchema.pre("save", function (next) {
  if (!this.category) {
    this.category = "EVENT"
  }
  if (!this.title && this.caption) {
    this.title = this.caption
  }
  if (!this.caption && this.title) {
    this.caption = this.title
  }
  if (!this.description && this.caption) {
    this.description = this.caption
  }
  if (typeof next === "function") {
    next()
  }
})

// Backwards compatibility alias for imageUrl
gallerySchema.virtual("imageUrl").get(function () {
  return this.image
}).set(function (val) {
  this.image = val
})

gallerySchema.index({ createdAt: 1 })
gallerySchema.index({ eventDate: -1 })

export default mongoose.model("Gallery", gallerySchema, "gallery")
