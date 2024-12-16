import { broadcastToLobby } from '../sockets/handlers'
import { MyWebSocketServer, Lobby } from './types'

export type GamePhase =
  | 'LOBBY'
  | 'TEAM_SELECTION'
  | 'QUEST_RESOLUTION'
  | 'LEADER_SELECTION'
  | 'AMULET_USAGE'
  | 'ENDGAME_DISCUSSION'
  | 'GAME_OVER'

export const advancePhase = (
  lobby: Lobby,
  wss: MyWebSocketServer,
  lobbyId: string
) => {
  switch (lobby.phase) {
    case 'LOBBY':
      lobby.phase = 'TEAM_SELECTION'
      break

    case 'TEAM_SELECTION':
      lobby.phase = 'QUEST_RESOLUTION'
      break

    case 'QUEST_RESOLUTION':
      if (isGameOver(lobby)) {
        lobby.phase = 'GAME_OVER'
      } else {
        lobby.phase = 'LEADER_SELECTION'
      }
      break

    case 'LEADER_SELECTION':
      lobby.phase = 'TEAM_SELECTION'
      break

    case 'GAME_OVER':
      break

    default:
      throw new Error(`Unknown phase: ${lobby.phase}`)
  }

  console.log(lobby)

  broadcastToLobby(wss, lobbyId, {
    event: 'GAME_STATE_UPDATE',
    state: lobby,
  })
}

const isGameOver = (lobby: Lobby) => false
