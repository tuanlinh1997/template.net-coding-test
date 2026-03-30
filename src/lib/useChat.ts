// useChat.ts
import { useEffect, useState } from 'react'
import { getOrCreateChat } from './chatApi'

export const useChat = () => {
  const [chatId, setChatId] = useState<number>()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const init = async () => {
      try {
        const res = await getOrCreateChat()
        const chat = res.data || res
        setChatId(chat.id)
      } catch (err) {
        console.error('Init chat error:', err)
      } finally {
        setLoading(false)
      }
    }

    init()
  }, [])

  return { chatId, loading }
}