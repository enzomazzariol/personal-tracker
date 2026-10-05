/** Secciones de la app agrupadas por propósito. Única fuente para la cabecera, la barra inferior y «Más». */
export type NavItem = { href: string; label: string; /** Va en la barra inferior del móvil (máximo 4; el quinto hueco es «Más»). */ mobile?: boolean }
export type NavGroup = { label: string; items: NavItem[] }

export const NAV: NavGroup[] = [
  {
    label: 'Plan',
    items: [
      { href: '/', label: 'Hoy', mobile: true },
      { href: '/semana', label: 'Semana', mobile: true },
      { href: '/revision', label: 'Revisión' },
      { href: '/metas', label: 'Metas' },
    ],
  },
  {
    label: 'Trabajo',
    items: [
      { href: '/tareas', label: 'Tareas', mobile: true },
      { href: '/proyectos', label: 'Proyectos', mobile: true },
      { href: '/ofertas', label: 'Ofertas' },
    ],
  },
  {
    label: 'Vida',
    items: [
      { href: '/lectura', label: 'Lectura' },
      { href: '/estudio', label: 'Estudio' },
      { href: '/diario', label: 'Diario' },
    ],
  },
  {
    label: 'Apuntes',
    items: [
      { href: '/notas', label: 'Notas' },
      { href: '/recordatorios', label: 'Recordatorios' },
    ],
  },
]

const ITEMS = NAV.flatMap((g) => g.items)
export const MOBILE_ITEMS = ITEMS.filter((i) => i.mobile)
/** Grupos con solo las secciones que no caben en la barra inferior: el contenido de «Más». */
export const MORE_GROUPS = NAV.map((g) => ({ ...g, items: g.items.filter((i) => !i.mobile) })).filter((g) => g.items.length > 0)

/** La sección `href` está abierta en `path`, incluidas sus subpáginas (/proyectos/123). */
export const isIn = (path: string, href: string) => (href === '/' ? path === '/' : path === href || path.startsWith(`${href}/`))
