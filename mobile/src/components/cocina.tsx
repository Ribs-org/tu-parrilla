import { useState } from 'react'
import { Pressable, Text, TextInput, View } from 'react-native'
import { Image } from 'expo-image'
import { Boton, Chip, TIPO_TITULO } from './ui'
import { useColores, useTema } from './tema'
import {
  GANCHOS,
  MAX_RESPUESTA,
  duracionEnPalabras,
  estadoDeLaCuota,
  faltaParaResponder,
  ganchosOcupados,
  pesoEnPalabras,
  type ClaseMaterial,
  type ComandaDelTelefono,
  type Material,
  type PreguntaDelChef,
  type UsoDeLaCamara,
} from '../lib/cocina'
import { CAMARA_LLENA, CAMARA_LLENANDOSE } from '../lib/tema'

/*
 * Las piezas de La Cocina en el teléfono (`app/(tabs)/cocina.tsx`), con la imagen del panel: lo que
 * va en la comanda cuelga de un riel, como la carne en la cámara de frío —de día, sobre el hielo de
 * la nevera—, y la cuota son los ganchos de ese riel, uno por cada décimo. Dibujado con vistas,
 * como los íconos: nada nativo nuevo.
 */

/**
 * Una casilla para marcar, como la del panel: un cuadro con su ✓ y el texto al lado. La de los
 * derechos, antes de grabar o elegir: el servidor no guarda nada sin ella.
 */
export function Casilla({
  texto,
  marcada,
  onCambiar,
  deshabilitado,
}: {
  texto: string
  marcada: boolean
  onCambiar: () => void
  deshabilitado?: boolean
}) {
  const colores = useColores()
  return (
    <Pressable
      onPress={onCambiar}
      disabled={deshabilitado}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: marcada, disabled: deshabilitado }}
      hitSlop={6}
      style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 44, opacity: deshabilitado ? 0.5 : pressed ? 0.7 : 1 })}
    >
      <View
        style={{
          width: 22,
          height: 22,
          borderRadius: 5,
          borderWidth: 2,
          borderColor: marcada ? colores.brasa : colores.tenue,
          backgroundColor: marcada ? colores.brasa : 'transparent',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {marcada ? <Text style={{ color: colores.fondo, fontSize: 13, fontWeight: '700' }}>✓</Text> : null}
      </View>
      <Text style={{ color: colores.texto, fontSize: 13, lineHeight: 18, flex: 1 }}>{texto}</Text>
    </Pressable>
  )
}

/** La clase en una palabra, para la ficha de cada material. */
const CLASE: Record<ClaseMaterial, string> = { video: 'Video', audio: 'Audio', imagen: 'Foto', otro: 'Archivo' }

/** La ficha de la izquierda de un material: su clase, sobre el velo del modo. */
function Ficha({ clase, uri }: { clase: ClaseMaterial; uri?: string | null }) {
  const colores = useColores()
  return (
    <View
      style={{
        width: 44,
        height: 44,
        borderRadius: 8,
        overflow: 'hidden',
        backgroundColor: colores.velo + '10',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {uri && clase === 'imagen' ? (
        <Image source={{ uri }} style={{ width: 44, height: 44 }} />
      ) : (
        <Text style={{ color: colores.suave, fontSize: 10, fontFamily: TIPO_TITULO, letterSpacing: 0.6 }}>{CLASE[clase].toUpperCase()}</Text>
      )}
    </View>
  )
}

/** El renglón de los datos de un material: cómo se llama por lo que pesa, lo que dura y lo que pesa. */
export function datosDe(m: Pick<Material, 'bytes' | 'duracionS' | 'pieza'>, tema: 'noche' | 'dia'): string {
  return [m.pieza?.[tema], duracionEnPalabras(m.duracionS), pesoEnPalabras(m.bytes)].filter(Boolean).join(' · ')
}

/**
 * Un material de la cámara, para elegirlo o soltarlo de la comanda: la ficha, el nombre, sus datos
 * y, a la derecha, el gancho —lleno si va en la comanda—. «Plato principal» marca el video que el
 * chef cocina.
 */
export function FilaDeMaterial({
  material,
  elegido,
  principal,
  onTocar,
  deshabilitado,
}: {
  material: Material
  elegido: boolean
  principal: boolean
  onTocar: () => void
  deshabilitado?: boolean
}) {
  const colores = useColores()
  const { tema } = useTema()
  return (
    <Pressable
      onPress={onTocar}
      disabled={deshabilitado}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: elegido, disabled: deshabilitado }}
      accessibilityLabel={`${material.nombre}${principal ? ', plato principal' : ''}`}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        padding: 10,
        minHeight: 64,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: elegido ? colores.brasa : colores.velo + '1f',
        backgroundColor: colores.tarjeta,
        opacity: deshabilitado ? 0.5 : pressed ? 0.7 : 1,
      })}
    >
      <Ficha clase={material.clase} />
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={{ color: colores.texto, fontSize: 14 }} numberOfLines={1}>
          {material.nombre}
        </Text>
        <Text style={{ color: colores.tenue, fontSize: 11 }} numberOfLines={1}>
          {datosDe(material, tema)}
        </Text>
        {principal ? (
          <Text style={{ color: colores.brasa, fontSize: 10, fontFamily: TIPO_TITULO, letterSpacing: 1 }}>PLATO PRINCIPAL</Text>
        ) : null}
      </View>
      <Gancho lleno={elegido} />
    </Pressable>
  )
}

/** El gancho de la derecha: vacío, un aro; lleno, con la pieza colgada. */
function Gancho({ lleno }: { lleno: boolean }) {
  const colores = useColores()
  return (
    <View style={{ width: 26, alignItems: 'center' }}>
      <View style={{ width: 2, height: 8, backgroundColor: lleno ? colores.brasa : colores.tenue }} />
      <View
        style={{
          width: 18,
          height: 18,
          borderRadius: 9,
          borderWidth: 2,
          borderColor: lleno ? colores.brasa : colores.tenue,
          backgroundColor: lleno ? colores.brasa : 'transparent',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {lleno ? <Text style={{ color: colores.fondo, fontSize: 11, fontWeight: '700' }}>✓</Text> : null}
      </View>
    </View>
  )
}

/**
 * Lo que va en la comanda, colgado del riel: cada cosa elegida en su gancho, con su nombre, y lo
 * que todavía se está guardando con su avance. Se suelta con la equis.
 */
export function RielDeLaComanda({
  colgados,
  subiendo,
  onSoltar,
  onReintentar,
  onQuitarSubida,
  principal,
  deshabilitado,
}: {
  colgados: Material[]
  subiendo: { clave: string; nombre: string; clase: ClaseMaterial; vista: string | null; progreso: number; error: string | null }[]
  onSoltar: (id: string) => void
  onReintentar: (clave: string) => void
  onQuitarSubida: (clave: string) => void
  principal: string | null
  deshabilitado?: boolean
}) {
  const colores = useColores()
  const { tema } = useTema()
  if (colgados.length === 0 && subiendo.length === 0) return null
  return (
    <View>
      {/* El riel: una barra de acero de la que cuelga todo. */}
      <View style={{ height: 4, borderRadius: 2, backgroundColor: colores.acero, marginHorizontal: 4 }} />
      <View style={{ gap: 8 }}>
        {subiendo.map((s) => (
          <Colgado key={s.clave}>
            <Ficha clase={s.clase} uri={s.vista} />
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={{ color: colores.texto, fontSize: 13 }} numberOfLines={1}>
                {s.nombre}
              </Text>
              {s.error ? (
                <>
                  <Text style={{ color: colores.rojo, fontSize: 12 }}>{s.error}</Text>
                  <View style={{ flexDirection: 'row', gap: 18 }}>
                    <Accion texto="Reintentar" onPress={() => onReintentar(s.clave)} />
                    <Accion texto="Quitar" onPress={() => onQuitarSubida(s.clave)} peligro />
                  </View>
                </>
              ) : (
                <>
                  <Text style={{ color: colores.suave, fontSize: 11 }}>
                    {s.progreso > 0 ? `Guardando… ${Math.floor(s.progreso * 100)} %` : 'Guardando…'}
                  </Text>
                  <View style={{ height: 4, borderRadius: 2, backgroundColor: colores.velo + '1a', overflow: 'hidden' }}>
                    <View style={{ height: 4, width: `${Math.max(2, Math.round(s.progreso * 100))}%`, backgroundColor: colores.brasa }} />
                  </View>
                </>
              )}
            </View>
            {s.error ? null : <Equis etiqueta={`Cancelar ${s.nombre}`} onPress={() => onQuitarSubida(s.clave)} />}
          </Colgado>
        ))}
        {colgados.map((m) => (
          <Colgado key={m.id}>
            <Ficha clase={m.clase} />
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={{ color: colores.texto, fontSize: 13 }} numberOfLines={1}>
                {m.nombre}
              </Text>
              <Text style={{ color: colores.tenue, fontSize: 11 }} numberOfLines={1}>
                {datosDe(m, tema)}
              </Text>
              {m.id === principal ? (
                <Text style={{ color: colores.brasa, fontSize: 10, fontFamily: TIPO_TITULO, letterSpacing: 1 }}>PLATO PRINCIPAL</Text>
              ) : null}
            </View>
            {deshabilitado ? null : <Equis etiqueta={`Sacar ${m.nombre} de la comanda`} onPress={() => onSoltar(m.id)} />}
          </Colgado>
        ))}
      </View>
    </View>
  )
}

/** Una cosa colgada del riel: el gancho arriba y la tarjeta debajo. */
function Colgado({ children }: { children: React.ReactNode }) {
  const colores = useColores()
  return (
    <View>
      <View style={{ width: 2, height: 10, backgroundColor: colores.tenue, marginLeft: 26 }} />
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          padding: 10,
          borderRadius: 12,
          backgroundColor: colores.velo + '0d',
        }}
      >
        {children}
      </View>
    </View>
  )
}

function Equis({ etiqueta, onPress }: { etiqueta: string; onPress: () => void }) {
  const colores = useColores()
  return (
    <Pressable
      onPress={onPress}
      hitSlop={12}
      accessibilityRole="button"
      accessibilityLabel={etiqueta}
      style={({ pressed }) => ({ width: 32, height: 32, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.6 : 1 })}
    >
      <Text style={{ color: colores.suave, fontSize: 15 }}>✕</Text>
    </Pressable>
  )
}

function Accion({ texto, onPress, peligro }: { texto: string; onPress: () => void; peligro?: boolean }) {
  const colores = useColores()
  return (
    <Pressable onPress={onPress} hitSlop={10} accessibilityRole="button" style={({ pressed }) => ({ minHeight: 32, justifyContent: 'center', opacity: pressed ? 0.6 : 1 })}>
      <Text style={{ color: peligro ? colores.rojo : colores.brasa, fontSize: 13, fontWeight: '600' }}>{texto}</Text>
    </Pressable>
  )
}

/**
 * La cuota de la cámara, como en el panel: diez ganchos en un riel, cada uno un décimo, que se
 * llenan con lo guardado —en ámbar cuando se está llenando, en rojo llena—, y debajo cuánto ocupa
 * de cuánto, y cuánto está subiendo.
 */
export function CuotaDeLaCamara({ camara }: { camara: UsoDeLaCamara }) {
  const colores = useColores()
  const { tema } = useTema()
  const ocupados = camara.guardados + camara.subiendo
  const estado = estadoDeLaCuota(ocupados, camara.cuota)
  const llenos = ganchosOcupados(ocupados, camara.cuota)
  const color = estado === 'llena' ? colores.rojo : estado === 'llenandose' ? colores.ambar : colores.brasa
  return (
    <View
      style={{ gap: 6 }}
      accessibilityLabel={`${pesoEnPalabras(camara.guardados)} de ${pesoEnPalabras(camara.cuota)}`}
    >
      <View>
        <View style={{ height: 3, borderRadius: 2, backgroundColor: colores.acero }} />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 6 }}>
          {Array.from({ length: GANCHOS }, (_, i) => (
            <View key={i} style={{ alignItems: 'center' }}>
              <View style={{ width: 1.5, height: 5, backgroundColor: colores.tenue }} />
              <View
                style={{
                  width: 10,
                  height: 14,
                  borderRadius: 3,
                  backgroundColor: i < llenos ? color : 'transparent',
                  borderWidth: i < llenos ? 0 : 1,
                  borderColor: colores.velo + '29',
                }}
              />
            </View>
          ))}
        </View>
      </View>
      <Text style={{ color: colores.tenue, fontSize: 11 }}>
        {pesoEnPalabras(camara.guardados)} de {pesoEnPalabras(camara.cuota)}
        {camara.subiendo > 0 ? ` · subiendo ${pesoEnPalabras(camara.subiendo)}` : ''}
      </Text>
      {estado === 'llena' ? (
        <Text style={{ color: colores.rojo, fontSize: 12 }}>{CAMARA_LLENA[tema]}: saca algo que ya no uses desde el panel web, o pide más espacio.</Text>
      ) : estado === 'llenandose' ? (
        <Text style={{ color: colores.ambar, fontSize: 12 }}>{CAMARA_LLENANDOSE[tema]}.</Text>
      ) : null}
    </View>
  )
}

const FECHA = new Intl.DateTimeFormat('es-CL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })

/** Lo que hace «Responder»: devuelve la frase del error, o null si salió. */
export type Responder = (preguntaId: string, respuesta: string) => Promise<string | null>

/**
 * Lo que el chef pregunta, en la tarjeta de su comanda: la pregunta, una opción por chip —un toque
 * responde; la de por defecto va marcada— o, si es libre, el campo y «Responder», y lo que pasa si
 * nadie contesta antes del plazo.
 */
export function PreguntaDelChefEnLaTarjeta({ pregunta, onResponder }: { pregunta: PreguntaDelChef; onResponder: Responder }) {
  const colores = useColores()
  const [texto, setTexto] = useState('')
  const [enviando, setEnviando] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function responder(respuesta: string) {
    setEnviando(respuesta)
    setError(null)
    const fallo = await onResponder(pregunta.id, respuesta)
    setError(fallo)
    setEnviando(null)
  }

  const falta = faltaParaResponder(texto)
  const largo = texto.trim().length
  return (
    <View style={{ borderWidth: 1, borderColor: colores.brasa, borderRadius: 12, padding: 12, gap: 10 }}>
      <Text style={{ color: colores.texto, fontSize: 14, fontWeight: '600', lineHeight: 20 }}>{pregunta.texto}</Text>
      {pregunta.opciones ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          {pregunta.opciones.map((o) => (
            <Chip
              key={o}
              texto={enviando === o ? 'Respondiendo…' : o}
              activo={o === pregunta.porDefecto}
              onPress={() => void responder(o)}
              deshabilitado={enviando !== null}
            />
          ))}
        </View>
      ) : (
        <>
          <TextInput
            value={texto}
            onChangeText={setTexto}
            multiline
            editable={enviando === null}
            placeholder="Tu respuesta al chef"
            placeholderTextColor={colores.tenue}
            accessibilityLabel="Tu respuesta al chef"
            style={{ backgroundColor: colores.fondo, color: colores.texto, borderRadius: 12, padding: 12, minHeight: 72, textAlignVertical: 'top', fontSize: 14 }}
          />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Boton
              texto={enviando !== null ? 'Respondiendo…' : 'Responder'}
              onPress={() => void responder(texto.trim())}
              deshabilitado={Boolean(falta) || enviando !== null}
              destacado
            />
            <Text style={{ color: largo > MAX_RESPUESTA ? colores.rojo : colores.tenue, fontSize: 11 }}>
              {largo} / {MAX_RESPUESTA}
            </Text>
          </View>
        </>
      )}
      <Text style={{ color: colores.suave, fontSize: 12, lineHeight: 17 }}>{pregunta.siNoContestas}</Text>
      {error ? <Text style={{ color: colores.rojo, fontSize: 12 }}>{error}</Text> : null}
    </View>
  )
}

/**
 * Una comanda en la lista: su estado en palabras —en brasa mientras el chef la tiene, en verde
 * lista, en rojo si no se pudo—, los cinco tramos del recorrido con lo andado encendido, el plato
 * principal, la instrucción, lo que dijo el chef y, si pregunta algo, la pregunta para contestarla.
 */
export function TarjetaDeComanda({ comanda, onResponder }: { comanda: ComandaDelTelefono; onResponder: Responder }) {
  const colores = useColores()
  const { tema } = useTema()
  const termino = comanda.tramo === null
  const color = termino ? colores.rojo : comanda.estado === 'lista' || comanda.estado === 'servida' ? colores.verde : colores.brasa
  const pregunta = comanda.estado === 'pregunta' ? comanda.pregunta : null
  return (
    <View
      style={{
        backgroundColor: colores.tarjeta,
        borderRadius: 16,
        padding: 14,
        gap: 8,
        borderLeftWidth: 3,
        borderLeftColor: color,
        // Cuando el chef pregunta, la tarjeta se pone de color: es lo único que espera a la persona.
        ...(pregunta ? { borderWidth: 1, borderColor: colores.brasa } : {}),
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
        <Text style={{ color, fontFamily: TIPO_TITULO, fontSize: 14, letterSpacing: 0.6, flexShrink: 1 }}>{comanda.palabras[tema]}</Text>
        <Text style={{ color: colores.tenue, fontSize: 11 }}>{FECHA.format(new Date(comanda.creadaEn))}</Text>
      </View>
      {/* El recorrido en cinco tramos —colgada, el chef mira, el desposte, al fuego, el mesón—, como
          en el panel: dice lo mismo que el estado en palabras, de un vistazo, así que no se lee en voz alta. */}
      {comanda.tramo !== null ? (
        <View style={{ flexDirection: 'row', gap: 4, maxWidth: 280 }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          {Array.from({ length: 5 }, (_, i) => (
            <View key={i} style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: i <= (comanda.tramo ?? -1) ? color : colores.velo + '1a' }} />
          ))}
        </View>
      ) : null}
      {comanda.principal ? (
        <Text style={{ color: colores.texto, fontSize: 13 }} numberOfLines={1}>
          {comanda.principal}
        </Text>
      ) : null}
      {comanda.instruccion ? (
        <Text style={{ color: colores.suave, fontSize: 12, fontStyle: 'italic' }} numberOfLines={2}>
          «{comanda.instruccion}»
        </Text>
      ) : null}
      {comanda.fila ? <Text style={{ color: colores.tenue, fontSize: 12 }}>{comanda.fila}</Text> : null}
      {comanda.mensaje ? <Text style={{ color: termino ? colores.rojo : colores.suave, fontSize: 12 }}>{comanda.mensaje}</Text> : null}
      {pregunta ? <PreguntaDelChefEnLaTarjeta pregunta={pregunta} onResponder={onResponder} /> : null}
    </View>
  )
}
