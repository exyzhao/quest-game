'use client'

import { useEffect, useState } from 'react'
import { useWebSocketContext } from '../../../context/WebSocketContext'
import { usePathname, useRouter } from 'next/navigation'
import { usePlayerContext } from '../../../context/PlayerContext'

import { Lobby, Player } from '../../../../types'
import { QuestRules } from '../../../../server/game/ruleset'

export default function GamePage() {
  const { sendMessage, lobbyState } = useWebSocketContext()
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
      let updatedSelection
      let updatedToken = tokenHolder
      if (!prevSelected.includes(playerId)) {
        if (prevSelected.length < currentRule.requiredPlayers) {
          updatedSelection = [...prevSelected, playerId]
        } else {
          updatedSelection = prevSelected
        }
      } else {
        if (tokenHolder === playerId) {
          updatedToken = null
          setTokenHolder(null)
        }
        updatedSelection = prevSelected.filter((id) => id !== playerId)
      }

      sendMessage({
        event: 'UPDATE_TEAM',
        lobbyId,
        selectedPlayers: updatedSelection,
        magicTokenHolder: updatedToken,
      })
      return updatedSelection
    })
  }

  // Toggle token selection
  const assignToken = (playerId: string) => {
    if (!isLeader) return // Only the leader can assign the token

    setTokenHolder((prevTokenHolder) => {
      const updatedToken = prevTokenHolder === playerId ? null : playerId

      sendMessage({
        event: 'UPDATE_TEAM',
        lobbyId,
        selectedPlayers,
        magicTokenHolder: updatedToken,
      })
      return updatedToken
    })
  }

  // Confirm the team and token assignment
  const confirmTeam = () => {
    if (selectedPlayers.length !== currentRule.requiredPlayers) {
      alert(`Please select exactly ${currentRule.requiredPlayers} players.`)
      return
    }
    if (!tokenHolder) {
      alert('Please assign the magic token to one of the selected players.')
      return
    }

    sendMessage({
      event: 'CONFIRM_TEAM',
      lobbyId,
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
        <p>Select {currentRule.requiredPlayers} players for the quest.</p>
      ) : (
        <p>Waiting for {currentLeader.name} to select the team...</p>
      )}
      {lobbyState.players.map((player) => (
        <div key={player.id}>
          {/* Player Selection Button */}
          <button
            onClick={() =>
              isLeader &&
              lobbyState.phase === 'TEAM_SELECTION' &&
              togglePlayerSelection(player.id)
            } // Only the leader can interact
            style={{
              backgroundColor: lobbyState.currentTeam.includes(player.id)
                ? 'lightblue' // Highlight players currently on the team
                : '',
            }}
            disabled={!isLeader || lobbyState.phase !== 'TEAM_SELECTION'} // Disable for non-leaders
          >
            {player.name} {player.id === id ? '(You)' : ''}
          </button>

          {/* Token Assignment Button */}
          {lobbyState.currentTeam.includes(player.id) && (
            <button
              onClick={() =>
                isLeader &&
                lobbyState.phase === 'TEAM_SELECTION' &&
                assignToken(player.id)
              } // Only leader can interact
              style={{
                marginLeft: '10px',
                backgroundColor:
                  lobbyState.magicTokenHolder === player.id ? 'gold' : 'white',
              }}
              disabled={!isLeader || lobbyState.phase !== 'TEAM_SELECTION'} // Disable for non-leaders
            >
              {lobbyState.magicTokenHolder === player.id
                ? 'Token Assigned'
                : 'Assign Token'}
            </button>
          )}
        </div>
      ))}
      {isLeader && lobbyState.phase === 'TEAM_SELECTION' ? (
        <button onClick={confirmTeam}>Confirm Team</button>
      ) : null}
      <h2>Players</h2>
      <ul>
        {lobbyState.players.map((player: Player) => {
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
