# Los Números — visitas, clics y de dónde vienen

`/admin/analytics` — pestaña «Los Números» de la barra de arriba del panel (en el README y en documentos viejos se llama «Analítica»).

Aquí está lo que pasa en las páginas públicas de la persona (la de los links, la que va en la
bio): cuántas veces se abrieron, cuántos clicks hubo en sus links, desde qué red y con qué
etiqueta `?s=` llegó la gente, desde dónde, con qué equipo y a qué hora. Lo mide Tu Parrilla
sin cookies. También trae, arriba, los seguidores de las cuentas conectadas. Lo que hizo
cada publicación en la red (views, likes) no está aquí: está en [Los Cortes](los-cortes.md).

## Cómo se llega

- En la barra de arriba, la pestaña «Los Números» (la cuarta y última: «La Parrilla», «Los
  Cortes», «La Mesa», «Los Números»). En un teléfono, si no se ve, la barra se desliza hacia
  el lado.
- Apretar la pestaña estando ya en la pantalla la deja como al entrar: 30 días, todos los
  perfiles, sin bots.

## Qué se ve

Los títulos de los paneles, los rótulos de las cifras y las columnas se ven en mayúsculas en
pantalla; aquí van escritos como están en el código. De arriba abajo:

### Encabezado

El título «Los Números», debajo en chico «visitas, clics y de dónde vienen», y una línea más:
«Todo lo que pasa en tus perfiles, sin cookies ni terceros.»

### Barra de filtros

La misma que en Los Cortes:

- Cinco botones de rango: «Hoy», «7 días», «30 días», «90 días», «Todo». El elegido queda
  resaltado; al entrar es «30 días».
- Un selector de perfil, **solo si la persona tiene más de una página pública**: «Todos los
  perfiles», y una opción por página con el patrón «<nombre> · /<dirección>».
- Un botón «Bots» con un ícono de robot (al pasar el mouse: «Los bots se excluyen salvo que
  actives esto»). Activo, queda resaltado.

### Las cuatro cifras

«Visitas», «Únicos», «Clicks» y «CTR». Debajo de cada número, la comparación con el período
anterior: una flecha, un porcentaje («+12%», «-8%», o «0%» con flecha hacia el lado si casi
no cambió) y el texto «vs. período anterior». La subida va en verde y la bajada en rojo. Si
no hay con qué comparar, en vez de eso hay un «—».

### Panel «Tráfico en el tiempo»

Explicación: «Visitas y clicks, comparables en la misma escala». Un gráfico de áreas con dos
series, rotuladas arriba: «Visitas» y «Clicks». Con «Hoy», cada punto es una hora (en el eje,
«14:00»); con «7 días», «30 días» y «90 días», un día («3 sep»); con «Todo», una semana. Al
pasar el mouse aparece la fecha completa («3 de septiembre de 2026», o «Semana del …», o «3 de
septiembre, 14:00») y los dos valores.

Los paneles que siguen pueden tardar un poco más: mientras cargan se ven como rectángulos
grises sin texto.

### Panel «Tus cuentas»

Explicación: «Seguidores por red, con lo ganado en el período; en YouTube, solo el total,
porque sus reglas no permiten calcular lo ganado. Visitas al perfil y alcance son del último
día leído — Instagram es la única que los entrega hoy.»

Una tarjeta por red con lecturas (hoy pueden ser Instagram, Facebook y YouTube; TikTok,
Threads y X no tienen). Cada tarjeta:

- El nombre de la red.
- Un número grande: los seguidores (en YouTube, los suscriptores), o «—».
- Debajo, en YouTube: «suscriptores, según YouTube». En las demás: «seguidores · » y una de
  tres: «+<N> en el período», «sin cambio» o «— en el período».
- Al pie: «Visitas al perfil (<día>): <N>» y «Alcance (<día>): <N>», donde el día es el de la
  última lectura del rango, como «3 sep». Sin lecturas en el rango: «Visitas al perfil: —» y
  «Alcance: —».

Debajo de las tarjetas, **solo si alguna red que no es YouTube tiene lecturas en el rango**,
un gráfico con dos series: «Visitas al perfil» y «Alcance», un punto por día leído.

### Panel «Qué contenido te trae gente»

Explicación: «Cada etiqueta ?s= es una pieza de contenido. Ordena por CTR para ver cuál
convierte.» A la derecha del título, el enlace «Ver por post →», que lleva a Los Cortes.

Una tabla con las columnas «Etiqueta», «Visitas», «Únicos», «Clicks», «CTR». Cada columna es
un botón que ordena (la primera vez de mayor a menor; otra vez, al revés); la activa lleva
una flecha. Al entrar va ordenada por «Visitas», de mayor a menor. En cada fila, detrás de la
etiqueta, una barra cuyo largo compara sus visitas con las de la fila con más.

En la columna «Etiqueta»: si la etiqueta es de una publicación sincronizada, se ve su
miniatura chica y el texto del post (o la etiqueta, si el post no tiene texto); si no, la
etiqueta sola, en letra de máquina de escribir. Las visitas que llegaron sin etiqueta van
juntas en la fila «(sin etiqueta)». Hasta 50 filas, las de más visitas.

### Paneles «Links más clickeados» y «De dónde vienen»

Lado a lado en pantalla ancha, uno encima del otro en el teléfono.

«Links más clickeados», explicación «CTR calculado sobre las visitas del período»: hasta 25
filas, de más a menos clicks. Cada una: el nombre del link tal como está en la página (o
«(link eliminado)» si ya no existe), su CTR en chico y sus clicks a la derecha. Si el link
sigue existiendo, la fila lo abre en otra pestaña.

«De dónde vienen», explicación «Red de origen inferida del referrer y de utm_source»: un
gráfico de anillo con el total de visitas al centro (bajo el número, «visitas»), y al lado la
lista de orígenes, cada uno con su punto de color, su porcentaje y sus visitas. Hasta siete
orígenes; el resto se junta en «Otro».

### Paneles «Países» y «Ciudades»

Listas con barras, de más a menos visitas, hasta 12 filas cada una. Los países llevan su
bandera y su nombre en español; lo que no se pudo ubicar sale como «Desconocido» (con un
globo en vez de bandera).

### Paneles «Dispositivo», «Sistema» y «Navegador»

Tres listas con barras, hasta 8 filas cada una. «Dispositivo» usa estos nombres: «Celular»,
«Computador», «Tablet», «Wearable», «Consola», «Smart TV», «Desconocido». «Sistema» y
«Navegador», el nombre con que se identifica el equipo.

### Panel «Cuándo te visitan»

Explicación: «Hora local de <zona>», con la zona horaria de la persona (por ejemplo
«America/Santiago»). Una grilla de siete filas («Lun», «Mar», «Mié», «Jue», «Vie», «Sáb»,
«Dom») por 24 columnas, una por hora, rotuladas cada tres horas («00», «03», … «21»). Cuanto
más intenso el color de la casilla, más visitas en esa hora de ese día de la semana. Al pasar
el mouse: «<día> <hora>:00 · <N> visitas» («visita» si es una). Abajo, la escala: «0», los
colores, y el número de la casilla con más visitas.

### Paneles «Embudo» e «Idioma del navegador»

«Embudo», explicación «De llegar a la página a hacer click»: tres barras, «Llegaron a la
página», «Hicieron al menos un click» (con su porcentaje al lado) y «Clicks totales».

«Idioma del navegador»: lista con barras, hasta 8 filas, con el código de idioma tal como lo
manda el navegador (por ejemplo «es-CL»).

### Panel «Últimas visitas»

Explicación: «Las 40 más recientes del período». Una línea por visita: la bandera; la ciudad
(o el país si no hay ciudad) y «, <país>» si hay ciudad; el dispositivo, el sistema y el
navegador separados por «·»; una cápsula con el origen («Instagram», «Directo», …); una cápsula
«?s=<etiqueta>» si llegó con etiqueta; una cápsula «bot» si es un bot (solo pueden aparecer
con «Bots» activo), y a la derecha hace cuánto: «recién», «hace <N> minutos», «hace <N>
horas», «ayer», «hace <N> días».

## Cómo leer cada número

**Qué es una visita.** Cada vez que una página pública de la persona se abre en un navegador
y la página alcanza a ejecutarse. Recargar cuenta otra vez. Los programas que solo descargan
la página sin ejecutarla no cuentan nunca, ni con «Bots» activo. Todo lo de esta pantalla,
salvo «Tus cuentas», respeta el rango, el selector de perfil y el botón «Bots».

**El rango.** «Hoy» son las últimas 24 horas, no desde la medianoche; «Todo» es desde 2020.
Los días y las horas se cortan en la zona horaria de la persona, la de [Tu Cuenta](tu-cuenta.md).

**Bots.** Por defecto quedan fuera las visitas y los clicks de equipos que se identifican
como robot, rastreador o generador de vistas previas de links, o que no se identifican.
«Bots» los suma.

**Los números.** Desde 10.000 se abrevian («12 mil», «1,5 M»). Los porcentajes llevan punto
decimal («3.3%»).

**«Visitas».** El total de visitas del período.

**«Únicos».** Cuántos visitantes distintos, sin cookies: se reconoce a alguien por su conexión
y su navegador, y esa identidad cambia cada día (a medianoche UTC, no a la de la persona).
Una misma persona que vuelve tres días distintos cuenta tres veces en «30 días»; dos personas
con la misma conexión y el mismo navegador pueden contar como una.

**«Clicks».** Clicks en los links de la página.

**«CTR».** Clicks sobre visitas, en porcentaje con un decimal. Puede pasar de 100% si la gente
hace varios clicks por visita. Sin visitas, «0.0%».

**La comparación bajo cada cifra.** Cuánto cambió la cifra, en porcentaje, contra el período
de igual largo justo antes (con «7 días», los siete días anteriores). En «CTR» es el cambio
del CTR mismo, no en puntos: pasar de 2.0% a 3.0% se ve como «+50%». El «—» aparece cuando el
período anterior tuvo cero y este no, porque no hay porcentaje de crecimiento desde cero; con
«Todo» pasa casi siempre, porque antes de 2020 no hay nada.

**«Tráfico en el tiempo».** Visitas y clicks por hora, día o semana. Las horas o días sin
movimiento son ceros de verdad.

**«Tus cuentas».** Sale de la sincronización diaria con las redes (o de «Sincronizar ahora»
en [Los Fierros](los-fierros.md)), no de las visitas, así que no le hacen caso ni el selector
de perfil ni «Bots»; solo el rango.

- El número grande: los seguidores según la última lectura del rango.
- «+<N> en el período»: los seguidores de la última lectura del rango menos los de la última
  lectura de antes de que empezara. «sin cambio»: no subieron; **una baja también se ve como
  «sin cambio»**, la pantalla no muestra seguidores perdidos. «— en el período»: no hay
  lectura de antes del rango para comparar (la cuenta se conectó después de que empezara el
  rango, o el rango es «Todo»).
- YouTube: el total de suscriptores tal como lo da YouTube, sin lo ganado, porque sus reglas
  no permiten calcular métricas nuevas con sus datos. Tampoco entra en el gráfico de abajo.
- «Visitas al perfil» y «Alcance»: cifras de un solo día, el de la lectura que dice el
  paréntesis, no del período. Solo Instagram las entrega; en Facebook y YouTube salen «—».
- El gráfico de abajo: visitas al perfil y alcance de cada día leído, sumando las redes que
  los entregan (sin YouTube).
- Con dos cuentas de la misma red hay una sola tarjeta para esa red: la pantalla no las
  separa, y en ese caso los números de la tarjeta no son de fiar.

**«Qué contenido te trae gente».** Una fila por etiqueta. La etiqueta de una visita sale del
`?s=` del link por el que llegó; si no trae `?s=`, de `src`, `ref`, `utm_content` o
`utm_campaign`, en ese orden. Las que empiezan con `dm-` las pone la respuesta automática por
palabra clave en el link que manda (ver [La Parrilla](la-parrilla.md)). «Visitas» y
«Clicks», como arriba pero solo de esa etiqueta; «Únicos», con la misma regla diaria; «CTR»,
clicks sobre visitas de esa etiqueta. «(sin etiqueta)» junta las visitas que no traían
ninguna. Ordenar por «Etiqueta» ordena por el texto de la etiqueta, no por el del post.

**«Links más clickeados».** Los clicks de cada link de la página. El CTR de al lado es esos
clicks sobre **todas** las visitas del período, no solo las de quienes vieron ese link.

**«De dónde vienen».** El sitio desde donde llegó cada visita. Si el link traía `utm_source`,
manda eso (`ig`, `tt` y `yt` se leen como Instagram, TikTok y YouTube; un valor que no
reconoce aparece tal cual, en minúsculas). Si no, se deduce del sitio anterior. «Directo»:
no se supo de dónde venía. «Otro»: un sitio que no está en la lista, o la suma de los
orígenes más allá del séptimo. Instagram y TikTok abren los links en su propio navegador, que
suele esconder de dónde viene la gente, así que mucho de ese tráfico cae en «Directo»; para
saber qué publicación lo trajo sirve la etiqueta, no este panel.

**«Países» y «Ciudades».** Según la ubicación aproximada de la conexión.

**«Cuándo te visitan».** La suma de las visitas del rango en cada hora de cada día de la
semana: con «30 días», la casilla del lunes a las 14 junta los cuatro o cinco lunes.

**«Embudo».** «Llegaron a la página»: las visitas. «Hicieron al menos un click»: cuántas de
esas visitas hicieron uno o más clicks, y al lado qué porcentaje de las visitas son.
«Clicks totales»: todos los clicks, por eso puede ser más que la primera barra.

**«Últimas visitas».** Las 40 más recientes del rango, una por línea. Cada línea es una carga
de página, no una persona.

## Qué se puede hacer

### Para saber cuántas visitas trajo una publicación

1. Elegir el rango arriba.
2. En «Qué contenido te trae gente», buscar la fila con el texto del post (o con su etiqueta).
3. Leer «Visitas» y «Clicks». Para verlo junto a las views de la red, apretar «Ver por post →»
   y buscarlo en [Los Cortes](los-cortes.md).

### Para ver qué publicación convierte mejor

1. En «Qué contenido te trae gente», apretar la columna «CTR»: ordena de mayor a menor.
2. Desconfiar de las filas con pocas visitas: un CTR alto con tres visitas no dice mucho.

### Para cambiar el rango, mirar una sola página o incluir bots

1. Apretar «Hoy», «7 días», «30 días», «90 días» o «Todo».
2. Con más de una página pública, elegirla en el selector de perfil («Todos los perfiles»
   vuelve a juntarlas).
3. Apretar «Bots» para sumarlos; otra vez para sacarlos.

### Para ver a qué hora conviene publicar

Mirar «Cuándo te visitan» con «30 días» o «90 días»: las casillas más intensas son los días y
horas en que más gente abre la página. Si las horas no calzan con las de la persona, revisar
su zona en [Tu Cuenta](tu-cuenta.md).

### Para que una publicación aparezca con su propia fila

Pegar en ella un link a la página con `?s=<etiqueta>` al final. Las publicaciones
sincronizadas ya traen su etiqueta: el link se arma en [Los Cortes](los-cortes.md) (ver ahí
«Para copiar el link de una publicación», que tiene una advertencia sobre el botón de
copiar). Para un link hecho a mano, la dirección de la página está en [La Vitrina](la-vitrina.md).

## Mensajes que puede ver

| Lo que dice la pantalla | Qué significa | Qué hacer |
|---|---|---|
| «Sin tráfico en este período.» (en «Tráfico en el tiempo») | Ni visitas ni clicks en el rango. | Ampliar el rango, revisar el selector de perfil. |
| «Sin tráfico en este período.» (dentro de «Tus cuentas», bajo las tarjetas) | Hay lecturas de cuenta en el rango, pero sin visitas al perfil ni alcance (por ejemplo, solo Facebook conectado). No habla de visitas a la página. | Nada: solo Instagram entrega esas dos cifras. |
| «Todavía no hay lecturas de cuenta. La primera llega con la sincronización de esta noche.» | Nunca se ha leído una cuenta de Instagram, Facebook ni YouTube. La sincronización diaria corre a las 9:00 UTC (las 5 o 6 de la mañana en Chile). | Esperar, o apretar «Sincronizar ahora» en [Los Fierros](los-fierros.md). Si solo hay TikTok, Threads o X conectados, este mensaje se queda. |
| «Todavía no llega tráfico etiquetado.» y «Agrega ?s=nombre al link de tu bio — por ejemplo /?s=reel-gimnasio — y cada pieza de contenido aparecerá acá por separado.» | No hubo ninguna visita en el rango, con o sin etiqueta. | Ampliar el rango. Al armar links, el `?s=` va detrás de la dirección completa de la página (`https://tu-parrilla.cl/<su-página>?s=…`), no detrás de tu-parrilla.cl a secas, que es la portada del producto. |
| «Nadie ha hecho click todavía.» | Ningún click en los links de la página en el rango. | Nada que arreglar. |
| «Sin datos todavía.» | La lista de ese panel (orígenes, países, ciudades, dispositivo, sistema, navegador, idioma) no tiene visitas en el rango. | Ampliar el rango. |
| «Sin visitas para dibujar el mapa.» | «Cuándo te visitan» no tiene visitas en el rango. | Ampliar el rango. |
| «Sin visitas en este período.» | El embudo no tiene visitas en el rango. | Ampliar el rango. |
| «Nada todavía.» | «Últimas visitas» no tiene visitas en el rango. | Ampliar el rango. |
| «—» bajo una cifra, en vez del porcentaje | El período anterior tuvo cero, o el rango es «Todo». | Nada: no hay con qué comparar. |
| «Algo se rompió» y «No fue nada que hicieras: una consulta no respondió. Vuelve a intentarlo; el detalle quedó en la consola del navegador.» | Una consulta de la pantalla falló. | Apretar «Reintentar»; si sigue, «Ir a La Parrilla». |

## Si el humano dice…

- **«¿Dónde veo cuántas visitas me trajo este reel?»**: en «Qué contenido te trae gente», la
  fila con el texto del reel; o en [Los Cortes](los-cortes.md), su fila, columna «Visitas».
- **«Casi todo dice Directo» / «Instagram casi no aparece en De dónde vienen»**: el navegador
  interno de Instagram y TikTok esconde de dónde viene la gente. La etiqueta `?s=` es lo que
  sí lo dice: mirar «Qué contenido te trae gente».
- **«Únicos no cuadra»**: la identidad de un visitante dura un día; en rangos largos, quien
  vuelve otro día cuenta de nuevo.
- **«El CTR pasa de 100%»**: hubo más clicks que visitas, porque hay gente que aprieta varios
  links.
- **«El CTR dice +50% pero solo subió un punto»**: la comparación es el cambio relativo del
  CTR, no la diferencia en puntos.
- **«Mis visitas no coinciden con los clics que me muestra Instagram»**: Instagram cuenta
  toques en el link; aquí cuenta solo lo que llegó a abrirse en un navegador, y sin bots.
- **«No veo TikTok en Tus cuentas»**: Tu Parrilla no lee seguidores de TikTok (tampoco de
  Threads ni X). Solo hay tarjetas de Instagram, Facebook y YouTube.
- **«Perdí seguidores y dice sin cambio»**: la pantalla no muestra bajas; «sin cambio» puede
  ser una baja.
- **«Dice — en el período»**: no hay una lectura de antes del rango para comparar. Elegir un
  rango más corto que el tiempo que lleva conectada la cuenta.
- **«Visitas al perfil y alcance salen — en Facebook o YouTube»**: solo Instagram los
  entrega.
- **«Tengo dos cuentas de Instagram y veo una sola tarjeta»**: esta pantalla no separa
  cuentas de la misma red.
- **«¿Qué es (sin etiqueta)?»**: las visitas que llegaron por un link sin `?s=`, como el de
  la bio si no lo lleva.
- **«Veo una etiqueta que empieza con dm-»**: la puso la respuesta automática por palabra
  clave en el link que mandó.
- **«Veo la etiqueta y no el texto del post»**: esa etiqueta no es de ninguna publicación
  sincronizada: la escribió alguien a mano en un link, es una etiqueta vieja que se cambió en
  Los Cortes, o el post todavía no se sincroniza.
- **«Veo (link eliminado)»**: ese link se borró de la página en [La Vitrina](la-vitrina.md);
  sus clicks quedan.
- **«Las horas de Cuándo te visitan no calzan»**: se dibujan en la zona de
  [Tu Cuenta](tu-cuenta.md), que dice la explicación del panel.
- **«Una visita dice bot»**: solo se ven con «Bots» activo; apretarlo otra vez las saca.
- **«La pantalla se queda gris un rato»**: los paneles de abajo cargan después de los de
  arriba; esperar.

## Lo que esta pantalla no hace

- No muestra lo que hizo cada publicación en la red (views, likes, arrastre): eso es
  [Los Cortes](los-cortes.md).
- No acepta fechas exactas: solo los cinco rangos.
- No identifica personas: no guarda la IP ni usa cookies, y no hay forma de saber quién
  visitó.
- No cuenta a quien descarga la página sin ejecutarla, ni con «Bots».
- No muestra seguidores perdidos, ni separa dos cuentas de la misma red, ni lee cuentas de
  TikTok, Threads o X.
- No crea ni edita etiquetas (eso es Los Cortes) ni links (eso es La Vitrina).
- No exporta a planilla.
- No se lee con las llaves de la API: la API de métricas es por publicación, ver
  [la guía de la API](../api-editor.md). La app del teléfono tiene su propio resumen
  ([La app del teléfono](app-movil.md)).
- Tiene topes: 50 etiquetas, 25 links, 12 orígenes, países o ciudades, 8 dispositivos,
  sistemas, navegadores o idiomas, 40 últimas visitas. No avisa cuando se pasan.

## Para quien mantiene esta página

Sale de:

- `src/app/admin/(dash)/analytics/page.tsx` (encabezado, cifras, paneles y sus textos)
- `src/app/admin/(dash)/analytics/accounts.tsx` (tarjetas de «Tus cuentas» y su gráfico)
- `src/lib/analytics.ts` (cada consulta, topes, granularidad, período anterior)
- `src/lib/account-stats.ts` y `src/lib/social/account-metrics.ts` (seguidores, visitas al
  perfil, alcance, por red)
- `src/components/filter-bar.tsx` y `src/lib/filters.ts` (rangos, perfil, bots)
- `src/components/charts/stat-tile.tsx`, `src/components/charts/panel.tsx`,
  `src/components/charts/traffic-chart.tsx`, `src/components/charts/campaign-table.tsx`,
  `src/components/charts/bar-list.tsx`, `src/components/charts/donut.tsx`,
  `src/components/charts/funnel.tsx`, `src/components/charts/heatmap.tsx`,
  `src/components/charts/use-sorted-rows.ts`
- `src/lib/posts.ts` (el texto y la miniatura de cada etiqueta)
- `src/lib/tracking.ts` y `src/components/visit-tracker.tsx` (qué es una visita, bots,
  únicos, de dónde sale la etiqueta)
- `src/lib/networks.ts` (nombres de los orígenes y cómo se deducen)
- `src/lib/social/politica-youtube.ts` y `src/lib/social/delta.ts` (YouTube, lo ganado)
- `src/lib/social/comentarios/reglas.ts` (las etiquetas `dm-`)
- `src/lib/social/sync.ts`, con `vercel.json` (la hora de la sincronización)
- `src/lib/utils.ts` (formato de números, nombres de países)
- `src/app/admin/(dash)/error.tsx`, `src/app/admin/(dash)/nav.tsx`, `src/lib/vocabulario.ts`

Si cambias lo que se ve en alguno de ellos, actualiza esta página en el mismo commit.
