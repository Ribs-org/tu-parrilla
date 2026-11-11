import { useEffect } from 'react'
import { Pressable, ScrollView, Text, View } from 'react-native'
import { useFocusEffect, useRouter } from 'expo-router'
import { carneDe, coccionDe, selloPorEstado } from '../lib/parrilla'
import { circulito, diaDeLaBurbuja, totalDe, type CorteQueTrajo, type LoQueTrajo } from '../lib/lo-que-trajo'
import { ponerNumero } from '../lib/numero-del-icono'
import { useScreenData } from '../lib/useScreenData'
import { Pieza } from './pieza'
import { useSesion } from './sesion'
import { useColores } from './tema'
import { Etiqueta } from './ui'

/** El lado de la burbuja; la pieza (83 × 54) entra a 0,6. */
const BURBUJA = 64

/**
 * Lo de «Lo que trajo» para La Parrilla: la fila (`GET /api/mobile/lo-que-trajo`), que se refresca
 * al volver a la pestaña como lo demás, y el número del ícono y de la pestaña, que se pone cada vez
 * que llega —también lo guardado, apenas abre—. La Parrilla la refresca además al tirar hacia abajo.
 */
export function useLoQueTrajo() {
  const { token, salir } = useSesion()
  const lectura = useScreenData<LoQueTrajo>('lo-que-trajo', '/api/mobile/lo-que-trajo', token, salir)
  useFocusEffect(lectura.refrescarSiVieja)
  useEffect(() => {
    if (typeof lectura.data?.numero === 'number') ponerNumero(lectura.data.numero)
  }, [lectura.data])
  return lectura
}

/**
 * La fila de arriba de La Parrilla, como las historias de Instagram: una burbuja por corte que salió
 * en los últimos siete días, del más nuevo al más viejo. Con algo nuevo, el anillo en brasa y el
 * circulito rojo con cuánto; sin nada, el anillo apagado. Tocar una abre su detalle. Sin cortes en
 * la semana —o con un sitio que todavía no tiene la ruta— no aparece.
 */
export function FilaLoQueTrajo({ datos }: { datos: LoQueTrajo | null }) {
  const router = useRouter()
  const cortes = datos?.cortes ?? []
  if (!datos || cortes.length === 0) return null
  return (
    <View style={{ gap: 8 }}>
      <Etiqueta>Lo que trajo</Etiqueta>
      {/* Hasta el borde de la pantalla, como una fila que sigue: la pantalla tiene 16 de margen. */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ marginHorizontal: -16 }}
        // Arriba, el aire del circulito, que asoma sobre la burbuja: la fila corta lo que se sale.
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8, gap: 12 }}
      >
        {cortes.map((corte) => (
          <Burbuja
            key={corte.id}
            corte={corte}
            hoy={datos.hoy}
            onAbrir={() => router.push({ pathname: '/corte/[id]', params: { id: corte.id } })}
          />
        ))}
      </ScrollView>
    </View>
  )
}

function Burbuja({ corte, hoy, onAbrir }: { corte: CorteQueTrajo; hoy: string; onAbrir: () => void }) {
  const colores = useColores()
  const estados = corte.redes.map((r) => r.estado)
  const nuevo = totalDe(corte.nuevo)
  const dia = diaDeLaBurbuja(corte.cuando, hoy)
  return (
    <Pressable
      onPress={onAbrir}
      accessibilityRole="button"
      accessibilityLabel={`${dia}, ${corte.texto || 'sin texto'}. ${nuevo > 0 ? `${circulito(nuevo)} desde la última vez` : 'Nada nuevo'}`}
      style={({ pressed }) => ({ width: BURBUJA + 8, alignItems: 'center', gap: 4, opacity: pressed ? 0.7 : 1 })}
    >
      <View
        style={{
          width: BURBUJA,
          height: BURBUJA,
          borderRadius: BURBUJA / 2,
          borderWidth: 2.5,
          borderColor: nuevo > 0 ? colores.brasa : colores.acero,
          backgroundColor: colores.tarjeta,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <View style={{ width: 50, height: 33, overflow: 'hidden' }}>
          <View style={{ transform: [{ scale: 0.6 }], transformOrigin: 'top left' }}>
            <Pieza
              formato={corte.formato ?? 'bife'}
              huesos={corte.huesos ?? 0}
              carne={carneDe(estados)}
              coccion={coccionDe(estados)}
              sellos={corte.redes.map((r) => r.sello ?? selloPorEstado(r.estado, r.error))}
            />
          </View>
        </View>
        {nuevo > 0 ? (
          <View
            style={{
              position: 'absolute',
              top: -6,
              right: -10,
              minWidth: 24,
              height: 22,
              borderRadius: 11,
              paddingHorizontal: 6,
              backgroundColor: colores.rojo,
              borderWidth: 2,
              borderColor: colores.fondo,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ color: '#ffffff', fontSize: 11, fontWeight: '700', fontVariant: ['tabular-nums'] }}>{circulito(nuevo)}</Text>
          </View>
        ) : null}
      </View>
      <Text style={{ color: nuevo > 0 ? colores.texto : colores.suave, fontSize: 11 }} numberOfLines={1}>
        {dia}
      </Text>
    </Pressable>
  )
}
