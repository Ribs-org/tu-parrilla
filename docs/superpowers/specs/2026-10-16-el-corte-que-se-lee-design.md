# El corte que se lee

Tercera vuelta de la parrilla. Sigue a
`docs/superpowers/specs/2026-09-18-parrilla-de-verdad-design.md`, que puso los cortes sobre
la grilla y la cocción como estado; esta entrega cambia cómo se dibuja cada corte. Sale de
una propuesta de diseño externa (la «propuesta 2.1», del 16 de octubre de 2026, que no vive
en el repo); acá queda lo que se tomó de ella y por qué.

## Problema

La regla del spec anterior era que la metáfora hiciera trabajo. El corte teñido no lo hacía
del todo, porque el color cargaba toda la información y no le alcanzaba:

- **Las cocciones se confundían.** Entre vecinas el contraste era de 1,32, 1,35 y 1,39 a 1:
  en una casilla, cruda y sellada eran el mismo café. Lo quemado quedaba a 1,19:1 de la
  chapa, camuflado justo en el estado que más necesita el ojo.
- **Un solo color para varias redes.** Si Instagram salió y TikTok falló, el corte entero
  se pintaba quemado. Salir en dos de tres se veía crudo, y un reintento también.
- **Todos los posts tenían la misma forma.** Un reel, un carrusel y un tuit eran el mismo
  rectángulo.
- **El humo no se veía**: latía la palabra «saliendo», dos píxeles.

## Qué se decidió

Repartir la información entre cosas que el ojo separa solo, sin leer, cada una con un solo
trabajo:

| Lo que se ve | Lo que dice |
|---|---|
| La silueta | El formato: entraña video, tira de asado carrusel (un hueso por archivo), bife foto, chori texto |
| La carne | La cocción: cruda, sellada, a punto, quemada |
| Las marcas | Una por destino, que se quema cuando ese destino sale |
| El halo rojo y la banderita | Que algo se quemó |
| El humo | Que algo está saliendo ahora |

Las reglas están en `src/lib/parrilla.ts` (`formatoDe`, `coccionDe`, `carneDe`, `selloDe`,
`cuentasFrias`), el dibujo en `src/components/corte.tsx` y lo que dice cada tarjeta en
`src/app/admin/(dash)/schedule/dibujo.ts`.

Las decisiones que no son obvias:

1. **Ningún texto va sobre la carne.** Es lo que deja abrir la escala de colores: la nueva
   va de 6,75:1 entre la cruda y la quemada, y el texto del panel sobre la cruda no llegaría
   ni a 3:1. La tarjeta es chapa; la carne es solo el dibujo. Un test guarda las dos cosas.
2. **«Se quemó en una red» es una cocción propia** (`parcial`). Se pinta con la carne de lo
   que no se quemó —a punto si lo demás salió— y lleva el halo. Quemada entera es solo cuando
   fallaron todos.
3. **El rojo de «se quemó» se separa de la brasa.** El de los mensajes (#f0614f) era casi el
   naranjo del fuego; con deuteranopía, «saliendo» y «se quemó» quedaban como dos tonos del
   mismo color. Dentro del panel pasa a #f2557a (`QUEMO`), que se mide a 4,91:1 sobre la
   chapa. La página pública de cada creador conserva el suyo.
4. **La tarjeta cambia de borde, no de color**, y solo cuando pide algo: ámbar si algo
   espera en la bandeja de TikTok, reintenta o tiene el fierro frío; rojo si se quemó.
5. **La miniatura sale del calendario.** El corte ya dice el formato y el estado; la foto
   está a un clic, en el editor. Si hace falta reconocer los posts por la imagen, se puede
   volver a poner al lado del texto sin tocar el dibujo.
6. **Solo dos movimientos.** El humo, en bucle mientras algún destino está saliendo, y el
   latido del halo, tres veces al cargar. Los dos tienen su versión quieta con «reducir
   movimiento», y esa versión también dice el estado. Lo que la propuesta hacía pasar «una
   sola vez» —el sellado de una marca al confirmar, el chisporroteo— necesita recordar qué
   vio el dueño la última vez, y queda para «Mientras no mirabas» (`docs/pendientes.md`).
7. **El teléfono dibuja el mismo corte sin SVG.** `react-native-svg` es nativo: un build
   nuevo y reinstalar a mano. Con vistas (`mobile/src/components/pieza.tsx`) las siluetas
   son aproximadas pero dicen lo mismo, y viaja por OTA. El formato y el sello de cada
   destino los decide el servidor (`GET /api/mobile/schedule`), para que el teléfono no
   repita la regla de TikTok ni la del fierro frío. Los colores sí se repiten, y
   `src/lib/parrilla.test.ts` compara las dos copias.

## Lo que queda de la propuesta

En `docs/pendientes.md`, «La propuesta de diseño 2.1: lo que falta».
