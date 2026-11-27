// Tokens de movimiento: mismas duraciones y curvas en toda la app (ver docs/animaciones.md).

export const dur = { rapida: 0.15, normal: 0.25, lenta: 0.35 };

export const ease = {
  salida: [0.16, 1, 0.3, 1], // aparece rápido y frena suave
  entrada: [0.7, 0, 0.84, 0], // acelera al desaparecer
  estandar: [0.4, 0, 0.2, 1],
};

export const resorte = { type: "spring", stiffness: 420, damping: 34 };
export const resorteSuave = { type: "spring", stiffness: 300, damping: 30 };

/** Cambio de pantalla: solo entra el contenido (fade + desliz), el menú queda fijo. */
export const pagina = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: dur.normal, ease: ease.salida } },
};

/** Listas que aparecen escalonadas (filas, tarjetas). */
export const lista = {
  initial: {},
  animate: { transition: { staggerChildren: 0.04 } },
};

export const itemLista = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0, transition: { duration: dur.normal, ease: ease.salida } },
  exit: { opacity: 0, transition: { duration: dur.rapida } },
};

/** Tiembla horizontalmente (PIN incorrecto). */
export const temblor = {
  x: [0, -8, 8, -5, 5, 0],
  transition: { duration: 0.3 },
};
