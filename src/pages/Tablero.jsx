import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, LayoutGroup, motion } from "motion/react";
import { useApp } from "../store/AppContext";
import { Pagina } from "../components/Layout";
import { Boton, Chip, Etiqueta } from "../components/ui";
import Icono from "../components/Icono";
import { ACCION_AVANZAR, ESTADOS } from "../data/catalogos";
import { diaRelativo } from "../utils/formato";
import { atrasado, incidenciaAbierta, resumenPedido } from "../utils/pedidos";
import { resorte } from "../ui/motion";

const COLUMNAS = ESTADOS.filter((e) => e.id !== "entregado");

// Primero los express, luego los atrasados y después por hora de entrega
const prioridad = (a, b) =>
  Number(b.express) - Number(a.express) ||
  Number(atrasado(b)) - Number(atrasado(a)) ||
  new Date(a.entrega) - new Date(b.entrega);

export default function Tablero() {
  const { pedidos, clientes, avanzar, registrarAviso } = useApp();
  const navegar = useNavigate();
  const [columnaMovil, setColumnaMovil] = useState("lavando");
  const activos = pedidos.filter((p) => p.estado !== "entregado");
  const cliente = (id) => clientes.find((c) => c.id === id);

  const nExpress = activos.filter((p) => p.express && p.estado !== "listo").length;
  const nAtrasados = activos.filter(atrasado).length;

  return (
    <Pagina titulo="Tablero de trabajo" descripcion="Mueve cada pedido al siguiente paso cuando termines">
      <div className="barra-filtros">
        <div className="fila-flex envolver">
          <Etiqueta color="primary">{activos.filter((p) => p.estado !== "listo").length} en proceso</Etiqueta>
          {nExpress > 0 && <Etiqueta color="danger">{nExpress} express</Etiqueta>}
          {nAtrasados > 0 && <Etiqueta color="warning">{nAtrasados} atrasado{nAtrasados > 1 ? "s" : ""}</Etiqueta>}
        </div>
        <span className="texto-suave texto-chico solo-escritorio">Primero los express y los atrasados</span>
      </div>

      {/* En móvil se ve una columna a la vez */}
      <div className="chips desplazable solo-movil">
        {COLUMNAS.map((c) => (
          <Chip key={c.id} nombre="columna" activo={columnaMovil === c.id} contador={activos.filter((p) => p.estado === c.id).length} onClick={() => setColumnaMovil(c.id)}>
            {c.corto ?? c.nombre}
          </Chip>
        ))}
      </div>

      {/* LayoutGroup + layoutId: al avanzar, la tarjeta VIAJA a la siguiente columna */}
      <LayoutGroup>
        <div className="tablero">
          {COLUMNAS.map((col) => {
            const items = activos.filter((p) => p.estado === col.id).sort(prioridad);
            return (
              <section key={col.id} className={`columna ${columnaMovil === col.id ? "visible-movil" : ""}`} aria-label={col.nombre}>
                <header className="columna-cabecera">
                  <span className={`punto fondo-${col.color}`} />
                  <strong>{col.nombre}</strong>
                  <motion.span key={items.length} className="texto-suave texto-chico" initial={{ scale: 1.4 }} animate={{ scale: 1 }} transition={resorte}>
                    {items.length}
                  </motion.span>
                </header>
                <div className="columna-cuerpo">
                  <AnimatePresence initial={false} mode="popLayout">
                    {items.map((p) => {
                      const c = cliente(p.clienteId);
                      return (
                        <motion.article
                          key={p.ticket}
                          layoutId={p.ticket}
                          layout
                          className="tarjeta-pedido"
                          transition={resorte}
                          initial={{ opacity: 0, scale: 0.96 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.96 }}
                        >
                          <button className="tarjeta-pedido-cuerpo" onClick={() => navegar(`/pedidos/${p.ticket}`)}>
                            <span className="fila-flex">
                              <strong className="texto-primary">#{p.ticket}</strong>
                              <span className="crece" />
                              {incidenciaAbierta(p) && <Etiqueta color="danger">INCIDENCIA</Etiqueta>}
                              {p.express && col.id !== "listo" && <Etiqueta color="danger">EXPRESS</Etiqueta>}
                              {atrasado(p) && <Etiqueta color="warning">ATRASADO</Etiqueta>}
                            </span>
                            <strong className="tarjeta-pedido-cliente">{c?.nombre}</strong>
                            <span className="texto-suave texto-chico">{resumenPedido(p)}</span>
                            <span className="texto-suave texto-chico fila-flex">
                              <Icono nombre="reloj" tam={14} />
                              {p.estado === "listo" && p.avisos?.length ? `Avisado ${p.avisos.length}×` : diaRelativo(p.entrega)}
                            </span>
                          </button>
                          {ACCION_AVANZAR[p.estado] ? (
                            <Boton tipo="fantasma" bloque onClick={() => avanzar(p.ticket)}>
                              {ACCION_AVANZAR[p.estado]} {p.estado === "planchando" ? "✓" : "→"}
                            </Boton>
                          ) : (
                            <Boton tipo="secundario" bloque icono="telefono" onClick={() => registrarAviso(p.ticket, c?.nombre)}>
                              Avisar al cliente
                            </Boton>
                          )}
                        </motion.article>
                      );
                    })}
                  </AnimatePresence>
                  {items.length === 0 && <p className="vacio texto-chico">Sin pedidos</p>}
                </div>
              </section>
            );
          })}
        </div>
      </LayoutGroup>
    </Pagina>
  );
}
