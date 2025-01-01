import { QuestRules } from '@/shared/types'

export const getQuestRules = (playerCount: number): QuestRules[] => {
  // Amulet field means amulet before round
  if (playerCount >= 4 && playerCount <= 8) {
    return [
      { round: 1, requiredPlayers: 3, failsRequired: 1, amulet: false },
      { round: 2, requiredPlayers: 2, failsRequired: 1, amulet: false },
      { round: 3, requiredPlayers: 3, failsRequired: 1, amulet: false },
      {
        round: 4,
        requiredPlayers: 4,
        failsRequired: 2,
        amulet: playerCount === 7,
      },
      {
        round: 5,
        requiredPlayers: 3,
        failsRequired: 1,
        amulet: playerCount >= 6,
      },
    ]
  } else if (playerCount >= 8 && playerCount <= 10) {
    return [
      { round: 1, requiredPlayers: 4, failsRequired: 1, amulet: false },
      { round: 2, requiredPlayers: 3, failsRequired: 1, amulet: false },
      { round: 3, requiredPlayers: 4, failsRequired: 2, amulet: true },
      { round: 4, requiredPlayers: 5, failsRequired: 2, amulet: true },
      { round: 5, requiredPlayers: 4, failsRequired: 1, amulet: true },
    ]
  }
  throw new Error('Unsupported number of players')
}
