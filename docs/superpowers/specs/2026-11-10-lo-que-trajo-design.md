# Lo que trajo: la app que se siente red social

Fecha: 2026-11-10. **Las fases 1, 2 y 3 están hechas; la 4, sin implementar.** Cuatro fases,
cada una en su PR y cada una sostenida sola; el orden está en «Las fases», al final. Es de la app del teléfono: el panel no
cambia en esta entrega (ver «Lo que no entra»).

## Lo que pidió el dueño

> «El objetivo en el fondo es un poco replicar la sensación que produce TikTok o Instagram
> mediante, no necesariamente notificaciones, pero gamificaciones. Por ejemplo, que tal vez cada
> trozo de carne en la parrilla diga, no sé, un circulito de cuántos seguidores nos generó ese
> post, o cuántos likes, o cuántas interacciones. Asimismo, el icono que vemos en el menú del
> celular también podría generar este circulito de como una notificación.»

Lo que decidió al revisar las opciones, el mismo día:

- **El circulito de cada corte cuenta lo nuevo**: los «me gusta», los comentarios y las visitas
  a su página que llegaron desde la última vez que lo miró, con el mismo criterio en todas las
  redes. Había elegido primero los seguidores que trajo cada publicación; se cambió al saber que
  Instagram no los da para los reels (abajo). Los seguidores van en el detalle, donde la red los
  dé.
- **Los cortes con circulito van en una fila arriba de La Parrilla**, como las historias de
  Instagram: los de los últimos siete días.
- **El número del ícono de la app** son los cortes con algo nuevo más los comentarios que
  esperan respuesta en La Mesa.
- Entran también **los números cada hora** para lo reciente, **los hitos** con su celebración,
  **la racha** y **el aviso al teléfono con lo bueno**.

## Lo que dan las redes

Lo que el circulito puede contar depende de lo que cada red entrega, y no es parejo:

| | Instagram | Facebook | TikTok | YouTube |
|---|---|---|---|---|
| «Me gusta» y comentarios de cada publicación | sí | sí | sí | sí, pero sin restar (abajo) |
| Seguidores que trajo cada publicación | fotos, carruseles e historias; **no reels** | no | solo con TikTok for Business | solo con YouTube Analytics |
| Cada cuánto se leen hoy | una vez al día | una vez al día | una vez al día | una vez al día |

**Instagram no da seguidores por reel, y no es un permiso.** La referencia de las estadísticas de
una publicación (`developers.facebook.com/documentation/instagram-platform/reference/instagram-media/insights`)
lista `follows` —y `profile_visits` y `profile_activity`— solo para `FEED` y `STORY`; de las
dieciséis métricas de un reel, ninguna cuenta seguidores, y pedirla en un reel contesta el error
#100. Tu Parrilla ya pide los permisos que exige ese endpoint: `instagram_manage_insights` en la
entrada por Facebook e `instagram_business_manage_insights` en la entrada por Instagram. Se
revisó el 2026-11-10, porque el dueño preguntó si faltaba habilitar otro.

**Las visitas son de Tu Parrilla y se miden al instante.** Cada publicación tiene su etiqueta
`?s=` (`social/campaign.ts`), que sale de la red y del id de la publicación, así que una visita
puede llegar antes de que la lectura diaria encuentre la publicación. Es la cifra que más rápido
se mueve.

## YouTube, en todo esto

Las políticas de YouTube no dejan crear métricas con sus datos (§III.E.4.h, ver
`social/politica-youtube.ts`): ni restar dos lecturas ni sumarlas con las de otra red. Así que en
un corte que salió en YouTube:

- su «me gusta» y sus comentarios **no entran en lo nuevo**: lo nuevo es una resta. El detalle
  los muestra tal como los da YouTube;
- lo que sí entra: **los comentarios que llegaron a La Mesa** desde que se miró —se cuentan filas
  guardadas, como el resumen de La Mesa que ya sale al teléfono— y **las visitas a su página**,
  que son de Tu Parrilla;
- **no entra en los hitos** ni en la suma de vistas de un corte;
- sus seguidores, los de YouTube Analytics (`suscriptoresGanados`), van en el detalle tal como
  llegan, sin sumarlos con los de otra red.

## Lo nuevo de un corte

Un corte es una publicación programada desde Tu Parrilla (`scheduled_posts`), con todas sus
redes. Lo nuevo es la suma, en sus redes, de lo que llegó desde que su dueño lo miró por última
vez:

- **«me gusta» y comentarios**: el contador de su última lectura (`post_metrics`) menos el que
  tenía al mirarlo. Sin YouTube. Si un contador bajó —alguien quitó su «me gusta»—, cuenta cero,
  no un negativo;
- **comentarios de YouTube**: los que entraron a La Mesa (`post_comments`) después de mirarlo;
- **visitas**: las que llegaron a sus páginas con la etiqueta de cualquiera de sus publicaciones
  después de mirarlo, sin bots y solo a páginas del dueño, la misma regla de Los Números
  (`getPostSeries`).

**Mirarlo es abrir su detalle.** Ahí se guarda la marca (`cortes_vistos`): la hora y los dos
contadores de ese momento. El circulito vuelve a cero y vuelve a subir con lo que llegue después.
La marca es del servidor y no del teléfono: dos teléfonos de la misma cuenta ven lo mismo.

**Un corte que nunca se miró** cuenta todo desde que salió. En la primera semana de esta
función, cada corte de los últimos siete días aparece con todo lo que trajo: es lo que se espera
de algo que nunca se abrió.

## «Lo que trajo»: la fila arriba de La Parrilla

Arriba de la agenda, debajo de «La Mesa», una fila que se desliza de lado:

- un corte por burbuja: los que salieron en los últimos siete días en al menos una red, del
  más nuevo al más viejo. Cada uno con su dibujo de siempre (`Pieza`), a punto;
- **con algo nuevo**: el anillo de la burbuja en brasa y el circulito rojo arriba a la derecha,
  «+37» (con más de mil, «+1,2 mil»);
- **sin nada nuevo**: el anillo apagado y sin circulito;
- con un hito, una llamita chica con el umbral más alto que pasó: «1 mil»;
- tocar una abre su detalle.

Si en siete días no salió nada, la fila no aparece. Se llama **«Lo que trajo»**, en los dos modos:
es la frase de la portada («Mira qué trajo cada corte»).

## El detalle de un corte

Una pantalla nueva (`/corte/[id]`), que reemplaza en la app el ir a buscar la publicación a Los
Números:

- arriba, el corte grande, la hora y el texto;
- **«Desde la última vez»**: «+31 me gusta · +4 comentarios · +2 visitas», o «Nada nuevo desde
  el <día> a las <hora>.»;
- **por red**, lo que lleva en total, tal como lo da cada red: vistas, «me gusta», comentarios y,
  donde la red los dé, «+8 seguidores». YouTube con su rótulo de siempre, sin restas;
- **las visitas a tu página** desde esa publicación, marcadas como de Tu Parrilla;
- los hitos que pasó, con su fecha.

## El número del ícono

El número sobre el ícono de la app es **cuántos cortes de la fila tienen algo nuevo, más cuántos
comentarios esperan respuesta en La Mesa**. Es chico a propósito: baja a medida que se mira, y no
llega a «1.234» como el de TikTok.

- **Con la app abierta**, la app lo pone cada vez que trae la fila (el módulo nativo de
  `expo-notifications`, que está en el build 1.2.0: va por actualización en el aire). La pestaña
  La Parrilla lleva el mismo número (`tabBarBadge`). La 1.1.0 no trae ese módulo: ahí está el
  de la pestaña y el ícono no cambia.
- **Con la app cerrada**, el número solo cambia si llega un aviso. En iPhone el aviso lo trae
  (`badge`, en el envío de Expo). En Android, que es donde hoy sale la app, depende del teléfono:
  Samsung y otros muestran el número; un Pixel muestra un punto mientras haya un aviso sin abrir.
  Ni Expo ni Firebase dejan fijar el número en Android desde el servidor.

Como se hizo (fase 2): la fila, el detalle y la marca están en `src/lib/lo-que-trajo.ts`, con
las rutas del teléfono de abajo; el número lo cuenta el servidor y viene con la fila y con cada
marca. La app le habla directo al módulo nativo del ícono (`ExpoBadgeModule`), sin cargar
`expo-notifications`, para que lo mismo llegue por aire a la 1.1.0, que no lo tiene en
`package.json`. El detalle no usa la caché del teléfono: lee y después marca. Tocar el renglón de
un corte servido en La Parrilla abre el mismo detalle. Lo cuentan el README («Lo que trajo, en el
teléfono») y `mobile/README.md` («Lo que trajo»).

## Los números cada hora

Hoy los números de las redes se leen una vez al día (`/api/cron/sync-social`, 09:00 UTC), y con
eso el circulito de los «me gusta» se movería una vez al día. Para que se sienta vivo:

- una ruta nueva, **`/api/cron/numeros-recientes`**, que un pinger externo llama **cada hora**,
  con el mismo `CRON_SECRET`. No se suma a la corrida de cada cinco minutos: esa ya tiene seis
  fases y un tope de 240 segundos;
- relee **solo lo publicado en las últimas 48 horas**, de Instagram, Facebook y TikTok, con la
  misma sincronización de cada red: encuentra lo nuevo y escribe la lectura de hoy en
  `post_metrics`, que ya es una por publicación por día y se pisa. Los Números no cambian de
  sentido: lo de hoy llega más al día;
- **YouTube no**: su cupo de la Data API es de 10.000 unidades al día y la auditoría lo mira;
- **nada con más de 48 horas**: así no toca la lectura de las 48 horas de Los Números
  (`viewsA48h`, la primera tomada entre las 48 y las 72 horas; `src/lib/igual-edad.ts`), que
  ya tiene su propia fragilidad anotada en `docs/pendientes.md` («Sincronizar ahora»);
- con un plazo de 200 segundos: lo que no alcance queda para la hora siguiente;
- en la misma corrida, después de leer: los hitos nuevos y el aviso de lo bueno.

**Lee además los seguidores de las fotos y carruseles de Instagram** (`follows`), en las dos
lecturas: una columna nueva, `post_metrics.seguidores`. No se piden en los reels, porque esa
combinación contesta un error. Los de TikTok for Business no van a esa columna: se quedan con el
resto del detalle de Business en `ajustes`, que `/privacidad` promete borrar al desconectar la
cuenta, y `post_metrics` se queda. El detalle del corte los lee de ahí.

Como se hizo (fase 1): la ruta lista con `soloDesde` (`OpcionesDeListado`), que recorta el
listado a lo de `desde` y no le pide números a lo de antes; la lectura nueva de un día no borra
el número que la anterior traía y ella no (`writeSnapshots`), porque la de cada hora no pasa por
TikTok for Business; y no toca la tarjeta de Los Fierros. Lo cuenta el README, en «Los números
cada hora».

## Los hitos

Cuando las vistas de un corte —sumadas en sus redes, sin YouTube— pasan **100, 1.000, 10.000,
100.000 o 1.000.000**, el corte gana ese hito (`hitos`, uno por corte y umbral, con cuándo se
alcanzó). Se detectan después de cada lectura.

- La primera vez que la app lo ve, **lo celebra**: una animación que cruza la pantalla —fuego de
  noche, la llama del soplete de día— con «Tu corte pasó las 1.000 vistas» y el corte. Una vez:
  la app avisa que lo celebró (`celebrado_en`).
- Queda marcado en la burbuja (la llamita con el umbral) y en el detalle.
- Al estrenar la función, los cortes que ya pasaron un umbral lo ganan sin celebración: se
  celebran solo los que se alcanzan desde ese día.

Como se hizo (fase 3): la detección es una sola consulta para todos los dueños
(`detectarHitos`, en `src/lib/hitos.ts`), al final de la lectura de cada hora y de la del día. La
app celebra el hito más alto de cada corte, hasta tres por vuelta, y celebrarlo deja celebrados los
de abajo. Los que los cortes ya traían al estrenar los puso la migración 0041, ya celebrados y con
`alcanzado_en` nulo, porque no se sabe cuándo se pasaron; el detalle los muestra sin día. La
llamita de la burbuja es el hito más alto, celebrado o no. La celebración, la llama y la racha
están dibujadas con vistas y `Animated` del núcleo, para que lleguen por aire también a la 1.1.0,
que no tiene `react-native-svg`. Lo cuentan el README («Lo que trajo, en el teléfono») y
`mobile/README.md` («Lo que trajo»).

## La racha

**Cuántos días seguidos salió al menos un corte**, en la zona del dueño, contados desde lo que Tu
Parrilla publicó (`scheduled_post_targets` en `published`). Es dato propio: YouTube cuenta igual
que las demás.

- Arriba de La Parrilla, al lado del título: «La parrilla lleva 5 días prendida» (de día, «La
  barra lleva 5 días abierta»), con una llama que crece con la racha.
- Si hoy todavía no salió nada pero ayer sí: «Hoy todavía no sale nada: la racha se apaga a
  medianoche.»
- Con menos de dos días no se muestra: una racha de uno no es una racha.

## El aviso de lo bueno

**Como mucho un aviso al día**, al teléfono, sin correo:

- un hito apenas se alcanza: «Tu corte pasó las 1.000 vistas», con el comienzo del texto;
- si en el día no hubo hito, uno a las 19:00 del dueño si llegó algo: «Hoy: +120 me gusta y +9
  comentarios en tus cortes.» Sin YouTube en los «me gusta», por lo mismo de arriba;
- trae el número del ícono para iPhone (`badge`). El resumen de La Mesa que ya existe lo trae
  también;
- se apaga aparte de los demás, en Ajustes: «Avisos de lo bueno». La marca es
  `users.push_bueno_en`, y la preferencia `users.push_bueno`.

No hay aviso de la racha que se apaga: el dueño pidió avisos de lo bueno.

## El modelo de datos

- **`cortes_vistos`**: `post_id` (único, a `scheduled_posts` en cascada), `owner_id`,
  `visto_en`, `me_gusta`, `comentarios`. Los dos contadores son la suma, sin YouTube, en el
  momento de mirarlo.
- **`hitos`**: `post_id` (a `scheduled_posts` en cascada), `owner_id`, `umbral`, `alcanzado_en`
  (nulo en los del estreno), `celebrado_en`; único por `(post_id, umbral)`. Hecho en la fase 3;
  `avisado_en` llega con el aviso, en la 4.
- **`post_metrics.seguidores`**: entero, nulo donde la red no lo da. Hecho en la fase 1, solo con
  los de Instagram.
- **`users.push_bueno`** (por defecto encendido) y **`users.push_bueno_en`**.

Todo con su dueño en el `where`, como pide el arnés de aislamiento (`src/lib/aislamiento.test.ts`).

## La API del teléfono

- `GET /api/mobile/lo-que-trajo`: la fila —cada corte con su dibujo, su hora, lo nuevo y su
  hito más alto—, la racha, los hitos por celebrar y el número del ícono.
- `GET /api/mobile/cortes/{id}`: el detalle.
- `POST /api/mobile/cortes/{id}/visto`: deja la marca; contesta el número del ícono nuevo.
- `POST /api/mobile/hitos/{id}/celebrado`.
- `PUT /api/mobile/push/bueno`: enciende o apaga los avisos de lo bueno.

## Las fases

1. **Los números cada hora.** La ruta nueva, la lectura de lo reciente y `post_metrics.seguidores`.
   Solo servidor; ya sirve sola, porque Los Números quedan más al día. Del dueño: dar de alta la
   ruta en cron-job.org, cada hora, con el mismo header que la de publicar. Dada de alta el
   2026-11-11.
2. **Lo que trajo.** `cortes_vistos`, la fila, el detalle, el número del ícono y el de la pestaña.
   Es el núcleo.
3. **Los hitos y la racha.** `hitos`, la celebración, la llamita y la racha.
4. **El aviso de lo bueno.** El aviso, su interruptor en Ajustes y el `badge` en los avisos.

La app cambia solo en JavaScript, así que cada fase llega por actualización en el aire, sin pasar
por la tienda. `react-native-reanimated` está en los dos builds; `expo-notifications`, solo en la
1.2.0: lo que lo pida (el número del ícono, los avisos) no hace nada en la 1.1.0.

Cada fase deja al día, en su PR, la página de la app en la wiki
(`public/docs/ui/app-movil.md`), el README (las rutas del teléfono, los crons, el modelo) y
`docs/pendientes.md`.

## Lo que no entra

- **El panel.** La fila, el detalle y los hitos son de la app. Llevarlos a La Parrilla del panel
  queda anotado en `docs/pendientes.md`.
- **Lo publicado fuera de Tu Parrilla.** Un reel subido directo en Instagram está en Los Números,
  pero no es un corte: no tiene burbuja. El circulito es de lo que se cocinó acá.
- **Los seguidores de Facebook y los de los reels de Instagram**, que las redes no dan.
- **Un número fijo en el ícono de Android con la app cerrada**, que Android no deja poner desde
  el servidor.
