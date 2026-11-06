import { beforeAll, describe, expect, it, vi } from 'vitest'
import { prepararBase, URL_PRUEBAS } from '@/lib/pruebas/base-de-pruebas'

// Cómo salió cada publicación desde Tu Parrilla, contra una Postgres de verdad: si iba solo en
// fotos lo decide una subconsulta sobre los archivos del post y `videos_liberados`, y la
// música de «Qué te funciona» depende de que eso esté bien.

vi.mock('server-only', () => ({}))

const esquema = () => import('@/db')
const db = async () => (await esquema()).getDb()

let duenoId = ''
let otroId = ''
let tiktok = ''
let ajena = ''

/** Un post publicado en TikTok con estos archivos, este id en la red y estas opciones. */
async function publicado(
  externalId: string,
  archivos: Array<'image' | 'video'>,
  opciones: unknown,
  { videosLiberados = 0, ownerId = duenoId, cuenta = tiktok } = {},
) {
  const { scheduledPosts, scheduledPostTargets, scheduledPostMedia } = await esquema()
  const [post] = await (await db())
    .insert(scheduledPosts)
    .values({ ownerId, caption: 'hola', scheduledAt: new Date(), videosLiberados, atributos: { tema: 'recetas' } })
    .returning()
  if (archivos.length > 0) {
    await (await db())
      .insert(scheduledPostMedia)
      .values(archivos.map((mediaType, i) => ({ postId: post!.id, blobUrl: `https://r2/${externalId}/${i}`, mediaType, position: i })))
  }
  await (await db())
    .insert(scheduledPostTargets)
    .values({ postId: post!.id, network: 'tiktok', accountId: cuenta, status: 'published', externalId, opciones })
}

describe.skipIf(!URL_PRUEBAS)('publicadosDesdeTuParrilla, contra una Postgres de verdad', () => {
  beforeAll(async () => {
    await prepararBase('pruebas_publicados')
    const { users, socialAccounts } = await esquema()
    const [dueno, otro] = await (await db())
      .insert(users)
      .values([{ correo: 'duena@ejemplo.cl' }, { correo: 'otro@ejemplo.cl' }])
      .returning()
    duenoId = dueno!.id
    otroId = otro!.id
    const cuentas = await (await db())
      .insert(socialAccounts)
      .values([
        { ownerId: duenoId, network: 'tiktok', handle: '@duena', externalId: 'tt-1', accessToken: 'x' },
        { ownerId: otroId, network: 'tiktok', handle: '@otro', externalId: 'tt-2', accessToken: 'x' },
      ])
      .returning()
    tiktok = cuentas[0]!.id
    ajena = cuentas[1]!.id
  }, 60_000)

  it('las opciones del destino, los atributos y si el post iba solo en fotos', async () => {
    const { publicadosDesdeTuParrilla } = await import('./post-attributes')
    const directo = { modo: 'directo', privacidad: 'PUBLIC_TO_EVERYONE', musica: true }
    await publicado('fotos', ['image', 'image'], directo)
    await publicado('video', ['video'], directo)
    // El video ya salió y se borró del almacén: queda contado, no en los archivos.
    await publicado('liberado', [], directo, { videosLiberados: 1 })
    await publicado('ajeno', ['image'], directo, { ownerId: otroId, cuenta: ajena })

    const mapa = await publicadosDesdeTuParrilla(
      duenoId,
      ['fotos', 'video', 'liberado', 'ajeno', 'subido-a-mano'].map((externalId) => ({ network: 'tiktok', externalId })),
    )

    expect(mapa.get('tiktok:fotos')).toEqual({
      atributos: { tema: 'recetas' },
      publicado: { opciones: directo, soloFotos: true },
    })
    expect(mapa.get('tiktok:video')?.publicado.soloFotos).toBe(false)
    expect(mapa.get('tiktok:liberado')?.publicado.soloFotos).toBe(false)
    // Lo de otro dueño y lo subido directo en la red no aparecen: de eso no se sabe.
    expect(mapa.has('tiktok:ajeno')).toBe(false)
    expect(mapa.has('tiktok:subido-a-mano')).toBe(false)
  })
})
