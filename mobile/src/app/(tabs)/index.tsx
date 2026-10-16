import { useCallback, useState } from 'react'
import { Alert, Pressable, Text, View } from 'react-native'
import { useFocusEffect, useRouter } from 'expo-router'
import { CorteProgramado } from '../../components/corte-programado'
import { IconoPoner } from '../../components/iconos'
import { Grilla, RotuloDia } from '../../components/parrilla'
import { useSelectorFecha } from '../../components/selector-fecha'
import { Boton, COLORES, Cargando, ErrorConReintento, Pantalla, Sello, TIPO_TITULO, Tarjeta } from '../../components/ui'
import { cuandoQuemado, diasDeLaAgenda, marcaDeToque, pieDeAyer, rotuloDelDia, seQuemo, servidosAyer } from '../../lib/agenda'
import { RechazoApi, SesionCaducada, apiPost } from '../../lib/api'
import { anotarCambio } from '../../lib/cambios'
import { calorDelDia } from '../../lib/parrilla'
import { SIN_SENAL, etiquetaCuenta, proximaHoraEnPunto } from '../../lib/publicar'
import { clearToken } from '../../lib/session'
import { type Calendario } from '../../lib/tipos'
import { useScreenData } from '../../lib/useScreenData'
import { useToken } from '../../lib/useToken'

/** El día de hoy en el teléfono: solo para lo guardado antes de que la API mandara `hoy`. */
function hoyEnElTelefono(): string {
  const ahora = new Date()
  const mm = String(ahora.getMonth() + 1).padStart(2, '0')
  const dd = String(ahora.getDate()).padStart(2, '0')
  return `${ahora.getFullYear()}-${mm}-${dd}`
}

/**
 * La Parrilla, la entrada de la app como lo es del panel: arriba lo que se quemó, después lo
 * que viene día por día —con un «+» para prender cada uno— y al pie cuántos cortes salieron
 * ayer. Junta lo que antes repartían el Resumen («Qué salió hoy», «Qué viene») y el
 * Calendario.
 */
export default function LaParrilla() {
  const token = useToken()
  const router = useRouter()
  const salir = useCallback(async () => {
    await clearToken()
    router.replace('/login')
  }, [router])

  const { data, cargando, error, sello, refrescar, refrescarSiVieja } = useScreenData<Calendario>(
    'calendario',
    '/api/mobile/schedule',
    token,
    salir,
  )

  // Los diálogos de Android o la hoja de iOS para la hora nueva de «Reprogramar».
  const { abrir: abrirSelector, selector } = useSelectorFecha()
  // El destino que se está reprogramando: mientras viaja, los botones esperan.
  const [reprogramando, setReprogramando] = useState<string | null>(null)

  // Al volver a esta pestaña: si Publicar acaba de crear un post, o la caché ya es vieja,
  // refresca sola. Es lo que hace aparecer el post recién programado.
  useFocusEffect(refrescarSiVieja)

  if (!data && cargando) return <Cargando />
  if (!data) {
    return (
      <Pantalla refrescando={cargando} onRefrescar={refrescar}>
        <ErrorConReintento mensaje={error ?? 'No se pudo cargar.'} onReintentar={refrescar} />
      </Pantalla>
    )
  }

  const hoy = data.hoy ?? hoyEnElTelefono()
  const quemados = seQuemo(data.posts)

  /**
   * «Reprogramar» un destino quemado: se elige la hora nueva y el servidor aplica la regla
   * del panel —el post entero pasa a esa hora y el destino vuelve a la cola—.
   */
  function reprogramar(destino: string) {
    abrirSelector(proximaHoraEnPunto(new Date()), async (cuando) => {
      if (!token) return
      setReprogramando(destino)
      try {
        await apiPost('/api/mobile/schedule/reprogramar', token, { destino, cuando: cuando.toISOString() })
        anotarCambio()
        await refrescar()
      } catch (e) {
        if (e instanceof SesionCaducada) {
          await salir()
          return
        }
        Alert.alert('No se pudo reprogramar', e instanceof RechazoApi ? e.message : SIN_SENAL)
      } finally {
        setReprogramando(null)
      }
    })
  }

  function prender(dia: string) {
    router.navigate({ pathname: '/(tabs)/publicar', params: { dia, n: marcaDeToque() } })
  }

  return (
    <Pantalla refrescando={cargando} onRefrescar={refrescar}>
      <Text style={{ color: COLORES.suave, fontSize: 13 }}>lo que viene y cómo salió lo que ya se fue</Text>
      <Sello texto={sello} />

      {quemados.length > 0 ? (
        <View style={{ gap: 8 }}>
          <Text
            style={{
              color: COLORES.rojo,
              fontFamily: TIPO_TITULO,
              fontSize: 13,
              letterSpacing: 1.2,
              textTransform: 'uppercase',
            }}
          >
            Se quemó
          </Text>
          {quemados.map(({ post, destino }) => (
            <Tarjeta key={destino.id}>
              <Text style={{ color: COLORES.suave, fontSize: 12 }}>
                {cuandoQuemado(post.cuando, hoy)} · {etiquetaCuenta(destino)}
              </Text>
              <Text style={{ color: COLORES.texto, fontSize: 14 }} numberOfLines={2}>
                {post.texto || '(sin texto)'}
              </Text>
              {destino.error ? <Text style={{ color: COLORES.rojo, fontSize: 12 }}>{destino.error}</Text> : null}
              <View style={{ flexDirection: 'row', marginTop: 4 }}>
                <Boton
                  texto={reprogramando === destino.id ? 'Reprogramando…' : 'Reprogramar'}
                  onPress={() => reprogramar(destino.id)}
                  deshabilitado={reprogramando !== null}
                />
              </View>
            </Tarjeta>
          ))}
        </View>
      ) : null}

      {diasDeLaAgenda(data.posts, hoy).map(({ dia, posts }) => {
        const rotulo = rotuloDelDia(dia, hoy)
        return (
          <View key={dia}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <RotuloDia dia={rotulo} cortes={posts.length} />
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Programar el ${rotulo.replace('Hoy · ', '').replace('Mañana · ', '')}`}
                onPress={() => prender(dia)}
                hitSlop={6}
                style={({ pressed }) => ({
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: COLORES.tarjeta,
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <IconoPoner color={COLORES.texto} />
              </Pressable>
            </View>
            {posts.length === 0 ? (
              <Pressable onPress={() => prender(dia)} hitSlop={4} style={{ paddingVertical: 6 }}>
                <Text style={{ color: COLORES.brasa, fontSize: 14 }}>No hay nada puesto. Préndela.</Text>
              </Pressable>
            ) : (
              <Grilla calor={calorDelDia(posts.length)}>
                {posts.map((post) => (
                  <CorteProgramado key={post.id} post={post} />
                ))}
              </Grilla>
            )}
          </View>
        )
      })}

      <Text style={{ color: COLORES.suave, fontSize: 12, textAlign: 'center', marginTop: 8 }}>
        {pieDeAyer(servidosAyer(data.posts, hoy))}
      </Text>
      {selector}
    </Pantalla>
  )
}
