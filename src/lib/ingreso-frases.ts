// Las frases del ingreso, sin nada más: las muestra el formulario de /ingresar, que corre en
// el navegador. Viven aparte de `ingreso.ts` porque ese módulo usa `node:crypto` para los
// códigos, y una frase importada de ahí arrastraba al navegador un reemplazo de crypto entero
// (cientos de KB en la página de entrada).

export const CORREO_INVALIDO = 'Ese correo no se ve bien.'
export const CODIGO_ENVIADO = 'Si tu correo está invitado, te llegará un código en un minuto.'
export const CODIGO_INCORRECTO = 'Ese código no es válido o ya venció.'
export const DEMASIADOS_INTENTOS = 'Demasiados intentos. Pide un código nuevo.'
export const DEMASIADOS_FALLOS = 'Demasiados intentos en las últimas 24 horas. Prueba de nuevo más tarde.'
export const USUARIO_YA_INVITADO = 'Ese correo ya está invitado.'
export const USUARIO_CON_INGRESOS = 'Ese usuario ya entró alguna vez; no se puede quitar todavía.'
