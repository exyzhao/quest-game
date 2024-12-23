import { getRolesForPlayerCount } from '../game/roles'
import { GAME_STATE_UPDATE } from './events'
import { MyWebSocket, MyWebSocketServer, Lobby } from '../../shared/types'
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
// import { knownEvilRoles } from '../../shared/constants' TODO
export const knownEvilRoles = ['Morgan le Fey', 'Minion of Mordred']

const lobbies: Record<string, Lobby> = {}

export const handleDebugState = (ws: MyWebSocket, wss: MyWebSocketServer) => {
  // TEAM SELECTION
  const lobbyId = '1234'
  lobbies[lobbyId] = {
    lobbyId,
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
    veterans: [],
    questHistory: [],
    amuletHistory: [],
    currentRound: 1,
    currentTeam: [],
    magicTokenHolder: null,
    questSubmissions: [],
    rules: getQuestRules(6),
    currentLeader: 'player-1',
    upcomingLeader: null,
    amuletHolder: null,
    amuletUsedOn: null,
    isHunting: false,
    knownEvils: ['player-1', 'player-2'],
    clericInfo: {
      firstLeader: 'player-1',
      isGood: false,
    },
  }
  const lobby = lobbies[lobbyId]

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
    ws.send(
      JSON.stringify({
        event: 'ERROR',
        error: 'Missing lobbyId or playerName',
      }),
    )
    return
  }

  // If lobby doesn't exist, create it
  if (!lobbies[lobbyId]) {
    lobbies[lobbyId] = {
      lobbyId: lobbyId,
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
      isHunting: false,
    }
  }

  const lobby = lobbies[lobbyId]

  // Handle player reconnect
  const reconnectingPlayerIndex = lobby.disconnectedPlayers.findIndex(
    (player) => player.name === playerName,
  )
  if (reconnectingPlayerIndex !== -1) {
    // Remove the player from disconnectedPlayers only
    // TODO clean up logic
    const reconnectingPlayer = lobby.players.find((p) => p.name === playerName)
    lobby.disconnectedPlayers.splice(reconnectingPlayerIndex, 1)
    // Associate WebSocket with the player's identity
    if (reconnectingPlayer) {
      ws.lobbyId = lobbyId
      ws.playerId = reconnectingPlayer.id

      if (reconnectingPlayer.role) {
        sendPrivateMessage(wss, reconnectingPlayer.id, {
          event: 'ROLE_ASSIGNED',
          id: reconnectingPlayer.id,
          role: reconnectingPlayer.role,
        })
      }

      if (reconnectingPlayer.role === 'Cleric' && lobby.clericInfo) {
        // Resend Cleric info
        sendPrivateMessage(wss, reconnectingPlayer.id, {
          event: 'CLERIC_INFO',
          message: lobby.clericInfo,
        })
      }

      if (
        reconnectingPlayer.role &&
        knownEvilRoles.includes(reconnectingPlayer.role) &&
        lobby.knownEvils
      ) {
        // Resend known evils info
        sendPrivateMessage(wss, reconnectingPlayer.id, {
          event: 'EVIL_INFO',
          message: lobby.knownEvils,
        })
      }

      console.log(`Player ${playerName} reconnected to lobby ${lobbyId}.`)

      broadcastToLobby(wss, lobbyId, {
        event: 'GAME_STATE_UPDATE',
        state: lobby,
      })
      return
    }
  }

  if (lobby.phase !== 'LOBBY') {
    ws.send(JSON.stringify({ event: 'ERROR', error: 'Game already started' }))
    return
  }

  if (lobby.players.find((player) => player.name === playerName)) {
    ws.send(
      JSON.stringify({
        event: 'ERROR',
        error: 'A player with this name already exists in the lobby.',
      }),
    )
    return
  }

  // Add player to lobby if they're not in it
  const playerId = `player-${Date.now()}`
  if (!lobby.players.find((player) => player.name === playerName)) {
    lobby.players.push({ id: playerId, name: playerName })
  }

  // Associate this WebSocket connection with the lobby
  ws.lobbyId = lobbyId
  ws.playerId = playerId

  // Broadcast the updated lobby state to all players in the lobby
  console.log(`Player ${playerName} connected to lobby ${lobbyId}.`)
  broadcastToLobby(wss, lobbyId, { event: GAME_STATE_UPDATE, state: lobby })
}

export const handleDisconnection = (
  ws: MyWebSocket,
  wss: MyWebSocketServer,
) => {
  const { lobbyId, playerId } = ws
  if (!lobbyId || !playerId) return

  const lobby = lobbies[lobbyId]
  if (!lobby) return

  const player = lobby.players.find((p) => p.id === playerId)
  if (!player) return

  if (lobby.phase === 'LOBBY') {
    // Remove the player entirely if still in the lobby phase
    const playerIndex = lobby.players.findIndex((p) => p.id === playerId)
    if (playerIndex !== -1) {
      const [removedPlayer] = lobby.players.splice(playerIndex, 1)
      console.log(`Player ${removedPlayer.name} removed from lobby ${lobbyId}.`)
    }
  } else {
    // In game phase, just mark them as disconnected
    if (!lobby.disconnectedPlayers.find((dp) => dp.id === playerId)) {
      lobby.disconnectedPlayers.push(player)
    }
    console.log(
      `Player ${player.name} disconnected during the game in lobby ${lobbyId}.`,
    )
  }

  broadcastToLobby(wss, lobbyId, {
    event: GAME_STATE_UPDATE,
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

  const lobby = lobbies[lobbyId]
  if (!lobby) {
    ws.send(JSON.stringify({ event: 'ERROR', error: 'Lobby not found' }))
  }

  if (lobby.phase !== 'LOBBY') {
    ws.send(JSON.stringify({ event: 'ERROR', error: 'Game already started' }))
    return
  }

  const playerCount = lobby.players.length
  // TODO: adjust back
  if (playerCount < 2 || playerCount > 10) {
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
    roles = roles.map((role) =>
      role === 'Special Role'
        ? Math.random() < 0.5
          ? 'Troublemaker'
          : 'Youth'
        : role,
    )

    const shuffledRoles = R.shuffle(roles)
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
      event: GAME_STATE_UPDATE,
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
    const evils = lobby.players.filter(
      (p) => p.role && knownEvilRoles.includes(p.role),
    )
    if (evils.length > 0) {
      const evilIds = evils.map((e) => e.id)
      lobby.knownEvils = evilIds

      evils.forEach((evil) => {
        sendPrivateMessage(wss, evil.id, {
          event: 'EVIL_INFO',
          message: evilIds,
        })
      })
    }
    advancePhase(lobby)
    broadcastToLobby(wss, lobbyId, {
      event: GAME_STATE_UPDATE,
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
  const lobby = lobbies[lobbyId]
  try {
    updateTeam(lobby, selectedPlayers, magicTokenHolder)
    broadcastToLobby(wss, lobbyId, {
      event: GAME_STATE_UPDATE,
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
  const lobby = lobbies[lobbyId]
  try {
    confirmTeam(lobby)
    broadcastToLobby(wss, lobbyId, {
      event: GAME_STATE_UPDATE,
      state: lobby,
    })
  } catch (e) {
    ws.send(JSON.stringify({ event: 'ERROR', error: (e as Error).message }))
  }
}

export const handleConfirmAmuletUsage = (
  ws: MyWebSocket,
  message: { lobbyId: string },
  wss: MyWebSocketServer,
) => {
  const { lobbyId } = message
  const lobby = lobbies[lobbyId]
  try {
    confirmAmuletUsage(lobby)
    broadcastToLobby(wss, lobbyId, {
      event: GAME_STATE_UPDATE,
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
  const lobby = lobbies[lobbyId]
  try {
    if (!lobby) {
      ws.send(JSON.stringify({ event: 'ERROR', error: 'Lobby not found.' }))
      return
    }
    if (lobby.phase !== 'QUEST_RESOLUTION') {
      ws.send(JSON.stringify({ event: 'ERROR', error: 'Not the right phase.' }))
      return
    }
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
      lobby.currentRound++

      advancePhase(lobby)
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
  const lobby = lobbies[lobbyId]
  try {
    updateLeader(lobby, updatedLeader)
    broadcastToLobby(wss, lobbyId, {
      event: GAME_STATE_UPDATE,
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
  const lobby = lobbies[lobbyId]
  try {
    updateAmuletHolder(lobby, updatedAmuletHolder)
    broadcastToLobby(wss, lobbyId, {
      event: GAME_STATE_UPDATE,
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
  const lobby = lobbies[lobbyId]
  try {
    updateAmuletUsage(lobby, updatedAmuletUsage)
    broadcastToLobby(wss, lobbyId, {
      event: GAME_STATE_UPDATE,
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
  const lobby = lobbies[lobbyId]
  try {
    confirmLeader(lobby)
    broadcastToLobby(wss, lobbyId, {
      event: GAME_STATE_UPDATE,
      state: lobby,
    })
  } catch (e) {
    ws.send(JSON.stringify({ event: 'ERROR', error: (e as Error).message }))
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
