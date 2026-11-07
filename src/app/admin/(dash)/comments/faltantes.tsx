import Image from 'next/image'
import type { PublicacionConFaltantes } from '@/lib/comentarios-cola'
import { fraseDeFaltantes } from '@/lib/social/comentarios/faltantes'

/**
 * El aviso de La Mesa cuando Instagram cuenta comentarios que no entregó (`faltantes.ts`). Va
 * aparte de la cola y no dentro de cada grupo: una publicación a la que Instagram le escondió
 * todo no tiene ningún comentario con el que aparecer en la cola.
 */
export function Faltantes({ publicaciones }: { publicaciones: PublicacionConFaltantes[] }) {
  if (publicaciones.length === 0) return null
  return (
    <section aria-label="Comentarios que Instagram no entrega" className="mb-6 rounded-lg border border-caution/40 bg-caution/10 p-4">
      <h2 className="text-sm font-medium text-fg">Comentarios que Instagram no entrega</h2>
      <ul className="mt-3 space-y-3">
        {publicaciones.map((p) => (
          <li key={p.id} className="flex items-start gap-3">
            {p.thumbnailUrl ? (
              <Image src={p.thumbnailUrl} alt="" width={40} height={40} unoptimized className="h-10 w-10 shrink-0 rounded-lg object-cover" />
            ) : null}
            <div className="min-w-0 text-[0.78rem]">
              {p.permalink ? (
                <a href={p.permalink} target="_blank" rel="noreferrer" className="hover:text-fg">
                  <p className="line-clamp-1 text-fg-muted">
                    {p.accountHandle ? `${p.accountHandle} · ` : ''}
                    {p.caption ?? '(sin texto)'}
                  </p>
                </a>
              ) : (
                <p className="line-clamp-1 text-fg-muted">
                  {p.accountHandle ? `${p.accountHandle} · ` : ''}
                  {p.caption ?? '(sin texto)'}
                </p>
              )}
              <p className="text-caution">{fraseDeFaltantes(p.contados, p.entregados)}</p>
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-[0.78rem] leading-relaxed text-fg-muted">
        Instagram a veces esconde el comentario que es solo una palabra, como «GUIA», y no se lo
        muestra ni a ti ni a Tu Parrilla: solo lo ve quien lo escribió. Si pediste una palabra
        clave, pide que la escriban dentro de una frase, o usa otra palabra en el próximo post.
        También puedes probar a apagar, en la app de Instagram, «Palabras ocultas» → «Ocultar
        comentarios» y el filtro avanzado de comentarios (en inglés, Hidden Words → «Hide
        comments» y «Advanced comment filtering»). Las respuestas que otras personas se dan entre
        ellas también suman en la cuenta de Instagram y aquí no aparecen: parte de la diferencia
        puede ser eso.
      </p>
    </section>
  )
}
