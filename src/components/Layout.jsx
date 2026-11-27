// Estructura general: menú lateral (escritorio), barra inferior (móvil), transición entre pantallas y toasts.
import { useState } from "react";
import { NavLink, useLocation, useNavigate, useOutlet } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { MENU, ROLES } from "../data/catalogos";
import { useApp } from "../store/AppContext";
import { fechaLarga, iniciales } from "../utils/formato";
import { pagina, resorte, dur, ease } from "../ui/motion";
import Icono, { Logo } from "./Icono";
import { HojaInferior } from "./ui";

export default function Layout() {
  const { sesion } = useApp();
  const ubicacion = useLocation();
  const salida = useOutlet();
  const items = MENU.filter((m) => m.roles.includes(sesion.rol));

  return (
    <div className="app">
      <MenuLateral items={items} />
      <main className="principal">
        {/* Solo se anima la entrada de cada pantalla: el cambio es inmediato y nunca se queda esperando una salida */}
        <motion.div key={ubicacion.pathname} className="pagina" initial={pagina.initial} animate={pagina.animate}>
          {salida}
        </motion.div>
      </main>
      <BarraInferior items={items} />
      <Toasts />
    </div>
  );
}

const esActiva = (ruta, actual) =>
  ruta === "/pedidos"
    ? actual === "/pedidos" || (actual.startsWith("/pedidos/") && actual !== "/pedidos/nuevo")
    : actual === ruta || actual.startsWith(ruta + "/");

function MenuLateral({ items }) {
  const { sesion, cerrarSesion } = useApp();
  const { pathname } = useLocation();
  return (
    <aside className="menu-lateral">
      <div className="marca">
        <Logo />
        <div>
          <strong>El Vapor Azul</strong>
          <span>Lavandería y Tintorería</span>
        </div>
      </div>
      <nav className="menu" aria-label="Menú principal">
        {items.map((m) => {
          const activa = esActiva(m.ruta, pathname);
          return (
            <NavLink key={m.ruta} to={m.ruta} end className={`menu-item ${activa ? "activo" : ""}`}>
              {/* El resaltado azul se desliza al ítem activo */}
              {activa && <motion.span layoutId="menu-activo" className="menu-indicador" transition={resorte} />}
              <Icono nombre={m.icono} tam={18} />
              <span>{m.etiqueta}</span>
            </NavLink>
          );
        })}
      </nav>
      <div className="usuario">
        <span className="avatar">{iniciales(sesion.nombre)}</span>
        <div className="usuario-texto">
          <strong>{sesion.nombre}</strong>
          <span>{ROLES[sesion.rol].nombre}</span>
        </div>
        <button className="btn-icono" onClick={cerrarSesion} title="Cerrar sesión" aria-label="Cerrar sesión">
          <Icono nombre="salir" tam={18} />
        </button>
      </div>
    </aside>
  );
}

function BarraInferior({ items }) {
  const { pathname } = useLocation();
  const navegar = useNavigate();
  const { cerrarSesion, sesion } = useApp();
  const [mas, setMas] = useState(false);
  const visibles = items.slice(0, 4);
  const resto = items.slice(4);
  const masActivo = resto.some((m) => esActiva(m.ruta, pathname));

  return (
    <>
      <nav className="barra-inferior" aria-label="Menú">
        {visibles.map((m) => {
          const activa = esActiva(m.ruta, pathname);
          return (
            <NavLink key={m.ruta} to={m.ruta} end className={`tab ${activa ? "activo" : ""}`}>
              <span className="tab-icono">
                {activa && <motion.span layoutId="tab-activo" className="tab-pildora" transition={resorte} />}
                <Icono nombre={m.icono} tam={22} />
              </span>
              <span className="tab-texto">{m.corto ?? m.etiqueta}</span>
            </NavLink>
          );
        })}
        <button className={`tab ${masActivo ? "activo" : ""}`} onClick={() => setMas(true)}>
          <span className="tab-icono">
            {masActivo && <motion.span layoutId="tab-activo" className="tab-pildora" transition={resorte} />}
            <Icono nombre="menu" tam={22} />
          </span>
          <span className="tab-texto">Más</span>
        </button>
      </nav>
      <HojaInferior abierta={mas} onCerrar={() => setMas(false)} titulo="Más opciones" subtitulo={`${sesion.nombre} · ${ROLES[sesion.rol].nombre}`}>
        <div className="lista-opciones">
          {resto.map((m) => (
            <button key={m.ruta} className="opcion" onClick={() => { setMas(false); navegar(m.ruta); }}>
              <Icono nombre={m.icono} /> {m.etiqueta}
            </button>
          ))}
          <button className="opcion opcion-peligro" onClick={cerrarSesion}>
            <Icono nombre="salir" /> Cerrar sesión
          </button>
        </div>
      </HojaInferior>
    </>
  );
}

/** Encabezado de cada pantalla: título, descripción, buscador global y fecha. */
export function Pagina({ titulo, descripcion, acciones, atras, children }) {
  const navegar = useNavigate();
  const [busqueda, setBusqueda] = useState("");
  const buscar = (e) => {
    e.preventDefault();
    const q = busqueda.trim();
    if (!q) return;
    navegar(`/pedidos?q=${encodeURIComponent(q)}`);
    setBusqueda("");
  };
  return (
    <>
      <header className="barra-superior">
        {atras && (
          <button className="btn-icono btn-atras" onClick={() => navegar(-1)} aria-label="Volver">
            <Icono nombre="atras" />
          </button>
        )}
        <div className="barra-titulos">
          <h1>{titulo}</h1>
          {descripcion && <p>{descripcion}</p>}
        </div>
        <form className="buscador" onSubmit={buscar} role="search">
          <Icono nombre="buscar" tam={16} />
          <input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar ticket, cliente o teléfono…"
            aria-label="Buscar pedidos"
          />
        </form>
        <span className="fecha-hoy">{fechaLarga()}</span>
      </header>
      <div className="contenido">
        {acciones && <div className="acciones-pagina">{acciones}</div>}
        {children}
      </div>
    </>
  );
}

function Toasts() {
  const { toasts, cerrarToast } = useApp();
  return (
    <div className="toasts" aria-live="polite">
      <AnimatePresence initial={false}>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            layout
            className={`toast toast-${t.tipo}`}
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: 40, transition: { duration: dur.rapida, ease: ease.entrada } }}
            transition={resorte}
          >
            <Icono nombre={t.tipo === "alerta" ? "alerta" : "check"} tam={18} />
            <span>{t.mensaje}</span>
            {t.deshacer && (
              <button
                className="toast-accion"
                onClick={() => {
                  t.deshacer();
                  cerrarToast(t.id);
                }}
              >
                Deshacer
              </button>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
