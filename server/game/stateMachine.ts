import { Lobby } from '../../shared/types'

export type GamePhase =
  | 'LOBBY'
  | 'TEAM_SELECTION'
  | 'QUEST_RESOLUTION'
  | 'LEADER_SELECTION'
  | 'AMULET_CHECK'
  | 'THE_DISCUSSION'
  | 'THE_HUNT'
  | 'GOODS_LAST_CHANCE'
  | 'GOOD_VICTORY'
  | 'EVIL_VICTORY'

/**
 * Advances the state of the game. Remember to broadcast lobby state after calling.
 * @param lobby The game lobby state
 */
export const advancePhase = (lobby: Lobby) => {
  switch (lobby.phase) {
    case 'LOBBY':
      lobby.phase = 'TEAM_SELECTION'
      break

    case 'TEAM_SELECTION':
      lobby.phase = 'QUEST_RESOLUTION'
      break

    case 'QUEST_RESOLUTION':
      const goodWins =
        lobby.questHistory.filter((q) => q.result === 'Passed').length >= 3
      const evilWins =
        lobby.questHistory.filter((q) => q.result === 'Failed').length >= 3

      if (goodWins) {
        lobby.phase = 'GOOD_VICTORY'
      } else if (evilWins) {
        lobby.phase = 'THE_DISCUSSION'
      } else {
        lobby.phase = 'LEADER_SELECTION'
      }
      break

    case 'LEADER_SELECTION':
      if (lobby.amuletHolder) {
        lobby.phase = 'AMULET_CHECK'
      }
      lobby.phase = 'TEAM_SELECTION'
      break

    case 'AMULET_CHECK':
      lobby.phase = 'TEAM_SELECTION'
      break

    case 'THE_HUNT':
      if (lobby.isHunting) {
        const huntSuccessful = isHuntSuccessful(lobby)
        lobby.phase = huntSuccessful ? 'EVIL_VICTORY' : 'GOOD_VICTORY'
      } else {
        lobby.phase = 'GOODS_LAST_CHANCE'
      }
      break

    case 'GOODS_LAST_CHANCE':
      const pointingSuccessful = isPointingSuccessful(lobby) // Define this logic
      lobby.phase = pointingSuccessful ? 'GOOD_VICTORY' : 'EVIL_VICTORY'
      break

    default:
      throw new Error(`Unknown phase: ${lobby.phase}`)
  }

  console.log(lobby)
}

const isHuntSuccessful = (lobby: Lobby) => {
  if (lobby.hunted?.length !== 2) {
    throw new Error('Must hunt exactly two players.')
  }
  return lobby.hunted.every(
    (hunt) =>
      hunt.role === lobby.players.find((p) => p.id === hunt.playerId)?.role,
  )
}

const isPointingSuccessful = (lobby: Lobby) => {
  // TODO
  return true
}
