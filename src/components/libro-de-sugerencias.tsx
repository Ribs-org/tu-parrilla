'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { escribirEnElLibro } from '@/app/admin/sugerencias-actions'
import { SUGERENCIA_VACIA } from '@/lib/sugerencias/formato'
import { MAX_TEXTO, TIPOS, TIPOS_SUGERENCIA, type TipoSugerencia } from '@/lib/sugerencias/tipos'
import { cn } from '@/lib/utils'
import { ECHAR_AL_LIBRO, LIBRO, LIBRO_SUBTITULO, QUEDO_EN_EL_LIBRO } from '@/lib/vocabulario'
import { DeNocheYDeDia } from './de-noche-y-de-dia'
import { Textarea } from './ui'
import { Button } from './ui-boton'
import { Ventana } from './ventana'

// El libro de sugerencias y reclamos del panel (de día, la caja de sugerencias): una ventana
// donde la persona le escribe al equipo que hace Tu Parrilla. Lo que escribe se guarda y sale
// como issue a GitHub (`src/lib/sugerencias/`). Se abre desde la última entrada del menú de
// Ajustes (`nav.tsx`).

type Estado = 'escribiendo' | 'enviando' | 'recibido'

/**
 * El dibujo de arriba de la ventana. De noche, el libro abierto con su lápiz atado, como el que
 * tiene todo restorán en Chile; de día, la caja de madera con su ranura, el buzón de opiniones
 * de los locales japoneses. Los dos van y el modo esconde uno.
 *
 * La hoja aparece apenas hay algo escrito. Al recibirse, de noche cae sobre la página derecha y
 * la página da vuelta —quedó escrita en el libro— y baja la cinta del marcapáginas; de día entra
 * por la ranura y la caja se asienta. Las animaciones están en `globals.css` (`.libro-*`,
 * `.caja-*`) y se encienden con `data-estado`; sin movimiento, quedan en su último cuadro.
 */
export function DibujoDelLibro({ estado, conHoja }: { estado: Estado; conHoja: boolean }) {
  const recorte = useId()
  return (
    <div className="libro-dibujo mx-auto h-24 w-40" data-estado={estado} data-hoja={conHoja ? '' : undefined} aria-hidden>
      {/* De noche: el libro. */}
      {/* El viewBox empieza en -8 para dejarle lugar al lápiz a la derecha sin descentrar el libro. */}
      <svg viewBox="-8 0 176 96" className="solo-noche h-full w-full">
        {/* Las tapas, de cuero, asomando debajo de las páginas. */}
        <path d="M10 36Q44 28 80 36Q116 28 150 36V88Q116 80 80 88Q44 80 10 88Z" fill="var(--color-brasa)" opacity=".85" />
        {/* La página izquierda, con lo que otros ya escribieron. */}
        <path d="M16 34Q48 26 80 34V84Q48 76 16 84Z" fill="var(--color-fg)" />
        <g stroke="var(--color-acero-600)" strokeWidth="1.3" strokeLinecap="round" opacity=".55">
          <path d="M24 42Q46 37 70 41" />
          <path d="M24 50Q44 45 66 49" />
          <path d="M24 58Q48 53 72 57" />
          <path d="M24 66Q40 62 58 65" />
        </g>
        {/* La página derecha, en blanco: la que da vuelta al recibir. */}
        <path d="M80 34Q112 26 144 34V84Q112 76 80 84Z" fill="var(--color-fg)" />
        <g className="libro-pagina">
          <path d="M80 34Q112 26 144 34V84Q112 76 80 84Z" fill="var(--color-fg)" />
          <g stroke="var(--color-acero-600)" strokeWidth="1.3" strokeLinecap="round" opacity=".55" className="libro-renglones">
            <path d="M88 41Q110 37 134 41" />
            <path d="M88 49Q108 45 130 49" />
            <path d="M88 57Q112 53 136 57" />
          </g>
          {/* La hoja de la persona, ya sobre la página. */}
          <g className="libro-hoja">
            <rect x="94" y="36" width="36" height="40" rx="2" fill="var(--color-fg)" stroke="var(--color-brasa)" strokeWidth="1.4" />
            <g stroke="var(--color-brasa)" strokeWidth="1.4" strokeLinecap="round">
              <path d="M100 45H124" />
              <path d="M100 52H120" />
              <path d="M100 59H124" />
              <path d="M100 66H114" />
            </g>
          </g>
        </g>
        {/* El lomo. */}
        <path d="M80 34V84" stroke="var(--color-acero-600)" strokeWidth="1.4" />
        {/* El lápiz, atado con su cordel, como en el mesón de un restorán. */}
        <path d="M160 70Q162 84 150 80" stroke="var(--color-fg-faint)" strokeWidth="1" fill="none" strokeDasharray="2 2" />
        <g transform="rotate(14 158 50)">
          <rect x="155" y="34" width="6" height="28" rx="1.5" fill="var(--color-caution)" />
          <path d="M155 62H161L158 68Z" fill="var(--color-fg)" />
          <path d="M157 65.6H159L158 68Z" fill="var(--color-acero-950)" />
        </g>
        {/* La cinta del marcapáginas: baja cuando la página ya dio vuelta. */}
        <path className="libro-cinta" d="M77 30H83V58L80 54L77 58Z" fill="var(--color-negative)" />
      </svg>

      {/* De día: la caja de sugerencias. */}
      <svg viewBox="0 0 160 96" className="solo-dia h-full w-full">
        <defs>
          <clipPath id={recorte}>
            {/* Lo que se ve de la hoja: lo que todavía no entró por la ranura. */}
            <rect x="0" y="-40" width="160" height="80" />
          </clipPath>
        </defs>
        {/* La hoja, doblada, que entra por la ranura. */}
        <g clipPath={`url(#${recorte})`}>
          <g className="caja-hoja">
            <rect x="66" y="6" width="28" height="34" rx="1.5" fill="var(--color-acero-900)" stroke="var(--color-brasa)" strokeWidth="1.4" />
            <g stroke="var(--color-brasa)" strokeWidth="1.3" strokeLinecap="round">
              <path d="M71 14H89" />
              <path d="M71 20H86" />
              <path d="M71 26H89" />
            </g>
          </g>
        </g>
        <g className="caja-cuerpo">
          {/* El techo, inclinado, con la ranura. */}
          <path d="M40 46L52 36H108L120 46Z" fill="var(--color-acero-600)" stroke="var(--color-fg-muted)" strokeWidth="1.4" strokeLinejoin="round" />
          <rect x="62" y="38.5" width="36" height="3" rx="1.5" fill="var(--color-fg)" />
          {/* La caja de madera, con sus vetas. */}
          <rect x="42" y="46" width="76" height="42" rx="2" fill="var(--color-acero-700)" stroke="var(--color-fg-muted)" strokeWidth="1.4" />
          <g stroke="var(--color-acero-600)" strokeWidth="1.2" strokeLinecap="round" fill="none">
            <path d="M48 56Q58 54 64 57" />
            <path d="M98 78Q106 75 112 78" />
            <path d="M48 76Q54 74 60 76" />
          </g>
          {/* El rótulo de papel, con trazos de pincel que se leen como escritura vertical. */}
          <rect x="72" y="51" width="16" height="32" rx="1" fill="var(--color-acero-900)" stroke="var(--color-fg-muted)" strokeWidth="1" />
          <g stroke="var(--color-fg)" strokeWidth="1.5" strokeLinecap="round" fill="none">
            <path d="M77 56H83" />
            <path d="M76 59.5H84" />
            <path d="M78.5 58V63.5Q80 62.5 81.5 63.5" />
            <path d="M77 67.5Q80 66.5 83 67.5" />
            <path d="M78 71H82" />
            <path d="M76 75H84" />
            <path d="M80 73V80" />
            <path d="M77.5 78L76.5 80M82.5 78L83.5 80" />
          </g>
          {/* El sello rojo del local. */}
          <circle cx="80" cy="85" r="2" fill="var(--color-brasa)" />
        </g>
      </svg>
    </div>
  )
}

/** El ícono chico del menú de Ajustes: el libro de noche, la caja de día. */
export function IconoLibro({ className }: { className?: string }) {
  return (
    <>
      <svg viewBox="0 0 24 24" fill="currentColor" className={cn('solo-noche shrink-0', className)} aria-hidden>
        <path d="M2 5.2Q6.5 3.6 11.2 5.4V20Q6.5 18.4 2 20Z" />
        <path d="M12.8 5.4Q17.5 3.6 22 5.2V20Q17.5 18.4 12.8 20Z" />
      </svg>
      <svg viewBox="0 0 24 24" fill="currentColor" className={cn('solo-dia shrink-0', className)} aria-hidden>
        <path fillRule="evenodd" d="M2.5 9L6 5H18L21.5 9ZM9 6.6H15V7.6H9Z" />
        <rect x="3.5" y="10" width="17" height="11" rx="1" />
      </svg>
    </>
  )
}

/**
 * La ventana. `abierto` la abre con `showModal()`; cualquier salida —«Cancelar», «Cerrar», Esc o
 * un clic en el velo— llama a `alCerrar`. Lo escrito se queda si se cierra sin mandar, y se
 * borra recién cuando se recibió.
 */
export function LibroDeSugerencias({
  abierto,
  alCerrar,
  inicial,
}: {
  abierto: boolean
  alCerrar: () => void
  /**
   * Lo que ya viene escrito al abrirlo, si lo abre un botón que sabe qué se va a pedir: «¿Necesitas
   * más espacio?» de la cámara de frío. Se pone solo si la hoja está en blanco: lo que la persona
   * ya escribió no se pisa.
   */
  inicial?: { tipo: TipoSugerencia; texto: string }
}) {
  const pathname = usePathname()
  const ventana = useRef<HTMLDialogElement>(null)
  const campo = useRef<HTMLTextAreaElement>(null)
  const cerrar = useRef<HTMLButtonElement>(null)
  const [tipo, setTipo] = useState<TipoSugerencia>('idea')
  const [texto, setTexto] = useState('')
  const [estado, setEstado] = useState<Estado>('escribiendo')
  const [error, setError] = useState<string | null>(null)
  const idTitulo = useId()
  const idAviso = useId()

  // Al abrirse, lo que trae escrito quien lo abrió, si la hoja está en blanco. Durante el render y no
  // en un efecto: es estado que sigue a una prop, como pide React.
  const [abiertoAntes, setAbiertoAntes] = useState(abierto)
  if (abierto !== abiertoAntes) {
    setAbiertoAntes(abierto)
    if (abierto && inicial && estado === 'escribiendo' && !texto.trim()) {
      setTipo(inicial.tipo)
      setTexto(inicial.texto)
    }
  }

  useEffect(() => {
    const dialogo = ventana.current
    if (!dialogo) return
    if (abierto && !dialogo.open) {
      dialogo.showModal()
      campo.current?.focus()
    }
    if (!abierto && dialogo.open) dialogo.close()
  }, [abierto])

  useEffect(() => {
    if (estado === 'recibido') cerrar.current?.focus()
  }, [estado])

  function otra() {
    setTexto('')
    setError(null)
    setEstado('escribiendo')
    // Después de pintar el campo otra vez.
    requestAnimationFrame(() => campo.current?.focus())
  }

  function salir() {
    if (estado === 'recibido') otra()
    alCerrar()
  }

  async function mandar(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (estado !== 'escribiendo') return
    if (!texto.trim()) {
      setError(SUGERENCIA_VACIA)
      campo.current?.focus()
      return
    }
    setError(null)
    setEstado('enviando')
    try {
      const r = await escribirEnElLibro({ tipo, texto, pantalla: pathname })
      if (r.error) {
        setError(r.error)
        setEstado('escribiendo')
        return
      }
      setEstado('recibido')
    } catch {
      setError('No se pudo mandar: revisa tu conexión y vuelve a intentarlo. Lo que escribiste sigue acá.')
      setEstado('escribiendo')
    }
  }

  return (
    <Ventana
      ref={ventana}
      aria-labelledby={idTitulo}
      alVelo={salir}
      onClose={() => {
        if (abierto) salir()
      }}
      className="ventana-candente w-[28rem] border-t-2 border-t-brasa"
    >
      <div className="space-y-4 p-5">
        <DibujoDelLibro estado={estado} conHoja={texto.trim().length > 0} />
        <div className="text-center">
          <h2 id={idTitulo} className="font-titulo text-base font-semibold uppercase tracking-[0.06em]">
            <DeNocheYDeDia noche={LIBRO.noche} dia={LIBRO.dia} />
          </h2>
          <p className="text-[0.78rem] text-fg-faint">{LIBRO_SUBTITULO}</p>
        </div>

        {estado === 'recibido' ? (
          <div className="libro-recibido space-y-3 text-center" role="status">
            <p className="font-titulo text-sm font-semibold uppercase tracking-[0.04em] text-brasa">
              <DeNocheYDeDia noche={QUEDO_EN_EL_LIBRO.noche} dia={QUEDO_EN_EL_LIBRO.dia} />
            </p>
            <p className="text-sm text-fg-muted">
              Gracias. Lo lee el equipo que hace Tu Parrilla: si es una idea, la pensamos; si algo no funciona, lo
              buscamos.
            </p>
            <div className="flex flex-wrap justify-center gap-2 pt-1">
              <Button ref={cerrar} type="button" variant="primary" onClick={salir}>
                Cerrar
              </Button>
              <Button type="button" onClick={otra}>
                Escribir otra
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={mandar} noValidate className="space-y-3">
            <p className="text-sm text-fg-muted">
              Lo lee el equipo que hace Tu Parrilla. No te prometemos hacerlo todo, pero lo leemos todo.
            </p>
            <fieldset>
              <legend className="mb-1.5 text-[0.72rem] font-medium uppercase tracking-[0.08em] text-fg-faint">
                Qué es
              </legend>
              <div className="flex flex-wrap gap-1.5">
                {TIPOS_SUGERENCIA.map((t) => (
                  <label
                    key={t}
                    className={cn(
                      'cursor-pointer rounded-full border px-3 py-1 text-[0.8rem] transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brasa',
                      tipo === t
                        ? 'border-brasa bg-brasa text-acero-950'
                        : 'border-acero-700 text-fg-muted hover:border-acero-600 hover:text-fg',
                    )}
                  >
                    <input
                      type="radio"
                      name="tipo"
                      value={t}
                      checked={tipo === t}
                      onChange={() => setTipo(t)}
                      className="sr-only"
                    />
                    {TIPOS[t].nombre}
                  </label>
                ))}
              </div>
              <p className="mt-1.5 text-[0.75rem] text-fg-faint">{TIPOS[tipo].ayuda}</p>
            </fieldset>
            <div>
              <Textarea
                ref={campo}
                name="texto"
                rows={5}
                maxLength={MAX_TEXTO}
                value={texto}
                onChange={(e) => {
                  setTexto(e.target.value)
                  if (error) setError(null)
                }}
                placeholder={TIPOS[tipo].ejemplo}
                aria-label="Lo que nos quieres decir"
                aria-describedby={idAviso}
                aria-invalid={error === SUGERENCIA_VACIA || undefined}
              />
              <p className="mt-1 text-right font-mono text-[0.68rem] text-fg-faint">
                {texto.length} / {MAX_TEXTO}
              </p>
            </div>
            <p id={idAviso} className="text-[0.72rem] leading-relaxed text-fg-faint">
              Se publica en el repositorio público de Tu Parrilla en GitHub, sin tu nombre ni tu correo. Va con la pantalla
              donde estás, el modo, tu navegador y cuántas cuentas tienes conectadas. No escribas contraseñas ni datos
              personales.
            </p>
            {error ? (
              <p role="alert" className="text-sm text-negative">
                {error}
              </p>
            ) : null}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <Button type="submit" variant="primary" disabled={estado === 'enviando'}>
                {estado === 'enviando' ? (
                  'Mandando…'
                ) : (
                  <DeNocheYDeDia noche={ECHAR_AL_LIBRO.noche} dia={ECHAR_AL_LIBRO.dia} />
                )}
              </Button>
              <Button type="button" onClick={salir}>
                Cancelar
              </Button>
            </div>
          </form>
        )}
      </div>
    </Ventana>
  )
}
