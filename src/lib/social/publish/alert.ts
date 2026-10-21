import { env } from '@/lib/env'

export function failureEmail(
  caption: string,
  network: string,
  reason: string,
): { subject: string; text: string } {
  const name = network.charAt(0).toUpperCase() + network.slice(1)
  const excerpt = caption.length > 120 ? `${caption.slice(0, 120)}…` : caption
  return {
    subject: `No se pudo publicar en ${name}`,
    text: `La publicación «${excerpt}» no se pudo publicar en ${name}.\n\nMotivo: ${reason}\n\nRevisa el calendario en /admin/schedule para reprogramarla.`,
  }
}

/** El correo del dueño del post manda; si no hay, el del despliegue. Vacío cuenta como no hay. */
export function destinatario(delDueno: string | undefined): string | undefined {
  return delDueno?.trim() || env('PUBLISH_ALERT_TO')
}

/**
 * Manda un aviso por Resend, con el remitente de los avisos (`PUBLISH_ALERT_FROM`): el del
 * post que se quemó, el de la cuenta que se cayó y el resumen del día. Devuelve si salió.
 *
 * Best-effort by design: the calendar's 'failed' state is the source of truth, and a
 * mail provider outage must never turn into a crashed cron run. Hence the swallow.
 */
export async function enviarAviso(to: string, aviso: { subject: string; text: string }): Promise<boolean> {
  const apiKey = env('RESEND_API_KEY')
  if (!apiKey) return false
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      signal: AbortSignal.timeout(15_000),
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: env('PUBLISH_ALERT_FROM') ?? 'onboarding@resend.dev',
        to,
        subject: aviso.subject,
        text: aviso.text,
      }),
    })
    if (!response.ok) {
      console.error('Resend respondió', response.status, (await response.text()).slice(0, 200))
      return false
    }
    return true
  } catch (error) {
    console.error('No se pudo enviar el aviso:', error)
    return false
  }
}

export async function sendFailureAlert(
  para: string | undefined,
  caption: string,
  network: string,
  reason: string,
): Promise<void> {
  // Al dueño del post, no al del despliegue: el fallo es de su publicación.
  const to = destinatario(para)
  if (!to) return
  await enviarAviso(to, failureEmail(caption, network, reason))
}
