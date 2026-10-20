import { Text, View } from 'react-native'
import { TIPO_TITULO } from './ui'
import { colorDeRed, type Colores } from './colores'
import { useColores, useTema } from './tema'
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
              // `r.id` es el destino, no la red: con dos cuentas de la misma red, `r.red` se
              // repite dentro de un post. El punto es la red en su color, como el ícono del panel;
              // el estado sigue en el signo y en el color del texto.
              <View key={r.id} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 6 }}>
                <View style={{ width: 7, height: 7, borderRadius: 4, marginTop: 5, backgroundColor: colorDeRed(colores, r.red) }} />
                <Text style={{ flex: 1, color: linea.color, fontSize: 12 }} numberOfLines={2}>
                  {linea.signo ? `${linea.signo} ` : ''}
                  {etiquetaCuenta(r)}
                  {linea.sufijo}
                  {r.error ? ` — ${r.error}` : ''}
                </Text>
              </View>
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

/**
 * Un post que ya salió en todas sus redes: deja la chapa y se hunde, como en la semana del panel
 * (`servidoEnTodas`). Un renglón —el corte en chico y apagado, la hora, el punto de cada red, un
 * «✓» y el texto—, sin borde y sobre un fondo más hondo que la tarjeta: de noche el fondo, de día
 * un tostado, porque el fondo del día es casi tan claro como la tarjeta. Con decenas al día, lo
 * de la mañana en tarjetas enteras empujaba lo que viene media pantalla hacia abajo.
 */
export function CorteServido({ post }: { post: PostProgramado }) {
  const colores = useColores()
  const { tema } = useTema()
  const estados = post.redes.map((r) => r.estado)
  const sellos = post.redes.map((r) => r.sello ?? selloPorEstado(r.estado, r.error))
  const hora = post.cuando.slice(11, 16)
  const texto = post.texto || '(sin texto)'
  return (
    <View
      accessible
      accessibilityLabel={`${hora} · ${texto} · ${post.redes.map((r) => `${etiquetaCuenta(r)}: publicado`).join(', ')}`}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        borderRadius: 8,
        paddingVertical: 3,
        paddingHorizontal: 6,
        backgroundColor: tema === 'dia' ? `${colores.acero}b3` : `${colores.fondo}bf`,
      }}
    >
      {/* La pieza a menos de la mitad: el lienzo mide 83 × 54 y aquí caben 37 × 24. */}
      <View style={{ width: 38, height: 24, overflow: 'hidden', opacity: 0.55 }}>
        <View style={{ transform: [{ scale: 0.45 }], transformOrigin: 'top left' }}>
          <Pieza formato={post.formato ?? 'bife'} huesos={post.huesos ?? 0} carne={carneDe(estados)} coccion={coccionDe(estados)} sellos={sellos} />
        </View>
      </View>
      <Text style={{ color: colores.suave, fontSize: 11, fontFamily: TIPO_TITULO, letterSpacing: 1 }}>{hora}</Text>
      <View style={{ flexDirection: 'row', gap: 3 }}>
        {post.redes.map((r) => (
          <View key={r.id} style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: colorDeRed(colores, r.red) }} />
        ))}
      </View>
      <Text style={{ color: colores.verde, fontSize: 12 }}>✓</Text>
      <Text style={{ flex: 1, color: colores.suave, fontSize: 13 }} numberOfLines={1}>
        {texto}
      </Text>
    </View>
  )
}
