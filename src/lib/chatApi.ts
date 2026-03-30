import { api, ApiError, resolveApiUrl } from "@/lib/api"

export type ChatPromptBody = {
  message: string
}

/** POST JSON một lần (không stream). */
export function sendChatPrompt(body: ChatPromptBody) {
  return api<unknown>("/chat", { method: "POST", body })
}

export function extractAssistantText(data: unknown): string | null {
  if (data == null) return null
  if (typeof data === "string") return data
  if (typeof data !== "object") return null
  const o = data as Record<string, unknown>
  if (typeof o.reply === "string") return o.reply
  if (typeof o.message === "string") return o.message
  if (typeof o.content === "string") return o.content
  if (typeof o.data === "string") return o.data
  return null
}

export type StreamChatHandlers = {
  onChunk: (text: string) => void
  onDone?: () => void
}

function parseJsonChunk(s: string): string | null {
  if (!s) return null
  try {
    const j = JSON.parse(s) as unknown
    if (typeof j === "string") return j
    if (typeof j !== "object" || j === null) return null
    const o = j as Record<string, unknown>
    if (typeof o.content === "string") return o.content
    if (typeof o.delta === "string") return o.delta
    if (typeof o.text === "string") return o.text
    if (typeof o.token === "string") return o.token
    const choices = o.choices
    if (Array.isArray(choices) && choices[0] && typeof choices[0] === "object") {
      const delta = (choices[0] as { delta?: { content?: string } }).delta
      if (delta?.content) return delta.content
    }
  } catch {
    return s
  }
  return null
}

function extractChunkFromLine(line: string): string | null {
  const trimmed = line.trim()
  if (!trimmed || trimmed.startsWith(":")) return null
  if (trimmed.startsWith("data:")) {
    const payload = trimmed.slice(5).trim()
    if (payload === "[DONE]") return null
    return parseJsonChunk(payload)
  }
  return parseJsonChunk(trimmed)
}

async function consumeSSELines(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  onChunk: (text: string) => void
): Promise<void> {
  const decoder = new TextDecoder()
  let buffer = ""
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    let idx: number
    while ((idx = buffer.indexOf("\n")) >= 0) {
      const line = buffer.slice(0, idx).replace(/\r$/, "")
      buffer = buffer.slice(idx + 1)
      const extracted = extractChunkFromLine(line)
      if (extracted) onChunk(extracted)
    }
  }
  buffer += decoder.decode()
  if (buffer.trim()) {
    for (const line of buffer.split("\n")) {
      const extracted = extractChunkFromLine(line.replace(/\r$/, ""))
      if (extracted) onChunk(extracted)
    }
  }
}

async function consumeRawText(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  onChunk: (text: string) => void
): Promise<void> {
  const decoder = new TextDecoder()
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    const chunk = decoder.decode(value, { stream: true })
    if (chunk) onChunk(chunk)
  }
}

async function readErrorBody(res: Response): Promise<unknown> {
  const errText = await res.text()
  if (!errText) return undefined
  try {
    return JSON.parse(errText) as unknown
  } catch {
    return errText
  }
}

/**
 * Đọc phản hồi streaming (SSE `text/event-stream` hoặc text/plain từng chunk).
 * Body gửi `{ message, stream: true }` — chỉnh path/body theo backend thực tế.
 */
export async function streamChatPrompt(
  body: ChatPromptBody,
  handlers: StreamChatHandlers
): Promise<void> {
  const url = resolveApiUrl("/chat")
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "text/event-stream, application/json",
    },
    body: JSON.stringify({ ...body, stream: true }),
  })

  if (!res.ok) {
    const data = await readErrorBody(res)
    const msg =
      data && typeof data === "object" && "message" in data
        ? String((data as { message: unknown }).message)
        : res.statusText
    throw new ApiError(msg || `Request failed (${res.status})`, res.status, data)
  }

  const reader = res.body?.getReader()
  if (!reader) {
    throw new Error("Response has no body")
  }

  const ct = res.headers.get("content-type") ?? ""
  if (ct.includes("text/event-stream")) {
    await consumeSSELines(reader, handlers.onChunk)
  } else {
    await consumeRawText(reader, handlers.onChunk)
  }

  handlers.onDone?.()
}
