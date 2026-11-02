'use client'

import { useState, type FormEvent } from 'react'
import type { Problema } from '@/lib/revisiones'

/**
 * Un formulario que se revisa solo, con su mensaje en línea y no el globito del navegador:
 * `<form {...revision.formulario} action={action}>` y `revision.error` donde va el error.
 *
 * `noValidate` apaga la revisión del navegador, también la que traen `type="email"` y cualquier
 * atributo que quede. Si hay un problema el envío no sale —React no llama a la acción de un
 * `submit` cancelado—, y el foco va al campo que falta.
 */
export function useRevision(revisar: (datos: FormData) => Problema | null) {
  const [error, setError] = useState<string | null>(null)

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    const formulario = event.currentTarget
    const problema = revisar(new FormData(formulario))
    setError(problema?.mensaje ?? null)
    if (!problema) return
    event.preventDefault()
    const campo = formulario.elements.namedItem(problema.campo)
    if (campo instanceof HTMLElement) campo.focus()
  }

  return { error, formulario: { noValidate: true, onSubmit } }
}
