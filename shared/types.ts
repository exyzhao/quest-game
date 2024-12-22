import { WebSocketServer, WebSocket } from 'ws'
import { GamePhase } from '../server/game/stateMachine'
import { QuestRules } from '../server/game/ruleset'

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
  pointers?: string[] // TODO: Make this null or undefined?
}

export interface Lobby {
  lobbyId: string
  phase: GamePhase
  players: Player[]
  disconnectedPlayers: Player[] // Track players who disconnected during the game
  clericInfo?: { firstLeader: string; isGood: boolean }
  knownEvils?: string[] // Player ids
  veterans: string[] // Player ids
  rules?: QuestRules[]
  questHistory: QuestResult[]
  currentLeader: string | null
  upcomingLeader: string | null
  amuletHolder: string | null
  currentRound: number
  currentTeam: string[]
  magicTokenHolder: string | null
  questSubmissions: { playerId: string; isQuestCardPass: boolean }[]
  isHunting: boolean
  hunted?: { playerId: string; role: string }[]
}

export type sanitizedLobby = Omit<Lobby, 'clericInfo | knownEvils'>

export interface QuestResult {
  round: number
  team: string[]
  fails: number
  result: 'Passed' | 'Failed'
}
