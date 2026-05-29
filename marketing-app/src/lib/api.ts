export async function apiJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  })

  const text = await res.text()
  const json = text ? (JSON.parse(text) as unknown) : null
  if (!res.ok) {
    const message =
      typeof (json as any)?.error === 'string'
        ? (json as any).error
        : typeof (json as any)?.message === 'string'
          ? (json as any).message
          : `Request failed (${res.status})`
    throw new Error(message)
  }

  return json as T
}

