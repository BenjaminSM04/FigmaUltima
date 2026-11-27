// Datos de ejemplo para la demostración. Las fechas se calculan respecto a "ahora",
// así la demo siempre tiene pedidos de hoy, atrasados y ropa sin recoger.
import { calcularLineas } from "../utils/pedidos";

const HORA = 3600000;
const DIA = 24 * HORA;

// Mantiene las horas dentro del horario de atención (08:00 a 19:30)
function enHorario(d, hacia) {
  const h = d.getHours() + d.getMinutes() / 60;
  if (h > 19.5) {
    if (hacia === "futuro") { d.setDate(d.getDate() + 1); d.setHours(10, 0, 0, 0); }
    else d.setHours(19, 15, 0, 0);
  } else if (h < 8) {
    if (hacia === "futuro") d.setHours(10, 0, 0, 0);
    else { d.setDate(d.getDate() - 1); d.setHours(18, 0, 0, 0); }
  }
  return d;
}

const haceHoras = (h) => enHorario(new Date(Date.now() - h * HORA), "pasado").toISOString();
/** Fecha dentro de h horas, redondeada a la media hora y dentro del horario. */
const enHoras = (h) => {
  const d = new Date(Date.now() + h * HORA);
  d.setMinutes(d.getMinutes() < 30 ? 0 : 30, 0, 0);
  return enHorario(d, h >= 0 ? "futuro" : "pasado").toISOString();
};
const hoyA = (h, m = 0) => {
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d.toISOString();
};

export const PRECIOS_INICIALES = {
  kilo: 12,
  planchado: 5,
  minimoKg: 3,
  expressPct: 50,
  delivery: 10,
  diasAviso: 7,
  adelantoPct: 50,
  prendas: [
    { id: "terno", nombre: "Terno 2 piezas", dias: 3, precio: 45 },
    { id: "saco", nombre: "Saco / blazer", dias: 2, precio: 28 },
    { id: "pantalon", nombre: "Pantalón de vestir", dias: 2, precio: 18 },
    { id: "camisa", nombre: "Camisa (planchado)", dias: 1, precio: 8 },
    { id: "vestido", nombre: "Vestido", dias: 3, precio: 40 },
    { id: "fiesta", nombre: "Vestido de fiesta / largo", dias: 5, precio: 60 },
    { id: "abrigo", nombre: "Abrigo / chamarra", dias: 3, precio: 55 },
    { id: "cortina", nombre: "Cortina (por m²)", dias: 4, precio: 15 },
    { id: "edredon", nombre: "Edredón 2 plazas", dias: 3, precio: 70 },
  ],
};

export const CLIENTES_INICIALES = [
  { id: "c1", nombre: "María Fernanda Rojas", telefono: "7654 3210", direccion: "Av. Ballivián 1220, Dpto. 3B", nota: "Sin suavizante (alergia)", desde: "2019-03-10" },
  { id: "c2", nombre: "Hotel Los Andes", telefono: "4 452 9900", direccion: "Av. Heroínas 455", nota: "Factura a nombre del hotel", desde: "2020-06-01" },
  { id: "c3", nombre: "Gabriel Soria", telefono: "7012 4455", direccion: "", nota: "", desde: "2026-09-14" },
  { id: "c4", nombre: "Restaurante El Fogón", telefono: "4 466 1020", direccion: "Calle España 210", nota: "", desde: "2021-01-20" },
  { id: "c5", nombre: "Pedro Choque", telefono: "7155 8890", direccion: "Calle Tarija 77", nota: "Casa portón verde", desde: "2024-02-02" },
  { id: "c6", nombre: "Ana Lucía Torres", telefono: "7781 2233", direccion: "", nota: "", desde: "2023-05-11" },
  { id: "c7", nombre: "Jorge Salinas", telefono: "6990 1122", direccion: "Av. América 320, of. 4", nota: "", desde: "2025-08-08" },
  { id: "c8", nombre: "Carla Méndez", telefono: "7322 6677", direccion: "", nota: "Prefiere WhatsApp", desde: "2022-10-30" },
  { id: "c9", nombre: "Lucía Fernández", telefono: "7600 1188", direccion: "", nota: "", desde: "2026-01-15" },
  { id: "c10", nombre: "Familia Gutiérrez", telefono: "7444 5566", direccion: "Calle Jordán 1180", nota: "", desde: "2021-07-07" },
  { id: "c11", nombre: "Ricardo Vela", telefono: "7233 9080", direccion: "", nota: "", desde: "2025-03-03" },
  { id: "c12", nombre: "Sofía Camacho", telefono: "7900 3344", direccion: "Av. Pando 1540", nota: "", desde: "2026-11-02" },
  { id: "c13", nombre: "Marco Antonio Ríos", telefono: "7011 2020", direccion: "", nota: "", desde: "2024-12-12" },
  { id: "c14", nombre: "Silvia Paredes", telefono: "7688 4411", direccion: "", nota: "", desde: "2023-04-19" },
  { id: "c15", nombre: "Diego Arce", telefono: "7799 0012", direccion: "", nota: "", desde: "2025-10-10" },
];

const ORDEN = ["recibido", "lavando", "secando", "planchando", "listo", "entregado"];
const precioDe = (id) => PRECIOS_INICIALES.prendas.find((p) => p.id === id).precio;
let idPrenda = 1;

function pedido(ticket, clienteId, o) {
  const {
    haceH, entregaH, estado, kilo = null, prendas = [], pagado = 0, metodo = "Efectivo",
    express = false, tipoEntrega = "tienda", incidencia = null, listoHaceDias = null,
  } = o;
  const recibido = haceHoras(haceH);
  const items = prendas.map((p) => ({
    id: "p" + idPrenda++,
    tipoId: p.tipoId,
    nombre: p.nombre || PRECIOS_INICIALES.prendas.find((x) => x.id === p.tipoId).nombre,
    color: p.color || "",
    obs: p.obs || "",
    precio: p.precio ?? precioDe(p.tipoId),
  }));
  const { lineas, total } = calcularLineas({ kilo, prendas: items, express, tipoEntrega }, PRECIOS_INICIALES);

  // Historial con horas repartidas entre la recepción y el último cambio
  const pasos = ORDEN.slice(0, ORDEN.indexOf(estado) + 1).filter(
    (e) => e !== "planchando" || kilo?.planchado || items.length
  );
  const inicio = new Date(recibido).getTime();
  const fin = listoHaceDias != null ? Date.now() - listoHaceDias * DIA : Date.now() - 0.5 * HORA;
  const paso = pasos.length > 1 ? Math.min(3 * HORA, (fin - inicio) / (pasos.length - 1)) : 0;
  const historial = pasos.map((e, i) => ({
    estado: e,
    fecha: new Date(i === pasos.length - 1 && i > 0 ? fin : inicio + i * paso).toISOString(),
    usuario: e === "recibido" || e === "entregado" ? "Rosa Quispe" : "Luis Mamani",
  }));

  const montoPagado = pagado === "todo" ? total : pagado;
  return {
    ticket,
    clienteId,
    recibido,
    entrega: enHoras(entregaH),
    estado,
    kilo,
    prendas: items,
    lineas,
    total,
    pagos: montoPagado > 0 ? [{ monto: montoPagado, metodo, fecha: recibido }] : [],
    historial,
    tipoEntrega,
    express,
    incidencia,
    avisos: [],
    recibidoPor: "Rosa Quispe",
  };
}

export function crearPedidosIniciales() {
  idPrenda = 1;
  const lista = [
    pedido("0146", "c3", { haceH: 2, entregaH: 72, estado: "recibido", prendas: [{ tipoId: "abrigo", color: "Gris" }] }),
    pedido("0145", "c2", { haceH: 4, entregaH: 5, estado: "recibido", kilo: { kg: 24, planchado: false }, express: true, pagado: "todo", metodo: "QR", tipoEntrega: "domicilio" }),
    pedido("0144", "c1", { haceH: 5, entregaH: 30, estado: "recibido", kilo: { kg: 6.5, planchado: true }, pagado: 100, metodo: "QR",
      prendas: [{ tipoId: "terno", color: "Azul marino", obs: "Falta botón en manga izquierda" }, { tipoId: "fiesta", nombre: "Vestido largo", color: "Rojo", obs: "Mancha de vino en la falda" }] }),
    pedido("0143", "c4", { haceH: 20, entregaH: 6, estado: "lavando", kilo: { kg: 12, planchado: false }, express: true }),
    pedido("0142", "c1", { haceH: 56, entregaH: 3, estado: "planchando", kilo: { kg: 5, planchado: true }, pagado: 100,
      prendas: [{ tipoId: "terno", color: "Azul marino", obs: "Falta botón en manga izquierda" }, { tipoId: "fiesta", nombre: "Vestido largo", color: "Rojo", obs: "Mancha de vino en la falda" }],
      incidencia: { prenda: "Vestido largo", tipo: "Mancha no salió", texto: "La mancha de vino no salió por completo. Llamar a la clienta antes de la entrega.", fecha: haceHoras(8), por: "Luis Mamani", avisado: false } }),
    pedido("0141", "c5", { haceH: 50, entregaH: 4, estado: "listo", kilo: { kg: 6, planchado: false }, pagado: "todo", tipoEntrega: "domicilio", listoHaceDias: 0 }),
    pedido("0140", "c6", { haceH: 52, entregaH: 2, estado: "planchando", kilo: { kg: 5, planchado: true }, pagado: 42.5 }),
    pedido("0139", "c10", { haceH: 26, entregaH: 20, estado: "lavando", kilo: { kg: 9, planchado: true }, tipoEntrega: "domicilio" }),
    pedido("0138", "c2", { haceH: 54, entregaH: 5, estado: "secando", kilo: { kg: 18, planchado: false }, express: true, pagado: "todo", metodo: "Transferencia", tipoEntrega: "domicilio" }),
    pedido("0137", "c11", { haceH: 28, entregaH: 22, estado: "secando", kilo: { kg: 4, planchado: true } }),
    pedido("0135", "c7", { haceH: 80, entregaH: -2, estado: "listo", prendas: [{ tipoId: "terno", color: "Negro" }], tipoEntrega: "domicilio", listoHaceDias: 0 }),
    pedido("0131", "c8", { haceH: 100, entregaH: -22, estado: "planchando", kilo: { kg: 7, planchado: true }, pagado: 64, prendas: [{ tipoId: "pantalon", color: "Beige" }] }),
    pedido("0128", "c10", { haceH: 70, entregaH: -6, estado: "entregado", kilo: { kg: 8, planchado: true }, pagado: "todo", tipoEntrega: "domicilio" }),
    pedido("0119", "c1", { haceH: 15 * 24, entregaH: -13 * 24, estado: "entregado", kilo: { kg: 6, planchado: false }, pagado: "todo" }),
    pedido("0117", "c15", { haceH: 10 * 24, entregaH: -8 * 24, estado: "listo", kilo: { kg: 4, planchado: true }, listoHaceDias: 8 }),
    pedido("0110", "c14", { haceH: 13 * 24, entregaH: -10 * 24, estado: "listo", prendas: [{ tipoId: "vestido", color: "Verde" }], pagado: 20, listoHaceDias: 10 }),
    pedido("0104", "c13", { haceH: 17 * 24, entregaH: -15 * 24, estado: "listo", kilo: { kg: 5, planchado: false }, pagado: "todo", listoHaceDias: 15 }),
    pedido("0098", "c9", { haceH: 24 * 24, entregaH: -21 * 24, estado: "listo",
      prendas: [{ tipoId: "camisa", color: "Blanca" }, { tipoId: "camisa", color: "Celeste" }, { tipoId: "camisa", color: "Blanca" }], listoHaceDias: 21 }),
  ];
  // Pagos de hoy para que el panel muestre ingresos del día
  const p128 = lista.find((p) => p.ticket === "0128");
  p128.pagos = [{ monto: 30, metodo: "Efectivo", fecha: p128.recibido }, { monto: p128.total - 30, metodo: "QR", fecha: haceHoras(1) }];
  return lista;
}

export function crearVisitasIniciales() {
  const manana = (h) => new Date(new Date(hoyA(h)).getTime() + DIA).toISOString();
  return [
    { id: "v1", tipo: "recojo", clienteId: "c2", ticket: "0145", fecha: hoyA(9), franja: "09:00 – 11:00", direccion: "Av. Heroínas 455", nota: "", estado: "realizado" },
    { id: "v2", tipo: "entrega", clienteId: "c10", ticket: "0128", fecha: hoyA(9), franja: "09:00 – 11:00", direccion: "Calle Jordán 1180", nota: "", estado: "realizado" },
    { id: "v3", tipo: "entrega", clienteId: "c7", ticket: "0135", fecha: hoyA(11), franja: "11:00 – 13:00", direccion: "Av. América 320, of. 4", nota: "Preguntar por Jorge en recepción", estado: "en_camino" },
    { id: "v4", tipo: "recojo", clienteId: "c4", ticket: null, fecha: hoyA(11), franja: "11:00 – 13:00", direccion: "Calle España 210", nota: "Manteles del fin de semana", estado: "programado" },
    { id: "v5", tipo: "entrega", clienteId: "c2", ticket: "0138", fecha: hoyA(15), franja: "15:00 – 18:00", direccion: "Av. Heroínas 455", nota: "", estado: "programado" },
    { id: "v6", tipo: "entrega", clienteId: "c5", ticket: "0141", fecha: hoyA(15), franja: "15:00 – 18:00", direccion: "Calle Tarija 77", nota: "Casa portón verde", estado: "programado" },
    { id: "v7", tipo: "recojo", clienteId: "c12", ticket: null, fecha: hoyA(15), franja: "15:00 – 18:00", direccion: "Av. Pando 1540", nota: "", estado: "programado" },
    { id: "v8", tipo: "entrega", clienteId: "c1", ticket: "0144", fecha: manana(15), franja: "15:00 – 18:00", direccion: "Av. Ballivián 1220, Dpto. 3B", nota: "Tocar timbre 3B", estado: "programado" },
  ];
}

export function crearDatosIniciales() {
  return {
    precios: structuredClone(PRECIOS_INICIALES),
    clientes: structuredClone(CLIENTES_INICIALES),
    pedidos: crearPedidosIniciales(),
    visitas: crearVisitasIniciales(),
  };
}
