'use client'

import * as R from 'remeda'

import { useRef, useEffect, useLayoutEffect, useState, RefObject } from 'react'
import { useWebSocketContext } from '@/context/WebSocketContext'
import { usePathname, useRouter } from 'next/navigation'
import { usePlayerContext } from '@/context/PlayerContext'
import { useRemainingTime } from '@/hooks/useRemainingTime'

import { Player, QuestResult } from '../../../../shared/types'
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
  const [pointed, setPointed] = useState<string[]>([])

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

  const formatTime = (timeInSeconds: number) => {
    const minutes = Math.floor(timeInSeconds / 60)
    const seconds = timeInSeconds % 60
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  // Game code
  if (!lobbyState) {
    return <p>Loading game...</p>
  }

  if (!id) {
    return <p>TODO ERROR1</p>
  }

  if (!lobbyState.currentLeader) {
    return <p>ERROR: No leader assigned.</p>
  }
  if (!lobbyState.rules) {
    return <p>ERROR: No rules.</p>
  }

  // Helpers
  const getPlayerFromId = (playerId: string) => {
    return R.find(lobbyState.players, (p) => p.id === playerId)
  }
  const me = getPlayerFromId(id)
  const currentLeader = getPlayerFromId(lobbyState.currentLeader)
  const currentRule = lobbyState.rules?.find(
    (rule: QuestRules) => rule.round === lobbyState.currentRound,
  )
  const { phase, hunted } = lobbyState

  if (!me || !me.role || !currentLeader || !currentRule) {
    return <p>TODO ERROR2</p>
  }
  const isLeader = id === currentLeader?.id

  const isRoleGood = (role: string) => {
    return !['Morgan le Fey', 'Minion of Mordred', 'Blind Hunter'].includes(
      role,
    )
  }

  const isGoodPlayer = isRoleGood(me.role)

  const discussionTime = 20 // 5 minutes
  const blindHunterTime = 10 // 10 seconds for Blind Hunter to opt into hunting
  let totalSeconds = 0
  if (phase === 'THE_DISCUSSION') {
    totalSeconds = discussionTime
  } else if (phase === 'GOODS_LAST_CHANCE') {
    totalSeconds = discussionTime + blindHunterTime
  }
  const remainingTime = useRemainingTime(
    lobbyState.discussionStartTime,
    totalSeconds,
  )

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

  const QuestRoadmap = ({
    rules,
    questHistory,
  }: {
    rules: QuestRules[]
    questHistory: QuestResult[]
  }) => (
    <div className="mx-auto flex max-w-md justify-around gap-2">
      {rules.map((rule) => {
        const quest = questHistory.find((q) => q.round === rule.round)

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

  const updateHunted = (playerId: string) => {
    if (me.role !== 'Blind Hunter') return

    let updatedHunt
    if (!hunted.some((p) => p.playerId === playerId) && hunted.length < 2) {
      updatedHunt = [...hunted, { playerId, role: null }]
    } else if (hunted.some((p) => p.playerId === playerId)) {
      updatedHunt = hunted.filter((p) => p.playerId !== playerId)
    } else {
      return hunted
    }

    sendMessage({
      event: 'UPDATE_HUNTED',
      lobbyId,
      hunted: updatedHunt,
    })

    return updatedHunt
  }

  const updateHuntedRole = (playerId: string, role: string | null) => {
    if (me.role !== 'Blind Hunter') return

    const huntedPlayer = hunted.find((p) => p.playerId === playerId)

    if (!huntedPlayer) {
      return
    }

    if (huntedPlayer?.role === role) {
      huntedPlayer.role = null
    } else {
      huntedPlayer.role = role
    }

    sendMessage({
      event: 'UPDATE_HUNTED',
      lobbyId,
      hunted,
    })

    return hunted
  }

  const updatePointed = (playerId: string) => {
    if (!pointed.includes(playerId) && pointed.length < 2) {
      setPointed([...pointed, playerId])
    }
    if (pointed.includes(playerId)) {
      setPointed(pointed.filter((p) => p !== playerId))
    }
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

  const startTheHunt = () => {
    sendMessage({
      event: 'HUNT_STARTED',
      lobbyId,
    })
  }

  const confirmHunted = () => {
    sendMessage({
      event: 'CONFIRM_HUNTED',
      lobbyId,
    })
  }

  // Mirrors isPlayerClickable
  const handlePlayerClick = (player: Player) => {
    if (isLeader && phase === 'TEAM_SELECTION') {
      togglePlayerSelection(player.id)
    }
    if (
      isLeader &&
      phase === 'LEADER_SELECTION' &&
      !lobbyState.veterans.includes(player.id)
    ) {
      toggleLeaderSelection(player.id)
    }
    if (
      phase === 'AMULET_CHECK' &&
      lobbyState.amuletHolder === id &&
      !lobbyState.amuletHistory.some(
        (result) =>
          result.amuletHolder === player.id || result.amuletUsedOn == player.id,
      ) &&
      id !== player.id
    ) {
      updateAmuletUsage(player.id)
    }
    if (
      phase === 'THE_HUNT' &&
      me.role === 'Blind Hunter' &&
      player.id !== id
    ) {
      updateHunted(player.id)
    }
    if (phase === 'GOODS_LAST_CHANCE') {
      updatePointed(player.id)
    }
  }

  // Mirrors handlePlayerClick
  const isPlayerClickable = (player: Player) => {
    if (phase === 'TEAM_SELECTION' && isLeader) {
      return true
    }
    if (
      phase === 'LEADER_SELECTION' &&
      isLeader &&
      !lobbyState.veterans.includes(player.id)
    ) {
      return true
    }
    if (
      phase === 'AMULET_CHECK' &&
      lobbyState.amuletHolder === id &&
      !lobbyState.amuletHistory.some(
        (result) =>
          result.amuletHolder === player.id || result.amuletUsedOn == player.id,
      ) &&
      id !== player.id
    ) {
      return true
    }
    if (
      phase === 'THE_HUNT' &&
      me.role === 'Blind Hunter' &&
      player.id !== id
    ) {
      return true
    }
    if (phase === 'GOODS_LAST_CHANCE') {
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
            const showRing =
              lobbyState.currentTeam.includes(playerId) ||
              (phase === 'LEADER_SELECTION' &&
                lobbyState.upcomingLeader === playerId) ||
              (phase === 'AMULET_CHECK' &&
                lobbyState.amuletUsedOn === playerId) ||
              (phase === 'THE_HUNT' &&
                hunted?.some((p) => p.playerId === playerId)) ||
              (phase === 'GOODS_LAST_CHANCE' && pointed.includes(playerId))

            return showRing ? 'ring-[6px] ring-gray-500' : ''
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
                className={`h-16 w-16 rounded-full ${ringColor(player.id)} cursor-pointer`}
                style={{
                  opacity: `${isPlayerClickable(player) ? '1' : '0.4'}`,
                  cursor: `${isPlayerClickable(player) ? '' : 'not-allowed'}`,
                }}
                onClick={() => handlePlayerClick(player)}
              />
              {lobbyState.currentTeam.includes(player.id) && (
                <button
                  onClick={() =>
                    isLeader &&
                    phase === 'TEAM_SELECTION' &&
                    assignToken(player.id)
                  } // Only leader can interact
                  className="absolute top-[88px] w-20 text-sm"
                  style={{
                    backgroundColor:
                      lobbyState.magicTokenHolder === player.id
                        ? 'gold'
                        : 'white',
                    opacity: `${isPlayerClickable(player) ? '1' : '0.4'}`,
                    cursor: `${isPlayerClickable(player) ? '' : 'not-allowed'}`,
                  }}
                  disabled={!isLeader || phase !== 'TEAM_SELECTION'}
                >
                  {lobbyState.magicTokenHolder === player.id
                    ? 'Token Used'
                    : 'Use Token'}
                </button>
              )}
              {/* </div> */}
              {phase === 'LEADER_SELECTION' &&
                currentRule.amulet &&
                !lobbyState.veterans.includes(player.id) &&
                !lobbyState.amuletHistory.some(
                  (result) => result.amuletHolder === player.id,
                ) && (
                  <button
                    onClick={() => isLeader && assignAmuletHolder(player.id)}
                    className={`absolute top-[88px] w-[90px] text-sm ${lobbyState.amuletHolder === player.id ? 'bg-purple-300' : 'bg-white'}`}
                    disabled={!isLeader || phase !== 'LEADER_SELECTION'}
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
    if (phase !== 'QUEST_RESOLUTION') return null

    if (!lobbyState.currentTeam.includes(id)) {
      return <p>Waiting for questing team to return...</p>
    }

    const isYouthTokened =
      me.role === 'Youth' && lobbyState.magicTokenHolder === id

    const isEvilTokened =
      ['Minion of Mordred', 'Blind Hunter'].includes(me.role ?? '') &&
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

  const PhaseMessage = () => {
    switch (phase) {
      case 'TEAM_SELECTION':
        return isLeader ? (
          <p>
            Select <strong>{currentRule.requiredPlayers}</strong> players for
            the quest.
          </p>
        ) : (
          <p>
            Waiting for{' '}
            <span className={playerNameColor(currentLeader.id)}>
              {currentLeader.name}
            </span>{' '}
            to select the team...
          </p>
        )
      case 'LEADER_SELECTION':
        return isLeader ? (
          <p>
            Select the next quest leader
            {currentRule.amulet ? ' and amulet holder' : ''}.
          </p>
        ) : (
          <p>
            Waiting for{' '}
            <span className={playerNameColor(currentLeader.id)}>
              {currentLeader.name}
            </span>{' '}
            to select the next quest leader...
          </p>
        )
      case 'AMULET_CHECK':
        if (!lobbyState.amuletHolder) {
          return <p>Error: no amulet holder assigned.</p>
        }
        return lobbyState.amuletHolder === id ? (
          <p>Select a player to use the amulet on.</p>
        ) : (
          <p>
            Waiting for{' '}
            <span className={playerNameColor(lobbyState.amuletHolder)}>
              {getPlayerFromId(lobbyState.amuletHolder)?.name}
            </span>{' '}
            to use the amulet...
          </p>
        )
      case 'QUEST_RESOLUTION':
        return <p>Waiting for the team to resolve the quest...</p>
      case 'THE_DISCUSSION':
        return (
          <p>
            You have{' '}
            {remainingTime !== null ? formatTime(remainingTime) : '5:00'}{' '}
            remaining to discuss who the{' '}
            <span className="text-red-700">evils</span> may be.
          </p>
        )
      case 'GOODS_LAST_CHANCE':
        if (
          !!remainingTime &&
          remainingTime > 0 &&
          me.role === 'Blind Hunter'
        ) {
          return (
            <p>
              You may choose to begin the Hunt. If so, you must identify the{' '}
              <span className="text-blue-500">Cleric</span> and one other{' '}
              <span className="text-blue-500">good</span> player's role. You
              have {remainingTime} second(s) to decide.
            </p>
          )
        } else if (
          !!remainingTime &&
          remainingTime > 0 &&
          me.role !== 'Blind Hunter'
        ) {
          return (
            <p>
              The <span className="text-red-700">Blind Hunter</span> has{' '}
              {remainingTime} second(s) to decide whether to begin the Hunt.
            </p>
          )
        } else {
          return (
            <p>
              Select exactly two players to accuse.{' '}
              <span className="text-blue-500">Good</span> players must
              collectively accuse all <span className="text-red-700">evil</span>{' '}
              players and cannot wrongly accuse any{' '}
              <span className="text-blue-500">good</span> players.
            </p>
          )
        }
      case 'THE_HUNT':
        return me.role === 'Blind Hunter' ? (
          <p>
            Identify the <span className="text-blue-500">Cleric</span> and one
            other <span className="text-blue-500">good</span> player's role. No
            talking is allowed.
          </p>
        ) : (
          <p>
            <span className="text-red-700">
              {lobbyState.players.find((p) => p.role === 'Blind Hunter')?.name}
            </span>{' '}
            has decided to hunt. No talking is allowed. Waiting for{' '}
            <span className="text-red-700">
              {lobbyState.players.find((p) => p.role === 'Blind Hunter')?.name}
            </span>{' '}
            to complete the hunt...
          </p>
        )
    }
  }

  // For debugging
  console.log(lobbyState)

  return (
    <main className="flex flex-col gap-6">
      <QuestRoadmap
        rules={lobbyState.rules}
        questHistory={lobbyState.questHistory}
      />
      <h2>
        Your Role:{' '}
        <span className={`${isGoodPlayer ? 'text-blue-500' : 'text-red-700'}`}>
          {role}
        </span>
      </h2>
      <PhaseMessage />
      <div className="mb-12 p-8">
        <PlayerList />
      </div>
      <div>
        {isLeader && phase === 'TEAM_SELECTION' ? (
          <button className="bg-green-300" onClick={confirmTeam}>
            Confirm Team
          </button>
        ) : null}
        {isLeader && phase === 'LEADER_SELECTION' ? (
          <button className="bg-green-300" onClick={confirmLeader}>
            Confirm Leader
          </button>
        ) : null}
        {phase === 'AMULET_CHECK' && lobbyState.amuletHolder === id ? (
          <button className="bg-green-300" onClick={confirmAmuletUsage}>
            Confirm Amulet
          </button>
        ) : null}
        {phase === 'GOODS_LAST_CHANCE' &&
        me.role === 'Blind Hunter' &&
        lobbyState.discussionStartTime &&
        Date.now() <
          lobbyState.discussionStartTime +
            discussionTime * 1000 +
            blindHunterTime * 1000 ? (
          <button className="bg-green-300" onClick={startTheHunt}>
            Begin the Hunt
          </button>
        ) : null}
        {phase === 'THE_HUNT' && me.role === 'Blind Hunter' && (
          <div className="flex flex-col gap-4">
            {hunted[0] && (
              <div>
                <p>{getPlayerFromId(hunted[0].playerId)?.name}</p>
                <div className="flex gap-1">
                  {lobbyState.possibleRoles
                    ?.filter((role) => isRoleGood(role))
                    .map((role) => (
                      <button
                        key={role}
                        className={hunted[0].role === role ? 'bg-blue-300' : ''}
                        onClick={() =>
                          updateHuntedRole(hunted[0].playerId, role)
                        }
                      >
                        {role}
                      </button>
                    ))}
                </div>
              </div>
            )}
            {hunted[1] && (
              <div>
                <p>{getPlayerFromId(hunted[1].playerId)?.name}</p>
                <div className="flex gap-1">
                  {lobbyState.possibleRoles
                    ?.filter((role) => isRoleGood(role))
                    .map((role) => (
                      <button
                        key={role}
                        className={hunted[1].role === role ? 'bg-blue-300' : ''}
                        onClick={() =>
                          updateHuntedRole(hunted[1].playerId, role)
                        }
                      >
                        {role}
                      </button>
                    ))}
                </div>
              </div>
            )}
            {hunted.length === 2 &&
              hunted.every((p) => p.role) &&
              lobbyState.hunted.some((p) => p.role === 'Cleric') &&
              lobbyState.hunted.some((p) => p.role !== 'Cleric') && (
                <button className="bg-green-300" onClick={confirmHunted}>
                  Confirm the Hunt
                </button>
              )}
          </div>
        )}
      </div>

      <QuestResolution />

      {/* Show cleric info to the Cleric */}
      {role === 'Cleric' && clericInfo && (
        <div>
          <h3>Cleric Info:</h3>
          <p>
            The first leader{' '}
            <span className={playerNameColor(clericInfo.firstLeader)}>
              {getPlayerFromId(clericInfo.firstLeader)?.name}
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
              {getPlayerFromId(amuletInfo.amuletUsedOn)?.name}
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
