import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native'
import type { ReactNode } from 'react'
import { Image } from 'expo-image'

/**
 * «Fierro y humo», los mismos valores que el panel web (ver
 * `docs/superpowers/specs/2026-09-18-parrilla-direccion-visual-design.md`).
 *
 * `brasa` es el acento y no existía: antes el verde hacía dos trabajos, el estado
 * «publicado» y el fondo del botón destacado, así que el mismo color informaba y pedía
 * que lo tocaras. Ahora el verde es solo estado y la brasa solo acción.
 */
export const COLORES = {
  fondo: '#16181a',
  tarjeta: '#1d2124',
  texto: '#f2ebe2',
  // El secundario y el tenue del panel, a 5,85:1 y 5,03:1 sobre la tarjeta. Antes el tenue
  // daba 3,25:1, y se repetía con otro nombre (`gris`). `src/lib/paleta.test.ts` compara.
  suave: '#a39a8f',
  tenue: '#8a9096',
  brasa: '#e8621f',
  verde: '#74bf6a',
  // El de «se quemó», como en el panel: el de antes (#f0614f) era casi el naranjo de la brasa.
  rojo: '#f2557a',
  ambar: '#e5a52a',
}

/** El borde de lo que se toca y no está elegido: un botón secundario, una ficha sin marcar. */
const BORDE_TOCABLE = 'rgba(255,255,255,0.16)'

/** Oswald para títulos y etiquetas, en mayúsculas. Las cifras se quedan en la del sistema. */
export const TIPO_TITULO = 'Oswald_600SemiBold'

// El destello de Android al tocar: el mismo blanco del texto, casi transparente.
const RIPPLE = { color: COLORES.texto + '22' }
// Sobre la brasa el blanco casi no se nota: mismo nivel de opacidad, pero negro.
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
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: COLORES.fondo }}
      contentContainerStyle={{ padding: 16, paddingBottom: 48, gap: 12 }}
      refreshControl={
        <RefreshControl refreshing={refrescando} onRefresh={onRefrescar} tintColor={COLORES.suave} />
      }
    >
      {children}
    </ScrollView>
  )
}

export function Tarjeta({ children }: { children: ReactNode }) {
  return (
    <View style={{ backgroundColor: COLORES.tarjeta, borderRadius: 16, padding: 14, gap: 6 }}>
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
  return (
    <Text
      style={{
        color: COLORES.tenue,
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
  return (
    <Text
      style={{
        color: COLORES.texto,
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

export function Cifra({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <View style={{ flex: 1, backgroundColor: COLORES.tarjeta, borderRadius: 16, padding: 14 }}>
      <Etiqueta>{etiqueta}</Etiqueta>
      {/* La cifra en sí se queda en la fuente del sistema: Oswald es condensada y los
          números salen apretados justo donde hay que leerlos de una pasada. */}
      <Text style={{ color: COLORES.texto, fontSize: 24, fontWeight: '600', marginTop: 4 }}>
        {valor}
      </Text>
    </View>
  )
}

export function Sello({ texto }: { texto: string | null }) {
  if (!texto) return null
  return <Text style={{ color: COLORES.tenue, fontSize: 11 }}>Actualizado {texto}</Text>
}

export function Cargando() {
  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORES.fondo,
      }}
    >
      <ActivityIndicator color={COLORES.suave} />
    </View>
  )
}

export function ErrorConReintento({ mensaje, onReintentar }: { mensaje: string; onReintentar: () => void }) {
  return (
    <Tarjeta>
      <Text style={{ color: COLORES.texto }}>{mensaje}</Text>
      <View style={{ flexDirection: 'row', marginTop: 4 }}>
        <Boton texto="Reintentar" onPress={onReintentar} destacado />
      </View>
    </Tarjeta>
  )
}

export function Vacio({ texto }: { texto: string }) {
  return (
    <Text style={{ color: COLORES.tenue, textAlign: 'center', marginTop: 24, lineHeight: 20 }}>
      {texto}
    </Text>
  )
}

const COLOR_ESTADO: Record<string, string> = {
  published: COLORES.verde,
  scheduled: COLORES.tenue,
  failed: COLORES.rojo,
  publishing: COLORES.ambar,
}

/** El mismo semáforo del panel: verde publicado, gris programado, rojo falló. */
export function PuntoEstado({ estado }: { estado: string }) {
  return (
    <View
      style={{
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: COLOR_ESTADO[estado] ?? COLORES.tenue,
      }}
    />
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
  return (
    <Pressable
      onPress={onPress}
      disabled={deshabilitado}
      hitSlop={4}
      android_ripple={deshabilitado ? undefined : activo ? RIPPLE_DESTACADO : RIPPLE}
      style={({ pressed }) => ({
        paddingHorizontal: 12,
        paddingVertical: 10,
        minHeight: 44,
        justifyContent: 'center',
        borderRadius: 999,
        // Sin esto el ripple se dibuja rectangular, por fuera de las esquinas redondas.
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: activo ? COLORES.brasa : BORDE_TOCABLE,
        backgroundColor: activo ? COLORES.brasa : 'transparent',
        opacity: deshabilitado ? 0.5 : pressed ? 0.7 : 1,
      })}
    >
      <Text style={{ color: activo ? COLORES.fondo : COLORES.tenue, fontSize: 12, fontWeight: activo ? '600' : '400' }}>{texto}</Text>
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
              backgroundColor: '#ffffff10',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ color: COLORES.suave, fontSize: 11 }}>Video</Text>
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
            <Text style={{ color: nota === 'Reintentar' ? COLORES.rojo : COLORES.texto, fontSize: 10 }}>{nota}</Text>
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
            backgroundColor: COLORES.fondo,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ color: COLORES.texto, fontSize: 12 }}>✕</Text>
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
  return (
    <Pressable
      onPress={onPress}
      disabled={deshabilitado}
      android_ripple={deshabilitado ? undefined : destacado ? RIPPLE_DESTACADO : RIPPLE}
      style={({ pressed }) => ({
        flex: 1,
        backgroundColor: destacado ? COLORES.brasa : COLORES.tarjeta,
        // El secundario es del color de la tarjeta: puesto sobre una, sin borde no se veía que
        // era un botón («Reprogramar» en «Se quemó» se leía como texto suelto).
        borderWidth: destacado ? 0 : 1,
        borderColor: BORDE_TOCABLE,
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
      <Text style={{ color: destacado ? COLORES.fondo : COLORES.texto, fontWeight: '600' }}>{texto}</Text>
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
      <Text style={{ color: peligro ? COLORES.rojo : COLORES.suave, fontSize: 13, fontWeight: '600' }}>{texto}</Text>
    </Pressable>
  )
}
