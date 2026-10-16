'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Settings } from 'lucide-react'
import { fraseDelAviso, type avisoDeFierros } from '@/lib/parrilla'
import { ajustes, pantallaDe, pestanas } from '@/lib/vocabulario'
import { cn } from '@/lib/utils'

/** Dónde vive el aviso de los fierros dentro del menú: la entrada de Los Fierros. */
const RUTA_FIERROS = '/admin/accounts'

/**
 * Tres pestañas y un engranaje. Lo que no pide una acción todos los días —las cuentas, las
 * páginas públicas, quién entra— va dentro de Ajustes: sigue a un clic, pero ya no ocupa la
 * barra. Los nombres y las rutas salen del vocabulario; acá no se escribe ninguno.
 *
 * El engranaje lleva un punto cuando algo adentro necesita al dueño: ámbar si un fierro se
 * enfría, rojo si se apagó (`avisoDeFierros`). Adentro, la entrada de Los Fierros lo dice en
 * palabras. Sin nada que avisar, no hay punto.
 */
export function AdminNav({
  esAdmin,
  aviso = null,
}: {
  esAdmin?: boolean
  aviso?: ReturnType<typeof avisoDeFierros>
}) {
  const pathname = usePathname()
  const actual = pantallaDe(pathname)
  const enAjustes = actual?.grupo === 'ajustes'
  const frase = aviso ? fraseDelAviso(aviso) : null
  const colorAviso = aviso?.nivel === 'apagado' ? 'bg-negative' : 'bg-caution'

  return (
    <nav className="flex min-w-0 flex-1 items-center gap-1" aria-label="Secciones del panel">
      <div className="flex items-center gap-1 overflow-x-auto">
        {pestanas(Boolean(esAdmin)).map((p) => {
          const active = actual?.ruta === p.ruta
          return (
            <Link
              key={p.ruta}
              href={p.ruta}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'rounded-lg px-3 py-1.5 text-sm whitespace-nowrap transition-colors',
                active ? 'bg-brasa text-acero-950' : 'text-fg-muted hover:text-fg',
              )}
            >
              {p.nombre}
            </Link>
          )
        })}
      </div>

      {/*
        Un `<details>`: sin estado, con teclado (Enter abre; Escape cierra, ver abajo). Se cierra
        al navegar porque se remonta con la ruta (`key={pathname}`), no porque la página cambie:
        `AdminNav` vive en el layout, y el layout no se remonta solo al navegar entre rutas
        hijas — el `open` es estado del DOM que React no toca por su cuenta. Una ruta de
        Ajustes activa marca el engranaje, no una pestaña — el usuario tiene que poder ver
        dónde está aunque el menú esté cerrado.
      */}
      <details
        key={pathname}
        className="relative ml-auto"
        // Escape no cierra un <details> por sí solo (comprobado en Chromium): es la única
        // tecla que el elemento no trae, y un menú que no se cierra con Escape es un menú
        // roto para el teclado. Sigue sin estado: se quita el atributo y ya. El foco vuelve
        // al `summary`: si estaba en un enlace del menú, ese enlace desaparece al cerrar y
        // el foco caería al `body` si no lo devolviéramos.
        onKeyDown={(e) => {
          if (e.key !== 'Escape') return
          e.currentTarget.removeAttribute('open')
          e.currentTarget.querySelector('summary')?.focus()
        }}
      >
        <summary
          className={cn(
            'relative flex cursor-pointer list-none items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm transition-colors [&::-webkit-details-marker]:hidden',
            enAjustes ? 'bg-brasa text-acero-950' : 'text-fg-muted hover:text-fg',
          )}
          aria-label={frase ? `Ajustes: en Los Fierros, ${frase}` : 'Ajustes'}
        >
          <Settings className="h-4 w-4" aria-hidden />
          <span className="hidden sm:inline">Ajustes</span>
          {aviso ? (
            <span
              aria-hidden
              className={cn('absolute right-1 top-1 h-2 w-2 rounded-full ring-2 ring-acero-950', colorAviso)}
            />
          ) : null}
        </summary>
        <ul className="chapa absolute right-0 z-40 mt-2 w-64 rounded-xl p-2">
          {ajustes(Boolean(esAdmin)).map((p) => {
            const active = actual?.ruta === p.ruta
            return (
              <li key={p.ruta}>
                <Link
                  href={p.ruta}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'block rounded-lg px-3 py-2 transition-colors',
                    active ? 'bg-brasa text-acero-950' : 'hover:bg-white/[0.06]',
                  )}
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="block text-sm">{p.nombre}</span>
                    {frase && p.ruta === RUTA_FIERROS ? (
                      <span
                        className={cn(
                          'shrink-0 rounded-full border px-1.5 py-px font-mono text-[0.62rem]',
                          active
                            ? 'border-acero-950/40 text-acero-950'
                            : aviso?.nivel === 'apagado'
                              ? 'border-negative/60 text-negative'
                              : 'border-caution/60 text-caution',
                        )}
                      >
                        {frase}
                      </span>
                    ) : null}
                  </span>
                  <span className={cn('block text-[0.72rem]', active ? 'text-acero-950/80' : 'text-fg-faint')}>
                    {p.subtitulo}
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      </details>
    </nav>
  )
}
