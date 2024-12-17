'use client'

import { useState, useEffect } from 'react'
import { useWebSocketContext } from '../context/WebSocketContext'
import { useRouter } from 'next/navigation'

export default function Home() {
  const { isConnected, sendMessage, lobbyState, errorMessage } =
    useWebSocketContext()
  const [playerName, setPlayerName] = useState('')
  const [lobbyCode, setLobbyCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [waiting, setWaiting] = useState(false)
  const router = useRouter()

  const joinGame = () => {
    if (!playerName.trim() || !lobbyCode.trim()) {
      setError('Both lobby code and player name are required.')
      return
    }
    setError(null)

    if (isConnected) {
      sendMessage({
        event: 'JOIN_GAME',
        lobbyId: lobbyCode,
        playerName,
      })
      setWaiting(true)
    } else {
      setError('Unable to connect to the server. Please try again later.')
    }
  }

  useEffect(() => {
    if (waiting && lobbyState) {
      // Check if lobbyState indicates a successful join
      router.push(`/lobby/${lobbyCode}`)
      setWaiting(false)
    }
  }, [waiting, lobbyState, lobbyCode, router])

  // Stop waiting and show error if an errorMessage appears
  useEffect(() => {
    if (errorMessage) {
      setWaiting(false)
    }
  }, [errorMessage])

  return (
    <main style={{ padding: '20px' }}>
      <h1>Welcome to Quest</h1>
      <p>Enter your name and lobby code to join a game.</p>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <div>
        <input
          type="text"
          placeholder="Enter lobby code"
          value={lobbyCode}
          onChange={(e) => setLobbyCode(e.target.value)}
          style={{ margin: '5px' }}
        />
        <br />
        <input
          type="text"
          placeholder="Enter your name"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          style={{ margin: '5px' }}
        />
        <br />
        <button onClick={joinGame} disabled={!isConnected || waiting}>
          {waiting ? 'Joining...' : 'Join Lobby'}
        </button>
      </div>
    </main>
  )
}
