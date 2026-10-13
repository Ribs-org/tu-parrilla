# Los Cortes — cada publicación, lo que hizo en la red y lo que trajo

`/admin/content` — pestaña «Los Cortes» de la barra de arriba del panel (en el README y en documentos viejos se llama «Contenido»).

Aquí está cada publicación de las redes conectadas, una por fila, con dos clases de números
lado a lado: los que da la red (views, likes, comentarios, compartidos) y los que mide Tu
Parrilla en la página pública de la persona (visitas, clicks, CTR y arrastre). El cruce lo
hace la etiqueta `?s=` de cada publicación: si el link con esa etiqueta está pegado en el
post, las visitas que llegan por él se le cuentan a ese post. Es la pantalla para responder
«¿cuántas visitas me trajo este reel?» y «¿cuál de mis posts convierte?».

## Cómo se llega

- En la barra de arriba, la pestaña «Los Cortes» (la tercera: «El Fuego», «La Parrilla»,
  «Los Cortes», «La Mesa», «Los Números»). En un teléfono, si no se ve, la barra se desliza
  hacia el lado.
- Desde [Los Números](los-numeros.md), en el panel «Qué contenido te trae gente», el enlace
  «Ver por post →». Llega con los filtros de siempre, no con los que tenía Los Números.
- Apretar la pestaña estando ya en la pantalla la deja como al entrar: 30 días, todos los
  perfiles, sin bots, sin filtros de red, sin borrados.

## Qué se ve

Los títulos de los paneles, los rótulos de las cifras y las columnas se ven en mayúsculas en
pantalla; aquí van escritos como están en el código.

### Encabezado

El título «Los Cortes» y debajo, en chico, «cada publicación, lo que hizo en la red y lo que
trajo».

### Barra de filtros

Una fila de controles, la misma que en Los Números:

- Cinco botones de rango: «Hoy», «7 días», «30 días», «90 días», «Todo». El elegido queda
  resaltado; al entrar es «30 días».
- Un selector de perfil, **solo si la persona tiene más de una página pública**: «Todos los
  perfiles», y una opción por página con el patrón «<nombre> · /<dirección>».
- Un botón «Bots» con un ícono de robot (al pasar el mouse: «Los bots se excluyen salvo que
  actives esto»). Activo, queda resaltado.

Mientras carga el cambio, la fila se ve más tenue.

### Las cuatro cifras

Cuatro casillas, cada una con su rótulo, el número y una aclaración debajo:

| Rótulo | Aclaración debajo |
|---|---|
| «Views» | «Ganadas en el período, sin YouTube» |
| «Interacciones» | «Likes, comentarios y compartidos del período, sin YouTube» |
| «Visitas desde posts» | «Atribuidas por etiqueta» |
| «Arrastre» | «De quienes vieron, cuántos llegaron; sin YouTube» |

Suman las filas que la tabla de abajo está mostrando en ese momento: si se filtra por red o
se activan los borrados, las cifras cambian con la tabla.

### Los avisos

Debajo de las cifras, un recuadro con una o dos frases, **solo cuando corresponde**:

- Si hay publicaciones cuyo link nunca se pegó: «Ninguna etiqueta está pegada todavía. Copia
  el link de una fila y pégalo en ese post de la red.» (cuando no hay ninguna pegada), o
  «1 publicación aún no tiene su link pegado.», o «<N> publicaciones aún no tienen su link
  pegado.».
- Si hay publicaciones de las que la red no entregó ningún número en el período: «1
  publicación no tiene métricas de la red en este período (Instagram no las entrega para lo
  publicado antes de tu cuenta profesional).», o la misma frase con «<N> publicaciones no
  tienen…».

Los avisos cuentan las publicaciones de la lista que siguen vivas en la red, sin mirar los
botones de red ni «Solo con métricas», y nunca cuentan las borradas.

### Panel «Tus posts»

El panel principal. Debajo del título, esta explicación:

> Lo publicado dentro del rango elegido; «Incluir anteriores» suma lo más viejo que siga
> teniendo actividad. Ordena por cualquier columna. La columna Views muestra el acumulado,
> con lo ganado al lado — y un «—» cuando el post existía antes de la primera medición y su
> crecimiento no se puede saber. Arrastre es visitas sobre views ganadas. Visitas, clicks,
> CTR y arrastre los mide Tu Parrilla en tu página, no la red. En YouTube solo van los
> contadores que entrega la red, sin lo ganado ni arrastre: sus reglas no permiten calcular
> métricas nuevas con sus datos.

A la derecha del título, tres enlaces que se prenden y apagan (cada uno cambia de texto al
apretarlo):

- «Incluir anteriores» → pasa a decir «Solo del período».
- «Solo con métricas» → pasa a decir «Mostrar todas».
- «Ver borrados» → pasa a decir «Ocultar borrados».

**Botones de red**, solo si en la lista hay publicaciones de más de una red: «Todas» y uno
por red presente, en este orden: «Instagram», «TikTok», «YouTube», «Facebook». Cada uno se
suma o se quita del filtro; se pueden tener varios activos a la vez. El activo se ve más
claro.

**La tabla.** Arriba de las cuatro últimas columnas, el rótulo «Medido por Tu Parrilla».
Las columnas, de izquierda a derecha:

«Post» · «Views» · «Likes» · «Coment.» · «Compart.» · «Visitas» · «Clicks» · «CTR» · «Arrastre»

Todas menos «Post» son botones que ordenan. La columna por la que se está ordenando se ve
más marcada y lleva una flecha (hacia abajo: de mayor a menor; hacia arriba: de menor a
mayor). Al entrar, la tabla va ordenada por «Views» de mayor a menor.

Cada fila, en la columna «Post»:

- La miniatura del post (un cuadro gris si no hay).
- El texto del post en una línea, cortado si es largo. Si la red dio el enlace, el texto es
  un link que abre el post en la red en otra pestaña. Si no hay texto: «Sin descripción»
  (un post de Instagram publicado sin texto puede dejar la línea en blanco).
- Debajo, en chico: la red y la fecha de publicación corta (por ejemplo «Instagram · 3
  sept»), y « · nuevo» al final si la publicación salió dentro del rango.
- En esa misma línea, **solo en algunas filas**, el sello «Se pasó» (al pasar el mouse: «Más
  del doble de vistas ganadas que la mitad de tus posts del período»).
- Debajo, la etiqueta como un botoncito que dice «?s=<etiqueta>» (al pasar el mouse:
  «Editar la etiqueta»), y a su lado un ícono de copiar (al pasar el mouse: «Copiar el link
  con la etiqueta»).

Detrás del número de «Views» hay una barra horizontal: su largo compara el acumulado de esa
fila con el más grande de la lista, y su color dice cómo le fue en el período (ver «Cómo leer
cada número»). Al lado del acumulado puede ir, en chico y más tenue, «+<N>»: lo ganado en el
período.

Las filas de publicaciones borradas, y las de publicaciones de las que la red no entregó
ningún número, se ven semitransparentes.

La tabla muestra 20 filas. Si hay más, al pie hay un botón «Ver las <N> restantes» (o «Ver
la publicación restante» si falta una sola); expandida, el botón dice «Mostrar menos». Al
recargar la página vuelve a mostrar 20.

### Panel «Views ganadas por día»

Debajo de «Tus posts». Explicación: «Cuánto creció el alcance contra cuánta gente llegó
efectivamente a tu página. La serie siempre cubre el catálogo completo, sin importar los
filtros de la tabla. Las views no incluyen YouTube; las visitas, sí.»

Un gráfico de áreas con dos series, rotuladas arriba: «Views ganadas» y «Visitas». Al pasar
el mouse por un punto aparece la fecha completa y los dos valores. Con el rango «Todo» cada
punto es una semana («Semana del …» en el recuadro), aunque el título diga «por día».

### Panel «Top posts del período»

Explicación: «Los que más views ganaron, con su arrastre al lado. YouTube no entra: lo ganado
no se calcula con sus datos.»

Hasta diez filas, de más a menos views ganadas. Cada una: el texto del post (o su etiqueta si
no tiene texto), el arrastre en chico (o «—») y, a la derecha, las views ganadas. Si la red
dio el enlace del post, la fila lo abre en otra pestaña.

## Cómo leer cada número

**Reglas generales.** Un «—» significa que no hay dato: nunca es cero, y al ordenar queda
siempre al fondo, en las dos direcciones. Los números desde 10.000 se abrevian («12 mil»,
«1,5 M»). Los porcentajes llevan punto decimal («3.3%», «7.10%»).

**El rango decide dos cosas.** Qué publicaciones salen en la lista: las **publicadas** dentro
del rango, no las que tuvieron actividad en él (es la misma regla que la API de métricas).
Y la ventana en la que se miden las visitas y lo ganado. «Hoy» son las últimas 24 horas,
no desde la medianoche; «Todo» es desde 2020. Los días se cortan en la zona horaria de la
persona, la de [Tu Cuenta](tu-cuenta.md).

**De dónde salen los números de la red.** La red no se consulta en vivo. Una
sincronización lee todas las cuentas una vez al día (a las 9:00 UTC, las 5 o 6 de la mañana
en Chile según la época) y guarda una lectura por publicación y por día; también corre al
apretar «Sincronizar ahora» en [Los Fierros](los-fierros.md). Por eso una publicación nueva
no aparece en esta pantalla hasta la siguiente sincronización, y los números pueden ir hasta
un día atrás de lo que muestra la app de la red.

**«Views» (columna).** El contador acumulado de por vida, según la última lectura dentro del
rango. El «+<N>» al lado es cuánto creció ese contador dentro del rango: la última lectura
menos la última de antes de que empezara el rango. Ese «+<N>» no aparece cuando:

- la publicación salió dentro del rango (lleva « · nuevo»): todo su contador es lo ganado, y
  repetirlo no agrega nada. En la vista normal casi todas las filas son así, porque la lista
  ya es de lo publicado en el rango; el «+<N>» se ve sobre todo con «Incluir anteriores»;
- no hay lectura de antes del rango (la publicación existía, pero nadie la había medido
  todavía): el crecimiento no se puede saber. La explicación del panel dice que ahí aparece
  un «—»; en la tabla lo que pasa es que el «+<N>» no está;
- no creció, o es de YouTube.

El «—» en «Views» aparece solo cuando la red no dio ninguna lectura en el período. Ordenar
por «Views» ordena por el acumulado, no por lo ganado; para lo ganado está «Top posts del
período».

**La barra detrás de «Views» y el sello «Se pasó».** Se comparan las views ganadas de cada
fila con la mediana de las views ganadas de las publicaciones de la lista (la mitad ganó
menos, la mitad más). Barra naranja fuerte y sello «Se pasó»: ganó al menos el doble de la
mediana. Naranja suave: ganó al menos la mediana. Gris: ganó menos. Sin barra: no hay
ganancia conocida (YouTube, crecimiento que no se puede saber), o la mediana es cero y no hay
con qué comparar.

**«Likes», «Coment.», «Compart.».** Los contadores acumulados que da la red, al cierre del
rango. «—» cuando la red no entrega ese dato: YouTube nunca da compartidos.

**«Visitas».** Cuántas veces se abrió la página pública de la persona con la etiqueta de esta
fila, dentro del rango. Respetan el selector de perfil y el botón «Bots». «—» quiere decir
que esa etiqueta nunca trajo una sola visita: el link no se pegó. «0» quiere decir que el
link sí se pegó (alguna vez trajo una visita) pero en este rango no llegó nadie.

**«Clicks».** Los clicks en los links de la página que hicieron esas visitas. «—» en el mismo
caso que «Visitas».

**«CTR».** Clicks sobre visitas, en porcentaje con un decimal. «—» si no hubo visitas. Puede
pasar de 100% si cada visita hizo varios clicks.

**«Arrastre».** Visitas sobre views ganadas en el período, en porcentaje con dos decimales:
de la gente que vio el post en el período, qué parte llegó a la página. Se calcula sobre lo
ganado y no sobre el acumulado para no castigar a lo nuevo ni premiar lo viejo. «—» cuando
el post no ganó views (o no se sabe cuántas), cuando el link nunca se pegó, y siempre en
YouTube.

**Las cuatro cifras de arriba**, sobre las filas que se ven:

- «Views»: la suma de las views **ganadas** (no del acumulado), sin YouTube.
- «Interacciones»: likes, comentarios y compartidos **ganados** en el período, sumados, sin
  YouTube.
- «Visitas desde posts»: la suma de la columna «Visitas», YouTube incluido (las visitas las
  mide Tu Parrilla).
- «Arrastre»: las visitas de las filas que no son de YouTube, divididas por la cifra
  «Views». No es el promedio de la columna. «—» si no hubo views ganadas.

Las tres primeras casillas muestran «0», no «—», cuando ninguna fila tiene datos (por
ejemplo, si todo lo del rango es de YouTube): ahí el cero quiere decir «no hay con qué
sumar», no «no se ganó nada».

**«Views ganadas por día».** Cuánto crecieron las views de todo el catálogo cada día, de una
lectura a la siguiente, contra las visitas que llegaron ese día con la etiqueta de cualquier
publicación. Las views no incluyen YouTube ni lo borrado; el primer día medido de cada
publicación no suma (no hay lectura anterior con qué restar). No hace caso a la lista: ni a
qué se publicó en el rango, ni a los botones de red, ni a los enlaces del panel de arriba.
El selector de perfil y «Bots» solo cambian las visitas. Por todo eso no tiene por qué
sumar lo mismo que la cifra «Views».

**«Top posts del período».** Las diez filas de la lista que más views ganaron, sin YouTube y
sin borradas, aunque «Ver borrados» esté activo. Sí respeta los botones de red.

**Cuándo viene vacío y por qué**, en resumen:

| Caso | Qué se ve |
|---|---|
| YouTube | Views acumuladas, likes y comentarios tal como los da YouTube; sin «+<N>», sin barra, sin «Se pasó», «Compart.» y «Arrastre» en «—». Visitas, clicks y CTR sí. Fuera de las cifras de views, interacciones y arrastre, del gráfico (las views) y del top. Sus reglas no permiten calcular métricas nuevas con sus datos. |
| YouTube, video que lleva 30 días sin llegar en la sincronización | «Sin descripción», sin miniatura, y sus lecturas viejas borradas: las reglas de YouTube no dejan guardar sus datos más de 30 días sin refrescarlos. La fila queda, con sus visitas. |
| Instagram, lo publicado antes de que la cuenta fuera profesional | Fila semitransparente, «—» en «Views», «Likes», «Coment.» y «Compart.»; entra en el aviso de «no tiene métricas». Instagram no entrega esos números. |
| Publicado hoy | No aparece hasta la próxima sincronización. Ya sincronizado, sale como «nuevo» con lo que llevaba en esa lectura; el gráfico lo empieza a contar desde su segunda lectura, de otro día. |
| Link nunca pegado | «—» en «Visitas», «Clicks», «CTR», «Arrastre»; entra en el aviso del link. |
| Borrado en la red | Oculto; con «Ver borrados», semitransparente. |

## Qué se puede hacer

### Para ver cuántas visitas trajo una publicación

1. Elegir el rango arriba («7 días», «30 días»…). Si el post es anterior al rango, apretar
   «Incluir anteriores» o elegir un rango más largo.
2. Buscar la fila por su texto y miniatura (o ordenar por «Visitas» apretando su columna).
3. Leer «Visitas» y «Clicks». Si dice «—», el link con la etiqueta nunca se pegó en ese post.

### Para copiar el link de una publicación y pegarlo en la red

1. En la fila del post, apretar el ícono de copiar que está junto a «?s=<etiqueta>». Si
   funcionó, el ícono pasa a ser un visto por un momento.
2. **Revisar lo copiado antes de pegarlo.** El botón copia la dirección donde está abierto
   el panel más `/?s=<etiqueta>`, o sea `https://tu-parrilla.cl/?s=<etiqueta>`. En
   tu-parrilla.cl esa dirección abre la portada de Tu Parrilla, no la página de la persona,
   y esas visitas no se cuentan.
3. Armar el link bueno: la dirección de la página de la persona más `?s=<etiqueta>`. La
   dirección está en [La Vitrina](la-vitrina.md): «Editar» en el perfil y, en el panel
   «Compartir», el botón «Copiar». Queda como `https://tu-parrilla.cl/<su-página>?s=<etiqueta>`
   (o su dominio propio si tiene uno).
4. Pegar ese link en ese post, en la red, donde la red deje poner un link. Esta pantalla no
   lo pega sola.
5. Desde la primera visita que llegue por ese link, la fila deja de decir «—» en «Visitas».

### Para cambiar la etiqueta

Conviene hacerlo **antes** de pegar el link: las visitas se cuentan por etiqueta, así que las
que ya llegaron con la etiqueta vieja se quedan con ella, dejan de contarse para este post
(aparecen sueltas en Los Números, en «Qué contenido te trae gente»), y un link ya pegado con
la etiqueta vieja sigue anotando visitas a la vieja. Volver a poner la etiqueta anterior las
recupera.

1. Apretar el botoncito «?s=<etiqueta>» de la fila. Se vuelve un campo de texto.
2. Escribir la etiqueta nueva. Se guardan letras sin tilde, números, guiones y guiones bajos;
   cualquier otra cosa (espacios, tildes, la «ñ», signos) se cambia por un guion, y se corta
   en 48 caracteres. «Reel Gimnasio!» queda «Reel-Gimnasio».
3. Apretar Enter, o hacer clic fuera del campo, para guardar. Escape cancela.
4. La fila muestra la etiqueta tal como quedó guardada. La sincronización no la vuelve a
   cambiar.

Si sale un error en rojo al lado, la etiqueta vuelve a la anterior (ver «Mensajes que puede
ver»).

### Para ordenar la tabla

1. Apretar el nombre de una columna: ordena por ella de mayor a menor.
2. Apretarlo otra vez invierte el orden. Los «—» quedan siempre al fondo.

El orden se pierde al recargar. «Post» no ordena.

### Para ver solo una red, o varias

1. Apretar el botón de la red sobre la tabla («Instagram», «TikTok»…). Se puede sumar otra.
2. Apretar uno activo lo quita. «Todas» quita el filtro.

Las cuatro cifras y el top siguen al filtro; el gráfico no.

### Para ver lo publicado antes del rango

Apretar «Incluir anteriores». La lista deja de filtrar por fecha de publicación y trae las
200 publicaciones más recientes, con sus números medidos dentro del rango. «Solo del período»
vuelve atrás.

### Para esconder las filas sin números de la red

Apretar «Solo con métricas». Saca las filas con «—» en «Views», «Likes», «Coment.» y
«Compart.» a la vez. «Mostrar todas» las devuelve.

### Para ver las publicaciones borradas

Apretar «Ver borrados». Aparecen, semitransparentes, las publicaciones que la red dejó de
devolver al sincronizar (normalmente porque se borraron allá). Entran en las cuatro cifras
mientras se ven; no entran en los avisos ni en el top. «Ocultar borrados» las vuelve a
esconder. Si la publicación vuelve a aparecer en la red, deja de estar borrada sola.

### Para ver más de 20 filas

Apretar «Ver las <N> restantes» al pie de la tabla. «Mostrar menos» vuelve a 20.

### Para medir solo una página, o incluir bots

Elegir la página en el selector de perfil (solo existe con más de una página pública), o
apretar «Bots». Cambian las visitas, clicks, CTR y arrastre; la lista de publicaciones y
los números de la red no.

Los mismos datos por publicación, con el alcance y los atributos de cada post, salen también
por API: ver `GET /api/metrics/posts` en [la guía de la API](../api-editor.md).

## Mensajes que puede ver

| Lo que dice la pantalla | Qué significa | Qué hacer |
|---|---|---|
| «Ninguna etiqueta está pegada todavía. Copia el link de una fila y pégalo en ese post de la red.» | Ninguna publicación de la lista ha traído nunca una visita por su link. | Pegar los links (ver «Para copiar el link…», con su paso 2). |
| «1 publicación aún no tiene su link pegado.» / «<N> publicaciones aún no tienen su link pegado.» | Esas publicaciones nunca trajeron una visita con su etiqueta. | Buscar las filas con «—» en «Visitas» y pegar su link. |
| «1 publicación no tiene métricas de la red en este período (Instagram no las entrega para lo publicado antes de tu cuenta profesional).» / «<N> publicaciones no tienen métricas…» | La red no dio ningún número de esas publicaciones en el rango. La causa de la frase es la más común; también pasa con lo recién publicado o con videos de YouTube que ya no llegan. | Nada que arreglar si son posts viejos de Instagram. «Solo con métricas» las esconde. |
| «No publicaste nada en este período. Amplía el rango, o activa «Incluir anteriores» para ver lo que sigue teniendo actividad.» | No hay publicaciones sincronizadas en el rango. Es también lo que ve quien todavía no conectó ninguna red. | Elegir un rango más largo o «Incluir anteriores». Si no hay redes conectadas: conectarlas en [Los Fierros](los-fierros.md) y apretar «Sincronizar ahora». |
| «El filtro dejó la lista vacía: nada de <red> en este período.» (con varias redes: «nada de Instagram ni TikTok…») | Los botones de red dejaron fuera todo lo del rango. | Apretar «Todas». Si no se ve, apretar la pestaña «Los Cortes» en la barra. |
| «El filtro dejó la lista vacía: ninguna publicación tiene métricas de la red en este período.» | «Solo con métricas» está activo y ninguna fila tiene números de la red. | Apretar «Mostrar todas». |
| «Sin tráfico en este período.» | El gráfico «Views ganadas por día» no tiene ni views ganadas ni visitas en el rango. | Ampliar el rango, o esperar la sincronización. |
| «Sin views nuevas en este período. El crecimiento necesita dos días de datos.» | Ninguna publicación de la lista tiene views ganadas conocidas: no crecieron, no hay lectura de antes del rango, o son todas de YouTube. | Esperar la próxima sincronización, o ampliar el rango. |
| «Se pasó» | Esa publicación ganó al menos el doble de views que la mediana de la lista. | Nada: es un elogio. |
| «No se pudo copiar el link.» | El navegador no dejó escribir en el portapapeles. | Copiar a mano la etiqueta del botoncito «?s=…» y armar el link (ver «Para copiar el link…»). |
| «La etiqueta no puede quedar vacía.» | Lo escrito quedó vacío después de limpiar los caracteres no permitidos (por ejemplo, solo emojis). | Escribir letras o números. |
| «Otra pieza de contenido ya usa esa etiqueta.» | Dos publicaciones no pueden compartir etiqueta. | Elegir otra. |
| «No se pudo guardar. Intenta de nuevo.» | Falló el guardado. | Volver a intentar. |
| «Algo se rompió» y «No fue nada que hicieras: una consulta no respondió. Vuelve a intentarlo; el detalle quedó en la consola del navegador.» | Una consulta de la pantalla falló. | Apretar «Reintentar»; si sigue, «Ir a El Fuego». |

Mientras la pantalla carga se ven rectángulos grises sin texto: es la carga, no un error.

## Si el humano dice…

- **«No veo el post que publiqué hoy»**: las publicaciones entran a esta pantalla con la
  sincronización, no al publicar. Apretar «Sincronizar ahora» en [Los Fierros](los-fierros.md)
  o esperar la del día siguiente. Si es de Threads o X, no va a aparecer nunca: esas redes no
  se sincronizan.
- **«No veo un post viejo»**: la lista es de lo publicado en el rango. Elegir un rango más
  largo o apretar «Incluir anteriores». Revisar también los botones de red, «Solo con
  métricas» y si fue borrado («Ver borrados»).
- **«¿Dónde veo cuántas visitas me trajo este reel?»**: en su fila, columna «Visitas» (y
  «Clicks» al lado). También en Los Números, «Qué contenido te trae gente».
- **«En Visitas dice —»**: el link con su etiqueta nunca trajo una visita; casi siempre
  porque no se pegó, o se pegó el link copiado tal cual, que lleva a la portada de Tu
  Parrilla (ver «Para copiar el link…», paso 2).
- **«El link que copié me lleva a la página de Tu Parrilla, no a la mía»**: es así hoy; armar
  el link con la dirección de su página, como dice el paso 3 de «Para copiar el link…».
- **«¿Por qué YouTube no tiene arrastre / lo ganado?»**: las reglas de YouTube no permiten
  calcular métricas nuevas con sus datos; se muestran sus contadores tal cual, y al lado lo
  que mide Tu Parrilla (visitas, clicks, CTR), bajo «Medido por Tu Parrilla».
- **«Mis posts viejos de Instagram salen en gris y con —»**: Instagram no entrega números de
  lo publicado antes de que la cuenta fuera profesional. No tiene arreglo.
- **«Las views no cuadran con las de Instagram»**: la columna es la última lectura diaria,
  hasta un día atrás. La cifra de arriba, además, es lo ganado en el rango y no el total.
- **«La cifra Views de arriba no coincide con la columna»**: la de arriba suma lo ganado en
  el período, sin YouTube; la columna es el acumulado de por vida.
- **«El gráfico no cuadra con la tabla»**: el gráfico mira todo el catálogo y no hace caso a
  los filtros de la lista (ver «Cómo leer cada número»).
- **«Cambié la etiqueta y perdí las visitas»**: siguen guardadas con la etiqueta vieja.
  Poner de nuevo la etiqueta anterior las devuelve a la fila.
- **«¿Qué es arrastre?»**: de cada cien personas que vieron el post en el período, cuántas
  llegaron a su página.
- **«¿Qué significa “nuevo”?»**: que el post salió dentro del rango, así que todo su contador
  cuenta como ganado.
- **«Solo veo 20 posts»**: al pie, «Ver las <N> restantes».
- **«No veo los botones de Instagram, TikTok…»**: solo aparecen si la lista tiene
  publicaciones de más de una red.
- **«¿Dónde veo mis seguidores?»**: en [Los Números](los-numeros.md), panel «Tus cuentas».

## Lo que esta pantalla no hace

- No muestra publicaciones de Threads ni de X: esas redes publican, pero no se sincronizan.
- No muestra lo programado que todavía no sale: eso está en [La Parrilla](la-parrilla.md).
- No consulta la red en vivo ni tiene botón para sincronizar: eso está en Los Fierros.
- No acepta fechas exactas: solo los cinco rangos.
- No muestra más de 200 publicaciones en una vista (las más recientes), y no avisa si hay más.
- No tiene columna de guardados, de alcance ni de los atributos del post; el alcance y los
  atributos salen por la API de métricas.
- No ordena por views ganadas (la columna «Views» ordena por el acumulado).
- No pega el link en la red, ni edita ni borra la publicación allá: lo único que se edita
  aquí es la etiqueta.
- No exporta a planilla.
- No muestra seguidores ni datos de la cuenta: eso está en Los Números.

## Para quien mantiene esta página

Sale de:

- `src/app/admin/(dash)/content/page.tsx` (cifras, avisos, enlaces, botones de red, paneles)
- `src/app/admin/(dash)/content/post-table.tsx` (tabla, etiqueta, copiar)
- `src/components/filter-bar.tsx` y `src/lib/filters.ts` (rangos, perfil, bots)
- `src/components/charts/stat-tile.tsx`, `src/components/charts/panel.tsx`,
  `src/components/charts/bar-list.tsx`, `src/components/charts/traffic-chart.tsx`,
  `src/components/charts/use-sorted-rows.ts`
- `src/lib/posts.ts` y `src/lib/posts-kpis.ts` (qué publicaciones, cada número y las sumas)
- `src/lib/social/delta.ts` (lo ganado y «nuevo»)
- `src/lib/parrilla.ts` (la mediana y «Se pasó») y `src/app/globals.css` (colores de la barra)
- `src/lib/social/politica-youtube.ts` y `src/lib/social/retencion-youtube.ts` (YouTube)
- `src/lib/social/campaign.ts` y `src/app/admin/actions.ts` (etiquetas y sus errores)
- `src/lib/social/sync.ts` y `src/lib/social/index.ts` (qué redes se sincronizan, borrados,
  lectura diaria), con `vercel.json` (la hora de la sincronización)
- `src/app/page.tsx` y `src/lib/dominios.ts` (por qué el link copiado lleva a la portada)
- `src/lib/networks.ts`, `src/lib/utils.ts` (nombres de red, formato de números)
- `src/app/admin/(dash)/error.tsx`, `src/app/admin/(dash)/loading.tsx`,
  `src/app/admin/(dash)/nav.tsx`, `src/lib/vocabulario.ts`

Si cambias lo que se ve en alguno de ellos, actualiza esta página en el mismo commit.
