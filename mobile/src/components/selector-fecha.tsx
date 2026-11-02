import { useState, type ReactNode } from 'react'
import { Modal, Pressable, ScrollView, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import {
  CABECERA_DE_SEMANA,
  armar,
  diaDe,
  diaEnPalabras,
  dosCifras,
  mesDe,
  minutosOfrecidos,
  nombreDelMes,
  semanasDelMes,
  sumarMeses,
} from '../lib/calendario'
import { Boton, Chip, TIPO_TITULO } from './ui'
import { useColores } from './tema'

const HORAS = Array.from({ length: 24 }, (_, h) => h)

/**
 * El día y la hora, en una hoja que sube desde abajo: «Cuándo sale», el mes, y debajo la hora y
 * los minutos en dos filas que se deslizan de lado. Lo elegido se aplica solo con «Listo»;
 * «Cancelar», tocar fuera de la hoja o el botón Atrás dejan la fecha como estaba.
 *
 * Antes eran los selectores del sistema: dos diálogos de Android, uno detrás del otro, o la rueda
 * de iOS. Los dibujaba el teléfono, con sus colores —oscuros también de día— y su idioma. Esta es
 * de la app y llega por aire: es un `Modal` de react-native, sin nada nativo nuevo.
 *
 * Lo que ya pasó no se puede elegir: los días de antes de hoy están apagados, y hoy, las horas y
 * los minutos que ya pasaron. «Listo» se apaga si la fecha que venía ya pasó y no se cambió.
 *
 * Quien la usa la monta al abrirla y la desmonta al cerrarla, así que arranca siempre en la fecha
 * vigente sin un efecto que la sincronice.
 */
export function SelectorFecha({
  valor,
  minimo,
  onListo,
  onCancelar,
}: {
  valor: Date
  minimo: Date
  onListo: (fecha: Date) => void
  onCancelar: () => void
}) {
  const colores = useColores()
  const insets = useSafeAreaInsets()
  const hoy = diaDe(minimo)
  const [dia, setDia] = useState(diaDe(valor) < hoy ? hoy : diaDe(valor))
  const [mes, setMes] = useState(mesDe(dia))
  const [hora, setHora] = useState(valor.getHours())
  const [minuto, setMinuto] = useState(valor.getMinutes())
  const elegida = armar(dia, hora, minuto)
  const valida = elegida.getTime() > minimo.getTime()
  const yaPaso = (h: number, m: number) => armar(dia, h, m).getTime() <= minimo.getTime()

  return (
    <Modal transparent animationType="slide" statusBarTranslucent onRequestClose={onCancelar}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Cerrar sin cambiar la fecha"
        onPress={onCancelar}
        style={{ flex: 1, backgroundColor: '#000000aa' }}
      />
      <View
        accessibilityViewIsModal
        style={{
          backgroundColor: colores.tarjeta,
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          borderTopWidth: 3,
          borderTopColor: colores.brasa,
          padding: 16,
          paddingBottom: 16 + insets.bottom,
          gap: 12,
        }}
      >
        <Text
          accessibilityRole="header"
          style={{ color: colores.texto, fontFamily: TIPO_TITULO, fontSize: 16, letterSpacing: 1, textTransform: 'uppercase' }}
        >
          Cuándo sale
        </Text>

        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Flecha texto="‹" etiqueta="Mes anterior" deshabilitado={mes <= mesDe(hoy)} onPress={() => setMes(sumarMeses(mes, -1))} />
          <Text
            accessibilityLiveRegion="polite"
            style={{ flex: 1, textAlign: 'center', color: colores.texto, fontFamily: TIPO_TITULO, fontSize: 14, textTransform: 'uppercase', letterSpacing: 0.8 }}
          >
            {nombreDelMes(mes)}
          </Text>
          <Flecha texto="›" etiqueta="Mes siguiente" onPress={() => setMes(sumarMeses(mes, 1))} />
        </View>

        <View style={{ gap: 4 }}>
          <View style={{ flexDirection: 'row' }}>
            {CABECERA_DE_SEMANA.map((d) => (
              <Text key={d} style={{ flex: 1, textAlign: 'center', color: colores.tenue, fontSize: 11, fontFamily: TIPO_TITULO, textTransform: 'uppercase' }}>
                {d}
              </Text>
            ))}
          </View>
          {semanasDelMes(mes).map((semana) => (
            <View key={semana[0]} style={{ flexDirection: 'row', gap: 4 }}>
              {semana.map((d) => {
                const pasado = d < hoy
                const elegido = d === dia
                return (
                  <Pressable
                    key={d}
                    disabled={pasado}
                    onPress={() => {
                      setDia(d)
                      setMes(mesDe(d))
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={diaEnPalabras(d)}
                    accessibilityState={{ selected: elegido, disabled: pasado }}
                    style={({ pressed }) => ({
                      flex: 1,
                      height: 40,
                      alignItems: 'center',
                      justifyContent: 'center',
                      // El elegido es un corte, como en el panel: las cuatro esquinas distintas.
                      borderTopLeftRadius: elegido ? 9 : 8,
                      borderTopRightRadius: elegido ? 3 : 8,
                      borderBottomRightRadius: elegido ? 10 : 8,
                      borderBottomLeftRadius: elegido ? 4 : 8,
                      backgroundColor: elegido ? colores.brasa : pressed ? colores.velo + '14' : 'transparent',
                      borderWidth: d === hoy && !elegido ? 1 : 0,
                      borderColor: colores.brasa,
                      opacity: pasado ? 0.25 : 1,
                    })}
                  >
                    <Text
                      style={{
                        color: elegido ? colores.fondo : mesDe(d) === mes ? colores.texto : colores.tenue,
                        fontWeight: elegido ? '700' : '400',
                        fontSize: 14,
                        fontVariant: ['tabular-nums'],
                      }}
                    >
                      {Number(d.slice(8))}
                    </Text>
                  </Pressable>
                )
              })}
            </View>
          ))}
        </View>

        <Fila titulo="Hora">
          {HORAS.map((h) => (
            <Chip
              key={h}
              texto={dosCifras(h)}
              activo={h === hora}
              deshabilitado={yaPaso(h, 59)}
              onPress={() => {
                setHora(h)
                // Si con esa hora el minuto elegido ya pasó, el primero que no.
                if (yaPaso(h, minuto)) setMinuto(minutosOfrecidos(minuto).find((m) => !yaPaso(h, m)) ?? minuto)
              }}
            />
          ))}
        </Fila>
        <Fila titulo="Minutos">
          {minutosOfrecidos(minuto).map((m) => (
            <Chip key={m} texto={`:${dosCifras(m)}`} activo={m === minuto} deshabilitado={yaPaso(hora, m)} onPress={() => setMinuto(m)} />
          ))}
        </Fila>

        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Boton texto="Cancelar" onPress={onCancelar} />
          <Boton texto="Listo" onPress={() => onListo(elegida)} destacado deshabilitado={!valida} />
        </View>
      </View>
    </Modal>
  )
}

function Flecha({ texto, etiqueta, onPress, deshabilitado }: { texto: string; etiqueta: string; onPress: () => void; deshabilitado?: boolean }) {
  const colores = useColores()
  return (
    <Pressable
      onPress={onPress}
      disabled={deshabilitado}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={etiqueta}
      style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center', opacity: deshabilitado ? 0.3 : 1 }}
    >
      <Text style={{ color: colores.texto, fontSize: 24 }}>{texto}</Text>
    </Pressable>
  )
}

/** Una fila de fichas que se desliza de lado, con su rótulo. */
function Fila({ titulo, children }: { titulo: string; children: ReactNode }) {
  const colores = useColores()
  return (
    <View style={{ gap: 6 }}>
      <Text style={{ color: colores.tenue, fontSize: 11, fontFamily: TIPO_TITULO, letterSpacing: 1.2, textTransform: 'uppercase' }}>{titulo}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
        {children}
      </ScrollView>
    </View>
  )
}

type Pedido = { valor: Date; alElegir: (fecha: Date) => void }

/**
 * Elegir día y hora: `abrir(valor, alElegir)` y montar `selector` en algún lado de la pantalla.
 * Cancelar no llama a nada.
 */
export function useSelectorFecha(): { abrir: (valor: Date, alElegir: (fecha: Date) => void) => void; selector: ReactNode } {
  const [pedido, setPedido] = useState<Pedido | null>(null)

  function abrir(valor: Date, alElegir: (fecha: Date) => void) {
    setPedido({ valor, alElegir })
  }

  const selector = pedido ? (
    <SelectorFecha
      valor={pedido.valor}
      minimo={new Date()}
      onListo={(fecha) => {
        pedido.alElegir(fecha)
        setPedido(null)
      }}
      onCancelar={() => setPedido(null)}
    />
  ) : null

  return { abrir, selector }
}
