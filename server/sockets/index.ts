import { WebSocketServer, WebSocket } from 'ws'
import { JOIN_GAME, START_GAME, UPDATE_TEAM, CONFIRM_TEAM } from './events'
import {
  handleJoinGame,
  handleStartGame,
  handleDisconnection,
  handleUpdateTeam,
  handleConfirmTeam,
} from './handlers'
import { IncomingMessage } from 'http'

// TODO: Find a place to put these reused types
interface MyWebSocket extends WebSocket {
  lobbyId?: string
  playerId?: string
}

interface MyWebSocketServer extends WebSocketServer {
  clients: Set<MyWebSocket>
}

export const initWebSockets = (server: import('http').Server) => {
  const wss = new WebSocketServer({ server }) as MyWebSocketServer

  wss.on('connection', (ws: MyWebSocket, req: IncomingMessage) => {
    ws.on('message', (msg: string) => {
      let data: any
      try {
        data = JSON.parse(msg)
      } catch (e) {
        ws.send(JSON.stringify({ error: 'Invalid JSON' }))
        return
      }

      switch (data.event) {
        case JOIN_GAME:
          handleJoinGame(ws, data, wss)
          break
        case START_GAME:
          handleStartGame(ws, data, wss)
          break
        case UPDATE_TEAM:
          handleUpdateTeam(ws, data, wss)
          break
        case CONFIRM_TEAM:
          handleConfirmTeam(ws, data, wss)
          break
        default:
          ws.send(JSON.stringify({ error: 'Unknown event' }))
          break
      }
    })

    ws.on('close', () => {
      handleDisconnection(ws, wss)
    })
  })
}
