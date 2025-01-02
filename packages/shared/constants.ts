export const EVIL_ROLES = ['Morgan le Fey', 'Minion of Mordred', 'Blind Hunter']
export const KNOWN_EVIL_ROLES = ['Morgan le Fey', 'Minion of Mordred']
export const TOKENABLE_EVIL_ROLES = ['Minion of Mordred', 'Blind Hunter']
export const SHOWS_AS_EVIL_ROLES = [
  'Morgan le Fey',
  'Minion of Mordred',
  'Blind Hunter',
  'Troublemaker',
]

const env = process.env.NODE_ENV

export const DISCUSSION_TIME_SECONDS = env === 'development' ? 15 : 300
export const HUNTING_OPTION_SECONDS = 10
