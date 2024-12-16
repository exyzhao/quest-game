import { WebSocketServer, WebSocket } from 'ws'
import { GamePhase } from './stateMachine'

export interface MyWebSocket extends WebSocket {
  lobbyId?: string
  playerId?: string
}

export interface MyWebSocketServer extends WebSocketServer {
  clients: Set<MyWebSocket>
}

export interface Player {
  id: string
  name: string
  role?: string
}

export interface Lobby {
  phase: GamePhase
  players: Player[]
  disconnectedPlayers: Player[] // Track players who disconnected during the game
  firstQuestLeader?: string
  veterans: string[]
  questHistory: QuestResult[]
  currentLeader?: string
  currentRound: number
  currentTeam: string[]
  magicTokenHolder?: string
}

export interface QuestResult {
  round: number
  team: string[]
  fails: number
  result: 'Passed' | 'Failed'
}
