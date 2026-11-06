'use client'

import { useState, useTransition } from 'react'
import { responderPreguntaPropia } from '@/app/admin/cocina-actions'
import { Button, Textarea } from '@/components/ui'
import { MAX_RESPUESTA } from '@/lib/cocina/pregunta'

/**
 * Contestarle al chef, en la tarjeta de una comanda que pregunta: con opciones, un botón por cada
 * una —un toque responde—; libre, el campo y «Responder». La de por defecto va marcada: es la que
 * el chef usa si nadie contesta. Al responder, la página se vuelve a armar y la tarjeta sigue su
 * recorrido.
 */
export function ResponderAlChef({ id, opciones, porDefecto }: { id: string; opciones: string[] | null; porDefecto: string }) {
  const [pending, start] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [elegida, setElegida] = useState<string | null>(null)
  const [texto, setTexto] = useState('')

  function responder(respuesta: string) {
    setElegida(respuesta)
    setError(null)
    start(async () => {
      const r = await responderPreguntaPropia(id, respuesta)
      setError(r.error ?? null)
    })
  }

  const aviso = error ? (
    <p role="alert" className="mt-2 text-xs text-negative">
      {error}
    </p>
  ) : null

  if (opciones) {
    return (
      <>
        <div className="mt-3 flex flex-wrap gap-2">
          {opciones.map((o) => (
            <Button key={o} variant={o === porDefecto ? 'primary' : 'ghost'} disabled={pending} onClick={() => responder(o)}>
              {pending && elegida === o ? 'Respondiendo…' : o}
            </Button>
          ))}
        </div>
        {aviso}
      </>
    )
  }

  const largo = texto.trim().length
  return (
    <>
      <Textarea
        aria-label="Tu respuesta al chef"
        className="mt-3"
        rows={3}
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        placeholder={`Tu respuesta al chef. Si no contestas, sigue con «${porDefecto}».`}
        disabled={pending}
      />
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <Button variant="primary" disabled={pending || largo === 0 || largo > MAX_RESPUESTA} onClick={() => responder(texto)}>
          {pending ? 'Respondiendo…' : 'Responder'}
        </Button>
        <span className={largo > MAX_RESPUESTA ? 'text-xs text-negative' : 'text-xs text-fg-faint'}>
          {largo} / {MAX_RESPUESTA}
        </span>
      </div>
      {aviso}
    </>
  )
}
