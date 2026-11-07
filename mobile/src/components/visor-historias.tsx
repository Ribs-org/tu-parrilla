import { useEffect, useRef } from 'react'
import { Pressable, ScrollView, Text, View, useWindowDimensions } from 'react-native'
import { Image } from 'expo-image'

import { useColores } from './tema'
import { duracionLegible, type AvisoDeHistoria } from '../lib/historias'
import type { Archivo } from '../lib/publicar'

// El visor de las historias en Publicar: cada archivo en 9:16, recortado como lo va a ver quien
// la mire, con una raya arriba por historia como en Instagram, y deslizando de lado se pasa de
// una a otra. Debajo, la tira con el orden en que salen. Todo con lo que la app ya trae
// (`expo-image` y el `ScrollView` de React Native): sin módulos nativos nuevos, llega por aire.
// Un video no se reproduce —pediría `expo-video`, que es nativo—: se ve su duración.

/** Lo que mide el visor: el ancho de la pantalla, sin pasarse de un poco más de media pantalla de alto. */
export function useAnchoDelVisor(): number {
  const { width, height } = useWindowDimensions()
  return Math.round(Math.min(width - 32, height * 0.58 * (9 / 16)))
}

export function VisorDeHistorias({
  archivos,
  indice,
  onIndice,
  avisos,
  notas,
  onTocar,
}: {
  archivos: Archivo[]
  indice: number
  onIndice: (i: number) => void
  avisos: AvisoDeHistoria[][]
  notas: (string | null)[]
  /** Tocar una historia cuya subida falló la reintenta; undefined si no hay nada que hacer. */
  onTocar: (i: number) => (() => void) | undefined
}) {
  const colores = useColores()
  const ancho = useAnchoDelVisor()
  const alto = Math.round((ancho * 16) / 9)
  const scroll = useRef<ScrollView>(null)
  // El índice que puso el dedo: al llegar de vuelta por `indice` no hay que mover nada.
  const delDedo = useRef(indice)

  useEffect(() => {
    if (delDedo.current === indice) return
    delDedo.current = indice
    scroll.current?.scrollTo({ x: indice * ancho, animated: true })
  }, [indice, ancho])

  return (
    <View style={{ width: ancho, height: alto, alignSelf: 'center', borderRadius: 14, overflow: 'hidden', backgroundColor: '#000' }}>
      <ScrollView
        ref={scroll}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => {
          const i = Math.max(0, Math.min(archivos.length - 1, Math.round(e.nativeEvent.contentOffset.x / ancho)))
          delDedo.current = i
          if (i !== indice) onIndice(i)
        }}
        accessibilityLabel={`Historia ${indice + 1} de ${archivos.length}`}
      >
        {archivos.map((a, i) => {
          const tocar = onTocar(i)
          const nota = notas[i]
          return (
            <Pressable
              key={a.clave}
              onPress={tocar}
              disabled={!tocar}
              accessibilityRole={tocar ? 'button' : undefined}
              accessibilityLabel={nota ?? undefined}
              style={{ width: ancho, height: alto }}
            >
              {a.mediaType === 'image' ? (
                <Image source={{ uri: a.vista }} style={{ width: ancho, height: alto }} contentFit="cover" />
              ) : (
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#111' }}>
                  <Text style={{ color: '#fff', fontSize: 40 }}>▶</Text>
                  <Text style={{ color: '#ffffffcc', fontSize: 13 }}>
                    {a.medidas?.duracionMs ? `Video · ${duracionLegible(a.medidas.duracionMs)}` : 'Video'}
                  </Text>
                  <Text style={{ color: '#ffffff99', fontSize: 11, paddingHorizontal: 16 }} numberOfLines={1}>
                    {a.nombre}
                  </Text>
                </View>
              )}
              {nota ? (
                <View style={{ position: 'absolute', top: 30, alignSelf: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, backgroundColor: '#000000b3' }}>
                  <Text style={{ color: nota === 'Reintentar' ? colores.rojo : '#fff', fontSize: 12 }}>{nota}</Text>
                </View>
              ) : null}
              {(avisos[i] ?? []).length > 0 ? (
                <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: 10, gap: 4, backgroundColor: '#000000b3' }}>
                  {avisos[i]!.map((aviso) => (
                    <Text key={aviso.texto} style={{ color: aviso.bloquea ? colores.rojo : colores.ambar, fontSize: 12 }}>
                      {aviso.texto}
                    </Text>
                  ))}
                </View>
              ) : null}
            </Pressable>
          )
        })}
      </ScrollView>
      {/* Una raya por historia, como en Instagram: llenas hasta la que se ve. */}
      <View pointerEvents="none" style={{ position: 'absolute', top: 8, left: 8, right: 8, flexDirection: 'row', gap: 4 }}>
        {archivos.map((a, i) => (
          <View key={a.clave} style={{ flex: 1, height: 3, borderRadius: 2, backgroundColor: i <= indice ? '#ffffff' : '#ffffff55' }} />
        ))}
      </View>
      {archivos.length > 1 ? (
        <View pointerEvents="none" style={{ position: 'absolute', top: 16, right: 10 }}>
          <Text style={{ color: '#fff', fontSize: 12, textShadowColor: '#000', textShadowRadius: 3 }}>
            {indice + 1} de {archivos.length}
          </Text>
        </View>
      ) : null}
    </View>
  )
}

/** La tira bajo el visor: las historias en el orden en que salen, con su número y su «✕». */
export function TiraDeHistorias({
  archivos,
  indice,
  onElegir,
  onQuitar,
  hayAvisos,
}: {
  archivos: Archivo[]
  indice: number
  onElegir: (i: number) => void
  onQuitar?: (clave: string) => void
  hayAvisos: boolean[]
}) {
  const colores = useColores()
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingTop: 8, paddingRight: 8 }}>
      {archivos.map((a, i) => (
        <View key={a.clave} style={{ width: 54, height: 96 }}>
          <Pressable
            onPress={() => onElegir(i)}
            accessibilityRole="button"
            accessibilityLabel={`Ver la historia ${i + 1}`}
            accessibilityState={{ selected: i === indice }}
            style={{
              width: 54,
              height: 96,
              borderRadius: 8,
              overflow: 'hidden',
              borderWidth: 2,
              borderColor: i === indice ? colores.brasa : 'transparent',
              backgroundColor: colores.velo + '10',
            }}
          >
            {a.mediaType === 'image' ? (
              <Image source={{ uri: a.vista }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
            ) : (
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: colores.suave, fontSize: 16 }}>▶</Text>
              </View>
            )}
            <View style={{ position: 'absolute', left: 3, bottom: 3, minWidth: 18, paddingHorizontal: 4, borderRadius: 9, backgroundColor: '#000000b3' }}>
              <Text style={{ color: hayAvisos[i] ? colores.ambar : '#fff', fontSize: 11, textAlign: 'center' }}>{i + 1}</Text>
            </View>
          </Pressable>
          {onQuitar ? (
            <Pressable
              onPress={() => onQuitar(a.clave)}
              hitSlop={14}
              accessibilityRole="button"
              accessibilityLabel={`Quitar la historia ${i + 1}`}
              style={{
                position: 'absolute',
                top: -6,
                right: -6,
                width: 22,
                height: 22,
                borderRadius: 11,
                backgroundColor: colores.fondo,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ color: colores.texto, fontSize: 12 }}>✕</Text>
            </Pressable>
          ) : null}
        </View>
      ))}
    </ScrollView>
  )
}
