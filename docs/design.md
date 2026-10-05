# Diseño

Tema oscuro siempre. Tipografía y estructura de monopo saigon (ficha en `docs/referencia-monopo.md`); fondo Dark Veil de React Bits. La interfaz es blanco sobre negro y nunca tiene color: el único color es el velo morado del fondo.

## Colores

Definidos como variables en `app/globals.css`.

| Variable | Valor | Uso |
|---|---|---|
| `--bg` | `#000000` | Fondo base (debajo del velo), texto de la tarjeta clara |
| `--fg` | `#ffffff` | Texto principal, bordes de acción, tarjeta clara, rellenos de estado activo |
| `--muted` | `rgba(255,255,255,.6)` | Texto secundario, etiquetas, ayuda |
| `--line` | `rgba(255,255,255,.14)` | Líneas finas entre filas y bordes de paneles |
| `--line-strong` | `rgba(255,255,255,.35)` | Bordes de botones secundarios y campos |
| `--on-light-muted` | `rgba(0,0,0,.6)` | Texto secundario dentro de la tarjeta clara |
| `--on-light-line` | `rgba(0,0,0,.15)` | Líneas dentro de la tarjeta clara |

Reglas:

- Interfaz solo en blanco, negro y grises. No se añaden colores de acento.
- El estado se distingue con texto, peso o inversión (blanco sobre negro ↔ negro sobre blanco), nunca con color.
- Fondo: `components/Veil.tsx`, el shader Dark Veil con WebGL directo, fijo detrás de toda la app a media resolución (`SCALE`). Se queda quieto con `prefers-reduced-motion`. Sin WebGL, queda negro.
- La tarjeta clara (`.card`) es el único objeto brillante por pantalla: el bloque actual en Hoy. El día de hoy en Semana usa la misma inversión.

## Tipografía

- Manrope (sustituto gratuito de Roobert, Google Fonts) en 300 y 400. 300 para cifras y títulos grandes, 400 para todo lo demás. Nunca 600 o más por encima de 45 px.
- Etiquetas a 12 px en mayúsculas con tracking 0,04 em (`.label`). Cifras con `tabular-nums` (`.mono`, `.big`, `.mid`).
- Los títulos grandes llevan interlineado apretado (0,9) y tracking ligeramente negativo.

| Uso | Tamaño |
|---|---|
| Título de página | de 40 px a 94 px según ancho, peso 300 (`h1.title`) |
| Título de la tarjeta | 39 px en móvil, 54 px en escritorio, peso 300 |
| Cifra grande | 39 px, peso 300 (`.big`) |
| Cifra media | 29 px, peso 300 (`.mid`) |
| Texto | 16 px; cuerpo de nota 18 px |
| Texto pequeño | 14 px (`.sm`) |
| Etiqueta | 12 px |

## Forma y espacio

- Radios: 0 en todo, salvo botones y grupos segmentados, que son píldora (`--pill`, 75 px). Nada intermedio.
- Sin sombras ni elevación. Los planos se separan con líneas de 1 px o con inversión.
- Campos: solo línea inferior. El área de texto lleva borde completo.
- Base de 4 px. Entre secciones, 46 px. Relleno de tarjeta, 34 px en escritorio.

## Movimiento

`--ease`: 0,4 s con `cubic-bezier(0.19, 1, 0.22, 1)` para color, fondo y borde. El velo se mueve despacio (`SPEED` en `Veil.tsx`).

## Disposición

- Móvil: cabecera fina con la marca y la fecha, una columna con 16 px de margen, barra inferior fija con cinco secciones.
- Escritorio (desde 900 px): columna lateral de 220 px con la marca, la navegación por grupos (nombre del grupo en 10 px y opacidad baja) y «Cerrar sesión» abajo; contenido centrado con 1078 px de ancho máximo.
- `.mob` se muestra solo en móvil y `.desk` solo en escritorio.

## Clases disponibles

| Grupo | Clases |
|---|---|
| Texto | `.label`, `.mono`, `.sm`, `.muted`, `.green` (hecho, ya sin color), `.strike`, `.big`, `.mid` |
| Disposición | `.row`, `.between`, `.stack`, `.stack-lg`, `.grow`, `.cols` |
| Superficies | `.veil` (lienzo del fondo), `.card` (clara), `.panel` (borde fino), `.tiles` y `.tile`, `.bar` |
| Listas | `.list`, `.item`, `.time`, `.empty` |
| Controles | `.btn` con `.primary` o `.ghost`; `.link`; `.x`; `.check`; `.input`, `.select`, `.textarea`; `.form`; `.seg` |
| Estado | `.dot` (punto del color del texto) |
| Accesibilidad | `.sr` (solo para lectores de pantalla) |

## Botones

Todos son píldoras transparentes con borde de 1 px.

- Acción principal: `.btn.primary` (borde blanco; se rellena de blanco al pasar por encima). Dentro de `.card`, en negro.
- Acción secundaria: `.btn.ghost` o `.btn` (borde gris).

Altura mínima de 44 px en todo lo que se pulsa.
