import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Panel } from '@/components/charts/panel'
import { NombreDe } from '@/components/de-noche-y-de-dia'
import { requireUser } from '@/lib/auth'
import { enlaceDeLaPaginaPrincipal, tienePagina } from '@/lib/enlace-de-la-pagina'
import { networkLabel } from '@/lib/networks'
import { promocionarAbiertoPara } from '@/lib/redes-abiertas'
import { dayKey } from '@/lib/schedule-week'
import { anunciante, motivoNoPromocionable, promocionable } from '@/lib/social/promocionar-meta'
import { esUuid } from '@/lib/uuid'
import { FormularioPromocion } from './formulario'

export const dynamic = 'force-dynamic'

/**
 * «Promocionar»: una publicación ya publicada del dueño, en Instagram o Facebook, convertida en un
 * anuncio de su cuenta publicitaria. Solo se llega desde la pieza, y solo con
 * `promocionarAbiertoPara`. Nada se crea hasta el último botón del formulario.
 */
export default async function PromocionarPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { id: ownerId, zona } = await requireUser()
  if (!promocionarAbiertoPara(ownerId) || !esUuid(id)) notFound()
  const p = await promocionable(ownerId, id)
  if (!p) notFound()

  const quien = await anunciante(ownerId)
  const motivo = await motivoNoPromocionable(p)
  const enlace =
    p.post.network === 'instagram' && (await tienePagina(ownerId))
      ? `${await enlaceDeLaPaginaPrincipal(ownerId)}?s=${encodeURIComponent(p.post.campaign)}`
      : null
  const red = networkLabel(p.post.network)

  return (
    <>
      <header className="mb-4">
        <Link
          href={`/admin/analytics/publicaciones/${p.post.id}`}
          className="inline-flex items-center gap-1 text-[0.8rem] text-fg-muted transition-colors hover:text-fg"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
          La pieza
        </Link>
        <p className="mt-2 font-mono text-[0.65rem] uppercase tracking-[0.16em] text-fg-faint">Promocionar en {red}</p>
        <h1 className="line-clamp-2 max-w-3xl font-titulo text-2xl font-semibold uppercase tracking-[0.03em]">
          {p.post.caption || `?s=${p.post.campaign}`}
        </h1>
        <p className="mt-0.5 max-w-2xl text-[0.8rem] text-fg-muted">
          Un anuncio de esta publicación, tal como está, pagado con tu cuenta publicitaria de Meta. Antes de crear
          nada te mostramos lo máximo que puedes gastar y te preguntamos. Cómo le va lo ves en{' '}
          <NombreDe ruta="/admin/analytics" />, en «Lo pagado».
        </p>
      </header>

      {'error' in quien ? (
        <Panel title="No se puede promocionar todavía">
          <p role="alert" className="text-sm text-negative">
            {quien.error}
          </p>
        </Panel>
      ) : quien.cuentas.length === 0 ? (
        <Panel title="No tienes una cuenta publicitaria">
          <p className="max-w-2xl text-sm text-fg-muted">
            Para pagar una promoción hace falta una cuenta publicitaria de Meta. Créala en el Administrador de anuncios
            (adsmanager.facebook.com) con el mismo Facebook con que conectaste, agrégale un medio de pago y vuelve.
          </p>
        </Panel>
      ) : motivo ? (
        <Panel title="Esta publicación no se puede promocionar">
          <p role="alert" className="text-sm text-negative">
            {motivo}
          </p>
        </Panel>
      ) : (
        <FormularioPromocion
          postId={p.post.id}
          network={p.post.network as 'instagram' | 'facebook'}
          cuentas={quien.cuentas}
          hoy={dayKey(new Date(), zona)}
          enlace={enlace}
        />
      )}
    </>
  )
}
