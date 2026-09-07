// Minimal HTTP client used by the integration test suites.
const BASE = process.env.TEST_BASE || 'http://127.0.0.1:5199'

export function api(route, { method = 'GET', body, token } = {}) {
  const headers = {}
  if (token) headers.Authorization = `Bearer ${token}`
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  return fetch(`${BASE}/api${route}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  }).then(async (res) => {
    const data = await res.json().catch(() => null)
    return { status: res.status, data }
  })
}

// Unique per-quadrant test identity so parallel/rerun-safe and never collides
// with real production users.
let seq = 0
export const freshEmail = (tag) =>
  `qa-test-${tag}-${Date.now()}-${Math.floor(Math.random() * 1e5)}@test.booksetu`
