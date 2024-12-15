const { WebSocketServer } = require('ws')

module.exports = (server) => {
  const wss = new WebSocketServer({ server })

  wss.on('connection', (ws) => {
    console.log('New WebSocket client connected')

    ws.on('message', (message) => {
      console.log('Received:', message.toString())
      ws.send('Hello from the WebSocket server!')
    })

    ws.on('close', () => {
      console.log('WebSocket client disconnected')
    })
  })
}
