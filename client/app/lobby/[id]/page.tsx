'use client'

import { useEffect, useState } from 'react'
import { useWebSocketContext } from '../../../context/WebSocketContext'
import { useRouter, usePathname } from 'next/navigation'

export default function Lobby() {
  const { isConnected, sendMessage, lobbyState } = useWebSocketContext()
  const pathname = usePathname()
  const lobbyId = pathname.split('/').pop() || ''
  const router = useRouter()

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
      {lobbyState.phase === 'LOBBY' && <p>Waiting for game to start...</p>}
      {lobbyState.phase !== 'LOBBY' && <p>Game in progress...</p>}
    </main>
  )
}
