import './global.css'
import { WebSocketProvider } from '../context/WebSocketContext'
import { PlayerProvider } from '@/context/PlayerContext'
import GlobalErrorPopup from './components/GlobalErrorPopup'

export const metadata = {
  title: 'Quest App',
  description: 'An Quest game implementation in Next.js',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <PlayerProvider>
          <WebSocketProvider>
            {children}
            <GlobalErrorPopup />
          </WebSocketProvider>
        </PlayerProvider>
      </body>
    </html>
  )
}
