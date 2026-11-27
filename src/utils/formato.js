// Formatos de dinero y fechas en español (Bolivia)

export function bs(monto) {
  const n = Number(monto) || 0;
  const tieneDecimales = Math.round(n * 100) % 100 !== 0;
  return (
    "Bs " +
    n.toLocaleString("es-BO", {
      minimumFractionDigits: tieneDecimales ? 2 : 0,
      maximumFractionDigits: 2,
    })
  );
}

const DIAS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

const dosDigitos = (n) => String(n).padStart(2, "0");

export const hora = (iso) => {
  const d = new Date(iso);
  return `${dosDigitos(d.getHours())}:${dosDigitos(d.getMinutes())}`;
};

export const fechaCorta = (iso) => {
  const d = new Date(iso);
  return `${dosDigitos(d.getDate())}/${dosDigitos(d.getMonth() + 1)}`;
};

export const fechaHora = (iso) => `${fechaCorta(iso)} ${hora(iso)}`;

export const fechaLarga = (iso = new Date().toISOString()) => {
  const d = new Date(iso);
  return `${DIAS[d.getDay()]} ${d.getDate()} ${MESES[d.getMonth()]} ${d.getFullYear()}`;
};

/** Diferencia en días de calendario entre hoy y la fecha (negativo = pasado). */
export function diasDesdeHoy(iso) {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const d = new Date(iso);
  d.setHours(0, 0, 0, 0);
  return Math.round((d - hoy) / 86400000);
}

/** "Hoy 15:00", "Mañana 10:00", "Ayer 18:00" o "Sáb 28/11". */
export function diaRelativo(iso, conHora = true) {
  const dif = diasDesdeHoy(iso);
  const h = conHora ? ` ${hora(iso)}` : "";
  if (dif === 0) return `Hoy${h}`;
  if (dif === 1) return `Mañana${h}`;
  if (dif === -1) return `Ayer${h}`;
  const d = new Date(iso);
  return `${DIAS[d.getDay()]} ${fechaCorta(iso)}`;
}

/** Valor para <input type="date"> */
export const aInputFecha = (iso) => {
  const d = new Date(iso);
  return `${d.getFullYear()}-${dosDigitos(d.getMonth() + 1)}-${dosDigitos(d.getDate())}`;
};

export const iniciales = (nombre) =>
  nombre
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join("");
