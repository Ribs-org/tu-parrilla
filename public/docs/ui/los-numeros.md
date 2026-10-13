# Los Números — cómo te fue en las redes y en tu página

`/admin/analytics` — pestaña «Los Números» de la barra de arriba del panel, la tercera y última (en el README y en documentos viejos se llama «Analítica»). Un clic adentro está `/admin/analytics/publicaciones`, «Tus publicaciones»: la lista de cada publicación, que hasta el 2026-10-13 era la pestaña «Los Cortes» (`/admin/content`, que ahora lleva ahí).

Un tablero con dos mitades que miden cosas distintas y lo dicen. «En las redes» es lo que
hicieron las publicaciones de la persona donde se publicaron —views ganadas, seguidores,
likes—, y lo cuentan las redes. «En tu página» es quién entró a su página pública de links (la
de [La Vitrina](la-vitrina.md), la que va en la bio) y qué apretó: visitas, clicks, de dónde
llegó la gente, con qué etiqueta `?s=`, desde dónde, con qué equipo y a qué hora; eso lo mide
Tu Parrilla, sin cookies. Las une la etiqueta `?s=` de cada publicación: si el link con esa
etiqueta está pegado en el post, las visitas que llegan por él se le cuentan a ese post. Cada
mitad muestra dos números y una lista corta; el resto aparece al apretar su «⋯ Más». La lista
completa, una publicación por fila, con su etiqueta editable y el botón para copiar su link,
está en «Tus publicaciones».

## Cómo se llega

- En la barra de arriba, la pestaña «Los Números» (la tercera y última: «La Parrilla», «La
  Mesa», «Los Números»). En un teléfono, si no se ve, la barra se desliza hacia el lado. La
  pestaña sigue marcada dentro de «Tus publicaciones».
- Apretar la pestaña estando ya en el tablero, o desde «Tus publicaciones», deja el tablero
  como al entrar: 30 días, todas las cuentas, todas las páginas, sin bots y con los dos «⋯ Más»
  cerrados.
- A «Tus publicaciones»: en el tablero, mitad «En las redes», el enlace «Ver todas las
  publicaciones →», a la derecha del título «Lo que más creció». Llega con el mismo período y
  la misma cuenta.
- La dirección vieja de Los Cortes, `/admin/content`, redirige a «Tus publicaciones»
  conservando el período y «Todas las recientes». Si el enlace traía «Solo con métricas» o «Ver
  borrados», llega con el «⋯ Más» abierto y esos filtros prendidos. El filtro por red de antes
  ya no existe y se pierde.
- De «Tus publicaciones» al tablero: arriba a la izquierda, una flecha hacia la izquierda y
  «Los Números». Vuelve con el período y la cuenta (y con la página y «Bots» que estuvieran
  elegidos en el tablero), y con los «⋯ Más» cerrados.

## Qué se ve

Los títulos de las mitades y de los paneles, los rótulos de las cifras y las columnas se ven
en mayúsculas en pantalla; aquí van escritos como están en el código. De arriba abajo:

### Encabezado

El título «Los Números», debajo en chico «cómo te fue en las redes y en tu página», y una línea
más: «Dos cosas distintas: lo que hicieron tus publicaciones en las redes, y quién entró a tu
página de links. El período vale para las dos.»

### El período

Cinco botones: «Hoy», «7 días», «30 días», «90 días», «Todo». El elegido queda resaltado en
naranjo; al entrar es «30 días». Vale para todo el tablero, las dos mitades. Mientras carga el
cambio, la fila se ve más tenue.

### Mitad «En las redes»

**La cabeza.** El título «En las redes» y debajo «Lo que hicieron tus publicaciones donde las
publicaste. Lo cuentan las redes.» A la derecha:

- Un selector de cuenta, **solo si la persona tiene más de una cuenta en
  [Los Fierros](los-fierros.md)** (conectada o no): «Todas las cuentas», y una opción por cuenta
  con el patrón «<red> · <nombre de la cuenta>», por ejemplo «Instagram · @juan». El nombre es
  el mismo que muestra Los Fierros (el @usuario en Instagram, el nombre de la página en
  Facebook, el título del canal en YouTube…); si la cuenta no tiene nombre, sale solo la red.
- «⋯ Más», que abre el resto de esta mitad. Abierto, dice «Menos».

**Dos cifras**, cada una con su aclaración debajo:

| Rótulo | Aclaración debajo |
|---|---|
| «Views ganadas» | «En el período · sin YouTube» |
| «Seguidores ganados» | «En el período · sin YouTube» |

«Seguidores ganados» lleva un «+» delante cuando es más que cero. Cualquiera de las dos puede
mostrar «—» (ver «Cómo leer cada número»).

**Panel «Lo que más creció»**, explicación «Las publicaciones que más views ganaron en el
período, de cualquier fecha.» A la derecha del título, el enlace «Ver todas las publicaciones
→». Hasta cinco filas, de más a menos views ganadas, cada una con una barra detrás que compara
con la primera: el texto del post (o su etiqueta, si no tiene texto), en chico la cuenta con
el patrón «<red> · <nombre de la cuenta>», y a la derecha las views ganadas. Si la red dio el
enlace del post, la fila lo abre en otra pestaña.

**Con «⋯ Más» abierto**, debajo aparece:

- Tres cifras más:

  | Rótulo | Aclaración debajo |
  |---|---|
  | «Interacciones» | «Likes, comentarios y compartidos ganados · sin YouTube» |
  | «Visitas desde posts» | «Llegaron a tu página por su link» |
  | «Arrastre» | «De quienes vieron, cuántos llegaron a tu página · sin YouTube» |

- **Panel «Tus cuentas»**, explicación: «Seguidores por cuenta, con lo ganado en el período; en
  YouTube, solo el total, porque sus reglas no permiten calcular lo ganado. Visitas al perfil y
  alcance son del último día leído — Instagram es la única que los entrega hoy.»

  Una tarjeta por cuenta con lecturas (hoy pueden ser de Instagram, Facebook y YouTube; TikTok,
  Threads y X no tienen). Con una cuenta elegida arriba, solo la suya. Cada tarjeta:

  - El nombre, con el patrón «<red> · <nombre de la cuenta>» (o solo la red).
  - Un número grande: los seguidores (en YouTube, los suscriptores), o «—».
  - Debajo, en YouTube: «suscriptores, según YouTube». En las demás: «seguidores · » y una de
    tres: «+<N> en el período», «sin cambio» o «— en el período».
  - Al pie: «Visitas al perfil (<día>): <N>» y «Alcance (<día>): <N>», donde el día es el de
    la última lectura del período, como «3 sep». Sin lecturas en el período: «Visitas al
    perfil: —» y «Alcance: —».

  Debajo de las tarjetas, **solo si alguna cuenta que no es de YouTube tiene lecturas en el
  período**, un gráfico con dos series: «Visitas al perfil» y «Alcance», un punto por día leído.

- **Panel «Views ganadas y visitas, día a día»**, explicación: «Cuánto creció lo que se vio en
  las redes contra cuánta gente llegó a tu página. Las views no incluyen YouTube; las visitas,
  sí.» Con una cuenta elegida arriba, en medio de esas dos frases se suma «Esta serie es de
  todas tus cuentas, no solo de la elegida.» Un gráfico de áreas con dos series, rotuladas
  arriba: «Views ganadas» y «Visitas». Cada punto es un día (también con «Hoy»); con «Todo», una
  semana. Al pasar el mouse aparece la fecha completa y los dos valores.

### Mitad «En tu página»

**La cabeza.** El título «En tu página» y debajo «Quién entró a tu página de links —tu
Vitrina— y qué apretó. Lo cuenta Tu Parrilla, sin cookies ni terceros.» A la derecha:

- Un selector de página, **solo si la persona tiene más de una página pública**: «Todas tus
  páginas», y una opción por página con el patrón «<nombre> · /<dirección>».
- El botón «Bots», **solo cuando está prendido** (ver más abajo): así se ve siempre, aunque el
  «⋯ Más» esté cerrado.
- «⋯ Más», que abre el resto de esta mitad. Abierto, dice «Menos».

**Dos cifras**: «Visitas» y «Clicks en tus links». Debajo de cada número, la comparación con
el período anterior: una flecha, un porcentaje («+12%», «-8%», o «0%» con flecha hacia el lado
si casi no cambió) y el texto «vs. período anterior». La subida va en verde y la bajada en
rojo. Si no hay con qué comparar, en vez de eso hay un «—».

**Panel «Qué publicación te trajo gente»**, explicación «Visitas que llegaron por el link de
una publicación (su etiqueta ?s=).» Hasta cinco filas: las etiquetas que más visitas trajeron
en el período, sin contar las visitas que llegaron sin etiqueta, cada una con una barra
detrás. Si la etiqueta es de una publicación sincronizada, se ve el texto del post y, en chico,
su red; si no lo es, o el post no tiene texto, se ve «?s=<etiqueta>». A la derecha, las
visitas. Estas filas no son enlaces.

**Con «⋯ Más» abierto**, debajo aparece, en este orden:

- **El botón «Bots»**, con un ícono de robot (al pasar el mouse: «Los bots se excluyen salvo
  que actives esto»), **solo mientras está apagado**. Al apretarlo se prende, queda con borde y
  letra naranjos y se muda a la cabeza de la mitad, al lado del selector de página; apretarlo
  ahí lo apaga y vuelve aquí. No está en ninguna otra pantalla del panel.
- **Dos cifras más**, «Únicos» y «CTR», con la misma comparación contra el período anterior.
- **Panel «Visitas y clicks en el tiempo»**, explicación «Comparables en la misma escala». Un
  gráfico de áreas con dos series, rotuladas arriba: «Visitas» y «Clicks». Con «Hoy», cada punto
  es una hora (en el eje, «14:00»); con «7 días», «30 días» y «90 días», un día («3 sep»); con
  «Todo», una semana. Al pasar el mouse aparece la fecha completa («3 de septiembre de 2026», o
  «Semana del …», o «3 de septiembre, 14:00») y los dos valores.
- **Panel «Todas las etiquetas»**, explicación «Cada etiqueta ?s= es un link etiquetado: el de
  una publicación, el de un mensaje privado (dm-…) o uno escrito a mano. Ordena por CTR para ver
  cuál convierte.» Una tabla con las columnas «Etiqueta», «Visitas», «Únicos»,
  «Clicks», «CTR». Cada columna es un botón que ordena (la primera vez de mayor a menor; otra
  vez, al revés); la activa lleva una flecha. Al entrar va ordenada por «Visitas», de mayor a
  menor. En cada fila, detrás de la etiqueta, una barra cuyo largo compara sus visitas con las
  de la fila con más. En la columna «Etiqueta»: si la etiqueta es de una publicación
  sincronizada, su miniatura chica y el texto del post (o la etiqueta, si el post no tiene
  texto); si no, la etiqueta sola, en letra de máquina de escribir. Las visitas que llegaron sin
  etiqueta van juntas en la fila «(sin etiqueta)». Hasta 50 filas, las de más visitas.
- **Paneles «Links más clickeados» y «De dónde vienen»**, lado a lado en pantalla ancha, uno
  encima del otro en el teléfono.
  - «Links más clickeados», explicación «CTR calculado sobre las visitas del período»: hasta 25
    filas, de más a menos clicks. Cada una: el nombre del link tal como está en la página (o
    «(link eliminado)» si ya no existe), su CTR en chico y sus clicks a la derecha. Si el link
    sigue existiendo, la fila lo abre en otra pestaña.
  - «De dónde vienen», explicación «Red de origen inferida del referrer y de utm_source»: un
    gráfico de anillo con el total de visitas al centro (bajo el número, «visitas»), y al lado
    la lista de orígenes, cada uno con su punto de color, su porcentaje y sus visitas. Hasta
    siete orígenes; el resto se junta en «Otro».
- Lo que sigue carga un poco después; mientras tanto se ven rectángulos grises sin texto:
  - **«Países» y «Ciudades»**: listas con barras, de más a menos visitas, hasta 12 filas cada
    una. Los países llevan su bandera y su nombre en español; lo que no se pudo ubicar sale como
    «Desconocido».
  - **«Dispositivo», «Sistema» y «Navegador»**: tres listas con barras, hasta 8 filas cada una.
    «Dispositivo» usa estos nombres: «Celular», «Computador», «Tablet», «Wearable», «Consola»,
    «Smart TV», «Desconocido». «Sistema» y «Navegador», el nombre con que se identifica el
    equipo.
  - **«Cuándo te visitan»**, explicación «Hora local de <zona>», con la zona horaria de la
    persona (por ejemplo «America/Santiago»). Una grilla de siete filas («Lun», «Mar», «Mié»,
    «Jue», «Vie», «Sáb», «Dom») por 24 columnas, una por hora, rotuladas cada tres horas
    («00», «03», … «21»). Cuanto más intenso el color de la casilla, más visitas en esa hora de
    ese día de la semana. Al pasar el mouse: «<día> <hora>:00 · <N> visitas» («visita» si es
    una). Abajo, la escala: «0», los colores, y el número de la casilla con más visitas.
  - **«Embudo»**, explicación «De llegar a la página a hacer click»: tres barras, «Llegaron a
    la página», «Hicieron al menos un click» (con su porcentaje al lado) y «Clicks totales».
  - **«Idioma del navegador»**: lista con barras, hasta 8 filas, con el código de idioma tal
    como lo manda el navegador (por ejemplo «es-CL»).
  - **«Últimas visitas»**, explicación «Las 40 más recientes del período». Una línea por
    visita: la bandera; la ciudad (o el país si no hay ciudad) y «, <país>» si hay ciudad; el
    dispositivo, el sistema y el navegador separados por «·»; una cápsula con el origen
    («Instagram», «Directo», …); una cápsula «?s=<etiqueta>» si llegó con etiqueta; una cápsula
    «bot» si es un bot (solo pueden aparecer con «Bots» activo), y a la derecha hace cuánto:
    «recién», «hace <N> minutos», «hace <N> horas», «ayer», «hace <N> días».

Mientras una mitad carga se ve su esqueleto: rectángulos grises sin texto en el lugar de las
cifras y del panel.

### Tus publicaciones (`/admin/analytics/publicaciones`)

La lista de todas las publicaciones sincronizadas, una por fila, con lo que hizo en la red y
la gente que llevó a la página. No tiene subtítulo propio: no es una pantalla de la barra,
sino una parte de Los Números.

**Encabezado.** Arriba a la izquierda, una flecha y «Los Números», que vuelve al tablero.
Debajo, el título «Tus publicaciones» y la línea «Cada publicación, con lo que hizo en la red y
la gente que llevó a tu página. Las views las cuenta la red; las visitas, Tu Parrilla, cuando
alguien entra por el link de esa publicación.»

**La fila de controles**, de izquierda a derecha:

- Los cinco botones del período, los mismos del tablero.
- El selector de cuenta, **solo con más de una cuenta**: «Todas las cuentas» y una opción por
  cuenta con el patrón «<red> · <nombre de la cuenta>».
- Dos botones juntos: «Publicadas en el período» (el de al entrar) y «Todas las recientes». El
  elegido queda resaltado.
- A la derecha, «⋯ Más»; abierto, dice «Menos».

**Con «⋯ Más» abierto**, debajo de esa fila: el texto «Todas las columnas a la vista.» y dos
enlaces que se prenden y apagan, cada uno cambia de texto al apretarlo:

- «Solo con métricas» → pasa a decir «Mostrar todas».
- «Ver borrados» → pasa a decir «Ocultar borrados».

Cerrar con «Menos» apaga los dos.

**Los avisos.** Debajo, un recuadro con una o dos frases, **solo cuando corresponde**:

- Si hay publicaciones cuyo link nunca se pegó: «Ninguna etiqueta está pegada todavía. Copia
  el link de una fila y pégalo en ese post de la red.» (cuando no hay ninguna pegada), o «1
  publicación aún no tiene su link pegado.», o «<N> publicaciones aún no tienen su link
  pegado.».
- Si hay publicaciones de las que la red no entregó ningún número en el período: «1 publicación
  no tiene métricas de la red en este período (Instagram no las entrega para lo publicado antes
  de tu cuenta profesional).», o la misma frase con «<N> publicaciones no tienen…».

Los avisos cuentan las publicaciones de la lista que siguen vivas en la red, de la cuenta
elegida (o de todas): no miran «Solo con métricas», y nunca cuentan las borradas.

**Panel «Publicaciones».** Debajo del título, esta explicación:

> Views: el total en la red, con lo ganado en el período al lado. Visitas: quienes entraron a
> tu página por el link de esa publicación. En YouTube solo van los contadores de la red, sin
> lo ganado: sus reglas no permiten calcular métricas nuevas con sus datos.

**La tabla.** Sobre las columnas, dos rótulos que dicen quién cuenta cada grupo: «En la red»
sobre las de la red y «En tu página · lo mide Tu Parrilla» sobre las que mide Tu Parrilla. Las
columnas, de izquierda a derecha:

- Al entrar (dos columnas a la vista): «Post» · «Views» (en la red) · «Visitas» (en tu página).
- Con «⋯ Más» abierto: «Post» · «Views» · «Likes» · «Coment.» · «Compart.» (en la red) ·
  «Visitas» · «Clicks» · «CTR» · «Arrastre» (en tu página).

Todas menos «Post» son botones que ordenan. La columna por la que se está ordenando se ve más
marcada y lleva una flecha (hacia abajo: de mayor a menor; hacia arriba: de menor a mayor). Al
entrar, la tabla va ordenada por «Views» de mayor a menor.

Cada fila, en la columna «Post»:

- La miniatura del post (un cuadro gris si no hay).
- El texto del post en una línea, cortado si es largo. Si la red dio el enlace, el texto es un
  link que abre el post en la red en otra pestaña. Si no hay texto: «Sin descripción».
- Debajo, en chico: la cuenta y la fecha de publicación corta, con el patrón «<red> · <nombre
  de la cuenta> · <fecha>» (por ejemplo «Instagram · @juan · 3 sept»; sin nombre de cuenta,
  solo la red y la fecha), y « · nuevo» al final si la publicación salió dentro del período.
- En esa misma línea, **solo en algunas filas**, el sello «Se pasó» (al pasar el mouse: «El
  doble o más de las vistas ganadas por la mitad de tus posts del período»).
- Debajo, la etiqueta como un botoncito que dice «?s=<etiqueta>» (al pasar el mouse: «Editar
  la etiqueta»), y a su lado un ícono de copiar (al pasar el mouse: «Copiar el link con la
  etiqueta»). Si algo falla, el error sale en rojo al lado.

Detrás del número de «Views» hay una barra horizontal: su largo compara el acumulado de esa
fila con el más grande de la lista, y su color dice cómo le fue en el período (ver «Cómo leer
cada número»). Al lado del acumulado puede ir, en chico y más tenue, «+<N>»: lo ganado en el
período.

Las filas de publicaciones borradas, y las de publicaciones de las que la red no entregó ningún
número, se ven semitransparentes.

La tabla muestra 20 filas. Si hay más, al pie hay un botón «Ver las <N> restantes» (o «Ver la
publicación restante» si falta una sola); expandida, el botón dice «Mostrar menos». Al recargar
la página vuelve a mostrar 20.

## Cómo leer cada número

**Reglas generales.** Un «—» significa que no hay dato: nunca es cero, y al ordenar una tabla
queda siempre al fondo, en las dos direcciones. Los números desde 10.000 se abrevian («12 mil»,
«1,5 M»). Los porcentajes llevan punto decimal («3.3%», «7.10%»).

**El período.** «Hoy» son las últimas 24 horas, no desde la medianoche; «Todo» es desde 2020.
Los días y las horas se cortan en la zona horaria de la persona, la de [Tu Cuenta](tu-cuenta.md).

**De dónde salen los números de la red.** La red no se consulta en vivo. Una sincronización
lee todas las cuentas una vez al día (a las 9:00 UTC, las 5 o 6 de la mañana en Chile según la
época) y guarda una lectura por publicación, por cuenta y por día; también corre al apretar
«Sincronizar ahora» en [Los Fierros](los-fierros.md). Por eso una publicación nueva no aparece
hasta la siguiente sincronización, y los números pueden ir hasta un día atrás de lo que muestra
la app de la red. Threads y X no se sincronizan: no tienen números aquí.

**Lo ganado.** Para una publicación, cuánto creció su contador dentro del período: la última
lectura del período menos la última de antes de que empezara. Si la publicación salió dentro
del período, todo su contador cuenta como ganado. Si existía antes pero nadie la había medido
todavía, lo ganado no se puede saber y no suma. Si la red corrige sus views a la baja, cuenta
como cero, no como negativo. YouTube nunca tiene lo ganado: sus reglas no permiten calcular
métricas nuevas con sus datos.

### En las redes

**Qué filtros le aplican.** El período y la cuenta. El selector de página y «Bots» son de la
otra mitad y aquí no cuentan: las visitas de esta mitad («Visitas desde posts», «Arrastre» y la
línea «Visitas» del gráfico) se cuentan siempre en todas las páginas y sin bots. El gráfico
«Views ganadas y visitas, día a día» tampoco hace caso a la cuenta: es siempre de todas.

**«Views ganadas».** La suma de lo ganado por las publicaciones de la cuenta elegida (o de
todas), **de cualquier fecha de publicación**: un reel de agosto que sigue creciendo en octubre
cuenta en octubre. Sin YouTube ni publicaciones borradas. Mira las 500 publicaciones más
recientes de la cuenta elegida (o de todas). «—» cuando ninguna publicación tiene lo ganado
conocido (por ejemplo, si todo es de YouTube o si la cuenta se acaba de conectar); «0», cuando
se sabe y no ganaron nada.

**«Seguidores ganados».** La suma de lo ganado por cada cuenta: las mismas cifras «+<N> en el
período» de las tarjetas de «Tus cuentas». Sin YouTube. Una baja cuenta como cero: la pantalla
no muestra seguidores perdidos. Una cuenta sin lectura de antes del período no suma; si
ninguna la tiene (las cuentas se conectaron después de que empezó el período, el período es
«Todo», o solo hay TikTok, Threads o X), sale «—».

**«Lo que más creció».** Las cinco publicaciones que más views ganaron en el período, de
cualquier fecha, sin YouTube y sin borradas. Solo entran las que ganaron más de cero.

**«Interacciones».** Likes, comentarios y compartidos **ganados** en el período, sumados, sin
YouTube.

**«Visitas desde posts».** Las visitas que llegaron a la página en el período con la etiqueta
de alguna de esas publicaciones, YouTube incluido (las visitas las mide Tu Parrilla).

**«Arrastre».** Las visitas de las publicaciones que no son de YouTube divididas por «Views
ganadas», en porcentaje con dos decimales: de la gente que vio, qué parte llegó a la página. No
es el promedio de la columna de «Tus publicaciones». «—» si no hubo views ganadas.

**«Tus cuentas».** Sale de la sincronización diaria con las redes (o de «Sincronizar ahora» en
[Los Fierros](los-fierros.md)), no de las visitas, así que no le hacen caso ni el selector de
página ni «Bots»; sí el período y la cuenta.

- El número grande: los seguidores según la última lectura del período.
- «+<N> en el período»: los seguidores de la última lectura del período menos los de la última
  lectura de antes de que empezara. «sin cambio»: no subieron; **una baja también se ve como
  «sin cambio»**. «— en el período»: no hay lectura de antes del período para comparar (la
  cuenta se conectó después de que empezara, o el período es «Todo»).
- YouTube: el total de suscriptores tal como lo da YouTube, sin lo ganado. Tampoco entra en el
  gráfico de abajo.
- «Visitas al perfil» y «Alcance»: cifras de un solo día, el de la lectura que dice el
  paréntesis, no del período. Solo Instagram las entrega; en Facebook y YouTube salen «—».
- El gráfico de abajo: visitas al perfil y alcance de cada día leído, sumando las cuentas que
  los entregan (sin YouTube).
- Dos cuentas de la misma red tienen cada una su tarjeta.

**«Views ganadas y visitas, día a día».** Cuánto crecieron las views de todo el catálogo cada
día, de una lectura a la siguiente, contra las visitas que llegaron ese día con la etiqueta de
cualquier publicación. Las views no incluyen YouTube ni lo borrado, y el primer día medido de
cada publicación no suma (no hay lectura anterior con qué restar). Por eso no tiene por qué
sumar lo mismo que la cifra «Views ganadas».

### En tu página

**Qué filtros le aplican.** El período, el selector de página y «Bots», a toda la mitad (las
dos cifras y la lista de arriba también) y solo a ella. Mientras «Bots» está prendido, el botón
se ve en la cabeza de la mitad aunque el «⋯ Más» esté cerrado.

**Qué es una visita.** Cada vez que una página pública de la persona se abre en un navegador y
la página alcanza a ejecutarse. Recargar cuenta otra vez. Los programas que solo descargan la
página sin ejecutarla no cuentan nunca, ni con «Bots» activo.

**Bots.** Por defecto quedan fuera las visitas y los clicks de equipos que se identifican como
robot, rastreador o generador de vistas previas de links, o que no se identifican. «Bots» los
suma.

**«Visitas».** El total de visitas del período.

**«Clicks en tus links».** Clicks en los links de la página.

**«Únicos».** Cuántos visitantes distintos, sin cookies: se reconoce a alguien por su conexión
y su navegador, y esa identidad cambia cada día (a medianoche UTC, no a la de la persona). Una
misma persona que vuelve tres días distintos cuenta tres veces en «30 días»; dos personas con
la misma conexión y el mismo navegador pueden contar como una.

**«CTR».** Clicks sobre visitas, en porcentaje con un decimal. Puede pasar de 100% si la gente
hace varios clicks por visita. Sin visitas, «0.0%».

**La comparación bajo cada cifra.** Cuánto cambió la cifra, en porcentaje, contra el período de
igual largo justo antes (con «7 días», los siete días anteriores). En «CTR» es el cambio del CTR
mismo, no en puntos: pasar de 2.0% a 3.0% se ve como «+50%». El «—» aparece cuando el período
anterior tuvo cero y este no, porque no hay porcentaje de crecimiento desde cero; con «Todo»
pasa casi siempre, porque antes de 2020 no hay nada.

**«Qué publicación te trajo gente» y «Todas las etiquetas».** Una fila por etiqueta. La
etiqueta de una visita sale del `?s=` del link por el que llegó; si no trae `?s=`, de `src`,
`ref`, `utm_content` o `utm_campaign`, en ese orden. Las que empiezan con `dm-` las pone la
respuesta automática por palabra clave en el link que manda (ver [La Parrilla](la-parrilla.md));
las escritas a mano en un link también aparecen. Por eso no toda etiqueta es de una
publicación, aunque el título «Qué publicación te trajo gente» lo sugiera; la explicación de
«Todas las etiquetas» lo dice. En «Todas las etiquetas»: «Visitas» y
«Clicks», como arriba pero solo de esa etiqueta; «Únicos», con la misma regla diaria; «CTR»,
clicks sobre visitas de esa etiqueta. «(sin etiqueta)» junta las visitas que no traían
ninguna. Ordenar por «Etiqueta» ordena por el texto de la etiqueta, no por el del post.

**«Visitas y clicks en el tiempo».** Visitas y clicks por hora, día o semana. Las horas o días
sin movimiento son ceros de verdad.

**«Links más clickeados».** Los clicks de cada link de la página. El CTR de al lado es esos
clicks sobre **todas** las visitas del período, no solo las de quienes vieron ese link.

**«De dónde vienen».** El sitio desde donde llegó cada visita. Si el link traía `utm_source`,
manda eso (`ig`, `tt` y `yt` se leen como Instagram, TikTok y YouTube; un valor que no reconoce
aparece tal cual, en minúsculas). Si no, se deduce del sitio anterior. «Directo»: no se supo de
dónde venía. «Otro»: un sitio que no está en la lista, o la suma de los orígenes más allá del
séptimo. Instagram y TikTok abren los links en su propio navegador, que suele esconder de dónde
viene la gente, así que mucho de ese tráfico cae en «Directo»; para saber qué publicación lo
trajo sirve la etiqueta, no este panel.

**«Países» y «Ciudades».** Según la ubicación aproximada de la conexión.

**«Cuándo te visitan».** La suma de las visitas del período en cada hora de cada día de la
semana: con «30 días», la casilla del lunes a las 14 junta los cuatro o cinco lunes.

**«Embudo».** «Llegaron a la página»: las visitas. «Hicieron al menos un click»: cuántas de esas
visitas hicieron uno o más clicks, y al lado qué porcentaje de las visitas son. «Clicks
totales»: todos los clicks, por eso puede ser más que la primera barra.

**«Últimas visitas».** Las 40 más recientes del período, una por línea. Cada línea es una carga
de página, no una persona.

### En «Tus publicaciones»

**Qué publicaciones salen.** Con «Publicadas en el período», las **publicadas** dentro del
período, no las que tuvieron actividad en él (es la misma regla que la API de métricas). Con
«Todas las recientes», las 200 publicaciones más recientes, de cualquier fecha, con sus números
medidos dentro del período. En los dos casos, como mucho 200, todas de la cuenta elegida (o de
todas las cuentas).

**Qué filtros le aplican.** El período, la cuenta, los dos botones de qué publicaciones y lo del
«⋯ Más». La página y «Bots» del tablero no: las visitas, clicks, CTR y arrastre de cada
publicación se cuentan siempre en todas las páginas y sin bots.

**«Views» (columna).** El contador acumulado de por vida, según la última lectura dentro del
período. El «+<N>» al lado es lo ganado en el período. Ese «+<N>» no aparece cuando:

- la publicación salió dentro del período (lleva « · nuevo»): todo su contador es lo ganado, y
  repetirlo no agrega nada. Con «Publicadas en el período» casi todas las filas son así; el
  «+<N>» se ve sobre todo con «Todas las recientes»;
- no hay lectura de antes del período (la publicación existía, pero nadie la había medido
  todavía): el crecimiento no se puede saber;
- no creció, o es de YouTube.

El «—» en «Views» aparece solo cuando la red no dio ninguna lectura en el período. Ordenar por
«Views» ordena por el acumulado, no por lo ganado; para lo ganado está «Lo que más creció», en
el tablero.

**La barra detrás de «Views» y el sello «Se pasó».** Se comparan las views ganadas de cada fila
con la mediana de las views ganadas de las publicaciones de la lista (la mitad ganó menos, la
mitad más). Barra naranja fuerte y sello «Se pasó»: ganó al menos el doble de la mediana.
Naranja suave: ganó al menos la mediana. Gris: ganó menos. Sin barra: no hay ganancia conocida
(YouTube, crecimiento que no se puede saber), o la mediana es cero y no hay con qué comparar.

**«Likes», «Coment.», «Compart.».** Los contadores acumulados que da la red, al cierre del
período. «—» cuando la red no entrega ese dato: YouTube nunca da compartidos.

**«Visitas».** Cuántas veces se abrió la página pública de la persona con la etiqueta de esta
fila, dentro del período. «—» quiere decir que esa etiqueta nunca trajo una sola visita: el link
no se pegó. «0» quiere decir que el link sí se pegó (alguna vez trajo una visita) pero en este
período no llegó nadie.

**«Clicks».** Los clicks en los links de la página que hicieron esas visitas. «—» en el mismo
caso que «Visitas».

**«CTR».** Clicks sobre visitas, en porcentaje con un decimal. «—» si no hubo visitas. Puede
pasar de 100% si cada visita hizo varios clicks.

**«Arrastre».** Visitas sobre views ganadas en el período, en porcentaje con dos decimales: de
la gente que vio el post en el período, qué parte llegó a la página. Se calcula sobre lo ganado
y no sobre el acumulado para no castigar a lo nuevo ni premiar lo viejo. «—» cuando el post no
ganó views (o no se sabe cuántas), cuando el link nunca se pegó, y siempre en YouTube.

**Cuándo viene vacío y por qué**, en resumen:

| Caso | Qué se ve |
|---|---|
| YouTube | Views acumuladas, likes y comentarios tal como los da YouTube; sin «+<N>», sin barra, sin «Se pasó», «Compart.» y «Arrastre» en «—». Visitas, clicks y CTR sí. Fuera de «Views ganadas», «Interacciones», «Arrastre», «Lo que más creció» y de las views del gráfico del tablero. |
| YouTube, video que lleva 30 días sin llegar en la sincronización | «Sin descripción», sin miniatura, y sus lecturas viejas borradas: las reglas de YouTube no dejan guardar sus datos más de 30 días sin refrescarlos. La fila queda, con sus visitas. |
| Instagram, lo publicado antes de que la cuenta fuera profesional | Fila semitransparente, «—» en «Views», «Likes», «Coment.» y «Compart.»; entra en el aviso de «no tiene métricas». Instagram no entrega esos números. |
| Publicado hoy | No aparece hasta la próxima sincronización. Ya sincronizado, sale como «nuevo» con lo que llevaba en esa lectura; el gráfico del tablero lo empieza a contar desde su segunda lectura, de otro día. |
| Link nunca pegado | «—» en «Visitas», «Clicks», «CTR», «Arrastre»; entra en el aviso del link. |
| Borrado en la red | Oculto; con «Ver borrados», semitransparente. |

## Qué se puede hacer

### Para saber cómo le fue en el período

1. Elegir el período arriba («Hoy», «7 días», «30 días», «90 días» o «Todo»).
2. En «En las redes», leer «Views ganadas» y «Seguidores ganados»; debajo, «Lo que más creció».
3. En «En tu página», leer «Visitas» y «Clicks en tus links», con su comparación contra el
   período anterior; debajo, «Qué publicación te trajo gente».

### Para ver el detalle de una mitad

Apretar el «⋯ Más» de esa mitad, a la derecha de su título. Cada mitad se abre por su cuenta y
pueden estar las dos abiertas. «Menos» la cierra. La dirección recuerda cuáles están abiertas
(`?mas=redes`, `?mas=pagina`), así que un link copiado de la barra del navegador las abre igual.

### Para mirar una sola cuenta

1. En la cabeza de «En las redes», elegir la cuenta en el selector (solo existe con más de una
   cuenta).
2. Cambian las cifras, «Lo que más creció» y «Tus cuentas»; «En tu página» no cambia, ni el
   gráfico «Views ganadas y visitas, día a día».
3. «Todas las cuentas» vuelve a juntarlas. En «Tus publicaciones» está el mismo selector.

### Para mirar una sola página, o incluir bots

1. En la cabeza de «En tu página», elegir la página en el selector (solo existe con más de una
   página pública). «Todas tus páginas» vuelve a juntarlas.
2. Para los bots: abrir el «⋯ Más» de «En tu página» y apretar «Bots». Prendido, el botón pasa
   a la cabeza de la mitad, al lado del selector de página, y se ve aunque el «⋯ Más» esté
   cerrado; apretarlo ahí los vuelve a sacar.

Los dos cambian solo la mitad «En tu página». «En las redes» y «Tus publicaciones» cuentan
siempre todas las páginas y sin bots.

### Para ver los seguidores de cada cuenta

Abrir el «⋯ Más» de «En las redes»: el panel «Tus cuentas» tiene una tarjeta por cuenta.

### Para saber cuántas visitas trajo una publicación

Por cualquiera de los dos caminos:

- En el tablero, «Qué publicación te trajo gente» (las cinco que más trajeron) o, en el «⋯ Más»
  de «En tu página», «Todas las etiquetas»: buscar la fila con el texto del post o su etiqueta.
- «Ver todas las publicaciones →» y, en «Tus publicaciones», su fila, columna «Visitas». Ahí
  está al lado de sus views. Si el post es anterior al período, apretar «Todas las recientes» o
  elegir un período más largo. Si dice «—», el link con la etiqueta nunca se pegó en ese post.

Con una página elegida o «Bots» prendido, los dos caminos pueden dar cifras distintas: el
primero les hace caso y el segundo no.

### Para ver qué publicación convierte mejor

1. Abrir el «⋯ Más» de «En tu página».
2. En «Todas las etiquetas», apretar la columna «CTR»: ordena de mayor a menor.
3. Desconfiar de las filas con pocas visitas: un CTR alto con tres visitas no dice mucho.

### Para ver a qué hora conviene publicar

Abrir el «⋯ Más» de «En tu página» y mirar «Cuándo te visitan» con «30 días» o «90 días»: las
casillas más intensas son los días y horas en que más gente abre la página. Si las horas no
calzan con las de la persona, revisar su zona en [Tu Cuenta](tu-cuenta.md).

### Para copiar el link de una publicación y pegarlo en la red

1. En el tablero, apretar «Ver todas las publicaciones →».
2. En la fila del post, apretar el ícono de copiar que está junto a «?s=<etiqueta>». Si
   funcionó, el ícono pasa a ser un visto por un momento.
3. Lo copiado es la dirección de la página principal de la persona (la que lleva la etiqueta
   «principal» en [La Vitrina](la-vitrina.md)) más `?s=<etiqueta>`, por ejemplo
   `https://tu-parrilla.cl/<su-página>?s=<etiqueta>`.
4. Pegar ese link en ese post, en la red, donde la red deje poner un link. Esta pantalla no lo
   pega sola.
5. Desde la primera visita que llegue por ese link, la fila deja de decir «—» en «Visitas».

Si se quiere que el link lleve a otra de sus páginas, se arma a mano: la dirección de esa
página (en La Vitrina, «Editar» y, en el bloque «Compartir», «Copiar») más `?s=<etiqueta>`.

### Para cambiar la etiqueta

Conviene hacerlo **antes** de pegar el link: las visitas se cuentan por etiqueta, así que las
que ya llegaron con la etiqueta vieja se quedan con ella, dejan de contarse para este post
(aparecen sueltas en «Todas las etiquetas»), y un link ya pegado con la etiqueta vieja sigue
anotando visitas a la vieja. Volver a poner la etiqueta anterior las recupera.

1. En «Tus publicaciones», apretar el botoncito «?s=<etiqueta>» de la fila. Se vuelve un campo
   de texto.
2. Escribir la etiqueta nueva. Se guardan letras sin tilde, números, guiones y guiones bajos;
   cualquier otra cosa (espacios, tildes, la «ñ», signos) se cambia por un guion, y se corta en
   48 caracteres. «Reel Gimnasio!» queda «Reel-Gimnasio».
3. Apretar Enter, o hacer clic fuera del campo, para guardar. Escape cancela.
4. La fila muestra la etiqueta tal como quedó guardada. La sincronización no la vuelve a
   cambiar.

Si sale un error en rojo al lado, la etiqueta vuelve a la anterior (ver «Mensajes que puede
ver»).

### Para ver todas las columnas de la lista

En «Tus publicaciones», apretar «⋯ Más». Aparecen «Likes», «Coment.», «Compart.», «Clicks»,
«CTR» y «Arrastre». «Menos» vuelve a las dos de siempre y apaga «Solo con métricas» y «Ver
borrados».

### Para ordenar la tabla

1. Apretar el nombre de una columna: ordena por ella de mayor a menor.
2. Apretarlo otra vez invierte el orden. Los «—» quedan siempre al fondo.

El orden se pierde al recargar. «Post» no ordena.

### Para ver lo publicado antes del período

En «Tus publicaciones», apretar «Todas las recientes». La lista deja de filtrar por fecha de
publicación y trae las 200 publicaciones más recientes (de la cuenta elegida, si hay una), con
sus números medidos dentro del período. «Publicadas en el período» vuelve atrás.

### Para esconder las filas sin números de la red

En «Tus publicaciones», abrir «⋯ Más» y apretar «Solo con métricas». Saca las filas con «—» en
«Views», «Likes», «Coment.» y «Compart.» a la vez. «Mostrar todas» las devuelve.

### Para ver las publicaciones borradas

En «Tus publicaciones», abrir «⋯ Más» y apretar «Ver borrados». Aparecen, semitransparentes,
las publicaciones que la red dejó de devolver al sincronizar (normalmente porque se borraron
allá). No entran en los avisos. «Ocultar borrados» las vuelve a esconder. Si la publicación
vuelve a aparecer en la red, deja de estar borrada sola.

### Para ver más de 20 filas

Apretar «Ver las <N> restantes» al pie de la tabla. «Mostrar menos» vuelve a 20.

Los mismos datos por publicación, con el alcance y los atributos de cada post, salen también por
API: ver `GET /api/metrics/posts` en [la guía de la API](../api-editor.md).

## Mensajes que puede ver

| Lo que dice la pantalla | Qué significa | Qué hacer |
|---|---|---|
| «—» en «Views ganadas» | Ninguna publicación tiene lo ganado conocido: todo es de YouTube, no hay lectura de antes del período, o no hay publicaciones sincronizadas. | Esperar la próxima sincronización, o elegir un período más corto que el tiempo que lleva conectada la cuenta. |
| «—» en «Seguidores ganados» | Ninguna cuenta tiene una lectura de antes del período para comparar, o solo hay YouTube, TikTok, Threads o X. | Igual que arriba. |
| «Ninguna publicación ganó views en este período. Las métricas llegan con la sincronización diaria, así que lo publicado hoy aparece mañana.» (en «Lo que más creció») | Ninguna publicación ganó más de cero views conocidas en el período. | Ampliar el período, o esperar la próxima sincronización. |
| «Ninguna visita llegó todavía por el link de una publicación.» (en «Qué publicación te trajo gente») | En el período no llegó ninguna visita con etiqueta. | Ampliar el período; pegar los links con etiqueta (ver «Para copiar el link…»). |
| «Todavía no hay lecturas de cuenta. La primera llega con la próxima sincronización diaria.» (en «Tus cuentas») | No hay ninguna lectura de cuenta de Instagram, Facebook ni YouTube (o de la cuenta elegida). La sincronización diaria corre a las 9:00 UTC. | Esperar, o apretar «Sincronizar ahora» en [Los Fierros](los-fierros.md). Si solo hay TikTok, Threads o X conectados, o la cuenta elegida es de una de esas, este mensaje se queda. |
| «Sin tráfico en este período.» (en «Visitas y clicks en el tiempo») | Ni visitas ni clicks en el período. | Ampliar el período, revisar el selector de página. |
| «Sin tráfico en este período.» (en «Views ganadas y visitas, día a día») | Ni views ganadas ni visitas por etiqueta en el período. | Ampliar el período, o esperar la sincronización. |
| «Sin tráfico en este período.» (dentro de «Tus cuentas», bajo las tarjetas) | Hay lecturas de cuenta en el período, pero sin visitas al perfil ni alcance (por ejemplo, solo Facebook conectado). No habla de visitas a la página. | Nada: solo Instagram entrega esas dos cifras. |
| «Todavía no llega tráfico etiquetado.» y «Agrega ?s=nombre al link de tu bio — por ejemplo /tu-pagina?s=reel-gimnasio — y cada pieza de contenido aparecerá acá por separado.» (en «Todas las etiquetas») | No hubo ninguna visita en el período, con o sin etiqueta. | Ampliar el período. Al armar links, el `?s=` va detrás de la dirección completa de la página (`https://tu-parrilla.cl/<su-página>?s=…`), no detrás de tu-parrilla.cl a secas, que es la portada del producto. |
| «Nadie ha hecho click todavía.» | Ningún click en los links de la página en el período. | Nada que arreglar. |
| «Sin datos todavía.» | La lista de ese panel (orígenes, países, ciudades, dispositivo, sistema, navegador, idioma) no tiene visitas en el período. | Ampliar el período. |
| «Sin visitas para dibujar el mapa.» | «Cuándo te visitan» no tiene visitas en el período. | Ampliar el período. |
| «Sin visitas en este período.» | El embudo no tiene visitas en el período. | Ampliar el período. |
| «Nada todavía.» | «Últimas visitas» no tiene visitas en el período. | Ampliar el período. |
| «—» bajo una cifra de «En tu página», en vez del porcentaje | El período anterior tuvo cero, o el período es «Todo». | Nada: no hay con qué comparar. |
| «Ninguna etiqueta está pegada todavía. Copia el link de una fila y pégalo en ese post de la red.» | Ninguna publicación de la lista ha traído nunca una visita por su link. | Pegar los links (ver «Para copiar el link…»). |
| «1 publicación aún no tiene su link pegado.» / «<N> publicaciones aún no tienen su link pegado.» | Esas publicaciones nunca trajeron una visita con su etiqueta. | Buscar las filas con «—» en «Visitas» y pegar su link. |
| «1 publicación no tiene métricas de la red en este período (Instagram no las entrega para lo publicado antes de tu cuenta profesional).» / «<N> publicaciones no tienen métricas…» | La red no dio ningún número de esas publicaciones en el período. La causa de la frase es la más común; también pasa con lo recién publicado o con videos de YouTube que ya no llegan. | Nada que arreglar si son posts viejos de Instagram. «Solo con métricas» las esconde. |
| «No publicaste nada en este período. Amplía el período, o mira «Todas las recientes».» | Hay alguna cuenta conectada, pero ninguna publicación sincronizada (de la cuenta elegida, si hay una) salió en el período. | Elegir un período más largo, «Todas las recientes» o «Todas las cuentas». |
| «No hay publicaciones sincronizadas todavía.» | Con «Todas las recientes»: hay cuentas conectadas, pero ninguna publicación sincronizada (de la cuenta elegida, si hay una). | Elegir «Todas las cuentas». Si sigue, apretar «Sincronizar ahora» en [Los Fierros](los-fierros.md), o esperar la del día siguiente. Las cuentas de Threads y X nunca tienen publicaciones aquí. |
| «Todavía no hay posts sincronizados.» y «Conecta una red en Los Fierros (Ajustes) y aprieta Sincronizar ahora ahí mismo.» | La lista quedó vacía y no hay ninguna cuenta conectada. | Conectar una red en [Los Fierros](los-fierros.md) y apretar «Sincronizar ahora». |
| «Nada de <red> · <nombre de la cuenta> con este filtro.» (o «Nada de <red> con este filtro.» si la cuenta no tiene nombre) | Con una cuenta elegida, «Solo con métricas» sacó todas sus filas: ninguna tiene números de la red. | Apretar «Mostrar todas». |
| «El filtro dejó la lista vacía: ninguna publicación tiene métricas de la red en este período.» | Sin cuenta elegida, «Solo con métricas» sacó todas las filas: ninguna tiene números de la red. | Apretar «Mostrar todas». |
| «Se pasó» | Esa publicación ganó al menos el doble de views que la mediana de la lista. | Nada: es un elogio. |
| «No se pudo copiar el link.» | El navegador no dejó escribir en el portapapeles. | Copiar a mano la etiqueta del botoncito «?s=…» y armar el link (ver «Para copiar el link…»). |
| «La etiqueta no puede quedar vacía.» | Lo escrito quedó vacío después de limpiar los caracteres no permitidos (por ejemplo, solo emojis). | Escribir letras o números. |
| «Otra pieza de contenido ya usa esa etiqueta.» | Dos publicaciones no pueden compartir etiqueta. | Elegir otra. |
| «No se pudo guardar. Intenta de nuevo.» | Falló el guardado de la etiqueta. | Volver a intentar. |
| «Algo se rompió» y «No fue nada que hicieras: una consulta no respondió. Vuelve a intentarlo; el detalle quedó en la consola del navegador.» | Una consulta de la pantalla falló. | Apretar «Reintentar»; si sigue, «Ir a La Parrilla». |

## Si el humano dice…

- **«¿Dónde está Los Cortes?» / «desapareció la pestaña de mis posts»**: ya no es pestaña. La
  lista de publicaciones está en Los Números → «Ver todas las publicaciones →», en la pantalla
  «Tus publicaciones».
- **«No entiendo de qué son estos números»**: hay dos mitades. «En las redes» es lo que pasó
  en Instagram, TikTok, etc. (lo cuentan ellas); «En tu página» es la gente que entró a su
  página de links (lo cuenta Tu Parrilla).
- **«¿Views o visitas?»**: views son las reproducciones en la red; visitas, las veces que
  alguien abrió su página de links. Una visita «desde un post» es alguien que llegó por el link
  con la etiqueta de ese post.
- **«¿Dónde veo cuántas visitas me trajo este reel?»**: en «Qué publicación te trajo gente»,
  o en «Tus publicaciones», su fila, columna «Visitas».
- **«No veo el post que publiqué hoy»**: las publicaciones entran con la sincronización, no al
  publicar. Apretar «Sincronizar ahora» en [Los Fierros](los-fierros.md) o esperar la del día
  siguiente. Si es de Threads o X, no va a aparecer nunca: esas redes no se sincronizan.
- **«No veo un post viejo» (en «Tus publicaciones»)**: al entrar, la lista es de lo publicado
  en el período. Apretar «Todas las recientes» o elegir un período más largo. Revisar también
  el selector de cuenta, «Solo con métricas» y si fue borrado («Ver borrados», en «⋯ Más»).
- **«Solo veo Views y Visitas, ¿dónde están los likes?»**: en «Tus publicaciones», «⋯ Más».
- **«En Visitas dice —»**: el link con su etiqueta nunca trajo una visita; casi siempre porque
  no se pegó, o se pegó un link viejo que llevaba a la portada de Tu Parrilla.
- **«El link que copié antes me llevaba a la portada de Tu Parrilla»**: hasta el 2026-10-13 el
  botón de copiar armaba `https://tu-parrilla.cl/?s=<etiqueta>`, que abre la portada y no
  cuenta visitas. Ahora copia la dirección de su página principal. Los links ya pegados con la
  dirección vieja hay que reemplazarlos en la red.
- **«¿Por qué YouTube no tiene arrastre / lo ganado?»**: las reglas de YouTube no permiten
  calcular métricas nuevas con sus datos; se muestran sus contadores tal cual, y al lado lo que
  mide Tu Parrilla (visitas, clicks, CTR), bajo «En tu página · lo mide Tu Parrilla».
- **«Mis posts viejos de Instagram salen en gris y con —»**: Instagram no entrega números de lo
  publicado antes de que la cuenta fuera profesional. No tiene arreglo.
- **«Las views no cuadran con las de Instagram»**: la columna es la última lectura diaria,
  hasta un día atrás. «Views ganadas», además, es lo ganado en el período y no el total.
- **«Views ganadas no coincide con la lista de publicaciones»**: «Views ganadas» suma lo ganado
  por publicaciones de cualquier fecha; la lista, al entrar, es solo de lo publicado en el
  período, y su columna «Views» es el acumulado de por vida.
- **«El gráfico no cuadra con las cifras»**: el gráfico «Views ganadas y visitas, día a día»
  mira todas las cuentas y no cuenta el primer día de cada publicación (ver «Cómo leer cada
  número»).
- **«Elegí una página (o prendí Bots) y las visitas de mis publicaciones no cambian»**: la
  página y «Bots» son solo de la mitad «En tu página». «En las redes» y «Tus publicaciones»
  cuentan siempre todas las páginas y sin bots. Por eso «Qué publicación te trajo gente» puede
  no coincidir con la columna «Visitas» de «Tus publicaciones» cuando hay una página elegida o
  «Bots» prendido.
- **«Cambié la etiqueta y perdí las visitas»**: siguen guardadas con la etiqueta vieja. Poner
  de nuevo la etiqueta anterior las devuelve a la fila.
- **«¿Qué es arrastre?»**: de cada cien personas que vieron el post en el período, cuántas
  llegaron a su página.
- **«¿Qué significa “nuevo”?»**: que el post salió dentro del período, así que todo su contador
  cuenta como ganado.
- **«Solo veo 20 posts»**: al pie de la tabla, «Ver las <N> restantes».
- **«No veo el selector de cuenta»**: solo aparece con más de una cuenta. Ya no hay botones por
  red: se filtra por cuenta.
- **«No veo el botón Bots»**: apagado, está dentro del «⋯ Más» de «En tu página»; prendido,
  en la cabeza de esa mitad, al lado del selector de página.
- **«Tengo dos cuentas de Instagram»**: cada una tiene su tarjeta en «Tus cuentas», y el
  selector de cuenta las separa.
- **«Casi todo dice Directo» / «Instagram casi no aparece en De dónde vienen»**: el navegador
  interno de Instagram y TikTok esconde de dónde viene la gente. La etiqueta `?s=` es lo que sí
  lo dice: mirar «Qué publicación te trajo gente» o «Todas las etiquetas».
- **«Únicos no cuadra»**: la identidad de un visitante dura un día; en períodos largos, quien
  vuelve otro día cuenta de nuevo.
- **«El CTR pasa de 100%»**: hubo más clicks que visitas, porque hay gente que aprieta varios
  links.
- **«El CTR dice +50% pero solo subió un punto»**: la comparación es el cambio relativo del CTR,
  no la diferencia en puntos.
- **«Mis visitas no coinciden con los clics que me muestra Instagram»**: Instagram cuenta toques
  en el link; aquí cuenta solo lo que llegó a abrirse en un navegador, y sin bots.
- **«No veo TikTok en Tus cuentas»**: Tu Parrilla no lee seguidores de TikTok (tampoco de
  Threads ni X). Solo hay tarjetas de Instagram, Facebook y YouTube.
- **«Perdí seguidores y dice sin cambio» / «Seguidores ganados dice 0»**: la pantalla no muestra
  bajas; «sin cambio» o «0» puede ser una baja.
- **«Dice — en el período» / «Seguidores ganados dice —»**: no hay una lectura de antes del
  período para comparar. Elegir un período más corto que el tiempo que lleva conectada la
  cuenta.
- **«Visitas al perfil y alcance salen — en Facebook o YouTube»**: solo Instagram los entrega.
- **«¿Qué es (sin etiqueta)?»**: las visitas que llegaron por un link sin `?s=`, como el de la
  bio si no lo lleva.
- **«Veo una etiqueta que empieza con dm-»**: la puso la respuesta automática por palabra clave
  en el link que mandó.
- **«Veo ?s=… y no el texto del post»**: esa etiqueta no es de ninguna publicación sincronizada
  (la escribió alguien a mano en un link, es una etiqueta vieja que se cambió, o el post todavía
  no se sincroniza), o el post no tiene texto.
- **«Veo (link eliminado)»**: ese link se borró de la página en [La Vitrina](la-vitrina.md); sus
  clicks quedan.
- **«Las horas de Cuándo te visitan no calzan»**: se dibujan en la zona de
  [Tu Cuenta](tu-cuenta.md), que dice la explicación del panel.
- **«Una visita dice bot»**: solo se ven con «Bots» activo; apretarlo otra vez las saca.
- **«La pantalla se queda gris un rato»**: cada mitad carga por su lado, y los paneles de
  audiencia del «⋯ Más» de «En tu página» llegan después; esperar.

## Lo que esta pantalla no hace

- No acepta fechas exactas: solo los cinco períodos.
- No filtra por red: filtra por cuenta.
- No compara las versiones de un mismo post (otro hook, un trial reel, la misma pieza en otra
  cuenta) lado a lado.
- No muestra publicaciones de Threads ni de X: esas redes publican, pero no se sincronizan.
- No muestra lo programado que todavía no sale: eso está en [La Parrilla](la-parrilla.md).
- No consulta la red en vivo ni tiene botón para sincronizar: eso está en
  [Los Fierros](los-fierros.md).
- No identifica personas: no guarda la IP ni usa cookies, y no hay forma de saber quién visitó.
- No cuenta a quien descarga la página sin ejecutarla, ni con «Bots».
- No muestra seguidores perdidos, ni lee cuentas de TikTok, Threads o X.
- No pega el link en la red, ni edita ni borra la publicación allá: lo único que se edita aquí
  es la etiqueta, en «Tus publicaciones».
- No crea ni edita los links de la página: eso es [La Vitrina](la-vitrina.md).
- No tiene columna de guardados, de alcance ni de los atributos del post; el alcance y los
  atributos salen por la API de métricas.
- No ordena la lista por views ganadas (la columna «Views» ordena por el acumulado; las que más
  ganaron están en «Lo que más creció»).
- No exporta a planilla.
- Tiene topes y no avisa cuando se pasan: «En las redes» suma las 500 publicaciones más
  recientes de la cuenta elegida (o de todas); «Tus publicaciones» muestra como mucho 200; 50 etiquetas, 25 links, 12 orígenes,
  países o ciudades, 8 dispositivos, sistemas, navegadores o idiomas, 40 últimas visitas.
- No se lee con las llaves de la API: la API de métricas es por publicación, ver
  [la guía de la API](../api-editor.md). La app del teléfono tiene su propio resumen
  ([La app del teléfono](app-movil.md)).

## Para quien mantiene esta página

Sale de:

- `src/app/admin/(dash)/analytics/page.tsx` (el tablero: encabezado, las dos mitades, sus
  cifras, paneles, «⋯ Más» y textos)
- `src/app/admin/(dash)/analytics/accounts.tsx` (tarjetas de «Tus cuentas» y su gráfico)
- `src/app/admin/(dash)/analytics/publicaciones/page.tsx` («Tus publicaciones»: controles,
  avisos, estados vacíos, el link que se copia)
- `src/app/admin/(dash)/analytics/publicaciones/post-table.tsx` (la tabla, la etiqueta, copiar)
- `src/app/admin/(dash)/content/page.tsx` (la redirección desde la dirección de Los Cortes)
- `src/components/filter-bar.tsx` y `src/lib/filters.ts` (período, selectores, bots)
- `src/lib/tablero.ts` (cuenta elegida, qué «⋯ Más» están abiertos, seguidores ganados, qué
  filtros viajan entre las dos pantallas)
- `src/lib/analytics.ts` (cada consulta de la página, topes, granularidad, período anterior)
- `src/lib/posts.ts` y `src/lib/posts-kpis.ts` (qué publicaciones, cada número, las sumas, el
  ranking, los avisos)
- `src/lib/account-stats.ts` y `src/lib/social/account-metrics.ts` (seguidores, visitas al
  perfil, alcance, por cuenta)
- `src/lib/social/delta.ts` (lo ganado y «nuevo»)
- `src/lib/parrilla.ts` (la mediana y «Se pasó») y `src/app/globals.css` (colores de la barra)
- `src/components/charts/stat-tile.tsx`, `src/components/charts/panel.tsx`,
  `src/components/charts/bar-list.tsx`, `src/components/charts/traffic-chart.tsx`,
  `src/components/charts/campaign-table.tsx`, `src/components/charts/donut.tsx`,
  `src/components/charts/funnel.tsx`, `src/components/charts/heatmap.tsx`,
  `src/components/charts/use-sorted-rows.ts`
- `src/components/ui.tsx` (el encabezado con nombre y subtítulo)
- `src/lib/social/campaign.ts` y `src/app/admin/actions.ts` (etiquetas y sus errores)
- `src/lib/utils.ts`, `src/lib/dominios.ts`, `src/lib/profiles.ts` y `src/lib/usuarios.ts` (la
  dirección de la página principal que se copia; formato de números, nombres de países)
- `src/lib/tracking.ts` y `src/components/visit-tracker.tsx` (qué es una visita, bots, únicos,
  de dónde sale la etiqueta)
- `src/lib/networks.ts` (nombres de las redes y de los orígenes, y cómo se deducen)
- `src/lib/social/politica-youtube.ts` y `src/lib/social/retencion-youtube.ts` (YouTube)
- `src/lib/social/comentarios/reglas.ts` (las etiquetas `dm-`)
- `src/lib/social/sync.ts` y `src/lib/social/index.ts` (qué redes se sincronizan, borrados,
  lectura diaria), con `vercel.json` (la hora de la sincronización)
- `src/app/admin/(dash)/error.tsx`, `src/app/admin/(dash)/loading.tsx`,
  `src/app/admin/(dash)/nav.tsx`, `src/lib/vocabulario.ts`

Si cambias lo que se ve en alguno de ellos, actualiza esta página en el mismo commit.
