// El enlace del correo del código, sin nada más: lo arma el servidor y lo lee la pantalla del
// código, que corre en el navegador. Vive aparte de `ingreso.ts` por lo mismo que
// `ingreso-frases.ts`: ese módulo usa `node:crypto`.

/**
 * El enlace del correo: la pantalla del código, con el correo y el código puestos. Abrirlo no
 * canjea nada —los filtros de correo abren los enlaces antes que la persona—: entra quien aprieta
 * «Entrar», y vale lo mismo que el código (diez minutos, un solo uso, el mismo cupo de intentos).
 * El código va en el fragmento (`#codigo=`), que el navegador no manda: no queda en los registros
 * del servidor ni en un Referer.
 */
export function enlaceDeEntrada(sitio: string, correo: string, codigo: string): string {
  return `${sitio}/ingresar/codigo?correo=${encodeURIComponent(correo)}#codigo=${codigo}`
}

/** El código que trae ese fragmento, o null. Lo lee la pantalla del código. */
export function codigoDelFragmento(fragmento: string): string | null {
  const encontrado = /^#(?:.*&)?codigo=(\d{6})(?:&|$)/.exec(fragmento)
  return encontrado ? encontrado[1]! : null
}
