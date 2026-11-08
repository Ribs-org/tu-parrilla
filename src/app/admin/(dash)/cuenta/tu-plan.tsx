import { DeNocheYDeDia } from '@/components/de-noche-y-de-dia'
import { pesoEnPalabras } from '@/lib/cocina/bodega'
import { enMiles, enPesos, type Plan } from '@/lib/planes/plan'
import type { UsoDelPlan } from '@/lib/planes/uso'
import { CAMARA } from '@/lib/vocabulario'

// «Tu plan», en Tu Cuenta: el plan que rige, lo que lleva usado de cada tope y, desde el gratis, lo
// que trae el pagado. Sin botones: por ahora el pagado lo da el equipo, desde Los Maestros.

const deTope = (usado: number, tope: number | null) => (tope === null ? `${enMiles(usado)}, sin tope` : `${enMiles(usado)} de ${enMiles(tope)}`)

/** Lo que trae un plan, en una frase: «15 cuentas, sin tope en la parrilla, 100 GB…». */
function loQueTrae(plan: Plan, camara: { noche: string; dia: string }, conPrioridad: boolean) {
  const cuentas = plan.cuentasMax === null ? 'cuentas sin tope' : `${enMiles(plan.cuentasMax)} cuentas`
  const parrilla =
    plan.enLaParrillaMax === null ? 'sin tope en la parrilla' : `${enMiles(plan.enLaParrillaMax)} publicaciones esperando a la vez`
  const tokens = plan.tokensMes === null ? 'tokens de IA sin tope' : `${enMiles(plan.tokensMes)} tokens de IA al mes`
  return (
    <>
      {cuentas}, {parrilla}, {pesoEnPalabras(plan.bodegaBytes)} en{' '}
      <DeNocheYDeDia noche={camara.noche.toLowerCase()} dia={camara.dia.toLowerCase()} /> y {tokens}
      {conPrioridad ? ', con prioridad en las colas' : ''}
    </>
  )
}

export function TuPlan({ uso, fecha }: { uso: UsoDelPlan; fecha: (d: Date) => string }) {
  const { plan, persona, planes } = uso
  const vencido = persona.plan !== 'gratis' && plan.clave === 'gratis'
  const primero = plan.prioridad > planes.gratis.prioridad

  return (
    <div className="space-y-4 text-sm">
      <p>
        Tienes el plan <span className="font-semibold">{plan.nombre}</span>
        {plan.clave !== 'gratis' && persona.planHasta ? `, hasta el ${fecha(persona.planHasta)}` : ''}
        {plan.clave !== 'gratis' && persona.planOrigen === 'cortesia' ? ', de cortesía' : ''}.
        {vencido && persona.planHasta ? ` Tu ${planes[persona.plan].nombre} terminó el ${fecha(persona.planHasta)}.` : ''}
      </p>

      <dl className="grid gap-x-6 gap-y-2 sm:grid-cols-[auto_1fr]">
        <dt className="text-fg-muted">Cuentas conectadas</dt>
        <dd className="font-mono">{deTope(uso.cuentas, plan.cuentasMax)}</dd>
        <dt className="text-fg-muted">Esperando en la parrilla</dt>
        <dd className="font-mono">{deTope(uso.enLaParrilla, plan.enLaParrillaMax)}</dd>
        <dt className="text-fg-muted">
          <DeNocheYDeDia noche={CAMARA.noche} dia={CAMARA.dia} />
        </dt>
        <dd className="font-mono">
          {pesoEnPalabras(uso.camara.ocupados)} de {pesoEnPalabras(uso.camara.cuota)}
        </dd>
        <dt className="text-fg-muted">Tokens de IA este mes</dt>
        <dd className="font-mono">{deTope(uso.tokens, plan.tokensMes)}</dd>
        <dt className="text-fg-muted">En las colas</dt>
        <dd>{primero ? 'Pasas primero' : 'Por orden de llegada'}</dd>
      </dl>

      <p className="text-fg-faint">
        Llegar a un tope no borra ni desconecta nada: lo que ya está sigue, y lo nuevo espera a que haya lugar. Los tokens
        se cuentan en los borradores de La Mesa y en «Sugiéreme una», y vuelven a cero cada mes.
      </p>

      {plan.clave === 'gratis' ? (
        <p className="rounded-lg bg-velo/[0.04] p-3">
          El plan <span className="font-semibold">{planes.pagado.nombre}</span> cuesta {enPesos(planes.pagado.precioClp)} al mes y
          trae {loQueTrae(planes.pagado, CAMARA, planes.pagado.prioridad > planes.gratis.prioridad)}. Por ahora lo da el
          equipo de Tu Parrilla.
        </p>
      ) : null}
    </div>
  )
}
