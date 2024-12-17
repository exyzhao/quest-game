'use client'

import { useWebSocketContext } from '@/context/WebSocketContext'

export default function GlobalErrorPopup() {
  const { errorMessage, clearError } = useWebSocketContext()

  if (!errorMessage) return null

  return (
    <div style={popupStyle}>
      <div style={popupContentStyle}>
        <p>{errorMessage}</p>
        <button onClick={clearError}>Close</button>
      </div>
    </div>
  )
}

// Simple inline styles for demonstration
const popupStyle = {
  position: 'fixed' as const,
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0,0,0,0.5)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
}

const popupContentStyle = {
  background: '#fff',
  padding: '20px',
  borderRadius: '5px',
}
