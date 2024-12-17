'use client'

import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'
import { usePlayerContext } from './PlayerContext'
import { Lobby } from '../../shared/types'

interface WebSocketContextValue {
  isConnected: boolean
  sendMessage: (message: object) => void
  lobbyState: Lobby | null
  errorMessage: string | null
  clearError: () => void
}

const WebSocketContext = createContext<WebSocketContextValue | null>(null)

export const WebSocketProvider = ({
  children,
}: {
  children: React.ReactNode
}) => {
  const ws = useRef<WebSocket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [lobbyState, setLobbyState] = useState<Lobby | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const { setId, setRole, setClericInfo, setKnownEvils } = usePlayerContext()

  useEffect(() => {
    ws.current = new WebSocket('ws://localhost:4000')
    ws.current.onopen = () => setIsConnected(true)
    ws.current.onclose = () => setIsConnected(false)
    ws.current.onerror = (err) => {
      console.error('WebSocket error:', err)
      setErrorMessage('A connection error occurred. Please try again.')
    }

    ws.current.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data)
        console.log('Received:', parsed)

        switch (parsed.event) {
          case 'GAME_STATE_UPDATE':
            setLobbyState(parsed.state)

          case 'ROLE_ASSIGNED':
            if (parsed.id) {
              setId(parsed.id)
            }
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

          case 'ERROR':
            setErrorMessage(parsed.error || 'An unknown error has occurred.')
            break

          default:
            console.warn('Unknown event:', parsed.event)
        }
      } catch (err) {
        console.error('Failed to parse message:', err)
        setErrorMessage('Invalid message format received.')
      }
    }

    return () => {
      ws.current?.close()
    }
  }, [setId, setRole, setKnownEvils, setClericInfo])

  const sendMessage = (message: object) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message))
    } else {
      console.error('WebSocket is not open.')
      setErrorMessage('Cannot send message: WebSocket not connected.')
    }
  }

  const clearError = () => setErrorMessage(null)

  return (
    <WebSocketContext.Provider
      value={{ isConnected, sendMessage, lobbyState, errorMessage, clearError }}
    >
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
