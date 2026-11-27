// Reglas del negocio sobre pedidos: totales, saldos, estados y avisos.
import { bs } from "./formato";

export const redondear = (n) => Math.round(n * 100) / 100;
export const kgTexto = (n) => String(n).replace(".", ",");

export const totalPagado = (p) => redondear(p.pagos.reduce((s, x) => s + x.monto, 0));
export const saldo = (p) => Math.max(0, redondear(p.total - totalPagado(p)));

export function estadoPago(p) {
  const pagado = totalPagado(p);
  if (pagado >= p.total - 0.001) return "pagado";
  if (pagado > 0) return "parcial";
  return "pendiente";
}

export const requierePlanchado = (p) => Boolean(p.kilo?.planchado) || p.prendas.length > 0;

const FLUJO = ["recibido", "lavando", "secando", "planchando", "listo"];

/** Siguiente paso del trabajo; salta "planchando" si el pedido no lleva planchado. */
export function siguienteEstado(p) {
  const i = FLUJO.indexOf(p.estado);
  if (i < 0 || i >= FLUJO.length - 1) return null;
  const sig = FLUJO[i + 1];
  if (sig === "planchando" && !requierePlanchado(p)) return "listo";
  return sig;
}

export const incidenciaAbierta = (p) => Boolean(p.incidencia) && !p.incidencia.avisado;

/** Estado que se muestra en el badge: una incidencia abierta tiene prioridad. */
export const estadoVisible = (p) => (incidenciaAbierta(p) ? "incidencia" : p.estado);

export const atrasado = (p) =>
  !["listo", "entregado"].includes(p.estado) && new Date(p.entrega) < new Date();

export function fechaListo(p) {
  const h = [...p.historial].reverse().find((x) => x.estado === "listo");
  return h ? h.fecha : null;
}

/** Días que la ropa lleva lista sin que el cliente la recoja. */
export function diasSinRecoger(p) {
  if (p.estado !== "listo") return 0;
  const f = fechaListo(p);
  return f ? Math.floor((Date.now() - new Date(f)) / 86400000) : 0;
}

export function tipoServicio(p) {
  if (p.kilo && p.prendas.length) return "Mixto";
  return p.kilo ? "Por kilo" : "Tintorería";
}

export function resumenPedido(p) {
  const partes = [];
  if (p.kilo) partes.push(`${kgTexto(p.kilo.kg)} kg${p.kilo.planchado ? " · con planchado" : ""}`);
  if (p.prendas.length === 1) partes.push(p.prendas[0].nombre);
  else if (p.prendas.length > 1) partes.push(`${p.prendas.length} prendas tintorería`);
  return partes.join(" + ");
}

/**
 * Calcula las líneas del pedido con la lista de precios vigente.
 * Las líneas se guardan en el pedido: si luego cambian los precios, el pedido no cambia.
 */
export function calcularLineas({ kilo, prendas, express, tipoEntrega }, precios) {
  const lineas = [];
  if (kilo && kilo.kg > 0) {
    const kg = Math.max(kilo.kg, precios.minimoKg);
    lineas.push({
      concepto: `Lavado por kilo (${kgTexto(kg)} kg × ${bs(precios.kilo)})`,
      monto: redondear(kg * precios.kilo),
    });
    if (kilo.planchado) {
      lineas.push({
        concepto: `Planchado (${kgTexto(kg)} kg × ${bs(precios.planchado)})`,
        monto: redondear(kg * precios.planchado),
      });
    }
  }
  for (const pr of prendas) {
    lineas.push({ concepto: pr.nombre + (pr.color ? ` (${pr.color})` : ""), monto: Number(pr.precio) || 0 });
  }
  const subtotal = lineas.reduce((s, l) => s + l.monto, 0);
  if (express && subtotal > 0) {
    lineas.push({ concepto: `Express (+${precios.expressPct}%)`, monto: redondear((subtotal * precios.expressPct) / 100) });
  }
  if (tipoEntrega === "domicilio") {
    lineas.push({ concepto: "Entrega a domicilio", monto: precios.delivery });
  }
  return { lineas, total: redondear(lineas.reduce((s, l) => s + l.monto, 0)) };
}

export const esHoy = (iso) => new Date(iso).toDateString() === new Date().toDateString();
