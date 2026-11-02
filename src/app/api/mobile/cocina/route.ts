import { NextResponse } from 'next/server'
import { nombreDePeso } from '@/lib/cocina/bodega'
import { materialesDeLaCamara } from '@/lib/cocina/materiales'
import { comandasDelDueno, estadoDeLaCocina } from '@/lib/cocina/panel'
import { marcaDe } from '@/lib/cocina/pedir'
import { usoDeLaCamara } from '@/lib/cocina/subidas'
import { COMANDAS_EN_EL_TELEFONO, comandaParaElTelefono, marcaParaElTelefono } from '@/lib/cocina/telefono'
import { quienPreguntaDesdeElTelefono } from '@/lib/cocina/telefono-api'

export const dynamic = 'force-dynamic'

/**
 * La Cocina en la app del teléfono, de una vez: si está encendida para la cuenta, si el chef está
 * trabajando, con qué marca firma, lo que hay en la cámara de frío (de día, la nevera) con su
 * cuota y el nombre de cada cosa según lo que pesa, y las últimas comandas con su estado en
 * palabras. Con la cocina apagada, solo eso: `encendida: false` y lo demás vacío. Todo del dueño
 * del token.
 */
export async function GET(request: Request) {
  const usuario = await quienPreguntaDesdeElTelefono(request, false)
  if (usuario instanceof NextResponse) return usuario
  const sinCache = { headers: { 'Cache-Control': 'no-store' } }
  if (!usuario.cocinaDesde) {
    return NextResponse.json({ encendida: false, abierta: false, marca: null, camara: null, materiales: [], comandas: [] }, sinCache)
  }
  // En serie, como el resto de la cocina (`src/lib/cocina/panel.ts`).
  const marca = marcaParaElTelefono(await marcaDe(usuario.id), usuario.nombre)
  const materiales = await materialesDeLaCamara(usuario.id)
  const camara = await usoDeLaCamara(usuario.id)
  const cocina = await estadoDeLaCocina(new Date())
  const comandas = await comandasDelDueno(usuario.id)
  return NextResponse.json(
    {
      encendida: true,
      abierta: cocina.abierta,
      marca: marca?.nombre ?? null,
      camara,
      // Cada uno con cómo se llama por lo que pesa —de un corte a la vaca entera; de día, de un
      // trozo al atún gigante—, como lo dibuja la cámara del panel.
      materiales: materiales.map((m) => ({ ...m, pieza: nombreDePeso(m.clase, m.bytes) })),
      comandas: comandas.slice(0, COMANDAS_EN_EL_TELEFONO).map(comandaParaElTelefono),
    },
    sinCache,
  )
}
