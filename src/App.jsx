import { HashRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { MotionConfig } from "motion/react";
import { AppProvider, useApp } from "./store/AppContext";
import { puedeVer, ROLES } from "./data/catalogos";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Panel from "./pages/Panel";
import NuevoPedido from "./pages/NuevoPedido";
import Pedidos from "./pages/Pedidos";
import DetallePedido from "./pages/DetallePedido";
import Tablero from "./pages/Tablero";
import Clientes from "./pages/Clientes";
import Domicilio from "./pages/Domicilio";
import Precios from "./pages/Precios";

/** Solo deja pasar si hay sesión y el rol puede ver la ruta. */
function Protegida({ children }) {
  const { sesion } = useApp();
  const { pathname } = useLocation();
  if (!sesion) return <Navigate to="/login" replace />;
  if (!puedeVer(sesion.rol, pathname)) return <Navigate to={ROLES[sesion.rol].inicio} replace />;
  return children;
}

function Inicio() {
  const { sesion } = useApp();
  return <Navigate to={sesion ? ROLES[sesion.rol].inicio : "/login"} replace />;
}

function Rutas() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<Protegida><Layout /></Protegida>}>
        <Route path="/panel" element={<Protegida><Panel /></Protegida>} />
        <Route path="/pedidos" element={<Protegida><Pedidos /></Protegida>} />
        <Route path="/pedidos/nuevo" element={<Protegida><NuevoPedido /></Protegida>} />
        <Route path="/pedidos/:ticket" element={<Protegida><DetallePedido /></Protegida>} />
        <Route path="/tablero" element={<Protegida><Tablero /></Protegida>} />
        <Route path="/clientes" element={<Protegida><Clientes /></Protegida>} />
        <Route path="/domicilio" element={<Protegida><Domicilio /></Protegida>} />
        <Route path="/precios" element={<Protegida><Precios /></Protegida>} />
      </Route>
      <Route path="*" element={<Inicio />} />
    </Routes>
  );
}

export default function App() {
  return (
    // reducedMotion="user": respeta la preferencia "reducir movimiento" del sistema
    <MotionConfig reducedMotion="user">
      <AppProvider>
        <HashRouter>
          <Rutas />
        </HashRouter>
      </AppProvider>
    </MotionConfig>
  );
}
