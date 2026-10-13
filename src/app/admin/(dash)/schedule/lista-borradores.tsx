'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { PanelLateral } from './panel-lateral'

/** Un borrador como lo muestra la lista: todo ya escrito en palabras por la página. */
export type FilaBorrador = {
  id: string
  href: string
  texto: string
  /** «para el vie 16 de oct a las 19:00», o «sin fecha». */
  cuando: string
  /** «guardado el mar 13 de oct a las 14:05». */
  guardado: string
  archivos: number
}

/** Los borradores del dueño, en el panel lateral: uno abre el compositor con él. */
export function ListaBorradores({ filas, cerrarHref }: { filas: FilaBorrador[]; cerrarHref: string }) {
  const router = useRouter()
  return (
    <PanelLateral titulo="Borradores" onCerrar={() => router.replace(cerrarHref, { scroll: false })}>
      {filas.length === 0 ? (
        <p className="px-5 py-8 text-center text-sm text-fg-faint">No tienes borradores.</p>
      ) : (
        <ul className="divide-y divide-white/[0.06]">
          {filas.map((fila) => (
            <li key={fila.id}>
              <Link
                href={fila.href}
                scroll={false}
                className="block px-5 py-3 transition-colors hover:bg-acero-800"
              >
                <span className="line-clamp-2 text-sm text-fg">{fila.texto || '(sin texto)'}</span>
                <span className="mt-1 block text-[0.72rem] text-fg-faint">
                  {fila.cuando}
                  {fila.archivos > 0 ? ` · ${fila.archivos === 1 ? '1 archivo' : `${fila.archivos} archivos`}` : ''}
                  {` · ${fila.guardado}`}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </PanelLateral>
  )
}
