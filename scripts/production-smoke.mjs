const base = (process.env.CHUSKY_WEB_URL || "http://localhost:3000").replace(/\/+$/, "")
const checks = [
  ["public home", "/", 200],
  ["auth health", "/api/auth/ok", 200],
  ["authenticated shell", "/app/organizations", 200],
  ["protected API", "/v1/agents/templates", 401],
]

for (const [name, path, expected] of checks) {
  const response = await fetch(`${base}${path}`, { redirect: "manual" })
  if (response.status !== expected) throw new Error(`${name}: expected HTTP ${expected}, received ${response.status}`)
  if (path.startsWith("/app/") && response.headers.get("cache-control")?.includes("public")) throw new Error(`${name}: authenticated shell must not be publicly cached`)
  console.log(`ok  ${name}: ${response.status}`)
}

console.log(`Production smoke passed for ${base}. This checks routing and unauthenticated boundaries only; it does not replace signed-in browser or provider staging tests.`)
