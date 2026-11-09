import mongoose from "mongoose"

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Category name is required."],
      trim: true,
      minlength: [2, "Category name must be at least 2 characters."],
      maxlength: [50, "Category name must be 50 characters or fewer."],
    },
    slug: {
      type: String,
      trim: true,
      lowercase: true,
    },
  },
  {
    timestamps: true,
  },
)

// Normalize name and generate slug before saving
categorySchema.pre("save", function (next) {
  if (this.name) {
    this.name = this.name.trim().replace(/\s+/g, " ")
    this.slug = this.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
  }
  next()
})

categorySchema.index(
  { name: 1 },
  { unique: true, collation: { locale: "en", strength: 2 } },
)

export default mongoose.model("Category", categorySchema)

