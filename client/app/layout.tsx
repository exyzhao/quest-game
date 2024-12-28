import './global.css'
import { Crimson_Text } from 'next/font/google'
import { WebSocketProvider } from '../context/WebSocketContext'
import { PlayerProvider } from '@/client/context/PlayerContext'
import GlobalErrorPopup from './components/GlobalErrorPopup'
import Navbar from './components/Navbar'
import Footer from './components/Footer'

export const metadata = {
  title: 'Quest App',
  description: 'An Quest game implementation in Next.js',
}

const crimsonText = Crimson_Text({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-crimson-text',
})

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={crimsonText.variable}>
      <body className="bg-zinc-100 text-lg text-zinc-700">
        <PlayerProvider>
          <WebSocketProvider>
            <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
              <Navbar />
              {children}
              <Footer />
            </div>
            <GlobalErrorPopup />
          </WebSocketProvider>
        </PlayerProvider>
      </body>
    </html>
  )
}
