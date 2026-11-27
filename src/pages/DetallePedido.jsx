import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { useApp } from "../store/AppContext";
import { Pagina } from "../components/Layout";
import { Alerta, BadgeEstado, BadgePago, Boton, Campo, Etiqueta, Modal, Selector, Tarjeta } from "../components/ui";
import Ticket from "../components/Ticket";
import FormIncidencia from "../components/FormIncidencia";
import { ACCION_AVANZAR, ESTADO, ESTADOS, METODOS_PAGO } from "../data/catalogos";
import { bs, diaRelativo, fechaHora } from "../utils/formato";
import { estadoPago, estadoVisible, incidenciaAbierta, requierePlanchado, saldo, siguienteEstado, totalPagado } from "../utils/pedidos";
import { dur, ease, resorte } from "../ui/motion";

export default function DetallePedido() {
  const { ticket } = useParams();
  const app = useApp();
  const { pedidos, clientes, sesion } = app;
  const navegar = useNavigate();
  const p = pedidos.find((x) => x.ticket === ticket);
  const [verTicket, setVerTicket] = useState(false);
  const [incidencia, setIncidencia] = useState(false);
  const [monto, setMonto] = useState("");
  const [metodo, setMetodo] = useState("Efectivo");

  if (!p) {
    return (
      <Pagina titulo="Pedido no encontrado" atras>
        <Tarjeta><p>No existe el pedido #{ticket}. <Link to="/pedidos">Volver a pedidos</Link></p></Tarjeta>
      </Pagina>
    );
  }

  const c = clientes.find((x) => x.id === p.clienteId);
  const pendiente = saldo(p);
  const sig = siguienteEstado(p);
  const esOperario = sesion.rol === "operario";
  const pasos = ESTADOS.filter((e) => e.id !== "planchando" || requierePlanchado(p));
  const indiceActual = pasos.findIndex((e) => e.id === p.estado);

  const cobrar = (e) => {
    e.preventDefault();
    const valor = Number(String(monto || pendiente).replace(",", "."));
    if (!(valor > 0)) return;
    app.registrarPago(p.ticket, Math.min(valor, pendiente), metodo);
    setMonto("");
  };

  const entregar = () => {
    if (app.entregar(p.ticket)) navegar("/pedidos");
  };

  return (
    <Pagina titulo="Detalle del pedido" descripcion={`Pedidos › #${p.ticket}`} atras>
      <div className="cabecera-detalle">
        <div className="crece">
          <div className="fila-flex envolver">
            <h2 className="titulo-detalle">#{p.ticket} · {c?.nombre}</h2>
            <BadgeEstado estado={estadoVisible(p)} />
            <BadgePago estado={estadoPago(p)} />
            {p.express && <Etiqueta color="danger">EXPRESS</Etiqueta>}
          </div>
          <p className="texto-suave texto-chico">
            Recibido el {fechaHora(p.recibido)} por {p.recibidoPor} · Entrega: {diaRelativo(p.entrega)} {p.tipoEntrega === "domicilio" ? "a domicilio" : "en tienda"}
          </p>
        </div>
        <div className="fila-flex envolver">
          <Boton tipo="secundario" icono="imprimir" onClick={() => setVerTicket(true)}>Ticket</Boton>
          {p.estado !== "entregado" && <Boton tipo="secundario" icono="alerta" onClick={() => setIncidencia(true)}>Reportar incidencia</Boton>}
          {sig && <Boton tipo={esOperario ? "primario" : "secundario"} onClick={() => app.avanzar(p.ticket)}>{ACCION_AVANZAR[p.estado]} →</Boton>}
          {!esOperario && p.estado === "listo" && <Boton onClick={entregar}>Marcar como entregado</Boton>}
        </div>
      </div>

      <AnimatePresence>
        {pendiente > 0 && p.estado !== "entregado" && (
          <Alerta key="saldo" tipo="warning">
            Saldo pendiente de <strong>{bs(pendiente)}</strong>. Cobra el saldo antes de marcar el pedido como entregado.
          </Alerta>
        )}
      </AnimatePresence>

      <div className="columnas">
        <div className="col-principal pila">
          <Tarjeta titulo="Progreso">
            <ol className="progreso">
              {pasos.map((e, i) => {
                const hecho = i < indiceActual || p.estado === "entregado";
                const actual = i === indiceActual && p.estado !== "entregado";
                return (
                  <li key={e.id} className={`paso ${hecho ? "hecho" : ""} ${actual ? "actual" : ""}`}>
                    <span className="paso-linea">
                      <motion.span className="paso-linea-relleno" initial={false} animate={{ scaleX: i <= indiceActual ? 1 : 0 }} transition={{ duration: dur.lenta, ease: ease.salida }} />
                    </span>
                    {/* El paso actual "late" una vez al entrar */}
                    <motion.span className="paso-punto" key={`${e.id}-${actual}`} initial={actual ? { scale: 0.6 } : false} animate={{ scale: [null, 1.15, 1] }} transition={{ duration: 0.4 }}>
                      {hecho ? "✓" : i + 1}
                    </motion.span>
                    <span className="paso-nombre">{e.corto ?? e.nombre}</span>
                  </li>
                );
              })}
            </ol>
          </Tarjeta>

          <Tarjeta titulo="Cliente" className="grilla-2">
            <dl className="datos">
              <dt>Nombre</dt><dd>{c?.nombre}</dd>
              <dt>Teléfono</dt><dd><a href={`tel:${c?.telefono.replace(/\s/g, "")}`}>{c?.telefono}</a></dd>
              {c?.direccion && (<><dt>Dirección</dt><dd>{c.direccion}</dd></>)}
              {c?.nota && (<><dt>Nota</dt><dd><Etiqueta color="warning">{c.nota}</Etiqueta></dd></>)}
            </dl>
          </Tarjeta>

          <Tarjeta titulo="Prendas y servicios" subtitulo="Revisa las observaciones registradas al recibir" className="sin-padding-tabla">
            <div className="tabla-scroll">
              <table className="tabla">
                <thead><tr><th>Servicio</th><th>Detalle</th><th>Observaciones</th><th className="derecha">Precio</th></tr></thead>
                <tbody>
                  {p.kilo && (
                    <tr>
                      <td className="negrita">Ropa por kilo</td>
                      <td>{String(p.kilo.kg).replace(".", ",")} kg{p.kilo.planchado ? " · con planchado" : ""}</td>
                      <td className="texto-suave">—</td>
                      <td className="derecha">{bs(p.lineas.filter((l) => /kilo|Planchado/.test(l.concepto)).reduce((s, l) => s + l.monto, 0))}</td>
                    </tr>
                  )}
                  {p.prendas.map((pr) => (
                    <tr key={pr.id}>
                      <td className="negrita">Tintorería</td>
                      <td>{pr.nombre}{pr.color ? `, ${pr.color.toLowerCase()}` : ""}</td>
                      <td className={pr.obs ? "texto-warning" : "texto-suave"}>{pr.obs || "—"}</td>
                      <td className="derecha">{bs(pr.precio)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <AnimatePresence>
              {incidenciaAbierta(p) && (
                <div className="relleno-tarjeta">
                  <Alerta tipo="danger" icono="alerta" accion={!esOperario && <Boton tipo="secundario" onClick={() => app.marcarAvisado(p.ticket)}>Marcar como avisado</Boton>}>
                    <strong>{p.incidencia.tipo} · {p.incidencia.prenda}</strong> — reportado por {p.incidencia.por} ({fechaHora(p.incidencia.fecha)})
                    {p.incidencia.texto && <><br />{p.incidencia.texto}</>}
                  </Alerta>
                </div>
              )}
            </AnimatePresence>
          </Tarjeta>
        </div>

        <aside className="col-lateral pila">
          <Tarjeta titulo="Pago">
            <dl className="datos">
              {p.pagos.map((x, i) => (
                <motion.div key={i} className="dato-fila" initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}>
                  <dt>{i === 0 && x.fecha === p.recibido ? "Adelanto" : "Pago"} · {fechaHora(x.fecha)} · {x.metodo}</dt>
                  <dd>{bs(x.monto)}</dd>
                </motion.div>
              ))}
              <div className="dato-fila"><dt>Total del pedido</dt><dd>{bs(p.total)}</dd></div>
              <div className="dato-fila"><dt>Pagado</dt><dd>{bs(totalPagado(p))}</dd></div>
            </dl>
            <hr />
            <div className="total">
              <span>Saldo pendiente</span>
              <motion.strong key={pendiente} initial={{ scale: 1.1 }} animate={{ scale: 1 }} transition={resorte} className={pendiente > 0 ? "texto-danger" : "texto-success"}>
                {bs(pendiente)}
              </motion.strong>
            </div>
            {pendiente > 0 && !esOperario && (
              <form className="pila" onSubmit={cobrar}>
                <Campo etiqueta="Monto a cobrar" id="monto" inputMode="decimal" placeholder={String(pendiente)} value={monto} onChange={(e) => setMonto(e.target.value.replace(/[^\d.,]/g, ""))} />
                <Selector nombre="metodo-detalle" bloque valor={metodo} onCambio={setMetodo} opciones={METODOS_PAGO} />
                <Boton type="submit" bloque>Registrar pago</Boton>
              </form>
            )}
          </Tarjeta>

          <Tarjeta titulo="Historial de estados">
            <ol className="historial">
              <AnimatePresence initial={false}>
                {[...p.historial].reverse().map((h) => (
                  <motion.li key={h.estado + h.fecha} layout initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: dur.normal, ease: ease.salida }}>
                    <span className={`historial-punto fondo-${ESTADO[h.estado].color}`} />
                    <div>
                      <strong>{ESTADO[h.estado].nombre}</strong>
                      <span className="texto-suave texto-chico">{fechaHora(h.fecha)} · {h.usuario}</span>
                    </div>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ol>
          </Tarjeta>
        </aside>
      </div>

      <Modal abierto={verTicket} onCerrar={() => setVerTicket(false)} etiqueta="Ticket" ancho={380}>
        <Ticket pedido={p} onCerrar={() => setVerTicket(false)} />
      </Modal>
      <FormIncidencia pedido={p} abierta={incidencia} onCerrar={() => setIncidencia(false)} />
    </Pagina>
  );
}
