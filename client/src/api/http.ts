const ENV = (import.meta as any).env || {}
const HOST = (ENV.BACKEND_HOST as string) || ''
const PORT = (ENV.BACKEND_PORT as string) || ''
const ABS = (ENV.BACKEND_ABSOLUTE as string) || ''

function isBrowserResolvableHost(host: string): boolean {
  if (!host) return false
  if (host === 'localhost') return true
  if (host.includes('.')) return true // domain or IP
  return false // likely docker internal hostname like "backend"
}

function withBase(url: string): string {
  // If not configured, use same-origin to leverage Vite proxy in dev
  if (!HOST || !PORT) return url

  // If an absolute URL is provided in HOST, use as-is
  if (HOST.startsWith('http://') || HOST.startsWith('https://')) {
    const base = HOST.replace(/\/$/, '')
    return `${base}${url.startsWith('/') ? url : `/${url}`}`
  }

  // Only build absolute URL when browser can resolve HOST, or explicitly forced
  if (ABS === 'true' || isBrowserResolvableHost(HOST)) {
    const protocol = window.location?.protocol || 'http:'
    return `${protocol}//${HOST}:${PORT}${url.startsWith('/') ? url : `/${url}`}`
  }

  // Otherwise, fall back to relative to let the dev server proxy to backend
  return url
}

export async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(withBase(url))
  if (!res.ok) throw new Error(`GET ${url} failed: ${res.status}`)
  return res.json() as Promise<T>
}

export async function postJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(withBase(url), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })
  if (!res.ok) throw new Error(`POST ${url} failed: ${res.status}`)
  return res.json() as Promise<T>
}

