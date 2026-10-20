import { useCallback, useState } from 'react'
import { Alert, Pressable, Text, View } from 'react-native'
import { useFocusEffect, useRouter } from 'expo-router'
import { CorteProgramado } from '../../components/corte-programado'
import { IconoPoner } from '../../components/iconos'
import { Grilla, RotuloDia } from '../../components/parrilla'
import { Pieza } from '../../components/pieza'
import { useSelectorFecha } from '../../components/selector-fecha'
import { Boton, Cargando, ErrorConReintento, Pantalla, Sello, TIPO_TITULO, Tarjeta } from '../../components/ui'
import { useColores, useTema } from '../../components/tema'
import { cuandoQuemado, diasDeLaAgenda, marcaDeToque, pieDeAyer, rotuloDelDia, seQuemo, servidosAyer } from '../../lib/agenda'
import { RechazoApi, SesionCaducada, apiPost } from '../../lib/api'
import { detalleDelBorrador, rotuloBorradores } from '../../lib/borradores'
import { anotarCambio } from '../../lib/cambios'
import { calorDelDia, carneDe, coccionDe, selloPorEstado } from '../../lib/parrilla'
import { SIN_SENAL, etiquetaCuenta, proximaHoraEnPunto } from '../../lib/publicar'
import { clearToken } from '../../lib/session'
import { SE_QUEMO } from '../../lib/tema'
import { type BorradorResumido, type Calendario } from '../../lib/tipos'
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
 * Un borrador puesto en su día: con borde punteado y sin la carne del corte, porque todavía
 * no está en la parrilla, solo apartado para ese día. Como en el calendario del panel.
 */
function BorradorEnElDia({ borrador, onAbrir }: { borrador: BorradorResumido; onAbrir: () => void }) {
  const colores = useColores()
  return (
    <Pressable
      onPress={onAbrir}
      accessibilityRole="button"
      style={({ pressed }) => ({
        borderWidth: 1,
        borderStyle: 'dashed',
        borderColor: colores.velo + '4d',
        borderRadius: 6,
        padding: 10,
        gap: 4,
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <Text style={{ color: colores.suave, fontSize: 10, fontFamily: TIPO_TITULO, letterSpacing: 1 }}>
        BORRADOR · {borrador.cuando?.slice(11, 16)}
      </Text>
      <Text style={{ color: colores.suave, fontSize: 13 }} numberOfLines={2}>
        {borrador.texto || '(sin texto)'}
      </Text>
    </Pressable>
  )
}

/**
 * La Parrilla, la entrada de la app como lo es del panel: arriba lo que se quemó y los
 * borradores, después lo que viene día por día —con un «+» para prender cada uno— y al pie
 * cuántos cortes salieron ayer. Junta lo que antes repartían el Resumen («Qué salió hoy»,
 * «Qué viene») y el Calendario.
 */
export default function LaParrilla() {
  const colores = useColores()
  const { tema } = useTema()
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
  // La lista de borradores se abre con un toque, como «⋯ Más» en Los Números.
  const [verBorradores, setVerBorradores] = useState(false)

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
  const borradores = data.borradores ?? []

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

  // Los dos parámetros van siempre, uno vacío: así ninguno queda pegado de un toque anterior.
  function prender(dia: string) {
    router.navigate({ pathname: '/(tabs)/publicar', params: { dia, borrador: '', n: marcaDeToque() } })
  }

  function abrirBorrador(id: string) {
    router.navigate({ pathname: '/(tabs)/publicar', params: { dia: '', borrador: id, n: marcaDeToque() } })
  }

  return (
    <Pantalla refrescando={cargando} onRefrescar={refrescar}>
      <Text style={{ color: colores.suave, fontSize: 13 }}>lo que viene y cómo salió lo que ya se fue</Text>
      <Sello texto={sello} />

      {quemados.length > 0 ? (
        <View style={{ gap: 8 }}>
          <Text
            style={{
              color: colores.rojo,
              fontFamily: TIPO_TITULO,
              fontSize: 13,
              letterSpacing: 1.2,
              textTransform: 'uppercase',
            }}
          >
            {/* De día no se quema: se echa a perder, como en el panel. */}
            {SE_QUEMO[tema]}
          </Text>
          {quemados.map(({ post, destino }) => {
            // El corte entero, con todas sus marcas, como en el panel: se ve cuál se quemó y si
            // lo demás salió. Antes la tarjeta era solo texto, y el botón, del color de la
            // tarjeta, se leía como una palabra más.
            const estados = post.redes.map((r) => r.estado)
            return (
              <View
                key={destino.id}
                style={{
                  flexDirection: 'row',
                  gap: 12,
                  backgroundColor: colores.tarjeta,
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: colores.rojo + '99',
                  padding: 14,
                }}
              >
                <Pieza
                  formato={post.formato ?? 'bife'}
                  huesos={post.huesos ?? 0}
                  carne={carneDe(estados)}
                  coccion={coccionDe(estados)}
                  sellos={post.redes.map((r) => r.sello ?? selloPorEstado(r.estado, r.error))}
                />
                <View style={{ flex: 1, gap: 6 }}>
                  <Text style={{ color: colores.suave, fontSize: 12 }}>
                    {cuandoQuemado(post.cuando, hoy)} · {etiquetaCuenta(destino)}
                  </Text>
                  <Text style={{ color: colores.texto, fontSize: 14 }} numberOfLines={2}>
                    {post.texto || '(sin texto)'}
                  </Text>
                  {destino.error ? <Text style={{ color: colores.rojo, fontSize: 12 }}>{destino.error}</Text> : null}
                  <View style={{ flexDirection: 'row', marginTop: 2 }}>
                    {/* Secundario, como en el panel: el naranjo queda para el arreglo exacto. */}
                    <Boton
                      texto={reprogramando === destino.id ? 'Reprogramando…' : 'Reprogramar'}
                      onPress={() => reprogramar(destino.id)}
                      deshabilitado={reprogramando !== null}
                    />
                  </View>
                </View>
              </View>
            )
          })}
        </View>
      ) : null}

      {borradores.length > 0 ? (
        <View style={{ gap: 8 }}>
          <Pressable
            onPress={() => setVerBorradores(!verBorradores)}
            accessibilityRole="button"
            accessibilityState={{ expanded: verBorradores }}
            hitSlop={4}
            style={({ pressed }) => ({ minHeight: 44, justifyContent: 'center', opacity: pressed ? 0.7 : 1 })}
          >
            <Text style={{ color: colores.texto, fontSize: 14, fontWeight: '600' }}>
              {verBorradores ? '▾' : '▸'} {rotuloBorradores(borradores.length)}
            </Text>
          </Pressable>
          {verBorradores
            ? borradores.map((b) => (
                <Pressable
                  key={b.id}
                  onPress={() => abrirBorrador(b.id)}
                  accessibilityRole="button"
                  style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
                >
                  <Tarjeta>
                    <Text style={{ color: colores.texto, fontSize: 14 }} numberOfLines={2}>
                      {b.texto || '(sin texto)'}
                    </Text>
                    <Text style={{ color: colores.suave, fontSize: 12 }}>{detalleDelBorrador(b)}</Text>
                  </Tarjeta>
                </Pressable>
              ))
            : null}
        </View>
      ) : null}

      {diasDeLaAgenda(data.posts, hoy, borradores).map(({ dia, posts, borradores: delDia }) => {
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
                  backgroundColor: colores.tarjeta,
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <IconoPoner color={colores.texto} />
              </Pressable>
            </View>
            {posts.length === 0 && delDia.length === 0 ? (
              <Pressable onPress={() => prender(dia)} hitSlop={4} style={{ paddingVertical: 6 }}>
                <Text style={{ color: colores.brasa, fontSize: 14 }}>No hay nada puesto. Préndela.</Text>
              </Pressable>
            ) : (
              // Los borradores no cuentan para el calor: todavía no van a salir.
              <Grilla calor={calorDelDia(posts.length)}>
                {posts.map((post) => (
                  <CorteProgramado key={post.id} post={post} />
                ))}
                {delDia.map((b) => (
                  <BorradorEnElDia key={b.id} borrador={b} onAbrir={() => abrirBorrador(b.id)} />
                ))}
              </Grilla>
            )}
          </View>
        )
      })}

      <Text style={{ color: colores.suave, fontSize: 12, textAlign: 'center', marginTop: 8 }}>
        {pieDeAyer(servidosAyer(data.posts, hoy), tema)}
      </Text>
      {selector}
    </Pantalla>
  )
}
