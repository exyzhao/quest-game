import http from 'http'
import express, { Application } from 'express'
import { initWebSockets } from './sockets'
import { LOBBIES, removeStaleLobbies } from './sockets/handlers'

const app: Application = express()

const server = http.createServer(app)
initWebSockets(server)

const PORT = 4000
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`)
})

// Periodic Cleanup
const LOBBY_TIMEOUT = 1000 * 60 * 90 // 90 min
setInterval(() => {
  removeStaleLobbies(LOBBIES, LOBBY_TIMEOUT)
}, 60000)
