import { api } from "@/lib/api"
import type { ApiResponse, Chat, Message, Pagination } from "@/types/chat"
import { getOrCreateClientId } from "@/utils/helper"

export type ChatPromptBody = {
  message: string
}

export const getOrCreateChat = async () => {
  const clientId = getOrCreateClientId()
  return api<ApiResponse<Chat>>(`chat/${clientId}`)
}

export const getMessages = async (chatId: number) => {
  const res = await api<ApiResponse<Pagination<Message>>>(
    `/chat/${chatId}/messages?page=1&limit=999`
  )
  return res.data
}

export function extractAssistantTextFromResponse(data: unknown): string | null {
  if (data == null) return null

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

export async function sendChatPrompt(
  chatId: number,
  payload: ChatPromptBody & { files?: File[] }
): Promise<unknown> {
  const { message, files = [] } = payload

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

  return api<unknown>(`/chat/${chatId}/messages`, {
    method: "POST",
    body: { message, stream: false },
  })
}
