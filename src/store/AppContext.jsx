// Estado global de la app. Sin servidor: todo vive en memoria y se guarda en localStorage.
import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { crearDatosIniciales } from "../data/semilla";
import { ESTADO } from "../data/catalogos";
import { redondear, saldo, siguienteEstado } from "../utils/pedidos";
import { bs } from "../utils/formato";

const CLAVE = "vapor-azul:datos:v1";
const CLAVE_SESION = "vapor-azul:sesion:v1";

function leer(clave, porDefecto) {
  try {
    const crudo = localStorage.getItem(clave);
    return crudo ? JSON.parse(crudo) : porDefecto();
  } catch {
    return porDefecto();
  }
}

const ahora = () => new Date().toISOString();

function actualizarPedido(estado, ticket, cambio) {
  return {
    ...estado,
    pedidos: estado.pedidos.map((p) => (p.ticket === ticket ? { ...p, ...cambio(p) } : p)),
  };
}

function reducer(estado, { tipo, ...a }) {
  switch (tipo) {
    case "CREAR_PEDIDO":
      return { ...estado, pedidos: [a.pedido, ...estado.pedidos] };

    case "CAMBIAR_ESTADO":
      return actualizarPedido(estado, a.ticket, (p) => ({
        estado: a.estado,
        historial: [...p.historial, { estado: a.estado, fecha: ahora(), usuario: a.usuario }],
      }));

    case "RESTAURAR_PEDIDO": // usado por "Deshacer"
      return actualizarPedido(estado, a.pedido.ticket, () => a.pedido);

    case "REGISTRAR_PAGO":
      return actualizarPedido(estado, a.ticket, (p) => ({
        pagos: [...p.pagos, { monto: redondear(a.monto), metodo: a.metodo, fecha: ahora() }],
      }));

    case "REPORTAR_INCIDENCIA":
      return actualizarPedido(estado, a.ticket, () => ({
        incidencia: { ...a.incidencia, fecha: ahora(), por: a.usuario, avisado: false },
      }));

    case "MARCAR_AVISADO":
      return actualizarPedido(estado, a.ticket, (p) => ({ incidencia: { ...p.incidencia, avisado: true } }));

    case "REGISTRAR_AVISO": // llamada al cliente por ropa no reclamada
      return actualizarPedido(estado, a.ticket, (p) => ({ avisos: [...(p.avisos || []), { fecha: ahora(), usuario: a.usuario }] }));

    case "GUARDAR_PRECIOS":
      return { ...estado, precios: a.precios };

    case "GUARDAR_CLIENTE": {
      const existe = estado.clientes.some((c) => c.id === a.cliente.id);
      return {
        ...estado,
        clientes: existe
          ? estado.clientes.map((c) => (c.id === a.cliente.id ? a.cliente : c))
          : [a.cliente, ...estado.clientes],
      };
    }

    case "PROGRAMAR_VISITA":
      return { ...estado, visitas: [...estado.visitas, a.visita] };

    case "ESTADO_VISITA":
      return { ...estado, visitas: estado.visitas.map((v) => (v.id === a.id ? { ...v, estado: a.estado } : v)) };

    case "RESTABLECER":
      return crearDatosIniciales();

    default:
      throw new Error("Acción desconocida: " + tipo);
  }
}

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [datos, despachar] = useReducer(reducer, null, () => leer(CLAVE, crearDatosIniciales));
  const [sesion, setSesion] = useState(() => leer(CLAVE_SESION, () => null));
  const [toasts, setToasts] = useState([]);
  const idToast = useRef(0);

  useEffect(() => {
    try {
      localStorage.setItem(CLAVE, JSON.stringify(datos));
    } catch {
      /* modo privado o almacenamiento lleno: la app sigue funcionando en memoria */
    }
  }, [datos]);

  useEffect(() => {
    try {
      if (sesion) localStorage.setItem(CLAVE_SESION, JSON.stringify(sesion));
      else localStorage.removeItem(CLAVE_SESION);
    } catch {
      /* ignorar */
    }
  }, [sesion]);

  const cerrarToast = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), []);
  const toast = useCallback(
    (mensaje, { tipo = "exito", deshacer = null, duracion = 4500 } = {}) => {
      const id = ++idToast.current;
      setToasts((t) => [...t.slice(-2), { id, mensaje, tipo, deshacer }]);
      setTimeout(() => cerrarToast(id), duracion);
    },
    [cerrarToast]
  );

  const usuario = sesion?.nombre ?? "Sistema";

  const acciones = useMemo(() => {
    const buscar = (ticket) => datos.pedidos.find((p) => p.ticket === ticket);
    return {
      iniciarSesion: (u) => setSesion({ usuario: u.usuario, nombre: u.nombre, rol: u.rol }),
      cerrarSesion: () => setSesion(null),

      siguienteTicket: () =>
        String(Math.max(0, ...datos.pedidos.map((p) => Number(p.ticket))) + 1).padStart(4, "0"),

      crearPedido: (pedido) => {
        despachar({ tipo: "CREAR_PEDIDO", pedido });
        toast(`Pedido #${pedido.ticket} registrado`);
      },

      avanzar: (ticket) => {
        const p = buscar(ticket);
        const sig = p && siguienteEstado(p);
        if (!sig) return;
        despachar({ tipo: "CAMBIAR_ESTADO", ticket, estado: sig, usuario });
        toast(`#${ticket} pasó a ${ESTADO[sig].corto ?? ESTADO[sig].nombre}`, {
          deshacer: () => despachar({ tipo: "RESTAURAR_PEDIDO", pedido: p }),
        });
      },

      cambiarEstado: (ticket, estado) => {
        despachar({ tipo: "CAMBIAR_ESTADO", ticket, estado, usuario });
        toast(`#${ticket} ahora está: ${ESTADO[estado].nombre}`);
      },

      registrarPago: (ticket, monto, metodo) => {
        despachar({ tipo: "REGISTRAR_PAGO", ticket, monto, metodo });
        toast(`Pago de ${bs(monto)} registrado en #${ticket}`);
      },

      /** Entrega el pedido. Devuelve false si todavía tiene saldo. */
      entregar: (ticket) => {
        const p = buscar(ticket);
        if (!p) return false;
        if (saldo(p) > 0) {
          toast(`#${ticket} tiene saldo pendiente. Cobra antes de entregar.`, { tipo: "alerta" });
          return false;
        }
        despachar({ tipo: "CAMBIAR_ESTADO", ticket, estado: "entregado", usuario });
        toast(`#${ticket} entregado`);
        return true;
      },

      reportarIncidencia: (ticket, incidencia) => {
        despachar({ tipo: "REPORTAR_INCIDENCIA", ticket, incidencia, usuario });
        toast(`Incidencia reportada en #${ticket}`, { tipo: "alerta" });
      },

      marcarAvisado: (ticket) => {
        despachar({ tipo: "MARCAR_AVISADO", ticket });
        toast(`Incidencia de #${ticket} marcada como avisada`);
      },

      registrarAviso: (ticket, nombre) => {
        despachar({ tipo: "REGISTRAR_AVISO", ticket, usuario });
        toast(`Llamada a ${nombre} registrada`);
      },

      guardarPrecios: (precios) => {
        despachar({ tipo: "GUARDAR_PRECIOS", precios });
        toast("Precios guardados. Se aplican a pedidos nuevos.");
      },

      guardarCliente: (cliente) => {
        despachar({ tipo: "GUARDAR_CLIENTE", cliente });
        toast(`Cliente ${cliente.nombre} guardado`);
      },

      programarVisita: (visita) => {
        despachar({ tipo: "PROGRAMAR_VISITA", visita });
        toast("Visita programada");
      },

      estadoVisita: (id, estado) => despachar({ tipo: "ESTADO_VISITA", id, estado }),

      restablecer: () => {
        despachar({ tipo: "RESTABLECER" });
        toast("Datos de demostración restablecidos");
      },
    };
  }, [datos.pedidos, usuario, toast]);

  const valor = useMemo(
    () => ({ ...datos, sesion, toasts, toast, cerrarToast, ...acciones }),
    [datos, sesion, toasts, toast, cerrarToast, acciones]
  );

  return <AppContext.Provider value={valor}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp debe usarse dentro de <AppProvider>");
  return ctx;
}

export const useCliente = (id) => useApp().clientes.find((c) => c.id === id);
