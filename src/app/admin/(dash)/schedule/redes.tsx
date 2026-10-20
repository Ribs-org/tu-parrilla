import { DeNocheYDeDia } from '@/components/de-noche-y-de-dia'
import { Icon } from '@/components/icon'
import { networkLabel } from '@/lib/networks'
import { selloDe, type Sello } from '@/lib/parrilla'
import type { Tema } from '@/lib/tema'
import { cn } from '@/lib/utils'
import { FIERRO_FRIO } from '@/lib/vocabulario'
import { colorDeDestino, etiquetaDestino, nombreDestino } from './etiqueta'

type Destino = {
  network: string
  handle: string | null
  status: string
  externalId: string | null
  opciones: unknown
  lastError?: string | null
}

/** En la cola, el icono se tiñe solo si se quemó o si ya salió (`colorDeDestino`). */
const TINTE: Record<ReturnType<typeof colorDeDestino>, string> = {
  gris: 'text-fg',
  positivo: 'text-positive',
  negativo: 'text-negative',
}

/**
 * El chip de cada destino debajo del corte: dice en texto lo mismo que su marca, en el
 * mismo orden. El color va en el signo y en el borde, nunca de fondo salvo lo quemado, que
 * lleva un tinte; el icono de la red va en el color del texto, sin su color de marca, para
 * que no compita con el estado.
 */
const CHIP: Record<Sello, { clase: string; signo: string }> = {
  pendiente: { clase: 'border-acero-700 text-fg', signo: '' },
  saliendo: { clase: 'border-brasa/60 text-fg', signo: '…' },
  servido: { clase: 'border-positive/45 text-positive', signo: '✓' },
  bandeja: { clase: 'border-caution/65 text-caution', signo: '◐' },
  reintento: { clase: 'border-caution/65 text-caution', signo: '↻' },
  frio: { clase: 'border-dashed border-caution/65 text-caution', signo: '!' },
  quemado: { clase: 'border-negative/60 bg-negative/15 text-negative', signo: '✕' },
}

/**
 * Los destinos de un corte. Sin `detalle`, un chip por destino con el icono de la red y un
 * signo de cómo le fue (el calendario, la vista «Día» y «Se quemó»); el `sellos` que trae la
 * página manda, porque solo ella sabe qué cuentas se enfriaron. Con `detalle`, cada icono
 * lleva al lado el handle y el estado en palabras (la cola).
 *
 * Lo que decía el chip de texto sigue diciéndose: en el `title` de cada chip, y en un
 * `sr-only` — de la fila sin `detalle`, o delante de cada icono con `detalle`, porque ahí el
 * texto visible ya dice el handle y el estado y solo falta la red; un `sr-only` de fila
 * repetiría los dos.
 */
export function Redes({
  targets,
  sellos,
  detalle = false,
}: {
  targets: Destino[]
  sellos?: readonly Sello[]
  detalle?: boolean
}) {
  if (targets.length === 0) return null
  if (detalle) {
    // En modo detalle el texto va al color pleno: el fondo del chip de la cola ya dice el
    // estado, y un handle de 12 px en rojo sobre ese fondo se quedaba en 4.28:1 (medido).
    return (
      <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-1">
        {targets.map((t, i) => (
          <span
            key={`${t.network}-${t.handle ?? ''}-${i}`}
            title={`${nombreDestino(t)}: ${etiquetaDestino(t)}`}
            className={cn('inline-flex items-center gap-1', TINTE[colorDeDestino(t.status)])}
          >
            <Icon name={t.network} className="h-3.5 w-3.5 shrink-0" />
            <span className="text-xs text-fg">
              <span className="sr-only">{networkLabel(t.network)} · </span>
              {t.handle ?? nombreDestino(t)}
              <span> · {etiquetaDestino(t)}</span>
            </span>
          </span>
        ))}
      </span>
    )
  }
  const enPalabras = (tema: Tema) => targets.map((t, i) => textoDe(t, sellos?.[i] ?? selloDe(t), tema)).join(', ')
  return (
    <span className="inline-flex flex-wrap items-center gap-1">
      {targets.map((t, i) => {
        const sello = sellos?.[i] ?? selloDe(t)
        const chip = (titulo: string, modo?: 'solo-noche' | 'solo-dia') => (
          <span
            key={`${t.network}-${t.handle ?? ''}-${i}${modo ? `-${modo}` : ''}`}
            title={titulo}
            className={cn(
              'inline-flex h-[1.15rem] items-center gap-0.5 rounded-[3px] border px-1 font-mono text-[0.62rem] leading-none',
              CHIP[sello].clase,
              modo,
            )}
          >
            <Icon name={t.network} className="h-3 w-3 shrink-0" />
            {CHIP[sello].signo ? <span aria-hidden>{CHIP[sello].signo}</span> : null}
          </span>
        )
        // El chip de una cuenta fría nombra su fierro en el `title`, que el CSS no alcanza: de día
        // va otro chip con el del cuchillo, y el modo esconde uno, como los dos dibujos del corte.
        if (sello === 'frio') return [chip(textoDe(t, sello, 'noche'), 'solo-noche'), chip(textoDe(t, sello, 'dia'), 'solo-dia')]
        return chip(textoDe(t, sello, 'noche'))
      })}
      <span className="sr-only">
        <DeNocheYDeDia noche={enPalabras('noche')} dia={enPalabras('dia')} />
      </span>
    </span>
  )
}

/** Lo que dice un chip en palabras: la cuenta y cómo le fue, o que su fierro está frío. */
function textoDe(t: Destino, sello: Sello, tema: Tema): string {
  return `${nombreDestino(t)}: ${sello === 'frio' ? FIERRO_FRIO[tema] : etiquetaDestino(t)}`
}
