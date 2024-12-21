'use client'

import { useEffect, useState } from 'react'
import { useWebSocketContext } from '@/context/WebSocketContext'
import { usePathname, useRouter } from 'next/navigation'
import { usePlayerContext } from '@/context/PlayerContext'

import { Lobby, Player } from '../../../../shared/types'
import { QuestRules } from '../../../../server/game/ruleset'
// import { evilRoles } from '@/shared/constants' TODO

export default function GamePage() {
  const { sendMessage, lobbyState } = useWebSocketContext()
  const pathname = usePathname()
  const lobbyId = pathname.split('/').pop() || ''
  const { id, role, knownEvils, clericInfo } = usePlayerContext()
  const router = useRouter()
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([])
  const [tokenHolder, setTokenHolder] = useState<string | null>(null)
  const [passQuest, setPassQuest] = useState<boolean | null>(null)
  const [isQuestCardSubmitted, setIsQuestCardSubmited] =
    useState<boolean>(false)
  const [selectedLeader, setSelectedLeader] = useState<string | null>(null)

  // Redirect if directly navigating
  useEffect(() => {
    if (!lobbyState) {
      router.push('/')
    }
  }, [lobbyState, router])

  useEffect(() => resetState(), [lobbyState?.currentRound])

  const resetState = () => {
    setSelectedPlayers([])
    setTokenHolder(null)
    setPassQuest(null)
    setIsQuestCardSubmited(false)
    setSelectedLeader(null)
  }

  if (!lobbyState) {
    return <p>Loading game...</p>
  }

  if (!id) {
    return <p>TODO ERROR1</p>
  }

  const player = lobbyState.players.find((p: Player) => p.id === id)
  const currentLeader = lobbyState.players.find(
    (player: Player) => player.id === lobbyState.currentLeader,
  )

  const currentRule = lobbyState.rules?.find(
    (rule: QuestRules) => rule.round === lobbyState.currentRound,
  )

  if (!player || !currentLeader || !currentRule) {
    return <p>TODO ERROR2</p>
  }
  const isLeader = id === currentLeader?.id

  const QuestRoadmap = () => (
    <div className="flex max-w-md justify-around">
      {lobbyState.rules?.map((rule: QuestRules) => {
        const quest = lobbyState.questHistory?.find(
          (q) => q.round === rule.round,
        )

        const questColor =
          quest?.result === 'Passed'
            ? 'bg-blue-500'
            : quest?.result === 'Failed'
              ? 'bg-red-500'
              : 'bg-stone-500'

        const twoFailsRequired = rule.failsRequired === 2

        return (
          <div
            key={rule.round}
            className="relative flex w-16 flex-col items-center gap-2"
          >
            <div
              className={`flex h-16 w-16 items-center justify-center rounded-full ${questColor} text-4xl text-slate-100`}
            >
              <p>{rule.requiredPlayers}</p>
            </div>
            {quest?.result === 'Failed' ? (
              <div className="absolute right-0 top-0 flex h-6 w-6 items-center justify-center rounded-full bg-red-700 text-slate-100">
                <p>{quest.fails}</p>
              </div>
            ) : null}
            <div className="text-center text-sm leading-4">
              {twoFailsRequired ? <p>2 fails required</p> : null}
            </div>
          </div>
        )
      })}
    </div>
  )

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

  const toggleLeaderSelection = (playerId: string) => {
    if (!isLeader) return

    setSelectedLeader((prevSelectedLeader) => {
      const updatedLeader = prevSelectedLeader === playerId ? null : playerId

      sendMessage({
        event: 'UPDATE_LEADER',
        lobbyId,
        updatedLeader,
      })
      return updatedLeader
    })
  }

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

  // Confirm the leader
  const confirmLeader = () => {
    if (!selectedLeader) {
      alert('Please assign the next leader.')
      return
    }

    sendMessage({
      event: 'CONFIRM_LEADER',
      lobbyId,
    })
  }

  // Component for playing questing cards
  const QuestResolution = () => {
    if (lobbyState.phase !== 'QUEST_RESOLUTION') return null

    if (!lobbyState.currentTeam.includes(id)) {
      return <p>Waiting for questing team to return...</p>
    }

    const isYouthTokened =
      player.role === 'Youth' && lobbyState.magicTokenHolder === id

    const isGoodPlayer = ![
      'Morgan le Fey',
      'Minion of Mordred',
      'Blind Hunter',
    ].includes(player.role ?? '')

    const isEvilTokened =
      ['Minion of Mordred', 'Blind Hunter'].includes(player.role ?? '') &&
      lobbyState.magicTokenHolder === id

    const canFail = (!isGoodPlayer && !isEvilTokened) || isYouthTokened

    return (
      <div>
        <p>Play your quest card</p>
        <button
          onClick={() => setPassQuest(true)}
          style={{
            backgroundColor: passQuest === true ? 'lightblue' : '',
          }}
          disabled={isYouthTokened}
        >
          Pass
        </button>
        <button
          onClick={() => setPassQuest(false)}
          style={{
            backgroundColor: passQuest === false ? 'lightblue' : '',
          }}
          disabled={!canFail}
        >
          Fail
        </button>
        <div>
          <button
            onClick={() => {
              sendMessage({
                event: 'SUBMIT_QUEST',
                lobbyId,
                playerId: id,
                isQuestCardPass: passQuest,
              })
              setIsQuestCardSubmited(true)
            }}
            disabled={passQuest === null || isQuestCardSubmitted}
          >
            {isQuestCardSubmitted ? 'Submission confirmed' : 'Confirm'}
          </button>
        </div>
      </div>
    )
  }

  // Set color of button if player is selected
  const buttonColor = (playerId: string) => {
    if (lobbyState.currentTeam.includes(playerId)) {
      return 'lightblue'
    }
    if (
      lobbyState.phase === 'LEADER_SELECTION' &&
      selectedLeader === playerId
    ) {
      return 'lightblue'
    } else {
      return ''
    }
  }

  // For debugging
  console.log(lobbyState)

  return (
    // TODO: refactor main into component
    <main className="flex flex-col gap-6">
      <QuestRoadmap />
      <h2>Your Role: {role}</h2>
      <div>
        {lobbyState.phase === 'TEAM_SELECTION' && isLeader && (
          <p>Select {currentRule.requiredPlayers} players for the quest.</p>
        )}
        {lobbyState.phase === 'TEAM_SELECTION' && !isLeader && (
          <p>Waiting for {currentLeader.name} to select the team...</p>
        )}
        {lobbyState.phase === 'LEADER_SELECTION' && isLeader && (
          <p>Select the next quest leader.</p>
        )}
        {lobbyState.phase === 'LEADER_SELECTION' && !isLeader && (
          <p>
            Waiting for {currentLeader.name} to select the next quest leader...
          </p>
        )}
        {lobbyState.phase === 'QUEST_RESOLUTION' && (
          <p>Waiting for the team to resolve the quest...</p>
        )}
        {lobbyState.phase === 'THE_DISCUSSION' && (
          <p>Begin a discussion phase for 5 minutes.</p>
        )}
        {/* TODO: more descriptive text */}
        {lobbyState.players.map((player) => (
          <div key={player.id}>
            {/* Player Selection Button */}
            <button
              onClick={() => {
                if (isLeader && lobbyState.phase === 'TEAM_SELECTION') {
                  togglePlayerSelection(player.id)
                }
                if (isLeader && lobbyState.phase === 'LEADER_SELECTION') {
                  toggleLeaderSelection(player.id)
                }
              }} // Only the leader can interact
              style={{
                backgroundColor: buttonColor(player.id),
              }}
              disabled={
                !isLeader ||
                lobbyState.phase === 'QUEST_RESOLUTION' ||
                (lobbyState.phase === 'LEADER_SELECTION' &&
                  lobbyState.veterans.includes(player.id)) ||
                lobbyState.phase === 'THE_DISCUSSION'
              } // Disable for non-leaders
              className="w-40 text-center"
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
                    lobbyState.magicTokenHolder === player.id
                      ? 'gold'
                      : 'white',
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
        {isLeader && lobbyState.phase === 'LEADER_SELECTION' ? (
          <button onClick={confirmLeader}>Confirm Leader</button>
        ) : null}
      </div>

      <QuestResolution />

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
