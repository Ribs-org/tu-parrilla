import Link from 'next/link'
import { headers } from 'next/headers'
import { Panel } from '@/components/charts/panel'
import { DeNocheYDeDia } from '@/components/de-noche-y-de-dia'
import { Encabezado } from '@/components/ui'
import { requireUser } from '@/lib/auth'
import { listarLlaves } from '@/lib/llaves'
import { MAX_NOMBRE, PREFIJO } from '@/lib/llaves-api'
import { MANUAL } from '@/lib/vocabulario'
import { BotonRevocar, FormularioLlave } from './llaves'

export const dynamic = 'force-dynamic'

/** Lo que lee tu IA: las guías que sirve `/docs/`, públicas y sin sesión. */
const GUIAS = [
  {
    ruta: '/docs/api-llm.md',
    nombre: 'La guía para tu IA',
    para: 'Qué mandar, qué falla y cómo, y qué no existe. Es lo que tu IA tiene que leer antes de empezar.',
  },
  {
    ruta: '/docs/api-editor.md',
    nombre: 'La guía para personas',
    para: 'La misma API, explicada para quien la programa a mano o le escribe un script.',
  },
  {
    ruta: '/docs/api.json',
    nombre: 'El esquema',
    para: 'La forma exacta de cada campo, para las herramientas que leen OpenAPI.',
  },
  {
    ruta: '/docs/ui/index.md',
    nombre: 'La wiki del panel',
    para: 'Para que tu IA te guíe cuando te pierdas en el panel: cada pantalla, con el texto de cada botón.',
  },
] as const

/** Lo que tu IA hace con la llave: lo que hacen los endpoints de la API, en palabras. */
const LO_QUE_HACE = [
  'Programar publicaciones, de a una o de a cientos, con sus archivos, sus redes y sus reglas de comentarios.',
  'Sacar lo que programaste y todavía no sale.',
  'Leer tu calendario: lo que viene y cómo salió lo que ya se fue.',
  'Leer lo que pide atención: lo que falló, las cuentas por reconectar y las que se quedan sin nada programado.',
  'Leer los números de cada publicación, y cuáles son tu mejor y tu peor 10 %.',
] as const

/**
 * Tu IA: conectar el agente propio —el «chef» que cocina por ti— con una llave y las guías de
 * la API, y abajo el manual del panel para leerlo uno mismo. Pestaña desde el 2026-10-19, a
 * pedido del dueño; las llaves vivían antes en Tu Cuenta.
 */
export default async function TuIaPage() {
  const usuario = await requireUser()
  const llaves = await listarLlaves(usuario.id)

  // La base de la API es el dominio donde está abierto el panel: en producción el panel solo
  // se abre en el del producto (`panelEnElProducto`), y en local o en un preview la llave sirve
  // contra ese mismo despliegue, no contra producción.
  const cabeceras = await headers()
  const host = cabeceras.get('host') ?? 'localhost:3000'
  const protocolo = cabeceras.get('x-forwarded-proto') ?? (host.startsWith('localhost') ? 'http' : 'https')
  const base = `${protocolo}://${host}`

  // Las fechas en la zona de quien mira, como el resto del panel.
  const fecha = new Intl.DateTimeFormat('es-CL', { dateStyle: 'medium', timeZone: usuario.zona })
  const fechaHora = new Intl.DateTimeFormat('es-CL', { dateStyle: 'medium', timeStyle: 'short', timeZone: usuario.zona })

  return (
    <>
      <header className="mb-6">
        <Encabezado ruta="/admin/ia" />
        <p className="mt-1 max-w-2xl text-sm text-fg-muted">
          Tu IA puede programar y leer en Tu Parrilla por ti: le pides «programa estos cinco videos para la
          semana» o «¿qué publicación me trajo más visitas?», y lo hace a tu nombre, sin entrar al panel.
          Sirve cualquier agente que sepa llamar a una API: el que te edita los videos, un asistente con
          herramientas, un script. Son dos pasos.
        </p>
      </header>

      <Panel
        title="1. Su llave"
        hint="Con una llave, tu IA programa posts, los saca, lee tu calendario y tus números a tu nombre, sin entrar al panel."
        className="mb-6"
      >
        <p className="mb-4 max-w-2xl text-sm text-fg-muted">
          Quien tenga la llave puede hacer todo eso con tus cuentas: dásela solo a la IA que la va a usar.
          Una por cada IA: así revocas la de una sin tocar las otras.
        </p>
        <FormularioLlave base={base} maxNombre={MAX_NOMBRE} />
        {llaves.length > 0 ? (
          <ul className="mt-6 divide-y divide-velo/[0.06] border-t border-velo/[0.06]">
            {llaves.map((llave) => (
              <li key={llave.id} className="flex flex-wrap items-center gap-3 py-3 text-sm">
                <span className="min-w-0 flex-1 truncate">{llave.nombre}</span>
                <span className="font-mono text-xs text-fg-faint">
                  {PREFIJO}…{llave.final}
                </span>
                <span className="text-xs text-fg-faint">
                  creada {fecha.format(llave.creadaEn)} ·{' '}
                  {llave.usadaEn ? `usada por última vez ${fechaHora.format(llave.usadaEn)}` : 'sin usar'}
                </span>
                <BotonRevocar id={llave.id} nombre={llave.nombre} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-6 text-sm text-fg-faint">Todavía no tienes llaves.</p>
        )}
      </Panel>

      <Panel
        title="2. Su guía"
        hint="Tu IA no conoce Tu Parrilla: todo lo que sabe hacer acá está en la guía."
        className="mb-6"
      >
        <p className="mb-4 max-w-2xl text-sm text-fg-muted">
          Al generar la llave, «Copiar con instrucciones para tu agente» le pasa todo de una vez: la llave,
          dónde está la API y qué leer. Pégaselo en su chat o en su configuración. Si te pide los enlaces,
          son estos:
        </p>
        <ul className="space-y-3">
          {GUIAS.map((guia) => (
            <li key={guia.ruta} className="text-sm">
              <a href={guia.ruta} target="_blank" rel="noreferrer" className="text-brasa underline-offset-2 hover:underline">
                {guia.nombre}
              </a>
              <span className="ml-2 font-mono text-xs text-fg-faint">
                {base}
                {guia.ruta}
              </span>
              <p className="mt-0.5 text-fg-muted">{guia.para}</p>
            </li>
          ))}
        </ul>
      </Panel>

      <Panel title="Lo que puede hacer" className="mb-10">
        <ul className="max-w-2xl list-disc space-y-1.5 pl-5 text-sm text-fg-muted">
          {LO_QUE_HACE.map((cosa) => (
            <li key={cosa}>{cosa}</li>
          ))}
        </ul>
        <p className="mt-4 max-w-2xl text-sm text-fg-muted">
          Lo que no hace: editar un post ya programado (lo saca y lo programa de nuevo), publicar en el acto,
          conectar tus redes ni cambiar tu página. Eso lo haces tú, en el panel.
        </p>
      </Panel>

      <section className="max-w-2xl border-t border-acero-700 pt-6">
        <h2 className="font-titulo text-sm font-semibold uppercase tracking-[0.08em]">¿Quieres saber más de Tu Parrilla?</h2>
        <p className="mt-2 text-sm text-fg-muted">
          Cada pantalla del panel, botón por botón, con lo que dice cada mensaje y qué hacer con él. Lo
          escribimos para que tu IA te guíe sin ver tu pantalla, y por eso es así de detallado: sirve igual
          para leerlo tú.
        </p>
        <Link
          href="/admin/ia/manual"
          className="mt-3 inline-block font-titulo text-sm font-semibold uppercase tracking-[0.08em] text-brasa hover:underline"
        >
          <DeNocheYDeDia noche={MANUAL.noche} dia={MANUAL.dia} /> →
        </Link>
      </section>
    </>
  )
}
