# Paleta de colores — El Vapor Azul

Fuente de verdad: colección de variables **Colores** en el archivo de Figma
[El Vapor Azul – Sistema de Pedidos](https://www.figma.com/design/47vy1SC1Cc3v39AgGiDS3H).
Los nombres de las variables CSS son los mismos que en Figma.

## Idea de la paleta

- **Azul vapor** (`primary`) como color de marca y de acción: confianza y limpieza.
- **Aqua** (`accent`) solo como detalle de marca (vapor del logo, avatar). No se usa en botones.
- **Azul noche** (`sidebar`) para el menú lateral y el login: da contraste y hace que el contenido resalte.
- **Un color por estado del pedido**, siempre en pareja `color` (texto/punto) + `color-soft` (fondo),
  con contraste AA (≥ 4.5:1) del texto sobre su fondo suave.

| Estado del pedido   | Variable           | Texto     | Fondo     |
|---------------------|--------------------|-----------|-----------|
| Recibido            | `gray`             | `#4A5568` | `#EEF2F7` |
| Lavando             | `info`             | `#0B7A8C` | `#DDF6F9` |
| Secando             | `purple`           | `#6B3FD6` | `#EFE9FF` |
| Planchando          | `warning`          | `#A65F00` | `#FFF1D6` |
| Listo para recoger  | `success`          | `#127A4B` | `#DCF5E8` |
| Entregado           | `primary`          | `#1D5BD8` | `#EAF1FF` |
| Incidencia          | `danger`           | `#C0262D` | `#FDE7E8` |

Los pagos reutilizan los mismos colores: **Pagado** = `success`, **Parcial** = `warning`, **Pendiente** = `danger`.

## Variables CSS (copiar en `src/index.css`)

```css
:root {
  /* Marca */
  --primary: #1D5BD8;
  --primary-dark: #1645A8;   /* hover / pressed */
  --primary-soft: #EAF1FF;
  --accent: #19B5C9;
  --accent-soft: #DFF7FA;
  --sidebar: #0A1A33;

  /* Superficies y texto */
  --bg: #F6F8FC;
  --surface: #FFFFFF;
  --border: #E3E8F2;
  --text: #0B1324;
  --text-muted: #5B6B85;
  --text-inverse: #FFFFFF;

  /* Estados */
  --gray: #4A5568;     --gray-soft: #EEF2F7;
  --info: #0B7A8C;     --info-soft: #DDF6F9;
  --purple: #6B3FD6;   --purple-soft: #EFE9FF;
  --warning: #A65F00;  --warning-soft: #FFF1D6;
  --success: #127A4B;  --success-soft: #DCF5E8;
  --danger: #C0262D;   --danger-soft: #FDE7E8;

  /* Forma */
  --radius-sm: 6px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
  --shadow-card: 0 2px 6px rgba(11, 19, 36, 0.05);
  --shadow-pop: 0 12px 32px rgba(11, 19, 36, 0.08);

  font-family: "Inter", system-ui, sans-serif;
}
```

## Reglas de uso

- Un solo botón `primary` por pantalla o sección (la acción principal).
- Los colores de estado son **solo** para estados; no usarlos como decoración.
- Nunca comunicar un estado solo con color: el badge siempre lleva texto ("Listo para recoger").
- Texto sobre `primary` o `sidebar` → `--text-inverse`.
