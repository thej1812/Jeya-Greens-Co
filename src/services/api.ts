/**
 * API Service for Jeya Greens & Co.
 * Handles product, gallery, authentication, and admin endpoints.
 */

function resolveApiBase(): string {
  const envUrl = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").trim().replace(/\/+$/, "")
  return envUrl.endsWith("/api") ? envUrl : `${envUrl}/api`
}

const API_BASE = resolveApiBase()

// Session-based in-memory token storage (also backed by sessionStorage for page reloads)
let inMemoryToken: string | null = null
try {
  inMemoryToken = sessionStorage.getItem("coconut_admin_token")
} catch {
  // Ignore sessionStorage access errors in restricted contexts
}

export function setAuthToken(token: string | null) {
  inMemoryToken = token
  try {
    if (token) {
      sessionStorage.setItem("coconut_admin_token", token)
    } else {
      sessionStorage.removeItem("coconut_admin_token")
    }
  } catch {
    // Ignore storage errors
  }
}

export function getAuthToken(): string | null {
  return inMemoryToken
}

function getAuthHeaders(): HeadersInit {
  const headers: Record<string, string> = {}
  if (inMemoryToken) {
    headers["Authorization"] = `Bearer ${inMemoryToken}`
  }
  return headers
}

export interface ProductItem {
  _id: string
  name: string
  type: string
  category?: string
  image: string
  imagePublicId?: string
  createdAt?: string
  updatedAt?: string
}

export interface CategoryItem {
  _id: string
  name: string
  slug?: string
  productCount?: number
  createdAt?: string
  updatedAt?: string
}

export interface GalleryItem {
  _id: string
  caption: string
  image: string
  imagePublicId?: string
  createdAt?: string
  updatedAt?: string
}

export interface TestimonialItem {
  _id: string
  name: string
  text: string
  createdAt?: string
  updatedAt?: string
}

export interface ApiResponse<T> {
  success: boolean
  message?: string
  count?: number
  data: T
}

// ==========================================
// Public Endpoints
// ==========================================

export async function fetchProducts(): Promise<ProductItem[]> {
  const res = await fetch(`${API_BASE}/products`, {
    headers: { Accept: "application/json" },
  })
  if (!res.ok) {
    throw new Error(`Failed to load products (HTTP ${res.status})`)
  }
  const json: ApiResponse<ProductItem[]> = await res.json()
  return json.data || []
}

export async function fetchGallery(): Promise<GalleryItem[]> {
  const res = await fetch(`${API_BASE}/gallery`, {
    headers: { Accept: "application/json" },
  })
  if (!res.ok) {
    throw new Error(`Failed to load gallery (HTTP ${res.status})`)
  }
  const json: ApiResponse<GalleryItem[]> = await res.json()
  return json.data || []
}

// ==========================================
// Authentication Endpoints
// ==========================================

export async function loginAdmin(username: string, password: string): Promise<{ username: string; token: string }> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    credentials: "include", // Sends & receives HttpOnly cookie
    body: JSON.stringify({ username, password }),
  })

  const json = await res.json()
  if (!res.ok || !json.success) {
    throw new Error(json.message || "Invalid credentials. Please try again.")
  }

  const token = json.data?.token || ""
  setAuthToken(token)
  return {
    username: json.data?.admin?.username || username,
    token,
  }
}

export async function checkAdminAuth(): Promise<{ username: string } | null> {
  try {
    const res = await fetch(`${API_BASE}/auth/me`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        ...getAuthHeaders(),
      },
      credentials: "include",
    })

    if (!res.ok) {
      setAuthToken(null)
      return null
    }

    const json = await res.json()
    if (json.success && json.data?.admin?.username) {
      return { username: json.data.admin.username }
    }
    return null
  } catch {
    return null
  }
}

export async function logoutAdmin(): Promise<void> {
  try {
    await fetch(`${API_BASE}/auth/logout`, {
      method: "POST",
      headers: getAuthHeaders(),
      credentials: "include",
    })
  } catch {
    // Ignore network failure on logout
  } finally {
    setAuthToken(null)
  }
}

// ==========================================
// Product CRUD (Admin Only)
// ==========================================

export async function createProduct(formData: FormData): Promise<ProductItem> {
  const res = await fetch(`${API_BASE}/products`, {
    method: "POST",
    headers: getAuthHeaders(),
    credentials: "include",
    body: formData,
  })

  const json = await res.json()
  if (!res.ok || !json.success) {
    throw new Error(json.message || "Failed to create product.")
  }
  return json.data
}

export async function updateProduct(id: string, formData: FormData): Promise<ProductItem> {
  const res = await fetch(`${API_BASE}/products/${id}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    credentials: "include",
    body: formData,
  })

  const json = await res.json()
  if (!res.ok || !json.success) {
    throw new Error(json.message || "Failed to update product.")
  }
  return json.data
}

export async function deleteProduct(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/products/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
    credentials: "include",
  })

  const json = await res.json()
  if (!res.ok || !json.success) {
    throw new Error(json.message || "Failed to delete product.")
  }
}

// ==========================================
// Category CRUD (Admin & Public)
// ==========================================

export async function fetchCategories(): Promise<CategoryItem[]> {
  const res = await fetch(`${API_BASE}/categories`, {
    headers: { Accept: "application/json" },
  })
  if (!res.ok) {
    throw new Error(`Failed to load categories (HTTP ${res.status})`)
  }
  const json: ApiResponse<CategoryItem[]> = await res.json()
  return json.data || []
}

export async function createCategory(name: string): Promise<CategoryItem> {
  const res = await fetch(`${API_BASE}/categories`, {
    method: "POST",
    headers: {
      ...getAuthHeaders(),
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    credentials: "include",
    body: JSON.stringify({ name }),
  })
  const json = await res.json()
  if (!res.ok || !json.success) {
    throw new Error(json.message || "Failed to create category.")
  }
  return json.data
}

export async function updateCategory(id: string, name: string): Promise<CategoryItem> {
  const res = await fetch(`${API_BASE}/categories/${id}`, {
    method: "PUT",
    headers: {
      ...getAuthHeaders(),
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    credentials: "include",
    body: JSON.stringify({ name }),
  })
  const json = await res.json()
  if (!res.ok || !json.success) {
    throw new Error(json.message || "Failed to update category.")
  }
  return json.data
}

export async function deleteCategory(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/categories/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
    credentials: "include",
  })
  const json = await res.json()
  if (!res.ok || !json.success) {
    throw new Error(json.message || "Failed to delete category.")
  }
}

// ==========================================
// Gallery CRUD (Admin Only)
// ==========================================

export async function createGalleryItem(formData: FormData): Promise<GalleryItem> {
  const res = await fetch(`${API_BASE}/gallery`, {
    method: "POST",
    headers: getAuthHeaders(),
    credentials: "include",
    body: formData,
  })

  const json = await res.json()
  if (!res.ok || !json.success) {
    throw new Error(json.message || "Failed to upload gallery image.")
  }
  return json.data
}

export async function updateGalleryItem(id: string, formData: FormData): Promise<GalleryItem> {
  const res = await fetch(`${API_BASE}/gallery/${id}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    credentials: "include",
    body: formData,
  })

  const json = await res.json()
  if (!res.ok || !json.success) {
    throw new Error(json.message || "Failed to update gallery image.")
  }
  return json.data
}

export async function deleteGalleryItem(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/gallery/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
    credentials: "include",
  })

  const json = await res.json()
  if (!res.ok || !json.success) {
    throw new Error(json.message || "Failed to delete gallery image.")
  }
}

// ==========================================
// Testimonial Endpoints (Public + Admin)
// ==========================================

export async function fetchTestimonials(): Promise<TestimonialItem[]> {
  const res = await fetch(`${API_BASE}/testimonials`, {
    headers: { Accept: "application/json" },
  })
  if (!res.ok) {
    throw new Error(`Failed to load testimonials (HTTP ${res.status})`)
  }
  const json: ApiResponse<TestimonialItem[]> = await res.json()
  return json.data || []
}

export async function createTestimonial(data: { name: string; text: string }): Promise<TestimonialItem> {
  const res = await fetch(`${API_BASE}/testimonials`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...getAuthHeaders(),
    },
    credentials: "include",
    body: JSON.stringify(data),
  })

  const json: ApiResponse<TestimonialItem> = await res.json()
  if (!res.ok || !json.success) {
    throw new Error(json.message || "Failed to create testimonial.")
  }
  return json.data
}

export async function updateTestimonial(id: string, data: { name: string; text: string }): Promise<TestimonialItem> {
  const res = await fetch(`${API_BASE}/testimonials/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...getAuthHeaders(),
    },
    credentials: "include",
    body: JSON.stringify(data),
  })

  const json: ApiResponse<TestimonialItem> = await res.json()
  if (!res.ok || !json.success) {
    throw new Error(json.message || "Failed to update testimonial.")
  }
  return json.data
}

export async function deleteTestimonial(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/testimonials/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
    credentials: "include",
  })

  const json = await res.json()
  if (!res.ok || !json.success) {
    throw new Error(json.message || "Failed to delete testimonial.")
  }
}


// ==========================================
// Contact Form (Public)
// ==========================================

export interface ContactEnquiry {
  name: string
  email: string
  enquiry: string
  message: string
}

export class ContactError extends Error {
  fieldErrors: Record<string, string>
  constructor(message: string, fieldErrors: Record<string, string> = {}) {
    super(message)
    this.name = "ContactError"
    this.fieldErrors = fieldErrors
  }
}

/** Sends an enquiry; resolves only after the backend confirms the email was accepted. */
export async function sendContactEnquiry(enquiry: ContactEnquiry): Promise<string> {
  let res: Response
  try {
    res = await fetch(`${API_BASE}/contact`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(enquiry),
    })
  } catch {
    throw new ContactError("We couldn't reach our server. Please check your connection and try again.")
  }

  let json: { success?: boolean; message?: string; errors?: Record<string, string> } | null = null
  try {
    json = await res.json()
  } catch {
    // Non-JSON response (e.g. proxy error page)
  }

  if (!res.ok || !json?.success) {
    throw new ContactError(
      json?.message || `Something went wrong (HTTP ${res.status}). Please try again.`,
      json?.errors || {},
    )
  }
  return json.message || "Thank you! Your enquiry has been sent."
}
