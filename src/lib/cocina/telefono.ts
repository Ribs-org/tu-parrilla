import type { EstadoComanda } from '@/db/schema'
import { EN_MARCHA } from './estados'
import type { ComandaDelPanel } from './panel'
import { ACOMPANAMIENTO_NO_SIRVE } from './pedir'
import { MARCA_SIN_NOMBRE, PEDIDO_ILEGIBLE, leerPedido, type MarcaBasica, type PedidoDeComanda } from './pedido'
import { antesEnLaFila, estadoEnPalabras, tramoDelRecorrido } from './tarjeta'

// La Cocina desde la app del teléfono, sin base: cómo llega una comanda que se pide desde ahí y
// cómo se le cuenta cada comanda de vuelta. El teléfono hace el camino corto —grabar, decirle al
// chef qué quiere y mandarlo—, así que lo que el formulario del panel deja elegir y el teléfono no
// pregunta se pide con lo mismo que el panel trae marcado: un video largo, clips verticales, lo que
// dé el material y la marca que ya tiene. Lo demás es el mismo pedido, validado por `leerPedido` y
// colgado por `pedirComanda`. Las rutas están en `src/app/api/mobile/cocina/`.

/** Lo que dice el teléfono cuando no hay con qué firmar: el chef usa la marca en los videos. */
export const MARCA_SIN_NOMBRE_TELEFONO =
  'Ponle nombre a tu marca: es el que el chef usa en los videos. Escribe tu nombre en Tu Cuenta, en el panel web, y vuelve a mandarla.'

/** Las frases del panel que mandan a recargar la página, dichas para el teléfono, que no tiene página. */
const EN_EL_TELEFONO: Record<string, string> = {
  [PEDIDO_ILEGIBLE]: 'No entendimos la comanda: actualiza La Cocina y vuelve a intentarlo.',
  [ACOMPANAMIENTO_NO_SIRVE]: 'Uno de los materiales ya no está en la cámara: actualiza La Cocina y vuelve a elegir.',
  [MARCA_SIN_NOMBRE]: MARCA_SIN_NOMBRE_TELEFONO,
}

/** Una frase del servidor como la tiene que leer alguien en el teléfono. */
export function fraseParaElTelefono(frase: string): string {
  return EN_EL_TELEFONO[frase] ?? frase
}

/** El nombre con que el chef firma: el de la marca guardada o, la primera vez, el de la cuenta. */
export function marcaParaElTelefono(marca: MarcaBasica | null, nombreDeLaCuenta: string | null): MarcaBasica | null {
  if (marca) return marca
  const nombre = nombreDeLaCuenta?.trim()
  return nombre ? { nombre, handle: null, acento: null, ctaTexto: null } : null
}

/**
 * La comanda que manda el teléfono —`{ ref, principal, acompanamientos: [ids], instruccion }`—,
 * completa con lo que el teléfono no pregunta y validada como la del panel, o la frase de por qué
 * no. Los videos que acompañan van «para intercalar»: sin preguntarlo, es lo que el chef hace con
 * lo que no sincroniza.
 */
export function pedidoDelTelefono(crudo: unknown, marca: MarcaBasica | null): PedidoDeComanda | { error: string } {
  if (typeof crudo !== 'object' || crudo === null || Array.isArray(crudo)) return { error: fraseParaElTelefono(PEDIDO_ILEGIBLE) }
  const c = crudo as Record<string, unknown>
  if (c.acompanamientos !== undefined && !(Array.isArray(c.acompanamientos) && c.acompanamientos.every((a) => typeof a === 'string'))) {
    return { error: fraseParaElTelefono(PEDIDO_ILEGIBLE) }
  }
  if (c.instruccion !== undefined && c.instruccion !== null && typeof c.instruccion !== 'string') {
    return { error: fraseParaElTelefono(PEDIDO_ILEGIBLE) }
  }
  const pedido = leerPedido({
    ref: c.ref,
    principal: c.principal,
    subtipo: 'largo',
    acompanamientos: ((c.acompanamientos as string[] | undefined) ?? []).map((id) => ({ id, rol: 'imagen' })),
    formatos: ['clips'],
    cantidad: 'lo-que-de',
    notas: c.instruccion ?? '',
    paraCuando: null,
    marca: marca ?? {},
  })
  return 'error' in pedido ? { error: fraseParaElTelefono(pedido.error) } : pedido
}

/** Una comanda como la lista el teléfono: el estado ya en palabras de noche y de día. */
export type ComandaDelTelefono = {
  id: string
  estado: EstadoComanda
  palabras: { noche: string; dia: string }
  /** Si el chef la tiene o la va a tomar: mientras alguna lo esté, el teléfono vuelve a preguntar. */
  enMarcha: boolean
  /** De 0 (colgada) a 5 (toda en el mesón); null si terminó sin cocinarse. */
  tramo: number | null
  creadaEn: string
  eta: string | null
  principal: string | null
  instruccion: string | null
  /** «Es la próxima en la fila.», «Hay 2 comandas antes que la tuya.»; solo mientras espera. */
  fila: string | null
  /** Lo que dijo el chef, o por qué no la cocinó. */
  mensaje: string | null
}

export function comandaParaElTelefono(c: ComandaDelPanel): ComandaDelTelefono {
  return {
    id: c.id,
    estado: c.estado,
    palabras: { noche: estadoEnPalabras(c, 'noche'), dia: estadoEnPalabras(c, 'dia') },
    enMarcha: EN_MARCHA.has(c.estado),
    tramo: tramoDelRecorrido(c.estado),
    creadaEn: c.creadaEn.toISOString(),
    eta: c.eta ? c.eta.toISOString() : null,
    principal: c.principal,
    instruccion: c.instruccion,
    fila: c.antes === null ? null : antesEnLaFila(c.antes),
    mensaje: c.motivo ?? c.mensaje,
  }
}

/** Cuántas comandas lista el teléfono, las más nuevas: el resto está en el panel. */
export const COMANDAS_EN_EL_TELEFONO = 15
