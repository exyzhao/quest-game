const http = require('http')
const express = require('express')
const initWebSockets = require('./sockets')

const app = express()

app.get('/ping', (req, res) => res.send('pong'))

const server = http.createServer(app)
initWebSockets(server)

const PORT = 3000
server.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`)
})
