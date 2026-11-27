import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { motion, useAnimation } from "motion/react";
import { ROLES, USUARIOS } from "../data/catalogos";
import { useApp } from "../store/AppContext";
import { Boton, Campo, Selector } from "../components/ui";
import Icono, { Logo } from "../components/Icono";
import { dur, ease, temblor } from "../ui/motion";

const BENEFICIOS = [
  "Cada prenda registrada con su número de ticket",
  "Sabe en qué estado está cada pedido",
  "Controla cobros, saldos y ropa sin recoger",
];

export default function Login() {
  const { sesion, iniciarSesion } = useApp();
  const navegar = useNavigate();
  const [rol, setRol] = useState("mostrador");
  const [usuario, setUsuario] = useState("rosa.quispe");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const tarjeta = useAnimation();

  useEffect(() => {
    tarjeta.start({ opacity: 1, y: 0, transition: { duration: dur.lenta, ease: ease.salida } });
  }, [tarjeta]);

  if (sesion) return <Navigate to={ROLES[sesion.rol].inicio} replace />;

  const cambiarRol = (r) => {
    setRol(r);
    setUsuario(USUARIOS.find((u) => u.rol === r).usuario);
    setError("");
  };

  const entrar = (e) => {
    e.preventDefault();
    const u = USUARIOS.find((x) => x.usuario === usuario.trim().toLowerCase() && x.rol === rol);
    if (!u || u.pin !== pin) {
      setError("Usuario o PIN incorrecto");
      tarjeta.start(temblor);
      return;
    }
    iniciarSesion(u);
    navegar(ROLES[u.rol].inicio, { replace: true });
  };

  return (
    <div className="login">
      <section className="login-marca">
        <motion.div
          className="login-marca-contenido"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: dur.lenta, ease: ease.salida }}
        >
          <Logo tam={64} />
          <h1>El Vapor Azul</h1>
          <p className="login-sub">Lavandería y Tintorería</p>
          <ul className="login-beneficios">
            {BENEFICIOS.map((b, i) => (
              <motion.li
                key={b}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 + i * 0.08, duration: dur.normal, ease: ease.salida }}
              >
                <span className="login-check"><Icono nombre="check" tam={14} grosor={3} /></span>
                {b}
              </motion.li>
            ))}
          </ul>
        </motion.div>
      </section>

      <section className="login-formulario">
        <motion.form
          className="login-tarjeta"
          onSubmit={entrar}
          initial={{ opacity: 0, y: 16 }}
          animate={tarjeta}
        >
          <div>
            <h2>Iniciar sesión</h2>
            <p className="texto-suave">¿Con qué rol vas a trabajar hoy?</p>
          </div>
          <Selector
            nombre="rol"
            bloque
            valor={rol}
            onCambio={cambiarRol}
            opciones={[
              { valor: "admin", texto: "Administrador" },
              { valor: "mostrador", texto: "Mostrador" },
              { valor: "operario", texto: "Operario" },
            ]}
          />
          <Campo etiqueta="Usuario" id="usuario" value={usuario} onChange={(e) => setUsuario(e.target.value)} autoComplete="username" />
          <Campo
            etiqueta="PIN de 4 dígitos"
            id="pin"
            type="password"
            inputMode="numeric"
            maxLength={4}
            value={pin}
            onChange={(e) => { setPin(e.target.value.replace(/\D/g, "")); setError(""); }}
            autoComplete="current-password"
            autoFocus
          />
          {error && (
            <motion.p className="texto-danger texto-chico" initial={{ opacity: 0 }} animate={{ opacity: 1 }} role="alert">
              {error}
            </motion.p>
          )}
          <Boton type="submit" bloque>Ingresar</Boton>
          <p className="texto-suave texto-chico centrado">
            Demo sin servidor: PIN <strong>1234</strong> para todos. Los datos se guardan solo en este navegador.
          </p>
        </motion.form>
      </section>
    </div>
  );
}
