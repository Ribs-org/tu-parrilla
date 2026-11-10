// El ingreso por correo, en su parte pura: qué correo vale, cómo se genera y se guarda un
// código, cuándo sigue vivo y cuántos se pueden pedir. Quien toca la base y Resend está en
// lib/usuarios.ts y en las acciones de /ingresar.
import { createHash, randomInt, timingSafeEqual } from 'node:crypto'
import { env } from './env'
import { enlaceDeEntrada } from './enlace-de-entrada'
import { normalizarCorreo } from './forma-del-correo'

// Las frases viven en `ingreso-frases.ts`, y la forma de un correo en `forma-del-correo.ts`: el
// navegador las importa sin `node:crypto`.
export * from './ingreso-frases'
export { normalizarCorreo }

export const VIGENCIA_MS = 10 * 60_000
export const MAX_INTENTOS = 5
export const MAX_CODIGOS_POR_VENTANA = 3
export const VENTANA_MS = 15 * 60_000

/**
 * Los códigos equivocados que una persona puede escribir en un día, sumando todos sus
 * códigos. Los cinco intentos de cada uno no bastan solos: pedir otro código da cinco más,
 * y a tres códigos cada quince minutos son 1.440 al día contra un millón de combinaciones
 * —contra el código fijo del revisor, siempre el mismo, la mitad en un año—. Con diez, un
 * año entero de intentos no llega a cubrir el 0,4 %. El costo: quien conozca un correo
 * invitado puede dejarlo sin entrar por un día; una sesión ya abierta no se entera.
 */
export const MAX_FALLOS_POR_DIA = 10
export const VENTANA_FALLOS_MS = 24 * 60 * 60_000

/**
 * Los revisores de Meta y de YouTube tienen que poder entrar sin leer nuestro correo: para un
 * solo correo, mientras estén puestas las dos variables, el código que vale es fijo y no se
 * manda nada. Se queda aunque la app de Meta esté en Live, porque Meta vuelve a revisar las
 * apps aprobadas y pide que la cuenta de prueba siga activa. Sin variables, esto no existe.
 */
export function codigoDeRevision(correo: string): string | null {
  const revision = env('REVISION_CORREO')
  const codigo = env('REVISION_CODIGO')
  if (!revision || !codigo) return null
  if (normalizarCorreo(revision) !== correo) return null
  if (!/^\d{6}$/.test(codigo)) {
    console.warn('REVISION_CODIGO tiene que ser de seis dígitos; se ignora.')
    return null
  }
  return codigo
}

export function generarCodigo(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, '0')
}

/** Con la clave derivada, para que una copia de la tabla no sirva de nada por sí sola. */
export function hashCodigo(codigo: string, clave: string): string {
  return createHash('sha256').update(`${codigo}:${clave}`).digest('hex')
}

export function codigoCoincide(codigo: string, hash: string, clave: string): boolean {
  if (!/^\d{6}$/.test(codigo)) return false
  const a = Buffer.from(hashCodigo(codigo, clave), 'hex')
  const b = Buffer.from(hash, 'hex')
  return a.length === b.length && timingSafeEqual(a, b)
}

export function vigente(fila: { expiraEn: Date; usadoEn: Date | null; intentos: number }, now: Date): boolean {
  if (fila.usadoEn) return false
  if (fila.intentos >= MAX_INTENTOS) return false
  return fila.expiraEn.getTime() > now.getTime()
}

/** Tres códigos por usuario cada quince minutos: frena a quien martille «reenviar». */
export function puedePedir(pedidosRecientes: Date[], now: Date): boolean {
  const desde = now.getTime() - VENTANA_MS
  return pedidosRecientes.filter((d) => d.getTime() > desde).length < MAX_CODIGOS_POR_VENTANA
}

/** El color del botón del correo: la brasa del tema de día, que sobre blanco se lee con letra blanca. */
const BRASA_DEL_CORREO = '#b83d0b'

function escaparHtml(texto: string): string {
  return texto.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

/**
 * El correo que lleva el código, con el botón «Entrar a Tu Parrilla» y el código escrito, que
 * sigue sirviendo para la app y para abrir el correo en otro aparato. El de la invitación le llega
 * a alguien que no pidió nada: saluda, dice qué es y dónde pedir otro código si este venció. Sin
 * dominio del producto (`sitio` vacío: local, un preview) va sin enlaces ni botón, para no mandar a
 * nadie a producción desde una prueba.
 */
export function correoDelCodigo(
  codigo: string,
  destino: { correo: string; sitio: string; invitacion?: { nombre: string | null } },
): { subject: string; text: string; html?: string } {
  const { correo, sitio, invitacion } = destino
  if (!sitio && !invitacion) {
    return {
      subject: `${codigo} es tu código para entrar a Tu Parrilla`,
      text: `Tu código para entrar a Tu Parrilla es ${codigo}. Vale diez minutos. Si no lo pediste, ignora este correo.`,
    }
  }
  // Cada párrafo, en texto y en HTML: los dos dicen lo mismo, y el botón es el enlace del texto.
  type Parrafo = { texto: string; html: string }
  const simple = (texto: string): Parrafo => ({ texto, html: `<p>${escaparHtml(texto)}</p>` })
  const enlace = sitio ? enlaceDeEntrada(sitio, correo, codigo) : ''
  const boton: Parrafo = {
    texto: `Para entrar, abre este enlace y aprieta «Entrar»:\n${enlace}`,
    html: `<p><a href="${escaparHtml(enlace)}" style="display:inline-block;background:${BRASA_DEL_CORREO};color:#ffffff;text-decoration:none;font-weight:600;padding:12px 24px;border-radius:12px">Entrar a Tu Parrilla</a></p>`,
  }
  const elCodigo = (antes: string, despues: string): Parrafo => ({
    texto: `${antes}${codigo}${despues}`,
    html: `<p>${escaparHtml(antes)}<strong style="font-size:20px;letter-spacing:4px">${codigo}</strong>${escaparHtml(despues)}</p>`,
  })

  let subject: string
  let parrafos: Parrafo[]
  if (invitacion) {
    const nombre = invitacion.nombre?.trim().split(/\s+/)[0]
    subject = `Te invitaron a Tu Parrilla: tu código es ${codigo}`
    parrafos = [
      simple(`Hola${nombre ? ` ${nombre}` : ''}:`),
      simple('Te invitaron a Tu Parrilla.'),
      ...(sitio ? [boton, elCodigo('O escribe este código: ', '. Vale diez minutos.')] : [
        elCodigo('Para entrar, escribe este código en la pantalla de ingreso de Tu Parrilla: ', '. Vale diez minutos.'),
      ]),
      simple(`Si se te venció, pide otro${sitio ? ` en ${sitio}/ingresar` : ''} con este mismo correo (${correo}).`),
      simple('En la app de Tu Parrilla, en el teléfono, se entra igual: con tu correo y el código que te llegue.'),
      simple('El equipo que hace Tu Parrilla'),
    ]
  } else {
    subject = `${codigo} es tu código para entrar a Tu Parrilla`
    parrafos = [
      elCodigo('Tu código para entrar a Tu Parrilla es ', '. Vale diez minutos.'),
      boton,
      simple('Si lo pediste en la app del teléfono, escribe el código en la app: el enlace abre el navegador.'),
      simple('Si no lo pediste, ignora este correo.'),
    ]
  }
  const text = parrafos.map((p) => p.texto).join('\n\n')
  if (!sitio) return { subject, text }
  const html = `<div style="font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:15px;line-height:1.5;color:#16181a;max-width:480px">${parrafos.map((p) => p.html).join('')}</div>`
  return { subject, text, html }
}
