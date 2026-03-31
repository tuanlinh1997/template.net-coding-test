import './App.css'
import MainLayout from './components/layout/MainLayout'
import { useChat } from './lib/useChat'




function App() {
  const { chatId } = useChat()
  return <MainLayout chatId={chatId ?? null} />
}

export default App    
