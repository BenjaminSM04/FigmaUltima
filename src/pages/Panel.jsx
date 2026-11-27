import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { useApp } from "../store/AppContext";
import { Pagina } from "../components/Layout";
import { BadgeEstado, BadgePago, Boton, Etiqueta, StatCard, Tarjeta, Vacio } from "../components/ui";
import { ESTADOS } from "../data/catalogos";
import { bs, diaRelativo } from "../utils/formato";
import { atrasado, diasSinRecoger, esHoy, estadoPago, estadoVisible, saldo } from "../utils/pedidos";
import { ease, itemLista, lista } from "../ui/motion";

export default function Panel() {
  const { pedidos, clientes, precios, registrarAviso } = useApp();
  const navegar = useNavigate();
  const cliente = (id) => clientes.find((c) => c.id === id);

  const d = useMemo(() => {
    const activos = pedidos.filter((p) => p.estado !== "entregado");
    const pagosHoy = pedidos.flatMap((p) => p.pagos).filter((x) => esHoy(x.fecha));
    const porMetodo = pagosHoy.reduce((acc, x) => ({ ...acc, [x.metodo]: (acc[x.metodo] || 0) + x.monto }), {});
    const listos = activos.filter((p) => p.estado === "listo");
    const conSaldo = activos.filter((p) => saldo(p) > 0);
    return {
      recibidosHoy: pedidos.filter((p) => esHoy(p.recibido)).length,
      listos,
      viejos: listos.filter((p) => diasSinRecoger(p) >= precios.diasAviso).sort((a, b) => diasSinRecoger(b) - diasSinRecoger(a)),
      porCobrar: conSaldo.reduce((s, p) => s + saldo(p), 0),
      conSaldo: conSaldo.length,
      ingresos: pagosHoy.reduce((s, x) => s + x.monto, 0),
      porMetodo,
      entregas: activos
        .filter((p) => p.estado !== "listo" && (esHoy(p.entrega) || atrasado(p)))
        .concat(listos.filter((p) => esHoy(p.entrega)))
        .sort((a, b) => new Date(a.entrega) - new Date(b.entrega)),
      enProceso: ESTADOS.filter((e) => e.id !== "entregado").map((e) => ({ ...e, n: activos.filter((p) => p.estado === e.id).length })),
    };
  }, [pedidos, precios.diasAviso]);

  const maxBarra = Math.max(1, ...d.enProceso.map((e) => e.n));
  const detalleIngresos = Object.entries(d.porMetodo).map(([m, v]) => `${m} ${bs(v)}`).join(" · ") || "Sin cobros todavía";

  return (
    <Pagina titulo="Panel del día" descripcion="Resumen de pedidos, cobros y ropa pendiente de recoger">
      <div className="grilla-stats">
        <StatCard titulo="Pedidos recibidos hoy" valor={d.recibidosHoy} detalle={`${pedidos.filter((p) => p.estado !== "entregado").length} en total sin entregar`} />
        <StatCard titulo="Listos sin recoger" valor={d.listos.length} detalle={`${d.viejos.length} con más de ${precios.diasAviso} días`} colorDetalle={d.viejos.length ? "warning" : undefined} />
        <StatCard titulo="Saldo por cobrar" valor={d.porCobrar} formato={bs} detalle={`${d.conSaldo} pedidos con saldo`} />
        <StatCard titulo="Ingresos de hoy" valor={d.ingresos} formato={bs} detalle={detalleIngresos} />
      </div>

      <div className="columnas">
        <Tarjeta
          className="col-principal sin-padding"
          titulo="Entregas de hoy y atrasadas"
          subtitulo="Pedidos con fecha de entrega vencida o para hoy"
          accion={<Boton tipo="secundario" onClick={() => navegar("/pedidos")}>Ver todos los pedidos</Boton>}
        >
          {d.entregas.length === 0 ? (
            <Vacio>No hay entregas pendientes para hoy. 🎉</Vacio>
          ) : (
            <div className="tabla-scroll">
              <table className="tabla">
                <thead>
                  <tr><th>Ticket</th><th>Cliente</th><th>Entrega</th><th>Estado</th><th>Pago</th></tr>
                </thead>
                <motion.tbody variants={lista} initial="initial" animate="animate">
                  {d.entregas.map((p) => (
                    <motion.tr key={p.ticket} variants={itemLista} className="fila-clic" onClick={() => navegar(`/pedidos/${p.ticket}`)}>
                      <td className="negrita">#{p.ticket}</td>
                      <td>{cliente(p.clienteId)?.nombre}</td>
                      <td>{atrasado(p) ? <Etiqueta color="danger">Atrasado · {diaRelativo(p.entrega)}</Etiqueta> : diaRelativo(p.entrega)}</td>
                      <td><BadgeEstado estado={estadoVisible(p)} /></td>
                      <td><BadgePago estado={estadoPago(p)} /></td>
                    </motion.tr>
                  ))}
                </motion.tbody>
              </table>
            </div>
          )}
        </Tarjeta>

        <div className="col-lateral">
          <Tarjeta titulo="Ropa no reclamada" subtitulo={`Lista para recoger hace más de ${precios.diasAviso} días`}>
            {d.viejos.length === 0 ? (
              <Vacio>Nadie tiene ropa olvidada.</Vacio>
            ) : (
              <motion.ul className="lista-simple" variants={lista} initial="initial" animate="animate">
                {d.viejos.map((p) => {
                  const dias = diasSinRecoger(p);
                  const c = cliente(p.clienteId);
                  return (
                    <motion.li key={p.ticket} variants={itemLista} className="fila-lista">
                      <div className="crece">
                        <strong>{c?.nombre}</strong>
                        <span className={`texto-chico texto-${dias >= 14 ? "danger" : "warning"}`}>
                          #{p.ticket} · {dias} días{p.avisos?.length ? ` · avisado ${p.avisos.length}×` : ""}
                        </span>
                      </div>
                      <Boton tipo="fantasma" icono="telefono" onClick={() => registrarAviso(p.ticket, c?.nombre)}>
                        Llamar
                      </Boton>
                    </motion.li>
                  );
                })}
              </motion.ul>
            )}
          </Tarjeta>

          <Tarjeta titulo="Pedidos en proceso">
            <div className="barras">
              {d.enProceso.map((e, i) => (
                <div key={e.id} className="barra-fila">
                  <span className="texto-chico texto-suave barra-nombre">{e.corto ?? e.nombre}</span>
                  <div className="barra-pista">
                    {/* Las barras crecen de izquierda a derecha */}
                    <motion.div
                      className={`barra-relleno fondo-${e.color}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${(e.n / maxBarra) * 100}%` }}
                      transition={{ delay: 0.1 + i * 0.05, duration: 0.6, ease: ease.salida }}
                    />
                  </div>
                  <strong className="texto-chico">{e.n}</strong>
                </div>
              ))}
            </div>
          </Tarjeta>
        </div>
      </div>
    </Pagina>
  );
}
