'use client'

import { useEffect } from 'react'
import { useWebSocketContext } from '@/client/context/WebSocketContext'
import { useRouter, usePathname } from 'next/navigation'
import { Player } from '@/shared/types'

export default function Lobby() {
  const { isConnected, sendMessage, lobbyState } = useWebSocketContext()
  const pathname = usePathname()
  const lobbyId = pathname.split('/').pop() || ''
  const router = useRouter()

  // Redirect if directly navigating
  useEffect(() => {
    if (!lobbyState) {
      router.push('/')
    }
  }, [lobbyState, router])

  useEffect(() => {
    if (lobbyState && lobbyState.phase !== 'LOBBY') {
      router.push(`/game/${lobbyId}`)
    }
  }, [lobbyState, lobbyId, router])

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
    <main>
      <h2>Players</h2>
      <ul>
        {lobbyState.players.map((player: Player) => (
          <li key={player.id}>{player.name}</li>
        ))}
      </ul>
      {lobbyState && (
        <button onClick={startGame} disabled={!isConnected}>
          Start Game
        </button>
      )}
      {lobbyState.phase === 'LOBBY' && <p>Waiting for game to start...</p>}
      {lobbyState.phase !== 'LOBBY' && <p>Game in progress...</p>}
    </main>
  )
}
