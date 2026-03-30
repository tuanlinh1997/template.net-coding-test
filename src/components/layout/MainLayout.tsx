import { useCallback, useState } from "react"
import { toast } from "sonner"
import Sidebar from "./Sidebar"
import Header from "./Header"
import ChatInput from "../chat/ChatInput"
import ChatMessages, { type ChatMessage } from "../chat/ChatMessages"
import { Toaster } from "../ui/sonner"
import { ApiError } from "@/lib/api"
import { streamChatPrompt } from "@/lib/chatApi"

export default function MainLayout() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isSending, setIsSending] = useState(false)

  const handleSubmitPrompt = useCallback(async (text: string) => {
    const assistantId = crypto.randomUUID()
    setMessages((m) => [
      ...m,
      { id: crypto.randomUUID(), role: "user", content: text },
      { id: assistantId, role: "assistant", content: "" },
    ])
    setIsSending(true)
    try {
      await streamChatPrompt(
        { message: text },
        {
          onChunk: (delta) => {
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === assistantId
                  ? { ...msg, content: msg.content + delta }
                  : msg
              )
            )
          },
        }
      )
    } catch (e) {
      const msg =
        e instanceof ApiError ? e.message : "Không gửi được tin nhắn. Thử lại sau."
      toast.error(msg, { position: "top-right" })
      setMessages((prev) =>
        prev.filter(
          (m) =>
            !(
              m.id === assistantId &&
              m.role === "assistant" &&
              m.content === ""
            )
        )
      )
      throw e
    } finally {
      setIsSending(false)
    }
  }, [])

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