/**
 * Las redes que conoce la app. Viven acá y no en el esquema (`db/schema.ts`, que las
 * reexporta) porque lo que corre en el navegador las necesita, y el esquema arrastra
 * `drizzle-orm`: importarlas de ahí mandaba el ORM entero al navegador.
 */
export const SOCIAL_NETWORKS = ['instagram', 'tiktok', 'youtube', 'facebook', 'threads', 'x'] as const
export type SocialNetwork = (typeof SOCIAL_NETWORKS)[number]

/**
 * Maps a referrer hostname to a normalised traffic source.
 *
 * Instagram and TikTok open links in an embedded browser that usually strips the
 * referrer, so this only catches part of the traffic. The `?s=` campaign tag is the
 * reliable attribution mechanism — see `docs/superpowers/specs`.
 */
const HOSTNAME_PATTERNS: Array<[RegExp, string]> = [
  [/(^|\.)instagram\.com$/, 'instagram'],
  [/(^|\.)l\.instagram\.com$/, 'instagram'],
  [/(^|\.)tiktok\.com$/, 'tiktok'],
  [/(^|\.)(twitter|x)\.com$/, 'x'],
  [/(^|\.)t\.co$/, 'x'],
  [/(^|\.)youtube\.com$/, 'youtube'],
  [/(^|\.)youtu\.be$/, 'youtube'],
  [/(^|\.)facebook\.com$/, 'facebook'],
  [/(^|\.)linkedin\.com$/, 'linkedin'],
  [/(^|\.)lnkd\.in$/, 'linkedin'],
  [/(^|\.)threads\.(net|com)$/, 'threads'],
  [/(^|\.)whatsapp\.com$/, 'whatsapp'],
  [/(^|\.)wa\.me$/, 'whatsapp'],
  [/(^|\.)t\.me$/, 'telegram'],
  [/(^|\.)telegram\.(me|org)$/, 'telegram'],
  [/(^|\.)reddit\.com$/, 'reddit'],
  [/(^|\.)pinterest\.[a-z.]+$/, 'pinterest'],
  [/(^|\.)discord\.(com|gg)$/, 'discord'],
  [/(^|\.)substack\.com$/, 'substack'],
  [/(^|\.)github\.com$/, 'github'],
  [/(^|\.)google\.[a-z.]+$/, 'google'],
  [/(^|\.)bing\.com$/, 'bing'],
  [/(^|\.)duckduckgo\.com$/, 'duckduckgo'],
  [/(^|\.)mail\.[a-z.]+$/, 'email'],
]

export const NETWORK_LABELS: Record<string, string> = {
  instagram: 'Instagram',
  tiktok: 'TikTok',
  x: 'X / Twitter',
  youtube: 'YouTube',
  facebook: 'Facebook',
  linkedin: 'LinkedIn',
  threads: 'Threads',
  whatsapp: 'WhatsApp',
  telegram: 'Telegram',
  reddit: 'Reddit',
  pinterest: 'Pinterest',
  discord: 'Discord',
  substack: 'Substack',
  github: 'GitHub',
  google: 'Google',
  bing: 'Bing',
  duckduckgo: 'DuckDuckGo',
  email: 'Email',
  direct: 'Directo',
  other: 'Otro',
}

export function networkLabel(key: string | null | undefined): string {
  if (!key) return NETWORK_LABELS.direct
  return NETWORK_LABELS[key] ?? key
}

/**
 * `utmSource` wins over the referrer header: an explicit tag is a stronger signal
 * than a hostname, and survives the in-app browsers that strip referrers.
 */
export function detectNetwork(
  referrer: string | null,
  utmSource: string | null,
): string {
  if (utmSource) {
    const normalised = utmSource.toLowerCase().trim()
    if (normalised in NETWORK_LABELS) return normalised
    if (normalised === 'ig') return 'instagram'
    if (normalised === 'tt') return 'tiktok'
    if (normalised === 'yt') return 'youtube'
    if (normalised === 'twitter') return 'x'
    return normalised
  }

  if (!referrer) return 'direct'

  let hostname: string
  try {
    hostname = new URL(referrer).hostname.toLowerCase()
  } catch {
    return 'other'
  }

  for (const [pattern, network] of HOSTNAME_PATTERNS) {
    if (pattern.test(hostname)) return network
  }
  return 'other'
}

/**
 * Lo que cada red exige o limita hoy, dicho junto al botón de conectar y no después del
 * error. Frases fijas: cada una tiene test letra por letra. La de Meta en revisión va
 * aparte porque se apaga sola al quitar `META_EN_REVISION` cuando la app pase a Live.
 *
 * TikTok ya no lleva aviso: la auditoría de Direct Post se aprobó (aviso del 2026-10-06), y
 * cualquier cuenta publica con la privacidad que elija. YouTube tampoco: según su
 * documentación, un proyecto sin la auditoría de cuota sube todo en privado, pero a este no
 * se le aplica —el 2026-10-09 y el 2026-10-16 lo subido salió público—, así que el aviso
 * «sale privado» decía algo falso. Si un día un video sale «Privado» con candado, es esa
 * regla y vuelve el aviso (`docs/google-verificacion-guion.md`).
 */
export const AVISO_ANTES_DE_CONECTAR: Partial<Record<SocialNetwork, string>> = {
  instagram: 'Cuenta Business o Creator, enlazada a una página de Facebook. Una cuenta personal no puede conectar.',
  facebook: 'Una página, no un perfil personal.',
}
export const AVISO_META_EN_REVISION =
  'Mientras Meta revisa la app, solo pueden conectar las cuentas que invitamos como testers. Si Facebook dice que la función no está disponible, escríbenos.'

export function avisosDe(network: SocialNetwork, metaEnRevision: boolean): string[] {
  const avisos: string[] = []
  const fijo = AVISO_ANTES_DE_CONECTAR[network]
  if (fijo) avisos.push(fijo)
  if (metaEnRevision && (network === 'instagram' || network === 'facebook')) avisos.push(AVISO_META_EN_REVISION)
  return avisos
}

/**
 * Las redes que todavía no se ofrecen, aunque su código esté entero. En Los Fierros dicen
 * «Próximamente» en vez de «Conectar →», la conexión no arranca ni vuelve, el compositor, el
 * editor y el teléfono no las ofrecen como destino, y la regla común de lo que se programa
 * (`validateScheduleDraft`) rechaza con `fraseProximamente` lo que llegue por la API o por el
 * lote. Abrir una es sacarla de acá.
 *
 * - **Threads** espera la segunda vuelta del App Review de Meta (`threads_basic` y
 *   `threads_content_publish`, `docs/pendientes.md`): con la app en Live, sin esa aprobación
 *   solo autoriza quien tiene un rol en ella. Para grabar esa revisión, `proximamentePara`
 *   (`src/lib/redes-abiertas.ts`) la abre solo para la cuenta del revisor.
 * - **X** no publica hoy (2026-10-19). Antes de abrirla hay que ver por qué, empezando por el
 *   saldo: la API de X ya no tiene capa gratuita (README, «Modo Tinder»).
 *
 * Lo ya programado a una de estas redes se quema en su primer intento, con `fraseProximamente`;
 * para editarlo hay que sacarle ese destino.
 */
export const REDES_PROXIMAMENTE: ReadonlySet<string> = new Set<SocialNetwork>(['threads', 'x'])

/** Lo que dice Los Fierros en lugar de «Conectar →» para una red de `REDES_PROXIMAMENTE`. */
export const PROXIMAMENTE = 'Próximamente'

/** La frase con que se rechaza lo que llegue a una red de `REDES_PROXIMAMENTE`. */
export function fraseProximamente(network: string): string {
  return `${networkLabel(network)} todavía no está disponible en Tu Parrilla: próximamente.`
}
