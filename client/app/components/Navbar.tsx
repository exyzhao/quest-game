'use client'

import { usePathname } from 'next/navigation'

export default function Navbar() {
  const pathname = usePathname()
  const lobbyId = pathname.split('/').pop() || ''

  return (
    <div className="flex items-center justify-between py-6">
      <h1 className="text-4xl">Quest</h1>
      {lobbyId ? <p>Lobby Code: {lobbyId}</p> : null}
    </div>
  )
}
