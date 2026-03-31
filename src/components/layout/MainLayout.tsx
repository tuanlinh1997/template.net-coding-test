import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"
import Sidebar from "./Sidebar"
import Header from "./Header"
import ChatInput from "../chat/ChatInput"
import ChatMessages from "../chat/ChatMessages"
import { Toaster } from "../ui/sonner"
import { ApiError } from "@/lib/api"
import {
  extractAssistantTextFromResponse,
  getMessages,
  sendChatPrompt,
} from "@/lib/chatApi"
import type { Message } from "@/types/chat"


type Props = {
  chatId: number | null
}

export default function MainLayout({ chatId }: Props) {
  const [messages, setMessages] = useState<Message[]>([])
  const [isSending, setIsSending] = useState(false)

  useEffect(() => {
    if (!chatId) return

    const fetchMessages = async () => {
      try {
        const res = await getMessages(chatId)
        const maybeItems = (res as unknown as { items?: Message[] }).items
        const items = Array.isArray(maybeItems)
          ? maybeItems
          : Array.isArray(res)
            ? (res as unknown as Message[])
            : []

        setMessages([...items].reverse())
      } catch (err) {
        console.error("Load messages error:", err)
      }
    }

    fetchMessages()
  }, [chatId])

  const handleSubmitPrompt = useCallback(
    async ({ text, files }: { text: string; files: File[] }) => {
      if (!chatId) {
        toast.error("Chat chưa sẵn sàng (chatId chưa load). Vui lòng thử lại.", {
          position: "top-right",
        })
        return
      }

      const trimmedText = text.trim()
      const assistantId = crypto.randomUUID()
      const shouldCallApi = trimmedText.length > 0 || files.length > 0

      const localFileMessages: Message[] = files.map((file) => ({
        id: crypto.randomUUID(),
        sender: "user",
        type: "file",
        content: URL.createObjectURL(file),
        mimeType: file.type,
        created_at: new Date().toISOString(),
      }))

      setMessages((prev) => [
        ...prev,
        ...localFileMessages,
        ...(trimmedText
          ? [{
              id: crypto.randomUUID(),
              sender: "user" as const,
              type: "text" as const,
              content: trimmedText,
              created_at: new Date().toISOString(),
            }]
          : []),
        ...(shouldCallApi
          ? [{
              id: assistantId,
              sender: "ai" as const,
              type: "text" as const,
              content: "",
              created_at: new Date().toISOString(),
            }]
          : []),
      ])

      if (!shouldCallApi) return

      setIsSending(true)

      try {
        const data = await sendChatPrompt(chatId, {
          message: trimmedText,
          files,
        })
        const reply = extractAssistantTextFromResponse(data)

        if (!reply) {
          throw new Error("Không nhận được phản hồi từ server.")
        }

        setMessages((prev) =>
          prev.map((m) => (m.id === assistantId ? { ...m, content: reply } : m))
        )
      } catch (e) {
        const msg =
          e instanceof ApiError
            ? e.message
            : "Không gửi được tin nhắn. Thử lại sau."

        toast.error(msg, { position: "top-right" })

        setMessages((prev) =>
          prev.filter(
            (m) =>
              !(
                m.id === assistantId &&
                m.sender === "ai" &&
                m.content === ""
              )
          )
        )

        throw e
      } finally {
        setIsSending(false)
      }
    },
    [chatId]
  )

  return (
    <div className="flex h-screen bg-gray-50">

      <div className="flex-shrink-0 w-16"> <Sidebar /></div>


      <div className="flex-1 flex flex-col min-h-0">

        <Header />


        <div className="flex flex-1 min-h-0 flex-col gap-4 p-6">
          <ChatMessages messages={messages} isStreaming={isSending} />
          <div className="flex shrink-0 justify-center">
            <ChatInput
              onSubmitPrompt={handleSubmitPrompt}
              isSending={isSending}
            />
          </div>
        </div>
      </div>
      <Toaster />
    </div>
  )
}