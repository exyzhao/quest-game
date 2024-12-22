export interface QuestRules {
  round: number
  requiredPlayers: number
  failsRequired: number
  amulet: boolean
}

export const getQuestRules = (playerCount: number): QuestRules[] => {
  // TODO: change back to 4 player min
  if (playerCount >= 2 && playerCount <= 8) {
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
