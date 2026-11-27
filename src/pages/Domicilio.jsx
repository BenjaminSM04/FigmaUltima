import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, LayoutGroup, motion } from "motion/react";
import { useApp } from "../store/AppContext";
import { Pagina } from "../components/Layout";
import { BadgePago, Boton, Campo, Etiqueta, HojaInferior, Modal, Selector, Tarjeta, Vacio } from "../components/ui";
import Icono from "../components/Icono";
import { aInputFecha, bs, diaRelativo, fechaLarga } from "../utils/formato";
import { estadoPago, saldo } from "../utils/pedidos";
import { dur, ease, resorte } from "../ui/motion";
import { useEsMovil } from "../ui/useEsMovil";

const FRANJAS = ["09:00 – 11:00", "11:00 – 13:00", "15:00 – 18:00"];
const ESTADO_VISITA = {
  programado: ["gray", "Programado"],
  en_camino: ["warning", "En camino"],
  realizado: ["success", "Realizado"],
};
const mismoDia = (a, b) => new Date(a).toDateString() === new Date(b).toDateString();

export default function Domicilio() {
  const app = useApp();
  const { visitas, clientes, pedidos } = app;
  const esMovil = useEsMovil();
  const [dia, setDia] = useState(() => aInputFecha(new Date()));
  const [formAbierto, setFormAbierto] = useState(false);
  const [exito, setExito] = useState(null);
  const cliente = (id) => clientes.find((c) => c.id === id);
  const pedido = (t) => pedidos.find((p) => p.ticket === t);

  const dias = useMemo(() => Array.from({ length: 4 }, (_, i) => aInputFecha(new Date(Date.now() + i * 86400000))), []);
  const delDia = visitas.filter((v) => mismoDia(v.fecha, `${dia}T12:00`)).sort((a, b) => FRANJAS.indexOf(a.franja) - FRANJAS.indexOf(b.franja));
  const hechas = delDia.filter((v) => v.estado === "realizado").length;

  const completar = (v) => {
    if (v.tipo === "entrega" && v.ticket) {
      const p = pedido(v.ticket);
      if (p && p.estado !== "entregado" && !app.entregar(v.ticket)) return; // tiene saldo: no se entrega
    }
    app.estadoVisita(v.id, "realizado");
    const siguiente = delDia.find((x) => x.id !== v.id && x.estado !== "realizado");
    setExito({ v, siguiente });
  };

  const form = <FormVisita dia={dia} onListo={() => setFormAbierto(false)} />;

  return (
    <Pagina titulo="Recojos y entregas a domicilio" descripcion="Agenda de visitas programadas para el repartidor">
      <div className="barra-filtros">
        <Selector
          nombre="dia"
          valor={dia}
          onCambio={setDia}
          opciones={dias.map((d, i) => ({ valor: d, texto: i === 0 ? `Hoy · ${fechaLarga(`${d}T12:00`).split(" ").slice(0, 2).join(" ")}` : diaRelativo(`${d}T12:00`, false) }))}
        />
        {esMovil && <Boton icono="mas" onClick={() => setFormAbierto(true)}>Programar</Boton>}
      </div>

      <div className="columnas">
        <div className="col-principal pila">
          <Tarjeta>
            <div className="fila-flex">
              <strong className="crece">{hechas} de {delDia.length} visitas</strong>
              <span className="texto-primary negrita">{delDia.length ? Math.round((hechas / delDia.length) * 100) : 0}%</span>
            </div>
            <div className="barra-pista barra-gruesa">
              <motion.div className="barra-relleno fondo-primary" initial={false} animate={{ width: `${delDia.length ? (hechas / delDia.length) * 100 : 0}%` }} transition={{ duration: 0.6, ease: ease.salida }} />
            </div>
          </Tarjeta>

          {delDia.length === 0 && <Vacio>No hay visitas para este día.</Vacio>}

          <LayoutGroup>
            {FRANJAS.map((franja) => {
              const items = delDia.filter((v) => v.franja === franja);
              if (!items.length) return null;
              return (
                <section key={franja} className="pila-chica">
                  <h3 className="subtitulo texto-suave">{franja}</h3>
                  <AnimatePresence initial={false}>
                    {items.map((v) => {
                      const c = cliente(v.clienteId);
                      const p = v.ticket ? pedido(v.ticket) : null;
                      const [color, texto] = ESTADO_VISITA[v.estado];
                      return (
                        <motion.article key={v.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={resorte}
                          className={`visita ${v.estado === "realizado" ? "visita-hecha" : ""}`}>
                          <Etiqueta color={v.tipo === "recojo" ? "info" : "success"}>{v.tipo === "recojo" ? "RECOJO" : "ENTREGA"}</Etiqueta>
                          <div className="crece">
                            <strong>{c?.nombre}</strong>
                            <span className="texto-suave texto-chico fila-flex"><Icono nombre="ruta" tam={14} /> {v.direccion}</span>
                            {v.nota && <span className="texto-chico texto-suave">“{v.nota}”</span>}
                          </div>
                          <div className="visita-meta">
                            {p ? <Link className="texto-chico negrita" to={`/pedidos/${p.ticket}`}>Ticket #{p.ticket}</Link> : <span className="texto-chico texto-suave">Sin ticket aún</span>}
                            {p && v.tipo === "entrega" && <BadgePago estado={estadoPago(p)} />}
                            <Etiqueta color={color}>{texto}</Etiqueta>
                          </div>
                          {v.estado !== "realizado" && (
                            <div className="visita-acciones">
                              {v.estado === "programado" && <Boton tipo="secundario" icono="navegar" onClick={() => app.estadoVisita(v.id, "en_camino")}>En camino</Boton>}
                              <Boton tipo="fantasma" icono="check" onClick={() => completar(v)}>
                                {v.tipo === "entrega" ? "Entregado" : "Recogido"}
                              </Boton>
                            </div>
                          )}
                        </motion.article>
                      );
                    })}
                  </AnimatePresence>
                </section>
              );
            })}
          </LayoutGroup>
        </div>

        {!esMovil && (
          <aside className="col-lateral">
            <Tarjeta className="pegajoso" titulo="Programar visita" subtitulo="El repartidor la verá en su agenda">{form}</Tarjeta>
          </aside>
        )}
      </div>

      {esMovil && (
        <HojaInferior abierta={formAbierto} onCerrar={() => setFormAbierto(false)} titulo="Programar visita" subtitulo="El repartidor la verá en su agenda">
          {form}
        </HojaInferior>
      )}

      {/* Confirmación: el círculo aparece con resorte y el check se dibuja */}
      <Modal abierto={!!exito} onCerrar={() => setExito(null)} etiqueta="Visita registrada" ancho={380}>
        {exito && (
          <div className="exito">
            <motion.div className="exito-halo" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ ...resorte, delay: 0.05 }}>
              <motion.div className="exito-circulo" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ ...resorte, delay: 0.12 }}>
                <svg viewBox="0 0 24 24" width="40" height="40" fill="none">
                  <motion.path d="m5 12 5 5 9-10" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"
                    initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.3, duration: dur.lenta, ease: ease.salida }}
                    onAnimationComplete={() => navigator.vibrate?.(30)} />
                </svg>
              </motion.div>
            </motion.div>
            <h2>{exito.v.tipo === "entrega" ? "¡Entrega registrada!" : "¡Recojo registrado!"}</h2>
            <p className="texto-suave">{exito.v.ticket ? `#${exito.v.ticket} · ` : ""}{cliente(exito.v.clienteId)?.nombre}</p>
            {exito.siguiente && (
              <p className="aviso-siguiente">
                Siguiente: {cliente(exito.siguiente.clienteId)?.nombre} · {exito.siguiente.tipo === "recojo" ? "Recojo" : "Entrega"} {exito.siguiente.franja}
              </p>
            )}
            <Boton bloque onClick={() => setExito(null)}>Volver a la ruta</Boton>
          </div>
        )}
      </Modal>
    </Pagina>
  );
}

function FormVisita({ dia, onListo }) {
  const { clientes, pedidos, programarVisita } = useApp();
  const [clienteId, setClienteId] = useState("");
  const [tipo, setTipo] = useState("entrega");
  const [ticket, setTicket] = useState("");
  const [fecha, setFecha] = useState(dia);
  const [franja, setFranja] = useState(FRANJAS[2]);
  const [direccion, setDireccion] = useState("");
  const [nota, setNota] = useState("");
  const [error, setError] = useState("");

  const pedidosCliente = pedidos.filter((p) => p.clienteId === clienteId && p.estado !== "entregado");
  const elegirCliente = (id) => {
    setClienteId(id);
    setDireccion(clientes.find((c) => c.id === id)?.direccion ?? "");
    setTicket(pedidos.find((p) => p.clienteId === id && p.estado !== "entregado")?.ticket ?? "");
  };
  const p = pedidos.find((x) => x.ticket === ticket);

  const guardar = (e) => {
    e.preventDefault();
    if (!clienteId || !direccion.trim()) return setError("Elige el cliente y escribe la dirección");
    if (tipo === "entrega" && !ticket) return setError("Elige el pedido que se va a entregar");
    programarVisita({
      id: "v" + Date.now(), tipo, clienteId, ticket: tipo === "entrega" ? ticket : null,
      fecha: new Date(`${fecha}T${franja.slice(0, 5)}`).toISOString(), franja, direccion: direccion.trim(), nota: nota.trim(), estado: "programado",
    });
    setClienteId(""); setTicket(""); setDireccion(""); setNota(""); setError("");
    onListo?.();
  };

  return (
    <form className="pila" onSubmit={guardar}>
      <Campo etiqueta="Cliente" id="v-cliente">
        <select id="v-cliente" className="campo-control" value={clienteId} onChange={(e) => elegirCliente(e.target.value)}>
          <option value="">Elige un cliente…</option>
          {clientes.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
        </select>
      </Campo>
      <div className="campo">
        <span className="campo-etiqueta">Tipo de visita</span>
        <Selector nombre="tipo-visita" bloque valor={tipo} onCambio={setTipo} opciones={[{ valor: "recojo", texto: "Recojo de ropa" }, { valor: "entrega", texto: "Entrega de pedido" }]} />
      </div>
      <AnimatePresence initial={false}>
        {tipo === "entrega" && (
          <motion.div className="plegable" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
            <Campo etiqueta="Pedido a entregar" id="v-ticket">
              <select id="v-ticket" className="campo-control" value={ticket} onChange={(e) => setTicket(e.target.value)} disabled={!clienteId}>
                <option value="">{clienteId ? (pedidosCliente.length ? "Elige el pedido…" : "No tiene pedidos pendientes") : "Primero elige el cliente"}</option>
                {pedidosCliente.map((x) => <option key={x.ticket} value={x.ticket}>#{x.ticket} · {x.estado === "listo" ? "Listo" : "En proceso"} · {bs(x.total)}</option>)}
              </select>
            </Campo>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="fila-campos">
        <Campo etiqueta="Fecha" id="v-fecha" type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
        <Campo etiqueta="Franja horaria" id="v-franja">
          <select id="v-franja" className="campo-control" value={franja} onChange={(e) => setFranja(e.target.value)}>
            {FRANJAS.map((f) => <option key={f}>{f}</option>)}
          </select>
        </Campo>
      </div>
      <Campo etiqueta="Dirección" id="v-dir" value={direccion} onChange={(e) => setDireccion(e.target.value)} />
      <Campo etiqueta="Nota para el repartidor" id="v-nota" placeholder="Ej. tocar timbre 3B" value={nota} onChange={(e) => setNota(e.target.value)} />
      {p && tipo === "entrega" && saldo(p) > 0 && <p className="texto-warning texto-chico">Al entregar hay que cobrar el saldo: {bs(saldo(p))}</p>}
      {error && <p className="texto-danger texto-chico" role="alert">{error}</p>}
      <Boton type="submit" bloque>Guardar visita</Boton>
    </form>
  );
}
