"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleJoinGame = void 0;
const roles_1 = require("../game/roles");
const events_1 = require("./events");
const shuffle_1 = require("../utils/shuffle");
const lobbies = {};
const handleJoinGame = (ws, message, wss) => {
    const { lobbyId, playerName } = message;
    if (!lobbyId || !playerName) {
        ws.send(JSON.stringify({ error: 'Missing lobbyId or playerName' }));
        return;
    }
    // If lobby doesn't exist, create it
    if (!lobbies[lobbyId]) {
        lobbies[lobbyId] = {
            phase: 'LOBBY',
            players: [],
        };
    }
    const lobby = lobbies[lobbyId];
    // Add player to lobby if they're not in it
    const playerId = `player-${Date.now()}`;
    if (!lobby.players.find((player) => player.name === playerName)) {
        lobby.players.push({ id: playerId, name: playerName });
    }
    // Associate this WebSocket connection with the lobby
    ws.lobbyId = lobbyId;
    ws.playerId = playerId;
    // Broadcast the updated lobby state to all players in the lobby
    broadcastToLobby(wss, lobbyId, { event: events_1.GAME_STATE_UPDATE, state: lobby });
};
exports.handleJoinGame = handleJoinGame;
const handleStartGame = (ws, message, wss) => {
    const { lobbyId } = message;
    if (!lobbyId) {
        ws.send(JSON.stringify({ error: 'Missing lobbyId' }));
        return;
    }
    const lobby = lobbies[lobbyId];
    if (!lobby) {
        ws.send(JSON.stringify({ error: 'Lobby not found' }));
    }
    if (lobby.phase !== 'LOBBY') {
        ws.send(JSON.stringify({ error: 'Game already started' }));
        return;
    }
    const playerCount = lobby.players.length;
    if (playerCount < 4 || playerCount > 10) {
        ws.send(JSON.stringify({
            error: 'Player count must be between 4 and 10 players.',
        }));
        return;
    }
    try {
        let roles = (0, roles_1.getRolesForPlayerCount)(playerCount);
        roles = roles.map((role) => role === 'Special Role'
            ? Math.random() < 0.5
                ? 'Troublemaker'
                : 'Youth'
            : role);
        const shuffledRoles = (0, shuffle_1.shuffle)(roles);
        lobby.players = lobby.players.map((player, index) => ({
            ...player,
            role: shuffledRoles[index],
        }));
        // Set first quest leader
        const questLeader = (0, shuffle_1.shuffle)(lobby.players)[0];
        lobby.firstQuestLeader = questLeader.id;
        lobby.phase = 'IN_GAME';
        const sanitizedLobby = {
            ...lobby,
            players: lobby.players.map((player) => ({
                id: player.id,
                name: player.name,
            })), // No roles in public state
            firstQuestLeader: questLeader.id,
        };
        broadcastToLobby(wss, lobbyId, {
            event: events_1.GAME_STATE_UPDATE,
            state: sanitizedLobby,
        });
        // Notify cleric about first leader allegiance
        const cleric = lobby.players.find((player) => player.role === 'Cleric');
        if (cleric) {
            const leaderAlignment = questLeader.role.includes('Morgan le Fey') ||
                questLeader.role.includes('Blind Hunter') ||
                questLeader.role.includes('Minion of Mordred')
                ? 'Evil'
                : 'Good';
            sendPrivateMessage(wss, cleric.id, {
                event: 'CLERIC_INFO',
                message: `The first quest leader (${questLeader.name}) is ${leaderAlignment}.`,
            });
        }
        // Notify evils (except Blind Hunter) about each other
        const knownEvilRoles = ['Morgan le Fey', 'Minion of Mordred'];
        const evils = lobby.players.filter((player) => knownEvilRoles.includes(player.role));
        evils.forEach((evil) => {
            sendPrivateMessage(wss, evil.id, {
                event: 'EVIL_INFO',
                message: `The known evils are: ${evils.map((e) => e.name).join(', ')}.`,
            });
        });
        // Send each player their role privately
        lobby.players.forEach((player) => {
            sendPrivateMessage(wss, player.id, {
                event: 'ROLE_ASSIGNED',
                role: player.role,
            });
        });
    }
    catch (e) {
        ws.send(JSON.stringify({ error: e.message }));
    }
};
// Helper function to broadcast a message to all clients in a lobby
const broadcastToLobby = (wss, lobbyId, data) => {
    const payload = JSON.stringify(data);
    wss.clients.forEach((client) => {
        if (client.readyState === 1 && client.lobbyId === lobbyId) {
            client.send(payload);
        }
    });
};
// Helper function to send a private message to a specific client
const sendPrivateMessage = (wss, clientId, data) => {
    const payload = JSON.stringify(data);
    wss.clients.forEach((client) => {
        if (client.readyState === 1 && client.playerId === clientId) {
            client.send(payload);
        }
    });
};
module.exports = {
    handleJoinGame: exports.handleJoinGame,
    handleStartGame,
    lobbies,
};
