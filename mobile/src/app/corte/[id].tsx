import { useCallback, useEffect, useRef, useState } from 'react'
import { RefreshControl, ScrollView, Text, View } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Llama } from '../../components/llama'
import { Pieza } from '../../components/pieza'
import { useSesion } from '../../components/sesion'
import { useColores } from '../../components/tema'
import { Boton, Cargando, Etiqueta, Tarjeta } from '../../components/ui'
import { RechazoApi, SesionCaducada, apiGet, apiPost } from '../../lib/api'
import { anotarCambio } from '../../lib/cambios'
import { num, shortDate } from '../../lib/format'
import { fraseDelNuevo, renglonDelHito, totalDe, tituloDelNuevo, type DetalleDelCorte, type RedDelCorte } from '../../lib/lo-que-trajo'
import { ponerNumero } from '../../lib/numero-del-icono'
import { carneDe, coccionDe, selloPorEstado } from '../../lib/parrilla'
import { SIN_SENAL, etiquetaCuenta } from '../../lib/publicar'

/**
 * El detalle de un corte, al tocar su burbuja en «Lo que trajo» o su renglón servido en La Parrilla:
 * lo nuevo desde la última vez que se miró, los hitos que pasó, lo que lleva cada red tal como la
 * red lo da, y las visitas a tu página. Sin caché a propósito: mirarlo deja la marca (`POST …/visto`) y el circulito
 * vuelve a cero, así que lo nuevo tiene que ser lo que el servidor dice ahora, no lo de la vez
 * anterior. La marca se deja después de leer, para que lo nuevo alcance a mostrarse.
 */
export default function DetalleDeUnCorte() {
  const colores = useColores()
  const router = useRouter()
  const { id } = useLocalSearchParams<{ id: string }>()
  const { token, salir } = useSesion()
  const [detalle, setDetalle] = useState<DetalleDelCorte | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [cargando, setCargando] = useState(true)
  // El último pedido: uno anterior que conteste tarde no manda.
  const ultimo = useRef(0)

  const leer = useCallback(async () => {
    if (!token || !id) return
    const este = ++ultimo.current
    setCargando(true)
    try {
      const fresco = await apiGet<DetalleDelCorte>(`/api/mobile/cortes/${encodeURIComponent(id)}`, token)
      if (este !== ultimo.current) return
      setDetalle(fresco)
      setError(null)
      // Ya se vio: la marca, y el número del ícono que queda. Si no alcanza a llegar, el circulito
      // sigue hasta la próxima vez; no es un error que mostrar.
      try {
        const { numero } = await apiPost<{ numero: number }>(`/api/mobile/cortes/${encodeURIComponent(id)}/visto`, token, {})
        ponerNumero(numero)
        // La Parrilla vuelve a leer la fila al volver, con este corte ya en cero.
        anotarCambio()
      } catch (e) {
        if (e instanceof SesionCaducada) await salir()
      }
    } catch (e) {
      if (e instanceof SesionCaducada) return void (await salir())
      if (este !== ultimo.current) return
      setError(e instanceof RechazoApi ? e.message : SIN_SENAL)
    } finally {
      if (este === ultimo.current) setCargando(false)
    }
  }, [id, token, salir])

  useEffect(() => {
    // Arranca el pedido de red: el `setState` de `leer` es el comienzo legítimo de esa carga.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void leer()
  }, [leer])

  if (!detalle && cargando) return <Cargando />
  if (!detalle) {
    return (
      <View style={{ flex: 1, backgroundColor: colores.fondo, padding: 16 }}>
        <Tarjeta>
          <Text style={{ color: colores.suave }}>{error ?? 'No se pudo cargar.'}</Text>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
            <Boton texto="Reintentar" onPress={() => void leer()} />
            <Boton texto="Volver" onPress={() => router.back()} />
          </View>
        </Tarjeta>
      </View>
    )
  }

  const { corte, nuevo, vistoEn, redes, visitas } = detalle
  const hitos = detalle.hitos ?? []
  const estados = corte.redes.map((r) => r.estado)
  const hayNuevo = totalDe(nuevo) > 0
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colores.fondo }}
      contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 48 }}
      refreshControl={<RefreshControl refreshing={cargando} onRefresh={() => void leer()} tintColor={colores.suave} />}
    >
      <Tarjeta>
        <View style={{ flexDirection: 'row', gap: 14, alignItems: 'center' }}>
          {/* La pieza más grande que en La Parrilla: el lienzo mide 83 × 54. */}
          <View style={{ width: 116, height: 76, overflow: 'hidden' }}>
            <View style={{ transform: [{ scale: 1.4 }], transformOrigin: 'top left' }}>
              <Pieza
                formato={corte.formato ?? 'bife'}
                huesos={corte.huesos ?? 0}
                carne={carneDe(estados)}
                coccion={coccionDe(estados)}
                sellos={corte.redes.map((r) => r.sello ?? selloPorEstado(r.estado, r.error))}
              />
            </View>
          </View>
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={{ color: colores.suave, fontSize: 12 }}>{shortDate(corte.cuando)}</Text>
            <Text style={{ color: colores.texto, fontSize: 14 }} numberOfLines={6}>
              {corte.texto || '(sin texto)'}
            </Text>
          </View>
        </View>
      </Tarjeta>

      <Tarjeta>
        <Etiqueta>{tituloDelNuevo(vistoEn)}</Etiqueta>
        <Text style={{ color: hayNuevo ? colores.brasa : colores.suave, fontSize: hayNuevo ? 17 : 14, fontWeight: hayNuevo ? '700' : '400' }}>
          {fraseDelNuevo(nuevo, vistoEn)}
        </Text>
      </Tarjeta>

      {hitos.length > 0 ? (
        <Tarjeta>
          <Etiqueta>Los hitos</Etiqueta>
          {/* Del más alto al más bajo: el que manda arriba. */}
          {[...hitos].reverse().map((hito) => (
            <View key={hito.umbral} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={{ width: 14, alignItems: 'center' }}>
                <Llama alto={16} />
              </View>
              <Text style={{ color: colores.texto, fontSize: 14 }}>{renglonDelHito(hito)}</Text>
            </View>
          ))}
        </Tarjeta>
      ) : null}

      <Etiqueta margenArriba>Lo que lleva en cada red</Etiqueta>
      {redes.map((red) => (
        <LoDeUnaRed key={red.id} red={red} />
      ))}

      <Tarjeta>
        <Etiqueta>Visitas a tu página</Etiqueta>
        <Text style={{ color: colores.texto, fontSize: 20, fontWeight: '700', fontVariant: ['tabular-nums'] }}>{num(visitas)}</Text>
        <Text style={{ color: colores.suave, fontSize: 12 }}>
          Las cuenta Tu Parrilla: las que llegaron por el enlace de estas publicaciones.
        </Text>
      </Tarjeta>
    </ScrollView>
  )
}

/** Lo que lleva una red, tal como la red lo da. YouTube, con su rótulo: no se le resta ni se le suma nada. */
function LoDeUnaRed({ red }: { red: RedDelCorte }) {
  const colores = useColores()
  const sinNumeros = red.views === null && red.likes === null && red.comments === null
  const cifras = [
    red.views !== null ? `${num(red.views)} vistas` : null,
    red.likes !== null ? `${num(red.likes)} me gusta` : null,
    red.comments !== null ? `${num(red.comments)} comentarios` : null,
  ].filter((c): c is string => c !== null)
  const seguidores =
    red.seguidores !== null && red.seguidores > 0
      ? red.red === 'youtube'
        ? `+${num(red.seguidores)} suscriptores`
        : `+${num(red.seguidores)} seguidores`
      : null
  return (
    <Tarjeta>
      <Text style={{ color: colores.texto, fontSize: 14, fontWeight: '600' }}>
        {etiquetaCuenta({ red: red.red, handle: red.handle })}
      </Text>
      {sinNumeros ? (
        <Text style={{ color: colores.suave, fontSize: 13 }}>Todavía sin números de esta red: llegan con la próxima lectura.</Text>
      ) : (
        <Text style={{ color: colores.texto, fontSize: 13 }}>{cifras.join(' · ')}</Text>
      )}
      {seguidores ? <Text style={{ color: colores.verde, fontSize: 13, fontWeight: '600' }}>{seguidores}</Text> : null}
      {red.segunLaRed && !sinNumeros ? <Text style={{ color: colores.suave, fontSize: 11 }}>Según YouTube.</Text> : null}
    </Tarjeta>
  )
}
