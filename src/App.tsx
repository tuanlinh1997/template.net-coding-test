import './App.css'
import { useEffect } from 'react'
import MainLayout from './components/layout/MainLayout'
import { getOrCreateClientId } from './utils/helper'
import { useChat } from './lib/useChat'




function App() {
  useEffect(() => {
    const clientId = getOrCreateClientId()
    console.log('Client ID:', clientId)
  }, [])
  const { chatId } = useChat()
  return <MainLayout chatId={chatId ?? null} />
}

export default App    
