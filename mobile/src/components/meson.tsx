import { useState, type ComponentType } from 'react'
import { Linking, Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import { Image } from 'expo-image'
import {
  datosDelCreativo,
  imagenesDe,
  sePuedeDescartar,
  videoDe,
  type CreativoDelMeson,
  type MotivoDeDescarte,
} from '../lib/meson'
import { hayVideoNativo } from '../lib/video'
import { useColores } from './tema'
import { Boton, BotonTexto, Chip } from './ui'

/*
 * Un creativo del mesón en el teléfono, como la tarjeta del panel (`TarjetaDelCreativo`): el video
 * que se reproduce ahí mismo con su portada, o las láminas del carrusel; cuándo se borra, en su última
 * semana; su estilo y lo que rotó; el título de YouTube y el texto que propone el chef; y «Programar» y
 * «Descartar», que pide el motivo de un toque y, si se quiere, una nota.
 */

/** El reproductor de `expo-video`, solo si esta app lo trae: ver `lib/video.ts`. */
const VideoDelCreativo: ComponentType<{ url: string }> | null = hayVideoNativo()
  ? // eslint-disable-next-line @typescript-eslint/no-require-imports
    (require('./video-del-creativo') as typeof import('./video-del-creativo')).VideoDelCreativo
  : null

/** El video: la portada con «▶ Ver el video», y al tocarla el reproductor (o afuera, sin él). */
function ElVideo({ url, portada }: { url: string; portada: string | null }) {
  const colores = useColores()
  const [viendo, setViendo] = useState(false)
  return (
    <View style={{ width: '100%', maxWidth: 200, aspectRatio: 9 / 16, alignSelf: 'center', borderRadius: 12, overflow: 'hidden', backgroundColor: '#000' }}>
      {viendo && VideoDelCreativo ? (
        <VideoDelCreativo url={url} />
      ) : (
        <Pressable
          onPress={() => (VideoDelCreativo ? setViendo(true) : void Linking.openURL(url))}
          accessibilityRole="button"
          accessibilityLabel="Ver el video"
          style={({ pressed }) => ({ flex: 1, opacity: pressed ? 0.8 : 1 })}
        >
          {portada ? <Image source={{ uri: portada }} style={{ position: 'absolute', inset: 0 }} contentFit="cover" /> : null}
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <View style={{ backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 999, paddingHorizontal: 16, paddingVertical: 10 }}>
              <Text style={{ color: '#fff', fontWeight: '600' }}>▶ Ver el video</Text>
            </View>
          </View>
        </Pressable>
      )}
      {!VideoDelCreativo ? (
        <Text style={{ position: 'absolute', bottom: 6, left: 8, right: 8, color: colores.tenue, fontSize: 11, textAlign: 'center' }}>
          Se abre fuera de la app.
        </Text>
      ) : null}
    </View>
  )
}

/** Las láminas: la primera grande, con cuántas son, y las demás en fila. */
function LasLaminas({ urls }: { urls: string[] }) {
  if (urls.length === 0) return null
  return (
    <View style={{ gap: 6 }}>
      <View style={{ width: '100%', aspectRatio: 4 / 5, borderRadius: 12, overflow: 'hidden' }}>
        <Image source={{ uri: urls[0] }} style={{ flex: 1 }} contentFit="cover" />
        {urls.length > 1 ? (
          <View style={{ position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.7)', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 }}>
            <Text style={{ color: '#fff', fontSize: 12 }}>{urls.length} láminas</Text>
          </View>
        ) : null}
      </View>
      {urls.length > 1 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
          {urls.slice(1).map((u) => (
            <Image key={u} source={{ uri: u }} style={{ width: 44, height: 56, borderRadius: 6 }} contentFit="cover" />
          ))}
        </ScrollView>
      ) : null}
    </View>
  )
}

export function TarjetaDelCreativo({
  creativo: c,
  motivos,
  maxNota,
  onProgramar,
  onDescartar,
}: {
  creativo: CreativoDelMeson
  motivos: MotivoDeDescarte[]
  maxNota: number
  /** Devuelven la frase del error, o null si salió. */
  onProgramar: (id: string) => Promise<string | null>
  onDescartar: (id: string, motivo: string, nota: string) => Promise<string | null>
}) {
  const colores = useColores()
  const [verTexto, setVerTexto] = useState(false)
  const [descartando, setDescartando] = useState(false)
  const [motivo, setMotivo] = useState<string | null>(null)
  const [nota, setNota] = useState('')
  const [trabajando, setTrabajando] = useState<'programar' | 'descartar' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const video = videoDe(c)

  async function hacer(que: 'programar' | 'descartar') {
    setTrabajando(que)
    setError(null)
    const fallo = que === 'programar' ? await onProgramar(c.id) : await onDescartar(c.id, motivo!, nota)
    setError(fallo)
    setTrabajando(null)
  }

  return (
    <View style={{ backgroundColor: colores.tarjeta, borderRadius: 16, padding: 12, gap: 8 }}>
      {video ? <ElVideo url={video} portada={c.portadaUrl} /> : <LasLaminas urls={imagenesDe(c)} />}
      {c.seBorra ? <Text style={{ color: colores.ambar, fontSize: 12 }}>{c.seBorra}</Text> : null}
      <Text style={{ color: colores.tenue, fontSize: 12 }}>{datosDelCreativo(c)}</Text>
      {c.atributos.length > 0 ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
          {c.atributos.map((a) => (
            <Text key={a} style={{ color: colores.suave, fontSize: 11, backgroundColor: colores.velo + '14', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 }}>
              {a}
            </Text>
          ))}
        </View>
      ) : null}
      {c.tituloYoutube ? (
        <Text style={{ color: colores.texto, fontSize: 13 }}>
          <Text style={{ color: colores.tenue, fontSize: 12 }}>Título de YouTube: </Text>
          {c.tituloYoutube}
        </Text>
      ) : null}
      {c.texto ? (
        <>
          <Pressable
            onPress={() => setVerTexto(!verTexto)}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityState={{ expanded: verTexto }}
            style={({ pressed }) => ({ minHeight: 32, justifyContent: 'center', opacity: pressed ? 0.6 : 1 })}
          >
            <Text style={{ color: colores.suave, fontSize: 12, fontWeight: '600' }}>{verTexto ? 'El texto ▴' : 'El texto ▾'}</Text>
          </Pressable>
          {verTexto ? <Text style={{ color: colores.suave, fontSize: 13, lineHeight: 19 }}>{c.texto}</Text> : null}
        </>
      ) : (
        <Text style={{ color: colores.tenue, fontSize: 12 }}>Sin texto</Text>
      )}

      {descartando ? (
        <View style={{ gap: 8, borderTopWidth: 1, borderTopColor: colores.acero, paddingTop: 10 }}>
          <Text style={{ color: colores.suave, fontSize: 12 }}>¿Por qué no sirvió?</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }} accessibilityLabel="El motivo">
            {motivos.map((m) => (
              <Chip key={m.valor} texto={m.nombre} activo={motivo === m.valor} onPress={() => setMotivo(m.valor)} deshabilitado={trabajando !== null} />
            ))}
          </View>
          <TextInput
            value={nota}
            onChangeText={setNota}
            multiline
            maxLength={maxNota}
            editable={trabajando === null}
            placeholder="Una nota para el chef (opcional)"
            placeholderTextColor={colores.tenue}
            accessibilityLabel="Una nota para el chef"
            style={{ backgroundColor: colores.fondo, color: colores.texto, borderRadius: 12, padding: 12, minHeight: 64, textAlignVertical: 'top', fontSize: 14 }}
          />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Boton
              texto={trabajando === 'descartar' ? 'Descartando…' : 'Descartar'}
              peligro
              deshabilitado={!sePuedeDescartar(motivo, nota, maxNota) || trabajando !== null}
              onPress={() => void hacer('descartar')}
            />
            <BotonTexto texto="Volver" deshabilitado={trabajando !== null} onPress={() => setDescartando(false)} />
          </View>
        </View>
      ) : (
        <View style={{ borderTopWidth: 1, borderTopColor: colores.acero, paddingTop: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Boton
              texto={trabajando === 'programar' ? 'Abriendo…' : 'Programar'}
              destacado
              deshabilitado={trabajando !== null}
              onPress={() => void hacer('programar')}
            />
            <BotonTexto texto="Descartar" peligro deshabilitado={trabajando !== null} onPress={() => setDescartando(true)} />
          </View>
        </View>
      )}
      {error ? <Text style={{ color: colores.rojo, fontSize: 12 }}>{error}</Text> : null}
    </View>
  )
}
