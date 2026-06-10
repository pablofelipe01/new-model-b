# Banco de pruebas de on-ramp — Meld (widget directo)

Página aislada en `/dev/onramp-meld` para **validar con datos reales** qué
proveedor enruta **Meld** para un usuario **colombiano** que compra **$10-20 de
USDC en Solana**, con qué mínimo, qué KYC y cuántos pasos.

> **Cambio de enfoque (v6):** se abandonó el on-ramp vía **Privy `useFundWallet`**
> porque enrutaba a **Coinbase** con un KYC muy pesado y el SDK no exponía qué
> proveedor elegía. Ahora se usa el **widget directo de Meld**
> (`meldcrypto.com`, configurado por parámetros de URL): más simple, con la
> dirección de wallet **bloqueada**, país forzado a Colombia, y la posibilidad de
> **ver en pantalla** qué proveedor enruta Meld.

> **No toca producción.** No modifica el simulador de tesorería, ni
> `buy_v1`/`sell_v1`/fees, ni ninguna ruta existente. Solo **lee** la dirección
> de la wallet embebida del usuario y consulta balances de USDC.

---

## Prerrequisito (setup manual — hazlo una vez)

1. Crea una cuenta en **[meld.io](https://www.meld.io/)** (dashboard de
   desarrollador).
2. Obtén tu **public widget key** (sandbox para pruebas, live para producción).
   Es **pública**: viaja en la URL del widget, no es un secreto.

> Meld es el agregador que orquesta Topper, MoonPay, Swapped, etc. según token,
> red, geografía y dispositivo.

## Setup de entorno

En `app/.env.local` (no se commitea):

```
NEXT_PUBLIC_DEV_TOOLS=true
NEXT_PUBLIC_MELD_PUBLIC_KEY=tu_public_widget_key
# Opcional, si Meld te da un host de sandbox distinto:
NEXT_PUBLIC_MELD_WIDGET_URL=https://meldcrypto.com/
```

Los RPC se reutilizan de tus variables existentes (`NEXT_PUBLIC_DEVNET_RPC` /
`NEXT_PUBLIC_MAINNET_RPC`). Ver `app/.env.example`. Luego `pnpm dev` y abre
`http://localhost:3000/dev/onramp-meld` (con sesión Privy iniciada).

---

## Cómo funciona la página

- **Header**: dirección de la wallet embebida (destino), balance USDC en
  **mainnet** y **devnet** (ATA correcta en cada red), refrescar + auto-refresh
  cada 30s, y el **país detectado por IP** (Meld enruta según geografía).
- **Panel de Meld**: selector de monto (10/15/20/50) y de moneda (USD/COP),
  campo editable para `destinationCurrencyCode` (por defecto `USDC_SOLANA`), y
  botón **Iniciar funding con Meld** → arma la URL del widget y lo embebe en un
  **iframe** (con botón para **abrir en pestaña nueva**, recomendado para el KYC
  real que pide cámara/selfie). Parámetros fijados: `walletAddressLocked=true`
  (el usuario nunca ve/edita la dirección), `countryCode=CO` + `countryCodeLocked`.
- **Eventos**: se captura cualquier `postMessage` que el widget emita
  (best-effort, cross-origin) con timestamp y payload completo.
- **Checklist manual** (localStorage) y **tabla de resultados** acumulada
  (localStorage) con notas editables y **Exportar JSON**.

### Limitación (cross-origin)

El widget de Meld corre en `meldcrypto.com` (otro origen), así que **no** podemos
leer su DOM ni garantizar eventos de "orden completada". Por eso:

- El **proveedor enrutado** y el **detalle de pasos/KYC** se observan en la UI del
  widget y se registran en el
  **checklist manual** durante el flujo real.
- La **entrega on-chain** se verifica con un **balance poller** (mainnet, cada
  15s). Si tras una orden "exitosa" no llega USDC en **10 min**, se marca
  **"entrega simulada"** (típico de sandbox sin entrega real).
- Se loguea el **payload completo** de cada `postMessage` por si Meld emite
  información de enrutamiento.

El código de cripto destino (`destinationCurrencyCode`) es editable: por defecto
`USDC_SOLANA`; si Meld lo rechaza, prueba otro (p. ej. `SOL`, `USDC_SOL`). El
`sourceCurrencyCode` es lo que pedimos como moneda fiat (USD/COP); si el widget
muestra USD igual, anótalo en el checklist.

---

## Protocolo de prueba (sandbox)

1. Completa el prerrequisito (cuenta Meld + public key en `.env.local`).
2. Corre **3 veces** el flujo con monto $15.
3. En cada corrida, llena el **checklist** mientras avanzas por el widget.
4. Al final, **Exportar JSON** y guarda el archivo.

> El sandbox valida la **integración y el conteo de pasos**, **no** el KYC real
> ni el enrutamiento real para Colombia.

---

## FASE 2 — La prueba definitiva (producción real)

Esta es la **única** fase que responde qué ve un colombiano real.

- Cambia a la **public key live** de Meld (`NEXT_PUBLIC_MELD_PUBLIC_KEY`).
- Haz **1 compra real de $10-15** vía Meld, con **tarjeta colombiana**, desde
  **IP colombiana** (sin VPN).
- Registra:
  - **Proveedor** que enrutó Meld (Topper, MoonPay…).
  - **KYC exacto** solicitado y en qué paso.
  - **Tiempo** hasta que el USDC llega a la wallet.
  - **Fee real**: monto cobrado a la tarjeta **vs** USDC recibido.
- **Compara** contra el benchmark conocido: **Topper a $10 en Phantom**.

Presupuesto estimado: ~$10-15 USD (una compra real).

---

## Criterio de éxito (Meld queda validado si en Fase 2)

1. Enruta un proveedor que **funciona para Colombia** con USDC-Solana.
2. El **mínimo de compra es ≤ $15**.
3. El **KYC es automático** y toma **< 10 minutos**.
4. El **USDC llega** a la wallet en **< 30 minutos**.
5. El **fee total real es ≤ 25%** sobre $15.

Si falla algún punto, documéntalo con detalle para decidir el siguiente paso:
**MoonPay directo**, **deposit address**, o **apelación a Onramper**.

---

## Lección metodológica

Tres fuentes documentales afirmaron cobertura de Colombia que resultó **falsa**
al verificar en vivo (Transak y Mercuryo **no** cubren Colombia; el on-ramp vía
Privy enrutó a Coinbase con KYC pesado y sin revelar el proveedor).

**Regla:** ninguna afirmación de cobertura/comportamiento es válida hasta verla
en un **flujo real desde Colombia**. El propósito de esta página es generar ese
**ground truth** para Meld.

---

## Contexto verificado (a confirmar en vivo, no asumir)

- Phantom enruta **Topper** a colombianos con **mínimo $10**.
- **MoonPay** soporta Colombia oficialmente.
- **Transak** y **Mercuryo** **no** soportan Colombia.

La meta: ver si Meld, para Colombia, ofrece algo **igual o mejor** que el
Topper a $10 de Phantom.
