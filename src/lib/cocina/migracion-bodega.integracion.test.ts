import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import postgres from 'postgres'
import { URL_PRUEBAS } from '@/lib/pruebas/base-de-pruebas'

// La migración de la cámara de frío (`drizzle/0025_la_bodega.sql`) sobre una base con lo de antes:
// hay usuarios en piloto con insumos subidos, pedidos y vencidos. Se migra hasta la anterior, se
// siembra lo que había, y se aplica la de la bodega, como en producción. Lo crudo que seguía en el
// almacén tiene que quedar en la cámara con su mismo id y su misma URL, sin vencimiento; lo de las
// comandas, igual para el chef; y lo ya borrado, fuera de la cámara.

const NOMBRE = 'pruebas_migracion_bodega'
let sql: postgres.Sql
let carpetaVieja = ''

describe.skipIf(!URL_PRUEBAS)('la migración de la cámara de frío, sobre lo que ya existía', () => {
  beforeAll(async () => {
    const admin = postgres(URL_PRUEBAS!, { max: 1, onnotice: () => {} })
    await admin.unsafe(`drop database if exists ${NOMBRE} with (force)`)
    await admin.unsafe(`create database ${NOMBRE}`)
    await admin.end()
    const url = new URL(URL_PRUEBAS!)
    url.pathname = `/${NOMBRE}`
    sql = postgres(url.toString(), { max: 1, onnotice: () => {} })

    // Las migraciones hasta la anterior a la bodega: la misma carpeta, con el journal cortado.
    carpetaVieja = mkdtempSync(join(tmpdir(), 'drizzle-antes-'))
    cpSync('drizzle', carpetaVieja, { recursive: true })
    const journal = JSON.parse(readFileSync(join(carpetaVieja, 'meta', '_journal.json'), 'utf8')) as { entries: Array<{ tag: string }> }
    const hasta = journal.entries.findIndex((e) => e.tag === '0025_la_bodega')
    expect(hasta).toBeGreaterThan(0)
    journal.entries = journal.entries.slice(0, hasta)
    writeFileSync(join(carpetaVieja, 'meta', '_journal.json'), JSON.stringify(journal))
    await migrate(drizzle(sql), { migrationsFolder: carpetaVieja })
  }, 60_000)

  afterAll(async () => {
    await sql?.end()
    if (carpetaVieja) rmSync(carpetaVieja, { recursive: true, force: true })
  })

  it('lo crudo vivo pasa a la cámara, lo de las comandas sigue igual para el chef, y lo borrado no vuelve', async () => {
    const [u] = await sql`insert into users (correo, cocina_desde) values ('piloto@ejemplo.cl', now()) returning id`
    const dueno = u!.id as string
    const [viva] = await sql`insert into comandas (owner_id, ref, estado, pedido, receta) values (${dueno}, 'viva', 'en_el_horno', '{}', '{}') returning id`
    const [cancelada] = await sql`insert into comandas (owner_id, ref, estado, pedido, receta) values (${dueno}, 'cancelada', 'cancelada', '{}', '{}') returning id`
    const insumo = async (nombre: string, tipo: string, tipoArchivo: string, extra: { comanda?: string; expira?: string; borrado?: string } = {}) => {
      const [i] = await sql`
        insert into insumos (owner_id, comanda_id, tipo, subtipo, nombre, url, bytes, duracion_s, tipo_archivo, derechos_en, expira_en, borrado_en)
        values (${dueno}, ${extra.comanda ?? null}, ${tipo}, ${tipo === 'principal' ? 'largo' : null}, ${nombre},
                ${`https://media.ej.cl/cocina/${dueno}/insumos/${nombre}`}, 4000, 1800, ${tipoArchivo}, now(),
                ${extra.expira ?? null}, ${extra.borrado ?? null})
        returning id`
      return i!.id as string
    }
    const suelto = await insumo('suelto.mp4', 'principal', 'video/mp4')
    const enElHorno = await insumo('en-el-horno.mp4', 'principal', 'video/mp4', { comanda: viva!.id as string })
    const broll = await insumo('broll.mp4', 'imagen', 'video/mp4', { comanda: viva!.id as string })
    const foto = await insumo('foto.jpg', 'imagen', 'image/jpeg', { comanda: viva!.id as string })
    const porVencer = await insumo('por-vencer.mp4', 'camara', 'video/mp4', { comanda: cancelada!.id as string, expira: '2026-11-10T00:00:00Z' })
    const borrado = await insumo('borrado.mp4', 'principal', 'video/mp4', { comanda: cancelada!.id as string, expira: '2026-10-01T00:00:00Z', borrado: '2026-10-02T00:00:00Z' })
    await sql`insert into subidas (owner_id, id_en_almacen, clave, nombre, tipo_archivo, bytes, tamano_parte, tipo, derechos_en, insumo_id, cerrada_en)
              values (${dueno}, 'up-1', 'k', 'suelto.mp4', 'video/mp4', 4000, 67108864, 'principal', now(), ${suelto}, now())`

    await migrate(drizzle(sql), { migrationsFolder: 'drizzle' })

    const materiales = await sql`select id, nombre, uso, url, bytes, tipo_archivo, borrado_en from materiales order by nombre`
    expect(materiales.map((m) => [m.nombre, m.uso])).toEqual([
      ['broll.mp4', 'broll'],
      ['en-el-horno.mp4', 'crudo'],
      ['foto.jpg', null],
      ['por-vencer.mp4', 'crudo'],
      ['suelto.mp4', 'crudo'],
    ])
    const delSuelto = materiales.find((m) => m.nombre === 'suelto.mp4')!
    expect(delSuelto).toMatchObject({ id: suelto, url: `https://media.ej.cl/cocina/${dueno}/insumos/suelto.mp4`, bytes: '4000', borrado_en: null })

    // Lo suelto ya no es insumo: vive solo en la cámara, y su subida lo nombra.
    const insumos = await sql`select id, comanda_id, material_id, tipo, uso, expira_en, borrado_en from insumos order by nombre`
    expect(insumos.map((i) => i.id).sort()).toEqual([enElHorno, broll, foto, porVencer, borrado].sort())
    const [subida] = await sql`select material_id from subidas`
    expect(subida!.material_id).toBe(suelto)

    // Lo de las comandas: el mismo id para el chef, atado a su material y sin vencer.
    for (const id of [enElHorno, broll, foto, porVencer]) {
      const fila = insumos.find((i) => i.id === id)!
      expect(fila).toMatchObject({ material_id: id, expira_en: null, borrado_en: null })
    }
    expect(insumos.find((i) => i.id === broll)!.uso).toBe('broll')
    // Lo que ya se había borrado sigue como historia, sin material.
    expect(insumos.find((i) => i.id === borrado)).toMatchObject({ material_id: null })
    expect(materiales.find((m) => m.id === borrado)).toBeUndefined()
  })
})
