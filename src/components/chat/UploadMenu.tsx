import { Plus, Upload, X } from "lucide-react"
import { useRef, useState } from "react"
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
} from "@/components/ui/dropdown-menu"
import { toast } from "sonner"

type UploadMenuProps = {
    onFilesAccepted?: (files: File[]) => void
}

export default function UploadMenu({ onFilesAccepted }: UploadMenuProps) {
    const [open, setOpen] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const allowedTypes = ["image/png", "image/jpeg", "image/jpg"]

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files
        if (!files?.length) return

        const file = files[0]
        if (!file) return

        if (!allowedTypes.includes(file.type)) {
            toast.error("Chỉ hỗ trợ ảnh PNG/JPG/JPEG.", { position: "top-right" })
            e.target.value = ""
            return
        }

        onFilesAccepted?.([file])
        e.target.value = ""
    }

    return (
        <>
            <input
                type="file"
                accept=".png,.jpg,.jpeg"
                ref={fileInputRef}
                className="hidden"
                onChange={handleFileSelect}
            />
            {/* Dropdown menu */}
            <DropdownMenu open={open} onOpenChange={setOpen}>
                <DropdownMenuTrigger asChild>
                    <button className="rounded-full p-3 text-neutral-900 transition-all duration-200 hover:bg-gray-200  focus:outline-none">
                        {open ? <X size={18} /> : <Plus size={18} />}
                    </button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="start" className="flex flex-col gap-1 p-2 w-[350px] max-h-[500px] overflow-hidden rounded-[12px] border border-neutral-300 shadow-[0_2px_4px_rgba(31,33,36,0.12)] bg-white">
                    <DropdownMenuItem onClick={() => fileInputRef.current?.click()} className="px-3 py-2 rounded-md hover:bg-gray-100 focus:outline-none transition-colors duration-200 cursor-pointer">
                        <Upload className="mr-2 h-4 w-4 " /> Upload files
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </>
    )
}