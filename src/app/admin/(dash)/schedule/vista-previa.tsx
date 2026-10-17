import { Corte } from '@/components/corte'
import type { Calor, Formato, Sello } from '@/lib/parrilla'
import { cn } from '@/lib/utils'

const CLASE_CALOR: Record<Calor, string> = {
  apagada: 'grilla-apagada',
  prendida: 'grilla-prendida',
  llena: 'grilla-llena',
}

/**
 * «Así va a quedar»: el corte del post mientras se arma, arriba del compositor. La silueta sale
 * de los archivos elegidos —también de los que todavía suben—, lleva una marca por cuenta
 * marcada y se llena de carne cruda a medida que llegan los archivos. Cruda es lo correcto:
 * todavía no está en la parrilla. Si un archivo no llegó, lleva el halo y la banderita, como
 * todo lo que pide la mano del dueño.
 *
 * La parrilla de atrás es la del día elegido, con este post encima: si ese día ya va lleno, se
 * ve antes de programar.
 */
export function VistaPrevia({
  formato,
  huesos,
  sellos,
  llenado,
  noLlego,
  calor,
  frase,
  idDeLlenado,
}: {
  formato: Formato
  huesos: number
  sellos: readonly Sello[]
  llenado: number
  noLlego: boolean
  calor: Calor
  frase: string
  idDeLlenado: string
}) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-acero-700 bg-acero-950/40 p-3">
      <div className={cn('grilla w-32 shrink-0 px-2 pb-2 pt-4', CLASE_CALOR[calor])}>
        <Corte
          formato={formato}
          huesos={huesos}
          carne="cruda"
          coccion={noLlego ? 'parcial' : 'cruda'}
          sellos={sellos}
          llenado={llenado}
          idDeLlenado={idDeLlenado}
        />
      </div>
      <div className="min-w-0" aria-live="polite">
        <p className="font-titulo text-[0.65rem] uppercase tracking-[0.14em] text-fg-faint">Así va a quedar</p>
        <p className="mt-1 text-[0.82rem] leading-snug text-fg">{frase}</p>
      </div>
    </div>
  )
}
