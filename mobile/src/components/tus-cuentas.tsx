import { Text, View } from 'react-native'
import { Etiqueta, Tarjeta, Vacio } from './ui'
import { useSesion } from './sesion'
import { useColores } from './tema'
import { num } from '../lib/format'
import { NOMBRE_RED, type Cuentas, type Rango } from '../lib/tipos'
import { useScreenData } from '../lib/useScreenData'

/**
 * «Tus cuentas», detrás del «⋯ Más» de Los Números: los seguidores de cada red con lo ganado
 * en el período, las visitas al perfil y el alcance del último día leído, y las visitas al
 * perfil día a día. Era la pestaña Cuentas hasta el 2026-10-16; se monta recién al abrir el
 * «⋯ Más», así que no se pide lo que no se va a ver.
 */
export function TusCuentas({ rango }: { rango: Rango }) {
  const colores = useColores()
  const { token, salir } = useSesion()

  const { data, cargando, error } = useScreenData<Cuentas>(
    `cuentas:${rango}`,
    `/api/mobile/accounts?rango=${rango}`,
    token,
    salir,
  )

  if (!data) {
    return <Text style={{ color: colores.suave, fontSize: 12 }}>{cargando ? 'Cargando tus cuentas…' : (error ?? 'No se pudo cargar.')}</Text>
  }

  const maximo = Math.max(1, ...data.serie.map((p) => p.visitasAlPerfil ?? 0))

  return (
    <View style={{ gap: 12 }}>
      {data.cuentas.length === 0 ? (
        <Vacio texto="Todavía no hay lecturas de cuenta. La primera llega con la sincronización de esta noche." />
      ) : (
        data.cuentas.map((cuenta) => (
          // Una por cuenta: con dos de Instagram, el nombre es lo que las distingue.
          <Tarjeta key={cuenta.id ?? cuenta.red}>
            <Etiqueta>{`${NOMBRE_RED[cuenta.red] ?? cuenta.red}${cuenta.nombre ? ` · ${cuenta.nombre}` : ''}`}</Etiqueta>
            <Text style={{ color: colores.texto, fontSize: 24, fontWeight: '600' }}>{num(cuenta.seguidores)}</Text>
            <Text style={{ color: colores.suave, fontSize: 12 }}>
              seguidores
              {cuenta.seguidoresGanados === null
                ? ' · — en el período'
                : cuenta.seguidoresGanados === 0
                  ? ' · sin cambio'
                  : // El backend acota a cero, así que esto no debería verse hoy: es defensa
                    // para que un negativo salga con su propio signo («-5») y no «+-5».
                    cuenta.seguidoresGanados < 0
                    ? ` · ${num(cuenta.seguidoresGanados)} en el período`
                    : ` · +${num(cuenta.seguidoresGanados)} en el período`}
            </Text>
            <Text style={{ color: colores.tenue, fontSize: 12, marginTop: 4 }}>
              Visitas al perfil{cuenta.dia ? ` (${cuenta.dia})` : ''}: {num(cuenta.visitasAlPerfil)} · Alcance:{' '}
              {num(cuenta.alcance)}
            </Text>
          </Tarjeta>
        ))
      )}

      {data.serie.length > 1 ? (
        <Tarjeta>
          <Etiqueta>Visitas al perfil por día</Etiqueta>
          {/* Barras de vistas planas: una librería de gráficos sería una dependencia nativa
              más que puede romper el build, y esto se lee igual de bien. */}
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 3, height: 80, marginTop: 8 }}>
            {data.serie.map((punto) => (
              <View
                key={punto.fecha}
                style={{
                  flex: 1,
                  height: Math.max(2, ((punto.visitasAlPerfil ?? 0) / maximo) * 76),
                  backgroundColor: punto.visitasAlPerfil === null ? colores.velo + '14' : colores.verde,
                  borderRadius: 2,
                }}
              />
            ))}
          </View>
        </Tarjeta>
      ) : null}
    </View>
  )
}
