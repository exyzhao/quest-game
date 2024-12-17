'use client'

import { useEffect, useState } from 'react'
import { useWebSocketContext } from '../../../context/WebSocketContext'
import { usePathname, useRouter } from 'next/navigation'
import { usePlayerContext } from '../../../context/PlayerContext'

import { Lobby, Player } from '../../../../types'
import { QuestRules } from '../../../../server/game/ruleset'

export default function GamePage() {
  const { lobbyState } = useWebSocketContext()
  const pathname = usePathname()
  const lobbyId = pathname.split('/').pop() || ''
  const { id, role, knownEvils, clericInfo } = usePlayerContext()
  const router = useRouter()
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([])
  const [tokenHolder, setTokenHolder] = useState<string | null>(null)

  // Redirect if directly navigating
  useEffect(() => {
    if (!lobbyState) {
      router.push('/')
    }
  }, [lobbyState, router])

  if (!lobbyState) {
    return <p>Loading game...</p>
  }

  const currentLeader = lobbyState.players.find(
    (player: Player) => player.id === lobbyState.currentLeader
  )
  const currentRule = lobbyState.rules?.find(
    (rule: QuestRules) => rule.round === lobbyState.currentRound
  )
  if (!currentLeader || !currentRule) {
    return <p>ERRORRRR</p>
  }
  const isLeader = id === currentLeader?.id

  // Toggle player selection
  const togglePlayerSelection = (playerId: string) => {
    if (!isLeader) return // Only the leader can select players

    setSelectedPlayers((prevSelected) => {
      if (!prevSelected.includes(playerId)) {
        if (prevSelected.length < currentRule.requiredPlayers) {
          return [...prevSelected, playerId]
        }
      } else {
        if (tokenHolder === playerId) {
          setTokenHolder(null)
        }
        return prevSelected.filter((id) => id !== playerId)
      }
      return prevSelected
    })
  }

  // Toggle token selection
  const assignToken = (playerId: string) => {
    if (!isLeader) return // Only the leader can assign the token

    setTokenHolder((prevTokenHolder) => {
      if (prevTokenHolder === playerId) {
        return null
      }
      if (selectedPlayers.includes(playerId)) {
        return playerId
      }
      return prevTokenHolder
    })
  }

  // For debugging
  console.log(lobbyState)

  return (
    <main>
      <h1>Game: {lobbyId}</h1>
      <h2>Your Role: {role}</h2>
      <h2>
        Quest {lobbyState.currentRound}: {currentRule?.requiredPlayers} players
      </h2>
      {lobbyState.rules?.map((rule: QuestRules) => {
        return (
          <li key={rule.round}>
            Quest {rule.round}: {rule.requiredPlayers}
          </li>
        )
      })}
      {isLeader ? (
        <>
          <p>Select {currentRule.requiredPlayers} players for the quest.</p>

          {lobbyState.players.map((player) => (
            <div key={player.id}>
              <button
                onClick={() => togglePlayerSelection(player.id)}
                style={{
                  backgroundColor: selectedPlayers.includes(player.id)
                    ? 'lightblue'
                    : '',
                }}
                disabled={!isLeader}
              >
                {player.name} {player.id === id ? '(You)' : ''}
              </button>
              {selectedPlayers.includes(player.id) && (
                <button
                  onClick={() => assignToken(player.id)}
                  style={{
                    marginLeft: '10px',
                    backgroundColor:
                      tokenHolder === player.id ? 'gold' : 'white',
                  }}
                >
                  {tokenHolder === player.id
                    ? 'Token Assigned'
                    : 'Assign Token'}
                </button>
              )}
            </div>
          ))}

          <button>Confirm Team</button>
        </>
      ) : (
        <p>Waiting for {currentLeader.name} to select the team...</p>
      )}
      <h2>Players</h2>
      <ul>
        {lobbyState.players.map((player: any) => {
          return <li key={player.id}>{player.name}</li>
        })}
      </ul>
      {/* Show known evils to evil players */}
      {['Morgan le Fey', 'Minion of Mordred'].includes(role || '') &&
        knownEvils && (
          <div>
            <h3>Known Evils:</h3>
            <ul>
              {knownEvils.map((evil) => (
                <li key={evil}>{evil}</li>
              ))}
            </ul>
          </div>
        )}

      {/* Show cleric info to the Cleric */}
      {role === 'Cleric' && clericInfo && (
        <div>
          <h3>Cleric Info:</h3>
          <p>
            The first quest leader, <strong>{clericInfo.leaderName}</strong>, is{' '}
            <strong>{clericInfo.leaderAlignment}</strong>.
          </p>
        </div>
      )}
    </main>
  )
}
