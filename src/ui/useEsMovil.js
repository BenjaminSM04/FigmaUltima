import { useEffect, useState } from "react";

const CONSULTA = "(max-width: 900px)";

/** true cuando la pantalla es de celular o tablet chica (mismo corte que el CSS). */
export function useEsMovil() {
  const [esMovil, setEsMovil] = useState(() => window.matchMedia(CONSULTA).matches);
  useEffect(() => {
    const mq = window.matchMedia(CONSULTA);
    const alCambiar = (e) => setEsMovil(e.matches);
    mq.addEventListener("change", alCambiar);
    return () => mq.removeEventListener("change", alCambiar);
  }, []);
  return esMovil;
}
