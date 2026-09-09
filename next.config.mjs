/** @type {import('next').NextConfig} */
const chuskyApiOrigin = (
  process.env.CHUSKY_API_ORIGIN ||
  process.env.NEXT_PUBLIC_AUTH_URL ||
  (process.env.NODE_ENV === "production" ? "https://chusky.up.railway.app" : "http://localhost:8080")
).replace(/\/+$/, "")

const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
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
    ]
  },
}

export default nextConfig
