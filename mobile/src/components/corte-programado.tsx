import { Text, View } from 'react-native'
import { TIPO_TITULO } from './ui'
import type { Colores } from './colores'
import { useColores } from './tema'
import { Pieza } from './pieza'
import {
  bordeDe,
  carneDe,
  coccionDe,
  NOMBRE_COCCION,
  NOMBRE_FORMATO,
  selloPorEstado,
  type Borde,
  type Sello,
} from '../lib/parrilla'
import { etiquetaCuenta } from '../lib/publicar'
import type { PostProgramado } from '../lib/tipos'

/** La tarjeta es chapa, no carne: solo cambia de borde cuando necesita algo del dueño. */
function colorDelBorde(borde: Borde, colores: Colores): string {
  if (borde === 'atencion') return 'rgba(229,165,42,0.75)'
  if (borde === 'mano') return 'rgba(242,85,122,0.8)'
  return `${colores.velo}12`
}

/** Cada destino, en palabras y con el mismo signo que su chip en el panel. */
function lineaDe(sello: Sello, colores: Colores): { color: string; signo: string; sufijo: string } {
  switch (sello) {
    case 'saliendo':
      return { color: colores.brasa, signo: '…', sufijo: ' · saliendo' }
    case 'servido':
      return { color: colores.verde, signo: '✓', sufijo: '' }
    case 'bandeja':
      return { color: colores.ambar, signo: '◐', sufijo: ' · en tu bandeja de TikTok' }
    case 'reintento':
      return { color: colores.ambar, signo: '↻', sufijo: ' · reintentando' }
    case 'frio':
      return { color: colores.ambar, signo: '!', sufijo: ' · reconéctala en el panel' }
    case 'quemado':
      // El rojo del texto del modo: de noche es el del halo; de día, uno más hondo que pasa 4,5:1.
      return { color: colores.rojo, signo: '✕', sufijo: '' }
    default:
      return { color: colores.texto, signo: '', sufijo: '' }
  }
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
  const colores = useColores()
  const estados = post.redes.map((r) => r.estado)
  const coccion = coccionDe(estados)
  const sellos = post.redes.map((r) => r.sello ?? selloPorEstado(r.estado, r.error))
  const formato = post.formato ?? 'bife'
  return (
    <View
      style={{
        flexDirection: 'row',
        gap: 12,
        backgroundColor: colores.tarjeta,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colorDelBorde(bordeDe(coccion, sellos), colores),
        padding: 12,
      }}
    >
      <Pieza formato={formato} huesos={post.huesos ?? 0} carne={carneDe(estados)} coccion={coccion} sellos={sellos} />

      <View style={{ flex: 1, gap: 4 }}>
        <Text style={{ color: colores.texto, fontSize: 10, fontFamily: TIPO_TITULO, letterSpacing: 1 }}>
          {post.cuando.slice(11, 16)}
        </Text>

        <Text style={{ color: colores.texto, fontSize: 14 }} numberOfLines={2}>
          {post.texto || '(sin texto)'}
        </Text>

        <View style={{ gap: 2, marginTop: 2 }}>
          {post.redes.map((r, i) => {
            const linea = lineaDe(sellos[i]!, colores)
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
            color: colores.suave,
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
