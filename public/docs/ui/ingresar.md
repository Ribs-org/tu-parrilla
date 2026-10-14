# Entrar al panel

`/ingresar` y `/ingresar/codigo`, en `https://tu-parrilla.cl`. Es la puerta del panel: no está
en la barra porque se ve antes de entrar.

Tu Parrilla no tiene contraseñas ni registro abierto. Entra solo quien el admin invitó, con el
correo de la invitación: se escribe el correo, llega un código de seis dígitos y con ese código
se abre el panel. La sesión dura treinta días en ese navegador, contados desde que se entró;
después hay que pedir un código otra vez.

## Cómo se llega

- Escribiendo `https://tu-parrilla.cl/ingresar`.
- Desde la portada de tu-parrilla.cl: al pie, en la frase «Tu Parrilla es por invitación: no
  hay registro abierto. Si ya te invitaron, entra con tu correo.», el enlace «entra con tu
  correo».
- Abriendo cualquier dirección del panel (`/admin` o lo que cuelgue de ahí) sin sesión: lleva a
  `/ingresar`. Al entrar se llega siempre a La Parrilla, la entrada del panel
  ([la-parrilla.md](la-parrilla.md)), no a la dirección que se había abierto.
- Con «Salir», en la barra de arriba del panel: cierra la sesión y deja en `/ingresar`.
- `/admin/login`, la dirección antigua, lleva a `/ingresar`.
- Con la sesión abierta, `/ingresar` y `/ingresar/codigo` llevan directo a La Parrilla.

**El panel se abre solo en tu-parrilla.cl.** Hay otros dominios que llevan a la misma app (por
ejemplo, el dominio propio de un creador, que muestra su página pública). Si alguien abre
`/admin` o `/ingresar` en uno de ellos, el navegador lo manda a la misma dirección en
tu-parrilla.cl. La sesión es de cada dominio, así que ahí hay que entrar de nuevo aunque ya se
hubiera entrado en el otro. Es así porque Meta solo acepta conectar Instagram y Facebook desde
tu-parrilla.cl.

## Qué se ve

### Paso 1: el correo (`/ingresar`)

Una tarjeta al centro, sobre fondo oscuro:

- arriba, en letra chica, «Parrilla»;
- el título «Entra con tu correo» (se ve en mayúsculas);
- un campo de correo con el texto de ejemplo «tu@correo.cl»;
- el botón «Mandarme un código», que mientras trabaja dice «Enviando…».

No hay nada más: ni contraseña, ni opción para crear una cuenta o recuperar una contraseña.

### Paso 2: el código (`/ingresar/codigo`)

- «Parrilla» y el título «Tu código»;
- la frase «Si tu correo está invitado, te llegará un código en un minuto. Vale diez minutos.»;
- un campo para los seis dígitos, con el texto de ejemplo «000000»;
- el botón «Entrar», que mientras trabaja dice «Entrando…»;
- debajo, el enlace «Usar otro correo», que vuelve al paso 1.

Esta pantalla **no muestra a qué correo se mandó el código**: solo aparece en la barra de
direcciones del navegador, después de `?correo=`. Si se abre `/ingresar/codigo` sin un correo
válido en la dirección, vuelve al paso 1.

### El correo que llega

El asunto es «NNNNNN es tu código para entrar a Parrilla» (con los seis dígitos delante) y el
cuerpo, «Tu código para entrar a Parrilla es NNNNNN. Vale diez minutos. Si no lo pediste,
ignora este correo.». No trae enlace: el código se escribe a mano en el paso 2. La invitación
del admin manda este mismo correo.

### Si algo se rompe al preparar el ingreso

Una tarjeta con el título «Algo se rompió», la frase «No fue nada que hicieras: no pudimos
preparar tu ingreso. Vuelve a intentarlo; el detalle quedó en la consola del navegador.» y el
botón «Reintentar».

## Qué se puede hacer

### Para entrar

1. Abrir `https://tu-parrilla.cl/ingresar`.
2. Escribir el correo con el que te invitaron y apretar «Mandarme un código».
3. Buscar en el correo el mensaje «… es tu código para entrar a Parrilla». Puede tardar un
   minuto; si no aparece, mirar en spam o promociones.
4. Escribir los seis dígitos, sin espacios, y apretar «Entrar». Se abre La Parrilla.

### Para pedir otro código

No hay botón de reenviar.

1. Apretar «Usar otro correo».
2. Escribir el mismo correo y apretar «Mandarme un código».

Cada código nuevo anula los anteriores: vale solo el último que llegó. Se pueden pedir hasta
tres códigos cada quince minutos por persona, sumando los de la web y los de la app del
teléfono. Pasado ese tope la pantalla dice lo mismo de siempre, pero no llega nada hasta que
pasen los quince minutos. Muchos pedidos seguidos desde la misma conexión también se frenan
unos minutos, con la misma pantalla.

### Para salir

1. En la barra de arriba del panel, a la derecha, apretar «Salir».

Cierra la sesión de ese navegador y deja en «Entra con tu correo». No cierra la sesión en otros
navegadores ni en la app del teléfono.

### Para entrar desde el teléfono

La app usa el mismo correo y el mismo código; su pantalla está en [app-movil.md](app-movil.md).
Pedir un código en la app anula el que se haya pedido en la web, y al revés.

## Mensajes que puede ver

| Lo que dice la pantalla | Qué significa | Qué hacer |
|---|---|---|
| «Ese correo no se ve bien.» | El campo quedó vacío o lo escrito no tiene forma de correo. | Revisar que tenga @ y dominio, sin espacios en medio. |
| «Si tu correo está invitado, te llegará un código en un minuto. Vale diez minutos.» | Sale **siempre**, esté o no invitado el correo, y aunque no se haya mandado nada por el tope de pedidos. No confirma nada. | Esperar el correo. Si no llega, ver más abajo, en Si el humano dice…, el caso del código que no llega. |
| «Ese código no es válido o ya venció.» | El código está mal escrito, pasaron más de diez minutos, ya se usó, se pidió uno más nuevo después, o ese correo no está invitado. | Usar el último código que llegó. Si venció, pedir otro. |
| «Demasiados intentos. Pide un código nuevo.» | Se probaron cinco códigos equivocados contra el mismo código, o hubo muchos intentos seguidos desde la misma conexión. Ese código ya no sirve aunque se escriba bien. | Pedir un código nuevo (ver arriba). Si el mensaje sigue saliendo con el código nuevo, esperar unos diez minutos. |
| «Algo se rompió» | Falló el servidor, no la persona. | Apretar «Reintentar». Si se repite, avisarle al admin. |

El navegador puede mostrar además su propio aviso, en el idioma del navegador, si el correo no
tiene forma de correo o el código no son seis dígitos: viene del navegador, no de Tu Parrilla.

## Si el humano dice…

- **«No me llega el código».** En orden: esperar un minuto y mirar spam y promociones;
  confirmar que el correo es exactamente el de la invitación (la pantalla no lo muestra: mirar
  la barra de direcciones, o volver con «Usar otro correo» y escribirlo de nuevo); si pidió
  más de tres en quince minutos, esperar. Si nada de eso, lo más probable es que ese correo no
  esté invitado: la pantalla responde igual a propósito. Hay que pedirle al admin que lo invite
  o lo revise en Los Maestros (quién puede entrar, [los-maestros.md](los-maestros.md)).
- **«¿Por qué no me dice si mi correo está invitado?».** Es a propósito: así nadie puede
  averiguar quién usa Tu Parrilla probando correos.
- **«El código llegó pero dice que no es válido».** Casi siempre es un código anterior (se
  pidieron dos y se escribió el primero) o pasaron más de diez minutos. Usar el último, o pedir
  otro.
- **«¿Dónde me registro?» / «No tengo cuenta».** No hay registro: se entra solo por invitación
  del admin.
- **«Olvidé mi contraseña».** No hay contraseñas; se entra siempre con un código al correo.
- **«Me sacó del panel» / «Me pide el código de nuevo».** Pasaron los treinta días de la
  sesión, se apretó «Salir», o el admin cerró sus sesiones. La pantalla no dice cuál fue. Se
  vuelve a entrar con un código nuevo.
- **«Abrí el panel en otra dirección y me mandó a tu-parrilla.cl a entrar de nuevo».** Es lo
  esperado: el panel solo se usa en tu-parrilla.cl y la sesión no pasa de un dominio a otro.
- **«Quiero cambiar el correo con el que entro».** No hay ninguna pantalla para eso.

## Lo que esta pantalla no hace

- No hay contraseñas, ni registro, ni casilla para recordar la sesión, ni entrada con Google u
  otra red.
- No dice si el correo está invitado ni si el correo con el código salió.
- No tiene botón de reenviar: otro código se pide repitiendo el paso 1.
- Después de entrar no vuelve a la página que se había abierto: siempre llega a La Parrilla.
- «Salir» no cierra la sesión del teléfono ni la de otros navegadores. Cerrar todas las
  sesiones de una persona lo hace solo el admin, en Los Maestros.

## Para quien mantiene esta página

Sale de:

- `src/app/ingresar/page.tsx`, `src/app/ingresar/codigo/page.tsx`,
  `src/app/ingresar/formularios.tsx`, `src/app/ingresar/acciones.ts` y
  `src/app/ingresar/error.tsx`: las dos pantallas, sus textos y la de error.
- `src/app/admin/login/page.tsx`: la dirección antigua.
- `src/lib/ingreso.ts`: las frases, los diez minutos, los cinco intentos y los tres códigos
  cada quince minutos.
- `src/lib/usuarios.ts`: pedir y canjear el código, y el texto del correo.
- `src/lib/limite-ip.ts`: el freno por conexión.
- `src/lib/sesion-token.ts` y `src/lib/auth.ts`: los treinta días y adónde manda sin sesión.
- `src/app/admin/(dash)/page.tsx`: `/admin` lleva a La Parrilla.
- `src/app/admin/actions.ts` (`logout`) y `src/app/admin/(dash)/layout.tsx`: «Salir».
- `src/proxy.ts` y `src/lib/dominios.ts`: el panel solo en el dominio del producto.
- `src/components/landing.tsx`: el enlace desde la portada.
- `src/app/api/mobile/session/codigo/route.ts`: el código del teléfono, que comparte tope.

Si cambias lo que se ve en alguno de ellos, actualiza esta página en el mismo commit.
