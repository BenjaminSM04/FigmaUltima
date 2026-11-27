# El Vapor Azul — Sistema de pedidos (solo frontend)

Proyecto académico: sistema web **sin backend** para la Lavandería y Tintorería *El Vapor Azul*.
Primero se diseñó en Figma y luego se implementó en **React con JavaScript**.

- **Diseño (Figma):** https://www.figma.com/design/47vy1SC1Cc3v39AgGiDS3H
  - *Componentes*: variables de color y componentes base.
  - *Pantallas*: 9 pantallas de escritorio + ticket imprimible (prototipo conectado).
  - *Móvil*: 9 pantallas para operario/repartidor y dueño (prototipo conectado).
- **Paleta y variables CSS:** [docs/paleta.md](docs/paleta.md)
- **Animaciones:** [docs/animaciones.md](docs/animaciones.md)

## Cómo correrlo

Requisitos: Node.js 18 o superior.

```bash
npm install
npm run dev
```

Abrir la dirección que muestra la terminal (por defecto http://localhost:5173).

Para generar la versión final (carpeta `dist/`, se puede subir a cualquier hosting estático como GitHub Pages o Netlify):

```bash
npm run build
```

### Usuarios de prueba (PIN `1234`)

| Rol | Usuario | Pantalla inicial |
|---|---|---|
| Administrador | `ernesto.vargas` | Panel del día |
| Mostrador | `rosa.quispe` | Pedidos |
| Operario / repartidor | `luis.mamani` | Tablero de trabajo |

Al no haber servidor, el "login" solo decide qué pantallas se muestran; no es seguridad real.

## Qué hace cada pantalla

| Pantalla | Roles | Funciones |
|---|---|---|
| Panel del día | Admin | Pedidos de hoy, ropa no reclamada (registrar llamada), saldo por cobrar, ingresos del día, pedidos por estado |
| Nuevo pedido | Admin, Mostrador | Busca cliente por teléfono, servicio por kilo / tintorería / mixto, observaciones por prenda, express, domicilio, adelanto y ticket imprimible |
| Pedidos | Todos | Filtros por estado, servicio y periodo; búsqueda por ticket, nombre o teléfono; paginación |
| Detalle del pedido | Todos | Progreso de estados, cobro del saldo, incidencias, historial, ticket, entrega (bloqueada si hay saldo) |
| Tablero de trabajo | Todos | Columnas por estado; el botón mueve el pedido a la siguiente columna, con opción **Deshacer** |
| Clientes | Admin, Mostrador | Búsqueda, ficha con saldo y pedidos, alta y edición |
| Domicilio | Todos | Agenda por día y franja, "en camino", entregado/recogido, programar visitas |
| Precios | Admin | Precios por kilo, por prenda, recargos y reglas; restablecer datos de demostración |

En pantallas de menos de 900 px el menú lateral se convierte en una **barra inferior** (versión móvil).

## Estructura

```
src/
  App.jsx                 rutas y control de acceso por rol
  index.css               tokens de la paleta, layout y estilos responsivos
  data/
    catalogos.js          estados, roles, usuarios de prueba y menú
    semilla.js            datos de ejemplo (fechas relativas a "hoy")
  store/AppContext.jsx    estado global (useReducer) guardado en localStorage
  utils/                  formatos (Bs, fechas) y reglas del negocio
  ui/motion.js            tokens de animación (duraciones, curvas, resortes)
  components/             Botón, Badges, Campo, Selector, Hoja inferior, Modal, Layout, Ticket…
  pages/                  una pantalla por archivo
```

## Datos

Todo se guarda en `localStorage` del navegador (`vapor-azul:datos:v1`). Para volver a los datos de ejemplo:
**Precios → Restablecer datos** (como administrador) o borrar el almacenamiento del sitio.

## Animaciones implementadas (Motion)

- Entrada de cada pantalla (fade + desliz) con el menú fijo.
- Indicador del menú lateral, de la barra inferior, de los selectores y de los chips que **se desliza** (`layoutId`).
- **Tablero:** la tarjeta viaja a la siguiente columna al avanzar de estado, y los contadores saltan.
- Números del panel que cuentan, barras que crecen y filas que aparecen escalonadas.
- Nuevo pedido: filas de prendas que se expanden y colapsan, y total que hace "tick" al cambiar.
- Hoja inferior que sube con resorte y se cierra arrastrando hacia abajo.
- Modal del ticket, toasts con **Deshacer**, confirmación de entrega con check que se dibuja.
- PIN incorrecto: la tarjeta de login tiembla.
- Se respeta la opción del sistema "reducir movimiento".
