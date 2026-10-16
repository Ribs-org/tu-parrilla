import { Text, View } from 'react-native'
import { COLORES, TIPO_TITULO } from './ui'
import { Pieza } from './pieza'
import {
  bordeDe,
  carneDe,
  coccionDe,
  NOMBRE_COCCION,
  NOMBRE_FORMATO,
  QUEMO,
  selloPorEstado,
  type Borde,
  type Sello,
} from '../lib/parrilla'
import { etiquetaCuenta } from '../lib/publicar'
import type { PostProgramado } from '../lib/tipos'

/** La tarjeta es chapa, no carne: solo cambia de borde cuando necesita algo del dueño. */
const BORDE: Record<Borde, string> = {
  cuenta: 'rgba(255,255,255,0.07)',
  atencion: 'rgba(229,165,42,0.75)',
  mano: 'rgba(242,85,122,0.8)',
}

/** Cada destino, en palabras y con el mismo signo que su chip en el panel. */
const LINEA: Record<Sello, { color: string; signo: string; sufijo: string }> = {
  pendiente: { color: COLORES.texto, signo: '', sufijo: '' },
  saliendo: { color: COLORES.brasa, signo: '…', sufijo: ' · saliendo' },
  servido: { color: COLORES.verde, signo: '✓', sufijo: '' },
  bandeja: { color: COLORES.ambar, signo: '◐', sufijo: ' · en tu bandeja de TikTok' },
  reintento: { color: COLORES.ambar, signo: '↻', sufijo: ' · reintentando' },
  frio: { color: COLORES.ambar, signo: '!', sufijo: ' · reconéctala en el panel' },
  quemado: { color: QUEMO, signo: '✕', sufijo: '' },
}

/**
 * Un post programado: el corte dibujado a la izquierda (`Pieza`) y, al lado, en la chapa,
 * la hora, el texto, una línea por cuenta de destino —con su signo, y su error si falló o
 * reintenta— y el formato y la cocción en palabras. El texto ya no va encima de la carne:
 * sobre la cruda nueva no se leería.
 *
 * Un servidor de antes no manda `formato` ni `sello`: queda el bife, y el sello sale del
 * estado (`selloPorEstado`).
 */
export function CorteProgramado({ post }: { post: PostProgramado }) {
  const estados = post.redes.map((r) => r.estado)
  const coccion = coccionDe(estados)
  const sellos = post.redes.map((r) => r.sello ?? selloPorEstado(r.estado, r.error))
  const formato = post.formato ?? 'bife'
  return (
    <View
      style={{
        flexDirection: 'row',
        gap: 12,
        backgroundColor: COLORES.tarjeta,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: BORDE[bordeDe(coccion, sellos)],
        padding: 12,
      }}
    >
      <Pieza formato={formato} huesos={post.huesos ?? 0} carne={carneDe(estados)} coccion={coccion} sellos={sellos} />

      <View style={{ flex: 1, gap: 4 }}>
        <Text style={{ color: COLORES.texto, fontSize: 10, fontFamily: TIPO_TITULO, letterSpacing: 1 }}>
          {post.cuando.slice(11, 16)}
        </Text>

        <Text style={{ color: COLORES.texto, fontSize: 14 }} numberOfLines={2}>
          {post.texto || '(sin texto)'}
        </Text>

        <View style={{ gap: 2, marginTop: 2 }}>
          {post.redes.map((r, i) => {
            const linea = LINEA[sellos[i]!]
            return (
              <Text
                // `r.id` es el destino, no la red: con dos cuentas de la misma red, `r.red` se
                // repite dentro de un post.
                key={r.id}
                style={{ color: linea.color, fontSize: 12 }}
                numberOfLines={2}
              >
                {linea.signo ? `${linea.signo} ` : ''}
                {etiquetaCuenta(r)}
                {linea.sufijo}
                {r.error ? ` — ${r.error}` : ''}
              </Text>
            )
          })}
        </View>

        {/* Lo que el dibujo dice, en palabras: el color nunca es la única señal. */}
        <Text
          style={{
            color: COLORES.suave,
            fontSize: 10,
            fontFamily: TIPO_TITULO,
            textTransform: 'uppercase',
            letterSpacing: 1,
          }}
        >
          {NOMBRE_FORMATO[formato]} · {NOMBRE_COCCION[coccion]}
        </Text>
      </View>
    </View>
  )
}
