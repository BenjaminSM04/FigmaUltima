import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useApp } from "../store/AppContext";
import { Pagina } from "../components/Layout";
import { Alerta, Boton, Tarjeta } from "../components/ui";
import { dur, ease } from "../ui/motion";
import { PRECIOS_INICIALES } from "../data/semilla";

const REGLAS_KILO = [
  ["kilo", "Lavado y secado", "Precio por kg", "Bs"],
  ["planchado", "Planchado adicional", "Precio por kg", "Bs"],
  ["minimoKg", "Pedido mínimo", "Se cobra como mínimo", "kg"],
];
const REGLAS_RECARGO = [
  ["expressPct", "Servicio express", "Entrega en 24 horas", "%"],
  ["delivery", "Recojo o entrega a domicilio", "Por visita", "Bs"],
  ["diasAviso", "Aviso de ropa no reclamada", "Días después de estar lista", "días"],
  ["adelantoPct", "Adelanto sugerido", "Del total al recibir", "%"],
];

export default function Precios() {
  const { precios, guardarPrecios, restablecer } = useApp();
  const [borrador, setBorrador] = useState(precios);
  const [guardando, setGuardando] = useState(false);
  const cambiado = JSON.stringify(borrador) !== JSON.stringify(precios);

  const num = (v) => Math.max(0, Number(String(v).replace(",", ".")) || 0);
  const editado = (k) => borrador[k] !== precios[k];
  const prendaEditada = (p) => JSON.stringify(p) !== JSON.stringify(precios.prendas.find((x) => x.id === p.id));
  const editarPrenda = (id, cambios) => setBorrador((b) => ({ ...b, prendas: b.prendas.map((p) => (p.id === id ? { ...p, ...cambios } : p)) }));

  const guardar = () => {
    setGuardando(true);
    // Pequeña espera para que se vea el "guardando…" (sin servidor es instantáneo)
    setTimeout(() => {
      guardarPrecios(borrador);
      setGuardando(false);
    }, 500);
  };

  return (
    <Pagina titulo="Lista de precios" descripcion="Tarifas de lavado, tintorería y recargos">
      <div className="barra-filtros">
        <Alerta tipo="info" icono="info">
          Solo el administrador puede cambiar precios. Los cambios se aplican a los pedidos nuevos, no a los ya registrados.
        </Alerta>
        <div className="fila-flex">
          <Boton tipo="secundario" disabled={!cambiado || guardando} onClick={() => setBorrador(precios)}>Descartar</Boton>
          <Boton disabled={!cambiado || guardando} onClick={guardar}>
            <AnimatePresence mode="wait" initial={false}>
              <motion.span key={guardando ? "g" : "n"} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: dur.rapida }}>
                {guardando ? "Guardando…" : "Guardar cambios"}
              </motion.span>
            </AnimatePresence>
          </Boton>
        </div>
      </div>

      <div className="columnas">
        <Tarjeta
          className="col-principal sin-padding-tabla"
          titulo="Tintorería (precio por prenda)"
          subtitulo="Se elige al registrar cada prenda"
          accion={
            <Boton tipo="fantasma" icono="mas" onClick={() => setBorrador((b) => ({ ...b, prendas: [...b.prendas, { id: "prenda" + Date.now(), nombre: "Nueva prenda", dias: 2, precio: 0 }] }))}>
              Agregar prenda
            </Boton>
          }
        >
          <div className="tabla-scroll">
            <table className="tabla">
              <thead><tr><th>Prenda</th><th>Días</th><th>Precio (Bs)</th><th /></tr></thead>
              <tbody>
                <AnimatePresence initial={false}>
                  {borrador.prendas.map((p) => (
                    <motion.tr key={p.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: dur.normal, ease: ease.salida }}>
                      <td><input className={`campo-control campo-tabla ${prendaEditada(p) ? "editado" : ""}`} value={p.nombre} onChange={(e) => editarPrenda(p.id, { nombre: e.target.value })} aria-label="Nombre de la prenda" /></td>
                      <td><input className="campo-control campo-tabla campo-corto" inputMode="numeric" value={p.dias} onChange={(e) => editarPrenda(p.id, { dias: num(e.target.value) })} aria-label="Días" /></td>
                      <td><input className={`campo-control campo-tabla campo-corto ${prendaEditada(p) ? "editado" : ""}`} inputMode="decimal" value={p.precio} onChange={(e) => editarPrenda(p.id, { precio: num(e.target.value) })} aria-label="Precio" /></td>
                      <td className="derecha">
                        <button className="enlace texto-danger" onClick={() => setBorrador((b) => ({ ...b, prendas: b.prendas.filter((x) => x.id !== p.id) }))} disabled={borrador.prendas.length <= 1}>
                          Quitar
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </Tarjeta>

        <div className="col-lateral pila">
          {[["Lavado por kilo", REGLAS_KILO], ["Recargos y reglas", REGLAS_RECARGO]].map(([titulo, reglas]) => (
            <Tarjeta key={titulo} titulo={titulo}>
              <div className="reglas">
                {reglas.map(([k, nombre, ayuda, unidad]) => (
                  <label key={k} className="regla">
                    <span className="crece">
                      <strong>{nombre}</strong>
                      <span className="texto-suave texto-chico">{ayuda}</span>
                    </span>
                    <span className={`campo-unidad ${editado(k) ? "editado" : ""}`}>
                      <input inputMode="decimal" value={borrador[k]} onChange={(e) => setBorrador({ ...borrador, [k]: num(e.target.value) })} aria-label={nombre} />
                      <span>{unidad}</span>
                    </span>
                  </label>
                ))}
              </div>
            </Tarjeta>
          ))}
          <Tarjeta titulo="Datos de demostración" subtitulo="Vuelve a cargar los pedidos y clientes de ejemplo">
            <Boton tipo="secundario" bloque onClick={() => { if (confirm("¿Borrar todos los cambios y volver a los datos de ejemplo?")) { restablecer(); setBorrador(structuredClone(PRECIOS_INICIALES)); } }}>
              Restablecer datos
            </Boton>
          </Tarjeta>
        </div>
      </div>
    </Pagina>
  );
}
