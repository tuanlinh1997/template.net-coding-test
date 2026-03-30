import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"
import Sidebar from "./Sidebar"
import Header from "./Header"
import ChatInput from "../chat/ChatInput"
import ChatMessages from "../chat/ChatMessages"
import { Toaster } from "../ui/sonner"
import { ApiError } from "@/lib/api"
import { getMessages, streamChatPrompt } from "@/lib/chatApi"
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
        setMessages([...res.items].reverse())
      } catch (err) {
        console.error("Load messages error:", err)
      }
    }

    fetchMessages()
  }, [chatId])

  const handleSubmitPrompt = useCallback(
    async (text: string) => {
      if (!chatId) return

      const userId = crypto.randomUUID()
      const assistantId = crypto.randomUUID()


      setMessages((prev) => [
        ...prev,
        { id: userId, role: "user", content: text, created_at: new Date().toISOString() },
        { id: assistantId, role: "ai", content: "", created_at: new Date().toISOString() },
      ])

      setIsSending(true)

      try {
        await streamChatPrompt(
          chatId,
          { message: text },
          {
            onChunk: (delta) => {
              setMessages((prev) => {
                const last = prev[prev.length - 1]

                // chỉ update message cuối (AI)
                if (!last || last.id !== assistantId) return prev

                const updated = [...prev]
                updated[updated.length - 1] = {
                  ...last,
                  content: last.content + delta,
                }

                return updated
              })
            },
          }
        )
      } catch (e) {
        const msg =
          e instanceof ApiError
            ? e.message
            : "Không gửi được tin nhắn. Thử lại sau."

        toast.error(msg, { position: "top-right" })

        // ❌ chỉ remove AI message nếu chưa có content
        setMessages((prev) => {
          const last = prev[prev.length - 1]

          if (
            last &&
            last.id === assistantId &&
            last.role === "ai" &&
            last.content === ""
          ) {
            return prev.slice(0, -1)
          }

          return prev
        })

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