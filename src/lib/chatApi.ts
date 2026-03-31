import { api, ApiError, resolveApiUrl } from "@/lib/api"
import type { ApiResponse, Chat, Message, Pagination } from "@/types/chat"
import { getOrCreateClientId } from "@/utils/helper"

export type ChatPromptBody = {
  message: string
}

/** Get or create chat */
export const getOrCreateChat = async () => {
  const clientId = getOrCreateClientId()
  return api<ApiResponse<Chat>>(`chat/${clientId}`)
}

//** Get messages trong chat */
export const getMessages = async (chatId: number) => {
  const res = await api<ApiResponse<Pagination<Message>>>(
    `/chat/${chatId}/messages?page=1&limit=999`
  )
  return res.data
}

export type StreamChatHandlers = {
  onChunk: (text: string) => void
  onDone?: () => void
}

export function extractAssistantTextFromResponse(data: unknown): string | null {
  if (data == null) return null

  // Nếu backend bọc theo ApiResponse -> lấy `data` bên trong
  const payload =
    typeof data === "object" && "data" in data
      ? (data as { data: unknown }).data
      : data

  if (typeof payload === "string") return payload

  if (payload && typeof payload === "object") {
    const o = payload as Record<string, unknown>
    const direct =
      (typeof o.content === "string" && o.content) ||
      (typeof o.reply === "string" && o.reply) ||
      (typeof o.message === "string" && o.message) ||
      (typeof o.text === "string" && o.text)
    if (direct) return direct
    const choices = o.choices
    if (Array.isArray(choices) && choices.length > 0) {
      const c0 = choices[0] as Record<string, unknown>
      const msgAny = c0.message as unknown
      const msgContent =
        msgAny && typeof msgAny === "object" && "content" in msgAny
          ? typeof (msgAny as { content?: unknown }).content === "string"
            ? (msgAny as { content: string }).content
            : null
          : null
      if (msgContent) return msgContent

      const deltaAny = c0.delta as unknown
      const deltaContent =
        deltaAny && typeof deltaAny === "object" && "content" in deltaAny
          ? typeof (deltaAny as { content?: unknown }).content === "string"
            ? (deltaAny as { content: string }).content
            : null
          : null
      if (deltaContent) return deltaContent
    }

    // Nếu trả về list messages: { items: [...] } / { messages: [...] }
    const list = (Array.isArray(o.items) ? o.items : Array.isArray(o.messages) ? o.messages : null) as
      | unknown[]
      | null
    if (list) {
      const aiItem = list.find((it) => {
        if (!it || typeof it !== "object") return false
        const m = it as Record<string, unknown>
        const sender = m.sender
        const role = m.role
        return (
          sender === "ai" ||
          role === "ai" ||
          sender === "assistant" ||
          role === "assistant"
        )
      })
      if (aiItem && typeof aiItem === "object") {
        const m = aiItem as Record<string, unknown>
        const content = m.content
        if (typeof content === "string") return content
        const message = m.message
        if (typeof message === "string") return message
      }
    }
  }

  return null
}

/**
 * REST call (không streaming): gửi prompt và nhận response 1 lần.
 * 
 */
export async function sendChatPrompt(
  chatId: number,
  payload: ChatPromptBody & { files?: File[] }
): Promise<unknown> {
  const { message, files = [] } = payload

  // Nếu có file -> gửi FormData để upload ảnh/file cùng prompt.
  if (files.length > 0) {
    const form = new FormData()
    form.append("message", message)
    form.append("stream", "false")
    files.forEach((file) => {
      form.append("files", file)
    })

    return api<unknown>(`/chat/${chatId}/messages`, {
      method: "POST",
      body: form,
    })
  }

  // Không có file -> giữ cách gửi JSON như cũ.
  return api<unknown>(`/chat/${chatId}/messages`, {
    method: "POST",
    body: { message, stream: false },
  })
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
 * Body gửi `{ message, stream: true }`.
 */
export async function streamChatPrompt(
  chatId: number,
  body: ChatPromptBody,
  handlers: StreamChatHandlers
): Promise<void> {
  const url = resolveApiUrl(`/chat/${chatId}/messages`)
  console.log("streamChatPrompt fetch start", { chatId, url })

  let res: Response
  try {
    res = await fetch(url, {
      method: "POST",
      mode: "cors",
      headers: {
        "Content-Type": "application/json",
        Accept: "text/event-stream, application/json",
        "Cache-Control": "no-cache",
      },
      body: JSON.stringify({ ...body, stream: true }),
    })
  } catch (err) {
    console.error("streamChatPrompt fetch failed", { chatId, url, err })
    throw err
  }

  console.log("streamChatPrompt res============", {
    ok: res.ok,
    status: res.status,
    contentType: res.headers.get("content-type"),
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
