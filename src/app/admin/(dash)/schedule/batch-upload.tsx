'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { uploadBatch } from '@/app/admin/actions'
import { cn } from '@/lib/utils'
import { nombreDe } from '@/lib/vocabulario'
import { PanelLateral } from './panel-lateral'

const PLANTILLA = `fecha,texto,redes,media,portada
2026-09-03 10:00,"Mi primer post en lote",threads|x,,
2026-09-03 18:30,"Con foto, y con coma",instagram|facebook,https://ejemplo.com/foto.jpg,
2026-09-08 19:00,"Mi corto",instagram|youtube,https://ejemplo.com/corto.mp4,https://ejemplo.com/portada.jpg`

/** La carga masiva por CSV, en el panel lateral de La Parrilla. */
export function BatchUpload({ cerrarHref }: { cerrarHref: string }) {
  const router = useRouter()
  const [state, action, pending] = useActionState(uploadBatch, {})

  return (
    <PanelLateral titulo="Subir CSV" onCerrar={() => router.replace(cerrarHref, { scroll: false })}>
      <div className="space-y-4 px-5 py-4">
        <form action={action} className="space-y-4">
          <p className="text-[0.8rem] leading-relaxed text-fg-faint">
            Una fila por post: fecha en tu zona horaria, texto entre comillas si lleva
            comas, redes y URLs de media separadas por <code>|</code>, y portada
            (opcional, JPG/PNG, solo con video) como quinta columna. Si tienes dos cuentas
            conectadas en la misma red, nombrar solo la red ya no alcanza: agrega una
            octava columna <code>cuentas</code> con sus identificadores (también
            separados por <code>|</code>) — cada tarjeta en{' '}
            <Link className="underline" href="/admin/accounts">
              {nombreDe('/admin/accounts')}
            </Link>{' '}
            trae el suyo, con botón para copiarlo. Máximo 50 filas.
          </p>
          <pre className="overflow-x-auto rounded-lg bg-white/[0.06] p-3 text-xs text-fg-muted">{PLANTILLA}</pre>

          <input type="file" name="archivo" accept=".csv,text/csv" className="block text-sm text-fg-muted" />

          {state.error && <p className="text-sm text-negative">{state.error}</p>}

          <button
            type="submit"
            disabled={pending}
            className="rounded-lg bg-white/[0.1] px-4 py-2 text-sm hover:bg-white/[0.15] disabled:opacity-50"
          >
            {pending ? 'Cargando…' : 'Cargar lote'}
          </button>
        </form>

        {state.filas && (
          <ul className="space-y-1">
            {state.filas.map((fila) => (
              <li key={fila.fila} className={cn('text-sm', fila.ok ? 'text-positive' : 'text-negative')}>
                Fila {fila.fila}: {fila.detalle}
              </li>
            ))}
          </ul>
        )}
      </div>
    </PanelLateral>
  )
}
