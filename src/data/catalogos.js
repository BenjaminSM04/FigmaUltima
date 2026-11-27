// Catálogos fijos del negocio: estados, roles, usuarios de demostración y menú.

export const ESTADOS = [
  { id: "recibido", nombre: "Recibido", color: "gray" },
  { id: "lavando", nombre: "Lavando", color: "info" },
  { id: "secando", nombre: "Secando", color: "purple" },
  { id: "planchando", nombre: "Planchando", color: "warning" },
  { id: "listo", nombre: "Listo para recoger", corto: "Listo", color: "success" },
  { id: "entregado", nombre: "Entregado", color: "primary" },
];

export const ESTADO = Object.fromEntries(ESTADOS.map((e) => [e.id, e]));

/** Texto del botón para avanzar desde cada estado. */
export const ACCION_AVANZAR = {
  recibido: "Empezar lavado",
  lavando: "Pasar a Secando",
  secando: "Pasar a Planchado",
  planchando: "Marcar como Listo",
};

export const TIPOS_INCIDENCIA = [
  "Mancha no salió",
  "Prenda dañada",
  "Falta una prenda",
  "Encogió / destiñó",
  "Otro",
];

export const METODOS_PAGO = ["Efectivo", "QR", "Transferencia"];

export const ROLES = {
  admin: { nombre: "Administrador", inicio: "/panel" },
  mostrador: { nombre: "Mostrador", inicio: "/pedidos" },
  operario: { nombre: "Operario", inicio: "/tablero" },
};

// Sin servidor: el "login" solo decide qué pantallas se muestran. No es seguridad real.
export const USUARIOS = [
  { usuario: "ernesto.vargas", nombre: "Ernesto Vargas", rol: "admin", pin: "1234" },
  { usuario: "rosa.quispe", nombre: "Rosa Quispe", rol: "mostrador", pin: "1234" },
  { usuario: "luis.mamani", nombre: "Luis Mamani", rol: "operario", pin: "1234" },
];

export const MENU = [
  { ruta: "/panel", etiqueta: "Panel", icono: "inicio", roles: ["admin"] },
  { ruta: "/pedidos/nuevo", etiqueta: "Nuevo pedido", corto: "Nuevo", icono: "mas", roles: ["admin", "mostrador"] },
  { ruta: "/pedidos", etiqueta: "Pedidos", icono: "pedidos", roles: ["admin", "mostrador", "operario"] },
  { ruta: "/tablero", etiqueta: "Tablero de trabajo", corto: "Tablero", icono: "tareas", roles: ["admin", "mostrador", "operario"] },
  { ruta: "/clientes", etiqueta: "Clientes", icono: "clientes", roles: ["admin", "mostrador"] },
  { ruta: "/domicilio", etiqueta: "Domicilio", icono: "ruta", roles: ["admin", "mostrador", "operario"] },
  { ruta: "/precios", etiqueta: "Precios", icono: "ajustes", roles: ["admin"] },
];

/** Busca la opción de menú más específica que cubre la ruta (/pedidos/0142 → Pedidos). */
export function puedeVer(rol, ruta) {
  const item = MENU.filter((m) => ruta === m.ruta || ruta.startsWith(m.ruta + "/")).sort(
    (a, b) => b.ruta.length - a.ruta.length
  )[0];
  return item ? item.roles.includes(rol) : false;
}
