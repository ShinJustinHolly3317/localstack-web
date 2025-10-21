const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL?.replace(/\/$/, '') || ''

function withBase(url: string): string {
  if (!API_BASE) return url
  return `${API_BASE}${url.startsWith('/') ? url : `/${url}`}`
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

