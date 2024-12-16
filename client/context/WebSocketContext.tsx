'use client'

import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'
import { usePlayerContext } from './PlayerContext'

const WebSocketContext = createContext<any>(null)

export const WebSocketProvider = ({
  children,
}: {
  children: React.ReactNode
}) => {
  const [messages, setMessages] = useState<string[]>([])
  const ws = useRef<WebSocket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const { setRole } = usePlayerContext()

  useEffect(() => {
    ws.current = new WebSocket('ws://localhost:4000')
    ws.current.onopen = () => setIsConnected(true)
    ws.current.onmessage = (event) =>
      setMessages((prev) => [...prev, event.data])
    ws.current.onclose = () => setIsConnected(false)
    ws.current.onerror = (err) => console.error('WebSocket error:', err)

    return () => ws.current?.close()
  }, [])

  // Listen for ROLE_ASSIGNED
  useEffect(() => {
    if (messages.length > 0) {
      const latestMessage = messages[messages.length - 1]
      try {
        const parsed = JSON.parse(latestMessage)
        if (parsed.event === 'ROLE_ASSIGNED' && parsed.role) {
          setRole(parsed.role) // Store the role in PlayerContext
        }
      } catch (err) {
        console.error('Failed to parse message:', err)
      }
    }
  }, [messages, setRole])

  const sendMessage = (message: object) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message))
    } else {
      console.error('WebSocket is not open.')
    }
  }

  return (
    <WebSocketContext.Provider value={{ isConnected, messages, sendMessage }}>
      {children}
    </WebSocketContext.Provider>
  )
}

export const useWebSocketContext = () => {
  const context = useContext(WebSocketContext)
  if (!context) {
    throw new Error(
      'useWebSocketContext must be used within a WebSocketProvider'
    )
  }
  return context
}
