'use client'

import * as R from 'remeda'

import { useRef, useEffect, useLayoutEffect, useState, RefObject } from 'react'
import { useWebSocketContext } from '@/context/WebSocketContext'
import { usePathname, useRouter } from 'next/navigation'
import { usePlayerContext } from '@/context/PlayerContext'

import { Player } from '../../../../shared/types'
import { QuestRules } from '../../../../server/game/ruleset'
// import { evilRoles } from '@/shared/constants' TODO

export default function GamePage() {
  const { sendMessage, lobbyState } = useWebSocketContext()
  const pathname = usePathname()
  const lobbyId = pathname.split('/').pop() || ''
  const { id, role, knownEvils, clericInfo, amuletInfo } = usePlayerContext()
  const router = useRouter()
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([])
  const [tokenHolder, setTokenHolder] = useState<string | null>(null)
  const [passQuest, setPassQuest] = useState<boolean | null>(null)
  const [isQuestCardSubmitted, setIsQuestCardSubmited] =
    useState<boolean>(false)

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

  const isGoodPlayer = ![
    'Morgan le Fey',
    'Minion of Mordred',
    'Blind Hunter',
  ].includes(player.role ?? '')

  function rotatePlayers(players: Player[], id: string): Player[] {
    const index = R.pipe(
      players,
      R.findIndex((player) => player.id === id),
    )
    if (index === -1) return players

    return R.pipe(
      players,
      R.drop(index), // Get players from index to the end
      (arr) => [...arr, ...R.pipe(players, R.take(index))], // Append the players from start to index
    )
  }

  // Used to size the player table
  function useContainerSize(ref: RefObject<HTMLDivElement | null>) {
    const [size, setSize] = useState(0)

    useLayoutEffect(() => {
      function handleResize() {
        if (ref.current) {
          setSize(ref.current.clientWidth)
        }
      }
      window.addEventListener('resize', handleResize)
      handleResize() // measure at first render
      return () => window.removeEventListener('resize', handleResize)
    }, [ref])

    return size
  }

  const QuestRoadmap = () => (
    <div className="mx-auto flex max-w-md justify-around gap-2">
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
              className={`flex h-16 w-16 items-center justify-center rounded-full ${questColor} text-4xl text-zinc-100`}
            >
              <p>{rule.requiredPlayers}</p>
            </div>
            {quest && quest.fails > 0 ? (
              <div className="absolute right-0 top-0 flex h-6 w-6 items-center justify-center rounded-full bg-red-700 text-zinc-100">
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

  // Set color of another player's name for this user
  const playerNameColor = (playerId: string) => {
    const blue = 'text-blue-500'
    const red = 'text-red-700'
    if (!role) {
      return 'gray-100'
    }
    if (playerId === id) {
      if (
        ['Morgan le Fey', 'Minion of Mordred', 'Blind Hunter'].includes(role)
      ) {
        return red
      } else {
        return blue
      }
    } else {
      if (role === 'Cleric' && clericInfo?.firstLeader === playerId) {
        return clericInfo.isGood ? blue : red
      }
      if (amuletInfo?.amuletUsedOn === playerId) {
        return amuletInfo.isGood ? blue : red
      }
      if (knownEvils && knownEvils.includes(playerId)) {
        return red
      } else {
        return ''
      }
    }
  }

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
    if (!isLeader) return

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

  // Toggle leader selection
  const toggleLeaderSelection = (playerId: string) => {
    if (!isLeader) return

    const updatedLeader =
      lobbyState.upcomingLeader === playerId ? null : playerId

    sendMessage({
      event: 'UPDATE_LEADER',
      lobbyId,
      updatedLeader,
    })
    return updatedLeader
  }

  // Toggle amulet holder selection
  const assignAmuletHolder = (playerId: string) => {
    if (!isLeader) return

    const updatedAmuletHolder =
      lobbyState.amuletHolder === playerId ? null : playerId

    sendMessage({
      event: 'UPDATE_AMULET_HOLDER',
      lobbyId,
      updatedAmuletHolder,
    })
    return updatedAmuletHolder
  }

  // Toggle amulet usage selection
  const updateAmuletUsage = (playerId: string) => {
    if (lobbyState.amuletHolder !== id) return

    const updatedAmuletUsage =
      lobbyState.amuletUsedOn === playerId ? null : playerId

    sendMessage({
      event: 'UPDATE_AMULET_USAGE',
      lobbyId,
      updatedAmuletUsage,
    })
    return updatedAmuletUsage
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
    if (!lobbyState.upcomingLeader) {
      alert('Please assign the next leader.')
      return
    }
    if (currentRule.amulet && !lobbyState.amuletHolder) {
      alert('Please assign the next amulet holder.')
      return
    }
    if (lobbyState.upcomingLeader === lobbyState.amuletHolder) {
      alert('Next leader and amulet holder must be different players.')
      return
    }

    sendMessage({
      event: 'CONFIRM_LEADER',
      lobbyId,
    })
  }

  const confirmAmuletUsage = () => {
    if (!lobbyState.amuletUsedOn) {
      alert(`Please select a player to use the amulet on.`)
      return
    }

    sendMessage({
      event: 'CONFIRM_AMULET_USAGE',
      lobbyId,
    })
  }

  // Mirrors isPlayerClickable
  const handlePlayerClick = (player: Player) => {
    if (isLeader && lobbyState.phase === 'TEAM_SELECTION') {
      togglePlayerSelection(player.id)
    }
    if (
      isLeader &&
      lobbyState.phase === 'LEADER_SELECTION' &&
      !lobbyState.veterans.includes(player.id)
    ) {
      toggleLeaderSelection(player.id)
    }
    if (
      lobbyState.phase === 'AMULET_CHECK' &&
      lobbyState.amuletHolder === id &&
      !lobbyState.amuletHistory.some(
        (result) =>
          result.amuletHolder === player.id || result.amuletUsedOn == player.id,
      ) &&
      id !== player.id
    ) {
      updateAmuletUsage(player.id)
    }
  }

  // Mirrors handlePlayerClick
  const isPlayerClickable = (player: Player) => {
    if (lobbyState.phase === 'TEAM_SELECTION' && isLeader) {
      return true
    }
    if (
      lobbyState.phase === 'LEADER_SELECTION' &&
      isLeader &&
      !lobbyState.veterans.includes(player.id)
    ) {
      return true
    }
    if (
      lobbyState.phase === 'AMULET_CHECK' &&
      lobbyState.amuletHolder === id &&
      !lobbyState.amuletHistory.some(
        (result) =>
          result.amuletHolder === player.id || result.amuletUsedOn == player.id,
      ) &&
      id !== player.id
    ) {
      return true
    }
    return false
  }

  const PlayerList = () => {
    const containerRef = useRef<HTMLDivElement>(null)
    const diameter = useContainerSize(containerRef)
    const radius = diameter / 2
    const totalPlayers = lobbyState.players.length

    return (
      <div
        ref={containerRef}
        className="relative mx-auto aspect-square w-full max-w-md"
      >
        {rotatePlayers(lobbyState.players, id).map((player, index) => {
          // Set color of ring if player is selected
          const ringColor = (playerId: string) => {
            if (lobbyState.currentTeam.includes(playerId)) {
              return 'ring-[6px] ring-gray-500'
            }
            if (
              lobbyState.phase === 'LEADER_SELECTION' &&
              lobbyState.upcomingLeader === playerId
            ) {
              return 'ring-[6px] ring-gray-500'
            }
            if (
              lobbyState.phase === 'AMULET_CHECK' &&
              lobbyState.amuletUsedOn === player.id
            ) {
              return 'ring-[6px] ring-gray-500'
            } else {
              return ''
            }
          }

          const angle = (360 / totalPlayers) * index - 90
          const rad = (angle * Math.PI) / 180
          const x = radius + radius * Math.cos(rad)
          let y = radius + radius * Math.sin(rad)
          if (radius <= 150 && totalPlayers >= 8) {
            if (totalPlayers === 8) {
              y *= 1.1
            }
            if (totalPlayers === 9) {
              y *= 1.2
            }
            if (totalPlayers === 10) {
              y *= 1.3
            }
          }

          return (
            <div
              key={player.name}
              className="absolute flex w-16 flex-col items-center gap-1 text-center"
              style={{
                left: `${x}px`,
                top: `${y}px`,
                transform: 'translate(-50%, -50%)',
              }}
            >
              {/* <div
                style={{
                  opacity: `${isPlayerClickable(player) ? '1' : '0.4'}`,
                  cursor: `${isPlayerClickable(player) ? '' : 'not-allowed'}`,
                }}
              > */}
              <p className={`min-w-36 ${playerNameColor(player.id)}`}>
                {player.name}
                {player.id === id ? ' (You)' : ''}
              </p>
              <img
                src={`https://api.dicebear.com/9.x/dylan/svg?seed=${player.name}&scale=80&backgroundColor=29e051,619eff,ffa6e6,7074ff,58bffd,967aff,6b80ff,39e8c8,fe9cfa,ffb5cf,ffb0d5,63cb24,3cd623,2ce169,ffabdd,fea1ef,51d023,ffbfc7`}
                alt={`Avatar of ${player.name}`}
                className={`h-16 w-16 rounded-full ${ringColor(player.id)}`}
                onClick={() => handlePlayerClick(player)}
              />
              {lobbyState.currentTeam.includes(player.id) && (
                <button
                  onClick={() =>
                    isLeader &&
                    lobbyState.phase === 'TEAM_SELECTION' &&
                    assignToken(player.id)
                  } // Only leader can interact
                  className="absolute top-[88px] w-20 text-sm"
                  style={{
                    backgroundColor:
                      lobbyState.magicTokenHolder === player.id
                        ? 'gold'
                        : 'white',
                  }}
                  disabled={!isLeader || lobbyState.phase !== 'TEAM_SELECTION'}
                >
                  {lobbyState.magicTokenHolder === player.id
                    ? 'Token Used'
                    : 'Use Token'}
                </button>
              )}
              {/* </div> */}
              {lobbyState.phase === 'LEADER_SELECTION' &&
                currentRule.amulet &&
                !lobbyState.veterans.includes(player.id) &&
                !lobbyState.amuletHistory.some(
                  (result) => result.amuletHolder === player.id,
                ) && (
                  <button
                    onClick={() => isLeader && assignAmuletHolder(player.id)}
                    className={`absolute top-[88px] w-[90px] text-sm ${lobbyState.amuletHolder === player.id ? 'bg-purple-300' : 'bg-white'}`}
                    disabled={
                      !isLeader || lobbyState.phase !== 'LEADER_SELECTION'
                    }
                  >
                    {lobbyState.amuletHolder === player.id
                      ? 'Amulet Given'
                      : 'Give Amulet'}
                  </button>
                )}
            </div>
          )
        })}
      </div>
    )
  }

  // Component for playing questing cards
  const QuestResolution = () => {
    if (lobbyState.phase !== 'QUEST_RESOLUTION') return null

    if (!lobbyState.currentTeam.includes(id)) {
      return <p>Waiting for questing team to return...</p>
    }

    const isYouthTokened =
      player.role === 'Youth' && lobbyState.magicTokenHolder === id

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

  // For debugging
  console.log(lobbyState)

  return (
    // TODO: refactor main into component
    <main className="flex flex-col gap-6">
      <QuestRoadmap />
      <h2>
        Your Role:{' '}
        <span className={`${isGoodPlayer ? 'text-blue-500' : 'text-red-700'}`}>
          {role}
        </span>
      </h2>
      {lobbyState.phase === 'TEAM_SELECTION' && isLeader && (
        <p>
          Select <strong>{currentRule.requiredPlayers}</strong> players for the
          quest.
        </p>
      )}
      {lobbyState.phase === 'TEAM_SELECTION' && !isLeader && (
        <p>
          Waiting for{' '}
          <span className={playerNameColor(currentLeader.id)}>
            {currentLeader.name}
          </span>{' '}
          to select the team...
        </p>
      )}
      {lobbyState.phase === 'LEADER_SELECTION' && isLeader && (
        <p>
          Select the next quest leader
          {currentRule.amulet ? ' and amulet holder' : ''}.
        </p>
      )}
      {lobbyState.phase === 'LEADER_SELECTION' && !isLeader && (
        <p>
          Waiting for {currentLeader.name} to select the next quest leader...
        </p>
      )}
      {lobbyState.phase === 'AMULET_CHECK' &&
        lobbyState.amuletHolder === id && (
          <p>Select a player to use the amulet on.</p>
        )}
      {/* TODO: swap this to amulet holder name */}
      {lobbyState.phase === 'AMULET_CHECK' &&
        lobbyState.amuletHolder !== id && (
          <p>Waiting for {lobbyState.amuletHolder} to use the amulet...</p>
        )}
      {lobbyState.phase === 'QUEST_RESOLUTION' && (
        <p>Waiting for the team to resolve the quest...</p>
      )}
      {lobbyState.phase === 'THE_DISCUSSION' && (
        <p>Begin a discussion phase for 5 minutes.</p>
      )}
      <div className="mb-12 p-8">
        <PlayerList />
      </div>
      <div>
        {isLeader && lobbyState.phase === 'TEAM_SELECTION' ? (
          <button className="bg-green-300" onClick={confirmTeam}>
            Confirm Team
          </button>
        ) : null}
        {isLeader && lobbyState.phase === 'LEADER_SELECTION' ? (
          <button className="bg-green-300" onClick={confirmLeader}>
            Confirm Leader
          </button>
        ) : null}
        {lobbyState.phase === 'AMULET_CHECK' &&
        lobbyState.amuletHolder === id ? (
          <button className="bg-green-300" onClick={confirmAmuletUsage}>
            Confirm Amulet
          </button>
        ) : null}
      </div>

      <QuestResolution />

      {/* Show cleric info to the Cleric */}
      {role === 'Cleric' && clericInfo && (
        <div>
          <h3>Cleric Info:</h3>
          <p>
            The first leader{' '}
            <span className={playerNameColor(clericInfo.firstLeader)}>
              {
                R.find(
                  lobbyState.players,
                  (p) => p.id === clericInfo.firstLeader,
                )?.name
              }
            </span>{' '}
            is{' '}
            <span className={playerNameColor(clericInfo.firstLeader)}>
              {clericInfo.isGood ? 'good' : 'evil'}
            </span>
            .
          </p>
        </div>
      )}
      {/* Amulet Info */}
      {amuletInfo && (
        <div>
          <h3>Amulet Info:</h3>
          <p>
            <span className={playerNameColor(amuletInfo.amuletUsedOn)}>
              {
                R.find(
                  lobbyState.players,
                  (p) => p.id === amuletInfo.amuletUsedOn,
                )?.name
              }
            </span>{' '}
            is{' '}
            <span className={playerNameColor(amuletInfo.amuletUsedOn)}>
              {amuletInfo.isGood ? 'good' : 'evil'}
            </span>
            .
          </p>
        </div>
      )}
    </main>
  )
}
