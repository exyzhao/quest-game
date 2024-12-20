import { Lobby } from '../../shared/types'

export type GamePhase =
  | 'LOBBY'
  | 'TEAM_SELECTION'
  | 'QUEST_RESOLUTION'
  | 'LEADER_SELECTION'
  | 'AMULET_USAGE'
  | 'THE_DISCUSSION'
  | 'THE_HUNT'
  | 'GOODS_LAST_CHANCE'
  | 'GOOD_VICTORY'
  | 'GAME_OVER'

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
      lobby.phase = 'TEAM_SELECTION'
      break

    case 'THE_HUNT':
      if (lobby.isHunting) {
        lobby.phase = 'GAME_OVER'
      } else {
        lobby.phase = 'GOODS_LAST_CHANCE'
      }
      break

    case 'GOODS_LAST_CHANCE':
      lobby.phase = 'GAME_OVER'
      break

    case 'GAME_OVER':
      break

    default:
      throw new Error(`Unknown phase: ${lobby.phase}`)
  }

  console.log(lobby)
}
