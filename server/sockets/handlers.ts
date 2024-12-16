import { getRolesForPlayerCount } from '../game/roles'
import { GAME_STATE_UPDATE } from './events'
import { MyWebSocket, MyWebSocketServer, Player, Lobby } from '../game/types'

import * as R from 'remeda'
import { advancePhase } from '../game/stateMachine'
import { selectTeam } from '../game/quests'

const lobbies: Record<string, Lobby> = {}

const knownEvilRoles = ['Morgan le Fey', 'Minion of Mordred']

export const handleJoinGame = (
  ws: MyWebSocket,
  message: { lobbyId?: string; playerName?: string },
  wss: MyWebSocketServer
) => {
  const { lobbyId, playerName } = message

  if (!lobbyId || !playerName) {
    ws.send(
      JSON.stringify({ event: 'ERROR', error: 'Missing lobbyId or playerName' })
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
      questHistory: [],
      currentRound: 0,
      currentTeam: [],
    }
  }

  const lobby = lobbies[lobbyId]

  // Handle player reconnect
  const reconnectingPlayerIndex = lobby.disconnectedPlayers.findIndex(
    (player) => player.name === playerName
  )
  if (reconnectingPlayerIndex !== -1) {
    // Remove the player from disconnectedPlayers only
    lobby.disconnectedPlayers.splice(reconnectingPlayerIndex, 1)

    // Associate WebSocket with the player's identity
    const reconnectingPlayer = lobby.players.find((p) => p.name === playerName)
    if (reconnectingPlayer) {
      ws.lobbyId = lobbyId
      ws.playerId = reconnectingPlayer.id

      if (reconnectingPlayer.role) {
        sendPrivateMessage(wss, reconnectingPlayer.id, {
          event: 'ROLE_ASSIGNED',
          role: reconnectingPlayer.role,
        })
      }

      if (reconnectingPlayer.role === 'Cleric' && lobby.clericInfo) {
        // Resend Cleric info
        sendPrivateMessage(wss, reconnectingPlayer.id, {
          event: 'CLERIC_INFO',
          message: `The first quest leader (${lobby.clericInfo.leaderName}) is ${lobby.clericInfo.leaderAlignment}.`,
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
          message: `The known evils are: ${lobby.knownEvils.join(', ')}.`,
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
      })
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
  wss: MyWebSocketServer
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
      `Player ${player.name} disconnected during the game in lobby ${lobbyId}.`
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
  wss: MyWebSocketServer
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
  if (playerCount < 4 || playerCount > 10) {
    ws.send(
      JSON.stringify({
        event: 'ERROR',
        error: 'Player count must be between 4 and 10 players.',
      })
    )
    return
  }

  try {
    let roles = getRolesForPlayerCount(playerCount)
    roles = roles.map((role) =>
      role === 'Special Role'
        ? Math.random() < 0.5
          ? 'Troublemaker'
          : 'Youth'
        : role
    )

    const shuffledRoles = R.shuffle(roles)
    lobby.players = lobby.players.map((player, index) => ({
      ...player,
      role: shuffledRoles[index],
    }))

    // Set first quest leader
    const questLeader = R.shuffle(lobby.players)[0]
    lobby.firstQuestLeader = questLeader.id
    lobby.currentLeader = questLeader.id
    lobby.currentRound = 1

    const sanitizedLobby = {
      ...lobby,
      players: lobby.players.map((player) => ({
        id: player.id,
        name: player.name,
      })), // No roles in public state
      firstQuestLeader: questLeader.id,
    }
    broadcastToLobby(wss, lobbyId, {
      event: GAME_STATE_UPDATE,
      state: sanitizedLobby,
    })

    // Notify cleric about first leader allegiance
    const cleric = lobby.players.find((player) => player.role === 'Cleric')
    if (cleric && questLeader.role) {
      const leaderAlignment =
        questLeader.role.includes('Morgan le Fey') ||
        questLeader.role.includes('Blind Hunter') ||
        questLeader.role.includes('Minion of Mordred') ||
        questLeader.role.includes('Troublemaker')
          ? 'Evil'
          : 'Good'

      lobby.clericInfo = {
        leaderName: questLeader.name,
        leaderAlignment: leaderAlignment,
      }

      sendPrivateMessage(wss, cleric.id, {
        event: 'CLERIC_INFO',
        message: `The first quest leader (${questLeader.name}) is ${leaderAlignment}.`,
      })
    }

    // Notify evils (except Blind Hunter) about each other
    const evils = lobby.players.filter(
      (p) => p.role && knownEvilRoles.includes(p.role)
    )
    if (evils.length > 0) {
      const evilNames = evils.map((e) => e.name)
      lobby.knownEvils = evilNames // Store known evils

      evils.forEach((evil) => {
        sendPrivateMessage(wss, evil.id, {
          event: 'EVIL_INFO',
          message: `The known evils are: ${evilNames.join(', ')}.`,
        })
      })
    }

    // Send each player their role privately
    lobby.players.forEach((player) => {
      if (player.role) {
        sendPrivateMessage(wss, player.id, {
          event: 'ROLE_ASSIGNED',
          role: player.role,
        })
      }
    })
    advancePhase(lobby, wss, lobbyId)
  } catch (e) {
    ws.send(JSON.stringify({ event: 'ERROR', error: (e as Error).message }))
  }
}

export const handleSelectTeam = (
  ws: MyWebSocket,
  message: {
    lobbyId: string
    selectedPlayers: string[]
    magicTokenHolder: string
  },
  wss: MyWebSocketServer
) => {
  const { lobbyId, selectedPlayers, magicTokenHolder } = message
  const lobby = lobbies[lobbyId]
  try {
    selectTeam(lobby, selectedPlayers, magicTokenHolder)
  } catch (e) {
    ws.send(JSON.stringify({ event: 'ERROR', error: (e as Error).message }))
  }
}

// Helper function to broadcast a message to all clients in a lobby
export const broadcastToLobby = (
  wss: MyWebSocketServer,
  lobbyId: string,
  data: object
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
  data: object
) => {
  const payload = JSON.stringify(data)
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN && client.playerId === clientId) {
      client.send(payload)
    }
  })
}
