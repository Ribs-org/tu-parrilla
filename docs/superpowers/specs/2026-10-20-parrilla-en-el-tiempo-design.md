# La Parrilla en el tiempo: qué salió, qué viene y a qué red — 20 de octubre de 2026

El dueño lo planteó el 20 de octubre, mirando La Barra de día. Lo que ya salió se ve igual que
lo que viene. Como la semana no está ordenada por hora, con una raya en la hora actual que se
va moviendo, cuesta saber qué ocurrió y qué va a ocurrir. Tampoco se ve a qué red va cada cosa
(«¿un toque azul para Facebook?, ¿algo rojo para YouTube?»). En la semana, además, pasan
muchas cosas a la vez, los días quedan descuadrados con los de al lado y no se ve a qué red se
sube más. Preguntó si podría ver solo Facebook, y pidió plantearlo mejor antes de tocar nada.

Las maquetas, hechas con el CSS y los cortes reales del panel sobre una semana de ejemplo con
ese volumen, viven en un artifact privado del dueño, «La Parrilla en el tiempo». Este
documento guarda lo necesario para trabajar sin él.

## El problema es el volumen

La semana de siete columnas se eligió el 2026-09-02 por «más detalle por post»
(`2026-09-02-calendario-edicion-design.md`), con una a tres publicaciones al día. Desde el
2026-10-17, el agente que edita los videos programa unas 44 al día en seis cuentas: Instagram
10, TikTok 18 en tres cuentas, YouTube 12 y Facebook 4. El 94 % va a una sola red, y nunca
caen más de cuatro en el mismo minuto. Con tarjetas de corte, hora, chips y dos líneas de
texto, cada día de la semana medía unos 7.700 px de alto: en la pantalla cabían las siete
primeras y las otras 37 quedaban abajo, sin calzar por hora con las del día de al lado.

## Lo que decidió el dueño

Se le mostraron tres formas de mirar el tiempo, el filtro y los colores, con cuatro preguntas.
Contestó el mismo día:

1. **La semana, de las dos formas:** en filas de una línea, como vista por defecto, y por hora,
   como Google Calendar, a un clic.
2. **El color de cada red, como en las maquetas:** en el ícono, en la franja de un bloque, en el
   filtro y en la mezcla de redes de cada día, con TikTok en neutro.
3. **El filtro, por red.** Por cuenta solo si queda escondido, «como después de un hover»: la
   idea es no mostrarle tanto a la persona.
4. **Cómo se ve lo que ya salió,** a criterio del que lo hace.

## Las reglas

1. **El color de la red dice la red, nunca el estado.** Va en el ícono, en la franja y en la
   mezcla; nunca de fondo, porque el fondo rojo es lo que se quemó. El estado sigue en lo suyo:
   el signo y el borde del chip, el tinte de lo quemado, la cocción del corte. Por eso el rojo
   de YouTube no compite con un fallo: un fallo tiñe el chip entero y lleva «✕». TikTok va en
   el secundario del panel, porque su marca es blanco y negro. Cada color pasa 3:1 —lo que WCAG
   le pide a un dibujo— sobre la chapa, el fondo, un bloque y los tintes de lo quemado y de lo
   servido, de noche y de día (`src/lib/paleta.test.ts`). Hasta ahora el ícono iba en el color
   del texto para no competir con el estado; con decenas de cortes al día, la red tiene que
   verse sin leer, y el estado ya no depende del color del ícono.
2. **El filtro vive en la dirección** (`?red=`, con una red o con el id de una cuenta), así que
   sobrevive al cambiar de semana o de vista y se puede enlazar. Lo obedecen la semana, el día y
   la lista. **«Se quemó» no lo obedece nunca:** es lo que pide la mano del dueño, y un filtro
   olvidado no puede esconderlo. Por lo mismo, el filtro de «Se quemó» no va en la dirección
   (`lista-quemados.tsx`): son dos filtros distintos a propósito.
3. **Con un filtro, la semana y el día recortan; la lista no.** En la semana y en el día, un
   post que sale a Instagram y a Facebook se ve, con «Facebook», cocido según lo de Facebook y
   con una sola marca: es lo que esa red va a recibir. En la lista se ve entero, porque ahí se
   sube, se reprograma y se borra el post completo, y esconderle una red a quien está por
   borrarlo de todas sería engañarlo (`recortar` y `conAlguno`, en `filtro-red.ts`).
4. **Cada número del filtro es lo que queda a la vista al apretarlo:** cuenta lo que se mira —la
   semana, el día o la lista entera—, y un post que sale a dos redes cuenta en las dos.
5. **Lo que no se pidió no se muestra.** El filtro por cuenta aparece al pasar el mouse por la
   red o al llegar con el teclado; sin mouse, en un renglón debajo, solo con esa red elegida. Con
   una sola cuenta, el filtro no aparece.

## En partes

Cada parte se publica sola y no cambia la API ni los datos: es cómo se dibuja.

- **A. El filtro por red y el color de cada red.** Hecha (2026-10-20): `filtro-red.ts` y
  `filtro-redes.tsx` en `schedule/`, los `--color-marca-*` de `globals.css` y
  `src/lib/color-de-red.ts`. El color va también en los chips de cada corte, en las píldoras de
  la lista, en las columnas de «Día», en el filtro de «Se quemó» y en las cuentas del
  compositor.
- **B. La semana en filas.** Hecha (2026-10-20): `calendar.tsx`, con `semana.ts` y
  `linea-de-ahora.tsx`. Cada publicación, una fila de una línea: el corte en chico, la hora y
  sus redes con su signo; el texto, que en un séptimo de pantalla no cabe, va en el `title` y en
  el editor. Cada día lleva la mezcla de redes y un renglón con los signos de los chips («42 ✓ ·
  2 ✕», «44 por salir»). La semana entera, con 44 al día, mide unos 1.400 px en vez de 7.700.

  Lo que ya salió, a criterio, como lo dejó el dueño: deja la chapa y se hunde —sin borde, más
  oscuro que la chapa de noche y tostado de día, porque el fondo del día es casi tan claro como
  la chapa—, con el dibujo apagado y un solo «✓» para todas sus redes. Un chip con su «✓» por
  red hacía que lo servido se viera más cargado que lo que viene, que es lo que hay que mirar.
  Lo que se quemó o pide atención no se hunde aunque haya pasado su hora (`estadoDeFila`): le
  falta algo del dueño. Va por el estado y no por la hora: lo que pasó su hora sin salir sigue
  en la chapa.

  La línea de «ahora» se corre sola, con un reloj al minuto (`useAhora`) que al hidratar parte
  de la hora del servidor. Las filas no cambian de estado sin recargar: que la página se pida
  sola cada vez que la línea pasa una fila costaría consultas a la base y pelearía con lo que
  el dueño tenga abierto. La semana pide 60rem de ancho mínimo, para que una fila de una red
  quepa entera al lado de la hora; en el teléfono se desliza de lado, como antes.
- **C. Por hora: el día y la semana.** Hecha (2026-10-20): `reja-de-horas.tsx` y `horas.ts`,
  que comparten `vista-dia.tsx` y `semana-por-hora.tsx` (`?vista=hora`, la pestaña «Por
  hora»). El día, con una columna por cuenta y las horas hacia abajo; la semana, con siete. Las
  horas van de 07:00 a 23:00 —las del agente—, o más si algo cae afuera. Lo pasado va rayado y
  la línea de «ahora» cruza la columna de hoy, con la hora escrita en el canal de las horas, que
  esconde la hora entera que taparía. Los bloques que se pisan van lado a lado, como en Google
  Calendar (`carriles`). Un bloque del día lleva el corte en chico, la hora, el texto en un
  renglón y el signo de su red; uno de la semana, solo la franja de sus redes, la hora y el signo
  de la que más pide (`selloQueManda`): con 44 al día no cabe más, y el resto va en el `title`.
  En el teléfono la reja se desliza de lado con el canal de las horas pegado a la izquierda
  (`overflow-clip`, no `overflow-hidden`, para que el canal se quede pegado). No se programa con un
  clic en una hora vacía: el compositor recibe el día, no la hora, y sumarla es otro cambio.
- **D. El teléfono.** Hecha (2026-10-20), en La Parrilla de la app (`(tabs)/index.tsx`): el
  filtro por red (`filtro-de-redes.tsx`, `lib/filtro.ts`), la mezcla y el renglón de cada día,
  lo que ya salió en un renglón hundido (`CorteServido`) y la línea de «ahora» en el día de hoy.
  Tres diferencias con el panel, todas por lo que la app tiene: el color de la red va en un
  punto y no en el ícono, porque la app no tiene `react-native-svg` y sumarlo pide un build nuevo;
  la cuenta del filtro es su red y su nombre, porque la API del teléfono no manda el id de la
  cuenta de cada destino; y el filtro no se guarda ni va a ninguna dirección. La agenda sigue en
  tarjetas: la app ya muestra un día debajo del otro, y la reja por hora no cabe en un teléfono
  sin deslizar de lado.

## Lo que se descartó

- **El filtro por cuenta a la vista.** Con seis cuentas son diez botones arriba de la semana;
  el dueño pidió no mostrar tanto.
- **El color de la red de fondo, en la tarjeta o en la fila.** Competiría con lo quemado, que es
  lo único que se pinta de fondo, y con la cocción del corte.
- **Recordar el filtro en el navegador.** Un filtro que vuelve solo al día siguiente esconde
  publicaciones sin que se note; en la dirección se ve y se suelta entrando desde la barra.
