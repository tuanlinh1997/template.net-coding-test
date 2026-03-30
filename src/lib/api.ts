import { ENV } from "@/config/env"

export class ApiError extends Error {
  readonly status: number
  readonly body: unknown

  constructor(message: string, status: number, body: unknown) {
    super(message)
    this.name = "ApiError"
    this.status = status
    this.body = body
  }
}

export type ApiRequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown
}

export function resolveApiUrl(path: string): string {
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path
  }
  const base = (ENV.API_URL ?? "").replace(/\/$/, "")
  const segment = path.startsWith("/") ? path : `/${path}`
  return base ? `${base}${segment}` : segment
}

function shouldJsonEncode(body: unknown): boolean {
  if (body == null) return false
  if (typeof body !== "object") return false
  return !(
    body instanceof FormData ||
    body instanceof Blob ||
    body instanceof ArrayBuffer ||
    body instanceof URLSearchParams
  )
}

async function parseResponseBody(res: Response): Promise<unknown> {
  if (res.status === 204) return undefined
  const text = await res.text()
  if (!text) return undefined
  const ct = res.headers.get("content-type") ?? ""
  if (ct.includes("application/json")) {
    try {
      return JSON.parse(text) as unknown
    } catch {
      return text
    }
  }
  return text
}

function getErrorMessage(status: number, body: unknown, statusText: string): string {
  if (body && typeof body === "object" && "message" in body) {
    const m = (body as { message: unknown }).message
    if (typeof m === "string") return m
  }
  return statusText || `Request failed (${status})`
}

/**
 * Gọi API dùng chung: gắn `VITE_API_URL`, mặc định JSON body/parse, hỗ trợ FormData.
 *
 * @example
 * const user = await api<User>("/users/me")
 * await api("/items", { method: "POST", body: { name: "a" } })
 */
export async function api<T = unknown>(
  path: string,
  options: ApiRequestOptions = {}
): Promise<T> {
  const { body, headers: headersInit, ...init } = options
  const jsonBody = shouldJsonEncode(body)

  const headers = new Headers(headersInit)
  if (jsonBody && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json")
  }

  const res = await fetch(resolveApiUrl(path), {
    ...init,
    headers,
    body:
      body === undefined || body === null
        ? undefined
        : jsonBody
          ? JSON.stringify(body)
          : (body as BodyInit),
  })

  const data = await parseResponseBody(res)

  if (!res.ok) {
    throw new ApiError(
      getErrorMessage(res.status, data, res.statusText),
      res.status,
      data
    )
  }

  return data as T
}
