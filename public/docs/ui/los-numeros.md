# Los Números — cómo te fue en las redes y en tu página

`/admin/analytics` — pestaña «Los Números» de la barra de arriba del panel, la tercera y última (en el README y en documentos viejos se llama «Analítica»). Un clic adentro están `/admin/analytics/publicaciones`, «Tus publicaciones»: la lista de cada publicación, que hasta el 2026-10-13 era la pestaña «Los Cortes» (`/admin/content`, que ahora lleva ahí); `/admin/analytics/publicaciones/<id>`, la pieza de una publicación con sus versiones; `/admin/analytics/comparar`, «Comparar por atributo»; y `/admin/analytics/mejores`, «Tu mejor 10 %».

Un tablero con dos mitades que miden cosas distintas y lo dicen. «En las redes» es lo que
hicieron las publicaciones de la persona donde se publicaron —views ganadas, seguidores,
likes—, y lo cuentan las redes. «En tu página» es quién entró a su página pública de links (la
de [La Vitrina](la-vitrina.md), la que va en la bio) y qué apretó: visitas, clicks, de dónde
llegó la gente, con qué etiqueta `?s=`, desde dónde, con qué equipo y a qué hora; eso lo mide
Tu Parrilla, sin cookies. Las une la etiqueta `?s=` de cada publicación: si el link con esa
etiqueta está pegado en el post, las visitas que llegan por él se le cuentan a ese post. Cada
mitad muestra dos números y una lista corta; el resto aparece al apretar su «⋯ Más». La lista
completa, una publicación por fila, con su etiqueta editable y el botón para copiar su link,
está en «Tus publicaciones». Cada publicación abre su **pieza**: cada lugar donde salió (otra
cuenta, otro hook, el trial reel) con sus números lado a lado. «Comparar por atributo» junta
lo publicado por hook, tema o serie para ver qué funciona. Y «Tu mejor 10 %» muestra lo que más
rindió en el período, cuánto había que sacar para estar ahí y qué tienen en común esas
publicaciones.

Dos palabras que no hay que mezclar: la **etiqueta** es el `?s=` del link de cada publicación,
que dice por cuál llegó la gente a la página; los **atributos** son lo que se le anota a un post
programado —el hook, el tema, la serie— en su editor de [La Parrilla](la-parrilla.md) o por la
API.

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
- A la pieza de una publicación: el texto de su fila en «Tus publicaciones», una fila de «Lo
  que más creció», o, cuando la etiqueta es de una publicación, una fila de «Qué publicación te
  trajo gente» o el texto de una fila de «Todas las etiquetas». Se abre en la misma pestaña, con
  el mismo período.
- A «Comparar por atributo»: en el tablero, el enlace «Comparar por atributo →», a la derecha
  del título «Lo que más creció»; o, en una pieza, uno de los atributos de arriba.
- A «Tu mejor 10 %»: en el tablero, el enlace «Tu mejor 10 % →», el primero de los tres a la
  derecha del título «Lo que más creció». Llega con el mismo período y la misma cuenta.

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
publicaste. Lo cuentan las redes.» A la derecha (en el teléfono, en la línea de abajo):

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
período, de cualquier fecha.» A la derecha del título, tres enlaces: «Tu mejor 10 % →»,
«Comparar por atributo →» y «Ver todas las publicaciones →» (en el teléfono, debajo del
título y uno encima del otro). Hasta cinco filas,
de más a menos views ganadas, cada una con una barra detrás que compara con la primera: el
texto del post (o su etiqueta, si no tiene texto), en chico la cuenta con el patrón «<red> ·
<nombre de la cuenta>» (en el teléfono, debajo del texto), y a la derecha las views
ganadas. Cada fila abre la pieza de esa
publicación, en la misma pestaña (el enlace a la red está ahí).

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
  período**, dos gráficos, uno debajo del otro y con las mismas fechas: «Visitas al perfil» y
  «Alcance», un punto por día leído. Van separados porque se miden en escalas muy distintas:
  en un mismo gráfico, las visitas al perfil quedaban planas en cero. En el eje de cada
  gráfico, las cifras van abreviadas desde diez mil («34 mil»).

- **Panel «Views ganadas y visitas, día a día»**, explicación: «Cuánto creció lo que se vio en
  las redes contra cuánta gente llegó a tu página. Las views no incluyen YouTube; las visitas,
  sí.» Con una cuenta elegida arriba, en medio de esas dos frases se suma «Esta serie es de
  todas tus cuentas, no solo de la elegida.» Dos gráficos de áreas, uno debajo del otro y con
  las mismas fechas, cada uno rotulado arriba: «Views ganadas» y «Visitas» (separados por lo
  mismo: las views van en miles y las visitas en decenas). Cada punto es un día (también con
  «Hoy»); con «Todo», una semana. Al pasar el mouse aparece la fecha completa y el valor.

### Mitad «En tu página»

**La cabeza.** El título «En tu página» y debajo «Quién entró a tu página de links —tu
Vitrina— y qué apretó. Lo cuenta Tu Parrilla, sin cookies ni terceros.» A la derecha (en el
teléfono, en la línea de abajo):

- Un selector de página, **solo si la persona tiene más de una página pública**: «Todas tus
  páginas», y una opción por página con el patrón «<nombre> · /<dirección>».
- El botón «Bots», **solo cuando está prendido** (ver más abajo): así se ve siempre, aunque el
  «⋯ Más» esté cerrado.
- «⋯ Más», que abre el resto de esta mitad. Abierto, dice «Menos».

**Dos cifras**: «Visitas» y «Clicks en tus links». Debajo de cada número, la comparación con
el período anterior: una flecha, un porcentaje («+12%», «-8%», o «0%» con flecha hacia el lado
si casi no cambió) y el texto «vs. período anterior». La subida va en verde y la bajada en
rojo. Si el período anterior no tuvo nada, en vez de eso dice «Nada en el período anterior
para comparar».

**Panel «Qué publicación te trajo gente»**, explicación «Visitas que llegaron por el link de
una publicación (su etiqueta ?s=).» Hasta cinco filas: las etiquetas que más visitas trajeron
en el período, sin contar las visitas que llegaron sin etiqueta, cada una con una barra
detrás. Si la etiqueta es de una publicación sincronizada, se ve el texto del post y, en chico,
su cuenta con el patrón «<red> · <nombre de la cuenta>»; si no lo es, o el post no tiene texto,
se ve «?s=<etiqueta>». A la derecha, las visitas. Las filas de una publicación abren su pieza,
en la misma pestaña; las de una etiqueta que no es de ninguna publicación (un `dm-…`, una
escrita a mano) no son enlaces.

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
  texto), que es un enlace a la pieza de esa publicación, en la misma pestaña, y debajo, en
  chico, el ícono de su red y su cuenta con el patrón «<red> · <nombre de la cuenta>»: el
  mismo post subido a tres redes son tres filas, y así se distinguen; si no, la
  etiqueta sola, en letra de máquina de escribir, sin enlace. Las visitas que llegaron sin
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

Mientras una mitad carga se ve su esqueleto: bloques sin texto en el lugar del título, las
cifras y el panel, como brasas: se encienden y se apagan de a poco, uno un poco después del otro (con «reducir movimiento» activado en el sistema, quietos a media luz). Al entrar a Los Números se ve lo mismo
para el tablero entero, con el título, su bajada y el lugar del período; las páginas de
adentro —«Tus publicaciones», «Comparar por atributo», «Tu mejor 10 %» y el detalle de un
post— cargan con el lugar del título y filas.

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

**Los avisos.** Debajo, un recuadro con una, dos o tres frases, **solo cuando corresponde**:

- Si la lista llegó a su tope de 1000 filas, primero: «Se ven las 1000 más recientes. Para ver
  el resto, elige una cuenta o un período más corto.»
- Si hay publicaciones cuyo link nunca se pegó: «Ninguna etiqueta está pegada todavía. Copia
  el link de una fila y pégalo en ese post de la red.» (cuando no hay ninguna pegada), o «1
  publicación aún no tiene su link pegado.», o «<N> publicaciones aún no tienen su link
  pegado.».
- Si hay publicaciones de las que la red no entregó ningún número hasta el fin del período: «1 publicación
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
- El texto del post en una línea, cortado si es largo. Es un enlace que abre la pieza de esa
  publicación, en la misma pestaña. Si no hay texto: «Sin descripción».
- Debajo, en chico: la cuenta y la fecha de publicación corta, con el patrón «<red> · <nombre
  de la cuenta> · <fecha>» (por ejemplo «Instagram · @juan · 3 sept»; sin nombre de cuenta,
  solo la red y la fecha), y « · nuevo» al final si la publicación salió dentro del período.
  Si la red dio el enlace del post, al final va una flechita en diagonal (al pasar el mouse:
  «Ver en <red>», por ejemplo «Ver en Instagram») que abre el post en la red, en otra pestaña.
- En esa misma línea, **solo en algunas filas**, el sello «Se pasó» (al pasar el mouse: «El
  doble o más de las vistas ganadas por la mitad de tus posts del período»).
- Debajo, la etiqueta como un botoncito que dice «?s=<etiqueta>» (al pasar el mouse: «Editar
  la etiqueta»), y a su lado un ícono de copiar (al pasar el mouse: «Copiar el link con la
  etiqueta»). Si algo falla, el error sale en rojo al lado.

**En el teléfono**, con las dos columnas de entrada, la tabla deja solo «Post» y los rótulos
de arriba se van: debajo del texto de cada fila van sus dos cifras, «<N> views (+<ganado>) ·
<M> visitas a tu página», y arriba de la tabla, para ordenar, «Ordenar» con dos botones,
«Views» y «Visitas», que funcionan como los títulos de las columnas. Con «⋯ Más» abierto, la
tabla completa se desliza de lado.

Detrás del número de «Views» hay una barra horizontal: su largo compara el acumulado de esa
fila con el más grande de la lista, y su color dice cómo le fue en el período (ver «Cómo leer
cada número»). Al lado del acumulado puede ir, en chico y más tenue, «+<N>»: lo ganado en el
período.

Las filas de publicaciones borradas, y las de publicaciones de las que la red no entregó ningún
número, se ven semitransparentes.

La tabla muestra 20 filas. Si hay más, al pie hay un botón «Ver las <N> restantes» (o «Ver la
publicación restante» si falta una sola); expandida, el botón dice «Mostrar menos». Al recargar
la página vuelve a mostrar 20.

### La pieza (`/admin/analytics/publicaciones/<id>`)

Una publicación y todas sus versiones: cada lugar donde salió, una fila por versión, con sus
números lado a lado. Una **versión** es cada cuenta a la que salió un post programado en La
Parrilla (en Instagram, quizá como trial reel); si los atributos del post traen la clave
`pieza`, también las de todos los posts programados con el mismo valor. Así se juntan dos
hooks del mismo video, o el trial reel y el reel normal en la misma cuenta, que por fuerza son
dos posts programados. Una publicación subida a mano en la red, fuera de La Parrilla, es una
pieza de una sola versión, sin atributos.

Se llega desde el texto de una fila de «Tus publicaciones», desde una fila de «Lo que más
creció», desde una de «Tu mejor 10 %», o, si la etiqueta es de una publicación, desde una de
«Qué publicación te trajo gente» o de «Todas las etiquetas». No tiene pestaña propia ni subtítulo: la barra sigue marcando «Los
Números».

**Encabezado.** Arriba a la izquierda, una flecha que vuelve a donde se entró: «Los Números»
si se llegó desde el tablero («Lo que más creció», «Qué publicación te trajo gente» o «Todas
las etiquetas»), que vuelve al tablero como estaba, con los mismos «⋯ Más» abiertos; «Tu mejor
<N> %» (con el porcentaje que estaba elegido) si se llegó desde esa pantalla; o «Tus
publicaciones» si se llegó desde la lista. Debajo, en chico, «Pieza»; el título es el texto de la
publicación que se abrió (cortado a dos líneas), o «?s=<etiqueta>» si no tiene texto. Debajo,
«Cada lugar donde salió, con sus números lado a lado. Las views las cuenta cada red; las
visitas, Tu Parrilla, cuando alguien entra por el link de esa versión.»

**Los atributos de arriba.** Solo si hay algo que mostrar, una fila de cápsulas con el patrón
«<atributo>: <valor>» (por ejemplo «tema: negocios»):

- «pieza: <valor>», si las versiones se juntaron por esa clave. No es un enlace.
- Una por cada atributo que **todas** las versiones tienen con el mismo valor. Cada una es un
  enlace (al pasar el mouse: «Comparar por <atributo>») que abre «Comparar por atributo» con
  ese atributo elegido.

Un valor `true` o `false` se lee «sí» o «no».

**El período.** Los cinco botones de siempre: «Hoy», «7 días», «30 días», «90 días», «Todo».

**Panel «Una versión»** (o «<N> versiones»), explicación: «Los números del período elegido; con
«Todo», los de toda la vida. Views: el total en la red, con lo ganado en el período al lado. En
YouTube no hay ganado ni arrastre: sus reglas no permiten calcular métricas con sus datos.»

La tabla. Sobre las columnas, «En la red» sobre «Views» y «En tu página · lo mide Tu Parrilla»
sobre «Visitas» y «Arrastre». Las columnas, de izquierda a derecha:

- «Versión».
- Una columna por cada atributo que **cambia** entre versiones (o que falta en alguna),
  rotulada con el nombre del atributo tal como se escribió (por ejemplo «hook»). En cada fila,
  el valor de esa versión (sin los espacios de los bordes), «sí» / «no», o «—» si no lo tiene o
  lo tiene vacío.
- «Views»: el acumulado en la red, con «+<N>» chico al lado si ganó en el período y no salió
  dentro de él; «—» si la red no dio números.
- «Visitas»: las que llegaron por el link de esa versión en el período; «—» si su link nunca
  trajo una visita, o si la versión todavía no tiene publicación sincronizada.
- «Arrastre», en porcentaje con dos decimales, o «—».

Cada fila, en la columna «Versión»:

- La cuenta, con el patrón «<red> · <nombre de la cuenta>», y la cápsula «Trial reel» si salió
  así en Instagram.
- Debajo, en chico: cómo va, la fecha y hora programada (en una publicación fuera de La
  Parrilla, la de publicación) y, si hay más de una versión, « · la que abriste» en la que se
  abrió (que además se ve un poco más clara). Cómo va es una de estas: «Programado»,
  «Publicando…», «Publicado», «Falló», «Reintentando», «En tu bandeja de TikTok», «Borrada en la
  red» o «Fuera de La Parrilla».
- Si falló o se está reintentando, el error de la red, en rojo.
- Si ya se publicó pero la red todavía no la entrega: «Sin números todavía: llegan con la
  sincronización diaria.», y en un trial reel además «Un trial reel puede no aparecer hasta que
  lo compartas.» No aparece en un borrador mandado a la bandeja de TikTok («En tu bandeja de
  TikTok»): ese no tiene números hasta que se publique desde la app.
- Dos enlaces chicos: «Ver en <red>» con una flechita en diagonal, que abre la publicación en
  la red en otra pestaña (si la red dio el enlace), y «Editar atributos», que abre el editor
  del post programado en [La Parrilla](la-parrilla.md) (solo si salió de La Parrilla). Desde
  ese editor, «Volver», «Guardar» y «Eliminar» regresan a esta pieza.

Las versiones con números van primero, de más a menos views; después las que todavía no
salieron o no trajeron nada, por fecha. Una versión borrada en la red se ve semitransparente.

**Al pie del panel**, una de tres frases:

- En una publicación fuera de La Parrilla: «Esta publicación no salió de La Parrilla: no tiene
  versiones ni atributos. Lo que programas desde La Parrilla sí los tiene.»
- Si las versiones se juntaron por `pieza`: «Juntas por el atributo pieza: un post programado
  con el mismo valor. Para sumar otra versión, dale ese mismo valor en sus atributos.» (con
  varios: «<N> posts programados»).
- Si no: «¿Otra versión con otro hook, o el trial reel en la misma cuenta? Son otro post
  programado: dales a los dos el mismo atributo pieza —por ejemplo {"pieza":
  "chimichurri-30s"}— en «Editar atributos» o por la API, y aparecen juntos acá.»

### Comparar por atributo (`/admin/analytics/comparar`)

Para cada valor de un atributo —el hook, el tema, la serie—, cuántas publicaciones lo llevan y
cómo les fue, en medianas. Responde «¿qué hook funciona mejor?». Cuenta solo lo **publicado en
el período**, como la API de métricas.

Se llega con el enlace «Comparar por atributo →» de «Lo que más creció», en el tablero, o
desde una cápsula de atributo en una pieza. No tiene pestaña propia: la barra sigue marcando
«Los Números».

**Encabezado.** Arriba a la izquierda, una flecha y «Los Números», que vuelve al tablero. El
título «Comparar por atributo» y la línea «Los atributos son lo que le anotas a un post
programado —el hook, el tema, la serie—, en su editor o por la API. Acá ves, para cada valor,
cómo le fue a lo que publicaste en el período.»

**La fila de controles:**

- Los cinco botones del período.
- El selector de cuenta, **solo con más de una cuenta**: «Todas las cuentas» y una opción por
  cuenta con el patrón «<red> · <nombre de la cuenta>».
- El selector de atributo, **solo si alguna publicación del período tiene atributos**: una
  opción por atributo con el patrón «Por <atributo>» (por ejemplo «Por hook»), del más usado al
  menos usado, con «Por pieza» al final si existe. Siempre hay uno elegido: no tiene opción «todos». Al
  entrar es «hook» si existe; si no, el más usado.

**El aviso del atributo que falta.** Si la dirección pide un atributo (por ejemplo, al apretar
una cápsula en una pieza) que nada de lo publicado en el período lleva, aparece un recuadro:
«Nada de lo publicado en este período lleva «<atributo>». Amplía el período, o mira otro
atributo.», y la pantalla muestra otro: «hook» si existe, o el más usado.

**Panel «Por <atributo>»** (o «Por atributo» si no hay ninguno), explicación: «Medianas de lo
publicado en el período: la publicación del medio, para que un reel que se pasó no arrastre a
todo su valor. Cada mediana cuenta solo a quien tiene ese número; YouTube no entra en views ni
en arrastre.»

La tabla. Sobre las columnas, «En la red» sobre «Views ganadas» y «En tu página · lo mide Tu
Parrilla» sobre «Visitas» y «Arrastre». Las columnas: el nombre del atributo (por ejemplo
«hook»), «Publicaciones», «Views ganadas», «Visitas», «Arrastre». Una fila por valor, de la que
tiene más publicaciones a la que tiene menos; al final, «sin <atributo>» (por ejemplo «sin
hook»): lo publicado en el período que no lo lleva, incluido lo que no salió de La Parrilla,
como vara. Las filas con menos de 10 publicaciones se ven tenues.

Debajo de la tabla: «<N> publicaciones en el período, <M> con atributos. Las filas tenues
tienen menos de 10 publicaciones: con tan pocas, la diferencia puede ser suerte.» Si el período
tiene 10.000 publicaciones o más, se suma «Se leyeron las 10 mil más recientes: acorta el
período para verlas todas.»

### Tu mejor 10 % (`/admin/analytics/mejores`)

De lo publicado en el período, las publicaciones que más rindieron en una métrica, cuánto había
que sacar para entrar, cuánto más rinden que el resto y qué tienen en común. Responde «¿cuáles
fueron mis mejores posts del mes?» y, con una cuenta elegida, «¿cuál fue lo mejor de esta
cuenta?». Cuenta solo lo **publicado en el período**, como «Comparar por atributo».

Se llega con el enlace «Tu mejor 10 % →» de «Lo que más creció», en el tablero. No tiene pestaña
propia: la barra sigue marcando «Los Números».

**Encabezado.** Arriba a la izquierda, una flecha y «Los Números», que vuelve al tablero. El
título es «Tu mejor 10 %» (o 5, 20 o 25, según el porcentaje elegido) y debajo: «Lo que
publicaste en el período que más rindió, cuánto había que sacar para entrar y qué tienen en
común esas publicaciones frente al resto.»

**La fila de controles:**

- Los cinco botones del período.
- El selector de cuenta, **solo con más de una cuenta**: «Todas las cuentas» y una opción por
  cuenta con el patrón «<red> · <nombre de la cuenta>».
- El selector de métrica: «Por views ganadas» (el de entrada), «Por visitas a tu página», «Por
  clicks en tus links», «Por interacciones» y «Por arrastre».
- El selector de porcentaje: «El mejor 5 %», «El mejor 10 %» (el de entrada), «El mejor 20 %»
  y «El mejor 25 %».

**Tres cifras:**

| Rótulo | Valor | Aclaración debajo |
|---|---|---|
| «Entran» | «<N> de <M>»: cuántas entraron de cuántas compiten | «Publicaciones con <métrica>», y « · sin YouTube» en views ganadas, interacciones y arrastre |
| «El corte» | El número de la última que entró | «<Métrica> para entrar» |
| «Rinden» | «×4,6»: cuántas veces más rinde la publicación del medio de arriba que la del medio del resto | «La mediana de arriba contra la del resto» |

Cualquiera puede ser «—» si no hay con qué calcularla.

**El aviso de pocas.** Si compiten menos de 20 publicaciones, un recuadro: «Compiten solo <N>
publicaciones: con tan pocas, el mejor <P> % sirve para mirarlas, no para sacar conclusiones.
Amplía el período o sube el porcentaje.»

**Panel «Las publicaciones»**, explicación «De la que más <métrica> sumó a la que menos. Cada
una abre su pieza.» Una fila por publicación que entró: su puesto, su miniatura, el texto (o
«?s=<etiqueta>» si no tiene), debajo en chico «<red> · <nombre de la cuenta> · <fecha>», y a la
derecha su número en la métrica elegida (en porcentaje con dos decimales si es el arrastre).
El texto abre la pieza en la misma pestaña.

**Panel «Qué tienen en común»**, explicación «Lo que se repite más entre las de arriba que
entre todas las que compiten: los atributos, la red, el formato, el día y la hora de
publicación. Que se repita no prueba que sea la causa.» Hasta ocho filas, de la más marcada a
la menos: «<rasgo>: <valor>» (por ejemplo «hook: pregunta», «formato: Reel», «día: martes»,
«hora: noche (18 a 24)»), en chico «<n> de <m> arriba · <N> de <M> entre todas», y a la
derecha, en naranjo, cuántas veces más frecuente es arriba («×2,4»).

**Panel «Arriba y el resto»**, explicación «Medianas: la publicación del medio de cada grupo.
Cada una cuenta solo a quien tiene ese número; YouTube no entra en views ganadas, interacciones
ni arrastre.» Una tabla con las columnas «Tu mejor <N> %» y «El resto», y las filas «Views
ganadas», «Visitas a tu página», «Interacciones» y «Arrastre».

**Al pie**, en chico: con views ganadas, interacciones o arrastre, «YouTube no compite en
<métrica>: sus reglas no permiten calcular métricas con sus datos. Sí compite en visitas y
clicks, que mide Tu Parrilla.»; con el arrastre, además, «En el arrastre solo compiten las que
ganaron al menos la mediana de views del período: con pocas views, una visita ya es un
porcentaje alto.»; y si el período tiene 10.000 publicaciones o más, «Se leyeron las 10 mil más
recientes: acorta el período para verlas todas.»

## Cómo leer cada número

**Reglas generales.** Un «—» significa que no hay dato: nunca es cero, y al ordenar una tabla
queda siempre al fondo, en las dos direcciones. Los números desde 10.000 se abrevian («12 mil»,
«1,5 M»). Los porcentajes llevan punto decimal («3.3%», «7.10%»).

**El período.** «Hoy» son las últimas 24 horas, no desde la medianoche; «Todo» es desde 2020.
Los días y las horas se cortan en la zona horaria de la persona, la de [Tu Cuenta](tu-cuenta.md).

**De dónde salen los números de la red.** La red no se consulta en vivo. Una sincronización
lee todas las cuentas una vez al día (a las 9:00 UTC, las 5 o 6 de la mañana en Chile según la
época) y guarda una lectura de cada publicación que le toca; también corre al apretar
«Sincronizar ahora» en [Los Fierros](los-fierros.md). Por eso una publicación nueva no aparece
hasta la siguiente sincronización, y los números pueden ir hasta un día atrás de lo que muestra
la app de la red. Threads y X no se sincronizan: no tienen números aquí.

**Qué publicación se lee cada día.** Depende de su edad. Lo publicado en los últimos 10 días se
lee todos los días (y, aunque la cuenta publique poco, siempre sus 200 publicaciones más
nuevas). Lo más viejo, cada vez más espaciado, porque casi no se mueve: una vez por semana hasta
el mes, cada dos semanas hasta los tres meses y cada cuatro semanas después. Así, los números de
una publicación de hace dos meses pueden ir hasta dos semanas atrás de lo que muestra la red, y
lo que creció entre dos lecturas aparece entero el día de la segunda. Si una corrida no alcanza
a leer todo lo viejo que le tocaba, lo que falta se lee al día siguiente.

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
cuenta en octubre. Sin YouTube ni publicaciones borradas. Mira las publicaciones de la cuenta
elegida (o de todas) que tuvieron alguna lectura de la red o alguna visita en el período, que
son las únicas que pueden sumar, hasta 10.000. «—» cuando ninguna publicación tiene lo ganado
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
cada publicación no suma (no hay lectura anterior con qué restar). Una publicación de más de
10 días se lee cada una, dos o cuatro semanas (ver «Qué publicación se lee cada día»), así que
lo que creció en ese tiempo cae entero en el día en que se leyó: los saltos de un día puntual
pueden ser eso. Por eso no tiene por qué sumar lo mismo que la cifra «Views ganadas».

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
mismo, no en puntos: pasar de 2.0% a 3.0% se ve como «+50%». «Nada en el período anterior para
comparar» aparece cuando el período anterior tuvo cero y este no, porque no hay porcentaje de
crecimiento desde cero; con «Todo» pasa casi siempre, porque antes de 2020 no hay nada.

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
«Todas las recientes», las 1000 publicaciones más recientes, de cualquier fecha, con sus números
medidos dentro del período. En los dos casos, como mucho 1000, todas de la cuenta elegida (o de
todas las cuentas); si el tope corta la lista, lo dice el aviso de arriba.

**Qué filtros le aplican.** El período, la cuenta, los dos botones de qué publicaciones y lo del
«⋯ Más». La página y «Bots» del tablero no: las visitas, clicks, CTR y arrastre de cada
publicación se cuentan siempre en todas las páginas y sin bots.

**«Views» (columna).** El contador acumulado de por vida, según la última lectura hasta el fin
del período: casi siempre una de adentro, pero una publicación de más de 10 días se lee cada
una, dos o cuatro semanas, y en un período corto puede tener solo una de antes. El «+<N>» al
lado es lo ganado en el período. Ese «+<N>» no aparece cuando:

- la publicación salió dentro del período (lleva « · nuevo»): todo su contador es lo ganado, y
  repetirlo no agrega nada. Con «Publicadas en el período» casi todas las filas son así; el
  «+<N>» se ve sobre todo con «Todas las recientes»;
- no hay lectura de antes del período (la publicación existía, pero nadie la había medido
  todavía): el crecimiento no se puede saber;
- no hay lectura dentro del período (una publicación vieja, que no tocaba leer): el contador es
  el de antes y lo ganado adentro no se sabe;
- no creció, o es de YouTube.

El «—» en «Views» aparece solo cuando la red no dio ninguna lectura hasta el fin del período. Ordenar por
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

### En la pieza

**Qué filtros le aplican.** Solo el período. La cuenta no (la pieza muestra todas sus
versiones, de cualquier cuenta), y la página y «Bots» tampoco: las visitas se cuentan en todas
las páginas y sin bots. Las versiones borradas en la red entran, semitransparentes.

**Los números de cada versión** son los mismos de «Tus publicaciones» —«Views» acumuladas con
lo ganado al lado, «Visitas» por la etiqueta de esa versión, «Arrastre» como visitas sobre
views ganadas—, medidos en el período elegido. Con «Todo», son los de toda la vida. YouTube no
tiene lo ganado ni arrastre.

**Qué versiones salen.** Las cuentas a las que salió el post programado del que viene la
publicación, incluidas las que todavía no salen o fallaron (con su estado y sin números). Si
sus atributos traen `pieza`, también las de todos los posts programados del dueño con el mismo
valor: escrito igual, con las mismas mayúsculas (los espacios al principio y al final no
importan). Como mucho 100 versiones; si hay más, las del post de la publicación abierta van
primero, así que esa nunca queda fuera.

**Los atributos.** Los que todas las versiones comparten van arriba, una vez; los que cambian
de una a otra —o que alguna no tiene— van en columnas, porque eso es lo que hay que comparar.

### En «Comparar por atributo»

**Qué publicaciones cuenta.** Las publicadas dentro del período (no las que solo tuvieron
actividad en él), de la cuenta elegida o de todas, sin las borradas. La página y «Bots» no le
aplican. Cada publicación sincronizada cuenta una vez: un post programado que salió a tres
cuentas son tres publicaciones, cada una con los atributos del post. Lee como mucho las 10.000
más recientes.

**Los valores.** Los espacios al principio y al final no cuentan, pero el resto sí: un valor se
agrupa con otro solo si está escrito igual, con las mismas mayúsculas y tildes («Pregunta» y
«pregunta» son dos filas). Un valor vacío cuenta como no tenerlo: va a «sin <atributo>». `true`
y `false` se leen «sí» y «no».

**Las medianas.** De las publicaciones de esa fila, la del medio: la mitad tuvo menos, la mitad
más. Se usa la mediana y no el promedio para que un reel que se pasó no arrastre a todo su
valor. Cada mediana cuenta solo a las publicaciones que tienen ese número:

- «Views ganadas»: lo ganado en el período por cada publicación. Como todas salieron dentro
  del período, es casi siempre su contador entero. Sin YouTube.
- «Visitas»: las visitas que trajo cada publicación por su link en el período, solo de las que
  tienen el link pegado (alguna vez trajo una visita). YouTube incluido.
- «Arrastre»: el arrastre de cada publicación. Sin YouTube. No es «Visitas» dividido por
  «Views ganadas» de la misma fila.

Una mediana es «—» cuando ninguna publicación de la fila tiene ese número.

**«sin <atributo>».** Lo publicado en el período que no lleva ese atributo —también lo subido a
mano, que no tiene ninguno—. Sirve de vara: un hook que no le gana a «sin hook» no está
ayudando.

**Las filas tenues.** Menos de 10 publicaciones: con tan pocas, una diferencia puede ser
suerte.

### En «Tu mejor 10 %»

**Qué publicaciones compiten.** Las publicadas dentro del período, de la cuenta elegida o de
todas, sin las borradas, que **tienen** la métrica elegida. Un número que no se sabe no
compite: en «views ganadas», «interacciones» y «arrastre» no compite YouTube (sus reglas no lo
permiten); en «visitas» y «clicks» no compite una publicación cuyo link con su etiqueta nunca
trajo una visita. En el arrastre compiten solo las que ganaron al menos la mediana de views del
período.

**Quién entra.** Se ordenan de mayor a menor y entran las primeras: el porcentaje elegido de
las que compiten, redondeado hacia arriba, y al menos una. Si hay empate con la última, entran
todas las empatadas. Nunca entra una con cero.

**Las métricas.** «Views ganadas»: lo ganado en el período. «Visitas a tu página» y «Clicks en
tus links»: lo que trajo cada publicación por su link, en el período. «Interacciones»: likes,
comentarios y compartidos ganados en el período. «Arrastre»: el de cada publicación.

**«Rinden».** La mediana de arriba dividida por la del resto, en la métrica elegida: «×4,6» es
que una publicación típica de arriba sacó 4,6 veces lo de una típica del resto.

**«Qué tienen en común».** Cada rasgo cuenta una vez por publicación: los atributos (menos
`pieza`, que junta versiones de un mismo video), la red, el formato («Reel», «Video», «Short»,
«Foto», «Carrusel», «Enlace»), el día de la semana y la franja de la hora de publicación, en la
zona de [Tu Cuenta](tu-cuenta.md). Entra si está en al menos dos de arriba y es al menos 1,5
veces más frecuente arriba que entre todas las que compiten. Con menos de tres arriba, no
aparece nada.

**Con «Todas las cuentas»**, una cuenta grande llena la tajada de arriba y las chicas no
aparecen nunca: para ver lo mejor de cada una, elegirla en el selector.

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
publicación y trae las 1000 publicaciones más recientes (de la cuenta elegida, si hay una), con
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

### Para ver las versiones de una publicación

1. Abrir su pieza: en «Tus publicaciones», apretar el texto de su fila (o, en el tablero, su
   fila en «Lo que más creció»).
2. Cada fila del panel es una versión: otra cuenta, otro hook, el trial reel. Las columnas
   entre «Versión» y «Views» son los atributos en que se diferencian.
3. Elegir el período arriba; «Todo» para los números de toda la vida.

### Para juntar dos versiones del mismo video

Dos hooks del mismo video, o el trial reel y el reel normal en la misma cuenta, son dos posts
programados distintos: no se ven juntos hasta que comparten el atributo `pieza`.

1. Abrir la pieza de una de las dos y apretar «Editar atributos». Se abre su editor, en La
   Parrilla.
2. En «Atributos (JSON del editor de contenido)», agregar la clave `pieza` con un nombre
   cualquiera, conservando lo que ya hubiera. Por ejemplo, de `{"hook": "pregunta"}` a
   `{"hook": "pregunta", "pieza": "chimichurri-30s"}`.
3. Apretar «Guardar». Vuelve a la pieza.
4. Hacer lo mismo con la otra versión, con el mismo valor de `pieza`, escrito igual.
5. Desde ese momento, la pieza de cualquiera de las dos muestra las dos, y al pie dice «Juntas
   por el atributo pieza…».

Si una de las dos se subió a mano en la red, fuera de La Parrilla, no se puede: no tiene
atributos. Los atributos también se ponen por la API: ver [la guía de la API](../api-llm.md).

### Para ver qué hook funciona (o qué tema, o qué serie)

1. En el tablero, mitad «En las redes», apretar «Comparar por atributo →».
2. Elegir el período: cuenta lo publicado en él. Con más de una cuenta, se puede elegir una.
3. En el selector de atributo, elegir «Por hook» (u otro).
4. Comparar las medianas de cada valor con las de «sin hook», y desconfiar de las filas tenues.

Para que haya algo que comparar, los posts tienen que llevar atributos: se anotan en el editor
de cada post en [La Parrilla](la-parrilla.md), en «Editar atributos» de una pieza, o por la API.

### Para ver tus mejores publicaciones

1. En el tablero, mitad «En las redes», apretar «Tu mejor 10 % →».
2. Elegir el período: cuenta lo publicado en él.
3. Si hace falta, elegir otra métrica (por ejemplo «Por visitas a tu página», para ver qué
   trajo gente a la página) u otro porcentaje.
4. Mirar «Las publicaciones» y, debajo, «Qué tienen en común».

### Para ver el mejor 10 % de una sola cuenta

1. En «Tu mejor 10 %», en el selector de cuenta, elegir la cuenta. Solo aparece con más de una
   cuenta conectada.

Lo mismo sale por API, para el agente: `GET /api/metrics/mejores` en
[la guía de la API](../api-editor.md).

### Para corregir un atributo de una publicación

1. Abrir su pieza y apretar «Editar atributos».
2. Cambiar el JSON de «Atributos (JSON del editor de contenido)» y apretar «Guardar». Vuelve a
   la pieza. Cambiar los atributos de un post que ya salió no toca lo publicado.

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
| «Sin números todavía: llegan con la sincronización diaria.» (en una versión de la pieza) | Esa versión ya se publicó, pero la red todavía no la entrega en la sincronización. | Esperar la del día siguiente, o apretar «Sincronizar ahora» en [Los Fierros](los-fierros.md). |
| «Un trial reel puede no aparecer hasta que lo compartas.» (junto a la anterior) | Instagram no siempre entrega un trial reel antes de que se comparta con los seguidores. | Si se quiere ver sus números, compartirlo desde Instagram. |
| «Falló», con el error de la red en rojo debajo (en una versión de la pieza) | Esa versión no salió. | Corregirla o reprogramarla en [La Parrilla](la-parrilla.md); el error se explica ahí. |
| «Fuera de La Parrilla» y «Esta publicación no salió de La Parrilla: no tiene versiones ni atributos. Lo que programas desde La Parrilla sí los tiene.» | La publicación se subió a mano en la red. | Nada: no se le pueden poner atributos ni juntarla con otras. |
| «No encontramos esa página» (al abrir una pieza) | La dirección no es de una publicación de esta persona, o está mal copiada. | Entrar de nuevo desde «Tus publicaciones». |
| «No publicaste nada en este período. Amplía el período.» (en «Comparar por atributo») | No hay publicaciones publicadas en el período (de la cuenta elegida, si hay una). | Elegir un período más largo, o «Todas las cuentas». |
| «Ninguna publicación del período tiene atributos. Se anotan en el editor de un post de La Parrilla (el campo «Atributos»), desde «Editar atributos» en una pieza, o por la API.» | Hay publicaciones en el período, pero ninguna tiene atributos. | Anotarlos (ver «Para juntar dos versiones…» y «Para ver qué hook funciona»), o ampliar el período. |
| «Nada de lo publicado en este período lleva «<atributo>». Amplía el período, o mira otro atributo.» | Se pidió un atributo (por ejemplo, desde una cápsula de una pieza) que nada de lo publicado en el período lleva; la tabla muestra otro. | Elegir un período más largo, u otro atributo en el selector. |
| «Se leyeron las 10 mil más recientes: acorta el período para verlas todas.» | El período tiene 10.000 publicaciones o más y la comparación usó solo las más recientes. | Elegir un período más corto. |
| «Se ven las 1000 más recientes. Para ver el resto, elige una cuenta o un período más corto.» (en «Tus publicaciones») | La lista llegó a su tope de 1000 filas y deja fuera las más viejas. | Elegir una cuenta, o un período más corto. |
| «No publicaste nada en este período. Amplía el período.» (en «Tu mejor 10 %») | No hay publicaciones publicadas en el período (de la cuenta elegida, si hay una). | Elegir un período más largo, o «Todas las cuentas». |
| «Ninguna publicación del período tiene <métrica>. YouTube no entra en esta métrica.» | Hay publicaciones, pero ninguna tiene la métrica elegida: por ejemplo, todo es de YouTube y la métrica es views ganadas. | Elegir «Por visitas a tu página» o «Por clicks en tus links», donde YouTube sí compite. |
| «Ninguna publicación del período tiene <métrica>. Las visitas y los clicks se cuentan cuando alguien entra por el link con la etiqueta de la publicación.» | Ninguna publicación del período tiene su link pegado con su etiqueta. | Pegar los links (ver «Para copiar el link…»), o elegir otra métrica. |
| «Ninguna publicación del período sumó <métrica>.» | Todas las que compiten tienen cero. | Ampliar el período, u otra métrica. |
| «Compiten solo <N> publicaciones: con tan pocas, el mejor <P> % sirve para mirarlas, no para sacar conclusiones. Amplía el período o sube el porcentaje.» | Compiten menos de 20. | Elegir un período más largo o un porcentaje mayor. |
| «Con menos de 3 publicaciones arriba no hay con qué comparar. Amplía el período o sube el porcentaje.» (en «Qué tienen en común») | Entraron una o dos. | Igual que arriba. |
| «Nada se repite más entre las de arriba que en el resto.» | Ningún rasgo está en al menos dos de arriba y es 1,5 veces más frecuente ahí. | Nada: las mejores no comparten nada que las distinga. Anotar atributos ayuda a que aparezca algo. |
| «Sin publicaciones que comparar.» (en «Arriba y el resto») | No compite ninguna publicación. | Ampliar el período, u otra métrica. |
| «Algo se rompió» y «No fue nada que hicieras: una consulta no respondió. Vuelve a intentarlo; el detalle quedó en la consola del navegador.» | Una consulta de la pantalla falló. | Apretar «Reintentar»; si sigue, «Ir a La Parrilla». |

## Si el humano dice…

- **«¿Cuáles fueron mis mejores posts?» / «quiero ver mi top 10 %»**: en Los Números, «Tu mejor
  10 % →» (a la derecha de «Lo que más creció»). Ahí se elige la métrica, el porcentaje y, con
  más de una cuenta, la cuenta.
- **«Mi video de YouTube no aparece en mi mejor 10 %»**: en views ganadas, interacciones y
  arrastre YouTube no compite, porque sus reglas no permiten calcular métricas con sus datos.
  Con «Por visitas a tu página» o «Por clicks en tus links» sí aparece.

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
- **«Antes apretaba un post y se abría Instagram»**: ahora el texto de la fila abre la pieza,
  dentro del panel. La red se abre con la flechita en diagonal al final de la línea de abajo
  («Ver en <red>»), o desde la pieza, con «Ver en <red>».
- **«Quiero ver qué hook funciona» / «¿qué tema me trae más gente?»**: «Comparar por atributo
  →», en el tablero, y elegir «Por hook» o «Por tema». Ver «Para ver qué hook funciona».
- **«No me aparece hook (o tema) en el selector»**: ninguna publicación del período lo tiene.
  Ampliar el período, o anotarlo en los posts (editor de La Parrilla, o por la API).
- **«Dice: Nada de lo publicado en este período lleva…»**: ese atributo no está en nada
  publicado dentro del período elegido (pasa al apretar una cápsula en una pieza vieja), y la
  pantalla muestra otro, «hook» o el más usado. Elegir un período que incluya esa publicación
  (por ejemplo «Todo»), o elegir otro atributo en el selector.
- **«Me salen dos filas para el mismo hook»**: están escritos distinto (una mayúscula, una
  tilde, un espacio en medio; los de los bordes no cuentan). Corregir el atributo en el editor
  de los posts que lo tienen mal.
- **«Comparar dice 3 publicaciones y programé un solo post»**: el post salió a tres cuentas, y
  cada una cuenta como una publicación.
- **«Quiero juntar dos versiones del mismo video» / «el trial reel y el reel normal salen por
  separado»**: darles a los dos posts programados el mismo atributo `pieza`. Ver «Para juntar
  dos versiones del mismo video».
- **«Les puse pieza y no salen juntas»**: el valor tiene que ser idéntico, con las mismas
  mayúsculas. Si una se subió a mano en la red, no tiene atributos y no se puede juntar.
- **«¿Etiqueta o atributo?»**: la etiqueta es el `?s=` del link, el que cuenta las visitas de
  cada publicación; se cambia en «Tus publicaciones». Los atributos (hook, tema, serie,
  `pieza`) se anotan en el editor del post, en La Parrilla.
- **«La pieza dice Sin números todavía»**: la versión ya salió, pero la red la entrega en la
  sincronización diaria. Si es un trial reel, puede no aparecer hasta que se comparta.
- **«Una versión de TikTok dice En tu bandeja de TikTok y no tiene números»**: se mandó como
  borrador a la bandeja; no existe en TikTok hasta que se publique desde la app.
- **«Una versión dice Fuera de La Parrilla»**: se subió a mano en la red; no tiene atributos ni
  versiones.

## Lo que esta pantalla no hace

- No acepta fechas exactas: solo los cinco períodos.
- No filtra por red: filtra por cuenta.
- No adivina versiones: dos posts programados se ven juntos solo si comparten el atributo
  `pieza`. Una publicación subida a mano en la red no se junta con nada.
- No edita los atributos aquí: «Editar atributos» lleva al editor del post, en
  [La Parrilla](la-parrilla.md).
- «Comparar por atributo» no cruza dos atributos a la vez (hook y tema juntos), ni muestra qué
  publicaciones forman cada fila.
- «Tu mejor 10 %» no acepta un porcentaje distinto de 5, 10, 20 o 25 (la API, cualquiera de 1 a
  50), no ordena por views acumuladas, y «Qué tienen en común» no dice qué causó el
  resultado: dice qué se repite.
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
- No tiene columna de guardados ni de alcance; salen por la API de métricas. Los atributos no
  van en «Tus publicaciones»: se ven en la pieza y en «Comparar por atributo».
- No ordena la lista por views ganadas (la columna «Views» ordena por el acumulado; las que más
  ganaron están en «Lo que más creció»).
- No exporta a planilla.
- Tiene topes, y no todos avisan cuando se pasan: «En las redes» suma como mucho 10.000
  publicaciones con actividad en el período; «Tus publicaciones» muestra como mucho 1000 (avisa);
  la pieza, 100 versiones; «Comparar por atributo» y «Tu mejor 10 %» leen 10.000 publicaciones
  (avisan); 50
  etiquetas, 25 links, 12 orígenes,
  países o ciudades, 8 dispositivos, sistemas, navegadores o idiomas, 40 últimas visitas.
- No se lee con las llaves de la API: la API de métricas es por publicación, más el mejor X %
  (`GET /api/metrics/mejores`), ver [la guía de la API](../api-editor.md). La app del teléfono tiene su propio resumen
  ([La app del teléfono](app-movil.md)).

## Para quien mantiene esta página

Sale de:

- `src/app/admin/(dash)/analytics/page.tsx` (el tablero: encabezado, las dos mitades, sus
  cifras, paneles, «⋯ Más» y textos)
- `src/app/admin/(dash)/analytics/accounts.tsx` (tarjetas de «Tus cuentas» y su gráfico)
- `src/app/admin/(dash)/analytics/publicaciones/page.tsx` («Tus publicaciones»: controles,
  avisos, estados vacíos, el link que se copia)
- `src/app/admin/(dash)/analytics/publicaciones/post-table.tsx` (la tabla, la etiqueta, copiar)
- `src/app/admin/(dash)/analytics/publicaciones/[id]/page.tsx` (la pieza: encabezado,
  atributos, versiones, frases del pie)
- `src/app/admin/(dash)/analytics/comparar/page.tsx` («Comparar por atributo»)
- `src/app/admin/(dash)/analytics/mejores/page.tsx` («Tu mejor 10 %») y `src/lib/mejores.ts`
  (quién compite, quién entra, el corte, las medianas, «Rinden» y «Qué tienen en común»)
- `src/lib/pieza.ts` (qué atributos son comunes y cuáles cambian, el orden de las versiones,
  el trial reel, las medianas, el atributo elegido al entrar, las filas tenues) y
  `src/lib/piezas.ts` (qué versiones junta una pieza, la clave `pieza`, el tope de 100)
- `src/lib/post-attributes.ts` (los atributos de cada publicación)
- `src/app/admin/(dash)/schedule/etiqueta.ts` (cómo va cada versión: «Programado», «Falló»…)
- `src/app/admin/(dash)/schedule/enlace.ts` (que el editor vuelva a la pieza)
- `src/lib/social/publish/atributos.ts` y `src/lib/social/publish/opciones.ts` (qué atributos
  valen; qué es un trial reel)
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
  lectura diaria), con `vercel.json` (la hora de la sincronización), y
  `src/lib/social/lectura.ts` (qué publicación se lee cada día, según su edad)
- `src/app/admin/(dash)/error.tsx`, `src/app/admin/(dash)/nav.tsx`, `src/lib/vocabulario.ts`
- `src/app/admin/(dash)/analytics/loading.tsx`, `src/app/admin/(dash)/analytics/cargando.tsx`,
  `src/app/admin/(dash)/analytics/cabeza.tsx` (la bajada, que comparten la pantalla y su carga),
  `src/components/esqueleto.tsx` y los esqueletos de `src/components/charts/panel.tsx` y
  `src/components/charts/stat-tile.tsx` (la carga)

Si cambias lo que se ve en alguno de ellos, actualiza esta página en el mismo commit.
