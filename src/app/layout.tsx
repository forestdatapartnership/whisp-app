import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { ConfigProvider } from '@/lib/contexts/ConfigContext'
import { AuthProvider } from '@/lib/contexts/AuthContext'
import { ApiKeyProvider } from '@/lib/contexts/ApiKeyContext'
import { ContextsInitializer } from '@/lib/contexts/ContextsInitializer'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Whisp App',
  description: 'An application to deliver geospatial analysis to support zero-deforestation claims.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} h-screen`}>
        <ConfigProvider>
          <AuthProvider>
            <ApiKeyProvider>
              <ContextsInitializer>
                {children}
              </ContextsInitializer>
            </ApiKeyProvider>
          </AuthProvider>
        </ConfigProvider>
      </body>
    </html>
  )
}
