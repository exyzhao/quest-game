'use client'

import { useState, useEffect } from 'react'
import { useWebSocketContext } from '../context/WebSocketContext'
import { useRouter } from 'next/navigation'

export default function Home() {
  const { isConnected, messages, sendMessage } = useWebSocketContext()
  const [playerName, setPlayerName] = useState('')
  const [lobbyCode, setLobbyCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [waiting, setWaiting] = useState(false)
  const router = useRouter()

  const joinGame = () => {
    // Validate inputs
    if (!playerName.trim() || !lobbyCode.trim()) {
      setError('Both lobby code and player name are required.')
      return
    }
    setError(null)

    if (isConnected) {
      // Send JOIN_GAME request
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

  // Listen for WebSocket messages
  useEffect(() => {
    if (waiting && messages.length > 0) {
      const latestMessage = messages[messages.length - 1]
      try {
        const parsedMessage = JSON.parse(latestMessage)

        if (parsedMessage.event === 'ERROR') {
          setError(parsedMessage.error) // Display the error
          setWaiting(false) // Stop waiting
        }

        if (
          parsedMessage.event === 'GAME_STATE_UPDATE' &&
          parsedMessage.state
        ) {
          router.push(`/lobby/${lobbyCode}`) // Navigate to lobby on success
        }
      } catch (err) {
        console.error('Failed to parse message:', err)
      }
    }
  }, [messages, waiting, lobbyCode, router])

  return (
    <main style={{ padding: '20px' }}>
      <h1>Welcome to Avalon</h1>
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
