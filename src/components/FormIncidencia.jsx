// Formulario de "Reportar incidencia" que se muestra dentro de una hoja inferior.
import { useState } from "react";
import { useApp } from "../store/AppContext";
import { TIPOS_INCIDENCIA } from "../data/catalogos";
import { Boton, Campo, Casilla, Chip, HojaInferior, Selector } from "./ui";

export default function FormIncidencia({ pedido, abierta, onCerrar }) {
  const { reportarIncidencia, clientes } = useApp();
  const opciones = [...(pedido.kilo ? ["Ropa por kilo"] : []), ...pedido.prendas.map((p) => p.nombre)];
  const [prenda, setPrenda] = useState(opciones[0]);
  const [tipo, setTipo] = useState(TIPOS_INCIDENCIA[0]);
  const [texto, setTexto] = useState("");
  const [avisar, setAvisar] = useState(true);
  const cliente = clientes.find((c) => c.id === pedido.clienteId);

  const enviar = (e) => {
    e.preventDefault();
    reportarIncidencia(pedido.ticket, {
      prenda,
      tipo,
      texto: texto.trim() + (avisar ? (texto.trim() ? " " : "") + "Avisar al cliente antes de la entrega." : ""),
    });
    setTexto("");
    onCerrar();
  };

  return (
    <HojaInferior abierta={abierta} onCerrar={onCerrar} titulo="Reportar incidencia" subtitulo={`#${pedido.ticket} · ${cliente?.nombre}`}>
      <form className="pila" onSubmit={enviar}>
        <div className="campo">
          <span className="campo-etiqueta">Prenda afectada</span>
          {opciones.length <= 3 ? (
            <Selector nombre="prenda-incidencia" bloque valor={prenda} onCambio={setPrenda} opciones={opciones} />
          ) : (
            <select className="campo-control" value={prenda} onChange={(e) => setPrenda(e.target.value)}>
              {opciones.map((o, i) => <option key={i}>{o}</option>)}
            </select>
          )}
        </div>
        <div className="campo">
          <span className="campo-etiqueta">¿Qué pasó?</span>
          <div className="chips envolver">
            {TIPOS_INCIDENCIA.map((t) => (
              <Chip key={t} nombre="tipo-incidencia" activo={tipo === t} onClick={() => setTipo(t)}>{t}</Chip>
            ))}
          </div>
        </div>
        <Campo etiqueta="Descripción" id="desc-incidencia" placeholder="Ej. la mancha de vino no salió por completo" value={texto} onChange={(e) => setTexto(e.target.value)} />
        <Casilla marcado={avisar} onCambio={setAvisar}>Avisar a mostrador para que llame al cliente</Casilla>
        <Boton type="submit" tipo="peligro" bloque>Reportar incidencia</Boton>
        <Boton type="button" tipo="secundario" bloque onClick={onCerrar}>Cancelar</Boton>
      </form>
    </HojaInferior>
  );
}
