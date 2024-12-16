'use client'

import React, { createContext, useContext } from 'react'
import useWebSocket from '../hooks/useWebSocket'

const WebSocketContext = createContext<{
  isConnected: boolean
  messages: string[]
  sendMessage: (message: object) => void
} | null>(null)

export const WebSocketProvider = ({
  children,
}: {
  children: React.ReactNode
}) => {
  const ws = useWebSocket('ws://localhost:4000')

  return (
    <WebSocketContext.Provider value={ws}>{children}</WebSocketContext.Provider>
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
