const { getRolesForPlayerCount } = require('../game/roles')
const { GAME_STATE_UPDATE } = require('./events')
const { shuffle } = require('../utils/shuffle')

const lobbies = {}

const broadcastToLobby = (wss, lobbyId, data) => {
  const payload = JSON.stringify(data)
  wss.clients.forEach((client) => {
    if (client.readyState === 1 && client.lobbyId === lobbyId) {
      client.send(payload)
    }
  })
}

const handleJoinGame = (ws, message, wss) => {
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

const handleStartGame = (ws, message, wss) => {
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
  if (playerCount < 6 || playerCount > 10) {
    ws.send(
      JSON.stringify({
        error: 'Player count must be between 6 and 10 players.',
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

    const shuffledRoles = shuffle(roles)
    lobby.players = lobby.players.map((player, index) => ({
      ...player,
      role: shuffledRoles[index],
    }))

    lobby.phase = 'IN_GAME'

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
      wss.clients.forEach((client) => {
        if (client.readyState === 1 && client.playerId === player.id) {
          client.send(
            JSON.stringify({ event: 'ROLE_ASSIGNED', role: player.role })
          )
        }
      })
    })
  } catch (e) {
    ws.send(JSON.stringify({ error: e.message }))
  }
}

module.exports = {
  handleJoinGame,
  handleStartGame,
  lobbies,
}
