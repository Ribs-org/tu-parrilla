# Tu Cuenta — tu nombre y tu hora

`/admin/cuenta`, dentro del botón «Ajustes» de la barra de arriba (es la última pantalla del
menú; debajo, separado por una línea, solo queda el libro de sugerencias, que abre una ventana:
[libro-de-sugerencias.md](libro-de-sugerencias.md)). La ven todos los usuarios.

Tu Cuenta guarda dos datos de la persona —su nombre y su zona horaria— y muestra su plan: el
gratis o el pagado, y cuánto lleva usado de cada tope. Las llaves de API, que
estaban acá hasta el 2026-10-19, se mudaron a la cuarta pestaña de la barra, que hoy se llama
La Cocina: están en su sección «Tu propio chef» ([la-cocina.md](la-cocina.md)).

## Cómo se llega

1. En la barra de arriba, apretar el botón «Ajustes» (en una pantalla angosta, como la del
   teléfono, se ve solo el ícono, un trinche y un cuchillo, lado a lado —de día, dos palillos—, sin la palabra).
2. En el menú que se abre, apretar «Tu Cuenta», la que tiene debajo «tu nombre y tu hora».

O directo: `https://tu-parrilla.cl/admin/cuenta`.

## Qué se ve

Arriba, el título «Tu Cuenta» (se ve en mayúsculas), debajo «tu nombre y tu hora», y el párrafo
«Con qué nombre apareces, en qué zona horaria vives y qué plan tienes. El correo con el que entras
no se cambia acá. Las llaves para tu IA están en La Cocina, en «Tu propio chef».», donde «La
Cocina» es un enlace a esa pantalla.
Después, dos bloques.

### Bloque «Tus datos»

- El campo «Nombre», con la ayuda «Con el que apareces en el panel. Puede quedar vacío.». Hoy
  ese nombre solo se ve en la lista de Los Maestros (quién puede entrar), que mira el admin.
- La lista desplegable «Zona horaria», con los nombres internacionales de zona horaria, en orden
  alfabético y en inglés (del tipo `America/Santiago`).
- La línea «Ahora son las HH:MM en <zona>.». La zona de esa línea es la **guardada**, no la que
  está elegida en la lista: cambia recién después de apretar «Guardar».
- El botón «Guardar» (mientras trabaja, «Guardando…»), y al lado, «Guardado.» en verde o un
  error en rojo.

### Bloque «Tu plan»

- Solo al volver de Mercado Pago, arriba: «Listo: ya tienes el plan Maestro Parrillero.» en
  verde, o «Mercado Pago todavía no confirma la suscripción. Si la autorizaste, aparece aquí en
  unos minutos.».
- La frase con el plan que tiene: «Tienes el plan Gratis.», o «Tienes el plan Maestro Parrillero,
  de cortesía.», o «Tienes el plan Maestro Parrillero, hasta el <fecha>, de cortesía.» (con los
  nombres que tengan los planes). Si su pagado ya terminó, después: «Tu plan Maestro Parrillero
  terminó el <fecha>.».
- Si lo paga con Mercado Pago: «Lo pagas con Mercado Pago (<correo>). Próximo cobro: <fecha>.» (o, en
  pausa, «Mercado Pago tiene tu suscripción en pausa: no está cobrando (<correo>).»), y el botón
  «Cancelar la suscripción» (mientras trabaja, «Cancelando…»). Si ya la canceló y todavía le queda
  pagado: «Cancelaste la suscripción: no se vuelve a cobrar.».
- Lo que lleva usado, cada cosa con su número:
  - «Cuentas conectadas»: «2 de 7», o «2, sin tope»;
  - «Esperando en la parrilla»: cuántas publicaciones esperan salir contra su tope, igual;
  - «La cámara de frío» (de día, «La nevera»): «3,1 GB de 20 GB»;
  - «Tokens de IA este mes»: «12.400 de 100.000», o «…, sin tope»;
  - «En las colas»: «Por orden de llegada», o «Pasas primero» en el pagado.
- La frase «Llegar a un tope no borra ni desconecta nada: lo que ya está sigue, y lo nuevo espera a
  que haya lugar. Los tokens se cuentan en los borradores de La Mesa y en «Sugiéreme una», y vuelven a
  cero cada mes.».
- Solo en el gratis, un recuadro con lo que trae el pagado: «El plan Maestro Parrillero cuesta
  $34.990 al mes y trae 15 cuentas, sin tope en la parrilla, 200 GB en la cámara de frío y
  2.000.000 tokens de IA al mes, con prioridad en las colas.» (con lo que tenga hoy el pagado).
  Después:
  - donde pagar desde el panel todavía no está abierto —hoy, casi todas las cuentas—: «Por ahora lo
    da el equipo de Tu Parrilla.»;
  - donde está abierto, el campo «Correo de tu cuenta de Mercado Pago», que nace con el correo de
    Tu Parrilla, con la ayuda «Mercado Pago lo compara con la cuenta con que pagas: si no es el
    mismo, no deja autorizar.»; la frase «Los primeros 7 días son de prueba: Mercado Pago guarda la
    tarjeta y hace el primer cobro al terminar. Después cobra cada mes. Se cancela cuando quieras,
    desde aquí.» (sin la parte de la prueba si ya la usó); y el botón «Pasar a Maestro Parrillero» (mientras
    trabaja, «Abriendo Mercado Pago…»).

## Qué se puede hacer

### Para pasar al plan pagado

Solo donde pagar desde el panel está abierto (si no, el recuadro dice «Por ahora lo da el equipo de
Tu Parrilla.»).

1. En «Tu plan», revisar «Correo de tu cuenta de Mercado Pago»: tiene que ser el de la cuenta de
   Mercado Pago con que se va a pagar.
2. Apretar «Pasar a Maestro Parrillero». Se abre la página de Mercado Pago.
3. Ahí, entrar a Mercado Pago y autorizar la suscripción con una tarjeta o el saldo. Tu Parrilla no
   ve la tarjeta.
4. Mercado Pago devuelve a Tu Cuenta. Con «Listo: ya tienes el plan Maestro Parrillero.», está
   hecho. Si dice que todavía no confirma, esperar unos minutos y recargar.

La primera vez, los primeros días son de prueba: el primer cobro es al terminar. Después cobra cada
mes en la misma fecha.

### Para cancelar la suscripción

1. En «Tu plan», «Cancelar la suscripción».
2. Se abre una ventana con «¿Cancelar la suscripción?» y «No se te vuelve a cobrar. Sigues con el
   plan Maestro Parrillero hasta el <fecha>; después pasas al gratis.». Apretar «Cancelar la
   suscripción», en la ventana.

No se pierde nada de lo pagado: el plan Maestro Parrillero sigue hasta esa fecha.

### Para ver cuánto queda de cada tope

Mirar «Tu plan». Un tope no se pasa de golpe: al llegar, la pantalla que corresponde lo dice con la
frase del plan —al conectar una cuenta en Los Fierros, al programar en La Parrilla o en el teléfono—,
y los borradores de La Mesa dejan de salir hasta el mes siguiente.

### Para cambiar el nombre

1. En «Tus datos», escribir en «Nombre» (o dejarlo vacío).
2. Apretar «Guardar». Sale «Guardado.».

### Para cambiar la zona horaria

1. En «Tus datos», elegir la zona en «Zona horaria». Para Chile continental es
   `America/Santiago`.
2. Apretar «Guardar». Sale «Guardado.» y la línea «Ahora son las…» pasa a la zona nueva: ahí se
   comprueba que la hora sea la del reloj de la persona.

La zona manda en todo el panel: qué es hoy y qué es ayer en La Parrilla (la entrada del
panel), las horas del calendario y del formulario para programar, y las fechas que recibe la
API. Lo ya programado no se mueve: sale en el mismo momento de siempre, solo que el panel lo
muestra con la hora de la zona nueva.

## Mensajes que puede ver

| Lo que dice la pantalla | Qué significa | Qué hacer |
|---|---|---|
| «Escribe el correo de tu cuenta de Mercado Pago.» | Al apretar «Pasar a Maestro Parrillero», el correo quedó vacío o mal escrito. | Escribir el de la cuenta de Mercado Pago. |
| «Mercado Pago no respondió. Inténtalo de nuevo en un rato.» | Al pasar al pagado o al cancelar, Mercado Pago no contestó. No se cobró ni se canceló nada. | Volver a intentar en unos minutos. |
| «Ya tienes una suscripción: no hace falta otra.» | Ya hay una suscripción viva (también una en pausa). | Nada; para cambiar algo, cancelarla primero. |
| «Ya tienes el plan pagado.» | Ya tiene el plan Maestro Parrillero (por ejemplo, de cortesía). | Nada. |
| «Pagar desde el panel todavía no está abierto.» | Pagar no está abierto para esta cuenta. | Pedir el pagado al equipo, en el libro de sugerencias. |
| «No tienes una suscripción que cancelar.» | Se apretó «Cancelar la suscripción» cuando ya no había una viva. | Recargar. |
| «Guardado.» | El nombre y la zona quedaron guardados. | Nada. |
| «Esa zona horaria no existe.» | Se mandó una zona que el sistema no conoce. Con la lista normal no debería pasar. | Recargar la página y elegir de la lista. |

## Si el humano dice…

- **«¿Dónde genero una llave?» / «Antes las llaves estaban acá».** Se mudaron a La Cocina, la
  cuarta pestaña de la barra, sección «Tu propio chef» ([la-cocina.md](la-cocina.md)); el enlace
  «La Cocina» del párrafo de arriba lleva ahí. Las que ya tenía siguen vivas.
- **«Las horas me salen corridas».** Revisar «Zona horaria» y la línea «Ahora son las…».
- **«Quiero cambiar mi correo».** No se puede, ni acá ni en otra pantalla.
- **«Quiero cambiar el nombre o la foto de mi página».** Eso es La Vitrina (tus páginas
  públicas, [la-vitrina.md](la-vitrina.md)), no Tu Cuenta.
- **«¿Qué plan tengo?» / «¿cuánto me queda?».** En «Tu plan», en esta pantalla.
- **«Quiero el plan pagado».** Donde está abierto, «Pasar a Maestro Parrillero» en «Tu plan». Si el recuadro dice
  «Por ahora lo da el equipo de Tu Parrilla.», que escriba en el libro de sugerencias
  ([libro-de-sugerencias.md](libro-de-sugerencias.md)).
- **«Mercado Pago no me deja autorizar».** Lo más común: el correo de «Correo de tu cuenta de Mercado
  Pago» no es el de la cuenta con que entró a pagar. Corregirlo y volver a «Pasar a Maestro Parrillero».
- **«Pagué y sigo en el gratis».** Recargar Tu Cuenta en unos minutos: la confirmación de Mercado Pago
  a veces tarda. Si al día siguiente sigue igual, avisar al equipo.
- **«¿Puedo pagar desde la app del teléfono?».** No: el plan se paga en el panel web.
- **«Se acabaron mis tokens».** Vuelven a cero el primer día del mes siguiente, en su zona horaria.
  Mientras tanto, los comentarios se responden a mano en La Mesa.
- **«No encuentro Tu Cuenta en la barra».** No es una pestaña: está dentro del botón
  «Ajustes», a la derecha de la barra.

## Lo que esta pantalla no hace

- No cambia el correo, y no hay contraseña que cambiar (se entra con código,
  [ingresar.md](ingresar.md)).
- No cambia el nombre, la foto ni la dirección de la página pública: eso es La Vitrina.
- No genera ni revoca llaves: eso es La Cocina, en «Tu propio chef».
- No conecta redes: eso es Los Fierros (tus redes conectadas, [los-fierros.md](los-fierros.md)).
- No cambia el precio ni lo que trae cada plan, y no da cortesías: eso lo hace el admin en Los
  Maestros.
- No muestra los cobros pasados ni emite boletas.

## Para quien mantiene esta página

Sale de:

- `src/app/admin/(dash)/cuenta/page.tsx`: la pantalla, el párrafo de arriba y el bloque.
- `src/app/admin/(dash)/cuenta/formulario.tsx`: «Tus datos».
- `src/app/admin/(dash)/cuenta/tu-plan.tsx`, `src/lib/planes/uso.ts` y `src/lib/planes/plan.ts`: «Tu
  plan», lo que lleva usado y los números.
- `src/app/admin/(dash)/cuenta/pagar.tsx`, `src/app/admin/planes-actions.ts`, `src/lib/pagos/reglas.ts`
  y `src/lib/pagos/suscripciones.ts`: «Pasar a Maestro Parrillero», «Cancelar la suscripción», la vuelta de Mercado
  Pago y sus frases; `src/lib/redes-abiertas.ts` (`pagosAbiertosPara`): para quién está abierto.
- `src/lib/zona.ts`: la lista de zonas, la hora y «Esa zona horaria no existe.».
- `src/app/admin/actions.ts` (`guardarCuenta`).
- `src/components/charts/panel.tsx` y `src/components/ui.tsx`: el bloque, los campos y el
  botón.
- `src/lib/vocabulario.ts` y `src/app/admin/(dash)/nav.tsx`: el nombre, el subtítulo y su lugar
  en el menú «Ajustes».

Si cambias lo que se ve en alguno de ellos, actualiza esta página en el mismo commit.
