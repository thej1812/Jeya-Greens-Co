import mongoose from "mongoose"

const testimonialSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Customer name is required."],
      trim: true,
      maxlength: [100, "Customer name cannot exceed 100 characters."],
    },
    text: {
      type: String,
      required: [true, "Customer feedback is required."],
      trim: true,
      maxlength: [2000, "Customer feedback cannot exceed 2000 characters."],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
)

testimonialSchema.index({ createdAt: -1 })

export default mongoose.model("Testimonial", testimonialSchema, "testimonials")

