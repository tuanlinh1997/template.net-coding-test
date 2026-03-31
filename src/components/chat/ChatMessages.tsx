import { useEffect, useRef } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import type { Message } from "@/types/chat"

export type ChatMessage = Message
type ChatMessagesProps = {
  messages: ChatMessage[]

  isStreaming?: boolean
}

function isImageFileContent(content: string, mimeType?: string): boolean {
  if (mimeType?.startsWith("image/")) return true
  return (
    content.startsWith("data:image/") ||
    content.startsWith("blob:") ||
    /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(content)
  )
}

export default function ChatMessages({
  messages,
  isStreaming = false,
}: ChatMessagesProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 min-h-0 items-center justify-center text-sm text-neutral-400">

      </div>
    )
  }

  return (
    <ScrollArea className="flex-1 min-h-0 w-full max-w-3xl mx-auto border-0 bg-transparent shadow-none">
      <div className="flex flex-col gap-8 py-2 pr-2">
        {messages.map((m, i) => (
          <div
            key={m.id}
            className={cn(
              "text-[15px] leading-relaxed break-words",
              m.sender === "user"
                ? "ml-auto max-w-[min(100%,42rem)] text-right text-neutral-900 bg-indigo-100 rounded-xl px-1"
                : "mr-auto max-w-[min(100%,42rem)] text-left text-neutral-800 bg-indigo-100 rounded-xl px-1"
            )}
          >
            {m.type === "file" ? (
              isImageFileContent(m.content, m.mimeType) ? (
                <img
                  src={m.content}
                  alt="uploaded file"
                  className="max-h-64 max-w-[18rem] rounded-lg object-cover"
                />
              ) : (
                <a
                  href={m.content}
                  target="_blank"
                  rel="noreferrer"
                  className="underline"
                >
                  Open file
                </a>
              )
            ) : m.sender === "ai" && isStreaming && !m.content ? (
              <span className="inline-flex items-center gap-1 text-neutral-500">
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-neutral-400 [animation-delay:-0.2s]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-neutral-400 [animation-delay:-0.1s]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-neutral-400" />
              </span>
            ) : (
              <span className="whitespace-pre-wrap">{m.content}</span>
            )}
            {m.type !== "file" &&
              m.sender === "ai" &&
              isStreaming &&
              !!m.content &&
              i === messages.length - 1 && (
                <span
                  className="ml-0.5 inline-block h-[1.05em] w-0.5 animate-pulse bg-neutral-500 align-[-0.15em]"
                  aria-hidden
                />
              )}
          </div>
        ))}
        <div ref={bottomRef} aria-hidden />
      </div>
    </ScrollArea>
  )
}
