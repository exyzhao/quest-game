'use client'

import { useEffect, useState } from 'react'
import { useWebSocketContext } from '../../../context/WebSocketContext'
import { useRouter, usePathname } from 'next/navigation'

export default function Lobby() {
  const { isConnected, messages, sendMessage } = useWebSocketContext()
  const [lobbyState, setLobbyState] = useState<any>(null)
  const pathname = usePathname()
  const lobbyId = pathname.split('/').pop() // Extract lobby ID from URL

  useEffect(() => {
    // Check for the latest message and parse it
    if (messages.length > 0) {
      const latestMessage = messages[messages.length - 1]
      try {
        const parsedMessage = JSON.parse(latestMessage)
        if (
          parsedMessage.event === 'GAME_STATE_UPDATE' &&
          parsedMessage.state
        ) {
          setLobbyState(parsedMessage.state) // Update the lobby state
        }
      } catch (err) {
        console.error('Failed to parse WebSocket message:', err)
      }
    }
  }, [messages])

  const startGame = () => {
    if (isConnected) {
      sendMessage({
        event: 'START_GAME',
        lobbyId,
      })
    }
  }

  if (!lobbyState) {
    return <p>Loading lobby...</p>
  }

  return (
    <main style={{ padding: '20px' }}>
      <h1>Lobby: {lobbyId}</h1>
      <h2>Players</h2>
      <ul>
        {lobbyState.players.map((player: any) => (
          <li key={player.id}>{player.name}</li>
        ))}
      </ul>
      {lobbyState && (
        <button onClick={startGame} disabled={!isConnected}>
          Start Game
        </button>
      )}
      <p>
        {lobbyState.phase === 'IN_GAME'
          ? 'Game has started!'
          : 'Waiting for players...'}
      </p>
    </main>
  )
}
