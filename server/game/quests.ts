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
  magicTokenHolder: string | null
) => {
  // TODO: pull rules from lobby
  const rules = getQuestRules(lobby.players.length)
  const currentQuest = rules.find((r) => r.round === lobby.currentRound)
  if (!currentQuest) throw new Error('Invalid quest round.')

  if (selectedPlayerIds.length > currentQuest.requiredPlayers) {
    throw new Error(
      `Invalid team size. Maximum: ${currentQuest.requiredPlayers}`
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
      `Invalid team size. Required: ${currentQuest.requiredPlayers}`
    )
  }
  if (!lobby.magicTokenHolder) {
    throw new Error('Must magic token someone on the team.')
  }

  advancePhase(lobby)
}

/**
 * Executes the quest logic once the team is set and the magic token is assigned.
 */
export function executeQuest(lobby: Lobby) {
  const rules = getQuestRules(lobby.players.length)
  const currentQuestRule = rules.find((r) => r.round === lobby.currentRound)
  if (!currentQuestRule) throw new Error('Invalid quest round.')

  const failsRequired = currentQuestRule['failsRequired']

  const teamPlayers = lobby.players.filter((p) =>
    lobby.currentTeam?.includes(p.id)
  )

  // Determine how many fails played
  let failCount = 0

  for (const player of teamPlayers) {
    const isEvil = isPlayerEvil(player.role || '')
    // Assume evils always pass
    if (isEvil) {
      // Check if they are the magic token holder
      if (lobby.magicTokenHolder && lobby.magicTokenHolder === player.id) {
        // Forced to pass
      } else {
        failCount++
      }
    }
  }

  const result = failCount >= failsRequired ? 'Failed' : 'Passed'

  const questResult: QuestResult = {
    round: lobby.currentRound,
    team: lobby.currentTeam || [],
    fails: failCount,
    result: result,
  }

  lobby.questHistory.push(questResult)

  // Clear per-quest variables
  lobby.currentTeam = []
  lobby.magicTokenHolder = null

  // Increment round if not over
  if (result === 'Passed' || result === 'Failed') {
    lobby.currentRound++
  }

  // advancePhase(lobby)
}
