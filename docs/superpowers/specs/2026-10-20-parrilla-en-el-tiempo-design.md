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
- **B. La semana en filas.** Cada publicación, una fila de una línea: el corte en chico, la
  hora, sus redes y un signo. Lo que ya salió deja la chapa; una línea de «ahora» corta el día
  de hoy; cada día dice cuánto salió, cuánto falló y cuánto viene, y lleva la mezcla de redes.
- **C. Por hora: el día y la semana.** El día, con una columna por cuenta y las horas hacia
  abajo, lo pasado rayado y la línea de «ahora» atravesando todas. La semana por hora, como
  tercera vista, con bloques chicos en carriles cuando se juntan.
- **D. El teléfono.** Lo mismo en La Parrilla de la app: el filtro, los colores y lo que ya
  salió.

## Lo que se descartó

- **El filtro por cuenta a la vista.** Con seis cuentas son diez botones arriba de la semana;
  el dueño pidió no mostrar tanto.
- **El color de la red de fondo, en la tarjeta o en la fila.** Competiría con lo quemado, que es
  lo único que se pinta de fondo, y con la cocción del corte.
- **Recordar el filtro en el navegador.** Un filtro que vuelve solo al día siguiente esconde
  publicaciones sin que se note; en la dirección se ve y se suelta entrando desde la barra.
