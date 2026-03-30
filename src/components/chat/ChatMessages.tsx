import { useEffect, useRef } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

export type ChatMessage = {
  id: string
  role: "user" | "assistant"
  content: string
}

type ChatMessagesProps = {
  messages: ChatMessage[]
 
  isStreaming?: boolean
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
              "text-[15px] leading-relaxed whitespace-pre-wrap break-words",
              m.role === "user"
                ? "ml-auto max-w-[min(100%,42rem)] text-right text-neutral-900 bg-indigo-100 rounded-md px-1"
                : "mr-auto max-w-[min(100%,42rem)] text-neutral-800"
            )}
          >
            {m.content}
            {m.role === "assistant" &&
              isStreaming &&
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
