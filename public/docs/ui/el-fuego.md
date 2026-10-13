# El Fuego — qué se está cocinando ahora

`/admin`, la primera pestaña de la barra de arriba. Es la portada del panel: se llega acá cada
vez que se entra. La ven todos los usuarios.

El Fuego muestra solo lo que pide atención hoy: cómo viene la semana, qué sale hoy, qué falló y
cuánto salió ayer. En el vocabulario del panel, un corte es una publicación programada, y el
botón «Poner al fuego» lleva a programar uno. Las cifras de visitas y rendimiento no están acá:
están en Los Números (visitas, clics y de dónde vienen, [los-numeros.md](los-numeros.md)) y en
Los Cortes (cada publicación y lo que hizo, [los-cortes.md](los-cortes.md)). Qué es hoy, qué
es ayer y todas las horas salen de la zona horaria guardada en Tu Cuenta (tu nombre, tu hora y
tus llaves, [tu-cuenta.md](tu-cuenta.md)).

## Cómo se llega

- Al entrar al panel se llega siempre acá ([ingresar.md](ingresar.md)).
- La pestaña «El Fuego», la primera de la barra de arriba.
- Desde la pantalla de error del panel, el enlace «Ir a El Fuego».
- Escribiendo `https://tu-parrilla.cl/admin`.

## Qué se ve

Arriba, el título «El Fuego» (se ve en mayúsculas) y debajo, en letra chica, «qué se está
cocinando ahora». Lo que sigue depende de si hay alguna red conectada.

### Sin ninguna red conectada

Una sola tarjeta, y nada más en la pantalla:

- el título «Conecta tu primera red»;
- la frase «Sin una red conectada no hay nada que poner al fuego.»;
- el botón «Ir a Los Fierros →», que lleva a Los Fierros (tus redes conectadas,
  [los-fierros.md](los-fierros.md)).

Se ve mientras no haya ninguna red conectada: con una sola, la tarjeta se va y aparece lo de
abajo.

### Con al menos una red conectada

Cinco bloques, de arriba abajo.

**1. «La semana que viene».** A la derecha del título, un resumen en palabras:
«Todos los días tienen algo puesto.», «La semana entera está apagada.», «1 día apagado.» o
«N días apagados.». Debajo, siete casillas en fila, una por día empezando hoy. La primera dice
«Hoy»; las otras, el día abreviado («lun», «mar», «mié», «jue», «vie», «sáb», «dom»). Bajo el
día va cuántos cortes tiene, o «—» si no tiene ninguno. El fondo dice lo mismo con color: un
día sin cortes (un día apagado) se ve oscuro y con borde punteado; uno o dos, con un brillo
anaranjado; tres o más, más encendido. Al pasar el mouse sobre una casilla aparece «<día>
<número>: N cortes» (por ejemplo, «vie 16: 2 cortes»). La casilla de hoy cuenta todo lo de hoy,
lo que ya salió y lo que falta; las demás, todo lo programado para ese día.

Cada casilla es un enlace: abre La Parrilla (lo que viene y cómo salió lo que ya se fue,
[la-parrilla.md](la-parrilla.md)) en la vista de calendario, en la semana de lunes a domingo
que contiene ese día.

**2. «Ahora en la parrilla».** Todos los cortes de hoy, los que ya salieron y los que faltan, en
orden de hora. Cada fila trae:

- la hora (HH:MM);
- un ícono por cada red a la que va: verde si ya salió ahí, rojo si ahí falló. Al pasar el
  mouse sobre un ícono, «<Red> · <cuenta>: <estado>», con estado «Programado», «Publicando…»,
  «Publicado», «Falló», «Reintentando» (falló y se va a volver a intentar) o «En tu bandeja de
  TikTok» (llegó como borrador a la app de TikTok, para terminarlo desde el teléfono);
- el texto del post en una línea, o «(sin texto)» si no tiene;
- al final, el estado del corte entero: «Falló» si falló en alguna red; «Publicada» si salió en
  todas; «Saliendo ahora» si se está publicando en alguna; «Programada» en cualquier otro caso
  (también cuando salió en unas redes y en otras todavía no).

La fila entera es un enlace al editor de ese corte, en La Parrilla.

Sin cortes hoy, el bloque dice «La parrilla está fría hoy.». Si hay algo programado en los
próximos treinta días, la frase sigue con «El siguiente sale mañana a las HH:MM.» o «El
siguiente sale el <día> <número> de <mes> a las HH:MM.» (por ejemplo, «El siguiente sale el vie
2 de oct a las 09:00.»).

**3. «Se quemó»** (el título va en rojo). Aparece solo si hay algo que falló, de cualquier
fecha; si no falló nada, el bloque no existe. Cada fila es una red donde un corte falló: un
corte que falló en dos redes da dos filas. Van de la más reciente a la más vieja. Cada fila
trae:

- la hora, solo HH:MM si el corte era de hoy, o con día y mes delante si no
  («<día> <número> de <mes> · HH:MM», por ejemplo «vie 25 de sep · 09:15»);
- el ícono de la red que falló;
- el texto del post, que es un enlace a su editor en La Parrilla (o «(sin texto)»);
- debajo, en rojo, el motivo, cuando lo hay: una frase fija en español que dice por qué no
  salió;
- el botón «Reprogramar».

Al apretar «Reprogramar» se abre una ventana al centro de la pantalla, con la red y la cuenta
arriba en letra chica («<Red> · <cuenta>»), un campo de fecha y hora, y los botones «Guardar»
(apagado hasta que se elige fecha y hora) y «Cancelar». Se cierra con «Cancelar», con la tecla
Escape o con un clic fuera de ella.

**4. El botón «Poner al fuego».** Abre La Parrilla con el formulario «Programar una
publicación» ya desplegado y el cursor en el texto.

**5. El pie**, en letra chica: «Ayer no salió nada.», «Ayer: 1 corte servido» o «Ayer: N
cortes servidos». Cuando las redes ya informaron vistas de esos posts, se agrega «· M miradas»
(desde diez mil, abreviado). Cuenta cortes y no redes: uno que salió en tres redes es un corte.

## Qué se puede hacer

### Para ver qué días de la semana están vacíos

1. Mirar «La semana que viene»: las casillas con «—» y borde punteado son días sin nada.
2. Apretar la casilla de ese día para abrir su semana en el calendario de La Parrilla y
   programar ahí.

### Para programar algo nuevo

1. Apretar «Poner al fuego».
2. Seguir en La Parrilla ([la-parrilla.md](la-parrilla.md)). También se puede programar por API
   ([../api-llm.md](../api-llm.md)).

### Para ver o editar un corte de hoy

1. En «Ahora en la parrilla», apretar su fila. Se abre su editor en La Parrilla.

### Para volver a programar algo que falló

1. En «Se quemó», leer el motivo en rojo bajo la fila. Si pide reconectar la cuenta, hacerlo
   primero en Los Fierros ([los-fierros.md](los-fierros.md)).
2. Apretar «Reprogramar» en esa fila.
3. Elegir fecha y hora nuevas, en el futuro. Se leen en la zona horaria de Tu Cuenta.
4. Apretar «Guardar». La ventana se cierra y la fila sale de «Se quemó».

La hora nueva es la del corte entero, no solo la de esa red: en el calendario el corte se mueve
a esa hora. Las redes donde ya salió no se vuelven a publicar; la que falló vuelve a la cola y
sale a la hora nueva. Si el corte había fallado en otra red más, esa sigue en «Se quemó» con su
propio «Reprogramar».

## Mensajes que puede ver

| Lo que dice la pantalla | Qué significa | Qué hacer |
|---|---|---|
| «Conecta tu primera red» | No hay ninguna red conectada. | «Ir a Los Fierros →» y conectar una. |
| «La semana entera está apagada.» | No hay nada programado en los próximos siete días. | «Poner al fuego». |
| «N días apagados.» | Esos días no tienen nada programado. | Ver qué casillas dicen «—». |
| «La parrilla está fría hoy.» | Hoy no hay nada programado. | Si sigue «El siguiente sale…», ahí está lo próximo. |
| «Ayer no salió nada.» | Ningún corte de ayer salió en ninguna red. | Si algo debía salir, mirar «Se quemó». |
| El motivo en rojo bajo una fila de «Se quemó» | Por qué no salió en esa red. | Si pide reconectar, ir a Los Fierros; después «Reprogramar». |
| «La hora debe estar en el futuro.» | En «Reprogramar» se eligió una hora que ya pasó. | Elegir una hora posterior a ahora. |
| «Ese destino ya no existe.» | Esa red del corte, o el corte entero, se borró mientras la ventana estaba abierta. | Recargar la página. |
| «Algo se rompió» | Una consulta del servidor falló; no fue la persona. | «Reintentar». |

## Si el humano dice…

- **«No veo mis números» / «¿Dónde están las visitas?».** No están acá: Los Números
  ([los-numeros.md](los-numeros.md)) y Los Cortes ([los-cortes.md](los-cortes.md)).
- **«La pantalla solo dice Conecta tu primera red».** No hay ninguna red conectada. Se conecta
  en Los Fierros, dentro del engranaje «Ajustes».
- **«No me aparece el botón Poner al fuego».** Aparece solo con al menos una red conectada.
- **«No veo la sección Se quemó».** No hay nada que haya fallado: el bloque solo aparece cuando
  hay algo.
- **«Quiero quitar algo de Se quemó sin reprogramarlo».** No hay botón para descartarlo. La fila
  sale cuando ese corte vuelve a la cola (con «Reprogramar» o desde su editor en La Parrilla) o
  cuando se borra el corte.
- **«Hay fallos viejos de hace semanas en Se quemó».** Es lo esperado: la lista no tiene fecha
  límite, y un fallo se queda hasta que alguien lo reprograma.
- **«Las horas o el "hoy" no calzan».** Salen de la zona horaria de Tu Cuenta
  ([tu-cuenta.md](tu-cuenta.md)).
- **«Ayer salió algo y el pie no dice miradas».** Las redes todavía no informaron las vistas; el
  número aparece cuando llegan.
- **«¿Por qué dice Programada si ya salió en Instagram?».** El estado es del corte entero: dice
  «Publicada» solo cuando salió en todas sus redes. El ícono de cada red, en verde, dice dónde
  ya salió.

## Lo que esta pantalla no hace

- No programa ni edita aquí mismo: «Poner al fuego» y cada fila llevan a La Parrilla. Lo único
  que se cambia sin salir es la hora de un corte que falló, con «Reprogramar».
- No muestra miniaturas ni cifras de visitas, clics o tráfico.
- No muestra lo de días pasados, salvo lo que falló y el pie de ayer, ni lo que viene más allá
  de una semana (solo el aviso del siguiente corte mira hasta treinta días).
- No tiene «descartar» ni «borrar» para lo que se quemó.
- No muestra comentarios: están en La Mesa ([la-mesa.md](la-mesa.md)).

## Para quien mantiene esta página

Sale de:

- `src/app/admin/(dash)/page.tsx`: la pantalla, la tarjeta sin redes, «Ahora en la parrilla»,
  «Se quemó», «Poner al fuego» y el pie.
- `src/app/admin/(dash)/termometro.tsx`: «La semana que viene».
- `src/lib/fuego.ts`: el aviso del siguiente corte, la hora con día y el pie de ayer.
- `src/lib/parrilla.ts`: los nombres de estado del corte y los umbrales de calor del día.
- `src/lib/schedule-week.ts`: los días y meses abreviados.
- `src/lib/posts.ts` y `src/lib/social/publish/cortes.ts`: qué cuenta como conectada, hoy, ayer
  y quemado.
- `src/app/admin/(dash)/schedule/redes.tsx` y `src/app/admin/(dash)/schedule/etiqueta.ts`: los
  íconos y el estado de cada red.
- `src/app/admin/(dash)/schedule/reprogramar.tsx` y `src/app/admin/actions.ts`
  (`rescheduleTarget`): la ventana «Reprogramar» y sus errores.
- `src/components/ui.tsx` (`Encabezado`) y `src/lib/vocabulario.ts`: el título y el subtítulo.
- `src/app/globals.css`: el aspecto de los días apagados, prendidos y llenos.
- `src/app/admin/(dash)/error.tsx`: la pantalla de error.

Si cambias lo que se ve en alguno de ellos, actualiza esta página en el mismo commit.
