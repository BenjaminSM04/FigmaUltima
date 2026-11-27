import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { useApp } from "../store/AppContext";
import { Pagina } from "../components/Layout";
import { Boton, Campo, Casilla, Etiqueta, Modal, Selector, Tarjeta } from "../components/ui";
import Icono from "../components/Icono";
import Ticket from "../components/Ticket";
import { METODOS_PAGO } from "../data/catalogos";
import { aInputFecha, bs } from "../utils/formato";
import { calcularLineas, redondear } from "../utils/pedidos";
import { dur, ease, resorte } from "../ui/motion";

const soloDigitos = (t) => t.replace(/\D/g, "");
let siguienteClave = 1;
const prendaVacia = (precios) => ({ clave: siguienteClave++, tipoId: precios.prendas[0].id, color: "", obs: "", precio: precios.prendas[0].precio });

export default function NuevoPedido() {
  const app = useApp();
  const { clientes, pedidos, precios, sesion } = app;
  const navegar = useNavigate();

  const [telefono, setTelefono] = useState("");
  const [nombre, setNombre] = useState("");
  const [nota, setNota] = useState("");
  const [direccion, setDireccion] = useState("");
  const [servicio, setServicio] = useState("kilo");
  const [kg, setKg] = useState("");
  const [planchado, setPlanchado] = useState(false);
  const [prendas, setPrendas] = useState([]);
  const [fecha, setFecha] = useState(() => aInputFecha(new Date(Date.now() + 2 * 86400000)));
  const [horaEntrega, setHoraEntrega] = useState("18:00");
  const [tipoEntrega, setTipoEntrega] = useState("tienda");
  const [express, setExpress] = useState(false);
  const [adelanto, setAdelanto] = useState("");
  const [metodo, setMetodo] = useState("Efectivo");
  const [errores, setErrores] = useState({});
  const [creado, setCreado] = useState(null);
  const [params] = useSearchParams();

  // Busca al cliente por teléfono y completa sus datos
  const cliente = useMemo(() => {
    const t = soloDigitos(telefono);
    return t.length >= 7 ? clientes.find((c) => soloDigitos(c.telefono) === t) : null;
  }, [telefono, clientes]);
  const pedidosCliente = cliente ? pedidos.filter((p) => p.clienteId === cliente.id).length : 0;

  const alEscribirTelefono = (valor) => {
    setTelefono(valor);
    const t = soloDigitos(valor);
    const c = t.length >= 7 ? clientes.find((x) => soloDigitos(x.telefono) === t) : null;
    if (c) {
      setNombre(c.nombre);
      setNota(c.nota);
      setDireccion(c.direccion);
    }
  };

  // Viene desde la ficha del cliente: /pedidos/nuevo?tel=...
  useEffect(() => {
    const tel = params.get("tel");
    if (tel) alEscribirTelefono(tel);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const usaKilo = servicio !== "tintoreria";
  const usaPrendas = servicio !== "kilo";
  const pesoKg = Number(String(kg).replace(",", ".")) || 0; // acepta "4,5" y "4.5"
  const kilo = usaKilo && pesoKg > 0 ? { kg: pesoKg, planchado } : null;
  const prendasFinales = usaPrendas
    ? prendas.map((p) => ({ ...p, nombre: precios.prendas.find((x) => x.id === p.tipoId)?.nombre ?? "Prenda" }))
    : [];
  const { lineas, total } = calcularLineas({ kilo, prendas: prendasFinales, express, tipoEntrega }, precios);
  const montoAdelanto = Number(String(adelanto).replace(",", ".")) || 0;
  const saldoFinal = Math.max(0, redondear(total - montoAdelanto));

  const cambiarServicio = (s) => {
    setServicio(s);
    if (s !== "kilo" && prendas.length === 0) setPrendas([prendaVacia(precios)]);
  };
  const editarPrenda = (clave, cambios) => setPrendas((ps) => ps.map((p) => (p.clave === clave ? { ...p, ...cambios } : p)));

  const registrar = (e) => {
    e.preventDefault();
    const err = {};
    if (soloDigitos(telefono).length < 7) err.telefono = "Escribe un teléfono válido";
    if (!nombre.trim()) err.nombre = "Falta el nombre";
    if (!kilo && prendasFinales.length === 0) err.servicio = "Agrega el peso o al menos una prenda";
    if (tipoEntrega === "domicilio" && !direccion.trim()) err.direccion = "Falta la dirección de entrega";
    if (montoAdelanto > total) err.adelanto = "El adelanto no puede ser mayor al total";
    setErrores(err);
    if (Object.keys(err).length) return;

    let clienteId = cliente?.id;
    if (!cliente) {
      clienteId = "c" + Date.now();
      app.guardarCliente({ id: clienteId, nombre: nombre.trim(), telefono: telefono.trim(), direccion: direccion.trim(), nota: nota.trim(), desde: new Date().toISOString() });
    }
    const ahora = new Date().toISOString();
    const entrega = new Date(`${fecha}T${horaEntrega}`).toISOString();
    const pedido = {
      ticket: app.siguienteTicket(),
      clienteId,
      recibido: ahora,
      entrega,
      estado: "recibido",
      kilo,
      prendas: prendasFinales.map(({ clave, ...p }) => ({ ...p, id: "p" + clave + Date.now() })),
      lineas,
      total,
      pagos: montoAdelanto > 0 ? [{ monto: montoAdelanto, metodo, fecha: ahora }] : [],
      historial: [{ estado: "recibido", fecha: ahora, usuario: sesion.nombre }],
      tipoEntrega,
      express,
      incidencia: null,
      avisos: [],
      recibidoPor: sesion.nombre,
    };
    app.crearPedido(pedido);
    if (tipoEntrega === "domicilio") {
      app.programarVisita({
        id: "v" + Date.now(), tipo: "entrega", clienteId, ticket: pedido.ticket, fecha: entrega,
        franja: "15:00 – 18:00", direccion: direccion.trim(), nota: "", estado: "programado",
      });
    }
    setCreado(pedido);
  };

  return (
    <Pagina titulo="Nuevo pedido" descripcion="Registra la ropa que deja el cliente y genera su ticket">
      <form className="columnas" onSubmit={registrar} noValidate>
        <div className="col-principal pila">
          <Tarjeta
            titulo="1. Cliente"
            accion={
              <AnimatePresence mode="wait">
                {cliente ? (
                  <motion.span key="frecuente" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
                    <Etiqueta color="success">Cliente frecuente · {pedidosCliente} pedidos</Etiqueta>
                  </motion.span>
                ) : soloDigitos(telefono).length >= 7 ? (
                  <motion.span key="nuevo" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
                    <Etiqueta color="info">Cliente nuevo</Etiqueta>
                  </motion.span>
                ) : null}
              </AnimatePresence>
            }
          >
            <div className="fila-campos">
              <Campo etiqueta="Teléfono (buscar)" id="tel" inputMode="tel" placeholder="Ej. 7654 3210" value={telefono} onChange={(e) => alEscribirTelefono(e.target.value)} aria-invalid={!!errores.telefono} />
              <Campo etiqueta="Nombre completo" id="nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} aria-invalid={!!errores.nombre} />
              <Campo etiqueta="Nota del cliente" id="nota" placeholder="Ej. sin suavizante" value={nota} onChange={(e) => setNota(e.target.value)} />
            </div>
            <Errores lista={[errores.telefono, errores.nombre]} />
          </Tarjeta>

          <Tarjeta
            titulo="2. Servicio"
            accion={
              <Selector nombre="servicio" valor={servicio} onCambio={cambiarServicio}
                opciones={[{ valor: "kilo", texto: "Por kilo" }, { valor: "tintoreria", texto: "Tintorería" }, { valor: "mixto", texto: "Mixto" }]} />
            }
          >
            <AnimatePresence initial={false}>
              {usaKilo && (
                <motion.div key="kilo" className="fila-campos alinear-abajo plegable"
                  initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: dur.normal, ease: ease.salida }}>
                  <Campo etiqueta="Peso (kg)" id="kg" inputMode="decimal" placeholder="0,0" value={kg} onChange={(e) => setKg(e.target.value.replace(/[^\d.,]/g, ""))} />
                  <Campo etiqueta="Precio por kg" id="pkg" value={bs(precios.kilo)} readOnly />
                  <Casilla marcado={planchado} onCambio={setPlanchado}>Con planchado (+{bs(precios.planchado)} por kg)</Casilla>
                </motion.div>
              )}
              {usaPrendas && (
                <motion.div key="prendas" className="plegable"
                  initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: dur.normal, ease: ease.salida }}>
                  <h3 className="subtitulo">Prendas de tintorería</h3>
                  <div className="prendas">
                    <AnimatePresence initial={false}>
                      {prendas.map((p) => (
                        <motion.div key={p.clave} className="prenda-fila" layout
                          initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: dur.normal, ease: ease.salida }}>
                          <Campo etiqueta="Prenda" id={`tipo-${p.clave}`}>
                            <select id={`tipo-${p.clave}`} className="campo-control" value={p.tipoId}
                              onChange={(e) => editarPrenda(p.clave, { tipoId: e.target.value, precio: precios.prendas.find((x) => x.id === e.target.value).precio })}>
                              {precios.prendas.map((x) => <option key={x.id} value={x.id}>{x.nombre}</option>)}
                            </select>
                          </Campo>
                          <Campo etiqueta="Color" id={`color-${p.clave}`} value={p.color} onChange={(e) => editarPrenda(p.clave, { color: e.target.value })} />
                          <Campo etiqueta="Observaciones al recibir" id={`obs-${p.clave}`} className="crece" placeholder="Manchas, botones, daños…" value={p.obs} onChange={(e) => editarPrenda(p.clave, { obs: e.target.value })} />
                          <Campo etiqueta="Precio" id={`precio-${p.clave}`} className="campo-precio" inputMode="decimal" value={p.precio} onChange={(e) => editarPrenda(p.clave, { precio: Number(e.target.value.replace(/[^\d.]/g, "")) || 0 })} />
                          <button type="button" className="btn-icono texto-danger" aria-label="Quitar prenda" onClick={() => setPrendas((ps) => ps.filter((x) => x.clave !== p.clave))}>
                            <Icono nombre="basura" tam={18} />
                          </button>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                  <Boton type="button" tipo="secundario" icono="mas" onClick={() => setPrendas((ps) => [...ps, prendaVacia(precios)])}>Agregar prenda</Boton>
                </motion.div>
              )}
            </AnimatePresence>
            <Errores lista={[errores.servicio]} />
          </Tarjeta>

          <Tarjeta titulo="3. Entrega">
            <div className="fila-campos alinear-abajo">
              <Campo etiqueta="Fecha prometida" id="fecha" type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
              <Campo etiqueta="Hora" id="hora" type="time" value={horaEntrega} onChange={(e) => setHoraEntrega(e.target.value)} />
              <div className="campo campo-ajustado">
                <span className="campo-etiqueta">Tipo de entrega</span>
                <Selector nombre="entrega" valor={tipoEntrega} onCambio={setTipoEntrega} opciones={[{ valor: "tienda", texto: "En tienda" }, { valor: "domicilio", texto: "A domicilio" }]} />
              </div>
              <Casilla marcado={express} onCambio={setExpress}>Express (+{precios.expressPct}%)</Casilla>
            </div>
            <AnimatePresence>
              {tipoEntrega === "domicilio" && (
                <motion.div className="plegable" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
                  <Campo etiqueta="Dirección de entrega" id="dir" value={direccion} onChange={(e) => setDireccion(e.target.value)} aria-invalid={!!errores.direccion} />
                </motion.div>
              )}
            </AnimatePresence>
            <Errores lista={[errores.direccion]} />
          </Tarjeta>
        </div>

        <aside className="col-lateral">
          <Tarjeta className="resumen pegajoso" titulo="Resumen del pedido" accion={<Etiqueta color="primary">Ticket #{app.siguienteTicket()}</Etiqueta>}>
            <motion.ul className="lineas" layout>
              <AnimatePresence initial={false}>
                {lineas.length === 0 && <motion.li key="vacio" className="texto-suave" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>Todavía no hay nada que cobrar.</motion.li>}
                {lineas.map((l) => (
                  <motion.li key={l.concepto} layout initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
                    <span>{l.concepto}</span><span>{bs(l.monto)}</span>
                  </motion.li>
                ))}
              </AnimatePresence>
            </motion.ul>
            <hr />
            <div className="total">
              <span>Total</span>
              {/* "tick": el total salta cada vez que cambia */}
              <motion.strong key={total} initial={{ scale: 1.08, color: "var(--primary)" }} animate={{ scale: 1, color: "var(--text)" }} transition={resorte}>
                {bs(total)}
              </motion.strong>
            </div>
            <Campo etiqueta="Adelanto" id="adelanto" inputMode="decimal" placeholder={`Sugerido: ${bs(redondear((total * precios.adelantoPct) / 100))}`} value={adelanto} onChange={(e) => setAdelanto(e.target.value.replace(/[^\d.,]/g, ""))} aria-invalid={!!errores.adelanto} />
            <div className="campo">
              <span className="campo-etiqueta">Método de pago</span>
              <Selector nombre="metodo" bloque valor={metodo} onCambio={setMetodo} opciones={METODOS_PAGO} />
            </div>
            <Errores lista={[errores.adelanto]} />
            <div className={`saldo-caja ${saldoFinal > 0 ? "con-saldo" : "sin-saldo"}`}>
              <span>{saldoFinal > 0 ? "Saldo a cobrar al recoger" : "Pagado por completo"}</span>
              <strong>{bs(saldoFinal)}</strong>
            </div>
            <Boton type="submit" bloque>Registrar pedido e imprimir ticket</Boton>
            <Boton type="button" tipo="secundario" bloque onClick={() => navegar("/pedidos")}>Cancelar</Boton>
          </Tarjeta>
        </aside>
      </form>

      <Modal abierto={!!creado} onCerrar={() => navegar(`/pedidos/${creado.ticket}`)} etiqueta="Ticket del pedido" ancho={380}>
        {creado && <Ticket pedido={creado} onCerrar={() => navegar(`/pedidos/${creado.ticket}`)} />}
      </Modal>
    </Pagina>
  );
}

function Errores({ lista }) {
  const visibles = lista.filter(Boolean);
  return (
    <AnimatePresence>
      {visibles.map((e) => (
        <motion.p key={e} className="texto-danger texto-chico" role="alert" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
          {e}
        </motion.p>
      ))}
    </AnimatePresence>
  );
}
