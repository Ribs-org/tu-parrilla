import { nombreDe } from '@/lib/vocabulario'

/**
 * Lo que se dice distinto de día: van las dos versiones y el modo esconde una (`.solo-noche`,
 * `.solo-dia`, en `globals.css`), como los dos dibujos del corte. Así cambia con el botón del
 * modo, sin recargar, y sirve igual en un componente del servidor que en uno del cliente. Si las
 * dos dicen lo mismo, va una sola.
 *
 * Para lo que no es texto a la vista —un `aria-label`, un `title`, la pregunta de un `confirm`—
 * no sirve, porque el CSS no lo alcanza: ahí va `useTema` (`tema-vivo.ts`).
 */
export function DeNocheYDeDia({ noche, dia }: { noche: React.ReactNode; dia: React.ReactNode }) {
  if (noche === dia) return <>{noche}</>
  return (
    <>
      <span className="solo-noche">{noche}</span>
      <span className="solo-dia">{dia}</span>
    </>
  )
}

/** El nombre de una pantalla en los dos modos: «La Parrilla» de noche, «La Barra» de día. */
export function NombreDe({ ruta }: { ruta: string }) {
  return <DeNocheYDeDia noche={nombreDe(ruta)} dia={nombreDe(ruta, 'dia')} />
}
