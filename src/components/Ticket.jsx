// Ticket imprimible (80 mm). Se imprime con window.print(); el CSS de impresión oculta el resto.
import { useApp } from "../store/AppContext";
import { bs, fechaCorta, hora } from "../utils/formato";
import { saldo, totalPagado } from "../utils/pedidos";
import { Boton } from "./ui";

export function imprimirTicket() {
  document.body.classList.add("imprimiendo");
  window.print();
  setTimeout(() => document.body.classList.remove("imprimiendo"), 300);
}

export default function Ticket({ pedido, onCerrar }) {
  const { clientes } = useApp();
  const c = clientes.find((x) => x.id === pedido.clienteId);
  const fecha = (iso) => `${fechaCorta(iso)}/${new Date(iso).getFullYear()} ${hora(iso)}`;
  return (
    <div className="ticket-envoltura">
      <article className="ticket" id="ticket-imprimible">
        <header className="centrado">
          <strong className="ticket-marca">EL VAPOR AZUL</strong>
          <p>Lavandería y Tintorería</p>
          <p className="texto-chico">Calle Sucre 245 · Tel. 4 452 1188</p>
        </header>
        <hr />
        <h3 className="ticket-numero">TICKET #{pedido.ticket}</h3>
        <hr />
        <dl className="ticket-datos">
          <dt>Cliente</dt><dd>{c?.nombre}</dd>
          <dt>Teléfono</dt><dd>{c?.telefono}</dd>
          <dt>Recibido</dt><dd>{fecha(pedido.recibido)}</dd>
          <dt>Entrega</dt><dd>{fecha(pedido.entrega)}{pedido.tipoEntrega === "domicilio" ? " · domicilio" : ""}</dd>
        </dl>
        <hr />
        <dl className="ticket-datos">
          {pedido.lineas.map((l, i) => (
            <div key={i} className="ticket-linea"><dt>{l.concepto}</dt><dd>{bs(l.monto)}</dd></div>
          ))}
        </dl>
        <hr />
        <dl className="ticket-datos">
          <div className="ticket-linea ticket-total"><dt>TOTAL</dt><dd>{bs(pedido.total)}</dd></div>
          <div className="ticket-linea"><dt>A cuenta</dt><dd>{bs(totalPagado(pedido))}</dd></div>
          <div className="ticket-linea"><dt>SALDO</dt><dd>{bs(saldo(pedido))}</dd></div>
        </dl>
        <hr />
        <p className="centrado texto-chico">Presente este ticket para recoger su ropa. Revise sus prendas al recibirlas.</p>
      </article>
      <div className="ticket-acciones no-imprimir">
        <Boton tipo="secundario" onClick={onCerrar}>Cerrar</Boton>
        <Boton icono="imprimir" onClick={imprimirTicket}>Imprimir</Boton>
      </div>
    </div>
  );
}
