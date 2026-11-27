# Animaciones para la versión React

Las animaciones sirven para **explicar qué pasó**: un pedido avanzó, se registró un pago, apareció
una alerta. No son decoración. En una lavandería con mostrador ocupado, todo debe ser **rápido**
(menos de 400 ms) y nunca bloquear al usuario.

Librería sugerida: [Motion](https://motion.dev) (antes Framer Motion), con `npm i motion` e
`import { motion, AnimatePresence } from "motion/react"`. Las animaciones simples (hover, foco)
van en CSS puro.

## 1. Tokens de movimiento

Definirlos una sola vez, en `src/ui/motion.js`, y reutilizarlos en toda la app:

```js
export const dur = { rapida: 0.15, normal: 0.25, lenta: 0.35 };
export const ease = {
  salida: [0.16, 1, 0.3, 1],   // entra rápido y frena suave (aparecer)
  entrada: [0.7, 0, 0.84, 0],  // acelera (desaparecer)
  estandar: [0.4, 0, 0.2, 1],
};
export const resorte = { type: "spring", stiffness: 420, damping: 32 }; // tarjetas que se mueven
```

| Duración | Uso |
|----------|-----|
| 150 ms   | hover, foco, presionar botón, checkbox |
| 250 ms   | cambiar de pantalla, abrir/cerrar paneles, toasts |
| 350 ms   | hoja inferior móvil, confirmación de éxito |

**Accesibilidad:** respetar `prefers-reduced-motion`. Con Motion basta con envolver la app en
`<MotionConfig reducedMotion="user">`. En CSS:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
}
```

## 2. Microinteracciones (CSS)

| Elemento | Animación |
|---|---|
| Botón | hover: fondo `--primary` → `--primary-dark` en 150 ms · al presionar: `transform: scale(0.97)` |
| Campo de texto | foco: borde `--primary` + `box-shadow: 0 0 0 3px var(--primary-soft)` en 150 ms |
| Fila de tabla | hover: fondo `--bg` en 150 ms (indica que se puede hacer clic) |
| Ítem del menú lateral | el resaltado azul **se desliza** al ítem activo (`layoutId="nav-activo"` en Motion) |
| Pestaña de la barra inferior (móvil) | la "píldora" del ícono se desliza entre pestañas (`layoutId`) |
| Checkbox | el check se dibuja (animar `pathLength` de 0 a 1 en 150 ms) |
| Badge de estado | al cambiar de estado, cruce de color en 250 ms y un pequeño `scale` 1 → 1.08 → 1 |

```jsx
// Indicador del menú que se desliza entre opciones
{activo && <motion.span layoutId="nav-activo" className="nav-indicador" transition={resorte} />}
```

## 3. Animaciones por pantalla

### Escritorio

| Pantalla | Animación | Por qué |
|---|---|---|
| **Inicio de sesión** | la tarjeta entra desde abajo con fade (y: 16 → 0) · el rol elegido se resalta con el borde que se desliza (`layoutId`) · PIN incorrecto: la tarjeta tiembla (x: 0, -8, 8, -4, 4, 0 en 300 ms) | da sensación de respuesta sin mensajes largos |
| **Cambio de pantalla** | solo el contenido principal hace fade + y: 8 → 0 (250 ms); el sidebar y la barra superior **no** se mueven | el usuario no pierde la orientación |
| **Panel del día** | los números de las tarjetas cuentan desde 0 (`animate()` de Motion, 600 ms, solo la primera vez) · las barras de "Pedidos en proceso" crecen de izquierda a derecha · las filas aparecen escalonadas (`staggerChildren: 0.04`) | lo importante entra primero |
| **Nuevo pedido** | al agregar una prenda, la fila se expande en altura (`AnimatePresence` + `height: auto`) · al eliminarla, se colapsa · el **total** del resumen hace un "tick" (scale 1.05) cada vez que cambia | se ve que el precio se recalculó |
| **Ticket** | aparece como modal: fondo con fade y ticket con y: 24 → 0 + scale 0.98 → 1 | se ve como un papel que sale |
| **Pedidos** | al cambiar de filtro, las filas que se van hacen fade y las que quedan se reacomodan (`layout`) · el chip activo desliza su fondo | el filtro se entiende sin leer |
| **Tablero de trabajo** | al pulsar "Pasar a…", la tarjeta **viaja** a la siguiente columna (`layout` + `layoutId` por ticket) y el contador de cada columna se actualiza · opcional: arrastrar y soltar con `drag` | es la animación más importante: muestra el avance real del pedido |
| **Detalle del pedido** | la línea del historial agrega el nuevo estado con fade + desliz · la alerta de saldo entra con un pulso suave (1 vez, sin loop) · al registrar el pago, la alerta se colapsa y el badge cambia de **Parcial** a **Pagado** | confirma la acción sin un popup |
| **Clientes** | la ficha de la derecha cambia con fade cruzado al seleccionar otro cliente | |
| **Domicilio** | al guardar una visita, la nueva tarjeta entra en su franja horaria con desliz | |
| **Precios** | campo editado: fondo `--warning-soft` hasta guardar · "Guardar cambios" muestra spinner → check | se ve qué falta guardar |

### Móvil

| Pantalla | Animación |
|---|---|
| **Navegación** | push horizontal (la nueva pantalla entra desde la derecha, 300 ms). "Atrás" hace lo inverso. Las pestañas inferiores cambian con fade, sin push. |
| **Mis tareas** | al pulsar "Pasar a Secando →", la tarjeta sale hacia la derecha con fade y las demás suben (`AnimatePresence` + `layout`) · toast abajo: "#0143 pasó a Secando · Deshacer" (5 s) |
| **Detalle del pedido** | el paso actual del progreso **late** una vez al entrar · al marcar "Listo", la línea se llena hasta el siguiente paso (scaleX) |
| **Reportar incidencia** | hoja inferior: fondo oscuro con fade 0 → 50 % y hoja y: 100 % → 0 con resorte · se puede cerrar arrastrando hacia abajo (`drag="y"`, si y > 120 px → cerrar) |
| **Ruta** | la barra "3 de 7 visitas" crece al completar una entrega · la "Siguiente visita" entra con resaltado |
| **Entrega confirmada** | círculo verde con scale 0 → 1 (resorte) y el check se dibuja (`pathLength`) 150 ms después · vibración corta (`navigator.vibrate?.(30)`) |
| **Panel del dueño** | el monto de ingresos cuenta hacia arriba · las tarjetas de "Requiere tu atención" entran escalonadas |

## 4. Ejemplos de código

**Hoja inferior (Reportar incidencia)**

```jsx
<AnimatePresence>
  {abierta && (
    <>
      <motion.div className="fondo-oscuro" onClick={cerrar}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
      <motion.section className="hoja-inferior"
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={resorte}
        drag="y" dragConstraints={{ top: 0 }} dragElastic={0.2}
        onDragEnd={(_, info) => info.offset.y > 120 && cerrar()}>
        {/* formulario */}
      </motion.section>
    </>
  )}
</AnimatePresence>
```

**Tarjeta que viaja entre columnas del tablero**

```jsx
<LayoutGroup>
  {columnas.map((col) => (
    <div key={col.estado} className="columna">
      {pedidos.filter((p) => p.estado === col.estado).map((p) => (
        <motion.article key={p.ticket} layoutId={p.ticket} layout transition={resorte}>
          <TarjetaPedido pedido={p} onAvanzar={() => avanzar(p.ticket)} />
        </motion.article>
      ))}
    </div>
  ))}
</LayoutGroup>
```

**Número que cuenta (Panel)**

```jsx
import { animate } from "motion";
import { useEffect, useRef } from "react";

export function Contador({ valor, prefijo = "" }) {
  const ref = useRef(null);
  useEffect(() => {
    const ctrl = animate(0, valor, {
      duration: 0.6, ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => { if (ref.current) ref.current.textContent = prefijo + Math.round(v).toLocaleString("es-BO"); },
    });
    return () => ctrl.stop();
  }, [valor, prefijo]);
  return <span ref={ref} />;
}
```

## 5. Lo que NO hacer

- Nada de animaciones en bucle (spinners infinitos salvo cuando de verdad se espera algo).
- No animar la tabla completa cada vez que se escribe en el buscador: solo las filas que entran o salen.
- No pasar de 400 ms: el personal de mostrador repite estas acciones decenas de veces al día.
- No usar animación como único aviso: un cambio de estado también se confirma con texto (toast o badge).

## Relación con el prototipo de Figma

El prototipo ya usa transiciones parecidas a las finales:
- Escritorio: *Smart animate* de 300 ms entre pantallas (el sidebar queda fijo) y fade para el ticket.
- Móvil: *Push* de 300 ms al entrar a un detalle, fade entre pestañas y *Smart animate* para la hoja de incidencia.
