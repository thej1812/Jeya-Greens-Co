import mongoose from "mongoose"
import Testimonial from "../models/Testimonial.js"
import AppError from "../utils/AppError.js"

export const INITIAL_TESTIMONIALS = [
  {
    name: "Sophia Jenkins",
    text: "The freshness and care are obvious in every product. It feels honest, thoughtful and deeply connected to nature.",
  },
  {
    name: "Maya Wilson",
    text: "Beautifully made coconut essentials with flavours that remind me of home. The quality is consistently wonderful.",
  },
  {
    name: "Arun Kumar",
    text: "From the coconut oil to the traditional sweets, every order has arrived fresh, carefully packed and full of goodness.",
  },
]

// In-memory test store when MongoDB is not connected (e.g. offline unit testing)
let memoryTestimonials = INITIAL_TESTIMONIALS.map((t, index) => ({
  _id: new mongoose.Types.ObjectId().toString(),
  name: t.name,
  text: t.text,
  createdAt: new Date(Date.now() - (3 - index) * 86400000).toISOString(),
  updatedAt: new Date(Date.now() - (3 - index) * 86400000).toISOString(),
}))

/**
 * Idempotently seeds initial testimonials if none exist or if specific defaults are missing.
 * Does not overwrite or duplicate existing customer reviews.
 */
export async function seedInitialTestimonials() {
  if (mongoose.connection.readyState !== 1) return

  try {
    const total = await Testimonial.countDocuments()
    if (total === 0) {
      await Testimonial.insertMany(INITIAL_TESTIMONIALS)
      console.log(`[Seed] Inserted ${INITIAL_TESTIMONIALS.length} default testimonials into database.`)
      return
    }

    // If some testimonials exist, ensure none of the initial 3 are missing without duplicating
    for (const item of INITIAL_TESTIMONIALS) {
      const exists = await Testimonial.findOne({ name: item.name })
      if (!exists) {
        await Testimonial.create(item)
        console.log(`[Seed] Added missing default testimonial: "${item.name}"`)
      }
    }
  } catch (err) {
    console.error("[Seed] Notice: Could not check/seed testimonials:", err.message)
  }
}

/**
 * GET /api/testimonials
 * Public - list all testimonials (newest first)
 */
export async function getTestimonials(_req, res, next) {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(200).json({
        success: true,
        count: memoryTestimonials.length,
        data: [...memoryTestimonials],
      })
    }

    const testimonials = await Testimonial.find().sort({ createdAt: -1 })
    res.status(200).json({
      success: true,
      count: testimonials.length,
      data: testimonials,
    })
  } catch (err) {
    next(err)
  }
}

/**
 * GET /api/testimonials/:id
 * Public - fetch a single testimonial by ID
 */
export async function getTestimonialById(req, res, next) {
  try {
    if (mongoose.connection.readyState !== 1) {
      const found = memoryTestimonials.find((t) => t._id === req.params.id)
      if (!found) {
        throw new AppError("Testimonial not found.", 404)
      }
      return res.status(200).json({
        success: true,
        data: found,
      })
    }

    const testimonial = await Testimonial.findById(req.params.id)
    if (!testimonial) {
      throw new AppError("Testimonial not found.", 404)
    }
    res.status(200).json({
      success: true,
      data: testimonial,
    })
  } catch (err) {
    next(err)
  }
}

/**
 * POST /api/testimonials
 * Admin only - create a new testimonial
 */
export async function createTestimonial(req, res, next) {
  try {
    const name = typeof req.body?.name === "string" ? req.body.name.trim() : ""
    const text = typeof req.body?.text === "string" ? req.body.text.trim() : ""

    const errors = {}
    if (!name) {
      errors.name = "Customer name is required."
    } else if (name.length > 100) {
      errors.name = "Customer name cannot exceed 100 characters."
    }

    if (!text) {
      errors.text = "Customer feedback is required."
    } else if (text.length > 2000) {
      errors.text = "Customer feedback cannot exceed 2000 characters."
    }

    if (Object.keys(errors).length > 0) {
      throw new AppError("Please provide valid customer name and feedback.", 400, errors)
    }

    if (mongoose.connection.readyState !== 1) {
      const newTestimonial = {
        _id: new mongoose.Types.ObjectId().toString(),
        name,
        text,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      memoryTestimonials.unshift(newTestimonial)
      return res.status(201).json({
        success: true,
        message: "Testimonial created successfully.",
        data: newTestimonial,
      })
    }

    const testimonial = await Testimonial.create({ name, text })

    res.status(201).json({
      success: true,
      message: "Testimonial created successfully.",
      data: testimonial,
    })
  } catch (err) {
    next(err)
  }
}

/**
 * PUT /api/testimonials/:id
 * Admin only - update an existing testimonial
 */
export async function updateTestimonial(req, res, next) {
  try {
    const name = typeof req.body?.name === "string" ? req.body.name.trim() : ""
    const text = typeof req.body?.text === "string" ? req.body.text.trim() : ""

    const errors = {}
    if (!name) {
      errors.name = "Customer name is required."
    } else if (name.length > 100) {
      errors.name = "Customer name cannot exceed 100 characters."
    }

    if (!text) {
      errors.text = "Customer feedback is required."
    } else if (text.length > 2000) {
      errors.text = "Customer feedback cannot exceed 2000 characters."
    }

    if (Object.keys(errors).length > 0) {
      throw new AppError("Please provide valid customer name and feedback.", 400, errors)
    }

    if (mongoose.connection.readyState !== 1) {
      const index = memoryTestimonials.findIndex((t) => t._id === req.params.id)
      if (index === -1) {
        throw new AppError("Testimonial not found.", 404)
      }
      memoryTestimonials[index] = {
        ...memoryTestimonials[index],
        name,
        text,
        updatedAt: new Date().toISOString(),
      }
      return res.status(200).json({
        success: true,
        message: "Testimonial updated successfully.",
        data: memoryTestimonials[index],
      })
    }

    const testimonial = await Testimonial.findById(req.params.id)
    if (!testimonial) {
      throw new AppError("Testimonial not found.", 404)
    }

    testimonial.name = name
    testimonial.text = text
    await testimonial.save()

    res.status(200).json({
      success: true,
      message: "Testimonial updated successfully.",
      data: testimonial,
    })
  } catch (err) {
    next(err)
  }
}

/**
 * DELETE /api/testimonials/:id
 * Admin only - remove a testimonial
 */
export async function deleteTestimonial(req, res, next) {
  try {
    if (mongoose.connection.readyState !== 1) {
      const index = memoryTestimonials.findIndex((t) => t._id === req.params.id)
      if (index === -1) {
        throw new AppError("Testimonial not found.", 404)
      }
      memoryTestimonials.splice(index, 1)
      return res.status(200).json({
        success: true,
        message: "Testimonial deleted successfully.",
        data: null,
      })
    }

    const testimonial = await Testimonial.findById(req.params.id)
    if (!testimonial) {
      throw new AppError("Testimonial not found.", 404)
    }

    await testimonial.deleteOne()

    res.status(200).json({
      success: true,
      message: "Testimonial deleted successfully.",
      data: null,
    })
  } catch (err) {
    next(err)
  }
}
