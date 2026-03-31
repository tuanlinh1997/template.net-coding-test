import { Home, FileText, Image, Video, Layout, Presentation, Ellipsis, LayoutTemplate, FolderOpenDotIcon, Volleyball, LogIn, Crown } from "lucide-react"


const items = [
    { icon: Home, label: "Home" },
    { icon: FileText, label: "Document" },
    { icon: Layout, label: "Design" },
    { icon: Presentation, label: "Presentation" },
    { icon: Image, label: "Image" },
    { icon: Video, label: "Video" },
    { icon: Ellipsis, label: "More" },
    { icon: LayoutTemplate, label: "Template" },
    { icon: Volleyball, label: "Brand" },
    { icon: FolderOpenDotIcon, label: "Project" },
]
const itemsBottom = [
    { icon: LogIn, label: "Sign in" },
    { icon: Crown, label: "Upgrade" },

]

export default function Sidebar() {
    return (
        <div className="fixed top-0 left-0 w-[68px] h-screen flex flex-col gap-4 pb-4 bg-[#f2f5fd]">
            <div className="flex-1 overflow-y-auto custom-scroll flex flex-col items-center pt-4 gap-2">
                {items.map((item, i) => {
                    const Icon = item.icon
                    return (
                        <div
                            key={i}
                            className="flex flex-col items-center text-[10px] text-neutral-700 cursor-pointer"
                        >
                            <Icon size={24} className="hover:text-blue-500 transition-colors duration-200" />
                            <span>{item.label}</span>
                        </div>
                    )
                })}
            </div>

            <div className="h-32 flex flex-col items-center justify-center gap-4">
                {itemsBottom.map((item, i) => {
                    const Icon = item.icon
                    return (
                        <div
                            key={i}
                            className="flex flex-col items-center text-[10px] text-neutral-700 cursor-pointer"
                        >
                            <Icon size={24} className="hover:text-blue-500 transition-colors duration-200" />
                            <span>{item.label}</span>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}