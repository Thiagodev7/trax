/** Server-side fetch for public shared reports — no auth redirect. */
export async function sharedReportRequest<T>(path: string, domain: string): Promise<T> {
  const apiUrl = process.env.API_URL ?? 'http://localhost:3000'
  const res = await fetch(`${apiUrl}/api/v1${path}`, {
    headers: {
      'Content-Type': 'application/json',
      'X-Agency-Domain': domain,
    },
    cache: 'no-store',
  })

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }))
    throw new Error(error.message || `API Error: ${res.status}`)
  }

  return res.json() as Promise<T>
}
