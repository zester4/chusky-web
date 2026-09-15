/** @type {import('next').NextConfig} */
function apiOrigin() {
  const value = process.env.CHUSKY_API_ORIGIN || (process.env.NODE_ENV === "production" ? "https://chusky.up.railway.app" : "http://localhost:8080")
  let parsed
  try { parsed = new URL(value) } catch { throw new Error("CHUSKY_API_ORIGIN must be an absolute URL") }
  const local = ["localhost", "127.0.0.1", "[::1]"].includes(parsed.hostname)
  if ((!local && parsed.protocol !== "https:") || (local && !["http:", "https:"].includes(parsed.protocol))) throw new Error("CHUSKY_API_ORIGIN must use HTTPS outside local development")
  if (parsed.username || parsed.password || parsed.search || parsed.hash || !["", "/"].includes(parsed.pathname)) throw new Error("CHUSKY_API_ORIGIN must be an origin without credentials, path, query, or hash")
  return parsed.origin
}

const chuskyApiOrigin = apiOrigin()

const nextConfig = {
  images: {
    unoptimized: true,
  },
  async headers() {
    return [{
      source: "/(.*)",
      headers: [
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ...(process.env.NODE_ENV === "production" ? [{ key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" }] : []),
      ],
    }]
  },
  async rewrites() {
    return [
      {
        source: "/api/auth/:path*",
        destination: `${chuskyApiOrigin}/api/auth/:path*`,
      },
      {
        source: "/v1/:path*",
        destination: `${chuskyApiOrigin}/v1/:path*`,
      },
      {
        source: "/public/:path*",
        destination: `${chuskyApiOrigin}/public/:path*`,
      },
    ]
  },
}

export default nextConfig
