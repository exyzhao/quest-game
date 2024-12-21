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
      <body className="bg-zinc-100 text-base text-zinc-700">
        <PlayerProvider>
          <WebSocketProvider>
            <div className="mx-auto max-w-4xl p-4 sm:px-6 lg:px-8">
              {children}
            </div>
            <GlobalErrorPopup />
          </WebSocketProvider>
        </PlayerProvider>
      </body>
    </html>
  )
}
