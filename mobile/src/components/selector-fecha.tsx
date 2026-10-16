import { useState, type ReactNode } from 'react'
import { Modal, Platform, Pressable, Text, View } from 'react-native'
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Boton, COLORES, TIPO_TITULO } from './ui'

/**
 * El día y la hora en el iPhone. Android trae dos diálogos del sistema, uno detrás del otro
 * (ver `useSelectorFecha`), que en iOS no existen: acá el selector nativo, con el calendario
 * y la hora juntos, va en una hoja que sube desde abajo. Lo elegido se aplica solo con
 * «Listo»; «Cancelar», o tocar fuera de la hoja, deja la fecha como estaba.
 *
 * Quien la usa la monta al abrirla y la desmonta al cerrarla, así que el borrador arranca
 * siempre en la fecha vigente sin un efecto que lo sincronice.
 */
export function SelectorFechaIOS({
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
  const [borrador, setBorrador] = useState(valor)
  const insets = useSafeAreaInsets()

  return (
    <Modal transparent animationType="slide" onRequestClose={onCancelar}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Cerrar sin cambiar la fecha"
        onPress={onCancelar}
        style={{ flex: 1, backgroundColor: '#000000aa' }}
      />
      <View
        style={{
          backgroundColor: COLORES.tarjeta,
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          padding: 16,
          paddingBottom: 16 + insets.bottom,
          gap: 12,
        }}
      >
        <Text
          style={{
            color: COLORES.texto,
            fontFamily: TIPO_TITULO,
            fontSize: 16,
            letterSpacing: 1,
            textTransform: 'uppercase',
          }}
        >
          Cuándo sale
        </Text>
        <DateTimePicker
          value={borrador}
          mode="datetime"
          display="inline"
          minimumDate={minimo}
          locale="es-CL"
          themeVariant="dark"
          accentColor={COLORES.brasa}
          onValueChange={(_evento, fecha) => setBorrador(fecha)}
        />
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Boton texto="Cancelar" onPress={onCancelar} />
          <Boton texto="Listo" onPress={() => onListo(borrador)} destacado />
        </View>
      </View>
    </Modal>
  )
}

type Pedido = { valor: Date; alElegir: (fecha: Date) => void }

/**
 * Elegir día y hora, igual en las dos plataformas para quien lo usa: `abrir(valor, alElegir)`
 * y montar `selector` en algún lado de la pantalla. En Android abre los dos diálogos del
 * sistema, primero el día y luego la hora (`onValueChange` solo se dispara al confirmar:
 * cancelar no llama a nada), y `selector` es null; en iOS monta la hoja de arriba.
 */
export function useSelectorFecha(): { abrir: (valor: Date, alElegir: (fecha: Date) => void) => void; selector: ReactNode } {
  const [pedido, setPedido] = useState<Pedido | null>(null)

  function abrir(valor: Date, alElegir: (fecha: Date) => void) {
    if (Platform.OS === 'ios') {
      setPedido({ valor, alElegir })
      return
    }
    DateTimePickerAndroid.open({
      value: valor,
      mode: 'date',
      minimumDate: new Date(),
      onValueChange: (_evento, dia) => {
        if (!dia) return
        DateTimePickerAndroid.open({
          value: dia,
          mode: 'time',
          is24Hour: true,
          onValueChange: (_evento2, conHora) => {
            if (conHora) alElegir(conHora)
          },
        })
      },
    })
  }

  const selector = pedido ? (
    <SelectorFechaIOS
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
