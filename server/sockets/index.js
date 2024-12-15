const { WebSocketServer } = require('ws')
const { JOIN_GAME, START_GAME } = require('./events')
const { handleJoinGame, handleStartGame } = require('./handlers')

module.exports = (server) => {
  const wss = new WebSocketServer({ server })

  wss.on('connection', (ws) => {
    console.log('Client connected')

    ws.on('message', (msg) => {
      let data
      try {
        data = JSON.parse(msg)
      } catch (e) {
        ws.send(JSON.stringify({ error: 'Invalid JSON' }))
      }

      switch (data.event) {
        case JOIN_GAME:
          handleJoinGame(ws, data, wss)
          break
        case START_GAME:
          handleStartGame(ws, data, wss)
          break
        default:
          ws.send(JSON.stringify({ error: 'Unknown event' }))
          break
      }
    })

    ws.on('close', () => {
      console.log('Client disconnected')
    })
  })
}
