import Sidebar from "./Sidebar"
import Header from "./Header"
import ChatInput from "../chat/ChatInput"
import { Toaster } from "../ui/sonner"

export default function MainLayout() {
  return (
    <div className="flex h-screen bg-gray-50">

      <div className="flex-shrink-0 w-16"> <Sidebar /></div>


      <div className="flex-1 flex flex-col">

        <Header />


        <div className="flex-1 flex items-end justify-center p-6">
          <ChatInput />
        </div>
      </div>
      <Toaster />
    </div>
  )
}