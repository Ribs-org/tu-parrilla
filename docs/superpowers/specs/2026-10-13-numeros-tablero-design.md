# Los Números como un solo tablero — diseño

**Fecha:** 2026-10-13.

**En una frase:** Los Cortes y Los Números se juntan en un tablero con dos mitades que dicen
qué miden —«En las redes» y «En tu página»—, cada una con dos números a la vista y el resto
detrás de «⋯ Más»; la lista de publicaciones queda un clic adentro, filtrable por cuenta.

**Lo que pidió el dueño (2026-10-13):** es raro que sean dos pantallas; al entrar a Los
Números no se entiende de qué son esos números; en Los Cortes los filtros son extraños (no
parece haber filtro de tiempo, filtra por red y no por cuenta) y hay demasiados KPI —¿views
o visitas? ¿CTR?—. Que el usuario normal vea cuatro cosas y que lo demás aparezca al pedirlo.
Que se note la diferencia entre las publicaciones y la página de links. Y poder comparar un
mismo post con sus versiones (hooks, trial reels, multicuentas).

Este documento cubre el tablero (primera entrega). La comparación de versiones —la vista de
una pieza y «comparar por etiqueta»— va en la segunda.

## 1. Lo que estaba mal

- **Dos pantallas, una barra de filtros, dos cosas distintas.** Los Números era solo la
  página de links (visitas, clicks, países); Los Cortes mezclaba lo que cada post hizo en la
  red con lo que trajo a la página. Ninguna de las dos lo decía.
- **El período de Los Cortes significaba «publicado en el período»**, con un «Incluir
  anteriores» encima. Se leía como si no hubiera filtro de tiempo.
- **Filtraba por red, no por cuenta**: con dos cuentas de Instagram las filas se mezclaban, y
  las tarjetas de cuentas mezclaban lecturas de las dos.
- **Cuatro cifras, nueve columnas y catorce paneles** a la vez.
- **El link copiado de una fila** llevaba a `tu-parrilla.cl/?s=…`, la portada del producto, que
  no anota visitas: toda la atribución de ese post se perdía.

## 2. El tablero

| Decisión | Alternativa descartada | Razón |
|---|---|---|
| Un tablero con dos mitades rotuladas | Dos pestañas renombradas; subpestañas | Las dos mitades se explican la una a la otra —views en la red, visitas en tu página— solo si están juntas |
| Período arriba, para todo; la cuenta en «En las redes» y la página en «En tu página» | Una sola barra con todos los filtros | Cada filtro dice a qué mitad le aplica por dónde está |
| Dos números por mitad: views y seguidores ganados; visitas y clicks | Cuatro de conversión o de audiencia | Los dos de cada lado responden «¿me fue bien?» sin explicar nada |
| «⋯ Más» por mitad, abierto por la URL (`?mas=redes`, `?mas=pagina`) | `<details>` que carga todo | Lo cerrado no se consulta: la mitad de abajo eran nueve consultas que casi nadie miraba |
| Lo ganado en el período, de cualquier fecha de publicación | Solo lo publicado en el período | «Cuánto crecí este mes» incluye el reel de agosto que sigue creciendo |

Debajo de los dos números de cada mitad va una lista corta: «Lo que más creció» (las cinco
publicaciones con más views ganadas) y «Qué publicación te trajo gente» (las cinco etiquetas
con más visitas). En «⋯ Más» de las redes: interacciones, visitas desde posts, arrastre, las
tarjetas de cuentas (una por cuenta, ya no por red) y la serie de views contra visitas. En
«⋯ Más» de la página: únicos, CTR, el tráfico en el tiempo, todas las etiquetas, links, de
dónde vienen, y la audiencia (países, equipo, horas, embudo, idioma, últimas visitas), con el
botón de bots.

## 3. Las publicaciones, un clic adentro

`/admin/analytics/publicaciones` («Ver todas las publicaciones →») es lo que era Los Cortes:
la tabla, los avisos de link sin pegar y de métricas que faltan, la etiqueta editable. Cambia:

- Filtro de **cuenta** en vez de botones de red.
- «Publicadas en el período» | «Todas las recientes», dicho así, en vez de «Incluir
  anteriores».
- Dos columnas a la vista —views y visitas, rotuladas «En la red» y «En tu página»—; las
  otras seis, «Solo con métricas» y «Ver borrados», detrás de «⋯ Más» (`?mas=1`).
- El link copiado lleva a la página principal del dueño (`urlPublicaDe`).
- Se fueron las cuatro cifras, el gráfico y el top: ya están en el tablero.

`/admin/content` redirige ahí con sus filtros. Los Cortes deja de ser pestaña: quedan tres
(La Parrilla, La Mesa, Los Números).
