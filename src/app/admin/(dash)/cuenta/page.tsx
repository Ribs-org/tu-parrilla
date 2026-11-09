import Link from 'next/link'
import { Panel } from '@/components/charts/panel'
import { Encabezado } from '@/components/ui'
import { leerAjuste } from '@/lib/ajustes'
import { requireUser } from '@/lib/auth'
import { CLAVE_CORREOS_DE_LA_COCINA, correosApagados } from '@/lib/cocina/correo-de-comanda'
import { usoDelPlan } from '@/lib/planes/uso'
import { mercadoPagoConfigurado } from '@/lib/pagos/mercadopago'
import { alVolverDeMercadoPago, suscripcionVivaDe } from '@/lib/pagos/suscripciones'
import { pagosAbiertosPara } from '@/lib/redes-abiertas'
import { nombreDe } from '@/lib/vocabulario'
import { horaEn, zonasDisponibles } from '@/lib/zona'
import { CorreosDeLaCocina } from './correos-de-la-cocina'
import { FormularioCuenta } from './formulario'
import { TuPlan } from './tu-plan'

export const dynamic = 'force-dynamic'

export default async function CuentaPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const usuario = await requireUser()
  // De vuelta de Mercado Pago: la suscripción se lee antes de dibujar, sin esperar el webhook.
  const vuelta = (await searchParams).plan === 'vuelta'
  if (vuelta) await alVolverDeMercadoPago(usuario.id)
  const uso = await usoDelPlan(usuario.id)
  const viva = await suscripcionVivaDe(usuario.id)
  const correos = usuario.cocinaDesde ? await leerAjuste(usuario.id, CLAVE_CORREOS_DE_LA_COCINA) : null
  const FECHA = new Intl.DateTimeFormat('es-CL', { dateStyle: 'medium', timeZone: usuario.zona })

  return (
    <>
      <header className="mb-6">
        <Encabezado ruta="/admin/cuenta" />
        <p className="mt-1 text-sm text-fg-muted">
          Con qué nombre apareces, en qué zona horaria vives y qué plan tienes. El correo con el que entras no se
          cambia acá.
          Las llaves para tu IA están en{' '}
          {/* Vivían acá hasta el 2026-10-19: quien las busca por costumbre encuentra adónde se fueron. */}
          <Link href="/admin/ia" className="text-brasa underline-offset-2 hover:underline">
            {nombreDe('/admin/ia')}
          </Link>
          , en «Tu propio chef».
        </p>
      </header>
      <Panel title="Tus datos">
        <FormularioCuenta
          nombre={usuario.nombre}
          zona={usuario.zona}
          zonas={zonasDisponibles()}
          // La hora se calcula acá, en el servidor, y no en el navegador: el reloj del
          // computador puede estar en otra zona (o mal), y lo que hay que mostrar es lo que
          // el servidor entiende por «ahora» en la zona guardada. Tras guardar, el
          // `revalidatePath` de la acción vuelve a pintar esta página y la trae nueva.
          ahora={horaEn(usuario.zona, new Date())}
        />
      </Panel>
      <Panel title="Tu plan" className="mt-6">
        <TuPlan
          uso={uso}
          fecha={(d) => FECHA.format(d)}
          cobro={{
            abierto: pagosAbiertosPara(usuario.id) && mercadoPagoConfigurado(),
            viva: viva ? { estado: viva.estado, proximoCobro: viva.proximoCobro, correoPagador: viva.correoPagador } : null,
            vuelta,
            correo: usuario.correo,
          }}
        />
      </Panel>
      {/* Solo con la cocina: sin ella no hay comandas que avisen. */}
      {usuario.cocinaDesde ? (
        <Panel title="Los correos de La Cocina" className="mt-6">
          <CorreosDeLaCocina encendidos={!correosApagados(correos)} />
        </Panel>
      ) : null}
    </>
  )
}
