# Banco de pruebas de on-ramp — Meld vía Privy

Página aislada en `/dev/onramp-meld` para **validar con datos reales** qué
proveedor enruta **Meld** (el agregador nativo de Privy) para un usuario
**colombiano** que compra **$10-20 de USDC en Solana**, con qué mínimo, qué KYC
y cuántos pasos.

> **No toca producción.** No modifica el simulador de tesorería, ni
> `buy_v1`/`sell_v1`/fees, ni ninguna ruta existente. Solo **lee** la dirección
> de la wallet embebida del usuario y consulta balances de USDC.

---

## Prerrequisito (setup manual — hazlo una vez)

En el **dashboard de Privy** → **Configuration → Fiat onramps**:

1. Activa el toggle de **Fiat onramps**.
2. Habilita y configura **Meld aggregator** (es quien orquesta Topper, MoonPay,
   Swapped, etc. según token, red, geografía y dispositivo).

Sin este paso, el flujo de funding no abrirá o no ofrecerá proveedores.

## Setup de entorno

En `app/.env.local` (no se commitea):

```
NEXT_PUBLIC_DEV_TOOLS=true
# Opcionales (si no, se reutilizan los RPC ya configurados):
NEXT_PUBLIC_SOLANA_MAINNET_RPC=
NEXT_PUBLIC_SOLANA_DEVNET_RPC=
```

Ver `app/.env.example`. Luego `pnpm dev` y abre `http://localhost:3000/dev/onramp-meld`
(con sesión Privy iniciada).

---

## Cómo funciona la página

- **Header**: dirección de la wallet embebida (destino), balance USDC en
  **mainnet** y **devnet** (ATA correcta en cada red), refrescar + auto-refresh
  cada 30s, y el **país detectado por IP** (Meld enruta según geografía).
- **Panel de Meld**: selector de monto (10/15/20/50) y de moneda (USD/COP),
  botón **Iniciar funding con Meld** → abre el flujo de Privy
  (`useFundWallet` de `@privy-io/react-auth/solana`, `asset: USDC`, chain
  mainnet).
- **Eventos**: se captura **todo** lo que Privy expone, con timestamp y payload
  completo.
- **Checklist manual** (localStorage) y **tabla de resultados** acumulada
  (localStorage) con notas editables y **Exportar JSON**.

### Limitación importante del SDK (verificada en el código de Privy)

Privy **solo** expone el callback `onUserExited` (`address`, `fundingMethod`,
`balance`). **No** publica eventos de "orden completada" ni **qué proveedor
concreto eligió Meld**. Por eso:

- El **proveedor enrutado** y el **detalle de pasos/KYC** se registran en el
  **checklist manual** durante el flujo real.
- La **entrega on-chain** se verifica con un **balance poller** (mainnet, cada
  15s). Si tras una orden "exitosa" no llega USDC en **10 min**, se marca
  **"entrega simulada"** (típico de sandbox sin entrega real).
- Se loguea el **payload completo** de cada evento por si Privy/Meld añade
  información de enrutamiento.

El parámetro de moneda fiat (COP) **no** existe en `SolanaFundingConfig`: el
selector COP es solo una etiqueta para tu registro. Si el widget muestra USD,
anótalo en el checklist.

---

## Protocolo de prueba (sandbox)

1. Completa el prerrequisito de Privy.
2. Corre **3 veces** el flujo con monto $15.
3. En cada corrida, llena el **checklist** mientras avanzas por el widget.
4. Al final, **Exportar JSON** y guarda el archivo.

> El sandbox valida la **integración y el conteo de pasos**, **no** el KYC real
> ni el enrutamiento real para Colombia.

---

## FASE 2 — La prueba definitiva (producción real)

Esta es la **única** fase que responde qué ve un colombiano real.

- Cambia a **modo producción** (llaves live en el dashboard de Privy).
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
al verificar en vivo (Transak y Mercuryo **no** cubren Colombia; el `onUserExited`
de Privy no revela el proveedor enrutado).

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
