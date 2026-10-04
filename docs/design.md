# Diseño

Referencia: una superficie de control negra donde el único objeto brillante es el trabajo en curso. Tema oscuro siempre. La profundidad sale del contraste y del espacio, nunca de sombras.

## Colores

Definidos como variables en `app/globals.css`.

| Variable | Valor | Uso |
|---|---|---|
| `--canvas` | `#101010` | Fondo de toda la app |
| `--lift` | `#1d1a18` | Superficies elevadas, campos, líneas finas entre filas |
| `--stroke` | `#3d3a39` | Bordes de campos y botones fantasma, pista de las barras |
| `--mid` | `#4d4947` | Texto secundario dentro de la tarjeta clara |
| `--muted` | `#8a8380` | Texto apagado |
| `--pale` | `#b8b3b0` | Etiquetas y texto terciario |
| `--bone` | `#eeeeee` | Texto principal y tarjeta clara |
| `--chalk` | `#fafafa` | Botón claro |
| `--orange` | `#ee6018` | Estado en vivo: bloque en curso, recordatorio vencido |
| `--green` | `#a0ca92` | Estado positivo: hecho, guardado |

Reglas:

- El naranja y el verde son solo para datos y estado. Nunca en botones, fondos ni textos grandes.
- No se añaden más colores de acento.
- La tarjeta clara (`--bone` sobre `--canvas`) se reserva para una sola cosa por pantalla: el bloque actual en Hoy, el día de hoy en Semana.

## Tipografía

- Geist en peso 400 para todo. Peso 500 solo si una etiqueta debe destacar en una superficie densa. Nunca 600 o más.
- Geist Mono a 12 px, en mayúsculas, para etiquetas, horas, contadores y navegación (clases `.label` y `.mono`).
- Tracking negativo que crece con el tamaño: 72 px a -2,88 px; 44 px a -1,1 px; 36 px a -1,12 px; 12 px a -0,24 px.
- Interlineado entre 1 y 1,5. Sin serifas ni otras familias.

| Uso | Tamaño |
|---|---|
| Título de página | 44 px en móvil, 72 px en escritorio (`h1.title`) |
| Cifra grande | 36 px (`.big`) |
| Cifra media | 24 px (`.mid`) |
| Título de la tarjeta | 28 px en móvil, 36 px en escritorio |
| Texto | 16 px |
| Texto pequeño | 14 px (`.sm`) |
| Etiqueta | 12 px mono |

## Forma y espacio

- Radios: 3 px en botones y campos, 10 px en tarjetas y paneles, 20 px solo en paneles muy grandes.
- Sin sombras, brillos, desenfoques ni degradados.
- Espaciado en múltiplos de 8. Entre secciones, 32 px.
- Las listas se separan con líneas de 1 px en `--lift`, sin tarjetas alrededor.
- Bordes de 1 px.

## Movimiento

Transiciones de 0,15 s con `cubic-bezier(0.4, 0, 0.2, 1)` (variable `--ease`), solo en color, fondo y borde. Sin rebotes, parallax ni animaciones de entrada.

## Disposición

- Móvil: cabecera fina, contenido en una columna con 16 px de margen, barra inferior fija con cinco secciones.
- Escritorio (desde 900 px): columna lateral de 232 px con la navegación y la meta de la semana; contenido con 48 px de margen y 1200 px de ancho máximo.
- `.mob` se muestra solo en móvil y `.desk` solo en escritorio.

## Clases disponibles

| Grupo | Clases |
|---|---|
| Texto | `.label`, `.mono`, `.sm`, `.muted`, `.green`, `.strike`, `.big`, `.mid` |
| Disposición | `.row`, `.between`, `.stack`, `.stack-lg`, `.grow`, `.cols` |
| Superficies | `.card` (clara), `.panel` (borde fino), `.tiles` y `.tile`, `.bar` |
| Listas | `.list`, `.item`, `.time`, `.empty` |
| Controles | `.btn` con `.light`, `.dark` o `.ghost`; `.link`; `.x`; `.check`; `.input`, `.select`, `.textarea`; `.form`; `.seg` |
| Estado | `.dot` (punto naranja) |
| Accesibilidad | `.sr` (solo para lectores de pantalla) |

## Botones

- Acción principal sobre fondo oscuro: `.btn.light`.
- Acción principal dentro de la tarjeta clara: `.btn.dark`.
- Acción secundaria: `.btn.ghost`.
- Acción neutra sobre fondo oscuro: `.btn`.

Altura mínima de 44 px en todo lo que se pulsa.
