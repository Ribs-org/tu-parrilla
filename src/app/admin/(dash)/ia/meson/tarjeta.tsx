import { DIAS_DE_AVISO } from '@/lib/cocina/barrido'
import type { CreativoDelMeson } from '@/lib/cocina/meson'
import { AccionesDelCreativo } from './acciones'

/** Los atributos que se muestran aparte: el estilo y la pieza ya tienen su lugar en la tarjeta. */
const YA_A_LA_VISTA = new Set(['estilo', 'pieza'])

/**
 * Un creativo del mesón: el video que se reproduce ahí mismo con su portada, o las láminas del
 * carrusel; su estilo y lo que rotó; el título de YouTube y el texto que propone el chef; y
 * «Programar» y «Descartar».
 */
export function TarjetaDelCreativo({ creativo: c, ahora, zona }: { creativo: CreativoDelMeson; ahora: Date; zona: string }) {
  // En su última semana, dice cuándo se borra: el resumen del día lo avisa también.
  const porVencer = c.expiraEn && c.expiraEn.getTime() - ahora.getTime() < DIAS_DE_AVISO * 86_400_000 ? c.expiraEn : null
  const otros = Object.entries(c.atributos).filter(([clave]) => !YA_A_LA_VISTA.has(clave))
  const primera = c.media[0]
  return (
    <li className="flex flex-col rounded-lg border border-acero-700 p-3">
      {primera?.mediaType === 'video' ? (
        <video
          controls
          preload="metadata"
          poster={c.portadaUrl ?? undefined}
          src={primera.url}
          className="aspect-[9/16] w-full rounded-md bg-black object-contain"
        />
      ) : primera ? (
        <div className="relative">
          {/* Las láminas se miran en su tamaño de verdad: van al almacén, no por el optimizador. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={primera.url} alt="" className="aspect-[4/5] w-full rounded-md bg-acero-800 object-cover" />
          {c.media.length > 1 ? (
            <span className="absolute right-2 top-2 rounded bg-acero-950/80 px-1.5 py-0.5 text-xs">{c.media.length} láminas</span>
          ) : null}
        </div>
      ) : null}
      {c.tipo === 'carrusel' && c.media.length > 1 ? (
        <div className="mt-2 flex gap-1.5 overflow-x-auto">
          {c.media.slice(1).map((m) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={m.url} src={m.url} alt="" className="h-14 w-11 shrink-0 rounded object-cover" />
          ))}
        </div>
      ) : null}

      <div className="mt-3 min-w-0 flex-1 space-y-2 text-sm">
        {porVencer ? (
          <p className="text-xs text-caution">
            Se borra el {new Intl.DateTimeFormat('es-CL', { dateStyle: 'medium', timeZone: zona }).format(porVencer)} si no lo programas.
          </p>
        ) : null}
        <p className="text-xs text-fg-faint">
          {c.estilo ? `Estilo: ${c.estilo}` : 'Sin estilo'}
          {c.duracionS ? ` · ${Math.round(c.duracionS)} s` : ''}
        </p>
        {otros.length > 0 ? (
          <p className="flex flex-wrap gap-1">
            {otros.map(([clave, valor]) => (
              <span key={clave} className="rounded bg-acero-800 px-1.5 py-0.5 text-[0.7rem] text-fg-muted">
                {clave}: {String(valor)}
              </span>
            ))}
          </p>
        ) : null}
        {c.tituloYoutube ? (
          <p>
            <span className="text-xs text-fg-faint">Título de YouTube:</span> {c.tituloYoutube}
          </p>
        ) : null}
        {c.texto ? (
          <details>
            <summary className="cursor-pointer text-xs text-fg-faint hover:text-fg">El texto</summary>
            <p className="mt-1 whitespace-pre-line text-fg-muted">{c.texto}</p>
          </details>
        ) : (
          <p className="text-xs text-fg-faint">Sin texto</p>
        )}
      </div>

      <AccionesDelCreativo id={c.id} />
    </li>
  )
}
