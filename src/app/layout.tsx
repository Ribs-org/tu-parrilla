import type { Metadata, Viewport } from 'next'
import { Bricolage_Grotesque, Instrument_Sans, JetBrains_Mono, Oswald } from 'next/font/google'
import './globals.css'

const bricolage = Bricolage_Grotesque({
  subsets: ['latin'],
  variable: '--font-bricolage',
  display: 'swap',
})

const oswald = Oswald({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-oswald',
  display: 'swap',
})

const instrument = Instrument_Sans({
  subsets: ['latin'],
  variable: '--font-instrument',
  display: 'swap',
})

const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains',
  display: 'swap',
})

// El título de lo que no pone el suyo (la entrada, las páginas de error): el nombre del
// producto, no el del portafolio con que empezó. La portada y cada página pública ponen el suyo.
export const metadata: Metadata = {
  title: 'Tu Parrilla',
  description: 'Programa tus publicaciones en todas tus redes y mira cómo les fue.',
}

export const viewport: Viewport = {
  themeColor: '#0b0a0f',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="es"
      className={`${bricolage.variable} ${instrument.variable} ${jetbrains.variable} ${oswald.variable}`}
    >
      <body>{children}</body>
    </html>
  )
}
