// src/components/layout/Header.tsx
import { Search } from "lucide-react"

export default function Header() {
    return (
        <div className="h-12 flex items-center justify-between pl-24 pr-12 text-neutral-900">
            <a href="https://www.template.net/?u=ai-chat" className="text-xl font-bold text-blue-600">
                <img src="/logo.svg" alt="Logo" className="w-auto" />
            </a>


            <div className="flex items-center gap-4 text-sm">

                <button className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-gray-200 transition-colors duration-200">
                    <Search size={18} />
                </button>


                <button className="px-3 py-2 rounded-xl  hover:bg-gray-200 transition-colors duration-200">
                    Pricing
                </button>


                <button className="px-3 py-2 rounded-xl  hover:bg-gray-200 transition-colors duration-200">
                    Sign Up
                </button>
            </div>
        </div>
    )
}