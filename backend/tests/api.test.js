import { describe, it, before, after } from "node:test"
import assert from "node:assert/strict"
import http from "node:http"
import { createApp } from "../app.js"

describe("Coconut API Integration Tests (Native HTTP via Named Pipe)", () => {
  let server
  let pipe
  let adminToken

  function apiRequest({ method = "GET", path = "/", headers = {}, body = null }) {
    return new Promise((resolve, reject) => {
      let payload = null
      const reqHeaders = {
        "x-forwarded-for": "127.0.0.1",
        ...headers,
      }

      if (Buffer.isBuffer(body)) {
        payload = body
        reqHeaders["Content-Length"] = body.length
      } else if (body && typeof body === "object") {
        payload = JSON.stringify(body)
        if (!reqHeaders["Content-Type"]) {
          reqHeaders["Content-Type"] = "application/json"
        }
        reqHeaders["Content-Length"] = Buffer.byteLength(payload)
      } else if (typeof body === "string") {
        payload = body
        reqHeaders["Content-Length"] = Buffer.byteLength(payload)
      }

      const req = http.request(
        {
          socketPath: pipe,
          path,
          method,
          headers: reqHeaders,
        },
        (res) => {
          const chunks = []
          res.on("data", (chunk) => {
            chunks.push(chunk)
          })
          res.on("end", () => {
            const raw = Buffer.concat(chunks).toString("utf8")
            let json = null
            try {
              json = JSON.parse(raw)
            } catch {}
            resolve({
              status: res.statusCode,
              headers: res.headers,
              text: () => Promise.resolve(raw),
              json: () => Promise.resolve(json),
            })
          })
        },
      )

      req.on("error", reject)
      if (payload) req.write(payload)
      req.end()
    })
  }

  function createMultipart({ fields = {}, file = null }) {
    const boundary = "----TestBoundary" + Math.random().toString(36).slice(2)
    const chunks = []

    for (const [key, val] of Object.entries(fields)) {
      chunks.push(
        Buffer.from(
          `--${boundary}\r\nContent-Disposition: form-data; name="${key}"\r\n\r\n${val}\r\n`,
        ),
      )
    }

    if (file) {
      const header = `--${boundary}\r\nContent-Disposition: form-data; name="${file.fieldname || "image"}"; filename="${file.filename || "test.jpg"}"\r\nContent-Type: ${file.mimetype || "image/jpeg"}\r\n\r\n`
      chunks.push(Buffer.from(header))
      chunks.push(file.buffer)
      chunks.push(Buffer.from("\r\n"))
    }

    chunks.push(Buffer.from(`--${boundary}--\r\n`))

    return {
      contentType: `multipart/form-data; boundary=${boundary}`,
      body: Buffer.concat(chunks),
    }
  }

  before(async () => {
    process.env.NODE_ENV = "test"
    process.env.JWT_SECRET = "super-secret-jwt-key-with-over-32-characters-for-testing"
    process.env.ADMIN_USERNAME = "testadmin"
    process.env.ADMIN_PASSWORD = "testpassword123"
    process.env.MAX_IMAGE_SIZE_MB = "10"
    process.env.MOCK_SMTP = "true"

    pipe = "\\\\.\\pipe\\coconut-test-api-" + Date.now()
    const app = createApp()
    server = http.createServer(app)
    await new Promise((resolve) => server.listen(pipe, resolve))

    // Pre-authenticate admin for protected tests
    const loginRes = await apiRequest({
      method: "POST",
      path: "/api/auth/login",
      body: { username: "testadmin", password: "testpassword123" },
    })
    const loginJson = await loginRes.json()
    adminToken = loginJson?.data?.token
  })

  after(async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve))
    }
  })

  it("GET /api/health should return ok status", async () => {
    const res = await apiRequest({ method: "GET", path: "/api/health" })
    assert.equal(res.status, 200)
    const body = await res.json()
    assert.equal(body.success, true)
    assert.equal(body.data.status, "ok")
  })

  it("POST /api/products should reject unauthenticated requests with 401", async () => {
    const res = await apiRequest({
      method: "POST",
      path: "/api/products",
      body: { name: "Coconut Water", type: "Drink" },
    })
    assert.equal(res.status, 401)
    const body = await res.json()
    assert.equal(body.success, false)
  })

  it("POST /api/gallery should reject unauthenticated requests with 401", async () => {
    const res = await apiRequest({
      method: "POST",
      path: "/api/gallery",
      body: { caption: "Harvesting fresh coconuts" },
    })
    assert.equal(res.status, 401)
    const body = await res.json()
    assert.equal(body.success, false)
  })

  it("GET /api/admin/dashboard should reject unauthenticated requests with 401", async () => {
    const res = await apiRequest({
      method: "GET",
      path: "/api/admin/dashboard",
    })
    assert.equal(res.status, 401)
    const body = await res.json()
    assert.equal(body.success, false)
  })

  it("POST /api/auth/login should reject empty credentials with 400", async () => {
    const res = await apiRequest({
      method: "POST",
      path: "/api/auth/login",
      body: { username: "", password: "" },
    })
    assert.equal(res.status, 400)
    const body = await res.json()
    assert.equal(body.success, false)
  })

  it("POST /api/auth/login should reject incorrect password with 401", async () => {
    const res = await apiRequest({
      method: "POST",
      path: "/api/auth/login",
      body: { username: "testadmin", password: "wrongpassword" },
    })
    assert.equal(res.status, 401)
    const body = await res.json()
    assert.equal(body.success, false)
    assert.match(body.message, /invalid username or password/i)
  })

  it("POST /api/auth/login should authenticate valid admin and issue JWT + HttpOnly cookie", async () => {
    const res = await apiRequest({
      method: "POST",
      path: "/api/auth/login",
      body: { username: "testadmin", password: "testpassword123" },
    })
    assert.equal(res.status, 200)
    const body = await res.json()
    assert.equal(body.success, true)
    assert.ok(body.data.token)
    assert.equal(body.data.admin.username, "testadmin")

    const setCookie = res.headers["set-cookie"]
    assert.ok(setCookie, "Response should set-cookie")
    const cookieStr = Array.isArray(setCookie) ? setCookie.join("; ") : String(setCookie)
    assert.match(cookieStr, /adminToken=/i)
    assert.match(cookieStr, /HttpOnly/i)
  })

  it("GET /api/auth/me should verify active admin session via Bearer token", async () => {
    const meRes = await apiRequest({
      method: "GET",
      path: "/api/auth/me",
      headers: { Authorization: `Bearer ${adminToken}` },
    })
    assert.equal(meRes.status, 200)
    const meBody = await meRes.json()
    assert.equal(meBody.data.admin.username, "testadmin")
  })

  it("GET /api/auth/me should verify active admin session via HttpOnly cookie", async () => {
    const loginRes = await apiRequest({
      method: "POST",
      path: "/api/auth/login",
      body: { username: "testadmin", password: "testpassword123" },
    })
    const setCookie = loginRes.headers["set-cookie"]
    const cookieHeader = Array.isArray(setCookie) ? setCookie[0] : String(setCookie)
    const tokenMatch = cookieHeader.match(/adminToken=([^;]+)/)
    assert.ok(tokenMatch)

    const meRes = await apiRequest({
      method: "GET",
      path: "/api/auth/me",
      headers: { Cookie: `adminToken=${tokenMatch[1]}` },
    })
    assert.equal(meRes.status, 200)
    const meBody = await meRes.json()
    assert.equal(meBody.data.admin.username, "testadmin")
  })

  it("POST /api/auth/logout should clear the admin session cookie", async () => {
    const res = await apiRequest({
      method: "POST",
      path: "/api/auth/logout",
    })
    assert.equal(res.status, 200)
    const setCookie = res.headers["set-cookie"]
    assert.ok(setCookie)
    const cookieStr = Array.isArray(setCookie) ? setCookie.join("; ") : String(setCookie)
    assert.match(cookieStr, /adminToken=;/i)
  })

  // ==========================================
  // Image Upload Size & Validation Tests (10 MB)
  // ==========================================

  it("POST /api/products should reject an image exceeding 10 MB with 413 and clear message", async () => {
    const oversizedBuffer = Buffer.alloc(10.5 * 1024 * 1024)
    oversizedBuffer.set([0xff, 0xd8, 0xff, 0xe0], 0) // JPEG header

    const multipart = createMultipart({
      fields: { name: "Oversized Coconut Oil", type: "Care" },
      file: {
        fieldname: "image",
        filename: "large.jpg",
        mimetype: "image/jpeg",
        buffer: oversizedBuffer,
      },
    })

    const res = await apiRequest({
      method: "POST",
      path: "/api/products",
      headers: {
        Authorization: `Bearer ${adminToken}`,
        "Content-Type": multipart.contentType,
      },
      body: multipart.body,
    })

    assert.equal(res.status, 413)
    const body = await res.json()
    assert.equal(body.success, false)
    assert.match(body.message, /10 MB/i)
  })

  it("POST /api/gallery should reject a gallery image exceeding 10 MB with 413", async () => {
    const oversizedBuffer = Buffer.alloc(10.5 * 1024 * 1024)
    oversizedBuffer.set([0xff, 0xd8, 0xff, 0xe0], 0)

    const multipart = createMultipart({
      fields: { caption: "Oversized plantation photo" },
      file: {
        fieldname: "image",
        filename: "large-gallery.jpg",
        mimetype: "image/jpeg",
        buffer: oversizedBuffer,
      },
    })

    const res = await apiRequest({
      method: "POST",
      path: "/api/gallery",
      headers: {
        Authorization: `Bearer ${adminToken}`,
        "Content-Type": multipart.contentType,
      },
      body: multipart.body,
    })

    assert.equal(res.status, 413)
    const body = await res.json()
    assert.equal(body.success, false)
    assert.match(body.message, /10 MB/i)
  })

  it("POST /api/products should reject non-image file with 400", async () => {
    const fakeBuffer = Buffer.from("<html><body>Not an image</body></html>")

    const multipart = createMultipart({
      fields: { name: "Fake Image Product", type: "Care" },
      file: {
        fieldname: "image",
        filename: "script.jpg",
        mimetype: "image/jpeg",
        buffer: fakeBuffer,
      },
    })

    const res = await apiRequest({
      method: "POST",
      path: "/api/products",
      headers: {
        Authorization: `Bearer ${adminToken}`,
        "Content-Type": multipart.contentType,
      },
      body: multipart.body,
    })

    assert.equal(res.status, 400)
    const body = await res.json()
    assert.equal(body.success, false)
    assert.match(body.message, /not a valid image/i)
  })

  it("POST /api/products should reject disallowed mime types with 400", async () => {
    const pdfBuffer = Buffer.from("%PDF-1.4 header text")

    const multipart = createMultipart({
      fields: { name: "Document Product", type: "Care" },
      file: {
        fieldname: "image",
        filename: "manual.pdf",
        mimetype: "application/pdf",
        buffer: pdfBuffer,
      },
    })

    const res = await apiRequest({
      method: "POST",
      path: "/api/products",
      headers: {
        Authorization: `Bearer ${adminToken}`,
        "Content-Type": multipart.contentType,
      },
      body: multipart.body,
    })

    assert.equal(res.status, 400)
    const body = await res.json()
    assert.equal(body.success, false)
    assert.match(body.message, /Only JPG, JPEG, PNG, and WebP/i)
  })

  // ==========================================
  // Contact Us API Tests
  // ==========================================

  it("POST /api/contact should reject missing or invalid fields with 400", async () => {
    const res = await apiRequest({
      method: "POST",
      path: "/api/contact",
      body: { name: "", email: "invalid-email", enquiry: "", message: "" },
    })
    assert.equal(res.status, 400)
    const body = await res.json()
    assert.equal(body.success, false)
    assert.ok(body.errors?.email)
    assert.ok(body.errors?.name)
  })

  it("POST /api/contact should accept valid enquiry submission with 200", async () => {
    const res = await apiRequest({
      method: "POST",
      path: "/api/contact",
      body: {
        name: "Test Customer",
        email: "customer@example.com",
        enquiry: "Wholesale Coconut Sweets",
        message: "Hello, I would like to enquire about placing a bulk order for Coconut Burfi.",
      },
    })
    assert.equal(res.status, 200)
    const body = await res.json()
    assert.equal(body.success, true)
    assert.match(body.message, /in touch soon/i)
  })
})
