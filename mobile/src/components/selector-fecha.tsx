import { useState } from 'react'
import { Modal, Pressable, Text, View } from 'react-native'
import DateTimePicker from '@react-native-community/datetimepicker'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Boton, COLORES, TIPO_TITULO } from './ui'

/**
 * El día y la hora en el iPhone. Android trae dos diálogos del sistema, uno detrás del otro
 * (`DateTimePickerAndroid` en Publicar), que en iOS no existen: acá el selector nativo, con
 * el calendario y la hora juntos, va en una hoja que sube desde abajo. Lo elegido se aplica
 * solo con «Listo»; «Cancelar», o tocar fuera de la hoja, deja la fecha como estaba.
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
