import * as R from 'remeda'
import { EVIL_ROLES } from '@/shared/constants'

interface RolesResult {
  roles: string[]
  unselectedRoles: string[]
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
      // We only select 2 of the good roles
      const selectedGood = shuffledGood.slice(0, 2)
      // The leftover good role is the one the Blind Hunter can see is missing
      const unselectedGood = shuffledGood.slice(2)
      return {
        roles: selectedGood.concat(evilRoles),
        unselectedRoles: unselectedGood,
      }
    }
    case 5: {
      const goodRoles = ['Cleric', 'Youth', 'Loyal Servant of Arthur']
      const evilRoles = ['Morgan le Fey', 'Blind Hunter', 'Minion of Mordred']
      const shuffledGood = R.shuffle(goodRoles)
      const selectedGood = shuffledGood.slice(0, 2)
      const unselectedGood = shuffledGood.slice(2)
      return {
        roles: selectedGood.concat(evilRoles),
        unselectedRoles: unselectedGood,
      }
    }
    case 6: {
      const evilRoles = ['Morgan le Fey', 'Blind Hunter', 'Minion of Mordred']
      const goodRoles = ['Cleric', 'Duke']
      const specialRoles = R.shuffle(['Youth', 'Troublemaker'])
      const selectedSpecial = specialRoles[0]
      const unselectedSpecial = specialRoles[1]
      return {
        roles: [...evilRoles, ...goodRoles, selectedSpecial],
        unselectedRoles: [unselectedSpecial],
      }
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
      const unselectedSpecial = specialRoles[1]
      return {
        roles: [...evilRoles, ...goodRoles, selectedSpecial],
        unselectedRoles: [unselectedSpecial],
      }
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
      const unselectedSpecial = specialRoles[1]
      return {
        roles: [...evilRoles, ...goodRoles, selectedSpecial],
        unselectedRoles: [unselectedSpecial],
      }
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
      const unselectedSpecial = specialRoles[1]
      return {
        roles: [...evilRoles, ...goodRoles, selectedSpecial],
        unselectedRoles: [unselectedSpecial],
      }
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
      const unselectedSpecial = specialRoles[1]
      return {
        roles: [...evilRoles, ...goodRoles, selectedSpecial],
        unselectedRoles: [unselectedSpecial],
      }
    }
    default:
      throw new Error('Unsupported number of players')
  }
}
