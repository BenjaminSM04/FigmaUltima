// Componentes base que corresponden a los componentes de Figma (página "Componentes").
import { motion, AnimatePresence, useDragControls } from "motion/react";
import { useEffect, useRef } from "react";
import { animate } from "motion";
import { ESTADO } from "../data/catalogos";
import { dur, ease, resorte } from "../ui/motion";
import Icono from "./Icono";

/* ---------- Botón (Primario / Secundario / Peligro / Fantasma) ---------- */
export function Boton({ tipo = "primario", icono, bloque, className = "", children, ...resto }) {
  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      transition={{ duration: dur.rapida }}
      className={`btn btn-${tipo} ${bloque ? "btn-bloque" : ""} ${className}`}
      {...resto}
    >
      {icono && <Icono nombre={icono} tam={18} />}
      {children}
    </motion.button>
  );
}

/* ---------- Badges de estado y pago ---------- */
const COLOR_ESTADO = { ...Object.fromEntries(Object.values(ESTADO).map((e) => [e.id, e.color])), incidencia: "danger" };
const NOMBRE_ESTADO = { ...Object.fromEntries(Object.values(ESTADO).map((e) => [e.id, e.nombre])), incidencia: "Incidencia" };

/** Al cambiar de estado, el badge hace un pequeño "pop" (key = estado). */
export function BadgeEstado({ estado, corto }) {
  return (
    <motion.span
      key={estado}
      initial={{ scale: 0.85, opacity: 0.4 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={resorte}
      className={`badge badge-${COLOR_ESTADO[estado]}`}
    >
      <span className="badge-punto" />
      {corto && ESTADO[estado]?.corto ? ESTADO[estado].corto : NOMBRE_ESTADO[estado]}
    </motion.span>
  );
}

const PAGO = { pagado: ["success", "Pagado"], parcial: ["warning", "Parcial"], pendiente: ["danger", "Pendiente"] };
export function BadgePago({ estado }) {
  const [color, texto] = PAGO[estado];
  return (
    <motion.span key={estado} initial={{ scale: 0.85 }} animate={{ scale: 1 }} transition={resorte} className={`badge badge-${color}`}>
      <span className="badge-punto" />
      {texto}
    </motion.span>
  );
}

export function Etiqueta({ color = "gray", children }) {
  return <span className={`etiqueta etiqueta-${color}`}>{children}</span>;
}

/* ---------- Campos de formulario ---------- */
export function Campo({ etiqueta, id, className = "", children, ...resto }) {
  return (
    <label className={`campo ${className}`} htmlFor={id}>
      <span className="campo-etiqueta">{etiqueta}</span>
      {children ?? <input id={id} className="campo-control" {...resto} />}
    </label>
  );
}

/** Selector segmentado: el fondo blanco se desliza a la opción activa. */
export function Selector({ opciones, valor, onCambio, nombre, bloque }) {
  return (
    <div className={`selector ${bloque ? "selector-bloque" : ""}`} role="radiogroup">
      {opciones.map((o) => {
        const id = typeof o === "string" ? o : o.valor;
        const texto = typeof o === "string" ? o : o.texto;
        const activo = id === valor;
        return (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={activo}
            className={`selector-opcion ${activo ? "activa" : ""}`}
            onClick={() => onCambio(id)}
          >
            {activo && <motion.span layoutId={`selector-${nombre}`} className="selector-fondo" transition={resorte} />}
            <span className="selector-texto">{texto}</span>
          </button>
        );
      })}
    </div>
  );
}

/** Checkbox con el check que se dibuja. */
export function Casilla({ marcado, onCambio, children }) {
  return (
    <label className="casilla">
      <input type="checkbox" checked={marcado} onChange={(e) => onCambio(e.target.checked)} />
      <span className={`casilla-caja ${marcado ? "marcada" : ""}`}>
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none">
          <motion.path
            d="m5 12 5 5 9-10"
            stroke="#fff"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={false}
            animate={{ pathLength: marcado ? 1 : 0 }}
            transition={{ duration: dur.rapida }}
          />
        </svg>
      </span>
      <span>{children}</span>
    </label>
  );
}

/** Chip de filtro con contador. */
export function Chip({ activo, onClick, contador, children, nombre = "chip" }) {
  return (
    <button type="button" className={`chip ${activo ? "activo" : ""}`} onClick={onClick}>
      {activo && <motion.span layoutId={`chip-${nombre}`} className="chip-fondo" transition={resorte} />}
      <span className="chip-texto">{children}</span>
      {contador != null && <span className="chip-contador">{contador}</span>}
    </button>
  );
}

/* ---------- Tarjetas ---------- */
export function Tarjeta({ titulo, subtitulo, accion, className = "", children, ...resto }) {
  return (
    <section className={`tarjeta ${className}`} {...resto}>
      {(titulo || accion) && (
        <header className="tarjeta-cabecera">
          <div>
            {titulo && <h2 className="tarjeta-titulo">{titulo}</h2>}
            {subtitulo && <p className="texto-suave">{subtitulo}</p>}
          </div>
          {accion}
        </header>
      )}
      {children}
    </section>
  );
}

/** Número que cuenta desde 0 la primera vez que aparece (Panel). */
export function Contador({ valor, formato = (v) => Math.round(v).toLocaleString("es-BO") }) {
  const ref = useRef(null);
  const previo = useRef(0);
  useEffect(() => {
    const control = animate(previo.current, valor, {
      duration: 0.6,
      ease: ease.salida,
      onUpdate: (v) => {
        if (ref.current) ref.current.textContent = formato(v);
      },
    });
    previo.current = valor;
    return () => control.stop();
  }, [valor]); // eslint-disable-line react-hooks/exhaustive-deps
  return <span ref={ref}>{formato(0)}</span>;
}

export function StatCard({ titulo, valor, formato, detalle, colorDetalle }) {
  return (
    <div className="stat">
      <span className="stat-titulo">{titulo}</span>
      <strong className="stat-valor">
        <Contador valor={valor} formato={formato} />
      </strong>
      <span className={`stat-detalle ${colorDetalle ? "texto-" + colorDetalle : ""}`}>{detalle}</span>
    </div>
  );
}

export function Alerta({ tipo = "warning", icono = "alerta", children, accion }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0, marginTop: 0, paddingTop: 0, paddingBottom: 0 }}
      transition={{ duration: dur.normal, ease: ease.salida }}
      className={`alerta alerta-${tipo}`}
      role="status"
    >
      <Icono nombre={icono} tam={18} />
      <div className="alerta-texto">{children}</div>
      {accion}
    </motion.div>
  );
}

export function Vacio({ children }) {
  return <p className="vacio">{children}</p>;
}

/* ---------- Capas: modal y hoja inferior ---------- */
export function Modal({ abierto, onCerrar, children, ancho = 420, etiqueta }) {
  return (
    <AnimatePresence>
      {abierto && (
        <div className="capa" role="dialog" aria-modal="true" aria-label={etiqueta}>
          <motion.div
            className="capa-fondo"
            onClick={onCerrar}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.div
            className="modal"
            style={{ maxWidth: ancho }}
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: dur.normal, ease: ease.salida }}
          >
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

/** Hoja que sube desde abajo; se puede cerrar arrastrando hacia abajo. En escritorio se ve como panel centrado. */
export function HojaInferior({ abierta, onCerrar, titulo, subtitulo, children }) {
  const arrastre = useDragControls();
  return (
    <AnimatePresence>
      {abierta && (
        <div className="capa capa-hoja" role="dialog" aria-modal="true" aria-label={titulo}>
          <motion.div
            className="capa-fondo"
            onClick={onCerrar}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.section
            className="hoja"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={resorte}
            drag="y"
            dragControls={arrastre}
            dragListener={false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={(_, info) => info.offset.y > 120 && onCerrar()}
          >
            <div className="hoja-zona-agarre" onPointerDown={(e) => arrastre.start(e)}>
              <div className="hoja-agarre" />
            </div>
            <header className="hoja-cabecera" onPointerDown={(e) => arrastre.start(e)}>
              <h2>{titulo}</h2>
              {subtitulo && <p className="texto-suave">{subtitulo}</p>}
            </header>
            {children}
          </motion.section>
        </div>
      )}
    </AnimatePresence>
  );
}
