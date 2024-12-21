'use client'

import { useState, useEffect } from 'react'
import { useWebSocketContext } from '../context/WebSocketContext'
import { useRouter } from 'next/navigation'

export default function Home() {
  const { isConnected, sendMessage, lobbyState, errorMessage } =
    useWebSocketContext()
  const [playerName, setPlayerName] = useState('')
  const [lobbyCode, setLobbyCode] = useState('1234')
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
    <main>
      <p>Enter a lobby code and your name to start/join a game.</p>
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
      <p>DEV ONLY</p>
      <button
        onClick={() => {
          sendMessage({ event: 'DEBUG_STATE' })
        }}
      >
        SET LOBBY STATE
      </button>
      <p>
        Welcome to Don Eskridge's Quest, a newer social deduction game similar
        to Avalon.
      </p>
      <p>
        This set contains the roles for the Director's Cut for 4-10 players.
      </p>
    </main>
  )
}
