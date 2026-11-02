'use client'

import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react'
import { createPortal } from 'react-dom'
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'
import { CONTROL } from '@/components/boton'
import {
  CABECERA_DE_SEMANA,
  acotar,
  cifra,
  dentro,
  diaEnPalabras,
  esDia,
  esValor,
  girar,
  mesDe,
  moverDia,
  nombreDelMes,
  semanasDelMes,
  soloDigitos,
  sumarMeses,
  textoDelValor,
  type Modo,
} from '@/lib/calendario'
import { cn } from '@/lib/utils'
import { Button } from './ui-boton'
import { Ventana } from './ventana'

type Props = {
  /** Un día, o un día con hora. */
  modo?: Modo
  /** Controlado: el valor y quién lo cambia. Sin `value`, el selector guarda el suyo. */
  value?: string
  defaultValue?: string
  onChange?: (valor: string) => void
  /** Con nombre, el valor viaja en el formulario como lo mandaba el campo del navegador. */
  name?: string
  id?: string
  'aria-label'?: string
  min?: string
  max?: string
  disabled?: boolean
  /** Hoy, en la zona de quien usa el panel. Sin él, el del equipo. Solo marca el día y ofrece «Hoy». */
  hoy?: string
  /** Ofrece «Quitar», para los campos que pueden quedar vacíos. */
  quitable?: boolean
  className?: string
}

/**
 * El campo de fecha del panel, en vez del `type="date"` o `datetime-local` del navegador: ese
 * calendario lo dibuja el navegador, con su letra, su idioma y sus colores, y en el modo día
 * salía de noche. Este es un botón con el valor escrito, que abre el mes en una `Ventana`.
 *
 * El valor es el mismo texto que mandaba el campo del navegador («YYYY-MM-DD» o
 * «YYYY-MM-DDTHH:MM», en hora de pared): ningún formulario cambia lo que envía, y la zona la
 * sigue poniendo el servidor al leerlo. Viaja en un `<input type="hidden">` junto al botón.
 *
 * La ventana se dibuja en un portal, colgada del panel (`.acerado`, para los colores del modo) y
 * fuera del formulario y de su `<label>`: adentro, un Enter en la hora enviaría el formulario y un
 * clic en el título del mes apretaría el botón otra vez. Los eventos de React igual suben por el
 * árbol: el compositor oye el clic de «Listo» y guarda el borrador, como con cualquier campo.
 */
export function SelectorFecha({
  modo = 'fecha-hora',
  value,
  defaultValue = '',
  onChange,
  name,
  id,
  'aria-label': etiqueta,
  min,
  max,
  disabled,
  hoy,
  quitable,
  className,
}: Props) {
  const [propio, setPropio] = useState(defaultValue)
  const valor = value ?? propio
  const [abierto, setAbierto] = useState(false)
  const idTexto = useId()
  const lleno = esValor(valor, modo)
  const vacio = modo === 'fecha' ? 'Elegir el día' : 'Elegir día y hora'

  function poner(nuevo: string) {
    if (value === undefined) setPropio(nuevo)
    onChange?.(nuevo)
  }

  return (
    <>
      <button
        type="button"
        id={id}
        aria-label={etiqueta}
        aria-describedby={idTexto}
        aria-haspopup="dialog"
        aria-expanded={abierto}
        disabled={disabled}
        onClick={() => setAbierto(true)}
        className={cn(CONTROL, 'flex items-center gap-2 text-left disabled:opacity-50', className)}
      >
        <CalendarDays className="h-4 w-4 shrink-0 text-fg-faint" aria-hidden />
        <span id={idTexto} className={cn('truncate', lleno ? 'font-mono' : 'text-fg-faint')}>
          {lleno ? textoDelValor(valor) : vacio}
        </span>
      </button>
      {name ? <input type="hidden" name={name} value={valor} disabled={disabled} /> : null}
      {abierto
        ? createPortal(
            <Calendario
              modo={modo}
              valor={lleno ? valor : ''}
              min={min}
              max={max}
              hoy={hoy ?? hoyDelEquipo()}
              quitable={quitable && valor !== ''}
              titulo={etiqueta ?? (modo === 'fecha' ? 'Elegir el día' : 'Elegir el día y la hora')}
              onElegir={(nuevo) => {
                poner(nuevo)
                setAbierto(false)
              }}
              onCerrar={() => setAbierto(false)}
            />,
            document.querySelector('.acerado') ?? document.body,
          )
        : null}
    </>
  )
}

function hoyDelEquipo(): string {
  const ahora = new Date()
  return `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, '0')}-${String(ahora.getDate()).padStart(2, '0')}`
}

/**
 * El mes, en su ventana. Nace al abrir y muere al cerrar, así que siempre parte del valor vigente.
 *
 * El mes es una grilla de botones con un solo punto de tabulación —el día con el foco—, y las
 * flechas se mueven por ella (`moverDia`). Elegir un día con solo fecha cierra; con hora, lo deja
 * marcado y «Listo» cierra, para alcanzar a escribir la hora. Esc, el velo y «Cancelar» cierran sin
 * cambiar nada.
 */
function Calendario({
  modo,
  valor,
  min,
  max,
  hoy,
  quitable,
  titulo,
  onElegir,
  onCerrar,
}: {
  modo: Modo
  valor: string
  min?: string
  max?: string
  hoy: string
  quitable?: boolean
  titulo: string
  onElegir: (valor: string) => void
  onCerrar: () => void
}) {
  const ventana = useRef<HTMLDialogElement>(null)
  const grilla = useRef<HTMLDivElement>(null)
  const minutos = useRef<HTMLInputElement>(null)
  const idMes = useId()
  const diaInicial = valor ? valor.slice(0, 10) : null
  const [elegido, setElegido] = useState<string | null>(diaInicial)
  const [enfocado, setEnfocado] = useState(acotar(diaInicial ?? hoy, min, max))
  const [mes, setMes] = useState(mesDe(enfocado))
  const [hora, setHora] = useState(valor.length > 10 ? valor.slice(11, 13) : '12')
  const [minuto, setMinuto] = useState(valor.length > 10 ? valor.slice(14, 16) : '00')
  // El foco sigue a las flechas, pero no a un clic: tras el clic ya está donde tiene que estar.
  const moverFoco = useRef(true)

  useEffect(() => {
    if (!ventana.current?.open) ventana.current?.showModal()
  }, [])

  useEffect(() => {
    if (!moverFoco.current) return
    moverFoco.current = false
    grilla.current?.querySelector<HTMLButtonElement>('[tabindex="0"]')?.focus()
  }, [enfocado, mes])

  function irA(dia: string) {
    const acotado = acotar(dia, min, max)
    moverFoco.current = true
    setEnfocado(acotado)
    setMes(mesDe(acotado))
  }

  /**
   * Cierra antes de avisar: `close()` devuelve el foco al campo que abrió la ventana, y una
   * ventana que se desmonta abierta lo dejaría perdido en la página.
   */
  function terminar(nuevo: string) {
    ventana.current?.close()
    onElegir(nuevo)
  }

  function elegir(dia: string) {
    if (!dentro(dia, min, max) || !esDia(dia)) return
    if (modo === 'fecha') {
      terminar(dia)
      return
    }
    setElegido(dia)
    setEnfocado(dia)
    setMes(mesDe(dia))
  }

  function teclaEnElMes(event: KeyboardEvent<HTMLDivElement>) {
    const destino = moverDia(enfocado, event.key)
    if (!destino) return
    event.preventDefault()
    irA(destino)
  }

  function listo() {
    if (elegido) terminar(`${elegido}T${cifra(hora, 23)}:${cifra(minuto, 59)}`)
  }

  /** Las flechas suben y bajan la hora; Enter es «Listo». */
  function teclaEnLaHora(event: KeyboardEvent<HTMLInputElement>, poner: (f: (v: string) => string) => void, tope: number) {
    if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      event.preventDefault()
      const paso = event.key === 'ArrowUp' ? 1 : -1
      poner((v) => girar(v, paso, tope))
    } else if (event.key === 'Enter') {
      event.preventDefault()
      listo()
    }
  }

  const anteriorFuera = min !== undefined && sumarMeses(mes, -1) < mesDe(min)
  const siguienteFuera = max !== undefined && sumarMeses(mes, 1) > mesDe(max)
  const hoyCabe = dentro(hoy, min, max)

  return (
    <Ventana
      ref={ventana}
      aria-label={titulo}
      alVelo={() => ventana.current?.close()}
      onClose={onCerrar}
      className="ventana-candente w-[21rem] border-t-2 border-t-brasa"
    >
      <div className="space-y-3 p-4">
        <div className="flex items-center gap-2">
          <p id={idMes} aria-live="polite" className="flex-1 font-titulo text-sm font-semibold uppercase tracking-[0.06em]">
            {nombreDelMes(mes)}
          </p>
          <button
            type="button"
            disabled={anteriorFuera}
            onClick={() => setMes(sumarMeses(mes, -1))}
            className="rounded-lg p-1.5 text-fg-muted transition-colors hover:bg-acero-800 hover:text-fg disabled:opacity-30"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden />
            <span className="sr-only">Mes anterior</span>
          </button>
          <button
            type="button"
            disabled={siguienteFuera}
            onClick={() => setMes(sumarMeses(mes, 1))}
            className="rounded-lg p-1.5 text-fg-muted transition-colors hover:bg-acero-800 hover:text-fg disabled:opacity-30"
          >
            <ChevronRight className="h-4 w-4" aria-hidden />
            <span className="sr-only">Mes siguiente</span>
          </button>
        </div>

        <div ref={grilla} role="grid" aria-labelledby={idMes} onKeyDown={teclaEnElMes} className="space-y-1">
          <div role="row" className="grid grid-cols-7 gap-1">
            {CABECERA_DE_SEMANA.map((d) => (
              <span
                key={d}
                role="columnheader"
                className="text-center font-titulo text-[0.65rem] uppercase tracking-[0.1em] text-fg-faint"
              >
                {d}
              </span>
            ))}
          </div>
          {semanasDelMes(mes).map((semana) => (
            <div key={semana[0]} role="row" className="grid grid-cols-7 gap-1">
              {semana.map((dia) => {
                const delMes = mesDe(dia) === mes
                const cabe = dentro(dia, min, max)
                const esElegido = dia === elegido
                // Con el foco en otro mes —tras Re Pág, por ejemplo—, el punto de tabulación queda
                // en un día de este.
                const tabulable = mesDe(enfocado) === mes ? dia === enfocado : dia === `${mes}-01`
                return (
                  <span key={dia} role="gridcell" aria-selected={esElegido}>
                    <button
                      type="button"
                      tabIndex={tabulable ? 0 : -1}
                      disabled={!cabe}
                      aria-label={diaEnPalabras(dia)}
                      aria-current={dia === hoy ? 'date' : undefined}
                      onClick={() => {
                        setEnfocado(dia)
                        elegir(dia)
                      }}
                      className={cn(
                        'h-10 w-full font-mono text-[0.8rem] transition-colors disabled:cursor-not-allowed disabled:opacity-25',
                        // El elegido es un corte: las cuatro esquinas distintas, como la miniatura
                        // de Contenido. De día, la misma forma es una pieza en la barra.
                        esElegido
                          ? 'rounded-[9px_3px_10px_4px] bg-brasa font-semibold text-acero-950'
                          : cn('rounded-lg hover:bg-velo/[0.07]', delMes ? 'text-fg' : 'text-fg-faint'),
                        dia === hoy && !esElegido && 'ring-1 ring-inset ring-brasa/70',
                      )}
                    >
                      {Number(dia.slice(8))}
                    </button>
                  </span>
                )
              })}
            </div>
          ))}
        </div>

        {modo === 'fecha-hora' ? (
          <div role="group" aria-label="Hora" className="flex items-center gap-2 border-t border-acero-700 pt-3">
            <span className="flex-1 font-titulo text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-fg-faint">Hora</span>
            <input
              inputMode="numeric"
              aria-label="Horas"
              value={hora}
              onFocus={(event) => event.currentTarget.select()}
              onChange={(event) => {
                const escrito = soloDigitos(event.target.value)
                setHora(escrito)
                // Dos cifras ya son una hora: el cursor pasa a los minutos, como en un reloj.
                if (escrito.length === 2) minutos.current?.focus()
              }}
              onBlur={() => setHora((v) => cifra(v, 23))}
              onKeyDown={(event) => teclaEnLaHora(event, setHora, 23)}
              className={cn(CONTROL, 'w-14 text-center font-mono')}
            />
            <span className="font-mono text-fg-muted" aria-hidden>
              :
            </span>
            <input
              ref={minutos}
              inputMode="numeric"
              aria-label="Minutos"
              value={minuto}
              onFocus={(event) => event.currentTarget.select()}
              onChange={(event) => setMinuto(soloDigitos(event.target.value))}
              onBlur={() => setMinuto((v) => cifra(v, 59))}
              onKeyDown={(event) => teclaEnLaHora(event, setMinuto, 59)}
              className={cn(CONTROL, 'w-14 text-center font-mono')}
            />
          </div>
        ) : null}

        <div className="flex flex-wrap items-center gap-2 pt-1">
          {modo === 'fecha-hora' ? (
            <Button type="button" variant="primary" disabled={!elegido} onClick={listo}>
              Listo
            </Button>
          ) : null}
          {hoyCabe ? (
            <Button
              type="button"
              onClick={() => {
                irA(hoy)
                elegir(hoy)
              }}
            >
              Hoy
            </Button>
          ) : null}
          {quitable ? (
            <Button type="button" onClick={() => terminar('')}>
              Quitar
            </Button>
          ) : null}
          <Button type="button" className="ml-auto" onClick={() => ventana.current?.close()}>
            Cancelar
          </Button>
        </div>
      </div>
    </Ventana>
  )
}
