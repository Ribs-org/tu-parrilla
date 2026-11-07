import type { EstadoComanda } from '@/db/schema'
import { MATERIAL_NO_EXISTE, NOMBRE_USO, USOS_MATERIAL } from './bodega'
import { EN_MARCHA, TERMINALES } from './estados'
import { SUBTIPOS_PRINCIPAL } from './insumos'
import { etaEnLaFila, type EstadoDeLaCocina } from './latido'
import { NOMBRE_ESTADO } from './nombres'
import type { ComandaDelPanel } from './panel'
import { ACOMPANAMIENTO_NO_SIRVE } from './pedir'
import {
  AYUDA_ROL,
  AYUDA_SUBTIPO,
  CANTIDADES,
  FORMATOS,
  MARCA_SIN_NOMBRE,
  MAX_ACOMPANAMIENTOS,
  NOMBRE_CANTIDAD,
  NOMBRE_FORMATO,
  NOMBRE_ROL,
  NOMBRE_SUBTIPO,
  PEDIDO_ILEGIBLE,
  ROLES_DE_VIDEO,
  leerPedido,
  type MarcaBasica,
  type PedidoDeComanda,
} from './pedido'
import { siNoContestas } from './pregunta'
import { antesEnLaFila, estadoEnPalabras, tramoDelRecorrido } from './tarjeta'

// La Cocina desde la app del teléfono, sin base: cómo llega una comanda que se pide desde ahí y
// cómo se le cuenta cada comanda de vuelta. Desde el 2026-11-06 el teléfono pide con las mismas
// opciones que el formulario del panel —qué es el plato principal, qué es cada video que lo
// acompaña, los formatos, cuántos, para cuándo y la marca—, que el servidor le manda con sus
// nombres (`OPCIONES_DEL_PEDIDO`) para que no haya una copia que se desfase. Una app de antes manda
// solo el plato principal, lo que acompaña y la instrucción: lo que no manda se pide con lo que el
// panel trae marcado —un video largo, clips verticales, lo que dé el material y la marca que ya
// tiene—. Lo demás es el mismo pedido, validado por `leerPedido` y colgado por `pedirComanda`. Las
// rutas están en `src/app/api/mobile/cocina/`.

/** Lo que dice el teléfono cuando no hay con qué firmar: el chef usa la marca en los videos. */
export const MARCA_SIN_NOMBRE_TELEFONO =
  'Ponle nombre a tu marca: es el que el chef usa en los videos. Escribe tu nombre en Tu Cuenta, en el panel web, y vuelve a mandarla.'

/** Las frases del panel que mandan a recargar la página, dichas para el teléfono, que no tiene página. */
const EN_EL_TELEFONO: Record<string, string> = {
  [PEDIDO_ILEGIBLE]: 'No entendimos la comanda: actualiza La Cocina y vuelve a intentarlo.',
  [ACOMPANAMIENTO_NO_SIRVE]: 'Uno de los materiales ya no está en la cámara: actualiza La Cocina y vuelve a elegir.',
  [MARCA_SIN_NOMBRE]: MARCA_SIN_NOMBRE_TELEFONO,
  [MATERIAL_NO_EXISTE]: 'Ese material ya no está: actualiza La Cocina.',
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
 * Lo que el formulario del teléfono ofrece, con los nombres y las ayudas del panel: viaja en
 * `GET /api/mobile/cocina`, así que cambiar un nombre acá lo cambia en los dos. Una app que no lo
 * recibe —un servidor de antes— pide con el camino corto.
 */
export const OPCIONES_DEL_PEDIDO = {
  subtipos: SUBTIPOS_PRINCIPAL.map((valor) => ({ valor, nombre: NOMBRE_SUBTIPO[valor], ayuda: AYUDA_SUBTIPO[valor] })),
  roles: ROLES_DE_VIDEO.map((valor) => ({ valor, nombre: NOMBRE_ROL[valor], ayuda: AYUDA_ROL[valor] })),
  formatos: FORMATOS.map((valor) => ({ valor, nombre: NOMBRE_FORMATO[valor] })),
  cantidades: CANTIDADES.map((valor) => ({ valor, nombre: NOMBRE_CANTIDAD[valor] })),
  usos: USOS_MATERIAL.map((valor) => ({ valor, nombre: NOMBRE_USO[valor] })),
  /** Cuántos materiales acompañan al principal, como mucho. */
  maxAcompanamientos: MAX_ACOMPANAMIENTOS,
}

/**
 * La comanda que manda el teléfono, completa y validada como la del panel, o la frase de por qué
 * no. La de hoy: `{ ref, principal, subtipo, acompanamientos: [{ id, rol }], formatos, cantidad,
 * paraCuando, instruccion, marca }`. La de una app de antes: `{ ref, principal, acompanamientos:
 * [ids], instruccion }`; lo que falta va como el panel lo trae marcado, los videos que acompañan
 * «para intercalar» —sin preguntarlo, es lo que el chef hace con lo que no sincroniza— y la marca,
 * la guardada (`marcaGuardada`).
 */
export function pedidoDelTelefono(crudo: unknown, marcaGuardada: MarcaBasica | null): PedidoDeComanda | { error: string } {
  const ilegible = { error: fraseParaElTelefono(PEDIDO_ILEGIBLE) }
  if (typeof crudo !== 'object' || crudo === null || Array.isArray(crudo)) return ilegible
  const c = crudo as Record<string, unknown>
  if (c.acompanamientos !== undefined && !Array.isArray(c.acompanamientos)) return ilegible
  const acompanamientos: unknown[] = []
  for (const a of (c.acompanamientos as unknown[] | undefined) ?? []) {
    if (typeof a === 'string') acompanamientos.push({ id: a, rol: 'imagen' })
    else if (typeof a === 'object' && a !== null && !Array.isArray(a)) acompanamientos.push(a)
    else return ilegible
  }
  if (c.instruccion !== undefined && c.instruccion !== null && typeof c.instruccion !== 'string') return ilegible
  // La marca que escribió en el teléfono, si la mandó: si le falta el nombre, la frase es la del
  // panel, porque el campo está ahí mismo. Si no la mandó, la guardada.
  const propia = typeof c.marca === 'object' && c.marca !== null && !Array.isArray(c.marca)
  const pedido = leerPedido({
    ref: c.ref,
    principal: c.principal,
    subtipo: c.subtipo ?? 'largo',
    acompanamientos,
    formatos: c.formatos ?? ['clips'],
    cantidad: c.cantidad ?? 'lo-que-de',
    notas: c.instruccion ?? '',
    paraCuando: c.paraCuando ?? null,
    marca: propia ? c.marca : (marcaGuardada ?? {}),
  })
  if (!('error' in pedido)) return pedido
  return { error: propia && pedido.error === MARCA_SIN_NOMBRE ? MARCA_SIN_NOMBRE : fraseParaElTelefono(pedido.error) }
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
  /**
   * «Hora estimada», como la tarjeta del panel: la que dio el chef o, mientras espera, la que sale
   * de la fila (solo si la cocina toma las comandas sola). Null si terminó o no se sabe.
   */
  eta: string | null
  principal: string | null
  instruccion: string | null
  /** «Es la próxima en la fila.», «Hay 2 comandas antes que la tuya.»; solo mientras espera. */
  fila: string | null
  /** Lo que dijo el chef, o por qué no la cocinó. */
  mensaje: string | null
  /**
   * Lo que el chef pregunta, mientras espera respuesta; null si no pregunta nada. `siNoContestas`
   * ya viene en palabras, en la zona de la cuenta. Desde el 2026-11-06: una app de antes no lo lee.
   */
  pregunta: {
    id: string
    texto: string
    /** Null: la respuesta es libre. */
    opciones: string[] | null
    porDefecto: string
    plazo: string
    siNoContestas: string
  } | null
  /** Desde el 2026-11-06 (una app de antes no los lee): si todavía se puede cancelar —no está en el horno—, */
  cancelable: boolean
  /** cuántos creativos esperan en el mesón, */
  enElMeson: number
  /** y «Lo que pasó», paso por paso, con el estado en palabras de noche y de día. */
  pasos: Array<{ estado: EstadoComanda; palabras: { noche: string; dia: string }; mensaje: string | null; creadoEn: string }>
}

/**
 * `ahora` y `zona` dicen el plazo de la pregunta en palabras: «hoy antes de las 18:00». Con
 * `cocina`, la hora estimada de una que espera sale de la fila, como en el panel.
 */
export function comandaParaElTelefono(c: ComandaDelPanel, ahora: Date, zona: string, cocina?: EstadoDeLaCocina): ComandaDelTelefono {
  const eta = TERMINALES.has(c.estado) ? null : (c.eta ?? (c.antes !== null && cocina ? etaEnLaFila(c.antes, cocina, ahora) : null))
  return {
    id: c.id,
    estado: c.estado,
    palabras: { noche: estadoEnPalabras(c, 'noche'), dia: estadoEnPalabras(c, 'dia') },
    enMarcha: EN_MARCHA.has(c.estado),
    tramo: tramoDelRecorrido(c.estado, c.pregunta?.vuelveA),
    creadaEn: c.creadaEn.toISOString(),
    eta: eta ? eta.toISOString() : null,
    principal: c.principal,
    instruccion: c.instruccion,
    fila: c.antes === null ? null : antesEnLaFila(c.antes),
    mensaje: c.motivo ?? c.mensaje,
    pregunta: c.pregunta
      ? {
          id: c.pregunta.id,
          texto: c.pregunta.texto,
          opciones: c.pregunta.opciones,
          porDefecto: c.pregunta.porDefecto,
          plazo: c.pregunta.plazo.toISOString(),
          siNoContestas: siNoContestas(c.pregunta.plazo, c.pregunta.porDefecto, ahora, zona),
        }
      : null,
    cancelable: c.cancelable,
    enElMeson: c.enElMeson,
    pasos: c.eventos.map((e) => ({
      estado: e.estado,
      palabras: { noche: NOMBRE_ESTADO[e.estado].noche, dia: NOMBRE_ESTADO[e.estado].dia },
      mensaje: e.mensaje,
      creadoEn: e.creadoEn.toISOString(),
    })),
  }
}

/** Cuántas comandas lista el teléfono, las más nuevas: el resto está en el panel. */
export const COMANDAS_EN_EL_TELEFONO = 15
