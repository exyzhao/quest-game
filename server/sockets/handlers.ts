import { getRolesForPlayerCount } from '../game/roles'
import { GAME_STATE_UPDATE } from './events'
import { WebSocketServer, WebSocket } from 'ws'

import * as R from 'remeda'

interface MyWebSocket extends WebSocket {
  lobbyId?: string
  playerId?: string
}

interface MyWebSocketServer extends WebSocketServer {
  clients: Set<MyWebSocket>
}

interface Player {
  id: string
  name: string
  role?: string
}

interface Lobby {
  phase: 'LOBBY' | 'IN_GAME'
  players: Player[]
  firstQuestLeader?: string
}

const lobbies: Record<string, Lobby> = {}

export const handleJoinGame = (
  ws: MyWebSocket,
  message: { lobbyId?: string; playerName?: string },
  wss: MyWebSocketServer
) => {
  const { lobbyId, playerName } = message

  if (!lobbyId || !playerName) {
    ws.send(JSON.stringify({ error: 'Missing lobbyId or playerName' }))
    return
  }

  // If lobby doesn't exist, create it
  if (!lobbies[lobbyId]) {
    lobbies[lobbyId] = {
      phase: 'LOBBY',
      players: [],
    }
  }

  const lobby = lobbies[lobbyId]

  // Add player to lobby if they're not in it
  const playerId = `player-${Date.now()}`
  if (!lobby.players.find((player) => player.name === playerName)) {
    lobby.players.push({ id: playerId, name: playerName })
  }

  // Associate this WebSocket connection with the lobby
  ws.lobbyId = lobbyId
  ws.playerId = playerId

  // Broadcast the updated lobby state to all players in the lobby
  broadcastToLobby(wss, lobbyId, { event: GAME_STATE_UPDATE, state: lobby })
}

export const handleStartGame = (
  ws: MyWebSocket,
  message: { lobbyId?: string },
  wss: MyWebSocketServer
) => {
  const { lobbyId } = message

  if (!lobbyId) {
    ws.send(JSON.stringify({ error: 'Missing lobbyId' }))
    return
  }

  const lobby = lobbies[lobbyId]
  if (!lobby) {
    ws.send(JSON.stringify({ error: 'Lobby not found' }))
  }

  if (lobby.phase !== 'LOBBY') {
    ws.send(JSON.stringify({ error: 'Game already started' }))
    return
  }

  const playerCount = lobby.players.length
  if (playerCount < 4 || playerCount > 10) {
    ws.send(
      JSON.stringify({
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

    lobby.phase = 'IN_GAME'

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
      sendPrivateMessage(wss, cleric.id, {
        event: 'CLERIC_INFO',
        message: `The first quest leader (${questLeader.name}) is ${leaderAlignment}.`,
      })
    }

    // Notify evils (except Blind Hunter) about each other
    const knownEvilRoles = ['Morgan le Fey', 'Minion of Mordred']
    const evils = lobby.players.filter(
      (p) => p.role && knownEvilRoles.includes(p.role)
    )
    if (evils.length > 0) {
      const evilNames = evils.map((e) => e.name).join(', ')
      evils.forEach((evil) => {
        sendPrivateMessage(wss, evil.id, {
          event: 'EVIL_INFO',
          message: `The known evils are: ${evilNames}.`,
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
  } catch (e) {
    ws.send(JSON.stringify({ error: (e as Error).message }))
  }
}

// Helper function to broadcast a message to all clients in a lobby
const broadcastToLobby = (
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

module.exports = {
  handleJoinGame,
  handleStartGame,
  lobbies,
}
