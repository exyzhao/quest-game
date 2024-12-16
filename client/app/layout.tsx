import './global.css'
import { WebSocketProvider } from '../context/WebSocketContext'

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
        <WebSocketProvider>
          <main>{children}</main>
        </WebSocketProvider>
      </body>
    </html>
  )
}
