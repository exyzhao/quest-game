'use client'

import React, { createContext, useContext, useState } from 'react'

interface PlayerContextValue {
  id: string | null
  setId: (id: string | null) => void
  role: string | null
  setRole: (role: string | null) => void
  knownEvils: string[] | null
  setKnownEvils: (evils: string[] | null) => void
  clericInfo: { leaderName: string; leaderAlignment: string } | null
  setClericInfo: (
    info: { leaderName: string; leaderAlignment: string } | null
  ) => void
}

const PlayerContext = createContext<PlayerContextValue | null>(null)

export const PlayerProvider = ({ children }: { children: React.ReactNode }) => {
  const [id, setId] = useState<string | null>(null)
  const [role, setRole] = useState<string | null>(null)
  const [knownEvils, setKnownEvils] = useState<string[] | null>(null)
  const [clericInfo, setClericInfo] = useState<{
    leaderName: string
    leaderAlignment: string
  } | null>(null)

  return (
    <PlayerContext.Provider
      value={{
        id,
        setId,
        role,
        setRole,
        knownEvils,
        setKnownEvils,
        clericInfo,
        setClericInfo,
      }}
    >
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
