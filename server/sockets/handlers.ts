import WebSocket from 'ws'

import { getRolesForPlayerCount } from '../game/roles'
import { MyWebSocket, MyWebSocketServer, Lobby } from '../types'
import * as R from 'remeda'
import { advancePhase } from '../game/stateMachine'
import {
  updateTeam,
  confirmTeam,
  updateLeader,
  updateAmuletHolder,
  updateAmuletUsage,
  confirmLeader,
  confirmAmuletUsage,
} from '../game/quests'
import { getQuestRules } from '../game/ruleset'
import {
  DISCUSSION_TIME_SECONDS,
  EVIL_ROLES,
  HUNTING_OPTION_SECONDS,
  KNOWN_EVIL_ROLES,
} from '../constants'

export const LOBBIES: Record<string, Lobby> = {}

export const handleDebugState = (ws: MyWebSocket, wss: MyWebSocketServer) => {
  const env = process.env.NODE_ENV
  console.log('env: ' + env)
  // TEAM SELECTION
  const lobbyId = '1234'
  LOBBIES[lobbyId] = {
    lobbyId,
    lastActivity: Date.now(),
    phase: 'TEAM_SELECTION',
    players: [
      { id: 'player-1', name: 'q', role: 'Morgan le Fey' },
      { id: 'player-2', name: 'w', role: 'Minion of Mordred' },
      { id: 'player-3', name: 'e', role: 'Blind Hunter' },
      { id: 'player-4', name: 'r', role: 'Cleric' },
      { id: 'player-5', name: 't', role: 'Youth' },
      { id: 'player-6', name: 'y', role: 'Troublemaker' },
      // { id: 'player-7', name: 'minion1', role: 'Minion of Mordred' },
      // { id: 'player-8', name: 'minion2', role: 'Minion of Mordred' },
      // { id: 'player-9', name: 'minion3', role: 'Minion of Mordred' },
      // { id: 'player-10', name: 'minion4', role: 'Minion of Mordred' },
    ],
    disconnectedPlayers: [
      { id: 'player-1', name: 'q', role: 'Morgan le Fey' },
      { id: 'player-2', name: 'w', role: 'Minion of Mordred' },
      { id: 'player-3', name: 'e', role: 'Blind Hunter' },
      { id: 'player-4', name: 'r', role: 'Cleric' },
      { id: 'player-5', name: 't', role: 'Youth' },
      { id: 'player-6', name: 'y', role: 'Troublemaker' },
      // { id: 'player-7', name: 'minion1', role: 'Minion of Mordred' },
      // { id: 'player-8', name: 'minion2', role: 'Minion of Mordred' },
    ],
    veterans: ['player-2', 'player-3'],
    questHistory: [
      {
        round: 1,
        team: ['player-1', 'player-2', 'player-3'],
        fails: 1,
        result: 'Failed',
      },
      {
        round: 2,
        team: ['player-2', 'player-3'],
        fails: 1,
        result: 'Failed',
      },
    ],
    amuletHistory: [],
    currentRound: 3,
    currentTeam: [],
    magicTokenHolder: null,
    questSubmissions: [],
    rules: getQuestRules(6),
    allRoles: getRolesForPlayerCount(6).allRoles,
    currentLeader: 'player-1',
    upcomingLeader: null,
    amuletHolder: null,
    amuletUsedOn: null,
    discussionStartTime: null,
    hunted: [],
    knownEvils: ['player-1', 'player-2'],
    clericInfo: {
      firstLeader: 'player-1',
      isGood: false,
    },
  }
  const lobby = LOBBIES[lobbyId]

  console.log('Debug state applied to lobby.')
  console.log(lobby)

  broadcastToLobby(wss, lobbyId, {
    event: 'GAME_STATE_UPDATE',
    state: lobby,
  })
}

export const handleJoinGame = (
  ws: MyWebSocket,
  message: { lobbyId?: string; playerName?: string },
  wss: MyWebSocketServer,
) => {
  const { lobbyId, playerName } = message

  if (!lobbyId || !playerName) {
    return ws.send(
      JSON.stringify({
        event: 'ERROR',
        error: 'Missing lobbyId or playerName',
      }),
    )
  }

  // If lobby doesn't exist, create it
  if (!LOBBIES[lobbyId]) {
    LOBBIES[lobbyId] = {
      lobbyId: lobbyId,
      lastActivity: Date.now(),
      phase: 'LOBBY',
      players: [],
      disconnectedPlayers: [],
      veterans: [],
      amuletHistory: [],
      questHistory: [],
      currentLeader: null,
      upcomingLeader: null,
      amuletHolder: null,
      amuletUsedOn: null,
      currentRound: 0,
      currentTeam: [],
      magicTokenHolder: null,
      questSubmissions: [],
      discussionStartTime: null,
      hunted: [],
    }
  }

  const lobby = LOBBIES[lobbyId]

  if (lobby.phase === 'LOBBY') {
    if (lobby.players.find((player) => player.name === playerName)) {
      return ws.send(
        JSON.stringify({
          event: 'ERROR',
          error: 'A player with this name already exists in the lobby.',
        }),
      )
    }

    const playerId = `player-${Date.now()}`
    lobby.players.push({ id: playerId, name: playerName })

    // Associate this WebSocket connection with the lobby
    ws.lobbyId = lobbyId
    ws.playerId = playerId

    // Broadcast the updated lobby state to all players in the lobby
    console.log(`Player ${playerName} connected to lobby ${lobbyId}.`)
    broadcastToLobby(wss, lobbyId, { event: 'GAME_STATE_UPDATE', state: lobby })
    return
  }

  // Handle reconnecting player
  const reconnectingPlayer = lobby.players.find((p) => p.name === playerName)
  if (!reconnectingPlayer) {
    return ws.send(
      JSON.stringify({ event: 'ERROR', error: 'Game already started' }),
    )
  }

  lobby.disconnectedPlayers = R.filter(
    lobby.disconnectedPlayers,
    (p) => p.name !== playerName,
  )

  ws.lobbyId = lobbyId
  ws.playerId = reconnectingPlayer.id

  // Resend all private information
  if (reconnectingPlayer.role) {
    sendPrivateMessage(wss, reconnectingPlayer.id, {
      event: 'ROLE_ASSIGNED',
      id: reconnectingPlayer.id,
      role: reconnectingPlayer.role,
    })
  }
  if (reconnectingPlayer.role === 'Cleric' && lobby.clericInfo) {
    sendPrivateMessage(wss, reconnectingPlayer.id, {
      event: 'CLERIC_INFO',
      message: lobby.clericInfo,
    })
  }
  if (
    reconnectingPlayer.role &&
    KNOWN_EVIL_ROLES.includes(reconnectingPlayer.role) &&
    lobby.knownEvils
  ) {
    sendPrivateMessage(wss, reconnectingPlayer.id, {
      event: 'EVIL_INFO',
      message: lobby.knownEvils,
    })
  }
  const maybeAmuletResult = lobby.amuletHistory.find(
    (result) => result.amuletHolder === reconnectingPlayer.id,
  )
  if (maybeAmuletResult) {
    sendPrivateMessage(wss, reconnectingPlayer.id, {
      event: 'AMULET_INFO',
      message: maybeAmuletResult,
    })
  }

  console.log(`Player ${playerName} reconnected to lobby ${lobbyId}.`)

  broadcastToLobby(wss, lobbyId, {
    event: 'GAME_STATE_UPDATE',
    state: lobby,
  })
  return
}

export const handleDisconnection = (
  ws: MyWebSocket,
  wss: MyWebSocketServer,
) => {
  const { lobbyId, playerId } = ws
  if (!lobbyId || !playerId) return

  const lobby = LOBBIES[lobbyId]
  if (!lobby) return

  const player = lobby.players.find((p) => p.id === playerId)
  if (!player) return

  if (lobby.phase === 'LOBBY') {
    // Remove the player entirely if still in the lobby phase
    lobby.players = R.filter(lobby.players, (p) => p.id !== playerId)
    console.log(`Player ${player.name} removed from lobby ${lobbyId}.`)
    if (lobby.players.length < 1) {
      delete LOBBIES[lobbyId]
    }
  } else {
    // In game phase, just mark them as disconnected
    if (!lobby.disconnectedPlayers.find((dp) => dp.id === playerId)) {
      lobby.disconnectedPlayers.push(player)
    }
    console.log(
      `${player.name} disconnected during the game in lobby ${lobbyId}.`,
    )
  }

  broadcastToLobby(wss, lobbyId, {
    event: 'GAME_STATE_UPDATE',
    state: lobby,
  })
}

export const handleStartGame = (
  ws: MyWebSocket,
  message: { lobbyId?: string },
  wss: MyWebSocketServer,
) => {
  const { lobbyId } = message

  if (!lobbyId) {
    ws.send(JSON.stringify({ event: 'ERROR', error: 'Missing lobbyId' }))
    return
  }

  const lobby = LOBBIES[lobbyId]
  if (!lobby) {
    ws.send(JSON.stringify({ event: 'ERROR', error: 'Lobby not found' }))
  }
  updateLobbyLastActivity(lobby)

  if (lobby.phase !== 'LOBBY') {
    ws.send(JSON.stringify({ event: 'ERROR', error: 'Game already started' }))
    return
  }

  const playerCount = lobby.players.length
  if (playerCount < 4 || playerCount > 10) {
    ws.send(
      JSON.stringify({
        event: 'ERROR',
        error: 'Player count must be between 4 and 10 players.',
      }),
    )
    return
  }

  lobby.rules = getQuestRules(lobby.players.length)

  try {
    let roles = getRolesForPlayerCount(playerCount)
    lobby.allRoles = roles.allRoles

    const shuffledRoles = R.shuffle(roles.selectedRoles)
    lobby.players = lobby.players.map((player, index) => ({
      ...player,
      role: shuffledRoles[index],
    }))

    // Set first quest leader
    const questLeader = R.shuffle(lobby.players)[0]
    lobby.currentLeader = questLeader.id
    lobby.currentRound = 1

    const sanitizedLobby = {
      ...lobby,
      players: lobby.players.map((player) => ({
        id: player.id,
        name: player.name,
      })), // No roles in public state
    }
    broadcastToLobby(wss, lobbyId, {
      event: 'GAME_STATE_UPDATE',
      state: sanitizedLobby,
    })

    // Send each player their role privately
    lobby.players.forEach((player) => {
      if (player.role) {
        sendPrivateMessage(wss, player.id, {
          event: 'ROLE_ASSIGNED',
          id: player.id,
          role: player.role,
        })
      }
    })

    // Notify cleric about first leader allegiance
    const cleric = lobby.players.find((player) => player.role === 'Cleric')
    if (cleric && questLeader.role) {
      const showsAsGood =
        !questLeader.role.includes('Morgan le Fey') &&
        !questLeader.role.includes('Blind Hunter') &&
        !questLeader.role.includes('Minion of Mordred') &&
        !questLeader.role.includes('Troublemaker')

      const clericInfo = {
        firstLeader: questLeader.id,
        isGood: showsAsGood,
      }

      lobby.clericInfo = clericInfo

      sendPrivateMessage(wss, cleric.id, {
        event: 'CLERIC_INFO',
        message: clericInfo,
      })
    }

    // Notify evils (except Blind Hunter) about each other
    const evilsToNotify = lobby.players.filter(
      (p) => p.role && KNOWN_EVIL_ROLES.includes(p.role),
    )
    // In 4 or 5 player games, Morgan knows who Blind Hunter is
    const evilsToNotifyAbout =
      lobby.players.length >= 6
        ? evilsToNotify
        : lobby.players.filter((p) => p.role && EVIL_ROLES.includes(p.role))

    const evilIds = evilsToNotifyAbout.map((p) => p.id)
    lobby.knownEvils = evilIds
    evilsToNotify.forEach((p) => {
      sendPrivateMessage(wss, p.id, {
        event: 'EVIL_INFO',
        message: evilIds,
      })
    })

    // In 4 or 5 player games, Blind Hunter knows the unused good role
    if (lobby.players.length <= 5) {
      const blindHunter = lobby.players.find(
        (player) => player.role === 'Blind Hunter',
      )
      if (!blindHunter) {
        return ws.send(
          JSON.stringify({ event: 'ERROR', error: 'No Blind Hunter found.' }),
        )
      }

      lobby.unusedGoodRole = roles.unusedRole

      sendPrivateMessage(wss, blindHunter.id, {
        event: 'HUNTER_INFO',
        message: roles.unusedRole,
      })
    }

    advancePhase(lobby)
    broadcastToLobby(wss, lobbyId, {
      event: 'GAME_STATE_UPDATE',
      state: lobby,
    })
  } catch (e) {
    ws.send(JSON.stringify({ event: 'ERROR', error: (e as Error).message }))
  }
}

export const handleUpdateTeam = (
  ws: MyWebSocket,
  message: {
    lobbyId: string
    selectedPlayers: string[]
    magicTokenHolder: string | null
  },
  wss: MyWebSocketServer,
) => {
  const { lobbyId, selectedPlayers, magicTokenHolder } = message
  const lobby = LOBBIES[lobbyId]
  updateLobbyLastActivity(lobby)
  try {
    updateTeam(lobby, selectedPlayers, magicTokenHolder)
    broadcastToLobby(wss, lobbyId, {
      event: 'GAME_STATE_UPDATE',
      state: lobby,
    })
  } catch (e) {
    ws.send(JSON.stringify({ event: 'ERROR', error: (e as Error).message }))
  }
}

export const handleConfirmTeam = (
  ws: MyWebSocket,
  message: { lobbyId: string },
  wss: MyWebSocketServer,
) => {
  const { lobbyId } = message
  const lobby = LOBBIES[lobbyId]
  updateLobbyLastActivity(lobby)
  try {
    confirmTeam(lobby)
    broadcastToLobby(wss, lobbyId, {
      event: 'GAME_STATE_UPDATE',
      state: lobby,
    })
  } catch (e) {
    ws.send(JSON.stringify({ event: 'ERROR', error: (e as Error).message }))
  }
}

export const handleSubmitQuest = (
  ws: MyWebSocket,
  message: { lobbyId: string; playerId: string; isQuestCardPass: boolean },
  wss: MyWebSocketServer,
) => {
  const { lobbyId, playerId, isQuestCardPass } = message
  const lobby = LOBBIES[lobbyId]
  updateLobbyLastActivity(lobby)
  try {
    if (!lobby) {
      ws.send(JSON.stringify({ event: 'ERROR', error: 'Lobby not found.' }))
      return
    }
    // if (lobby.phase !== 'QUEST_RESOLUTION') {
    //   ws.send(JSON.stringify({ event: 'ERROR', error: 'Not the right phase.' }))
    //   return
    // }
    if (!lobby.currentTeam.includes(playerId)) {
      ws.send(
        JSON.stringify({
          event: 'ERROR',
          error: 'You are not on the quest team.',
        }),
      )
      return
    }
    if (!lobby.currentLeader) {
      ws.send(JSON.stringify({ event: 'ERROR', error: 'No leader found.' }))
      return
    }

    if (!lobby.questSubmissions) {
      lobby.questSubmissions = []
    }

    // Prevent duplicate submissions
    const alreadySubmitted = lobby.questSubmissions.some(
      (submission) => submission.playerId === playerId,
    )
    if (alreadySubmitted) {
      ws.send(
        JSON.stringify({ event: 'ERROR', error: 'Card already submitted.' }),
      )
      return
    }

    lobby.questSubmissions.push({ playerId, isQuestCardPass })

    // When all submission are in:
    if (lobby.questSubmissions.length === lobby.currentTeam.length) {
      const numFails = lobby.questSubmissions.filter(
        (submission) => !submission.isQuestCardPass,
      ).length

      const rules = getQuestRules(lobby.players.length)
      const currentQuest = rules.find((r) => r.round === lobby.currentRound)

      if (!currentQuest) {
        ws.send(
          JSON.stringify({
            event: 'ERROR',
            error: 'Current quest rules not found.',
          }),
        )
        return
      }
      const questResult =
        numFails >= currentQuest?.failsRequired ? 'Failed' : 'Passed'

      // Store the result in quest history
      lobby.questHistory.push({
        round: lobby.currentRound,
        team: lobby.currentTeam,
        fails: numFails,
        result: questResult,
      })
      lobby.veterans.push(lobby.currentLeader)

      lobby.questSubmissions = []
      lobby.currentTeam = []
      lobby.magicTokenHolder = null

      advancePhase(lobby)

      if (lobby.phase !== 'THE_DISCUSSION' && lobby.phase !== 'GOOD_VICTORY') {
        lobby.currentRound++
      }

      if (lobby.phase === 'THE_DISCUSSION') {
        setTimeout(() => {
          if (lobby.phase === 'THE_DISCUSSION') {
            lobby.phase = 'HUNTING_OPTION'
            broadcastToLobby(wss, lobbyId, {
              event: 'GAME_STATE_UPDATE',
              state: lobby,
            })
            setTimeout(() => {
              if (lobby.phase === 'HUNTING_OPTION') {
                lobby.phase = 'GOODS_LAST_CHANCE'
                broadcastToLobby(wss, lobbyId, {
                  event: 'GAME_STATE_UPDATE',
                  state: lobby,
                })
              }
            }, HUNTING_OPTION_SECONDS * 1000)
          }
        }, DISCUSSION_TIME_SECONDS * 1000)
      }
      broadcastToLobby(wss, lobbyId, {
        event: 'GAME_STATE_UPDATE',
        state: lobby,
      })
    } else {
      // Inform the player their card was submitted successfully
      ws.send(JSON.stringify({ event: 'CARD_RECEIVED', playerId }))
    }
  } catch (e) {
    ws.send(JSON.stringify({ event: 'ERROR', error: (e as Error).message }))
  }
}

export const handleUpdateLeader = (
  ws: MyWebSocket,
  message: {
    lobbyId: string
    updatedLeader: string
  },
  wss: MyWebSocketServer,
) => {
  const { lobbyId, updatedLeader } = message
  const lobby = LOBBIES[lobbyId]
  updateLobbyLastActivity(lobby)
  try {
    updateLeader(lobby, updatedLeader)
    broadcastToLobby(wss, lobbyId, {
      event: 'GAME_STATE_UPDATE',
      state: lobby,
    })
  } catch (e) {
    ws.send(JSON.stringify({ event: 'ERROR', error: (e as Error).message }))
  }
}

export const handleUpdateAmuletHolder = (
  ws: MyWebSocket,
  message: {
    lobbyId: string
    updatedAmuletHolder: string
  },
  wss: MyWebSocketServer,
) => {
  const { lobbyId, updatedAmuletHolder } = message
  const lobby = LOBBIES[lobbyId]
  updateLobbyLastActivity(lobby)
  try {
    updateAmuletHolder(lobby, updatedAmuletHolder)
    broadcastToLobby(wss, lobbyId, {
      event: 'GAME_STATE_UPDATE',
      state: lobby,
    })
  } catch (e) {
    ws.send(JSON.stringify({ event: 'ERROR', error: (e as Error).message }))
  }
}

export const handleUpdateAmuletUsage = (
  ws: MyWebSocket,
  message: {
    lobbyId: string
    updatedAmuletUsage: string
  },
  wss: MyWebSocketServer,
) => {
  const { lobbyId, updatedAmuletUsage } = message
  const lobby = LOBBIES[lobbyId]
  updateLobbyLastActivity(lobby)
  try {
    updateAmuletUsage(lobby, updatedAmuletUsage)
    broadcastToLobby(wss, lobbyId, {
      event: 'GAME_STATE_UPDATE',
      state: lobby,
    })
  } catch (e) {
    ws.send(JSON.stringify({ event: 'ERROR', error: (e as Error).message }))
  }
}

export const handleConfirmLeader = (
  ws: MyWebSocket,
  message: { lobbyId: string },
  wss: MyWebSocketServer,
) => {
  const { lobbyId } = message
  const lobby = LOBBIES[lobbyId]
  updateLobbyLastActivity(lobby)

  confirmLeader(lobby)
  broadcastToLobby(wss, lobbyId, {
    event: 'GAME_STATE_UPDATE',
    state: lobby,
  })
}

export const handleConfirmAmuletUsage = (
  ws: MyWebSocket,
  message: { lobbyId: string },
  wss: MyWebSocketServer,
) => {
  const { lobbyId } = message
  const lobby = LOBBIES[lobbyId]
  updateLobbyLastActivity(lobby)

  confirmAmuletUsage(lobby)
  broadcastToLobby(wss, lobbyId, {
    event: 'GAME_STATE_UPDATE',
    state: lobby,
  })

  const latestResult = lobby.amuletHistory.find(
    (result) => result.amuletHolder === ws.playerId,
  )

  if (!latestResult) {
    ws.send(
      JSON.stringify({
        event: 'ERROR',
        error: 'No amulet usages found in amulet history.',
      }),
    )
    return
  }

  ws.send(JSON.stringify({ event: 'AMULET_INFO', message: latestResult }))
}

export const handleHuntStarted = (
  ws: MyWebSocket,
  message: { lobbyId: string },
  wss: MyWebSocketServer,
) => {
  const { lobbyId } = message
  const lobby = LOBBIES[lobbyId]
  updateLobbyLastActivity(lobby)

  lobby.phase = 'THE_HUNT'
  broadcastToLobby(wss, lobbyId, {
    event: 'GAME_STATE_UPDATE',
    state: lobby,
  })
}

export const handleUpdateHunted = (
  ws: MyWebSocket,
  message: {
    lobbyId: string
    hunted: { playerId: string; role: string | null }[]
  },
  wss: MyWebSocketServer,
) => {
  const { lobbyId, hunted } = message
  const lobby = LOBBIES[lobbyId]
  updateLobbyLastActivity(lobby)
  try {
    if (hunted.length > 2) {
      throw new Error('Too many players selected for the Hunt.')
    }
    lobby.hunted = hunted
    broadcastToLobby(wss, lobbyId, {
      event: 'GAME_STATE_UPDATE',
      state: lobby,
    })
  } catch (e) {
    ws.send(JSON.stringify({ event: 'ERROR', error: (e as Error).message }))
  }
}

export const handleConfirmHunted = (
  ws: MyWebSocket,
  message: { lobbyId: string },
  wss: MyWebSocketServer,
) => {
  const { lobbyId } = message
  const lobby = LOBBIES[lobbyId]
  updateLobbyLastActivity(lobby)
  try {
    if (lobby.hunted.length !== 2) {
      throw new Error('Must select exactly two players for the Hunt.')
    }
    if (lobby.hunted.some((p) => !p.role)) {
      throw new Error('At least one role not selected.')
    }
    if (!lobby.hunted.some((p) => p.role === 'Cleric')) {
      throw new Error('Cleric not selected.')
    }
    if (!lobby.hunted.some((p) => p.role !== 'Cleric')) {
      throw new Error('No non-Cleric role selected.')
    }
    advancePhase(lobby)
    broadcastToLobby(wss, lobbyId, {
      event: 'GAME_STATE_UPDATE',
      state: lobby,
    })
  } catch (e) {
    ws.send(JSON.stringify({ event: 'ERROR', error: (e as Error).message }))
  }
}

export const handleSubmitPointed = (
  ws: MyWebSocket,
  message: { lobbyId: string; playerId: string; pointed: string[] },
  wss: MyWebSocketServer,
) => {
  const { lobbyId, playerId, pointed } = message
  const lobby = LOBBIES[lobbyId]
  updateLobbyLastActivity(lobby)
  if (!lobby) {
    ws.send(JSON.stringify({ event: 'ERROR', error: 'Lobby not found.' }))
    return
  }
  const player = lobby.players.find((p) => p.id === playerId)
  if (!player) {
    ws.send(
      JSON.stringify({
        event: 'ERROR',
        error: `Player ${playerId} not found.`,
      }),
    )
    return
  }
  player.pointers = pointed

  const goodPlayers = lobby.players.filter(
    (p) => p.role && !EVIL_ROLES.includes(p.role),
  )

  if (!goodPlayers.every((p) => p.pointers)) {
    return
  }

  // Track evil players' pointed at counts and total pointers at good
  const evilPlayers = lobby.players.filter(
    (p) => p.role && EVIL_ROLES.includes(p.role),
  )
  const goodPlayersIds = new Set(goodPlayers.map((p) => p.id))

  let totalPointsAtGood = 0
  let evilsPointedAt: Map<string, number> = new Map()

  goodPlayers.forEach((goodPlayer) =>
    goodPlayer.pointers?.forEach((p) => {
      if (goodPlayersIds.has(p)) {
        totalPointsAtGood++
      } else {
        if (evilsPointedAt.has(p)) {
          const currentCount = evilsPointedAt.get(p) || 0
          evilsPointedAt.set(p, currentCount + 1)
        } else {
          evilsPointedAt.set(p, 1)
        }
      }
    }),
  )

  const evilPlayersIds = new Set(evilPlayers.map((p) => p.id))
  const evilsPointedAtIds = new Set(evilsPointedAt.keys())
  const evilsNotPointedAt = [...evilPlayersIds].filter(
    (id) => !evilsPointedAtIds.has(id),
  )

  const isDukePresent = lobby.players.some((p) => p.role === 'Duke')
  const isArchdukePresent = lobby.players.some((p) => p.role === 'Archduke')

  const victory = determineVictoryFromPointing(
    evilsNotPointedAt.length,
    totalPointsAtGood,
    isDukePresent,
    isArchdukePresent,
  )
  lobby.phase = victory

  broadcastToLobby(wss, lobbyId, {
    event: 'GAME_STATE_UPDATE',
    state: lobby,
  })
}

// Proof of correctness in Figma
function determineVictoryFromPointing(
  evilsNotPointedAtCount: number,
  totalPointsAtGood: number,
  isDukePresent: boolean,
  isArchdukePresent: boolean,
): 'GOOD_VICTORY' | 'EVIL_VICTORY' {
  // Case 1: >1 evil is not pointed at
  if (evilsNotPointedAtCount > 1) {
    return 'EVIL_VICTORY'
  }

  // Case 2: Exactly 1 evil not pointed at
  if (evilsNotPointedAtCount === 1) {
    if (!isArchdukePresent) {
      return 'EVIL_VICTORY'
    }
    // isArchdukePresent === true
    if (totalPointsAtGood < 2) {
      return 'GOOD_VICTORY'
    }
    if (totalPointsAtGood > 2) {
      return 'EVIL_VICTORY'
    }
    // totalPointsAtGood === 2
    return isDukePresent ? 'GOOD_VICTORY' : 'EVIL_VICTORY'
  }

  // Case 3: evilsNotPointedAtCount === 0 (all evils covered)
  if (totalPointsAtGood < 1) {
    return 'GOOD_VICTORY'
  }
  if (totalPointsAtGood > 2) {
    return 'EVIL_VICTORY'
  }
  if (totalPointsAtGood === 1) {
    return isDukePresent || isArchdukePresent ? 'GOOD_VICTORY' : 'EVIL_VICTORY'
  }
  // totalPointsAtGood === 2
  return isDukePresent && isArchdukePresent ? 'GOOD_VICTORY' : 'EVIL_VICTORY'
}

export const resetLobby = (
  ws: MyWebSocket,
  message: { lobbyId: string },
  wss: MyWebSocketServer,
) => {
  const { lobbyId } = message
  LOBBIES[lobbyId] = {
    lobbyId: lobbyId,
    lastActivity: Date.now(),
    phase: 'LOBBY',
    players: [],
    disconnectedPlayers: [],
    veterans: [],
    amuletHistory: [],
    questHistory: [],
    currentLeader: null,
    upcomingLeader: null,
    amuletHolder: null,
    amuletUsedOn: null,
    currentRound: 0,
    currentTeam: [],
    magicTokenHolder: null,
    questSubmissions: [],
    discussionStartTime: null,
    hunted: [],
  }
}

// Helper function to broadcast a message to all clients in a lobby
export const broadcastToLobby = (
  wss: MyWebSocketServer,
  lobbyId: string,
  data: object,
) => {
  const payload = JSON.stringify(data)
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN && client.lobbyId === lobbyId) {
      client.send(payload)
    }
  })
}

// Helper function to send a private message to a specific client
const sendPrivateMessage = (
  wss: MyWebSocketServer,
  clientId: string,
  data: object,
) => {
  const payload = JSON.stringify(data)
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN && client.playerId === clientId) {
      client.send(payload)
    }
  })
}

/**
 * This updates the last activity timestamp of a lobby.
 * We delete lobbies after 60 mins of inactivity, so we should call this any time we process an event.
 *
 * @param lobby
 */

const updateLobbyLastActivity = (lobby: Lobby) => {
  lobby.lastActivity = Date.now()
}

export function removeStaleLobbies(
  LOBBIES: Record<string, Lobby>,
  timeout: number,
) {
  const now = Date.now()
  for (const lobbyId in LOBBIES) {
    const lobby = LOBBIES[lobbyId]
    if (lobby.lastActivity && now - lobby.lastActivity > timeout) {
      console.log(`Deleting lobby ${lobbyId} due to inactivity.`)
      delete LOBBIES[lobbyId]
    }
  }
}
