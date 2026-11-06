import Link from 'next/link'
import { Empty, Panel } from '@/components/charts/panel'
import { DeNocheYDeDia } from '@/components/de-noche-y-de-dia'
import { Encabezado } from '@/components/ui'
import { requireAdmin } from '@/lib/auth'
import { LIMITE_DEL_EQUIPO, sugerenciasParaElEquipo } from '@/lib/sugerencias/responder'
import { fechaCorta } from '@/lib/sugerencias/respuestas'
import { TIPOS } from '@/lib/sugerencias/tipos'
import { cn } from '@/lib/utils'
import { LIBRO } from '@/lib/vocabulario'
import { FormularioRespuesta } from './formulario'

export const dynamic = 'force-dynamic'

/**
 * Las Sugerencias: lo que la gente escribe en el libro de sugerencias, para que el equipo lo
 * responda adentro de Tu Parrilla. Solo el admin. La respuesta la lee la persona en el libro
 * (`components/libro-de-sugerencias.tsx`); el correo y el comentario del issue salen solos
 * (`lib/sugerencias/responder.ts`).
 */
export default async function SugerenciasPage({ searchParams }: { searchParams: Promise<{ ver?: string }> }) {
  const { zona } = await requireAdmin()
  const sinResponder = (await searchParams).ver === 'sin-responder'
  const filas = await sugerenciasParaElEquipo({ sinResponder })
  const filtro = (activo: boolean) =>
    cn('rounded-full border px-3 py-1 text-[0.8rem] transition-colors', activo ? 'border-brasa bg-brasa text-acero-950' : 'border-acero-700 text-fg-muted hover:text-fg')

  return (
    <>
      <header className="mb-6">
        <Encabezado ruta="/admin/sugerencias">
          <nav className="flex gap-1.5" aria-label="Qué sugerencias ver">
            <Link href="/admin/sugerencias" className={filtro(!sinResponder)} aria-current={!sinResponder ? 'page' : undefined}>
              Todas
            </Link>
            <Link
              href="/admin/sugerencias?ver=sin-responder"
              className={filtro(sinResponder)}
              aria-current={sinResponder ? 'page' : undefined}
            >
              Sin responder
            </Link>
          </nav>
        </Encabezado>
        <p className="mt-1 text-sm text-fg-muted">
          Lo que escriben en <DeNocheYDeDia noche={LIBRO.noche.toLowerCase()} dia={LIBRO.dia.toLowerCase()} />, de lo más
          nuevo a lo más viejo. Lo que respondas lo lee la persona ahí mismo, le llega un correo la primera vez y queda
          como comentario en el issue, sin su nombre ni su correo.
        </p>
      </header>
      <Panel
        title={sinResponder ? 'Sin responder' : 'Todas'}
        hint={filas.length === LIMITE_DEL_EQUIPO ? `Las ${LIMITE_DEL_EQUIPO} más nuevas.` : undefined}
      >
        {filas.length === 0 ? (
          <Empty>{sinResponder ? 'No hay nada sin responder.' : 'Nadie ha escrito todavía.'}</Empty>
        ) : (
          <ul className="divide-y divide-velo/[0.06]">
            {filas.map((s) => (
              <li key={s.id} className="space-y-3 py-4">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-fg-faint">
                  <span className="rounded-full border border-acero-700 px-2 py-0.5 text-fg-muted">{TIPOS[s.tipo].nombre}</span>
                  <span>{fechaCorta(s.creadaEn, zona)}</span>
                  {s.origen ? <span>{s.origen === 'telefono' ? 'desde el teléfono' : 'desde el panel'}</span> : null}
                  <span className="min-w-0 truncate">
                    {s.nombre ? `${s.nombre} · ` : ''}
                    {s.correo}
                  </span>
                  {s.issueUrl && s.issueNumero ? (
                    <a href={s.issueUrl} target="_blank" rel="noreferrer" className="font-mono text-brasa hover:underline">
                      issue #{s.issueNumero}
                    </a>
                  ) : (
                    <span>sin issue todavía</span>
                  )}
                </div>
                <p className="whitespace-pre-wrap text-sm">{s.texto}</p>
                <FormularioRespuesta
                  id={s.id}
                  respuesta={s.respuesta}
                  estado={
                    s.respuesta && s.respondidaEn
                      ? [
                          `Respondida el ${fechaCorta(s.respondidaEn, zona)}${s.respondidaPor ? ` por ${s.respondidaPor}` : ''}`,
                          s.respuestaLeidaEn ? `leída el ${fechaCorta(s.respuestaLeidaEn, zona)}` : 'sin leer todavía',
                        ].join(' · ')
                      : null
                  }
                />
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </>
  )
}
