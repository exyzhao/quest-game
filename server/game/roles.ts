import * as R from 'remeda'
import { EVIL_ROLES } from '../constants'

interface RolesResult {
  selectedRoles: string[]
  allRoles: string[]
  unusedRole: string
}

export const isPlayerEvil = (role: string): boolean => {
  return EVIL_ROLES.includes(role)
}

export const getRolesForPlayerCount = (playerCount: number): RolesResult => {
  switch (playerCount) {
    case 4: {
      const goodRoles = ['Cleric', 'Youth', 'Loyal Servant of Arthur']
      const evilRoles = ['Morgan le Fey', 'Blind Hunter']

      const shuffledGood = R.shuffle(goodRoles)
      const selectedGood = shuffledGood.slice(0, 2)
      const unusedRole = shuffledGood.slice(2)[0]

      // All roles available for 4 players (ordered)
      const allRoles = [...goodRoles, ...evilRoles]

      // Selected roles: 2 good + all evil roles
      const selectedRoles = [...selectedGood, ...evilRoles]

      return { selectedRoles, allRoles, unusedRole }
    }

    case 5: {
      const goodRoles = ['Cleric', 'Youth', 'Loyal Servant of Arthur']
      const evilRoles = ['Morgan le Fey', 'Blind Hunter', 'Minion of Mordred']

      const shuffledGood = R.shuffle(goodRoles)
      const selectedGood = shuffledGood.slice(0, 2)
      const unusedRole = shuffledGood.slice(2)[0]

      const allRoles = [...goodRoles, ...evilRoles]
      const selectedRoles = [...selectedGood, ...evilRoles]

      return { selectedRoles, allRoles, unusedRole }
    }

    case 6: {
      const evilRoles = ['Morgan le Fey', 'Blind Hunter', 'Minion of Mordred']
      const goodRoles = ['Cleric', 'Duke']

      // Shuffle special roles and select 1
      const specialRoles = R.shuffle(['Youth', 'Troublemaker'])
      const selectedSpecial = specialRoles[0]
      const unusedRole = specialRoles[1]

      const allRoles = [...evilRoles, ...goodRoles, ...specialRoles]
      const selectedRoles = [...evilRoles, ...goodRoles, selectedSpecial]

      return { selectedRoles, allRoles, unusedRole }
    }

    case 7: {
      const evilRoles = [
        'Morgan le Fey',
        'Blind Hunter',
        'Minion of Mordred',
        'Minion of Mordred',
      ]
      const goodRoles = ['Cleric', 'Duke']

      const specialRoles = R.shuffle(['Youth', 'Troublemaker'])
      const selectedSpecial = specialRoles[0]
      const unusedRole = specialRoles[1]

      const allRoles = [...evilRoles, ...goodRoles, ...specialRoles]
      const selectedRoles = [...evilRoles, ...goodRoles, selectedSpecial]

      return { selectedRoles, allRoles, unusedRole }
    }

    case 8: {
      const evilRoles = [
        'Morgan le Fey',
        'Blind Hunter',
        'Minion of Mordred',
        'Minion of Mordred',
      ]
      const goodRoles = ['Cleric', 'Duke', 'Loyal Servant of Arthur']

      const specialRoles = R.shuffle(['Youth', 'Troublemaker'])
      const selectedSpecial = specialRoles[0]
      const unusedRole = specialRoles[1]

      const allRoles = [...evilRoles, ...goodRoles, ...specialRoles]
      const selectedRoles = [...evilRoles, ...goodRoles, selectedSpecial]

      return { selectedRoles, allRoles, unusedRole }
    }

    case 9: {
      const evilRoles = [
        'Morgan le Fey',
        'Blind Hunter',
        'Minion of Mordred',
        'Minion of Mordred',
        'Minion of Mordred',
      ]
      const goodRoles = ['Cleric', 'Archduke', 'Loyal Servant of Arthur']

      const specialRoles = R.shuffle(['Youth', 'Troublemaker'])
      const selectedSpecial = specialRoles[0]
      const unusedRole = specialRoles[1]

      const allRoles = [...evilRoles, ...goodRoles, ...specialRoles]
      const selectedRoles = [...evilRoles, ...goodRoles, selectedSpecial]

      return { selectedRoles, allRoles, unusedRole }
    }

    case 10: {
      const evilRoles = [
        'Morgan le Fey',
        'Blind Hunter',
        'Minion of Mordred',
        'Minion of Mordred',
        'Minion of Mordred',
      ]
      const goodRoles = [
        'Cleric',
        'Duke',
        'Archduke',
        'Loyal Servant of Arthur',
      ]

      const specialRoles = R.shuffle(['Youth', 'Troublemaker'])
      const selectedSpecial = specialRoles[0]
      const unusedRole = specialRoles[1]

      const allRoles = [...evilRoles, ...goodRoles, ...specialRoles]
      const selectedRoles = [...evilRoles, ...goodRoles, selectedSpecial]

      return { selectedRoles, allRoles, unusedRole }
    }

    default:
      throw new Error('Unsupported number of players')
  }
}
