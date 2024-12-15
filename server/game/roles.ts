import * as R from 'remeda'

export const getRolesForPlayerCount = (playerCount: number): string[] => {
  if (playerCount === 4) {
    const goodRoles = ['Cleric', 'Youth', 'Loyal Servant of Arthur']
    const selectedGoodRoles = R.shuffle(goodRoles).slice(0, 2)
    return ['Morgan le Fey', 'Blind Hunter', ...selectedGoodRoles]
  } else if (playerCount === 5) {
    const goodRoles = ['Cleric', 'Youth', 'Loyal Servant of Arthur']
    const selectedGoodRoles = R.shuffle(goodRoles).slice(0, 2)
    return [
      'Morgan le Fey',
      'Blind Hunter',
      'Minion of Mordred',
      ...selectedGoodRoles,
    ]
  } else if (playerCount === 6) {
    return [
      'Morgan le Fey',
      'Blind Hunter',
      'Minion of Mordred',
      'Cleric',
      'Special Role',
      'Duke',
    ]
  } else if (playerCount === 7) {
    return [
      'Morgan le Fey',
      'Blind Hunter',
      'Minion of Mordred',
      'Minion of Mordred',
      'Cleric',
      'Special Role',
      'Duke',
    ]
  } else if (playerCount === 8) {
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
  } else if (playerCount === 9) {
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
  } else if (playerCount === 10) {
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
  } else {
    throw new Error('Unsupported number of players')
  }
}
