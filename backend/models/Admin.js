import mongoose from "mongoose"

const adminSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, "Admin username is required."],
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: [true, "Admin password hash is required."],
    },
  },
  {
    timestamps: true,
  },
)

export default mongoose.model("Admin", adminSchema)

