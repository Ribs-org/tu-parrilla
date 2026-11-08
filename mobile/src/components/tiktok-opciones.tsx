import { useEffect, useState } from 'react'
import { Linking, Switch, Text, View } from 'react-native'
import { Image } from 'expo-image'
import { RechazoApi, SesionCaducada, apiGet } from '../lib/api'
import {
  BRANDED_CONTENT,
  ETIQUETA_PRIVACIDAD,
  MUSIC_USAGE,
  TEXTOS_TIKTOK as T,
  TIKTOK_CREADOR_ILEGIBLE,
  avisoPatrocinado,
  duracionMaxima,
  elegirComercial,
  lineaDeLaCuenta,
  privacidadesDe,
  videoMuyLargo,
  type CreadorTikTok,
  type TikTokElegido,
} from '../lib/tiktok'
import type { Archivo } from '../lib/publicar'
import type { CuentaApp } from '../lib/tipos'
import { useSesion } from './sesion'
import { useColores } from './tema'
import { Chip } from './ui'

// Cacheada a nivel de módulo, por cuenta, como en el panel: marcar y desmarcar la cuenta o
// cambiar de archivos remonta el bloque, y eso no debe repetir la consulta a `creator_info`. Un
// error limpia la suya para que el siguiente montaje reintente en vez de quedar pegado al fallo.
const creadores = new Map<string, Promise<{ creador: CreadorTikTok } | { error: string }>>()

function leerCreador(token: string, cuentaId: string): Promise<{ creador: CreadorTikTok } | { error: string }> {
  let promesa = creadores.get(cuentaId)
  if (!promesa) {
    promesa = apiGet<{ creador: CreadorTikTok }>(`/api/mobile/schedule/accounts/${encodeURIComponent(cuentaId)}/tiktok`, token)
      .then((r) => ({ creador: r.creador }) as const)
      .catch((e: unknown) => {
        creadores.delete(cuentaId)
        if (e instanceof SesionCaducada) throw e
        return { error: e instanceof RechazoApi ? e.message : TIKTOK_CREADOR_ILEGIBLE }
      })
    creadores.set(cuentaId, promesa)
  }
  return promesa
}

/**
 * El bloque de TikTok de una cuenta marcada en Publicar: lo que TikTok obliga a preguntar antes de
 * publicar directo, en el orden y con los valores iniciales que su guía exige —privacidad sin
 * elegir, interacciones apagadas, comercial apagado—. Es el del panel
 * (`src/app/admin/(dash)/schedule/tiktok-opciones.tsx`), con sus textos; lo elegido vive en
 * Publicar, que lo guarda en el borrador y lo manda al programar.
 *
 * Con `fotos` (todo fotos) esconde dúo y pegar, que TikTok no ofrece en carruseles, y muestra
 * «Música de TikTok», que TikTok solo les pone a las fotos publicadas directo. Con un video dice
 * el largo máximo de la cuenta y avisa en rojo si se pasa: Publicar no deja programarlo.
 */
export function TikTokOpciones({
  cuenta,
  elegido,
  onCambiar,
  onCreador,
  fotos,
  archivos,
  deshabilitado,
}: {
  cuenta: CuentaApp
  elegido: TikTokElegido
  onCambiar: (e: TikTokElegido) => void
  /** Lo que dijo `creator_info`, para que Publicar arme el envío con las casillas bloqueadas. */
  onCreador: (creador: CreadorTikTok | null) => void
  fotos: boolean
  archivos: Archivo[]
  deshabilitado?: boolean
}) {
  const colores = useColores()
  const { token, salir } = useSesion()
  const [creador, setCreador] = useState<CreadorTikTok | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)

  useEffect(() => {
    if (!token) return
    let vivo = true
    leerCreador(token, cuenta.id)
      .then((r) => {
        if (!vivo) return
        if ('error' in r) {
          setAviso(r.error)
          onCreador(null)
        } else {
          setCreador(r.creador)
          onCreador(r.creador)
        }
      })
      .catch(() => {
        if (vivo) void salir()
      })
    return () => {
      vivo = false
    }
    // `onCreador` cambia en cada render de Publicar; la consulta es por cuenta.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cuenta.id, token, salir])

  const cambiar = (cambio: Partial<TikTokElegido>) => onCambiar({ ...elegido, ...cambio })
  const patrocinado = elegido.comercial === 'patrocinado'
  const maxima = fotos ? null : duracionMaxima(creador)
  const muyLargo = fotos ? null : videoMuyLargo(archivos, creador)
  const pista = { color: colores.tenue, fontSize: 11 } as const

  return (
    <View style={{ gap: 12, borderRadius: 12, padding: 14, backgroundColor: colores.velo + '0A' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        {creador?.avatarUrl ? (
          <Image source={{ uri: creador.avatarUrl }} style={{ width: 32, height: 32, borderRadius: 16 }} accessibilityIgnoresInvertColors />
        ) : null}
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={{ color: colores.texto, fontSize: 13, fontWeight: '600' }}>TikTok · {cuenta.handle ?? 'sin nombre'}</Text>
          <Text style={{ color: aviso && !creador ? colores.ambar : colores.suave, fontSize: 12 }}>
            {lineaDeLaCuenta(creador, aviso)}
          </Text>
        </View>
      </View>

      {maxima ? <Text style={pista}>{maxima}</Text> : null}
      {muyLargo ? <Text style={{ color: colores.rojo, fontSize: 12 }}>{muyLargo}</Text> : null}

      <Interruptor
        texto={T.bandeja}
        pista={elegido.borrador ? T.bandejaPista : undefined}
        valor={elegido.borrador}
        onCambiar={(borrador) => cambiar({ borrador })}
        deshabilitado={deshabilitado}
      />

      {elegido.borrador ? null : (
        <>
          <View style={{ gap: 6 }}>
            <Text style={{ color: colores.texto, fontSize: 12, fontWeight: '600' }}>{T.quienPuedeVerlo}</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }} accessibilityRole="radiogroup">
              {privacidadesDe(creador).map((p) => (
                <Chip
                  key={p}
                  texto={ETIQUETA_PRIVACIDAD[p]}
                  activo={elegido.privacidad === p}
                  onPress={() => cambiar({ privacidad: p })}
                  deshabilitado={deshabilitado || (patrocinado && p === 'SELF_ONLY')}
                />
              ))}
            </View>
            {elegido.privacidad === '' ? <Text style={pista}>{T.eligeQuien}</Text> : null}
          </View>

          <View style={{ gap: 6 }}>
            <Text style={{ color: colores.texto, fontSize: 12, fontWeight: '600' }}>{T.permitir}</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
              <Casilla
                texto={T.comentarios}
                marcada={elegido.comentarios}
                bloqueada={creador?.comentariosDeshabilitados}
                onCambiar={(comentarios) => cambiar({ comentarios })}
                deshabilitado={deshabilitado}
              />
              {fotos ? null : (
                <>
                  <Casilla
                    texto={T.duos}
                    marcada={elegido.duo}
                    bloqueada={creador?.duoDeshabilitado}
                    onCambiar={(duo) => cambiar({ duo })}
                    deshabilitado={deshabilitado}
                  />
                  <Casilla
                    texto={T.pegar}
                    marcada={elegido.pegar}
                    bloqueada={creador?.pegarDeshabilitado}
                    onCambiar={(pegar) => cambiar({ pegar })}
                    deshabilitado={deshabilitado}
                  />
                </>
              )}
            </View>
          </View>

          <View style={{ gap: 8 }}>
            <Interruptor
              texto={T.marca}
              valor={elegido.comercial !== 'no'}
              onCambiar={(si) => onCambiar(elegirComercial(elegido, si ? 'marca_propia' : 'no'))}
              deshabilitado={deshabilitado}
            />
            {elegido.comercial === 'no' ? null : (
              <View style={{ gap: 6, paddingLeft: 12 }}>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }} accessibilityRole="radiogroup">
                  <Chip
                    texto={T.miMarca}
                    activo={elegido.comercial === 'marca_propia'}
                    onPress={() => onCambiar(elegirComercial(elegido, 'marca_propia'))}
                    deshabilitado={deshabilitado}
                  />
                  <Chip
                    texto={T.patrocinado}
                    activo={patrocinado}
                    onPress={() => onCambiar(elegirComercial(elegido, 'patrocinado'))}
                    deshabilitado={deshabilitado}
                  />
                </View>
                <Text style={pista}>{patrocinado ? T.patrocinadoPista : T.miMarcaPista}</Text>
                {avisoPatrocinado(elegido) ? (
                  <Text style={{ color: colores.rojo, fontSize: 11 }}>{T.patrocinadoPrivado}</Text>
                ) : null}
              </View>
            )}
          </View>

          <Interruptor
            texto={T.ia}
            pista={elegido.ia ? T.iaEncendida : T.iaApagada}
            valor={elegido.ia}
            onCambiar={(ia) => cambiar({ ia })}
            deshabilitado={deshabilitado}
          />

          {fotos ? (
            <Interruptor
              texto={T.musica}
              pista={T.musicaPista}
              valor={elegido.musica === true}
              onCambiar={(musica) => cambiar({ musica })}
              deshabilitado={deshabilitado}
            />
          ) : null}

          <Text style={pista}>
            Al publicar aceptas la{' '}
            {patrocinado ? (
              <>
                <Enlace texto="Branded Content Policy" url={BRANDED_CONTENT} /> y la{' '}
              </>
            ) : null}
            <Enlace texto="Music Usage Confirmation" url={MUSIC_USAGE} /> de TikTok. {T.despues}
          </Text>
        </>
      )}
    </View>
  )
}

/** Un renglón con su interruptor: el `Toggle` del panel. Lo usa también el bloque de YouTube. */
export function Interruptor({
  texto,
  pista,
  valor,
  onCambiar,
  deshabilitado,
}: {
  texto: string
  pista?: string
  valor: boolean
  onCambiar: (valor: boolean) => void
  deshabilitado?: boolean
}) {
  const colores = useColores()
  return (
    <View style={{ gap: 2 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 44 }}>
        <Text style={{ flex: 1, color: colores.texto, fontSize: 13 }}>{texto}</Text>
        <Switch
          value={valor}
          onValueChange={onCambiar}
          disabled={deshabilitado}
          accessibilityLabel={texto}
          trackColor={{ false: colores.velo + '29', true: colores.brasa }}
          thumbColor={colores.tarjeta}
        />
      </View>
      {pista ? <Text style={{ color: colores.tenue, fontSize: 11 }}>{pista}</Text> : null}
    </View>
  )
}

/**
 * Comentarios, dúos o pegar: apagada al nacer —salvo que un borrador la traiga marcada—, y gris y
 * sin enviar si `creator_info` dice que la cuenta la tiene bloqueada, como en el panel.
 */
function Casilla({
  texto,
  marcada,
  bloqueada,
  onCambiar,
  deshabilitado,
}: {
  texto: string
  marcada: boolean
  bloqueada?: boolean
  onCambiar: (marcada: boolean) => void
  deshabilitado?: boolean
}) {
  return (
    <Chip
      texto={texto}
      activo={marcada && !bloqueada}
      onPress={() => onCambiar(!marcada)}
      deshabilitado={deshabilitado || bloqueada}
    />
  )
}

function Enlace({ texto, url }: { texto: string; url: string }) {
  const colores = useColores()
  return (
    <Text
      accessibilityRole="link"
      onPress={() => void Linking.openURL(url)}
      style={{ color: colores.suave, textDecorationLine: 'underline' }}
    >
      {texto}
    </Text>
  )
}
