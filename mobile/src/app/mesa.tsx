import { useState } from 'react'
import { ActivityIndicator, KeyboardAvoidingView, Platform, RefreshControl, ScrollView, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { GrupoDeLaMesa } from '../components/mesa'
import { useSesion } from '../components/sesion'
import { useColores } from '../components/tema'
import { Chip, ErrorConReintento, Sello, Vacio } from '../components/ui'
import {
  ESTADOS_DE_LA_MESA,
  MESA_SIN_SERVIDOR,
  SUBTITULO_DE_LA_MESA,
  fraseColaVacia,
  frasePendientes,
  pedidoDeLaMesa,
  type EstadoDeLaMesa,
  type LaMesa,
} from '../lib/mesa'
import { NOMBRE_RED } from '../lib/tipos'
import { useAhora } from '../lib/useAhora'
import { useScreenData } from '../lib/useScreenData'

// Como en Publicar: el teclado se mide desde la pantalla y en medio está la cabecera.
const ALTO_CABECERA = Platform.OS === 'ios' ? 44 : 56

/**
 * La Mesa en el teléfono: los comentarios de Instagram, Facebook y YouTube, agrupados por
 * publicación, con el borrador de la IA listo para corregir y mandar. Se abre desde La Parrilla. Lo
 * esencial del panel: «Pendientes», «Enviados» y «Automáticas», el filtro por red, y en cada
 * comentario «Enviar», «Descartar» y pedir otro borrador. Las instrucciones del modelo, «Regenerar
 * todos», «Descartados», «Todos» y los emojis se quedan en el panel; el teclado del teléfono ya trae
 * emojis.
 */
export default function PantallaDeLaMesa() {
  const colores = useColores()
  const insets = useSafeAreaInsets()
  const { token, salir } = useSesion()
  const [estado, setEstado] = useState<EstadoDeLaMesa>('pendientes')
  const [red, setRed] = useState<string | null>(null)
  const ahora = useAhora()
  const pedido = pedidoDeLaMesa(estado, red)
  const { data, cargando, error: fallo, sinRuta, sello, refrescar } = useScreenData<LaMesa>(pedido.clave, pedido.ruta, token, salir)
  // Contra un servidor de antes, que no tiene la ruta, lo dice claro en vez de «No se pudo actualizar.».
  const error = sinRuta ? MESA_SIN_SERVIDOR : fallo

  // Las redes de este dueño (Threads, solo en la cuenta del revisor) las dice el servidor. Se
  // guardan las últimas que dijo: al cambiar de filtro, mientras llega el nuevo, siguen a la vista.
  const [redes, setRedes] = useState<string[]>([])
  if (data && data.redes.join() !== redes.join()) setRedes(data.redes)

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={insets.top + ALTO_CABECERA}
      style={{ flex: 1, backgroundColor: colores.fondo }}
    >
      <ScrollView
        style={{ flex: 1, backgroundColor: colores.fondo }}
        contentContainerStyle={{ padding: 16, paddingBottom: 48, gap: 12 }}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={cargando && data !== null} onRefresh={() => void refrescar()} tintColor={colores.suave} />}
      >
        <Text style={{ color: colores.suave, fontSize: 13 }}>{SUBTITULO_DE_LA_MESA}</Text>
        {data ? <Text style={{ color: colores.texto, fontSize: 15 }}>{frasePendientes(data.pendientes)}</Text> : null}

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
          {ESTADOS_DE_LA_MESA.map((e) => (
            <Chip key={e.estado} texto={e.texto} activo={estado === e.estado} onPress={() => setEstado(e.estado)} />
          ))}
        </ScrollView>
        {redes.length > 1 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
            <Chip texto="Todas" activo={red === null} onPress={() => setRed(null)} />
            {redes.map((r) => (
              <Chip key={r} texto={NOMBRE_RED[r] ?? r} activo={red === r} onPress={() => setRed(r)} />
            ))}
          </ScrollView>
        ) : null}
        <Sello texto={sello} />

        {!data && cargando ? (
          <ActivityIndicator color={colores.suave} style={{ marginTop: 24 }} />
        ) : !data ? (
          <ErrorConReintento mensaje={error ?? 'No se pudo cargar.'} onReintentar={() => void refrescar()} />
        ) : (
          <>
            {error ? <Text style={{ color: colores.tenue, fontSize: 12 }}>{error}</Text> : null}
            {data.publicaciones.length === 0 ? (
              <Vacio texto={fraseColaVacia(estado === 'pendientes')} />
            ) : (
              data.publicaciones.map((p) => (
                <GrupoDeLaMesa key={`${p.red}:${p.id}`} publicacion={p} token={token} salir={salir} alCambiar={refrescar} ahora={ahora} />
              ))
            )}
          </>
        )}

        <View style={{ marginTop: 8 }}>
          <Text style={{ color: colores.tenue, fontSize: 12, textAlign: 'center', lineHeight: 18 }}>
            Las instrucciones para el modelo, «Regenerar todos» y los descartados están en La Mesa del panel web.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
