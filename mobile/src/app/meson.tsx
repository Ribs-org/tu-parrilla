import { useState } from 'react'
import { ActivityIndicator, KeyboardAvoidingView, Platform, RefreshControl, ScrollView, Text, View } from 'react-native'
import { Stack, useLocalSearchParams, useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { TarjetaDelCreativo } from '../components/meson'
import { useSesion } from '../components/sesion'
import { useColores, useTema } from '../components/tema'
import { BotonTexto, ErrorConReintento, Sello, TIPO_TITULO, Vacio } from '../components/ui'
import { marcaDeToque } from '../lib/agenda'
import { RechazoApi, SesionCaducada, apiPost } from '../lib/api'
import {
  COMO_SE_PROGRAMA,
  MESON_SIN_SERVIDOR,
  MESON_VACIO,
  QUE_ES_EL_MESON,
  VER_TODO,
  fraseEnBorradores,
  rotuloDePieza,
  rutaDelMeson,
  type ElMeson,
} from '../lib/meson'
import { SIN_SENAL } from '../lib/publicar'
import { LA_PARRILLA, MESON } from '../lib/tema'
import { useScreenData } from '../lib/useScreenData'

const ALTO_CABECERA = Platform.OS === 'ios' ? 44 : 56
const FECHA = new Intl.DateTimeFormat('es-CL', { day: 'numeric', month: 'short' })

/**
 * El mesón (de día, la bandeja) en el teléfono, desde la 1.2.0: lo que el chef entregó, por comanda y
 * por pieza, como la página del panel. Se abre desde «Tus comandas» de La Cocina, con `comanda` para
 * ver solo lo de esa. Cada creativo se ve ahí mismo —el video con `expo-video`, o las láminas— y se
 * programa (pasa a un borrador que se abre en Publicar) o se descarta con su motivo.
 *
 * Usa `expo-video` (por `components/meson.tsx`): **no se copia a la rama `ota-1.1.0`**.
 */
export default function PantallaDelMeson() {
  const colores = useColores()
  const { tema } = useTema()
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const { token, salir } = useSesion()
  const { comanda } = useLocalSearchParams<{ comanda?: string }>()
  const [soloUna, setSoloUna] = useState<string | null>(comanda || null)
  const ruta = rutaDelMeson(soloUna)
  const { data, cargando, error: fallo, sinRuta, sello, refrescar } = useScreenData<ElMeson>(`meson:${soloUna ?? ''}`, ruta, token, salir)
  const error = sinRuta ? MESON_SIN_SERVIDOR[tema] : fallo
  const enBorradores = data ? fraseEnBorradores(data.enBorradores, LA_PARRILLA[tema]) : null

  /** Lo de cada botón: la frase del error, o null si salió. */
  async function pedir(camino: string, cuerpo: unknown): Promise<{ borradorId?: string } | string> {
    if (!token) return SIN_SENAL
    try {
      return await apiPost<{ borradorId?: string }>(camino, token, cuerpo)
    } catch (e) {
      if (e instanceof SesionCaducada) {
        await salir()
        return SIN_SENAL
      }
      return e instanceof RechazoApi ? e.message : SIN_SENAL
    }
  }

  async function programar(id: string): Promise<string | null> {
    const r = await pedir(`/api/mobile/cocina/creativos/${encodeURIComponent(id)}/programar`, {})
    if (typeof r === 'string') return r
    void refrescar()
    // Publicar lo abre como cualquier borrador de La Parrilla.
    if (r.borradorId) router.navigate({ pathname: '/(tabs)/publicar', params: { dia: '', borrador: r.borradorId, n: marcaDeToque() } })
    return null
  }

  async function descartar(id: string, motivo: string, nota: string): Promise<string | null> {
    const r = await pedir(`/api/mobile/cocina/creativos/${encodeURIComponent(id)}/descartar`, { motivo, nota })
    if (typeof r === 'string') return r
    await refrescar()
    return null
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={insets.top + ALTO_CABECERA}
      style={{ flex: 1, backgroundColor: colores.fondo }}
    >
      <Stack.Screen options={{ title: MESON[tema] }} />
      <ScrollView
        style={{ flex: 1, backgroundColor: colores.fondo }}
        contentContainerStyle={{ padding: 16, paddingBottom: 48, gap: 12 }}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={cargando && data !== null} onRefresh={() => void refrescar()} tintColor={colores.suave} />}
      >
        <Text style={{ color: colores.suave, fontSize: 13, lineHeight: 19 }}>{QUE_ES_EL_MESON}</Text>
        <Text style={{ color: colores.tenue, fontSize: 12, lineHeight: 17 }}>{COMO_SE_PROGRAMA}</Text>
        {soloUna ? (
          <View style={{ alignItems: 'flex-start' }}>
            <BotonTexto texto={VER_TODO[tema]} onPress={() => setSoloUna(null)} />
          </View>
        ) : null}
        {enBorradores ? <Text style={{ color: colores.suave, fontSize: 13 }}>{enBorradores}</Text> : null}
        <Sello texto={sello} />

        {!data && cargando ? (
          <ActivityIndicator color={colores.suave} style={{ marginTop: 24 }} />
        ) : !data ? (
          <ErrorConReintento mensaje={error ?? 'No se pudo cargar.'} onReintentar={() => void refrescar()} />
        ) : (
          <>
            {error ? <Text style={{ color: colores.tenue, fontSize: 12 }}>{error}</Text> : null}
            {data.comandas.length === 0 ? (
              <Vacio texto={MESON_VACIO[tema]} />
            ) : (
              data.comandas.map((c) => (
                <View key={c.id} style={{ gap: 10 }}>
                  <View>
                    <Text style={{ color: colores.texto, fontFamily: TIPO_TITULO, fontSize: 16, letterSpacing: 0.4 }}>
                      {c.principal ?? 'Comanda sin plato principal'}
                    </Text>
                    <Text style={{ color: colores.tenue, fontSize: 12 }}>Pedida el {FECHA.format(new Date(c.creadaEn))}</Text>
                  </View>
                  {c.piezas.map((p) => (
                    <View key={p.pieza ?? p.creativos[0]!.id} style={{ gap: 8 }}>
                      {rotuloDePieza(p.pieza, p.creativos.length) ? (
                        <Text style={{ color: colores.tenue, fontSize: 12 }}>{rotuloDePieza(p.pieza, p.creativos.length)}</Text>
                      ) : null}
                      {p.creativos.map((cr) => (
                        <TarjetaDelCreativo
                          key={cr.id}
                          creativo={cr}
                          motivos={data.motivos}
                          maxNota={data.maxNota}
                          onProgramar={programar}
                          onDescartar={descartar}
                        />
                      ))}
                    </View>
                  ))}
                </View>
              ))
            )}
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
