# El modo día: la barra de sushi — 19 de octubre de 2026

El dueño lo pidió el 18 de octubre. Al equipo de marketing le llegaron críticas de que la
estética de asado —la parrilla, los cortes, el fuego— deja fuera a buena parte del público
femenino. Pidió un modo día y un modo noche:

- **La noche es la de hoy y queda por defecto.**
- **El día es lo mismo, con sushi:** las mismas piezas, en vez de chorizo y carne, «con cositas
  bonitas de sushi».
- **Solo interfaz.** Nada de datos nuevos, de API ni de publicador.
- **Un diseño extenso antes del código,** al nivel de `docs/auditoria-ui-2026-10-16.md`. Es
  este documento.

Las tandas 1 y 2 están hechas desde el 2026-10-19 (ver «Lo que más comunica, en tandas»). Las
cuatro piezas, en `src/components/pieza-sushi.tsx`, se miraron a 120 y a 48 px, sobre la chapa
del día y al lado de los cortes de la noche, en un HTML suelto con el CSS real del panel. Lo
mismo una pantalla armada con los componentes de verdad, en los dos modos. Las maquetas con las piezas, la paleta y una semana de La Parrilla de día viven en
un artifact privado del dueño, «Tu Parrilla de día». Este documento guarda lo necesario para
trabajar sin él.

## Las reglas

Son las de la auditoría, con dos que el modo día agrega. Cada decisión de abajo aplica una o
varias.

1. **La gramática del corte no cambia: cambia el plato.** Cada propiedad del dibujo sigue
   diciendo una sola cosa, y la misma en los dos modos:

   | Lo que se ve | Lo que dice | De noche | De día |
   |---|---|---|---|
   | La silueta | El formato | entraña, tira, bife, chori | nigiri, roll, sashimi, temaki |
   | El relleno | La cocción | la carne | el pescado, bajo el soplete |
   | Las marcas | Cómo le fue a cada destino, una por destino | la del fierro | una banda de nori |
   | El halo rojo y la banderita | Que algo falló | igual | igual |
   | Lo que se mueve | Que algo está saliendo ahora | el humo | la llama del soplete |

   La única propiedad que de día dice algo más es la silueta del roll: entero mientras no se
   sirvió, en rodajas cuando salió. Lo pidió el dueño el 2026-10-19, y no le quita nada a la
   regla: dice lo mismo que su pescado, a punto o no, con otra señal, que además se lee sin
   color.

2. **Las palabras no cambian, salvo una.** Siguen iguales:
   - los nombres de las pantallas, los botones, los estados («Programada», «Saliendo ahora»,
     «Falló») y la marca, «Tu Parrilla»;
   - las frases de error.

   Tres razones:
   - **La wiki de la UI y los agentes guían con los textos literales.** Un modo que cambiara
     «La Parrilla» por «La Barra» dejaría a la wiki mandando a la persona a un botón que no ve.
   - **Las guías de la API nombran las pantallas.**
   - **«Tu Parrilla» es el nombre del producto y del dominio,** el que verificó Google.

   **La excepción es «Se quemó»**, la sección de La Parrilla con lo que falló: de día dice «Se
   echó a perder» (`SE_QUEMO`, en `src/lib/vocabulario.ts`). La primera vuelta la dejó igual y
   le dio el soplete para que fuera verdad: un nigiri se sella, queda a punto y se quema con el
   soplete del aburi. El dueño la vio el 2026-10-19 y pidió otra cosa, porque quemar pescado no
   tiene mucho sentido: lo que no se sirvió se echa a perder. Ahora el soplete solo cocina —sella
   y deja a punto— y lo que falló es pescado pasado (ver «La cocción»).
   - **La wiki** lo cuenta en «El modo día», para que un agente que oye una palabra sepa que es
     la otra.
   - **El correo del resumen** nombra la sección como la ve la cuenta.
   - **Lo demás de lo que falló sigue neutro:** el estado dice «Falló» o «Falló en parte» en los
     dos modos.

3. **La noche por defecto, y el modo se elige.** No se adivina por el modo del sistema
   (`prefers-color-scheme`), porque el dueño pidió que la noche fuera la de entrada. Quien
   quiere el día lo prende una vez, y el panel lo recuerda.

4. **Igual de legible o más.** Texto a 4,5:1 o más sobre la superficie donde vive, y dibujos y
   bordes que significan algo a 3:1. La cocción se ordena por luminosidad, de clara a oscura,
   como la carne: es lo que la deja leer con daltonismo. Cada cifra de abajo está medida, y los
   tests de paleta las van a guardar (ver «Tanda 1»).

5. **Lo que falló se ve igual en los dos modos.** El halo, la banderita y el rojo `QUEMO`
   (#f2557a) son los mismos, porque lo que falló es lo único que pide la mano del dueño. De
   noche y de día, el ojo tiene que encontrarlo igual de rápido.

6. **Lo de afuera no cambia.** La página pública de cada creador es su identidad y no lleva
   asado: tampoco lleva sushi. La API y el ícono de la app siguen como están, y los correos
   solo cambian donde nombran «Se quemó» (regla 2). La portada tiene los dos modos desde la
   tanda 4: es la cara del producto, no la de un creador.

## Las piezas

Las cuatro van en el mismo lienzo de 120 × 64 que los cortes y reciben las mismas props que
`Corte`, para que el modo día cambie el dibujo y nada más:

- `formato`, `huesos` (las rodajas del roll), `carne`, `coccion` y `sellos`;
- `chico` (el de «Se quemó», a 48 px) y `llenado` (el compositor, que se llena a medida que
  llegan los archivos).

Las reglas que deciden qué es cada post no se tocan: `formatoDe`, `coccionDe`, `carneDe` y
`selloDe`, de `src/lib/parrilla.ts`.

| Formato | De noche | De día | Por qué esa pieza |
|---|---|---|---|
| Video | Entraña | **Nigiri de salmón** | Es lo que más se publica y la pieza más reconocible. Las vetas blancas del salmón van en diagonal, como la fibra de la entraña, y son lo que hace leer «salmón» y no «tomate». |
| Carrusel | Tira de asado, un hueso por archivo | **Un roll envuelto en salmón**: entero mientras no se sirvió, en rodajas cuando salió, una por archivo | El roll se corta al servirse: lo pidió el dueño el 2026-10-19 (la primera vuelta lo dibujaba siempre en rodajas). Entero, cuenta los archivos con sus líneas de corte; cortado, con sus rodajas, como los huesos, hasta diez. Las rodajas van juntas, apenas montadas: separadas, quedaban chicas para decir la cocción. El salmón va afuera, como el roll que más se come en Chile, para que la cocción tenga la misma superficie antes y después de cortar y las bandas de nori se vean encima. |
| Foto | Bife | **Sashimi**, tres láminas sobre una hoja de shiso, con wasabi | Una sola pieza de pescado, sin arroz: la silueta compacta del bife, sin confundirse con el nigiri. |
| Texto | Chori | **Temaki**, en papel de soya rosado | Una silueta que no se parece a ninguna otra, el cono. El papel de soya y no el nori, porque sobre el nori negro las bandas no se verían. Rosado, porque es lo más «bonito» del muestrario sin agregar un color con significado. |

**Lo que no se cocina no cambia nunca:** el arroz, el nori, el shiso, el wasabi y el papel de
soya. La cocción vive solo en el pescado, para que el estado tenga una sola superficie, como la
carne del corte. El arroz lleva un borde (#d9ccb6): blanco sobre la chapa clara, sin borde,
desaparecía.

### La cocción: el soplete, y lo que se echó a perder

El soplete del aburi hace de parrilla: sella y deja a punto. Lo que falló no se quema, se echa
a perder. El pescado va de crudo a pasado, de claro a oscuro. Los tonos medios:

| Cocción | En palabras | El pescado | Contraste con la vecina |
|---|---|---|---|
| `cruda` | Programada | salmón fresco, #ffb39a | — |
| `sellada` | Saliendo ahora | bordes dorados, #e5864a | 1,55:1 |
| `punto` | Publicada | aburi tostado, #b46a33 | 1,55:1 |
| `quemada` | Falló | pasado: un verde gris hondo, #282d20 | 3,40:1 |

- **Entre los extremos, 8,19:1.** La carne de la noche daba 6,75:1.
- **Entre vecinas, al menos 1,55.** La carne daba al menos 1,59, casi lo mismo.
- **El pasado contra la chapa del día da 13,91:1.** De noche, lo quemado tenía el halo para
  no camuflarse en la parrilla oscura. De día lo tiene igual, por la regla 5.
- **Lo que lo aparta del carbón**, siendo igual de oscuro:
  - el verde gris, más verde que rojo en sus tres tonos (lo guarda `pieza-sushi.test.ts`);
  - el moho, en manchas pálidas y difusas;
  - el olor: tres ondas quietas sobre la pieza, a la izquierda de la banderita. Quietas,
    porque lo único que se mueve es lo que está saliendo (regla 1).
- **La parcial** («Falló en parte»): como de noche, se pinta con el pescado de lo que no
  falló, y lleva el halo.

### Las marcas: una banda de nori por destino

La banda va de arriba abajo, apenas inclinada, recortada por la silueta. Las siete formas son
las de la marca del corte (`Sello`):

| Sello | De noche | De día |
|---|---|---|
| `pendiente`, `saliendo` | marca punteada | banda punteada, solo el contorno |
| `servido` | marca quemada, oscura | banda de nori entera, con un brillo |
| `quemado` | carbonizada, con una brasa adentro | pasada, cruzada por el rojo del halo: sin brasa, porque de día nada se quema |
| `bandeja` (TikTok espera la mano del dueño) | quemada hasta la mitad, punto ámbar | nori hasta la mitad, el mismo punto ámbar |
| `reintento` | punteada en ámbar | punteada en ámbar |
| `frio` (el fierro frío) | punteada en acero | punteada en acero |

En el roll, cada banda cruza el centro de una rodaja y nunca la juntura de dos, donde se perdía
entre las orillas de las dos: con cuatro rodajas y tres destinos caían justo encima. Con el
roll entero, caen donde van a quedar sus rodajas, y las líneas del corte van enteras y finas,
para no confundirse con la banda punteada de un destino que no salió. Si hay más destinos que
rodajas, van de a varias por rodaja.

### El halo, la banderita y la llama

- **El halo y la banderita** son los del corte: el contorno en `QUEMO`, que late tres veces y
  queda encendido, y la banderita arriba a la derecha. Solo el palo de la bandera cambia de
  color, porque el hueso claro de la noche no se veía sobre la chapa clara.
- **La llama del soplete** reemplaza al humo. Es la boquilla en acero y una llama azul que
  apunta a la pieza desde arriba, solo mientras algún destino está saliendo.
  - Con movimiento, titila.
  - Con «reducir movimiento», queda quieta y dice lo mismo, como las volutas fijas del humo.
  - Azul y no naranjo: el naranjo de día es el acento de lo accionable, y la llama no es un
    botón.
- **La sombra** bajo la pieza es café y suave (22 %). La negra al 55 % de la noche, sobre la
  chapa clara, era una mancha.

## La paleta del día

El panel ya pinta casi todo con variables (`.acerado`, en `src/app/globals.css`): el acero, el
texto, la brasa. El día redefine esas mismas variables, y ninguna pantalla tiene que saber que
existe. La escala del acero se da vuelta: lo más hondo de la noche es lo más claro del día.

| Variable | De noche | De día | De día, contra la chapa |
|---|---|---|---|
| `--color-acero-950` (el fondo) | #16181a | papel de arroz, #f6f1e9 | — |
| `--color-acero-900` (la chapa) | #1d2124 | #fffdf9 | — |
| `--color-acero-800` (al pasar el mouse, los campos) | #242a2f | #f2ece2 | — |
| `--color-acero-700` (los bordes) | #2a2e33 | #e2d8c9 | 1,39:1, como el borde de noche |
| `--color-acero-600` (el borde de lo que se marca) | #3a4046 | #c9bca8 | 1,84:1 |
| `--color-fg` | #f2ebe2 | tinta, #221f1c | 16,14:1 |
| `--color-fg-muted` | #a39a8f | #5c564e | 7,14:1 |
| `--color-fg-faint` | #8a9096 | #6b655d | 5,67:1; 4,90:1 al pasar el mouse |
| `--color-brasa` (lo accionable) | #e8621f | salmón tostado, #b83d0b | 5,57:1; 4,82:1 al pasar el mouse |
| `--color-positive` | #74bf6a | #2f7a3b | 5,21:1 |
| `--color-negative` (el texto de «se quemó») | #f2557a | #c0244c | 5,74:1 |
| `--color-caution` | #e5a52a | #946000 | 5,26:1 |

Tres cosas que no son obvias:

- **El acento de día no puede ser el naranjo de la noche.** El #e8621f sobre blanco da 3,3:1,
  y la brasa es texto (enlaces, «Fechas» elegido, la pestaña activa). El #b83d0b es el mismo
  tono, más hondo.
- **Los botones llenos se arreglan solos.** El texto de un botón lleno es `text-acero-950`, que
  de día pasa a ser el papel de arroz: claro sobre el salmón tostado, 5,03:1.
- **El rojo de «se quemó» se parte en dos.** El dibujo sigue con `QUEMO` (#f2557a, 3,25:1
  contra la chapa: es un gráfico, le alcanza 3:1). El texto pasa a #c0244c, que de día es el
  único rojo que llega a 4,5:1. De noche, los dos eran el mismo.

**Lo que no pasa por variables, y hay que barrer:**

- **Los velos blancos** (`bg-white/[0.06]`, `border-white/[0.06]` y parecidos). Son unos 140
  usos en 40 archivos del panel. De noche aclaran; de día, blanco sobre blanco no se ve. Pasan
  a un velo con nombre (`--color-velo`), blanco de noche y tinta de día, así
  `bg-velo/[0.06]` aclara o sombrea según el modo.
- **El borde por defecto** de `*` (`rgb(255 255 255 / 0.07)`) se redefine dentro del día.
- **Los gráficos.** `CHART`, `SEQUENTIAL` y `ORDINAL` (`src/components/charts/theme.ts`)
  eran hexes escritos en JavaScript. Ahora los componentes pintan con variables (`PINTURA`,
  `SECUENCIA`, `ESCALONES`) que `.acerado` resuelve según el modo, y los hexes quedan como la
  copia de la noche que miden los tests.
  - **Las variables en el navegador:** Chrome resuelve `var(--…)` en los atributos de un SVG, que
    es donde recharts las pone. Falta mirarlo en Safari y en Firefox (ver `docs/pendientes.md`).
  - **De día:** el mapa de calor va de la chapa al azul hondo, y el embudo pone su escalón más
    grande en el azul más hondo, que de día es el que más se ve.
  - **Las ocho series** no cambian: pasan 3:1 sobre la chapa de los dos modos, y `color.test.ts`
    lo comprueba.
- **El color de la barra del navegador del teléfono** (`viewport.themeColor`, en el layout del
  panel). Hoy es fijo; de día tiene que ser el papel de arroz. Next lo deja calcular por
  petición (`generateViewport`), leyendo el mismo modo.

## Los motivos, uno por uno

El inventario de lo que la interfaz dibuja con la parrilla, y qué es de día. Cada fila nombra
dónde vive.

| Motivo | Dónde | De noche | De día |
|---|---|---|---|
| Los cortes | `corte.tsx`, `CorteDefs` en el layout del panel. Se usan en el calendario, la vista Día, Se quemó, «Así va a quedar» del compositor, el editor de un post (`destinos.tsx`) y la página de La Parrilla | entraña, tira, bife, chori | las piezas de arriba (`pieza-sushi.tsx`, `PiezaDefs`) |
| La reja | `.reja`, una vez por pantalla, bajo el encabezado | las barras de una parrilla | la esterilla de bambú: líneas finas color borde, más juntas |
| Un día de la semana | `.grilla` | los fierros, bandas negras horizontales sobre el fuego | la tabla de servir: líneas de bambú en borde, sin negro |
| La parrilla fría | `.grilla-apagada` | fierros en ceniza, sin brasa | la tabla vacía: sin líneas encendidas, el fondo baja al papel de arroz. «Poner algo» igual que hoy |
| El fuego del día | `.grilla-prendida`, `.grilla-llena` | un degradado de brasa que sube | un lavado de salmón que sube, más fuerte con la tabla llena. Mismo umbral (`calorDelDia`) |
| La carga | `.tibio`, `.brasa-tibia`, `esqueleto.tsx` | un pulso tibio, la parrilla calentándose | el mismo pulso, crema y salmón: el arroz recién hecho |
| Saliendo | `.voluta` | el humo, tres volutas | la llama del soplete (`.llama`) |
| Lo que falló | `.late` | el halo late tres veces | igual, y la banda que falló late con él |
| Recién programado | `.recien` | el corte cae y se enciende una vez | igual, con el acento del día |
| El fierro de una cuenta | `.fierro-al-rojo`, `-enfriandose`, `-frio` | una barra que irradia brasa, ámbar o nada | la misma barra: irradia salmón tostado, ámbar o nada. El nombre «Los Fierros» no cambia (regla 2) |
| La miniatura con forma de corte | `.corte-mini` | las esquinas dispares y el rayado del fierro | las mismas esquinas, sin el rayado: una banda de nori en el borde izquierdo |
| El calor de las barras de views | `.corrio-se-paso`, `-bien`, `-normal` | la brasa a 38 % y a 18 % | el salmón tostado, con las mismas proporciones |
| La marca | la portada (`landing.tsx`, `MarcaDeTuParrilla` en `corte.tsx`) y el ícono de la app | el bife a punto | el nigiri a punto, en la portada (ver «Decisiones»). El ícono de la app no cambia |

## El interruptor

**Dónde.** En la barra de arriba del panel, al lado de Ajustes: un botón con un sol de noche y
una luna de día (`src/components/boton-tema.tsx`). Muestra el modo al que lleva, como un enlace
a otro lugar, y no el que está puesto. Se nombra «Modo día» o «Modo noche», según adonde lleve.
En pantallas angostas, solo el ícono: la barra ya lleva las pestañas y Ajustes.

**Cómo se recuerda.** En la cuenta, `users.tema` (`noche` por defecto), para que el teléfono y
el panel vayan juntos: lo decidió el dueño el 2026-10-19 (ver «Decisiones»). La primera vuelta
lo guardó solo en el equipo, con una cookie.
- **Sin parpadeo.** El layout del panel lo lee de la cuenta en el servidor y escribe `data-tema`
  en el contenedor `.acerado`, así el primer cuadro ya sale en el modo elegido, sin un destello
  de noche al cargar.
- **Sin recargar.** Al apretar el botón, cambia el atributo en el momento, y después lo guarda
  en la cuenta (`guardarTema`, una acción del servidor que no vuelve a dibujar la página).
- **El teléfono** lo lee y lo cambia con `GET`/`PUT /api/mobile/tema`.
- **La puerta, con una cookie.** `ingresar` se dibuja antes de saber de quién es, así que lee
  `tp-tema`, la copia del modo en ese equipo, que dura un año. La escribe el botón al cambiar, y
  al cargar el panel la pone al día si la cuenta cambió en otro lado. Lo mismo el color de la
  barra del navegador: sale de la cookie, para no leer la base dos veces por página.
- **Lo que sigue de noche:**
  - **las páginas legales y el 404:** son públicas, sirven igual en el dominio de un creador y no
    vale la pena que dejen de ser estáticas;
  - **la pantalla de error de la puerta:** se dibuja en el navegador, sin la cookie a mano.

**Cómo cambia el dibujo.** Cada corte dibuja las dos versiones y el CSS esconde la que no va
(`[data-tema='dia'] .solo-noche`). La otra opción era un contexto de React con el modo.
- **Lo que se gana:** el corte se usa en componentes del servidor y del cliente, y un contexto
  no llega a los del servidor. Además arriesgaba un desfase entre el HTML y la hidratación.
- **Lo que cuesta:** el doble de nodos SVG en la semana, unos doscientos, que no se notan.
- **Si se notara:** un `<template>` o el contexto, solo para la vista Lista.

## Lo que pide la documentación

- **La wiki de la UI (`public/docs/ui/`)** describe los dibujos de noche: la carne, las marcas,
  el humo. No se duplica cada página. `index.md` gana una sección, «El modo día», con:
  - dónde está el botón;
  - la tabla de equivalencias de arriba: la entraña es el nigiri, el humo es la llama, la
    banda de nori es la marca.

  Así, un agente que oye «mi sushi tiene una banderita roja» sabe que se echó a perder —«Se
  quemó», de noche— y manda a la misma sección. Las páginas que nombran un dibujo enlazan a esa sección. El test de la wiki
  (`docs-ui.test.ts`) puede exigir que exista.
- **README:** una línea en lo del panel. En el árbol, `pieza-sushi.tsx` y el módulo del modo.
- **`docs/pendientes.md`:** cada tanda saca lo suyo.

## Lo que más comunica, en tandas

Cada tanda se puede publicar sola, y en todas la noche sigue igual. Los tiempos son a ojo.

**Tanda 1, el interruptor, la paleta y las piezas.** Hecha el 2026-10-19. Es lo que se ve: el
panel de día con sus piezas de sushi.
- El botón y la cookie, y el `data-tema` desde el servidor, sin parpadeo.
- Las variables del día.
- El barrido de los velos y el borde por defecto.
- Los gráficos con su juego de día, y el color de la barra del navegador.
- Las piezas en todos los lugares del corte, con la llama del soplete y su versión quieta.
- Los tests de paleta extendidos al día:
  - el orden por luminosidad del pescado y sus contrastes, como `parrilla.test.ts` guarda los
    de la carne;
  - el texto a 4,5:1;
  - las series revalidadas.
- La sección de la wiki.

**Tanda 2, los motivos.** Hecha el 2026-10-19, junto con la 1. Del inventario:
- la tabla de cada día, con líneas de bambú, y la reja en el color del borde;
- la tabla vacía y el lavado de salmón;
- la carga crema;
- los fierros, la miniatura y las barras de views en salmón.

**Tanda 3, la app del teléfono.** Hecha el 2026-10-19; llega por aire.
- **El modo:** el de la cuenta, que la app lee y cambia con `/api/mobile/tema`, con «Modo día» o
  «Modo noche» en Ajustes. El teléfono guarda una copia para abrir en el modo de la última vez
  sin esperar a la red, vuelve a preguntarle a la cuenta al pasar al frente, y un cambio sin señal
  se manda cuando vuelve la conexión (`components/tema.tsx`).
- **Las piezas:** dibujadas con vistas, como los cortes (`pieza-sushi.tsx` junto a `pieza.tsx`),
  con las mismas medidas del panel (`lib/pieza-sushi.ts`, que un test compara): el nigiri, el
  roll entero o en rodajas, el sashimi y el temaki, el pescado pasado con moho y olor, las bandas
  de nori y la llama del soplete. Las curvas finas esperan a `react-native-svg`, que pide un
  build nativo (tanda 6 de la auditoría).
- **Los colores:** `COLORES_NOCHE` y `COLORES_DIA` (`mobile/src/components/colores.ts`), que
  cada pantalla pide con `useColores()`. `paleta.test.ts` compara los del día con el panel, uno
  por uno. La parrilla de cada día se lava de salmón y la miniatura lleva su banda de nori.
- **Lo que sigue de noche:** lo que dibuja el teléfono mismo —la pantalla de arranque, el
  selector de fecha, las alertas—, porque `userInterfaceStyle` de `app.json` pide un build
  nativo. Anotado en `docs/deuda-tecnica.md`.

**Tanda 4, la portada y lo de marketing.** Hecha el 2026-10-19.
- **La portada (`landing.tsx`):** el mismo botón del modo, junto a «Entrar», y la cookie del
  equipo, como la puerta. De día, la marca es el nigiri a punto, y la semana, la leyenda y el
  cierre, las piezas.
- **Su voz de día:** lo que cuenta el dibujo se dice con sushi —«cada pieza», «el pescado
  crudo», «se echa a perder»— con las dos versiones en la página (`DeNocheYDeDia`). Lo que dice
  qué hace la app es igual en los dos modos.
- **Lo que se comparte:** `?modo=dia` abre la portada de día, aunque el equipo nunca lo haya
  elegido, y la tarjeta sale con la imagen de día (`/api/og/dia`): es el enlace para mostrarla
  de día. Las dos direcciones son la misma página: la canónica es la raíz.
- **Lo que exige Google:** la portada sigue diciendo qué hace la app y enlazando Privacidad y
  Términos. Lo cuida `landing.test.ts`.

## Riesgos

- **Recharts y las variables CSS en Safari y Firefox.** En Chrome, los atributos de un SVG
  resuelven `var(--…)`. Si algún navegador no lo hiciera, sus gráficos saldrían con el color
  por defecto del atributo.
  - **La salida:** un gancho de un renglón que lea `data-tema` y le pase los hexes.
  - **Lo que hay que evitar:** que el servidor dibuje con los colores de un modo y el cliente
    con los del otro.
- **Los velos fueron un barrido mecánico** (97 en 45 archivos, `bg-white/` y parecidos a
  `bg-velo/`). El texto blanco sobre un color (`text-white`) quedó como estaba: de día sigue
  siendo blanco.
- **La página pública de cada creador hereda reglas globales** (`:focus-visible`, `::selection`,
  el borde de `*`). El día se acota a `.acerado`, igual que el acero, y no toca esas reglas
  afuera.
- **El dibujo doble y los ids de los SVG.** Las piezas definen sus degradados y sus recortes en
  `PiezaDefs`, una vez por página, en el layout del panel, con dos recortes de roll por
  cantidad de rodajas, entero y cortado. Ninguna pieza repite un id.
- **La vista previa de La Vitrina** es la página pública dentro del panel. De día vuelve a los
  colores de afuera (`.vista-publica`, en `globals.css`), y lo que pinta esa página
  (`profile-view.tsx`) quedó fuera del barrido de los velos.

## Lo que queda como está

- **La noche entera,** que es la de entrada.
- **Las palabras, salvo «Se quemó» (regla 2); la marca y el ícono de la app.**
- **Lo de afuera del panel:** la página pública de cada creador, la API y los correos, salvo
  donde nombran «Se quemó».
- **Las reglas del producto** de `src/lib/parrilla.ts`: qué es cada post, su cocción y el sello
  de cada destino.

## Decisiones para el dueño

La primera, la segunda y la cuarta las tomó el dueño el 2026-10-19.

1. **La marca, de día.** El panel no la lleva (dice «Panel»); la portada y el ícono de la app
   llevan el bife a punto.
   - **Decidido:** el nigiri a punto en la portada de día. Hecho en la tanda 4.
   - **Lo que no cambia:** el ícono de la app y el favicon. Son la marca, y cambiarlos pide
     pasar otra vez por las tiendas.
2. **El modo, por equipo o por cuenta.**
   - **Decidido:** por cuenta, para que el teléfono y el panel vayan juntos. Hecho el
     2026-10-19, antes de la tanda 3, que lo necesita (ver «El interruptor»).
   - **La primera vuelta** lo guardó por equipo, con la cookie: no pedía migración ni API.
3. **Seguir el modo del sistema si nunca se eligió.**
   - **Recomendación:** no. Pediste la noche por defecto, y el que llega de día con el
     teléfono en modo claro vería otro producto sin haberlo elegido.
4. **Las palabras.**
   - **Decidido:** no cambian, salvo «Se quemó», que de día dice «Se echó a perder»: quemar
     pescado no tiene mucho sentido (regla 2). La primera vuelta recomendaba no cambiar
     ninguna.
   - **Si marketing quiere una voz de día:** que sea en la portada y en lo que se comparte, que
     no son pantallas que guíe la wiki.
