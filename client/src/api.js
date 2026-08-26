const BASE = import.meta.env.VITE_API_URL || ''

export const getToken = () => localStorage.getItem('bs_token')
export const setToken = (t) =>
  t ? localStorage.setItem('bs_token', t) : localStorage.removeItem('bs_token')

async function request(path, { method = 'GET', body } = {}) {
  const headers = {}
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`

  let res
  try {
    res = await fetch(`${BASE}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw Object.assign(new Error('Could not connect to server — is the backend running?'), {
      status: 0,
    })
  }

  const data = await res.json().catch(() => null)
  if (!res.ok) {
    throw Object.assign(new Error(data?.message || 'Something went wrong'), {
      status: res.status,
    })
  }
  return data
}

export const api = {
  get: (p) => request(p),
  post: (p, body) => request(p, { method: 'POST', body }),
  patch: (p, body) => request(p, { method: 'PATCH', body }),
  put: (p, body) => request(p, { method: 'PUT', body }),
  del: (p, body) => request(p, { method: 'DELETE', body }),
}
