/**
 * Middleware to parse standard HTTP Cookie headers into `req.cookies`.
 * Zero external dependency, parses raw cookie strings safely.
 */
export function cookieParser(req, _res, next) {
  req.cookies = {}
  const header = req.headers?.cookie
  if (typeof header === "string" && header.length > 0) {
    const pairs = header.split(";")
    for (const pair of pairs) {
      const idx = pair.indexOf("=")
      if (idx > -1) {
        const key = pair.slice(0, idx).trim()
        const rawVal = pair.slice(idx + 1).trim()
        if (key) {
          try {
            req.cookies[key] = decodeURIComponent(rawVal)
          } catch {
            req.cookies[key] = rawVal
          }
        }
      }
    }
  }
  next()
}

