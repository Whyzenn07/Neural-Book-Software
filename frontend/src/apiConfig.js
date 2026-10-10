/**
 * Dynamic API Configuration for SKIPS
 * Supports Localhost, Cloudflare Tunnel, and Custom Remote Backend URL
 */

const DEFAULT_ONLINE_BACKEND = "https://matter-refine-obj-temporal.trycloudflare.com"

export function getApiBaseUrl() {
  // 1. User custom override in localStorage
  const saved = localStorage.getItem("skips_backend_url")
  if (saved && saved.trim()) {
    return saved.trim().replace(/\/$/, "")
  }

  // 2. If running on GitHub Pages (github.io)
  if (typeof window !== "undefined" && window.location.hostname.includes("github.io")) {
    return DEFAULT_ONLINE_BACKEND
  }

  // 3. Otherwise (localhost or served directly by FastAPI), use relative path
  return ""
}

export function getApiUrl(endpoint) {
  const base = getApiBaseUrl()
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`
  return base ? `${base}${cleanEndpoint}` : cleanEndpoint
}

export function setCustomBackendUrl(url) {
  if (!url || !url.trim()) {
    localStorage.removeItem("skips_backend_url")
  } else {
    localStorage.setItem("skips_backend_url", url.trim())
  }
}
