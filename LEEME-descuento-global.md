# Entrega `entrega-2026-10-20-descuento-global` (ventas)

Calculadora de **descuento global** en el formulario de ventas (pedido de Néstor Ponce; decisión de Emmanuel del 2026-10-20: solo interfaz, sin esquema ni campos nuevos). La misma entrega existe en `Induxsoft-AI-Code/compras`.

## Archivos cambiados (sobre `945f277`, el `main` del oficial, igual al zip 1.0.96 publicado)
- `src/ventas/venta/form.dk`: control «Desc. global» (valor, modo `%` / `Importe`, botón «Aplicar») en la barra de la cuadrícula.
- `src/ventas/_static/js/venta.js`:
  - `applyGlobalDiscount(modo, valor)` y su evento. **%**: el mismo porcentaje en cada partida. **Importe**: se reparte en proporción a cantidad × precio; el residuo de redondeo va a la partida de mayor importe, así que la suma es exactamente lo capturado. **Reemplaza** el descuento manual (`descuento1`) de cada partida; si había descuentos distintos pide confirmación. No toca `descuento2` (promociones). Recalcula con `calculateTaxes`/`edtProduct`, igual que una edición a mano. No guarda nada nuevo: si se agregan partidas, se vuelve a aplicar.
  - `edtProduct`: **corrige** que `descuento1` recibiera la suma `descuento1 + descuento2` (contaba la promoción dos veces al editar una partida que la tenía); ahora `descuento1 = descuentos − descuento2`, y no baja de la promoción.
- `src/pack.manifest`: `version` 1.0.96 → **1.0.97 (propuesta; no publicada)**. `schema_ver` sin cambio.

## Cómo probarlo
Instalar desde una fuente local con este zip, abrir *Ventas → nueva venta*, agregar partidas, capturar el descuento global, «Aplicar», guardar y reabrir. Pruebas automatizadas (Playwright) y resultados: `v12_qa/herramientas/descuento-global/` y `v12_qa/hallazgos/2026-10-20-descuento-global.md`.
