// Íconos de trazo (24×24). Heredan el color del texto con currentColor.
const RUTAS = {
  inicio: <><path d="M3 11 12 4l9 7" /><path d="M5 10v10h14V10" /></>,
  mas: <><path d="M12 5v14M5 12h14" /></>,
  pedidos: <><path d="M6 3h12v18l-3-2-3 2-3-2-3 2z" /><path d="M9 8h6M9 12h6" /></>,
  tareas: <><path d="M9 3h6v3H9z" /><path d="M9 4.5H6V21h12V4.5h-3" /><path d="M9 11h6M9 15h4" /></>,
  clientes: <><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20c1-3.5 3.5-5 6.5-5s5.5 1.5 6.5 5" /><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 15c2 .6 3.2 2.2 3.8 5" /></>,
  ruta: <><path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z" /><circle cx="12" cy="10" r="2.5" /></>,
  ajustes: <><path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12" /><circle cx="16" cy="6" r="2" /><circle cx="10" cy="12" r="2" /><circle cx="18" cy="18" r="2" /></>,
  buscar: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
  reloj: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  atras: <path d="m15 18-6-6 6-6" />,
  cerrar: <path d="M6 6l12 12M18 6 6 18" />,
  check: <path d="m5 12 5 5 9-10" />,
  alerta: <><path d="M12 3 2 21h20L12 3z" /><path d="M12 10v5M12 18h.01" /></>,
  info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v6M12 7.5h.01" /></>,
  telefono: <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2" />,
  navegar: <path d="m3 11 18-8-8 18-2-8z" />,
  basura: <><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14" /></>,
  imprimir: <><path d="M6 9V3h12v6" /><rect x="3" y="9" width="18" height="8" rx="2" /><path d="M6 14h12v7H6z" /></>,
  salir: <><path d="M15 4h4v16h-4" /><path d="M10 8l-4 4 4 4M6 12h10" /></>,
  menu: <><circle cx="5" cy="12" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /></>,
  campana: <><path d="M6 16v-5a6 6 0 1 1 12 0v5l2 2H4z" /><path d="M10 21h4" /></>,
};

export default function Icono({ nombre, tam = 20, grosor = 2, className, ...resto }) {
  return (
    <svg
      width={tam}
      height={tam}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={grosor}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
      {...resto}
    >
      {RUTAS[nombre]}
    </svg>
  );
}

export function Logo({ tam = 36 }) {
  return (
    <svg width={tam} height={tam} viewBox="0 0 36 36" fill="none" aria-hidden="true">
      <rect width="36" height="36" rx="10" fill="var(--primary)" />
      <path
        className="logo-vapor"
        d="M13 12c0-2 2-2 2-4M18 12c0-2 2-2 2-4M23 12c0-2 2-2 2-4"
        stroke="var(--accent)"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path d="M9 17h18l-2 10H11z" fill="#fff" />
    </svg>
  );
}
