// useChat.ts
import { useEffect, useState } from 'react'
import { getOrCreateChat } from './chatApi'
import { getOrCreateClientId } from '../utils/helper'

export const useChat = () => {
  const [chatId, setChatId] = useState<number>()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const init = async () => {
      try {
        const clientId = getOrCreateClientId()
        const chatKey = `chatId:${clientId}`

        const cached = localStorage.getItem(chatKey)
        if (cached) {
          setChatId(Number(cached))
          return
        }

        const res = await getOrCreateChat()
        const chat = res.data || res
        setChatId(chat.id)

        localStorage.setItem(chatKey, String(chat.id))
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