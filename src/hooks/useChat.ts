'use client'

import { useState, useCallback } from 'react'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt: Date
}

export function useChat(sessionId: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isStreaming, setIsStreaming] = useState(false)

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isStreaming) return

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text.trim(),
      createdAt: new Date(),
    }

    const aiMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: '',
      createdAt: new Date(),
    }

    setMessages(prev => [...prev, userMsg])
    setIsStreaming(true)

    try {
      const history = [...messages, userMsg].map(m => ({
        role: m.role,
        content: m.content,
      }))

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history, sessionId }),
      })

      if (!res.ok) throw new Error('Stream failed')
      if (!res.body) throw new Error('No response body')

      setMessages(prev => [...prev, aiMsg])

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let accumulated = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        accumulated += decoder.decode(value, { stream: true })
        const snapshot = accumulated
        setMessages(prev =>
          prev.map(m => m.id === aiMsg.id ? { ...m, content: snapshot } : m)
        )
      }
    } catch (err) {
      console.error('Chat error:', err)
      setMessages(prev => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: "I'm having trouble connecting right now. Please try again in a moment. 💙",
          createdAt: new Date(),
        },
      ])
    } finally {
      setIsStreaming(false)
    }
  }, [messages, isStreaming, sessionId])

  const reset = useCallback((greeting?: string) => {
    setMessages(greeting ? [{
      id: crypto.randomUUID(),
      role: 'assistant',
      content: greeting,
      createdAt: new Date(),
    }] : [])
  }, [])

  return { messages, setMessages, isStreaming, sendMessage, reset }
}
