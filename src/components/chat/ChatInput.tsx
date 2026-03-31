import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from "react"
import { FileText, Loader2, X } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import UploadMenu from "./UploadMenu"
import { cn } from "@/lib/utils"

type ChatInputProps = {
  onSubmitPrompt?: (payload: { text: string; files: File[] }) => void | Promise<void>
  isSending?: boolean
}

type Attachment = {
  id: string
  file: File
  previewUrl: string | null
}

export default function ChatInput({
  onSubmitPrompt,
  isSending = false,
}: ChatInputProps) {
  const [prompt, setPrompt] = useState("")
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const attachmentsRef = useRef<Attachment[]>([])

  useLayoutEffect(() => {
    attachmentsRef.current = attachments
  })

  useEffect(() => {
    return () => {
      attachmentsRef.current.forEach((a) => {
        if (a.previewUrl) URL.revokeObjectURL(a.previewUrl)
      })
    }
  }, [])

  const handleFilesAccepted = useCallback((files: File[]) => {
    const file = files[0]
    if (!file) return

    setAttachments((prev) => {
      prev.forEach((a) => {
        if (a.previewUrl) URL.revokeObjectURL(a.previewUrl)
      })
      return [{
        id: crypto.randomUUID(),
        file,
        previewUrl: file.type.startsWith("image/")
          ? URL.createObjectURL(file)
          : null,
      }]
    })
  }, [])

  const hasPrompt = prompt.trim().length > 0
  const hasAttachments = attachments.length > 0
  const canSubmit = (hasPrompt || hasAttachments) && !!onSubmitPrompt
  const canUsePrimaryStyle = canSubmit

  const removeAttachment = useCallback((id: string) => {
    setAttachments((prev) => {
      const target = prev.find((a) => a.id === id)
      if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl)
      return prev.filter((a) => a.id !== id)
    })
  }, [])

  const submitPrompt = useCallback(async () => {
    const text = prompt.trim()
    if ((!text && attachments.length === 0) || isSending || !onSubmitPrompt) return

    const files = attachments.map((a) => a.file)

    setPrompt("")
    setAttachments((prev) => {
      prev.forEach((a) => {
        if (a.previewUrl) URL.revokeObjectURL(a.previewUrl)
      })
      return []
    })

    try {
      await onSubmitPrompt({ text, files })
    } catch {
      return
    }
  }, [prompt, attachments, isSending, onSubmitPrompt])

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key !== "Enter" || e.shiftKey) return
      e.preventDefault()
      void submitPrompt()
    },
    [submitPrompt]
  )

  return (
    <div className="w-full max-w-3xl rounded-2xl border-0 bg-white p-4 shadow-[0_2px_24px_rgba(15,23,42,0.06)]">
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {attachments.map((a) => (
            <div
              key={a.id}
              className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 border-[#6366f1] bg-neutral-50"
            >
              {a.previewUrl ? (
                <img
                  src={a.previewUrl}
                  alt={a.file.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center gap-0.5 p-1 text-neutral-500">
                  <FileText className="h-6 w-6 shrink-0" />
                  <span className="line-clamp-2 w-full text-center text-[9px] leading-tight">
                    {a.file.name}
                  </span>
                </div>
              )}
              <button
                type="button"
                onClick={() => removeAttachment(a.id)}
                className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-neutral-900 text-white shadow hover:bg-neutral-700"
                aria-label={`Remove ${a.file.name}`}
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      <Textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Ask template.net"
        disabled={isSending}
        className="min-h-[120px] resize-none border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
      />

      <div className="flex items-center justify-between">

        <UploadMenu onFilesAccepted={handleFilesAccepted} />




        <div className="flex items-center gap-2 rounded-full">
          <Button
            type="button"
            variant="ghost"
            className={cn(
              "rounded-full border-0 px-4 shadow-none transition-colors",
              "disabled:pointer-events-none disabled:opacity-100",
              canUsePrimaryStyle
                ? "bg-[#6366f1] text-white hover:bg-[#4f46e5]"
                : "cursor-not-allowed bg-neutral-200 text-neutral-500 hover:bg-neutral-200 hover:text-neutral-500"
            )}
            disabled={!canSubmit || isSending || !onSubmitPrompt}
            onClick={() => void submitPrompt()}
          >
            {isSending ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none"><g clipPath="url(#clip0_5326_70977)"><path d="M4.68126 10.673C4.48835 9.60881 3.70386 8.27234 2.21203 7.19575C1.47897 6.66363 0.733055 6.31714 0 6.16865V5.64891C1.45325 5.31479 2.88078 4.37432 3.79388 3.09972C4.25686 2.45624 4.55266 1.82513 4.68126 1.16927H5.22141C5.44004 2.41912 6.44317 3.80508 7.80639 4.73318C8.47514 5.19105 9.16962 5.50041 9.87695 5.64891V6.16865C8.44942 6.45326 6.7904 7.67836 5.96732 8.9282C5.55578 9.55931 5.31143 10.1409 5.22141 10.673H4.68126Z" fill="white"></path><path d="M12.2695 15.1109C12.131 14.2513 11.5678 13.1718 10.4966 12.3021C9.97029 11.8723 9.43473 11.5924 8.9084 11.4725V11.0527C9.95183 10.7828 10.9768 10.0231 11.6324 8.9936C11.9648 8.47383 12.1772 7.96405 12.2695 7.43429H12.6573C12.8143 8.44384 13.5346 9.56335 14.5133 10.313C14.9935 10.6829 15.4921 10.9327 16 11.0527V11.4725C14.975 11.7024 13.7839 12.692 13.1929 13.7015C12.8974 14.2113 12.722 14.6811 12.6573 15.1109H12.2695Z" fill="white"></path><path d="M12.6677 4.57551C12.6012 4.16266 12.3307 3.6442 11.8162 3.22655C11.5635 3.02013 11.3062 2.88571 11.0535 2.8281V2.62648C11.5546 2.49686 12.0468 2.13202 12.3617 1.63756C12.5214 1.38793 12.6234 1.1431 12.6677 0.888672H12.854C12.9294 1.37353 13.2753 1.91119 13.7453 2.27124C13.976 2.44886 14.2154 2.56887 14.4593 2.62648V2.8281C13.9671 2.93852 13.395 3.41377 13.1112 3.89863C12.9693 4.14346 12.885 4.36909 12.854 4.57551H12.6677Z" fill="white"></path></g><defs><clipPath id="clip0_5326_70977"><rect width="16" height="16" fill="white"></rect></clipPath></defs></svg>
            )}
            Generate Free
          </Button>
        </div>
      </div>
    </div>
  )
}