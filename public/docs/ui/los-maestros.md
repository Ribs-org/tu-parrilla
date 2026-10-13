# Los Maestros — quién puede entrar

`/admin/usuarios`, dentro del engranaje «Ajustes» de la barra de arriba, **solo para el admin**
(la persona dueña de esta instalación de Tu Parrilla; hay una sola). Los demás usuarios no la
ven en el menú, y si abren la dirección, el panel los devuelve a El Fuego (la portada del
panel, [el-fuego.md](el-fuego.md)) sin aviso.

Tu Parrilla es por invitación. Los Maestros es la lista de quién puede entrar: acá el admin
invita a alguien por su correo, ve quién está invitado y quién ya entró, quita una invitación
que nunca se usó y corta las sesiones abiertas de una persona.

## Cómo se llega

1. En la barra de arriba, apretar el engranaje «Ajustes» (en una pantalla angosta se ve solo el
   engranaje, sin la palabra).
2. En el menú, apretar «Los Maestros», la que tiene debajo «quién puede entrar». Está entre La
   Vitrina y Tu Cuenta.

O directo: `https://tu-parrilla.cl/admin/usuarios`.

## Qué se ve

Arriba, el título «Los Maestros» (se ve en mayúsculas), debajo «quién puede entrar», y la frase
«Quién puede entrar a Parrilla. Invitar manda el primer código al correo.». Después, dos
bloques.

### Bloque «Invitar»

- El campo «Correo», obligatorio.
- El campo «Nombre (opcional)».
- El botón «Invitar» (mientras trabaja, «Invitando…»).
- Al lado, el resultado: «Invitado. Le llegó su primer código.» en verde, o un aviso o un error
  en rojo.

### Bloque «Invitados»

Una fila por persona, en el orden en que fueron invitadas (la más antigua primero), incluida la
del admin. Cada fila trae:

- «<nombre> · <correo>», o solo el correo si no tiene nombre. El nombre es el que se puso al
  invitar o el que la persona guardó después en Tu Cuenta;
- una etiqueta, y según la etiqueta, un botón:

| Etiqueta | Qué significa | Botón |
|---|---|---|
| «admin» | Es el admin. | Ninguno. |
| «invitado <fecha>» | Fue invitado ese día y todavía no ha entrado nunca. | «Quitar» |
| «entró <fecha>» | Ya entró; la fecha es la de su **primer** ingreso, no la del último. | «Cerrar sesiones» |

Las fechas van en números (día-mes-año).

## Qué se puede hacer

### Para invitar a alguien

1. En «Invitar», escribir su correo en «Correo» y, si se quiere, su nombre en «Nombre
   (opcional)».
2. Apretar «Invitar».
3. Con «Invitado. Le llegó su primer código.», la persona aparece en «Invitados» con la etiqueta
   «invitado <fecha>».

La invitación hace tres cosas: deja entrar a ese correo, le manda de inmediato un código para
entrar (el mismo correo de siempre, «NNNNNN es tu código para entrar a Parrilla», que vale diez
minutos y **no trae enlace**), y le crea su página pública, ya publicada, que después edita en
La Vitrina (tus páginas públicas, [la-vitrina.md](la-vitrina.md)). La dirección de esa página sale de lo que va antes
de la @ del correo, con un número al final si ya está tomada.

Conviene decirle a la persona dónde entrar: `https://tu-parrilla.cl/ingresar`. Si el código de
la invitación se le venció, ahí pide otro con su correo ([ingresar.md](ingresar.md)).

### Para quitar una invitación

Solo para quien nunca entró (etiqueta «invitado <fecha>»).

1. Apretar «Quitar» en su fila.
2. El navegador pregunta «¿Quitar la invitación?». Aceptar.

La fila desaparece. Se borra también la página pública que se le creó al invitarlo. Ese correo
ya no puede entrar, y se puede volver a invitar cuando se quiera.

### Para cortar las sesiones de alguien

Solo para quien ya entró (etiqueta «entró <fecha>»).

1. Apretar «Cerrar sesiones» en su fila.
2. El navegador pregunta «¿Cerrar las sesiones de esta persona? Tendrá que entrar de nuevo con
   un código.». Aceptar.

No aparece confirmación: la fila queda igual. Desde su siguiente paso, esa persona sale del
panel en todos sus navegadores y de la app del teléfono, y tiene que pedir un código nuevo.
**No le quita el acceso**: su correo sigue invitado y puede volver a entrar cuando quiera. Y no
toca sus llaves de API, que siguen funcionando hasta que ella las revoque en Tu Cuenta.

## Mensajes que puede ver

| Lo que dice la pantalla | Qué significa | Qué hacer |
|---|---|---|
| «Invitado. Le llegó su primer código.» | Quedó invitado y el correo con el código salió. | Decirle a la persona que entre en `https://tu-parrilla.cl/ingresar` y que el código vale diez minutos. |
| «Invitado, pero el correo no salió: revisa Resend.» | Quedó invitado, pero el envío del código falló. Resend es el servicio que manda los correos. | Revisar el servicio de correo. Mientras tanto, la persona puede pedir un código en `/ingresar`; si el correo sigue sin salir, tampoco le va a llegar. |
| «Ese correo no se ve bien.» | Lo escrito en «Correo» no tiene forma de correo. | Corregirlo. |
| «Ese correo ya está invitado.» | Ya hay alguien con ese correo en «Invitados». | Nada que invitar. Si no le llega el código, que lo pida en `/ingresar`. |
| «No se pudo invitar: la página del usuario no se pudo crear. Intenta de nuevo.» | Falló la creación de su página; la invitación no quedó hecha. | Volver a apretar «Invitar». |
| «¿Quitar la invitación?» | Confirmación antes de quitar. | Aceptar para quitar; cancelar para dejarla. |
| «Ese usuario ya entró alguna vez; no se puede quitar todavía.» | La persona entró después de que se cargó la lista. | Recargar: su fila ahora dice «entró <fecha>». |
| «No se pudo quitar al usuario. Intenta de nuevo.» | Falló el borrado. | Volver a intentar. |
| «¿Cerrar las sesiones de esta persona? Tendrá que entrar de nuevo con un código.» | Confirmación antes de cortar sus sesiones. | Aceptar o cancelar. |

Si se aprieta «Invitar» con el correo vacío o con una forma que el navegador no acepta, el
navegador muestra su propio aviso, en su idioma.

## Si el humano dice…

- **«No veo Los Maestros».** Solo el admin la ve. Para cualquier otra persona no existe en el
  menú.
- **«Invité a alguien y no le llegó nada».** Que revise spam y que pida un código nuevo en
  `https://tu-parrilla.cl/ingresar` con el mismo correo. Si al invitar salió «el correo no
  salió», el problema es el servicio de correo, no la invitación.
- **«Me equivoqué de correo al invitar».** Si nunca entró, «Quitar» en esa fila e invitar el
  correo bueno.
- **«Quiero sacar a alguien que ya entró».** No se puede desde el panel. «Cerrar sesiones» lo
  saca de sus sesiones abiertas, pero puede volver a entrar pidiendo un código.
- **«A alguien le robaron el teléfono» / «se filtró su acceso».** «Cerrar sesiones» corta el
  panel y la app de esa persona. Si además se filtró una llave de API, la tiene que revocar ella
  en Tu Cuenta ([tu-cuenta.md](tu-cuenta.md)): el admin no puede.
- **«¿Cuándo entró por última vez?».** No se muestra: «entró <fecha>» es su primer ingreso.
- **«No veo el botón Quitar».** Solo aparece para quien nunca entró.
- **«No veo Cerrar sesiones en mi propia fila».** La fila del admin no tiene botones. Para salir
  del propio navegador está «Salir», en la barra de arriba.

## Lo que esta pantalla no hace

- No quita a alguien que ya entró.
- No cambia roles: no se puede hacer admin a otra persona.
- No reenvía el código: la persona lo pide en `/ingresar`.
- No edita el correo ni el nombre de un invitado (el nombre lo cambia cada uno en Tu Cuenta).
- No muestra ni revoca las llaves de API de otros, y «Cerrar sesiones» no las toca.
- No da acceso a los datos de nadie: cada usuario ve solo sus redes, sus publicaciones y sus
  páginas, también el admin.

## Para quien mantiene esta página

Sale de:

- `src/app/admin/(dash)/usuarios/page.tsx`: la pantalla, la lista y sus etiquetas.
- `src/app/admin/(dash)/usuarios/formularios.tsx`: «Invitar», «Quitar», «Cerrar sesiones», sus
  confirmaciones y sus mensajes.
- `src/app/admin/actions.ts` (`invitarUsuario`, `quitarUsuario`, `cerrarSesionesUsuario`): el
  aviso del correo que no salió y el error de la página.
- `src/lib/usuarios.ts`: invitar, la página que se crea, quitar y cerrar sesiones.
- `src/lib/ingreso.ts`: «Ese correo no se ve bien.», «Ese correo ya está invitado.» y «Ese
  usuario ya entró alguna vez; no se puede quitar todavía.».
- `src/lib/slugs.ts`: la dirección de la página nueva.
- `src/lib/auth.ts`: quién no es admin vuelve a El Fuego.
- `src/lib/vocabulario.ts` y `src/app/admin/(dash)/nav.tsx`: el nombre, el subtítulo y que solo
  el admin la vea en «Ajustes».

Si cambias lo que se ve en alguno de ellos, actualiza esta página en el mismo commit.
