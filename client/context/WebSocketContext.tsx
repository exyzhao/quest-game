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
  const { setRole, setClericInfo, setKnownEvils } = usePlayerContext()

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

        switch (parsed.event) {
          case 'ROLE_ASSIGNED':
            if (parsed.role) {
              setRole(parsed.role)
            }
            break

          case 'EVIL_INFO':
            if (parsed.message) {
              const evilNames = parsed.message.split(': ')[1].split(', ')
              setKnownEvils(evilNames)
            }
            break

          case 'CLERIC_INFO':
            if (parsed.message) {
              const match = /The first quest leader \((.+?)\) is (.+)\./.exec(
                parsed.message
              )
              if (match) {
                const [_, leaderName, leaderAlignment] = match
                setClericInfo({ leaderName, leaderAlignment })
              }
            }
            break

          default:
            console.warn('Unknown event:', parsed.event)
        }
      } catch (err) {
        console.error('Failed to parse message:', err)
      }
    }
  }, [messages, setRole, setKnownEvils, setClericInfo])

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
