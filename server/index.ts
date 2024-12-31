import http from 'http'
import express, { Application } from 'express'
import { initWebSockets } from './sockets'
import { LOBBIES, removeStaleLobbies } from './sockets/handlers'
import cors from 'cors'

const app: Application = express()
app.use(cors())

const server = http.createServer(app)
initWebSockets(server)

// Use the Fly-assigned port if available, otherwise default to 4000
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 4000

// Bind to 0.0.0.0
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server listening on port ${PORT}`)
})

// Periodic Cleanup
const LOBBY_TIMEOUT = 1000 * 60 * 60 // 60 min
setInterval(() => {
  removeStaleLobbies(LOBBIES, LOBBY_TIMEOUT)
}, 60000)
