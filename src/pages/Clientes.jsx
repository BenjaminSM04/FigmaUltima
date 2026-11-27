import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { useApp } from "../store/AppContext";
import { Pagina } from "../components/Layout";
import { BadgeEstado, Boton, Campo, Etiqueta, HojaInferior, Modal, Tarjeta, Vacio } from "../components/ui";
import { bs, fechaCorta, iniciales } from "../utils/formato";
import { estadoVisible, saldo, tipoServicio } from "../utils/pedidos";
import { dur, ease, itemLista, lista } from "../ui/motion";
import { useEsMovil } from "../ui/useEsMovil";

const normalizar = (t) => t.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

export default function Clientes() {
  const { clientes, pedidos } = useApp();
  const esMovil = useEsMovil();
  const [busqueda, setBusqueda] = useState("");
  const [seleccion, setSeleccion] = useState(clientes[0]?.id ?? null);
  const [editando, setEditando] = useState(null); // null | "nuevo" | cliente
  const [fichaMovil, setFichaMovil] = useState(false);

  const filas = useMemo(() => {
    const q = normalizar(busqueda.trim());
    const digitos = q.replace(/\D/g, "");
    return clientes
      .map((c) => {
        const suyos = pedidos.filter((p) => p.clienteId === c.id).sort((a, b) => new Date(b.recibido) - new Date(a.recibido));
        return { ...c, pedidos: suyos, saldo: suyos.reduce((s, p) => s + saldo(p), 0), ultimo: suyos[0]?.recibido };
      })
      .filter((c) => !q || normalizar(c.nombre).includes(q) || (digitos.length >= 3 && c.telefono.replace(/\D/g, "").includes(digitos)))
      .sort((a, b) => new Date(b.ultimo ?? 0) - new Date(a.ultimo ?? 0));
  }, [clientes, pedidos, busqueda]);

  const elegido = filas.find((c) => c.id === seleccion) ?? null;

  return (
    <Pagina titulo="Clientes" descripcion="Datos de contacto, notas y saldo de cada cliente">
      <div className="columnas">
        <div className="col-principal pila">
          <div className="fila-flex alinear-abajo">
            <Campo etiqueta="Buscar cliente" id="buscar-cliente" className="crece" placeholder="Nombre o teléfono…" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
            <Boton icono="mas" onClick={() => setEditando("nuevo")}>Nuevo cliente</Boton>
          </div>
          <Tarjeta className="sin-padding">
            {filas.length === 0 ? (
              <Vacio>No se encontró ningún cliente.</Vacio>
            ) : (
              <div className="tabla-scroll">
                <table className="tabla">
                  <thead><tr><th>Cliente</th><th>Teléfono</th><th className="solo-escritorio-celda">Pedidos</th><th className="solo-escritorio-celda">Último pedido</th><th className="derecha">Saldo</th></tr></thead>
                  <motion.tbody variants={lista} initial="initial" animate="animate">
                    {filas.map((c) => (
                      <motion.tr key={c.id} layout variants={itemLista} className={`fila-clic ${c.id === seleccion ? "fila-seleccionada" : ""}`} onClick={() => { setSeleccion(c.id); setFichaMovil(true); }}>
                        <td className="negrita">{c.nombre}</td>
                        <td>{c.telefono}</td>
                        <td className="solo-escritorio-celda">{c.pedidos.length}</td>
                        <td className="solo-escritorio-celda texto-suave">{c.ultimo ? fechaCorta(c.ultimo) : "—"}</td>
                        <td className="derecha">{c.saldo > 0 ? <Etiqueta color="danger">{bs(c.saldo)}</Etiqueta> : <span className="texto-suave">Bs 0</span>}</td>
                      </motion.tr>
                    ))}
                  </motion.tbody>
                </table>
              </div>
            )}
          </Tarjeta>
        </div>

        {!esMovil && (
          <aside className="col-lateral">
            <Tarjeta className="pegajoso">
              {/* Fade cruzado al cambiar de cliente */}
              <AnimatePresence mode="wait">
                {elegido ? (
                  <motion.div key={elegido.id} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }} transition={{ duration: dur.normal, ease: ease.salida }}>
                    <Ficha c={elegido} onEditar={() => setEditando(elegido)} />
                  </motion.div>
                ) : (
                  <Vacio>Elige un cliente para ver su ficha.</Vacio>
                )}
              </AnimatePresence>
            </Tarjeta>
          </aside>
        )}
      </div>

      {esMovil && (
        <HojaInferior abierta={fichaMovil && !!elegido} onCerrar={() => setFichaMovil(false)} titulo={elegido?.nombre ?? ""} subtitulo={elegido?.telefono}>
          {elegido && <Ficha c={elegido} onEditar={() => { setFichaMovil(false); setEditando(elegido); }} sinCabecera />}
        </HojaInferior>
      )}

      <Modal abierto={!!editando} onCerrar={() => setEditando(null)} etiqueta="Datos del cliente" ancho={460}>
        {editando && <FormCliente inicial={editando === "nuevo" ? null : editando} onListo={(id) => { setEditando(null); if (id) setSeleccion(id); }} />}
      </Modal>
    </Pagina>
  );
}

function Ficha({ c, onEditar, sinCabecera }) {
  const navegar = useNavigate();
  const desde = new Date(c.desde);
  return (
    <div className="pila">
      {!sinCabecera && (
        <div className="fila-flex">
          <span className="avatar avatar-grande">{iniciales(c.nombre)}</span>
          <div>
            <h2 className="tarjeta-titulo">{c.nombre}</h2>
            <p className="texto-suave texto-chico">Cliente desde {MESES[desde.getMonth()]} {desde.getFullYear()} · {c.pedidos.length} pedidos</p>
          </div>
        </div>
      )}
      <dl className="datos">
        <div className="dato-fila"><dt>Teléfono</dt><dd><a href={`tel:${c.telefono.replace(/\s/g, "")}`}>{c.telefono}</a></dd></div>
        {c.direccion && <div className="dato-fila"><dt>Dirección</dt><dd>{c.direccion}</dd></div>}
        {c.nota && <div className="dato-fila"><dt>Nota</dt><dd><Etiqueta color="warning">{c.nota}</Etiqueta></dd></div>}
        <div className="dato-fila"><dt>Saldo pendiente</dt><dd>{c.saldo > 0 ? <Etiqueta color="danger">{bs(c.saldo)}</Etiqueta> : "Bs 0"}</dd></div>
      </dl>
      <hr />
      <h3 className="subtitulo">Pedidos recientes</h3>
      {c.pedidos.length === 0 && <p className="texto-suave texto-chico">Todavía no tiene pedidos.</p>}
      <motion.ul className="lista-simple" variants={lista} initial="initial" animate="animate">
        {c.pedidos.slice(0, 4).map((p) => (
          <motion.li key={p.ticket} variants={itemLista} className="fila-lista fila-clic" onClick={() => navegar(`/pedidos/${p.ticket}`)}>
            <div className="crece">
              <strong className="texto-primary">#{p.ticket}</strong>
              <span className="texto-suave texto-chico">{fechaCorta(p.recibido)} · {tipoServicio(p)} · {bs(p.total)}</span>
            </div>
            <BadgeEstado estado={estadoVisible(p)} corto />
          </motion.li>
        ))}
      </motion.ul>
      <Boton bloque onClick={() => navegar(`/pedidos/nuevo?tel=${encodeURIComponent(c.telefono)}`)}>Nuevo pedido para este cliente</Boton>
      <Boton bloque tipo="secundario" onClick={onEditar}>Editar datos</Boton>
    </div>
  );
}

function FormCliente({ inicial, onListo }) {
  const { guardarCliente, clientes } = useApp();
  const [f, setF] = useState(inicial ?? { nombre: "", telefono: "", direccion: "", nota: "" });
  const [error, setError] = useState("");
  const cambiar = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const guardar = (e) => {
    e.preventDefault();
    const tel = f.telefono.replace(/\D/g, "");
    if (!f.nombre.trim() || tel.length < 7) return setError("Nombre y teléfono (7 dígitos o más) son obligatorios");
    if (clientes.some((c) => c.id !== inicial?.id && c.telefono.replace(/\D/g, "") === tel)) return setError("Ya existe un cliente con ese teléfono");
    const cliente = { ...f, nombre: f.nombre.trim(), id: inicial?.id ?? "c" + Date.now(), desde: inicial?.desde ?? new Date().toISOString() };
    delete cliente.pedidos; delete cliente.saldo; delete cliente.ultimo;
    guardarCliente(cliente);
    onListo(cliente.id);
  };

  return (
    <form className="pila relleno-modal" onSubmit={guardar}>
      <h2 className="tarjeta-titulo">{inicial ? "Editar cliente" : "Nuevo cliente"}</h2>
      <Campo etiqueta="Nombre completo" id="f-nombre" value={f.nombre} onChange={cambiar("nombre")} autoFocus />
      <Campo etiqueta="Teléfono" id="f-tel" inputMode="tel" value={f.telefono} onChange={cambiar("telefono")} />
      <Campo etiqueta="Dirección (para domicilio)" id="f-dir" value={f.direccion} onChange={cambiar("direccion")} />
      <Campo etiqueta="Nota" id="f-nota" placeholder="Ej. sin suavizante" value={f.nota} onChange={cambiar("nota")} />
      {error && <p className="texto-danger texto-chico" role="alert">{error}</p>}
      <div className="fila-flex fin">
        <Boton type="button" tipo="secundario" onClick={() => onListo(null)}>Cancelar</Boton>
        <Boton type="submit">Guardar</Boton>
      </div>
    </form>
  );
}
