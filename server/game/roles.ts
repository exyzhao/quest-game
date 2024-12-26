import * as R from 'remeda'

export const isPlayerEvil = (role: string): boolean => {
  const evilRoles = ['Morgan le Fey', 'Blind Hunter', 'Minion of Mordred']
  return evilRoles.includes(role)
}

export const getRolesForPlayerCount = (
  playerCount: number,
  showAllPossibleRoles: boolean,
): string[] => {
  switch (playerCount) {
    case 4: {
      const goodRoles = ['Cleric', 'Youth', 'Loyal Servant of Arthur']
      const evilRoles = ['Morgan le Fey', 'Blind Hunter']
      if (showAllPossibleRoles) {
        return goodRoles.concat(evilRoles)
      }
      const selectedGoodRoles = R.shuffle(goodRoles).slice(0, 2)
      return selectedGoodRoles.concat(evilRoles)
    }
    case 5: {
      const goodRoles = ['Cleric', 'Youth', 'Loyal Servant of Arthur']
      const evilRoles = ['Morgan le Fey', 'Blind Hunter', 'Minion of Mordred']
      if (showAllPossibleRoles) {
        return goodRoles.concat(evilRoles)
      }
      const selectedGoodRoles = R.shuffle(goodRoles).slice(0, 2)
      return selectedGoodRoles.concat(evilRoles)
    }
    case 6:
      if (showAllPossibleRoles) {
        return [
          'Morgan le Fey',
          'Blind Hunter',
          'Minion of Mordred',
          'Cleric',
          'Youth',
          'Troublemaker',
          'Duke',
        ]
      }
      return [
        'Morgan le Fey',
        'Blind Hunter',
        'Minion of Mordred',
        'Cleric',
        'Special Role',
        'Duke',
      ]
    case 7:
      if (showAllPossibleRoles) {
        return [
          'Morgan le Fey',
          'Blind Hunter',
          'Minion of Mordred',
          'Minion of Mordred',
          'Cleric',
          'Youth',
          'Troublemaker',
          'Duke',
        ]
      }
      return [
        'Morgan le Fey',
        'Blind Hunter',
        'Minion of Mordred',
        'Minion of Mordred',
        'Cleric',
        'Special Role',
        'Duke',
      ]
    case 8:
      if (showAllPossibleRoles) {
        ;[
          'Morgan le Fey',
          'Blind Hunter',
          'Minion of Mordred',
          'Minion of Mordred',
          'Cleric',
          'Youth',
          'Troublemaker',
          'Duke',
          'Loyal Servant of Arthur',
        ]
      }
      return [
        'Morgan le Fey',
        'Blind Hunter',
        'Minion of Mordred',
        'Minion of Mordred',
        'Cleric',
        'Special Role',
        'Duke',
        'Loyal Servant of Arthur',
      ]
    case 9:
      if (showAllPossibleRoles) {
        ;[
          'Morgan le Fey',
          'Blind Hunter',
          'Minion of Mordred',
          'Minion of Mordred',
          'Minion of Mordred',
          'Cleric',
          'Youth',
          'Troublemaker',
          'Archduke',
          'Loyal Servant of Arthur',
        ]
      }
      return [
        'Morgan le Fey',
        'Blind Hunter',
        'Minion of Mordred',
        'Minion of Mordred',
        'Minion of Mordred',
        'Cleric',
        'Special Role',
        'Archduke',
        'Loyal Servant of Arthur',
      ]
    case 10:
      if (showAllPossibleRoles) {
        ;[
          'Morgan le Fey',
          'Blind Hunter',
          'Minion of Mordred',
          'Minion of Mordred',
          'Minion of Mordred',
          'Cleric',
          'Youth',
          'Troublemaker',
          'Duke',
          'Archduke',
          'Loyal Servant of Arthur',
        ]
      }
      return [
        'Morgan le Fey',
        'Blind Hunter',
        'Minion of Mordred',
        'Minion of Mordred',
        'Minion of Mordred',
        'Cleric',
        'Special Role',
        'Duke',
        'Archduke',
        'Loyal Servant of Arthur',
      ]
    default:
      throw new Error('Unsupported number of players')
  }
}
