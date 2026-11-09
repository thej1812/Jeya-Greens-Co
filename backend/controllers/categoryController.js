import mongoose from "mongoose"
import Category from "../models/Category.js"
import Product from "../models/Product.js"
import AppError from "../utils/AppError.js"

const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")

// In-memory test store when MongoDB is not connected (e.g. offline unit testing)
let memoryCategories = [
  { _id: "mock-cat-1", name: "Plant Care", productCount: 2 },
  { _id: "mock-cat-2", name: "Sweet", productCount: 2 },
]

/**
 * Ensures initial default categories exist based on existing products and defaults.
 */
async function ensureDefaultCategories() {
  if (mongoose.connection.readyState !== 1) return

  const count = await Category.countDocuments()
  if (count > 0) return

  // Seed default categories and distinct categories from existing products
  const productTypes = await Product.distinct("type")
  const defaultNames = ["Sweet", "Plant Care"]
  const combined = Array.from(new Set([...defaultNames, ...productTypes.filter(Boolean)]))

  for (const name of combined) {
    const trimmed = name.trim().replace(/\s+/g, " ")
    if (trimmed) {
      await Category.findOneAndUpdate(
        { name: { $regex: new RegExp(`^${escapeRegex(trimmed)}$`, "i") } },
        { name: trimmed },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      )
    }
  }
}

/**
 * GET /api/categories
 * Returns all categories with active product counts.
 */
export async function getCategories(_req, res) {
  if (mongoose.connection.readyState !== 1) {
    return res.status(200).json({
      success: true,
      count: memoryCategories.length,
      data: memoryCategories,
    })
  }

  await ensureDefaultCategories()

  const categories = await Category.find().sort({ name: 1 }).lean()

  // Attach live product count to each category
  const categoriesWithCounts = await Promise.all(
    categories.map(async (cat) => {
      const productCount = await Product.countDocuments({
        $or: [
          { type: { $regex: new RegExp(`^${escapeRegex(cat.name)}$`, "i") } },
          { category: { $regex: new RegExp(`^${escapeRegex(cat.name)}$`, "i") } },
        ],
      })
      return {
        ...cat,
        productCount,
      }
    }),
  )

  res.status(200).json({
    success: true,
    count: categoriesWithCounts.length,
    data: categoriesWithCounts,
  })
}

/**
 * POST /api/categories (Admin only)
 * Creates a new category. Case-insensitive duplicate check.
 */
export async function createCategory(req, res) {
  const rawName = typeof req.body?.name === "string" ? req.body.name.trim() : ""
  const name = rawName.replace(/\s+/g, " ")

  if (!name || name.length < 2) {
    throw new AppError("Category name must be at least 2 characters.", 400, {
      name: "Category name must be at least 2 characters.",
    })
  }

  if (name.length > 50) {
    throw new AppError("Category name must be 50 characters or fewer.", 400, {
      name: "Category name must be 50 characters or fewer.",
    })
  }

  if (mongoose.connection.readyState !== 1) {
    const existing = memoryCategories.find(
      (c) => c.name.toLowerCase() === name.toLowerCase(),
    )
    if (existing) {
      throw new AppError(`Category "${existing.name}" already exists.`, 409, {
        name: `Category "${existing.name}" already exists.`,
      })
    }
    const newCat = { _id: `mock-cat-${Date.now()}`, name, productCount: 0 }
    memoryCategories.push(newCat)
    return res.status(201).json({
      success: true,
      message: `Category "${name}" created successfully.`,
      data: newCat,
    })
  }

  // Duplicate check (case-insensitive)
  const existing = await Category.findOne({
    name: { $regex: new RegExp(`^${escapeRegex(name)}$`, "i") },
  })
  if (existing) {
    throw new AppError(`Category "${existing.name}" already exists.`, 409, {
      name: `Category "${existing.name}" already exists.`,
    })
  }

  const category = await Category.create({ name })

  res.status(201).json({
    success: true,
    message: `Category "${category.name}" created successfully.`,
    data: {
      ...category.toObject(),
      productCount: 0,
    },
  })
}

/**
 * PUT /api/categories/:id (Admin only)
 * Renames an existing category and automatically updates assigned products.
 */
export async function updateCategory(req, res) {
  const rawName = typeof req.body?.name === "string" ? req.body.name.trim() : ""
  const name = rawName.replace(/\s+/g, " ")

  if (!name || name.length < 2) {
    throw new AppError("Category name must be at least 2 characters.", 400, {
      name: "Category name must be at least 2 characters.",
    })
  }

  if (name.length > 50) {
    throw new AppError("Category name must be 50 characters or fewer.", 400, {
      name: "Category name must be 50 characters or fewer.",
    })
  }

  if (mongoose.connection.readyState !== 1) {
    const cat = memoryCategories.find((c) => c._id === req.params.id)
    if (!cat) throw new AppError("Category not found.", 404)
    const duplicate = memoryCategories.find(
      (c) => c._id !== req.params.id && c.name.toLowerCase() === name.toLowerCase(),
    )
    if (duplicate) throw new AppError(`Category "${duplicate.name}" already exists.`, 409)
    cat.name = name
    return res.status(200).json({
      success: true,
      message: `Category renamed to "${name}".`,
      data: cat,
    })
  }

  const category = await Category.findById(req.params.id)
  if (!category) {
    throw new AppError("Category not found.", 404)
  }

  const oldName = category.name

  // Duplicate check against other categories
  const duplicate = await Category.findOne({
    _id: { $ne: category._id },
    name: { $regex: new RegExp(`^${escapeRegex(name)}$`, "i") },
  })
  if (duplicate) {
    throw new AppError(`Category "${duplicate.name}" already exists.`, 409, {
      name: `Category "${duplicate.name}" already exists.`,
    })
  }

  category.name = name
  await category.save()

  // Update any products that used the old category name
  if (oldName !== name) {
    await Product.updateMany(
      {
        $or: [
          { type: { $regex: new RegExp(`^${escapeRegex(oldName)}$`, "i") } },
          { category: { $regex: new RegExp(`^${escapeRegex(oldName)}$`, "i") } },
        ],
      },
      {
        $set: { type: name, category: name },
      },
    )
  }

  const productCount = await Product.countDocuments({
    $or: [{ type: name }, { category: name }],
  })

  res.status(200).json({
    success: true,
    message: `Category renamed to "${name}".`,
    data: {
      ...category.toObject(),
      productCount,
    },
  })
}

/**
 * DELETE /api/categories/:id (Admin only)
 * Deletes category if and only if no product is currently using it.
 */
export async function deleteCategory(req, res) {
  if (mongoose.connection.readyState !== 1) {
    const idx = memoryCategories.findIndex((c) => c._id === req.params.id)
    if (idx === -1) throw new AppError("Category not found.", 404)
    if (memoryCategories[idx].productCount > 0) {
      throw new AppError(
        `Cannot delete category "${memoryCategories[idx].name}" because it is currently assigned to ${memoryCategories[idx].productCount} product(s). Please reassign those products first.`,
        400,
      )
    }
    const [deleted] = memoryCategories.splice(idx, 1)
    return res.status(200).json({
      success: true,
      message: `Category "${deleted.name}" deleted successfully.`,
    })
  }

  const category = await Category.findById(req.params.id)
  if (!category) {
    throw new AppError("Category not found.", 404)
  }

  const productCount = await Product.countDocuments({
    $or: [
      { type: { $regex: new RegExp(`^${escapeRegex(category.name)}$`, "i") } },
      { category: { $regex: new RegExp(`^${escapeRegex(category.name)}$`, "i") } },
    ],
  })

  if (productCount > 0) {
    throw new AppError(
      `Cannot delete category "${category.name}" because it is currently assigned to ${productCount} product(s). Please reassign those products first.`,
      400,
    )
  }

  await category.deleteOne()

  res.status(200).json({
    success: true,
    message: `Category "${category.name}" deleted successfully.`,
  })
}
