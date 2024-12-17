export interface QuestRules {
  round: number
  requiredPlayers: number
  failsRequired: number
}

export const getQuestRules = (playerCount: number): QuestRules[] => {
  if (playerCount >= 4 && playerCount <= 8) {
    return [
      { round: 1, requiredPlayers: 3, failsRequired: 1 },
      { round: 2, requiredPlayers: 2, failsRequired: 1 },
      { round: 3, requiredPlayers: 3, failsRequired: 1 },
      { round: 4, requiredPlayers: 4, failsRequired: 2 },
      { round: 5, requiredPlayers: 3, failsRequired: 1 },
    ]
  } else if (playerCount >= 8 && playerCount <= 10) {
    return [
      { round: 1, requiredPlayers: 4, failsRequired: 1 },
      { round: 2, requiredPlayers: 3, failsRequired: 1 },
      { round: 3, requiredPlayers: 4, failsRequired: 2 },
      { round: 4, requiredPlayers: 5, failsRequired: 2 },
      { round: 5, requiredPlayers: 4, failsRequired: 1 },
    ]
  }
  throw new Error('Unsupported number of players')
}
