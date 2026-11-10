# Los Maestros — quién puede entrar

`/admin/usuarios`, dentro del botón «Ajustes» de la barra de arriba, **solo para el admin**
(la persona dueña de esta instalación de Tu Parrilla; hay una sola). Los demás usuarios no la
ven en el menú, y si abren la dirección, el panel los devuelve a La Parrilla (la entrada del
panel, [la-parrilla.md](la-parrilla.md)) sin aviso.

Tu Parrilla es por invitación. Los Maestros es la lista de quién puede entrar: acá el admin
invita a alguien por su correo, ve quién está invitado y quién ya entró, quita una invitación
que nunca se usó, corta las sesiones abiertas de una persona y traspasa una cuenta conectada de
una persona a otra. También es donde se ajustan los dos planes —el gratis y el pagado— y se le da
el pagado a alguien sin que pague.

## Cómo se llega

1. En la barra de arriba, apretar el botón «Ajustes» (en una pantalla angosta se ve solo el
   ícono, un trinche y un cuchillo, lado a lado —de día, dos palillos—, sin la palabra).
2. En el menú, apretar «Los Maestros», la que tiene debajo «quién puede entrar». Está entre La
   Vitrina y Las Sugerencias ([las-sugerencias.md](las-sugerencias.md)).

O directo: `https://tu-parrilla.cl/admin/usuarios`.

## Qué se ve

Arriba, el título «Los Maestros» (se ve en mayúsculas), debajo «quién puede entrar», y la frase
«Quién puede entrar a Tu Parrilla. Invitar manda el primer código al correo.». Después, cuatro
bloques (cinco con «Los cobros»).

### Bloque «Los planes»

La frase «Lo que trae cada plan. Las funciones son las mismas en los dos; cambian los topes, el
espacio, los tokens y quién pasa primero en las colas. Toda persona nace en el gratis.», y dos
tarjetas, «El gratis» y «El pagado», cada una con sus campos ya llenos con lo que tiene hoy:

- «Nombre»: como lo ve la persona en Tu Cuenta y en los avisos de los topes (hoy «Gratis» y
  «Maestro Parrillero»);
- solo en el pagado, «Precio al mes (CLP, con IVA)» y «Días de prueba». El gratis no tiene: no se
  cobra;
- «Cuentas conectadas», «Esperando en la parrilla» y «Tokens de IA al mes», cada uno con la ayuda
  «Vacío, sin tope.»;
- «Cámara de frío (GB)»;
- «Prioridad», con la ayuda «Más alta, primero en las colas.»;
- el botón «Guardar» (mientras trabaja, «Guardando…») y, al lado, «Guardado.» en verde o el error
  en rojo.

### Bloque «Los cobros»

Solo si la instalación tiene Mercado Pago configurado, o si ya hubo algún cobro. Los últimos
cincuenta cobros de las suscripciones al plan pagado, del más nuevo al más viejo, uno por línea: la
fecha, el correo de quien paga (o «(persona borrada)»), el monto, como «$34.990», y el estado:
«aprobado» en verde, «rechazado», «pendiente», «devuelto», «anulado» o «sin pago todavía». Debajo de
uno que no se aprobó, en chico, el detalle que dio Mercado Pago (por ejemplo `cc_rejected_insufficient_amount`).
Sin cobros: «Todavía no hay cobros.».

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

- su plan, en letra chica: «Gratis»; «Maestro Parrillero · cortesía» (sin fecha) o «Maestro
  Parrillero · cortesía hasta el <fecha>»; «Maestro Parrillero · lo paga hasta el <fecha>» si lo
  paga con Mercado Pago (la fecha es la del próximo cobro más la gracia); o, si ya terminó, «Gratis ·
  su plan Maestro Parrillero venció el <fecha>» (con los nombres
  que tengan los planes). Al lado, el botón «Plan» (ver «Para darle el pagado a alguien», abajo);
- con la cocina encendida, «cocina desde <fecha>»;
- con la cocina encendida, o si le quedó algo guardado de cuando la tuvo, cuánto ocupa en la cámara de
  frío de La Cocina y cuánto le cabe —la de su plan, o la que el admin le puso—: «La cámara de frío:
  3,2 GB de 20 GB» (de día, «La nevera: …»), con «(a mano)» al final si el admin le cambió la cuota,
  y el botón «Cambiar la cuota» (ver «Para
  cambiarle la cuota de la cámara a alguien», abajo);
- en todas las filas, abajo y en letra chica, «id» y el identificador del usuario, que se puede
  seleccionar y copiar. Es lo que piden las variables que encienden algo solo para una cuenta
  (por ejemplo, el mensaje privado o Threads para la cuenta del revisor de Meta);
- en todas las filas, también la del admin, el botón de La Cocina: «Encender la cocina» o
  «Apagar la cocina» (mientras trabaja, «Encendiendo…» o «Apagando…»). Ver «Para encender o
  apagar la cocina de alguien», abajo.

Las fechas van en números (día-mes-año).

### Bloque «Traspasar una cuenta»

- La frase «Se lleva sus publicaciones, sus números y sus comentarios. No se borra nada, en la red
  no cambia nada y se puede devolver. Lo programado que sale también a otras cuentas se queda con
  quien lo programó, y sale igual.».
- La lista «Cuenta», con «Elige una cuenta» arriba y una opción por cada cuenta de cada persona:
  la red, el nombre de la cuenta, el correo de quien la tiene, cuántas publicaciones tiene y, si
  las hay, cuántas están por salir. Por ejemplo, «Instagram · @cuenta · ana@ejemplo.cl · 34
  publicaciones, 2 por salir».
- La lista «Pasa a», con «Elige a quién» arriba y un correo por persona, sin quien ya tiene la
  cuenta. Se activa al elegir la cuenta.
- El botón «Traspasar» (mientras trabaja, «Traspasando…»), activo con las dos listas elegidas.
- Debajo, el resultado: en verde lo que pasó, o un error en rojo.

## Qué se puede hacer

### Para invitar a alguien

1. En «Invitar», escribir su correo en «Correo» y, si se quiere, su nombre en «Nombre
   (opcional)».
2. Apretar «Invitar».
3. Con «Invitado. Le llegó su primer código.», la persona aparece en «Invitados» con la etiqueta
   «invitado <fecha>».

La invitación hace tres cosas: deja entrar a ese correo, le manda de inmediato un código para
entrar (el correo «Te invitaron a Tu Parrilla: tu código es NNNNNN», con el botón «Entrar a Tu
Parrilla»; el código vale diez minutos), y le crea su página pública, ya publicada, que después edita en
La Vitrina (tus páginas públicas, [la-vitrina.md](la-vitrina.md)). La dirección de esa página sale de lo que va antes
de la @ del correo, con un número al final si ya está tomada.

El correo ya dice dónde entrar y, si el código se le venció, dónde pedir otro:
`https://tu-parrilla.cl/ingresar`, con su correo ([ingresar.md](ingresar.md)).

### Para quitar una invitación

Solo para quien nunca entró (etiqueta «invitado <fecha>»).

1. Apretar «Quitar» en su fila.
2. Se abre una ventana con «¿Quitar la invitación?». Apretar «Quitar», en la ventana.

La fila desaparece. Se borra también la página pública que se le creó al invitarlo. Ese correo
ya no puede entrar, y se puede volver a invitar cuando se quiera.

### Para cortar las sesiones de alguien

Solo para quien ya entró (etiqueta «entró <fecha>»).

1. Apretar «Cerrar sesiones» en su fila.
2. Se abre una ventana con «¿Cerrar las sesiones de esta persona?» y «Tendrá que entrar de nuevo
   con un código.». Apretar «Cerrar sesiones», en la ventana.

No aparece confirmación: la fila queda igual. Desde su siguiente paso, esa persona sale del
panel en todos sus navegadores y de la app del teléfono, y tiene que pedir un código nuevo.
**No le quita el acceso**: su correo sigue invitado y puede volver a entrar cuando quiera. Y no
toca sus llaves de API, que siguen funcionando hasta que ella las revoque en La Cocina, en «Tu
propio chef».

### Para encender o apagar la cocina de alguien

La Cocina es el chef de la casa: el editor que recibe el material crudo y devuelve los creativos
([la-cocina.md](la-cocina.md)). Está en piloto, y cada cuenta la tiene encendida o apagada.

- **Para encenderla:** apretar «Encender la cocina» en su fila. No pregunta. La fila pasa a decir
  «cocina desde <fecha>», y esa persona ve sus comandas en La Cocina.
- **Para apagarla:** apretar «Apagar la cocina». Se abre una ventana con «¿Apagar la cocina de
  <correo>?» y «El chef deja de ver sus comandas.». Apretar «Apagar la cocina», en la ventana. Las comandas no se borran: el chef deja
  de verlas, y vuelve a verlas si se enciende de nuevo.

El admin también la enciende para sí mismo, en su propia fila.

### Para cambiar lo que trae un plan

1. En «Los planes», en la tarjeta del plan, cambiar lo que haga falta: el nombre, el precio, los
   días de prueba, cada tope, la cámara de frío o la prioridad. Un tope vacío es sin tope. Los
   números se escriben con o sin puntos de miles («34.990» o «34990»).
2. «Guardar». Con «Guardado.», el cambio vale desde ya para todos los de ese plan.

Bajar un tope no borra ni desconecta nada: quien tenía más sigue con lo suyo, y no puede sumar
hasta quedar bajo el tope nuevo.

### Para darle el pagado a alguien

Sin que pague: el pagado se da acá, como cortesía. Una cortesía sobre alguien que paga con Mercado
Pago no le cancela la suscripción: la cancela esa persona, en Tu Cuenta.

1. En su fila, «Plan».
2. Se abre la ventana «El plan de <correo>», con «Ahora: <su plan>.».
3. En «Cortesía hasta», elegir el día en que termina, o dejarlo vacío para que sea sin fecha. La
   ayuda lo dice: «Vacía, sin fecha. Le da el plan Maestro Parrillero sin pagar; al terminar, vuelve sola al
   gratis.».
4. «Dar cortesía» (mientras trabaja, «Guardando…»). La fila pasa a decir «Maestro Parrillero ·
   cortesía» o «Maestro Parrillero · cortesía hasta el <fecha>».

Para quitárselo, en la misma ventana, «Pasar al gratis». «Cancelar» la cierra sin cambiar nada. La
cortesía termina al final del día elegido, en la zona del admin.

### Para cambiarle la cuota de la cámara a alguien

La cámara de frío es donde cada uno guarda su material en bruto para el chef
([la-camara-de-frio.md](la-camara-de-frio.md)). A cada uno le cabe lo de su plan (hoy 20 GB en el
gratis y 200 GB en el pagado), salvo que el admin diga otra cosa acá, que gana sobre la del plan.

1. En su fila, «Cambiar la cuota».
2. En la ventana «La cuota de <correo>», escribir en «GB» cuántos le caben: un número de 1 a 10.000,
   como «50» o «7,5». Vacío, vuelve a la de su plan. La ayuda lo dice: «Vacía, la de su plan: 20 GB.
   Lo que ya tiene guardado no se borra aunque la bajes.» (con lo que le cabe en su plan).
3. «Guardar» (mientras trabaja, «Guardando…»). «Cancelar» la cierra sin cambiar nada.

Si se le baja por debajo de lo que tiene guardado, no se borra nada: no puede guardar más hasta que
saque algo.

### Para traspasar una cuenta

Cuándo: una cuenta tiene que pasar a otra persona sin perder su historial. Por ejemplo, cuando
sale «… ya está conectada por otra persona en Tu Parrilla.» y no conviene usar «Quitar», que borra
todo lo que se bajó de ella ([los-fierros.md](los-fierros.md)).

1. En «Traspasar una cuenta», elegir la cuenta en «Cuenta».
2. Elegir en «Pasa a» a quién se la lleva.
3. Apretar «Traspasar».
4. Se abre una ventana con «¿Traspasar <cuenta> de <correo> a <correo>?» y «Se lleva <publicaciones>,
   sus números y sus comentarios. Se puede devolver desde aquí.». Apretar «Traspasar», en la ventana.
5. Con «<cuenta> ya es de <correo>. Falta que esa persona la reconecte en Los Fierros.», la cuenta
   ya está en el otro usuario.
6. Quien la recibió aprieta «Reconectar» en Los Fierros, para dejar la conexión a su nombre.

Mientras tanto la cuenta sigue funcionando con la conexión de antes. Pasa una sola cuenta: la
página de Facebook de un Instagram es otra cuenta y se traspasa aparte.

Qué se mueve: la cuenta, sus publicaciones y sus números, sus comentarios y lo programado que sale
solo a ella, también lo que está por salir. Lo programado que sale además a otras cuentas se queda
en La Parrilla de quien lo programó, y sale igual en todas.

Para devolverla, se traspasa de vuelta, con estos mismos pasos.

## Mensajes que puede ver

| Lo que dice la pantalla | Qué significa | Qué hacer |
|---|---|---|
| «La cuota es un número de GB, de 1 a 10.000, como 20 o 50. Vacía, vuelve a la de su plan.» | En «Cambiar la cuota», lo escrito no es un número de GB razonable. | Escribir un número, o dejarlo vacío. |
| «Guardado.» | La tarjeta del plan se guardó. | Nada. |
| «El nombre del plan va de 1 a 40 caracteres.» | En «Los planes», el nombre quedó vacío o muy largo. | Corregirlo y «Guardar». |
| «El precio es un número entero de pesos, como 34990. El gratis va en 0.» | El precio tiene decimales, letras o es demasiado grande. | Escribir los pesos sin decimales. |
| «Los días de prueba van de 0 a 60.» | Lo escrito en «Días de prueba» no es un número de 0 a 60. | Corregirlo. |
| «Cada tope es un número entero mayor que cero, o vacío para dejarlo sin tope.» | Un tope tiene un 0, un número negativo o letras. | Escribir un número, o dejarlo vacío. |
| «La cámara de frío es un número de GB, de 1 a 10.000, como 20 o 100.» | «Cámara de frío (GB)» quedó vacía o fuera de rango. | Escribir los GB. |
| «La prioridad es un número entero de 0 a 9.» | Lo escrito en «Prioridad» no es un número de 0 a 9. | Corregirlo. |
| «La fecha no se entendió: elige un día, o déjala vacía para que sea sin fecha.» | En «Plan», la fecha de la cortesía no se pudo leer. | Elegirla de nuevo con el calendario. |
| «La cortesía tiene que terminar después de hoy.» | En «Plan», el día elegido ya pasó. | Elegir uno que no haya pasado, o dejarla sin fecha. |
| «Invitado. Le llegó su primer código.» | Quedó invitado y el correo con el código salió. | Avisarle que busque «Te invitaron a Tu Parrilla» en su correo (o en spam) y apriete el botón: el código vale diez minutos. |
| «Invitado, pero el correo no salió: revisa Resend.» | Quedó invitado, pero el envío del código falló. Resend es el servicio que manda los correos. | Revisar el servicio de correo. Mientras tanto, la persona puede pedir un código en `/ingresar`; si el correo sigue sin salir, tampoco le va a llegar. |
| «Ese correo no se ve bien.» | Lo escrito en «Correo» no tiene forma de correo. | Corregirlo. |
| «Ese correo ya está invitado.» | Ya hay alguien con ese correo en «Invitados». | Nada que invitar. Si no le llega el código, que lo pida en `/ingresar`. |
| «No se pudo invitar: la página del usuario no se pudo crear. Intenta de nuevo.» | Falló la creación de su página; la invitación no quedó hecha. | Volver a apretar «Invitar». |
| «Ese correo no se ve bien.» | Se apretó «Invitar» con el correo vacío o sin forma de correo. | Corregirlo. |
| «¿Quitar la invitación?» | Ventana antes de quitar. | «Quitar» para quitarla; «Cancelar» para dejarla. |
| «Ese usuario ya entró alguna vez; no se puede quitar todavía.» | La persona entró después de que se cargó la lista. | Recargar: su fila ahora dice «entró <fecha>». |
| «No se pudo quitar al usuario. Intenta de nuevo.» | Falló el borrado. | Volver a intentar. |
| «¿Cerrar las sesiones de esta persona?» y «Tendrá que entrar de nuevo con un código.» | Ventana antes de cortar sus sesiones. | «Cerrar sesiones» o «Cancelar». |
| «¿Apagar la cocina de <correo>?» y «El chef deja de ver sus comandas.» | Ventana antes de apagarle la cocina. | «Apagar la cocina» o «Cancelar». |
| «Esa persona ya no está en Los Maestros.» | Se quitó entre que se cargó la lista y se apretó el botón de la cocina, «Plan» o «Traspasar». | Recargar. |
| «¿Traspasar <cuenta> de <correo> a <correo>?» y «Se lleva <publicaciones>, sus números y sus comentarios. Se puede devolver desde aquí.» | Ventana antes de traspasar. | «Traspasar» o «Cancelar». |
| «<cuenta> ya es de <correo>. Falta que esa persona la reconecte en Los Fierros.» | El traspaso salió. | Avisarle a esa persona que apriete «Reconectar». |
| «Esa cuenta ya no está.» | La quitaron entre que se cargó la lista y se apretó «Traspasar». | Recargar. |
| «Esa cuenta ya es de esa persona.» | Alguien la traspasó entre que se cargó la lista y se apretó «Traspasar». | Recargar. |
| «No se pudo traspasar la cuenta. Intenta de nuevo.» | Falló el traspaso y no cambió nada. | Volver a intentar. |

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
  en La Cocina, en «Tu propio chef» ([la-cocina.md](la-cocina.md)): el admin no puede.
- **«¿Cuándo entró por última vez?».** No se muestra: «entró <fecha>» es su primer ingreso.
- **«No veo el botón Quitar».** Solo aparece para quien nunca entró.
- **«No veo Cerrar sesiones en mi propia fila».** La fila del admin no lo tiene: solo el botón de
  La Cocina. Para salir del propio navegador está «Salir», en la barra de arriba.
- **«¿Cómo le doy el chef de la casa a alguien?».** «Encender la cocina», en su fila.
- **«¿Cómo le doy el plan pagado a alguien?» / «quiero darle más espacio o más tokens».** «Plan», en
  su fila, y «Dar cortesía». Solo más espacio: «Cambiar la cuota».
- **«Le di una cortesía y su fila sigue diciendo Gratis».** Si dice «Gratis · su plan Maestro
  Parrillero venció el <fecha>», la cortesía ya terminó: darle otra, con otra fecha o sin fecha.
- **«Cambié un tope y alguien quedó pasado».** No pierde nada: no puede sumar hasta quedar bajo el
  tope.
- **«Apagué la cocina de alguien: ¿perdió sus comandas?».** No: siguen ahí. El chef deja de verlas
  hasta que se encienda de nuevo.
- **«Quiero pasarle una cuenta a otra persona» / «una agencia recibe la cuenta de un cliente».**
  «Traspasar una cuenta», en esta pantalla, sin borrar nada. Después, esa persona aprieta
  «Reconectar» en Los Fierros.
- **«Traspasé una cuenta y quiero deshacerlo».** Se traspasa de vuelta, en el mismo bloque.
- **«Traspasé una cuenta y sigo viendo publicaciones suyas en mi Parrilla».** Son las que salían
  también a otras cuentas: se quedan con quien las programó.

## Lo que esta pantalla no hace

- No quita a alguien que ya entró.
- No cambia roles: no se puede hacer admin a otra persona.
- No reenvía el código: la persona lo pide en `/ingresar`.
- No edita el correo ni el nombre de un invitado (el nombre lo cambia cada uno en Tu Cuenta).
- No muestra ni revoca las llaves de API de otros, y «Cerrar sesiones» no las toca.
- No da acceso a los datos de nadie: cada usuario ve solo sus redes, sus publicaciones y sus
  páginas, también el admin. De las cuentas ajenas, el admin ve aquí solo lo que trae la lista de
  «Cuenta» para traspasarlas.
- No cancela la suscripción de nadie: la cancela cada uno en Tu Cuenta, o en Mercado Pago.
- No emite boletas: «Los cobros» es la lista para hacerlas.
- No traspasa varias cuentas de una vez, ni pide el acuerdo de quien la tiene o de quien la recibe:
  lo decide el admin.

## Para quien mantiene esta página

Sale de:

- `src/app/admin/(dash)/usuarios/page.tsx`: la pantalla, la lista y sus etiquetas.
- `src/app/admin/(dash)/usuarios/formularios.tsx`: «Invitar», «Quitar», «Cerrar sesiones», el
  botón de La Cocina, «Cambiar la cuota», «Traspasar una cuenta», sus confirmaciones y sus mensajes.
- `src/app/admin/(dash)/usuarios/planes.tsx`: «Los planes» (las tarjetas) y el botón «Plan».
- `src/lib/pagos/suscripciones.ts` (`cobrosRecientes`) y `src/lib/pagos/reglas.ts` (`estadoDePagoEnPalabras`): «Los cobros».
- `src/app/admin/planes-actions.ts` y `src/lib/planes/plan.ts`: guardar un plan, dar una cortesía y
  pasar al gratis, con sus frases, y el plan de cada fila en palabras (`planEnPalabras`).
- `src/lib/cocina/materiales.ts` (`ocupadoPorUsuario`, `cambiarCuotaDeLaCamara`) y `src/lib/cocina/bodega.ts`: cuánto ocupa cada uno y la frase de una cuota que no se entiende.
- `src/lib/cocina/panel.ts` (`encenderCocinaDe`): qué hace encender o apagar la cocina.
- `src/lib/social/traspasar.ts`: qué se mueve en un traspaso, la lista de cuentas y sus frases.
- `src/app/admin/actions.ts` (`invitarUsuario`, `quitarUsuario`, `cerrarSesionesUsuario`,
  `encenderCocina`, `cambiarCuotaDeLaCamaraAccion`, `traspasarCuentaAccion`): el aviso del correo que no salió, el error de la
  página y el de la cocina.
- `src/lib/usuarios.ts`: invitar, la página que se crea, quitar y cerrar sesiones.
- `src/lib/ingreso.ts`: «Ese correo no se ve bien.», «Ese correo ya está invitado.» y «Ese
  usuario ya entró alguna vez; no se puede quitar todavía.».
- `src/lib/slugs.ts`: la dirección de la página nueva.
- `src/lib/auth.ts` y `src/app/admin/(dash)/page.tsx`: quién no es admin vuelve a La Parrilla.
- `src/lib/vocabulario.ts` y `src/app/admin/(dash)/nav.tsx`: el nombre, el subtítulo y que solo
  el admin la vea en «Ajustes».

Si cambias lo que se ve en alguno de ellos, actualiza esta página en el mismo commit.
