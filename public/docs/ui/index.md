# La interfaz de Tu Parrilla — guía para guiar a una persona

Para un LLM que trabaja con alguien que usa Tu Parrilla —típicamente el agente que le edita
los videos— y que tiene que ayudarle cuando se pierde en su panel: «¿dónde conecto mi
TikTok?», «me salió un error rojo», «¿dónde genero la llave para ti?». No ves su pantalla ni
tienes el código: esta wiki es todo lo que sabes del panel. Cada página describe una
pantalla de arriba abajo, con el texto literal de cada botón entre «», los mensajes que puede
ver y qué hacer con cada uno.

Lo que tú mismo puedes hacer por API (programar, leer el calendario, sacar lo programado,
leer métricas) está en [la guía de la API](../api-llm.md). Esta wiki es para lo que tiene que
hacer la persona con sus manos.

## Qué es, en una frase

Un panel privado donde un creador conecta sus redes, programa publicaciones, ve cómo les fue,
responde comentarios y edita su página de links. Solo entra quien fue invitado: no hay
registro abierto.

## Dónde está

- **El panel:** `https://tu-parrilla.cl/admin`, que lleva a La Parrilla, la entrada. Se entra
  con el correo y un código de seis dígitos que llega por correo, en
  `https://tu-parrilla.cl/ingresar` ([Entrar al panel](ingresar.md)). Si la persona lo abre en
  otro dominio, la manda sola a tu-parrilla.cl.
- **La app del teléfono** (Android): hace una parte de lo mismo, con las mismas tres pestañas
  —La Parrilla, Publicar y Los Números— en versión corta ([La app del teléfono](app-movil.md)).
- **Su página pública**, la que ve su audiencia: `https://tu-parrilla.cl/<su-dirección>`. Se
  edita en La Vitrina ([la-vitrina.md](la-vitrina.md)).

## La barra de arriba

Está siempre, fija arriba, en todas las pantallas del panel. De izquierda a derecha:

1. **«Panel»**, en mayúsculas. Es un rótulo, no un botón.
2. **Tres pestañas**, iguales para todos: «La Parrilla», «La Mesa» y «Los Números». La activa
   se pinta con fondo naranjo. En una pantalla angosta (un
   teléfono) la fila se desplaza de lado: si no ve una pestaña, que deslice la barra.
3. **El botón «Ajustes»**, a la derecha, con el ícono de un cuchillo y un trinche cruzados (antes era un engranaje:
   si alguien dice «el engranaje», es este). En pantallas angostas se ve solo el ícono, sin la
   palabra. Abre un menú con cuatro entradas, cada una con su subtítulo debajo: «Los Fierros»
   (tus redes conectadas), «La Vitrina» (tus páginas públicas), «Los Maestros» (quién puede
   entrar; **solo lo ve el admin**) y «Tu Cuenta» (tu nombre, tu hora y tus llaves). Cuando la
   persona está en una de esas pantallas, el botón queda pintado de naranjo. Si el permiso
   de alguna cuenta conectada vence en la semana, el botón lleva un punto ámbar; si alguna
   ya se apagó (venció o dejó de sincronizar), un punto rojo. Adentro, la entrada «Los Fierros»
   lo dice al lado del nombre: «1 se enfría», «2 se enfrían», «1 se apagó» o «2 se apagaron»
   (un lector de pantalla lee el botón «Ajustes: en Los Fierros, 1 se enfría»). Sin nada
   que avisar no hay punto. El menú se cierra con Escape, al elegir una entrada o volviendo a
   apretar el botón; un clic afuera no lo cierra.
4. **«Salir»**, al final, en mayúsculas. Cierra la sesión y deja en la pantalla para entrar con
   el correo ([ingresar.md](ingresar.md)).

## Las pantallas

Cada pantalla tiene un nombre del asado y, debajo del título, un subtítulo en llano. El título
se ve arriba, grande y en mayúsculas.

| Nombre en pantalla | Subtítulo (lo que es en llano) | Dirección | Dónde está | Página |
|---|---|---|---|---|
| La Parrilla | lo que viene y cómo salió lo que ya se fue | `/admin/schedule` | Primera pestaña. Es la entrada: se llega acá al entrar, y `/admin` lleva acá. El calendario: programar, borradores, lo que se quemó, editar, reprogramar | [la-parrilla.md](la-parrilla.md) |
| La Mesa | lo que te responden y tus respuestas | `/admin/comments` | Pestaña. Los comentarios y sus respuestas | [la-mesa.md](la-mesa.md) |
| Los Números | cómo te fue en las redes y en tu página | `/admin/analytics` | Pestaña. Un tablero con dos mitades: «En las redes» (views y seguidores ganados) y «En tu página» (visitas y clicks en su página de links). Un clic adentro, «Tus publicaciones» (`/admin/analytics/publicaciones`): cada publicación con sus números y su etiqueta `?s=`; la pieza de cada una, con sus versiones (`/admin/analytics/publicaciones/<id>`); «Comparar por atributo» (`/admin/analytics/comparar`); y «Tu mejor 10 %» (`/admin/analytics/mejores`), lo que más rindió y qué tiene en común | [los-numeros.md](los-numeros.md) |
| Los Fierros | tus redes conectadas | `/admin/accounts` | Botón «Ajustes». Conectar y desconectar redes | [los-fierros.md](los-fierros.md) |
| La Vitrina | tus páginas públicas | `/admin/profiles` | Botón «Ajustes». Su página de links | [la-vitrina.md](la-vitrina.md) |
| Los Maestros | quién puede entrar | `/admin/usuarios` | Botón «Ajustes», solo el admin. Invitar gente | [los-maestros.md](los-maestros.md) |
| Tu Cuenta | tu nombre, tu hora y tus llaves | `/admin/cuenta` | Botón «Ajustes». Nombre, zona horaria y llaves de API | [tu-cuenta.md](tu-cuenta.md) |

Y dos páginas que no son una pantalla del panel: [Entrar al panel](ingresar.md) y [La app del
teléfono](app-movil.md).

## Cómo ubicar a una persona perdida

1. **Pregúntale qué título grande ve arriba.** Es el nombre de la pantalla (en mayúsculas) y
   debajo va el subtítulo. Con eso sabes en qué página de esta wiki está. Si dice «Tus
   publicaciones», «Comparar por atributo» o «Tu mejor 10 %» (o 5, 20, 25), o si arriba del título dice «Pieza» en chico y el
   título es el texto de un post, está dentro de Los Números ([los-numeros.md](los-numeros.md)).
2. **Si no sabe el nombre, tradúcelo desde lo que quiere hacer** (la tabla de abajo).
3. **Si ve «Algo se rompió»**, es la pantalla de error del panel: una consulta falló, no fue
   culpa suya. Tiene el botón «Reintentar» y, salvo que la que falló sea la pantalla principal
   de La Parrilla, el enlace «Ir a La Parrilla». La barra de arriba sigue ahí.
4. **Si ve «No encontramos esa página»** («La dirección no existe, o la página dejó de estar
   publicada.»), la dirección no existe. «Ir al inicio» lleva a la portada del sitio, no al
   panel: que entre de nuevo a `https://tu-parrilla.cl/admin`.
5. **Si ve un esqueleto gris que pulsa, sin texto**, la pantalla está cargando.
6. **Si ve «Entra con tu correo»**, su sesión terminó (o nunca entró): tiene que pedir un
   código de nuevo ([ingresar.md](ingresar.md)).
7. **Si no ve «Los Maestros» en Ajustes**, no es el admin: es lo esperado.

## Qué quiere hacer → dónde se hace

| Lo que quiere | Dónde |
|---|---|
| Entrar; no le llega el código | [Entrar al panel](ingresar.md) |
| Ver qué sale hoy, qué falló, cómo viene la semana | La Parrilla: el calendario de la semana y, arriba, «Se quemó» ([la-parrilla.md](la-parrilla.md)) |
| Ver un día cuenta por cuenta; cuántas veces sale cada cuenta | La Parrilla, botón «Día», o un clic en el nombre del día en el calendario ([la-parrilla.md](la-parrilla.md)) |
| Conectar Instagram, Facebook, YouTube, TikTok, Threads o X; reconectar una que venció | Los Fierros ([los-fierros.md](los-fierros.md)) |
| Programar un post o un video; subir varios por CSV | La Parrilla, botones «Nueva publicación» y «Subir CSV», o el «+» de un día del calendario ([la-parrilla.md](la-parrilla.md)) |
| Retomar algo que dejó a medias; ver lo que escribió y no programó | La Parrilla, botón «Borradores (N)» ([la-parrilla.md](la-parrilla.md)); en el teléfono, La Parrilla → «Borradores (N)» ([app-movil.md](app-movil.md)) |
| Cambiar o borrar algo programado; reprogramar lo que falló | La Parrilla, abriendo el post ([la-parrilla.md](la-parrilla.md)); lo que falló, también desde «Se quemó», arriba del calendario |
| Una palabra clave que responde comentarios sola | Al programar el post, en La Parrilla; las respuestas se ven en La Mesa |
| Saber cómo le fue en el período: views y seguidores ganados, visitas a su página | Los Números, el tablero ([los-numeros.md](los-numeros.md)) |
| Ver vistas, likes, visitas y clics de cada publicación; cambiar su etiqueta `?s=` o copiar su link | Los Números → «Ver todas las publicaciones →», la pantalla «Tus publicaciones» ([los-numeros.md](los-numeros.md)) |
| Ver cuánta gente visitó su página y de dónde vino | Los Números, mitad «En tu página» y su «⋯ Más» ([los-numeros.md](los-numeros.md)) |
| Ver los seguidores de cada cuenta | Los Números, «⋯ Más» de «En las redes», panel «Tus cuentas» ([los-numeros.md](los-numeros.md)) |
| Ver todas las versiones de un post (en otras cuentas, con otro hook, el trial reel) con sus números lado a lado | Los Números, la pieza de esa publicación: se abre desde su fila en «Tus publicaciones» o en «Lo que más creció» ([los-numeros.md](los-numeros.md)) |
| Juntar dos versiones del mismo video (dos hooks, o el trial reel y el reel normal) | Darles el mismo atributo `pieza` en el editor de cada post, en La Parrilla («Editar atributos» desde la pieza) ([los-numeros.md](los-numeros.md), [la-parrilla.md](la-parrilla.md)) |
| Comparar qué hook, tema o serie funciona mejor | Los Números → «Comparar por atributo →» ([los-numeros.md](los-numeros.md)); los atributos se anotan en el editor de cada post, en La Parrilla |
| Responder comentarios; darle instrucciones a la IA que redacta los borradores | La Mesa ([la-mesa.md](la-mesa.md)) |
| Editar su página de links: foto, bio, colores, links, dirección | La Vitrina ([la-vitrina.md](la-vitrina.md)) |
| Cambiar su nombre o su zona horaria | Tu Cuenta ([tu-cuenta.md](tu-cuenta.md)) |
| Generar o revocar la llave que te dio a ti, o a otro agente | Tu Cuenta, panel «Llaves para tus agentes» ([tu-cuenta.md](tu-cuenta.md)) |
| Invitar a alguien; cerrar las sesiones de alguien | Los Maestros, solo el admin ([los-maestros.md](los-maestros.md)) |
| Publicar desde el teléfono | [La app del teléfono](app-movil.md) |

## El vocabulario del asado

El panel habla en términos de parrilla. Cuando la persona repite una de estas palabras,
esto es lo que quiere decir:

- **Corte:** una publicación programada (un post, con una o varias redes de destino).
- **Poner al fuego:** programar una publicación. Ya no es un botón: se programa con «Nueva
  publicación» o con el «+» de un día, en La Parrilla.
- **Borrador:** en La Parrilla, una publicación a medio escribir que se guardó sola; se retoma
  con «Borradores (N)», en el panel o en la app del teléfono: son los mismos. No es lo mismo que «Enviar como borrador a mi bandeja de TikTok», que
  manda el post a la app de TikTok, ni que el borrador de respuesta que propone la IA en La Mesa.
- **La cocción de un corte**, que el calendario pinta del más claro al más oscuro y siempre
  dice también en palabras: cruda = «Programada», sellada = «Saliendo ahora», a punto =
  «Publicada», quemada = «Falló».
- **Se quemó / quemado:** falló al publicarse en alguna red. Lo que se quemó se ve en La
  Parrilla, en la sección «Se quemó», arriba del calendario, con su motivo y el botón
  «Reprogramar».
- **El calor de un día:** apagado (nada programado), prendido (uno o dos cortes) o lleno (tres
  o más).
- **Fierro:** una red conectada. Su fila en Los Fierros lleva una barra de color, el
  fierro, que dice cómo está la conexión: naranja encendido (al rojo: viva), ámbar
  (enfriándose: vence en siete días o menos) o gris apagado (frío: desconectada, rota o
  vencida, hay que reconectar).
- **Servido:** un corte que salió. El pie de La Parrilla cuenta los de ayer.

Y tres palabras de Los Números que no son del asado pero se confunden:

- **Etiqueta:** el `?s=` del link de cada publicación, el que dice por cuál llegó la gente a su
  página. Se cambia en «Tus publicaciones».
- **Atributo:** lo que se le anota a un post programado —el hook, el tema, la serie—, en su
  editor de La Parrilla o por la API. Se comparan en «Comparar por atributo». No es lo mismo que
  la etiqueta.
- **Pieza:** una publicación con todas sus versiones (otras cuentas, otro hook, el trial reel),
  en Los Números. Dos posts programados distintos se juntan en una pieza si comparten el
  atributo `pieza`.

## Lo que no existe (no la mandes a buscarlo)

- **Registro abierto.** Solo entra quien invitó el admin, desde Los Maestros.
- **Cambiar el correo con el que se entra.** No se cambia desde el panel.
- **Elegir los creadores del «modo Tinder».** La traída de ideas existe por dentro, pero no
  tiene pantalla todavía.
- **Ver una llave de API ya generada.** Se ve una sola vez al crearla; después solo se revoca
  y se genera otra (Tu Cuenta).
- **El Fuego** (la pantalla de entrada de antes, con el botón «Poner al fuego»). Ya no está:
  lo que mostraba —lo que se quemó, la tarjeta para conectar la primera red y lo que salió
  ayer— está en La Parrilla, que es ahora la entrada.
- **La pestaña «Los Cortes»** (la lista de publicaciones con sus números, `/admin/content`).
  Ya no es pestaña: la lista está en Los Números → «Ver todas las publicaciones →», en la
  pantalla «Tus publicaciones», y la dirección vieja lleva ahí. La palabra «corte» sigue
  queriendo decir una publicación programada (ver el vocabulario de arriba).

## Para quien mantiene esta página

Sale de:

- `src/app/admin/(dash)/layout.tsx` y `src/app/admin/(dash)/nav.tsx`: la barra, las pestañas,
  el botón «Ajustes» y «Salir». El ícono de Ajustes, en `src/components/icono-ajustes.tsx`.
- `src/app/admin/(dash)/page.tsx`: `/admin` lleva a La Parrilla.
- `src/app/admin/(dash)/content/page.tsx`: la dirección de la antigua pestaña Los Cortes lleva a
  «Tus publicaciones», dentro de Los Números.
- `src/lib/vocabulario.ts`: los nombres, subtítulos y rutas de cada pantalla, y quién las ve.
- `src/lib/parrilla.ts`: la cocción, el calor del día, la temperatura del fierro y el aviso del
  botón «Ajustes» (`avisoDeFierros`).
- `src/app/admin/(dash)/error.tsx`, `src/app/admin/(dash)/loading.tsx` y
  `src/app/not-found.tsx`: el error, la carga y el 404.
- `src/proxy.ts`: que el panel solo se abre en tu-parrilla.cl.

Si cambias lo que se ve en alguno de ellos, actualiza esta página en el mismo commit. Una
pantalla nueva lleva su fila en la tabla de pantallas y su página propia (ver
`docs/wiki-ui.md`).
