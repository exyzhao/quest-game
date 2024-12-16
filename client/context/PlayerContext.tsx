'use client'

import React, { createContext, useContext, useState } from 'react'

interface PlayerContextValue {
  role: string | null
  setRole: (role: string | null) => void
}

const PlayerContext = createContext<PlayerContextValue | null>(null)

export const PlayerProvider = ({ children }: { children: React.ReactNode }) => {
  const [role, setRole] = useState<string | null>(null)

  return (
    <PlayerContext.Provider value={{ role, setRole }}>
      {children}
    </PlayerContext.Provider>
  )
}

export const usePlayerContext = () => {
  const context = useContext(PlayerContext)
  if (!context) {
    throw new Error('usePlayerContext must be used within a PlayerProvider')
  }
  return context
}
