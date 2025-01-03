import { WebSocketServer } from 'ws'
import { MyWebSocket, MyWebSocketServer } from '../types'
import {
  handleDebugState,
  handleJoinGame,
  handleStartGame,
  handleDisconnection,
  handleUpdateTeam,
  handleConfirmTeam,
  handleSubmitQuest,
  handleUpdateLeader,
  handleUpdateAmuletHolder,
  handleUpdateAmuletUsage,
  handleConfirmLeader,
  handleConfirmAmuletUsage,
  handleHuntStarted,
  handleUpdateHunted,
  handleConfirmHunted,
  handleSubmitPointed,
} from './handlers'
import { IncomingMessage } from 'http'

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
        case 'DEBUG_STATE':
          handleDebugState(ws, wss)
          break
        case 'JOIN_GAME':
          handleJoinGame(ws, data, wss)
          break
        case 'START_GAME':
          handleStartGame(ws, data, wss)
          break
        case 'UPDATE_TEAM':
          handleUpdateTeam(ws, data, wss)
          break
        case 'CONFIRM_TEAM':
          handleConfirmTeam(ws, data, wss)
          break
        case 'SUBMIT_QUEST':
          handleSubmitQuest(ws, data, wss)
          break
        case 'UPDATE_LEADER':
          handleUpdateLeader(ws, data, wss)
          break
        case 'UPDATE_AMULET_HOLDER':
          handleUpdateAmuletHolder(ws, data, wss)
          break
        case 'UPDATE_AMULET_USAGE':
          handleUpdateAmuletUsage(ws, data, wss)
          break
        case 'CONFIRM_LEADER':
          handleConfirmLeader(ws, data, wss)
          break
        case 'CONFIRM_AMULET_USAGE':
          handleConfirmAmuletUsage(ws, data, wss)
          break
        case 'HUNT_STARTED':
          handleHuntStarted(ws, data, wss)
          break
        case 'UPDATE_HUNTED':
          handleUpdateHunted(ws, data, wss)
          break
        case 'CONFIRM_HUNTED':
          handleConfirmHunted(ws, data, wss)
          break
        case 'SUBMIT_POINTED':
          handleSubmitPointed(ws, data, wss)
          break

        default:
          ws.send(JSON.stringify({ error: 'Unknown event: ' + data.event }))
          break
      }
    })

    ws.on('close', () => {
      handleDisconnection(ws, wss)
    })
  })
}
