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

1. **«Panel»**, en mayúsculas. Es un rótulo, no un botón. En un teléfono no aparece: le deja el lugar a las pestañas.
2. **Cuatro pestañas**, iguales para todos: «La Parrilla», «La Mesa», «Los Números» y «Tu IA».
   De día, la primera se llama «La Barra» (ver «El modo día», abajo).
   «Tu IA» lleva al lado el dibujo de un maestro cocinero: de noche, un parrillero de sombrero
   de ala ancha y delantal; de día, un maestro de sushi con su gorrito alto. La activa
   se pinta con fondo naranjo. En una pantalla angosta (un
   teléfono) no caben las cuatro: la fila se desplaza de lado y la última se desvanece en el
   borde. La pestaña en la que está se ve siempre entera; si no ve otra, que deslice la barra.
3. **El botón «Ajustes»**, a la derecha, con el ícono de un trinche y un cuchillo, lado a lado (antes era un engranaje:
   si alguien dice «el engranaje», es este); de día, dos palillos en diagonal. En pantallas angostas se ve solo el ícono, sin la
   palabra. Abre un menú con cuatro entradas, cada una con su subtítulo debajo: «Los Fierros»
   (tus redes conectadas; de día, «Los Cuchillos»), «La Vitrina» (tus páginas públicas), «Los Maestros» (quién puede
   entrar; **solo lo ve el admin**) y «Tu Cuenta» (tu nombre y tu hora). Cuando la
   persona está en una de esas pantallas, el botón queda pintado de naranjo. Si el permiso
   de alguna cuenta conectada vence en la semana, el botón lleva un punto ámbar; si alguna
   ya se apagó (venció o dejó de sincronizar), un punto rojo. Adentro, la entrada «Los Fierros»
   lo dice al lado del nombre: «1 se enfría», «2 se enfrían», «1 se apagó» o «2 se apagaron»;
   de día, «1 se desafila», «2 se desafilan», «1 sin filo» o «2 sin filo»
   (un lector de pantalla lee el botón «Ajustes: en Los Fierros, 1 se enfría», o de día «Ajustes: en Los Cuchillos, 1 se
   desafila»). Sin nada que avisar no hay punto. El menú se cierra con Escape, al elegir una entrada o volviendo a
   apretar el botón; un clic afuera no lo cierra.
4. **El botón del modo**, a la derecha de Ajustes. De noche lleva un sol y dice «Modo día»; de
   día, una luna y «Modo noche»: muestra el modo al que lleva, no el que está puesto. En
   pantallas angostas se ve solo el ícono. Ver «El modo día», abajo.
5. **«Salir»**, al final, en mayúsculas. Cierra la sesión y deja en la pantalla para entrar con
   el correo ([ingresar.md](ingresar.md)).

## Las pantallas

Cada pantalla tiene un nombre del asado y, debajo del título, un subtítulo en llano. El título
se ve arriba, grande y en mayúsculas.

| Nombre en pantalla | Subtítulo (lo que es en llano) | Dirección | Dónde está | Página |
|---|---|---|---|---|
| La Parrilla | lo que viene y cómo salió lo que ya se fue | `/admin/schedule` | Primera pestaña. Es la entrada: se llega acá al entrar, y `/admin` lleva acá. El calendario: programar, borradores, lo que se quemó, editar, reprogramar | [la-parrilla.md](la-parrilla.md) |
| La Mesa | lo que te responden y tus respuestas | `/admin/comments` | Pestaña. Los comentarios y sus respuestas | [la-mesa.md](la-mesa.md) |
| Los Números | cómo te fue en las redes y en tu página | `/admin/analytics` | Pestaña. Un tablero con dos mitades: «En las redes» (views y seguidores ganados) y «En tu página» (visitas y clicks en su página de links). Un clic adentro, «Tus publicaciones» (`/admin/analytics/publicaciones`): cada publicación con sus números y su etiqueta `?s=`; la pieza de cada una, con sus versiones (`/admin/analytics/publicaciones/<id>`); «Comparar por atributo» (`/admin/analytics/comparar`); «Tu mejor 10 %» (`/admin/analytics/mejores`), lo que más rindió —o lo que menos, con «Lo peor»— y qué tiene en común; y «Lado a lado» (`/admin/analytics/lado-a-lado`), dos publicaciones con su portada, el link a la red y cómo crecieron | [los-numeros.md](los-numeros.md) |
| Tu IA | tu propio chef: la llave y la guía para conectarla | `/admin/ia` | Cuarta pestaña, la última. Conectar la IA propia: generar y revocar llaves de API, y las guías que tiene que leer. Al final, el manual del parrillero (`/admin/ia/manual`): esta misma wiki, para que la lea la persona | [tu-ia.md](tu-ia.md) |
| Los Fierros | tus redes conectadas | `/admin/accounts` | Botón «Ajustes». Conectar y desconectar redes | [los-fierros.md](los-fierros.md) |
| La Vitrina | tus páginas públicas | `/admin/profiles` | Botón «Ajustes». Su página de links | [la-vitrina.md](la-vitrina.md) |
| Los Maestros | quién puede entrar | `/admin/usuarios` | Botón «Ajustes», solo el admin. Invitar gente | [los-maestros.md](los-maestros.md) |
| Tu Cuenta | tu nombre y tu hora | `/admin/cuenta` | Botón «Ajustes». Nombre y zona horaria | [tu-cuenta.md](tu-cuenta.md) |

De día, dos se llaman distinto, en la barra, en Ajustes y en su título: La Parrilla es **«La
Barra»** y Los Fierros son **«Los Cuchillos»**. La dirección y lo que se hace en cada una no
cambian (ver «El modo día»).

Y dos páginas que no son una pantalla del panel: [Entrar al panel](ingresar.md) y [La app del
teléfono](app-movil.md).

## Cómo ubicar a una persona perdida

1. **Pregúntale qué título grande ve arriba.** Es el nombre de la pantalla (en mayúsculas) y
   debajo va el subtítulo. Con eso sabes en qué página de esta wiki está; si dice «La Barra» o
   «Los Cuchillos», está de día, en La Parrilla o en Los Fierros. Si dice «Tus
   publicaciones», «Comparar por atributo», «Tu mejor 10 %» o «Tu peor 10 %» (o 5, 20, 25) o «Lado a lado», o si arriba del título dice «Pieza» en chico y el
   título es el texto de un post, está dentro de Los Números ([los-numeros.md](los-numeros.md)).
2. **Si no sabe el nombre, tradúcelo desde lo que quiere hacer** (la tabla de abajo).
3. **Si ve «Algo se rompió»**, es la pantalla de error del panel: una consulta falló, no fue
   culpa suya. Tiene el botón «Reintentar» y, salvo que la que falló sea la pantalla principal
   de La Parrilla, el enlace «Ir a La Parrilla». La barra de arriba sigue ahí.
4. **Si ve «No encontramos esa página»** («La dirección no existe, o la página dejó de estar
   publicada.»), la dirección no existe. «Ir al inicio» lleva a la portada del sitio, no al
   panel: que entre de nuevo a `https://tu-parrilla.cl/admin`.
5. **Si ve la forma de la pantalla sin su contenido** —el título y bloques sin texto que se
   encienden y se apagan de a poco, en tonos de brasa—, la pantalla está cargando.
6. **Si ve «Entra con tu correo»**, su sesión terminó (o nunca entró): tiene que pedir un
   código de nuevo ([ingresar.md](ingresar.md)).
7. **Si no ve «Los Maestros» en Ajustes**, no es el admin: es lo esperado.

## Qué quiere hacer → dónde se hace

| Lo que quiere | Dónde |
|---|---|
| Entrar; no le llega el código | [Entrar al panel](ingresar.md) |
| Ver qué sale hoy, qué falló, cómo viene la semana | La Parrilla: el calendario de la semana y, arriba, «Se quemó» ([la-parrilla.md](la-parrilla.md)) |
| Ver un día cuenta por cuenta; cuántas veces sale cada cuenta | La Parrilla, botón «Día», o un clic en el nombre del día en el calendario ([la-parrilla.md](la-parrilla.md)) |
| Conectar Instagram, Facebook, YouTube o TikTok; reconectar una que venció (Threads y X dicen «Próximamente») | Los Fierros ([los-fierros.md](los-fierros.md)) |
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
| Generar o revocar la llave que te dio a ti, o a otro agente | Tu IA, bloque «1. Su llave» ([tu-ia.md](tu-ia.md)). Hasta el 2026-10-19 estaba en Tu Cuenta |
| Leer cómo funciona el panel, pantalla por pantalla | Tu IA → «El manual del parrillero →»: esta misma wiki, en el panel ([tu-ia.md](tu-ia.md)) |
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
  «Reprogramar». En el modo día la sección se llama «Se echó a perder» (ver «El modo día»).
- **El calor de un día:** apagado (nada programado), prendido (uno o dos cortes) o lleno (tres
  o más). Apagado se ve como una parrilla fría: los fierros en gris ceniza y nada de brasa.
- **Fierro:** una red conectada. Su fila en Los Fierros lleva una barra de color, el
  fierro, que dice cómo está la conexión: naranja encendido (al rojo: viva), ámbar
  (enfriándose: vence en siete días o menos) o gris apagado (frío: desconectada, rota o
  vencida, hay que reconectar). De día es un cuchillo chico, con la hoja en salmón tostado
  (con filo), ámbar (se desafila) o gris (sin filo), y la pantalla se llama Los Cuchillos.
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

## El modo día

El panel tiene dos modos. La noche es la de entrada: el acero oscuro, los cortes de carne y el
fuego, como los describen todas las páginas de esta wiki. El día es lo mismo con otro plato: el
fondo claro, color papel de arroz, y piezas de sushi en vez de cortes de carne. Se cambia con el
botón del modo de la barra de arriba, y queda guardado en la cuenta: el panel entra en ese modo
en cualquier equipo donde la persona entre. La pantalla para entrar con el correo sigue el modo
con que se usó el panel la última vez en ese equipo, porque se ve antes de saber de quién es. La
portada, `https://tu-parrilla.cl`, también tiene los dos modos, con el mismo botón al lado de
«Entrar»; de día su marca es un nigiri. No cambian las páginas legales, el 404 ni la página
pública de cada creador; tampoco la vista previa de La Vitrina, que es esa página. La app del
teléfono tiene los dos modos y va con la cuenta: se cambia también en su Ajustes, con «Modo día»
o «Modo noche» ([app-movil.md](app-movil.md)).

**Algunas palabras cambian.** Con sushi no tenía sentido hablar de fierros ni de fuego, así que
de día dos pantallas se llaman distinto, en la barra, en Ajustes y en su título: La Parrilla es
**«La Barra»** y Los Fierros son **«Los Cuchillos»**. También lo que el panel dice del asado:
el fierro de cada cuenta es un cuchillo, que se desafila en vez de enfriarse; un corte es una
pieza, y lo que falló no se quema, se echa a perder. No cambian las direcciones, los botones,
los estados («Programada», «Falló») ni lo que hace cada pantalla. Tampoco las frases de error,
que son las mismas de la API: si una dice «Los Fierros», de día es Los Cuchillos. Los correos
nombran las pantallas como las ve la cuenta. Todo lo que esta wiki dice con la palabra de noche
vale para la de día:

| De noche (como lo dicen las páginas) | De día | Dónde |
|---|---|---|
| «La Parrilla» | «La Barra» | La pestaña, su título y cada frase que nombra la pantalla |
| «Los Fierros» | «Los Cuchillos» | La entrada de Ajustes, su título y cada frase que la nombra |
| «Se quemó» | «Se echó a perder» | La sección de La Parrilla con lo que falló, y el correo |
| «El manual del parrillero» | «El manual del maestro de sushi» | Al final de Tu IA, y el título del manual |
| «Su fierro está frío: reconéctala» | «Su cuchillo está sin filo: reconéctala» | Un destino hacia una cuenta que hay que reconectar |
| «se enfría» | «se desafila» | Al lado de una cuenta cuyo permiso vence en la semana, en el compositor |
| «1 se enfría» | «1 se desafila» | El aviso de Ajustes; con más, «2 se desafilan» |
| «1 se apagó» | «1 sin filo» | El aviso de Ajustes; con más, «2 sin filo» |
| «un corte» | «una pieza» | El compositor: «Ese día ya tiene una pieza.» o «… 2 piezas.» |
| «1 corte servido» | «1 pieza servida» | El pie de La Parrilla: «Ayer: 3 piezas servidas» |
| «Apagada» | «Vacía» | El calor de un día del calendario |
| «Prendida» | «Con piezas» | El calor de un día |
| «Parrilla llena» | «Tabla llena» | El calor de un día |

Y unas frases enteras: en Los Fierros, «Este fierro se está enfriando: la conexión vence <fecha>.
Reconéctala antes de que se apague.» es «Este cuchillo se está desafilando: la conexión vence
<fecha>. Reconéctala antes de que pierda el filo.»; en el compositor, «Ese día está apagado.
Buen lugar para este.» es «Ese día está vacío. Buen lugar para este.»; y en La Parrilla sin
redes, «Sin una red conectada no hay nada que poner al fuego.» es «Sin una red conectada no hay
nada que servir.».

Lo demás que cambia son los dibujos. Si la persona describe lo que ve de día, esta es la
equivalencia con lo que dicen las páginas:

| Lo que dicen las páginas (de noche) | Lo que se ve de día | Qué quiere decir |
|---|---|---|
| Una entraña | Un nigiri de salmón | Un video |
| Una tira de asado, un hueso por archivo | Un roll envuelto en salmón: entero, con una línea por donde se va a cortar, mientras no sale; en rodajas —una por archivo— cuando ya salió | Un carrusel |
| Un bife | Un sashimi: tres láminas sobre una hoja verde, con wasabi | Una foto |
| Un chori | Un temaki: un cono rosado | Un texto, sin archivos |
| La carne cruda, sellada, a punto, quemada | El pescado crudo, dorado, tostado y, si falló, pasado: verde gris, con manchas de moho y tres ondas de olor encima | Programada, saliendo ahora, publicada, falló |
| Una marca del fierro por destino | Una banda de alga oscura (nori) por destino | Cómo le fue a cada red |
| La marca carbonizada, con una brasa adentro | La banda pasada, cruzada por una línea roja | Esa red falló |
| El humo | Una llama azul de soplete, encima de la pieza | Está saliendo ahora |
| El halo rojo y la banderita | Iguales | Falló, en todas las redes o en alguna |
| La sección «Se quemó» | La sección «Se echó a perder» | Lo que falló, con su motivo y el arreglo |
| La parrilla fría | La tabla vacía, sin color | Un día sin nada |
| El fuego del día | Un tono salmón que sube desde abajo | Un día con uno o dos cortes, o lleno |
| El naranjo de lo activo (la pestaña, los botones llenos) | Un salmón tostado, más oscuro | Lo mismo |
| El fierro, la barrita de color de cada cuenta | Un cuchillo chico: el mango oscuro a la izquierda y la hoja a la derecha, en salmón tostado; ámbar si se desafila, gris si perdió el filo | Cómo está la conexión |
| El trinche y el cuchillo del botón «Ajustes» | Dos palillos en diagonal | El mismo botón |

## Lo que no existe (no la mandes a buscarlo)

- **Registro abierto.** Solo entra quien invitó el admin, desde Los Maestros.
- **Publicar en Threads o en X / Twitter.** Las dos dicen «Próximamente» en Los Fierros: todavía
  no se conectan ni se programan.
- **Cambiar el correo con el que se entra.** No se cambia desde el panel.
- **Elegir los creadores del «modo Tinder».** La traída de ideas existe por dentro, pero no
  tiene pantalla todavía.
- **Ver una llave de API ya generada.** Se ve una sola vez al crearla; después solo se revoca
  y se genera otra (Tu IA).
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
  el botón «Ajustes» y «Salir». El ícono de Ajustes, con los palillos de día, en
  `src/components/icono-ajustes.tsx`.
- El modo día: el botón, en `src/components/boton-tema.tsx`; el modo, en la cuenta
  (`users.tema`, que guarda `guardarTema` en `src/app/admin/actions.ts`), con su copia en una
  cookie para la puerta, en `src/lib/tema.ts` y `src/lib/tema-servidor.ts`; las piezas de sushi, en
  `src/components/pieza-sushi.tsx`; los colores y el cuchillo de cada cuenta, en
  `src/app/globals.css` (`.acerado[data-tema='dia']`); las palabras de día, en
  `src/lib/vocabulario.ts` (`PALABRAS_DE_DIA`), puestas en la página en los dos modos con
  `src/components/de-noche-y-de-dia.tsx`.
- `src/app/admin/(dash)/page.tsx`: `/admin` lleva a La Parrilla.
- `src/app/admin/(dash)/content/page.tsx`: la dirección de la antigua pestaña Los Cortes lleva a
  «Tus publicaciones», dentro de Los Números.
- `src/lib/vocabulario.ts`: los nombres, subtítulos y rutas de cada pantalla, y quién las ve.
- `src/lib/parrilla.ts`: la cocción, el calor del día, la temperatura del fierro y el aviso del
  botón «Ajustes» (`avisoDeFierros`).
- `src/app/admin/(dash)/error.tsx`, `src/app/admin/(dash)/loading.tsx` y
  `src/app/not-found.tsx`: el error, la carga y el 404. La carga de cada pantalla sale de las
  piezas de `src/components/esqueleto.tsx`; la de las que no tienen una propia, de
  `src/app/admin/(dash)/carga-general.tsx`.
- `src/proxy.ts`: que el panel solo se abre en tu-parrilla.cl.

Si cambias lo que se ve en alguno de ellos, actualiza esta página en el mismo commit. Una
pantalla nueva lleva su fila en la tabla de pantallas y su página propia (ver
`docs/wiki-ui.md`).
