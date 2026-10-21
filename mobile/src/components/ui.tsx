import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native'
import type { ReactNode } from 'react'
import { Image } from 'expo-image'
import type { Colores } from './colores'
import { useColores } from './tema'

/** El borde de lo que se toca y no está elegido: un botón secundario, una ficha sin marcar. */
function bordeTocable(c: Colores): string {
  return `${c.velo}29`
}

/** Oswald para títulos y etiquetas, en mayúsculas. Las cifras se quedan en la del sistema. */
export const TIPO_TITULO = 'Oswald_600SemiBold'

// El destello de Android al tocar: el mismo color del texto, casi transparente.
function ripple(c: Colores) {
  return { color: c.texto + '22' }
}
// Sobre la brasa el destello claro casi no se nota: mismo nivel de opacidad, pero negro.
const RIPPLE_DESTACADO = { color: '#00000022' }

export function Pantalla({
  children,
  refrescando,
  onRefrescar,
}: {
  children: ReactNode
  refrescando: boolean
  onRefrescar: () => void
}) {
  const colores = useColores()
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colores.fondo }}
      contentContainerStyle={{ padding: 16, paddingBottom: 48, gap: 12 }}
      refreshControl={
        <RefreshControl refreshing={refrescando} onRefresh={onRefrescar} tintColor={colores.suave} />
      }
    >
      {children}
    </ScrollView>
  )
}

export function Tarjeta({ children }: { children: ReactNode }) {
  const colores = useColores()
  return (
    <View style={{ backgroundColor: colores.tarjeta, borderRadius: 16, padding: 14, gap: 6 }}>
      {children}
    </View>
  )
}

/**
 * El rótulo chico en mayúsculas que encabeza un bloque: el nombre de una cifra, el día
 * de un grupo del calendario, «Qué viene». Antes era el mismo estilo escrito a mano en
 * seis pantallas, así que Oswald habría entrado solo donde alguien se acordara y la
 * mitad de los rótulos se leería en la fuente del sistema.
 *
 * `margenArriba` es para los que separan secciones de una lista que viene arriba; los
 * que van pegados al techo de una tarjeta no lo llevan.
 */
export function Etiqueta({ children, margenArriba }: { children: string; margenArriba?: boolean }) {
  const colores = useColores()
  return (
    <Text
      style={{
        color: colores.tenue,
        fontSize: 11,
        textTransform: 'uppercase',
        fontFamily: TIPO_TITULO,
        letterSpacing: 1.2,
        marginTop: margenArriba ? 8 : 0,
      }}
    >
      {children}
    </Text>
  )
}

/** Un título de pantalla, en la voz de los títulos. */
export function Titulo({ children }: { children: string }) {
  const colores = useColores()
  return (
    <Text
      style={{
        color: colores.texto,
        fontSize: 22,
        fontFamily: TIPO_TITULO,
        textTransform: 'uppercase',
        letterSpacing: 1,
      }}
    >
      {children}
    </Text>
  )
}

export function Sello({ texto }: { texto: string | null }) {
  const colores = useColores()
  if (!texto) return null
  return <Text style={{ color: colores.tenue, fontSize: 11 }}>Actualizado {texto}</Text>
}

export function Cargando() {
  const colores = useColores()
  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colores.fondo,
      }}
    >
      <ActivityIndicator color={colores.suave} />
    </View>
  )
}

export function ErrorConReintento({ mensaje, onReintentar }: { mensaje: string; onReintentar: () => void }) {
  const colores = useColores()
  return (
    <Tarjeta>
      <Text style={{ color: colores.texto }}>{mensaje}</Text>
      <View style={{ flexDirection: 'row', marginTop: 4 }}>
        <Boton texto="Reintentar" onPress={onReintentar} destacado />
      </View>
    </Tarjeta>
  )
}

export function Vacio({ texto }: { texto: string }) {
  const colores = useColores()
  return (
    <Text style={{ color: colores.tenue, textAlign: 'center', marginTop: 24, lineHeight: 20 }}>
      {texto}
    </Text>
  )
}

/**
 * El control más usado de la app: filtros, rangos, el selector de archivos y el de
 * fecha. De ahí los 44 dp más el `hitSlop`: en reposo se ve casi igual que antes,
 * pero el dedo ya no falla.
 *
 * Sin marcar lleva un borde fino: antes era texto gris sobre nada, y en Publicar las cuentas
 * no parecían algo que se toca hasta que una se marcaba.
 */
export function Chip({
  texto,
  activo,
  onPress,
  deshabilitado,
}: {
  texto: string
  activo: boolean
  onPress: () => void
  deshabilitado?: boolean
}) {
  const colores = useColores()
  return (
    <Pressable
      onPress={onPress}
      disabled={deshabilitado}
      hitSlop={4}
      android_ripple={deshabilitado ? undefined : activo ? RIPPLE_DESTACADO : ripple(colores)}
      style={({ pressed }) => ({
        paddingHorizontal: 12,
        paddingVertical: 10,
        minHeight: 44,
        justifyContent: 'center',
        borderRadius: 999,
        // Sin esto el ripple se dibuja rectangular, por fuera de las esquinas redondas.
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: activo ? colores.brasa : bordeTocable(colores),
        backgroundColor: activo ? colores.brasa : 'transparent',
        opacity: deshabilitado ? 0.5 : pressed ? 0.7 : 1,
      })}
    >
      <Text style={{ color: activo ? colores.fondo : colores.tenue, fontSize: 12, fontWeight: activo ? '600' : '400' }}>{texto}</Text>
    </Pressable>
  )
}

/**
 * Un archivo elegido: la imagen o un bloque con «video», y una equis para quitarlo.
 * Sin `onQuitar` la equis no se dibuja: es como el envío en curso marca un archivo
 * que ya viaja como no removible.
 *
 * `nota` es lo que dice sobre la imagen un archivo que todavía no está listo —«45 %»,
 * «En cola», «Reintentar»— y `onTocar`, lo que pasa al tocarlo (reintentar la subida).
 */
export function Miniatura({
  uri,
  esVideo,
  onQuitar,
  nota,
  onTocar,
}: {
  uri: string
  esVideo: boolean
  onQuitar?: () => void
  nota?: string | null
  onTocar?: () => void
}) {
  const colores = useColores()
  return (
    <View style={{ width: 72, height: 72 }}>
      <Pressable
        onPress={onTocar}
        disabled={!onTocar}
        accessibilityRole={onTocar ? 'button' : undefined}
        accessibilityLabel={nota ?? undefined}
        style={{ width: 72, height: 72, borderRadius: 10, overflow: 'hidden' }}
      >
        {esVideo ? (
          <View
            style={{
              width: 72,
              height: 72,
              backgroundColor: colores.velo + '10',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ color: colores.suave, fontSize: 11 }}>Video</Text>
          </View>
        ) : (
          <Image source={{ uri }} style={{ width: 72, height: 72 }} />
        )}
        {nota ? (
          // Una franja oscura abajo, para que la nota se lea sobre cualquier foto.
          <View
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 0,
              paddingVertical: 3,
              backgroundColor: '#000000b3',
              alignItems: 'center',
            }}
          >
            <Text style={{ color: nota === 'Reintentar' ? colores.rojo : colores.texto, fontSize: 10 }}>{nota}</Text>
          </View>
        ) : null}
      </Pressable>
      {onQuitar ? (
        <Pressable
          onPress={onQuitar}
          hitSlop={14}
          accessibilityRole="button"
          accessibilityLabel="Quitar"
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
  )
}

export function Boton({
  texto,
  onPress,
  deshabilitado,
  destacado,
}: {
  texto: string
  onPress: () => void
  deshabilitado?: boolean
  destacado?: boolean
}) {
  const colores = useColores()
  return (
    <Pressable
      onPress={onPress}
      disabled={deshabilitado}
      android_ripple={deshabilitado ? undefined : destacado ? RIPPLE_DESTACADO : ripple(colores)}
      style={({ pressed }) => ({
        flex: 1,
        backgroundColor: destacado ? colores.brasa : colores.tarjeta,
        // El secundario es del color de la tarjeta: puesto sobre una, sin borde no se veía que
        // era un botón («Reprogramar» en «Se quemó» se leía como texto suelto).
        borderWidth: destacado ? 0 : 1,
        borderColor: bordeTocable(colores),
        borderRadius: 12,
        // Sin esto el ripple se dibuja rectangular, por fuera de las esquinas redondas.
        overflow: 'hidden',
        padding: 14,
        minHeight: 48,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: deshabilitado ? 0.5 : pressed ? 0.7 : 1,
      })}
    >
      <Text style={{ color: destacado ? colores.fondo : colores.texto, fontWeight: '600' }}>{texto}</Text>
    </Pressable>
  )
}

/**
 * Una acción secundaria, solo texto: acompaña a los botones sin competir con ellos. En rojo
 * cuando lo que hace no tiene vuelta (descartar).
 */
export function BotonTexto({
  texto,
  onPress,
  deshabilitado,
  peligro,
}: {
  texto: string
  onPress: () => void
  deshabilitado?: boolean
  peligro?: boolean
}) {
  const colores = useColores()
  return (
    <Pressable
      onPress={onPress}
      disabled={deshabilitado}
      hitSlop={6}
      accessibilityRole="button"
      style={({ pressed }) => ({
        minHeight: 44,
        justifyContent: 'center',
        paddingHorizontal: 4,
        opacity: deshabilitado ? 0.5 : pressed ? 0.7 : 1,
      })}
    >
      <Text style={{ color: peligro ? colores.rojo : colores.suave, fontSize: 13, fontWeight: '600' }}>{texto}</Text>
    </Pressable>
  )
}
