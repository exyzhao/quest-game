'use client'

import { useWebSocketContext } from '@/client/context/WebSocketContext'

export default function GlobalErrorPopup() {
  const { errorMessage, clearError } = useWebSocketContext()

  if (!errorMessage) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 top-0 flex items-center justify-center bg-[rgba(0,0,0,0.5)]">
      <div style={popupContentStyle}>
        <p>{errorMessage}</p>
        <button onClick={clearError}>Close</button>
      </div>
    </div>
  )
}

const popupContentStyle = {
  background: '#fff',
  padding: '20px',
  borderRadius: '5px',
}
