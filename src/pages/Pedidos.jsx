import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { useApp } from "../store/AppContext";
import { Pagina } from "../components/Layout";
import { BadgeEstado, BadgePago, Boton, Chip, Selector, Tarjeta, Vacio } from "../components/ui";
import Icono from "../components/Icono";
import { ESTADOS } from "../data/catalogos";
import { bs, diaRelativo, fechaHora } from "../utils/formato";
import { estadoPago, estadoVisible, incidenciaAbierta, tipoServicio } from "../utils/pedidos";
import { dur, ease } from "../ui/motion";

const POR_PAGINA = 10;
const PERIODOS = { hoy: 1, semana: 7, mes: 31, todo: Infinity };
const normalizar = (t) => t.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

const fila = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0, transition: { duration: dur.normal, ease: ease.salida } },
  exit: { opacity: 0, transition: { duration: dur.rapida } },
};

export default function Pedidos() {
  const { pedidos, clientes, sesion } = useApp();
  const navegar = useNavigate();
  const [params, setParams] = useSearchParams();
  const q = params.get("q") ?? "";
  const [estado, setEstado] = useState("todos");
  const [servicio, setServicio] = useState("todos");
  const [periodo, setPeriodo] = useState("mes");
  const [pagina, setPagina] = useState(1);
  const cliente = (id) => clientes.find((c) => c.id === id);

  const filtrados = useMemo(() => {
    const desde = Date.now() - PERIODOS[periodo] * 86400000;
    const texto = normalizar(q.trim());
    return pedidos
      .filter((p) => periodo === "todo" || new Date(p.recibido).getTime() >= desde || p.estado !== "entregado")
      .filter((p) => servicio === "todos" || tipoServicio(p) === servicio)
      .filter((p) => {
        if (!texto) return true;
        const c = cliente(p.clienteId);
        const buscado = texto.replace(/^#/, "");
        const digitos = buscado.replace(/\D/g, "");
        const telefono = (c?.telefono ?? "").replace(/\D/g, "");
        return (
          p.ticket.includes(buscado) ||
          normalizar(c?.nombre ?? "").includes(buscado) ||
          (digitos.length >= 3 && telefono.includes(digitos))
        );
      })
      .sort((a, b) => b.ticket.localeCompare(a.ticket));
  }, [pedidos, clientes, q, servicio, periodo]); // eslint-disable-line react-hooks/exhaustive-deps

  const conteo = (id) =>
    id === "todos" ? filtrados.length : id === "incidencia" ? filtrados.filter(incidenciaAbierta).length : filtrados.filter((p) => p.estado === id).length;

  const visibles = filtrados.filter((p) =>
    estado === "todos" ? true : estado === "incidencia" ? incidenciaAbierta(p) : p.estado === estado
  );
  const paginas = Math.max(1, Math.ceil(visibles.length / POR_PAGINA));
  const actual = Math.min(pagina, paginas);
  const pagina_ = visibles.slice((actual - 1) * POR_PAGINA, actual * POR_PAGINA);

  const filtros = [{ id: "todos", nombre: "Todos" }, ...ESTADOS.map((e) => ({ id: e.id, nombre: e.corto ?? e.nombre })), { id: "incidencia", nombre: "Incidencia" }];

  return (
    <Pagina titulo="Pedidos" descripcion="Busca, filtra y revisa el estado de cada pedido">
      <div className="barra-filtros">
        <div className="chips desplazable">
          {filtros.map((f) => (
            <Chip key={f.id} nombre="estado" activo={estado === f.id} contador={conteo(f.id)} onClick={() => { setEstado(f.id); setPagina(1); }}>
              {f.nombre}
            </Chip>
          ))}
        </div>
        {sesion.rol !== "operario" && <Boton icono="mas" onClick={() => navegar("/pedidos/nuevo")}>Nuevo pedido</Boton>}
      </div>

      <div className="barra-filtros">
        <div className="fila-flex envolver">
          <Selector nombre="servicio" valor={servicio} onCambio={(v) => { setServicio(v); setPagina(1); }}
            opciones={[{ valor: "todos", texto: "Todos los servicios" }, "Por kilo", "Tintorería", "Mixto"]} />
          <Selector nombre="periodo" valor={periodo} onCambio={(v) => { setPeriodo(v); setPagina(1); }}
            opciones={[{ valor: "hoy", texto: "Hoy" }, { valor: "semana", texto: "Esta semana" }, { valor: "mes", texto: "Este mes" }, { valor: "todo", texto: "Todo" }]} />
        </div>
        <span className="texto-suave texto-chico">
          {q && (
            <button className="filtro-busqueda" onClick={() => setParams({})}>
              “{q}” <Icono nombre="cerrar" tam={12} />
            </button>
          )}
          Mostrando {pagina_.length} de {visibles.length} pedidos
        </span>
      </div>

      <Tarjeta className="sin-padding">
        {visibles.length === 0 ? (
          <Vacio>No hay pedidos con estos filtros.</Vacio>
        ) : (
          <>
            {/* Escritorio: tabla. Las filas que salen hacen fade y las que quedan se reacomodan. */}
            <div className="tabla-scroll solo-escritorio">
              <table className="tabla">
                <thead>
                  <tr><th>Ticket</th><th>Cliente</th><th>Servicio</th><th>Recibido</th><th>Entrega</th><th>Estado</th><th>Pago</th><th className="derecha">Total</th></tr>
                </thead>
                <tbody>
                  <AnimatePresence initial={false} mode="popLayout">
                    {pagina_.map((p) => (
                      <motion.tr key={p.ticket} layout variants={fila} initial="initial" animate="animate" exit="exit"
                        className="fila-clic" onClick={() => navegar(`/pedidos/${p.ticket}`)}>
                        <td className="negrita">#{p.ticket}</td>
                        <td>{cliente(p.clienteId)?.nombre}</td>
                        <td>{tipoServicio(p)}</td>
                        <td className="texto-suave">{fechaHora(p.recibido)}</td>
                        <td>{diaRelativo(p.entrega)}</td>
                        <td><BadgeEstado estado={estadoVisible(p)} /></td>
                        <td><BadgePago estado={estadoPago(p)} /></td>
                        <td className="derecha negrita">{bs(p.total)}</td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>

            {/* Móvil: lista de tarjetas */}
            <ul className="lista-movil solo-movil">
              <AnimatePresence initial={false} mode="popLayout">
                {pagina_.map((p) => (
                  <motion.li key={p.ticket} layout variants={fila} initial="initial" animate="animate" exit="exit"
                    className="fila-lista fila-clic" onClick={() => navegar(`/pedidos/${p.ticket}`)}>
                    <div className="crece">
                      <span className="texto-chico"><strong className="texto-primary">#{p.ticket}</strong> · {diaRelativo(p.entrega)}</span>
                      <strong>{cliente(p.clienteId)?.nombre}</strong>
                    </div>
                    <div className="pila-derecha">
                      <BadgeEstado estado={estadoVisible(p)} corto />
                      <strong className="texto-chico">{bs(p.total)}</strong>
                    </div>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          </>
        )}
      </Tarjeta>

      {paginas > 1 && (
        <div className="paginacion">
          <Boton tipo="secundario" disabled={actual === 1} onClick={() => setPagina(actual - 1)}>‹ Anterior</Boton>
          <span className="texto-suave">Página {actual} de {paginas}</span>
          <Boton tipo="secundario" disabled={actual === paginas} onClick={() => setPagina(actual + 1)}>Siguiente ›</Boton>
        </div>
      )}
    </Pagina>
  );
}
