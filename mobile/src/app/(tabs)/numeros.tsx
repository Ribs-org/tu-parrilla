import { useState } from 'react'
import { Pressable, ScrollView, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import { TusCuentas } from '../../components/tus-cuentas'
import { Boton, Cargando, Chip, ErrorConReintento, Etiqueta, Pantalla, Sello, TIPO_TITULO, Tarjeta } from '../../components/ui'
import { useSesion } from '../../components/sesion'
import { useColores } from '../../components/tema'
import { POST_ABIERTO, writeCache } from '../../lib/cache'
import { cambio, num } from '../../lib/format'
import { ETIQUETA_RANGO, NOMBRE_RED, RANGOS, type CuentaNombrada, type Numeros, type PostMetrica, type Rango } from '../../lib/tipos'
import { useScreenData } from '../../lib/useScreenData'

function nombreDeCuenta(cuenta: CuentaNombrada | null, red: string | null): string {
  const nombreRed = red ? (NOMBRE_RED[red] ?? red) : ''
  if (!cuenta) return nombreRed
  return cuenta.nombre ? `${NOMBRE_RED[cuenta.red] ?? cuenta.red} · ${cuenta.nombre}` : (NOMBRE_RED[cuenta.red] ?? cuenta.red)
}

/** Una cifra con su aclaración debajo, como las del tablero del panel. */
function CifraConNota({ etiqueta, valor, nota }: { etiqueta: string; valor: string; nota: React.ReactNode }) {
  const colores = useColores()
  return (
    <View style={{ flex: 1, gap: 2 }}>
      <Etiqueta>{etiqueta}</Etiqueta>
      {/* La cifra en la fuente del sistema: Oswald es condensada y los números salen apretados. */}
      <Text style={{ color: colores.texto, fontSize: 24, fontWeight: '600' }}>{valor}</Text>
      {nota}
    </View>
  )
}

function NotaCambio({ valor }: { valor: number | null }) {
  const colores = useColores()
  const c = cambio(valor)
  if (!c) return <Text style={{ color: colores.suave, fontSize: 12 }}>—</Text>
  const color = c.sube === null ? colores.suave : c.sube ? colores.verde : colores.rojo
  const flecha = c.sube === null ? '→' : c.sube ? '↑' : '↓'
  return (
    <Text style={{ color, fontSize: 12 }}>
      {flecha} {c.texto} <Text style={{ color: colores.suave }}>vs. período anterior</Text>
    </Text>
  )
}

/** Una fila de una lista corta, con una barra detrás que compara con la primera. */
function FilaConBarra({ texto, nota, valor, proporcion, onPress }: {
  texto: string
  nota: string
  valor: string
  proporcion: number
  onPress?: () => void
}) {
  const colores = useColores()
  const cuerpo = (
    <View style={{ borderRadius: 8, overflow: 'hidden', backgroundColor: colores.velo + '08' }}>
      <View
        style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: `${Math.max(4, proporcion * 100)}%`, backgroundColor: colores.brasa + '33' }}
      />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10 }}>
        <View style={{ flex: 1 }}>
          <Text style={{ color: colores.texto, fontSize: 14 }} numberOfLines={1}>
            {texto}
          </Text>
          {nota ? (
            <Text style={{ color: colores.suave, fontSize: 11 }} numberOfLines={1}>
              {nota}
            </Text>
          ) : null}
        </View>
        <Text style={{ color: colores.texto, fontSize: 14, fontWeight: '600' }}>{valor}</Text>
      </View>
    </View>
  )
  return onPress ? (
    <Pressable onPress={onPress} accessibilityRole="button" style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
      {cuerpo}
    </Pressable>
  ) : (
    cuerpo
  )
}

function TituloDeMitad({ titulo, bajada }: { titulo: string; bajada: string }) {
  const colores = useColores()
  return (
    <View style={{ gap: 2 }}>
      <Text style={{ color: colores.texto, fontFamily: TIPO_TITULO, fontSize: 16, letterSpacing: 1, textTransform: 'uppercase' }}>
        {titulo}
      </Text>
      <Text style={{ color: colores.suave, fontSize: 12 }}>{bajada}</Text>
    </View>
  )
}

/**
 * Los Números, como el tablero del panel: dos mitades que miden cosas distintas y lo dicen.
 * «En las redes» es lo que hicieron las publicaciones donde se publicaron, y lo cuentan las
 * redes; «En tu página» es quién entró a la página de links y qué apretó, y lo cuenta Tu
 * Parrilla. Junta lo que antes eran el Resumen, Contenido y Cuentas: la lista de
 * publicaciones queda un toque adentro, y las cuentas detrás de «⋯ Más».
 */
export default function LosNumeros() {
  const colores = useColores()
  const [rango, setRango] = useState<Rango>('30d')
  const [cuenta, setCuenta] = useState<string | null>(null)
  const [mas, setMas] = useState(false)
  const { token, salir } = useSesion()
  const router = useRouter()

  const { data, cargando, error, sello, refrescar } = useScreenData<Numeros>(
    `numeros:${rango}:${cuenta ?? 'todas'}`,
    `/api/mobile/numeros?rango=${rango}${cuenta ? `&cuenta=${encodeURIComponent(cuenta)}` : ''}`,
    token,
    salir,
  )

  async function abrir(post: PostMetrica) {
    await writeCache(POST_ABIERTO, post)
    router.push({ pathname: '/post/[id]', params: { id: post.externalId, red: post.red } })
  }

  if (!data && cargando) return <Cargando />
  if (!data) {
    return (
      <Pantalla refrescando={cargando} onRefrescar={refrescar}>
        <ErrorConReintento mensaje={error ?? 'No se pudo cargar.'} onReintentar={refrescar} />
      </Pantalla>
    )
  }

  const { redes, pagina } = data
  const maxCrecio = Math.max(1, ...redes.loQueMasCrecio.map((p) => p.metricas.viewsGanadas ?? 0))
  const maxGente = Math.max(1, ...pagina.queTeTrajoGente.map((e) => e.visitas))

  return (
    <Pantalla refrescando={cargando} onRefrescar={refrescar}>
      <Text style={{ color: colores.suave, fontSize: 13 }}>cómo te fue en las redes y en tu página</Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
        {RANGOS.map((r) => (
          <Chip key={r} texto={ETIQUETA_RANGO[r]} activo={rango === r} onPress={() => setRango(r)} />
        ))}
      </ScrollView>
      {data.cuentas.length > 1 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
          <Chip texto="Todas las cuentas" activo={cuenta === null} onPress={() => setCuenta(null)} />
          {data.cuentas.map((c) => (
            <Chip key={c.id} texto={nombreDeCuenta(c, null)} activo={cuenta === c.id} onPress={() => setCuenta(c.id)} />
          ))}
        </ScrollView>
      ) : null}
      <Sello texto={sello} />

      <Tarjeta>
        <TituloDeMitad titulo="En las redes" bajada="Lo que hicieron tus publicaciones donde las publicaste. Lo cuentan las redes." />
        <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
          <CifraConNota
            etiqueta="Views ganadas"
            valor={num(redes.viewsGanadas)}
            nota={<Text style={{ color: colores.suave, fontSize: 12 }}>En el período · sin YouTube</Text>}
          />
          <CifraConNota
            etiqueta="Seguidores ganados"
            valor={redes.seguidoresGanados === null ? '—' : `${redes.seguidoresGanados > 0 ? '+' : ''}${num(redes.seguidoresGanados)}`}
            nota={<Text style={{ color: colores.suave, fontSize: 12 }}>En el período · sin YouTube</Text>}
          />
        </View>
        <Etiqueta margenArriba>Lo que más creció</Etiqueta>
        {redes.loQueMasCrecio.length === 0 ? (
          <Text style={{ color: colores.suave, fontSize: 13 }}>
            Ninguna publicación ganó views en este período. Las métricas llegan con la sincronización diaria, así que lo
            publicado hoy aparece mañana.
          </Text>
        ) : (
          <View style={{ gap: 6 }}>
            {redes.loQueMasCrecio.map((post) => (
              <FilaConBarra
                key={`${post.red}:${post.externalId}`}
                texto={post.texto || post.etiqueta}
                nota={nombreDeCuenta(post.cuenta, post.red)}
                valor={num(post.metricas.viewsGanadas)}
                proporcion={(post.metricas.viewsGanadas ?? 0) / maxCrecio}
                onPress={() => void abrir(post)}
              />
            ))}
          </View>
        )}
        <View style={{ flexDirection: 'row', marginTop: 6 }}>
          <Boton texto="Ver todas las publicaciones →" onPress={() => router.push('/publicaciones')} />
        </View>
      </Tarjeta>

      <Tarjeta>
        <TituloDeMitad titulo="En tu página" bajada="Quién entró a tu página de links y qué apretó. Lo cuenta Tu Parrilla, sin cookies." />
        <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
          <CifraConNota etiqueta="Visitas" valor={num(pagina.visitas)} nota={<NotaCambio valor={pagina.cambioVisitas} />} />
          <CifraConNota etiqueta="Clicks en tus links" valor={num(pagina.clicks)} nota={<NotaCambio valor={pagina.cambioClicks} />} />
        </View>
        <Etiqueta margenArriba>Qué publicación te trajo gente</Etiqueta>
        {pagina.queTeTrajoGente.length === 0 ? (
          <Text style={{ color: colores.suave, fontSize: 13 }}>Ninguna visita llegó todavía por el link de una publicación.</Text>
        ) : (
          <View style={{ gap: 6 }}>
            {pagina.queTeTrajoGente.map((e) => (
              <FilaConBarra
                key={e.etiqueta}
                texto={e.texto || `?s=${e.etiqueta}`}
                nota={e.texto ? nombreDeCuenta(e.cuenta, e.red) : ''}
                valor={num(e.visitas)}
                proporcion={e.visitas / maxGente}
              />
            ))}
          </View>
        )}
      </Tarjeta>

      <View style={{ flexDirection: 'row' }}>
        <Boton texto={mas ? 'Menos' : '⋯ Más: tus cuentas'} onPress={() => setMas(!mas)} />
      </View>
      {mas ? <TusCuentas rango={rango} /> : null}
    </Pantalla>
  )
}
