'use client'

import { useEffect, useState } from 'react'
import { useWebSocketContext } from '../../../context/WebSocketContext'
import { usePathname } from 'next/navigation'
import { usePlayerContext } from '../../../context/PlayerContext'

export default function GamePage() {
  const { messages } = useWebSocketContext()
  const [lobbyState, setLobbyState] = useState<any>(null)
  const pathname = usePathname()
  const lobbyId = pathname.split('/').pop() || ''
  const { role: playerRole } = usePlayerContext()

  useEffect(() => {
    if (messages.length > 0) {
      const latestMessage = messages[messages.length - 1]
      try {
        const parsed = JSON.parse(latestMessage)
        if (parsed.event === 'GAME_STATE_UPDATE' && parsed.state) {
          setLobbyState(parsed.state)
        }
      } catch (err) {
        console.error('Error parsing message:', err)
      }
    }
  }, [messages])

  if (!lobbyState) {
    return <p>Loading game state...</p>
  }

  return (
    <main>
      <h1>Game: {lobbyId}</h1>
      <h2>Your Role: {playerRole}</h2>
      <h2>Players</h2>
      <ul>
        {lobbyState.players.map((player: any) => {
          // You might not want to show everyone's role publicly,
          // so just show their names here.
          return <li key={player.id}>{player.name}</li>
        })}
      </ul>
      {/* Add game-specific UI here */}
    </main>
  )
}
