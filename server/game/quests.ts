import { Lobby, MyWebSocketServer, QuestResult } from '../../shared/types'
import { getQuestRules } from './ruleset'
import { isPlayerEvil } from './roles'
import { advancePhase } from './stateMachine'

/**
 * Updates a team for the quest.
 * @param lobby The game lobby state
 * @param selectedPlayerIds The IDs of the players selected for the quest
 * @param magicTokenHolder The ID of the player to whom the magic token is assigned
 */
export const updateTeam = (
  lobby: Lobby,
  selectedPlayerIds: string[],
  magicTokenHolder: string | null,
) => {
  // TODO: pull rules from lobby
  const rules = getQuestRules(lobby.players.length)
  const currentQuest = rules.find((r) => r.round === lobby.currentRound)
  if (!currentQuest) throw new Error('Invalid quest round.')

  if (selectedPlayerIds.length > currentQuest.requiredPlayers) {
    throw new Error(
      `Invalid team size. Maximum: ${currentQuest.requiredPlayers}`,
    )
  }

  lobby.currentTeam = selectedPlayerIds
  lobby.magicTokenHolder = magicTokenHolder
}

/**
 * Confirm a team for the quest.
 * @param lobby The game lobby state
 * @param selectedPlayerIds The IDs of the players selected for the quest
 * @param magicTokenHolder The ID of the player to whom the magic token is assigned
 */
export const confirmTeam = (lobby: Lobby) => {
  const rules = getQuestRules(lobby.players.length)
  const currentQuest = rules.find((r) => r.round === lobby.currentRound)
  if (!currentQuest) throw new Error('Invalid quest round.')

  if (lobby.currentTeam.length !== currentQuest.requiredPlayers) {
    throw new Error(
      `Invalid team size. Required: ${currentQuest.requiredPlayers}`,
    )
  }
  if (!lobby.magicTokenHolder) {
    throw new Error('Must magic token someone on the team.')
  }

  advancePhase(lobby)
}

export const updateLeader = (lobby: Lobby, updatedLeader: string) => {
  lobby.upcomingLeader = updatedLeader
}

export const updateAmulet = (lobby: Lobby, updatedAmulet: string) => {
  lobby.amuletHolder = updatedAmulet
}

export const confirmLeader = (lobby: Lobby) => {
  const rules = getQuestRules(lobby.players.length)
  const currentRule = rules.find((r) => r.round === lobby.currentRound)
  if (!currentRule) throw new Error('Invalid quest round.')

  if (!lobby.upcomingLeader) {
    throw new Error('No leader is selected.')
  }
  if (currentRule?.amulet && !lobby.amuletHolder) {
    throw new Error('No amulet holder is selected.')
  }
  if (lobby.veterans.includes(lobby.upcomingLeader)) {
    throw new Error(`${lobby.upcomingLeader} is a veteran.`)
  }
  if (lobby.amuletHolder && lobby.veterans.includes(lobby.amuletHolder)) {
    throw new Error(`${lobby.amuletHolder} is a veteran.`)
  }
  if (lobby.currentLeader === lobby.amuletHolder) {
    throw new Error('Leader and amulet holder cannot be the same player.')
  }

  lobby.currentLeader = lobby.upcomingLeader
  lobby.upcomingLeader = null

  advancePhase(lobby)
}
