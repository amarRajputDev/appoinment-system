async function request(path: string, options: RequestInit = {}) {
  const res = await fetch(path, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.message || 'Request failed')
  return data
}

export const api = {
  get: (path: string) => request(path),
  post: (path: string, body?: unknown) =>
    request(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
  patch: (path: string, body?: unknown) =>
    request(path, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined }),
  put: (path: string, body?: unknown) =>
    request(path, { method: 'PUT', body: body ? JSON.stringify(body) : undefined }),
  delete: (path: string) => request(path, { method: 'DELETE' }),
}
