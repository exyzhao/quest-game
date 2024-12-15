const http = require('http')
const express = require('express')
const initWebSockets = require('./sockets') // Import the socket setup function

const app = express()

// Optional: set up some HTTP routes
app.get('/ping', (req, res) => res.send('pong'))

// Create HTTP server from the Express app
const server = http.createServer(app)

// Initialize the WebSocket server with the existing HTTP server
initWebSockets(server)

const PORT = 3000
server.listen(PORT, () => {
  console.log(`HTTP & WebSocket server running on port ${PORT}`)
})
