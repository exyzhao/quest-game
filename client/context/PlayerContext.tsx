'use client'

import React, { createContext, useContext, useState } from 'react'

interface PlayerContextValue {
  id: string | null
  setId: (id: string | null) => void
  role: string | null
  setRole: (role: string | null) => void
  knownEvils: string[] | null
  setKnownEvils: (evils: string[] | null) => void
  clericInfo: { firstLeader: string; isGood: boolean } | null
  setClericInfo: (info: { firstLeader: string; isGood: boolean } | null) => void
  amuletInfo: {
    amuletHolder: string
    amuletUsedOn: string
    isGood: boolean
  } | null
  setAmuletInfo: (
    info: {
      amuletHolder: string
      amuletUsedOn: string
      isGood: boolean
    } | null,
  ) => void
}

const PlayerContext = createContext<PlayerContextValue | null>(null)

export const PlayerProvider = ({ children }: { children: React.ReactNode }) => {
  const [id, setId] = useState<string | null>(null)
  const [role, setRole] = useState<string | null>(null)
  const [knownEvils, setKnownEvils] = useState<string[] | null>(null)
  const [clericInfo, setClericInfo] = useState<{
    firstLeader: string
    isGood: boolean
  } | null>(null)
  const [amuletInfo, setAmuletInfo] = useState<{
    amuletHolder: string
    amuletUsedOn: string
    isGood: boolean
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
        amuletInfo,
        setAmuletInfo,
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
