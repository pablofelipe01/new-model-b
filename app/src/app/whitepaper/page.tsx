import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Whitepaper — Matiz Protocol",
  description:
    "Tokenización Social: un framework matemático para la economía del creador on-chain sobre Solana.",
};

export default function WhitepaperPage() {
  return (
    <article className="paper">
      <Link href="/" className="back-link">
        ← matiz.community
      </Link>

      <header className="paper-head">
        <div className="paper-kicker">Matiz Protocol</div>
        <h1 className="display-m fraunces-italic" style={{ margin: "12px 0 4px" }}>
          Tokenización Social
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: 17, margin: 0 }}>
          Tokens Criptográficos Bidireccionales: un Framework Matemático para la
          Economía del Creador On-Chain
        </p>
        <p className="paper-meta">
          Pablo F. Acebedo · Matiz Protocol
          <br />
          <a href="mailto:pablofelipe@me.com">pablofelipe@me.com</a> ·{" "}
          <a
            href="https://linkedin.com/in/pablo-f-acebedo/"
            target="_blank"
            rel="noopener noreferrer"
          >
            linkedin.com/in/pablo-f-acebedo/
          </a>
          <br />
          Junio 2025
        </p>
      </header>

      {/* ABSTRACT */}
      <section>
        <h2>Resumen / Abstract</h2>
        <div className="abstract">
          <p>
            Este trabajo presenta el marco teórico y la implementación práctica
            de Matiz Protocol, una plataforma de tokenización social construida
            sobre la red Solana. Partiendo de los fundamentos matemáticos de las
            curvas de vinculación (bonding curves) y el modelado de precios
            invariantes, desarrollamos un sistema que permite a cualquier creador
            de contenido, comunidad o proyecto lanzar un token propio con
            liquidez automática, custodia autónoma de la reserva y
            bidireccionalidad garantizada. La función de precio adoptada —P =
            S^0.5— genera un mercado automatizado sin necesidad de creadores de
            liquidez externos, donde la reserva es matemáticamente proporcional
            al suministro en todo momento y físicamente inaccesible para
            cualquier actor, incluyendo la propia plataforma. Documentamos los
            fundamentos económicos de los tokens sociales, el invariante de
            solvencia que garantiza la redención a precio de mercado en todo
            momento, la estructura de comisiones on-chain, y el resultado de las
            primeras iteraciones de la plataforma en red de pruebas (testnet).
          </p>
          <p style={{ marginBottom: 0 }}>
            <strong>Palabras clave:</strong> tokenización social, bonding curve,
            AMM, economía del creador, Solana, DeFi, curva de vinculación,
            liquidez automática, modelado invariante, Matiz Protocol
          </p>
        </div>
      </section>

      {/* VIDEO — derivación matemática */}
      <figure style={{ margin: "40px 0 8px" }}>
        <video
          src="/The_Math_of_Guaranteed_Liquidity__Deriving_Matiz_Protocol.mp4#t=0.1"
          controls
          playsInline
          preload="metadata"
          style={{
            width: "100%",
            borderRadius: "var(--radius-lg)",
            border: "0.5px solid var(--border-subtle)",
            display: "block",
          }}
        />
        <figcaption
          style={{
            fontSize: 13,
            color: "var(--text-tertiary)",
            textAlign: "center",
            marginTop: 10,
          }}
        >
          La matemática de la liquidez garantizada: derivando Matiz Protocol.
        </figcaption>
      </figure>

      {/* 1 */}
      <section>
        <h2>1. Introducción</h2>
        <p>
          Las plataformas de contenido digital han creado uno de los desajustes
          más profundos de la economía moderna: los creadores generan valor
          masivo para audiencias de millones, pero el control sobre esa
          audiencia, los datos y los ingresos reside casi exclusivamente en las
          plataformas intermediarias. Un creador con diez millones de seguidores
          en Instagram no posee esa relación —la arrienda, sujeta a los
          algoritmos, términos de servicio y decisiones comerciales de Meta.
        </p>
        <p>
          La tokenización social emerge como respuesta estructural a este
          problema. Al vincular la relación entre un creador y su comunidad a un
          activo criptográfico on-chain, es posible hacer esa relación portable,
          verificable y económicamente significativa: un token que representa el
          apoyo real, cuantificable en dinero, a un creador o proyecto.
        </p>
        <p>
          Strata Protocol, lanzado en la red Solana en 2021 y adquirido por la
          Helium Foundation en 2022, fue el primer protocolo que implementó
          bonding curves configurables sobre Solana, sentando las bases técnicas
          de esta categoría. Matiz Protocol retoma esa arquitectura matemática,
          la actualiza con tecnología 2024-2026, y resuelve el problema de
          adopción que frenó a todos sus predecesores: la fricción para usuarios
          no técnicos.
        </p>
        <p>
          Este paper documenta el fundamento matemático del sistema, la
          arquitectura del protocolo on-chain, el modelo económico adoptado, y
          las implicaciones para creadores, fans e inversores.
        </p>
      </section>

      {/* 2 */}
      <section>
        <h2>2. La tokenización social: marco conceptual</h2>

        <h3>2.1 Definición y naturaleza de los tokens sociales</h3>
        <p>
          Los tokens sociales son activos intercambiables vinculados a una
          comunidad afiliada a un creador de contenido, proyecto o marca. Son
          criptomonedas personalizadas que permiten a los miembros de la
          comunidad desbloquear experiencias específicas o simplemente invertir
          en los proyectos y personas en los que creen.
        </p>
        <p>
          A diferencia de los tokens de gobernanza o los tokens de utilidad en
          protocolos DeFi, los tokens sociales no representan derechos sobre un
          protocolo ni acceso a un servicio técnico específico. Representan algo
          más antiguo y poderoso: la creencia en una persona o comunidad,
          expresada de forma económicamente significativa y verificable.
        </p>
        <p>
          La analogía más precisa no es financiera sino deportiva: quien
          adquirió una fracción de la carrera de un artista emergente antes de su
          consagración masiva tiene una posición que refleja tanto su apoyo
          temprano como su perspicacia. Esa posición es transferible, cotizable y
          redimible en todo momento.
        </p>

        <h3>2.2 El problema de los intermediarios</h3>
        <p>
          El éxito de cualquier creador de valor proviene de fomentar el
          crecimiento de su comunidad. Sin embargo, en el modelo actual:
        </p>
        <ul>
          <li>Los seguidores pertenecen a la plataforma, no al creador</li>
          <li>Los algoritmos deciden qué audiencia ve el contenido</li>
          <li>
            La monetización está mediada por comisiones, requisitos y
            restricciones de terceros
          </li>
          <li>
            Si una plataforma cierra o desmonetiza al creador, la relación con la
            audiencia desaparece
          </li>
        </ul>
        <p>
          Los tokens sociales eluden este control al llevar la relación económica
          creador-fan a la blockchain, donde ningún intermediario puede
          intervenirla. Adam Mosseri, Head of Instagram, describió en 2022 en TED
          este futuro como inevitable: «Ninguna compañía puede quitarle a Lisa su
          comunidad. Instagram podría desaparecer mañana, y ella mantendría su
          relación con sus suscriptores y mantendría sus ingresos.» Y añadió, con
          notable honestidad: «Meta no puede construir esto. Ninguna compañía
          sola puede.»
        </p>
        <p>Matiz Protocol es la respuesta técnica a ese diagnóstico.</p>

        <h3>2.3 Ventajas estructurales frente al modelo tradicional</h3>
        <div className="paper-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Métrica</th>
                <th>Modelo tradicional</th>
                <th>Matiz Protocol</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Propiedad del fan</td>
                <td>Pertenece a la plataforma</td>
                <td>On-chain, portátil, del creador</td>
              </tr>
              <tr>
                <td>Verificabilidad</td>
                <td>Inflable con bots y compras</td>
                <td>Cada holder pagó dinero real</td>
              </tr>
              <tr>
                <td>Liquidez</td>
                <td>No existe (seguidores no se venden)</td>
                <td>Automática, garantizada 24/7</td>
              </tr>
              <tr>
                <td>Resistencia a censura</td>
                <td>Nula — la plataforma controla todo</td>
                <td>Total — la blockchain es neutral</td>
              </tr>
              <tr>
                <td>Monetización</td>
                <td>Intermediada, con comisiones altas</td>
                <td>Directa, fee mínimo al creador</td>
              </tr>
              <tr>
                <td>Custodio de fondos</td>
                <td>Plataforma centralizada</td>
                <td>Smart contract inviolable</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* 3 */}
      <section>
        <h2>3. Fundamentos matemáticos</h2>

        <h3>3.1 La curva de vinculación (bonding curve)</h3>
        <p>
          Una curva de vinculación (bonding curve) es en sí misma un creador de
          mercado automatizado (AMM) que establece el precio de un token en
          relación con otro token y con el suministro circulante. Consta de dos
          componentes:
        </p>
        <ul>
          <li>
            <strong>Token base:</strong> el activo con el que se establece el
            precio de referencia. En Matiz Protocol, USDC —un stablecoin de alta
            capitalización de mercado que elimina la volatilidad del token de
            referencia.
          </li>
          <li>
            <strong>Token destino:</strong> el nuevo token creado, cuyo precio
            queda determinado por la función matemática y el suministro
            circulante.
          </li>
        </ul>
        <p>
          La ecuación matemática ponderada que subyace a este sistema es una
          generalización de la fórmula de producto constante x · y = k propuesta
          para AMMs por Vitalik Buterin, donde la generalización n ≥ 2 da cuenta
          de ponderaciones que no son una división uniforme de 50/50.
        </p>

        <h3>3.2 La función de precio adoptada</h3>
        <p>
          Matiz Protocol adopta la curva de raíz cuadrada como función de precio
          por defecto:
        </p>
        <span className="formula">P = S^0.5</span>
        <p>
          donde P es el precio en USDC y S es el suministro circulante de tokens.
          Esta función tiene propiedades que la hacen óptima para tokens
          sociales:
        </p>
        <ul>
          <li>
            <strong>Crecimiento rápido al inicio:</strong> los primeros
            compradores obtienen un precio bajo, recompensando el apoyo temprano
          </li>
          <li>
            <strong>Estabilización progresiva:</strong> a medida que crece el
            suministro, los incrementos de precio son proporcionalmente menores,
            evitando que el token se vuelva inalcanzable para nuevos entrantes
          </li>
          <li>
            <strong>Continuidad:</strong> no existen discontinuidades ni puntos
            de inflexión artificiales
          </li>
          <li>
            <strong>Determinismo:</strong> dado cualquier suministro, el precio
            es exactamente calculable por cualquier observador
          </li>
        </ul>

        <h3>3.3 La función de reserva</h3>
        <p>
          Definimos R como la cantidad de tokens base (USDC) almacenados en la
          reserva. Matemáticamente, R es el área bajo la curva de precio desde el
          suministro 0 hasta el suministro actual S:
        </p>
        <span className="formula">R = ∫₀ˢ P(x)dx = ∫₀ˢ x^0.5 dx</span>
        <p>Resolviendo la integral indefinida:</p>
        <span className="formula">R = (2/3) · S^1.5 = 0.666667 · S^1.5</span>
        <p>
          Esta relación es el corazón del sistema. Garantiza que en todo momento
          la reserva contiene exactamente los fondos necesarios para redimir
          todos los tokens en circulación al precio correspondiente de la curva.
        </p>

        <h3>3.4 Modelado invariante de precios</h3>
        <p>
          Cuando el suministro crece de S a S + ΔS por la compra de ΔS tokens, y
          el comprador deposita ΔR en la reserva, el sistema debe mantener la
          proporción invariante:
        </p>
        <span className="formula">
          0.666667 · S^1.5 / R = 0.666667 · (S + ΔS)^1.5 / (R + ΔR)
        </span>
        <p>
          Este es el llamado Modelado Invariante, referenciado en la literatura
          académica por Grith, Härdle y Park (2013). Resolviendo para S dado R +
          ΔR:
        </p>
        <span className="formula">
          S_nuevo = (S^1.5 · (R + ΔR) / R)^(2/3)
        </span>
        <p>Y resolviendo para R dado S + ΔS:</p>
        <span className="formula">R_nuevo = R · (S + ΔS)^1.5 / S^1.5</span>
        <p>
          Estas ecuaciones son las que ejecuta el programa Anchor on-chain en
          cada instrucción de compra y venta, garantizando que el invariante se
          mantiene independientemente del orden o tamaño de las transacciones.
          Ambas ecuaciones fallan para R = 0 o S = 0. En ese caso se utiliza la
          fórmula base:
        </p>
        <span className="formula">R = c · 0.666667 · S^1.5</span>
        <p>
          donde c es una constante que establece la pendiente inicial de la curva
          y, por lo tanto, el precio inicial del token.
        </p>

        <h3>3.5 El teorema de solvencia</h3>
        <p>
          El invariante matemático implica una propiedad crítica que denominamos
          teorema de solvencia:
        </p>
        <div className="abstract">
          <p style={{ marginBottom: 0 }}>
            En todo momento, la reserva contiene exactamente los fondos
            necesarios y suficientes para que todos los holders vendan
            simultáneamente. La solvencia del protocolo es una propiedad
            matemática, no una promesa contractual.
          </p>
        </div>
        <p>
          <strong>Demostración:</strong> si el suministro actual es S, la reserva
          es R = 0.666667 · S^1.5 (por el invariante). Si todos los S tokens se
          venden, el suministro llega a 0 y la reserva debería ser 0.666667 ·
          0^1.5 = 0. Las ventas sucesivas extraen exactamente R de la reserva por
          la misma función integral inversa. QED.
        </p>
      </section>

      {/* 4 */}
      <section>
        <h2>4. Arquitectura técnica de Matiz Protocol</h2>

        <h3>4.1 Stack tecnológico</h3>
        <p>
          Matiz Protocol está construido sobre la red Solana usando el framework
          Anchor para el desarrollo de programas (smart contracts) en Rust. La
          elección de Solana responde a tres factores:
        </p>
        <ul>
          <li>
            <strong>Throughput:</strong> ~65,000 transacciones por segundo, con
            finalidad en ~400ms
          </li>
          <li>
            <strong>Costo:</strong> fees de ~$0.00025 por transacción, haciendo
            viable el micro-comercio
          </li>
          <li>
            <strong>Ecosistema:</strong> base de desarrolladores madura,
            infraestructura de wallets y on-ramps establecida
          </li>
        </ul>
        <p>El stack completo incluye:</p>
        <ul>
          <li>
            <strong>On-chain:</strong> Programa Anchor (Rust) desplegado en
            Solana. Program ID: 41nppqSazESeBmrgnud2j5Nz1MbsnPGeyAryPcKAefqa
          </li>
          <li>
            <strong>Autenticación:</strong> Privy (wallets embebidas vía
            Google/email, sin seed phrase visible)
          </li>
          <li>
            <strong>On/off ramp:</strong> un proveedor de on-ramp verificado
            (conversión tarjeta de crédito ↔ USDC, con cobertura LATAM)
          </li>
          <li>
            <strong>Frontend:</strong> Next.js 14 con App Router, Tailwind CSS,
            Recharts
          </li>
          <li>
            <strong>Metadata de tokens:</strong> Metaplex Token Metadata (nombre,
            símbolo, imagen on-chain)
          </li>
        </ul>

        <h3>4.2 El programa on-chain: instrucciones principales</h3>
        <p>
          El programa Anchor implementa un conjunto reducido de instrucciones que
          conforman el protocolo completo:
        </p>
        <ul>
          <li>
            <strong>create_curve:</strong> crea una definición de curva
            reutilizable (parámetros c, pow, frac, b)
          </li>
          <li>
            <strong>init_token_bonding:</strong> instancia una bonding curve
            vinculando un mint SPL a una curva y token base. Cobra el fee de
            lanzamiento ($25 USDC → Master Wallet). Crea el PDA base_storage (la
            reserva)
          </li>
          <li>
            <strong>buy_v1:</strong> el comprador deposita USDC. El programa
            calcula los tokens a mintear usando la función de reserva, distribuye
            fees, y mintea los tokens al comprador
          </li>
          <li>
            <strong>sell_v1:</strong> el vendedor quema sus tokens. El programa
            calcula el USDC a devolver usando la función de reserva inversa,
            distribuye fees, y transfiere USDC al vendedor
          </li>
          <li>
            <strong>update_bonding:</strong> permite al lanzador actualizar
            parámetros mutables (solo royalties y autoridades, nunca la lógica de
            la reserva)
          </li>
        </ul>

        <h3>4.3 Estructura de comisiones on-chain</h3>
        <p>
          El protocolo implementa tres niveles de comisiones, todos configurados
          en el momento de creación del token y verificables en Solana Explorer:
        </p>
        <div className="paper-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Tipo</th>
                <th>Monto</th>
                <th>Destino</th>
                <th>Momento</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Fee de lanzamiento</td>
                <td>$25 USDC (fijo)</td>
                <td>Master Wallet</td>
                <td>Al crear el token</td>
              </tr>
              <tr>
                <td>Fee de plataforma</td>
                <td>0.5% por tx</td>
                <td>Master Wallet</td>
                <td>En cada buy/sell</td>
              </tr>
              <tr>
                <td>Fee del lanzador</td>
                <td>0% a 5% por tx (configurable)</td>
                <td>Wallet del lanzador</td>
                <td>En cada buy/sell</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>El flujo de fondos en cada compra es exactamente:</p>
        <span className="formula">
          monto_usuario → fee_plataforma(0.5%) + fee_lanzador(0-5%) +
          monto_reserva
        </span>
        <p>
          Solo el monto_reserva influye en el precio de la curva. Los fees se
          distribuyen antes de la actualización del estado on-chain, garantizando
          que el invariante de solvencia se mantiene sobre la reserva neta.
        </p>

        <h3>4.4 La reserva como propiedad del protocolo</h3>
        <p>
          La innovación más relevante de Matiz Protocol —y la que lo diferencia
          de todas las plataformas de tokens sociales anteriores— es la custodia
          autónoma de la reserva.
        </p>
        <p>
          En el código fuente del programa, la instrucción transfer_reserves fue
          eliminada físicamente antes del despliegue. No existe ninguna
          instrucción que permita extraer USDC de base_storage sin quemar tokens.
          La única forma de que salgan fondos de la reserva es que un holder
          venda sus tokens mediante sell_v1.
        </p>
        <p>Esto tiene consecuencias legales y económicas fundamentales:</p>
        <ul>
          <li>
            El lanzador de un token no puede cometer fraude con los fondos de sus
            compradores
          </li>
          <li>
            La plataforma no puede cometer fraude con los fondos de ningún
            usuario
          </li>
          <li>
            Un hackeo al sistema web (frontend, base de datos) no puede
            comprometer los fondos on-chain
          </li>
          <li>
            La solvencia del protocolo es auditable por cualquier observador en
            tiempo real
          </li>
        </ul>
      </section>

      {/* 5 */}
      <section>
        <h2>5. Flujos del protocolo</h2>

        <h3>5.1 Flujo del lanzador</h3>
        <p>
          El proceso de lanzamiento de un token en Matiz Protocol consta de tres
          pasos:
        </p>
        <ul>
          <li>
            <strong>Registro:</strong> el lanzador entra con Google o email.
            Privy crea automáticamente una wallet Solana embebida. No requiere
            extensión de navegador ni seed phrase.
          </li>
          <li>
            <strong>Configuración:</strong> el lanzador define nombre, símbolo,
            imagen, tipo de curva (raíz cuadrada recomendada), supply máximo, y
            fee propio (0%-5%). Un gráfico interactivo muestra en tiempo real el
            impacto de cada parámetro.
          </li>
          <li>
            <strong>Lanzamiento:</strong> el lanzador paga $25 USDC (on-ramp con
            tarjeta si no tiene USDC). La transacción Anchor crea el mint SPL, la
            bonding curve, y el base_storage. La plataforma genera un link con
            Open Graph para compartir.
          </li>
        </ul>

        <h3>5.2 Flujo del comprador</h3>
        <ul>
          <li>
            <strong>Descubrimiento:</strong> el comprador llega al link del
            token. Ve precio, holders, gráfico de la curva y estructura de fees
            sin necesidad de cuenta.
          </li>
          <li>
            <strong>Registro:</strong> login con Google o email (30 segundos).
            Privy crea la wallet embebida.
          </li>
          <li>
            <strong>Compra:</strong> el comprador ingresa el monto en USD. Un
            sistema de on-ramp verificado convierte con tarjeta de crédito a
            USDC. La plataforma ejecuta buy_v1
            automáticamente. El comprador recibe sus tokens y ve su portfolio en
            USD.
          </li>
          <li>
            <strong>Venta:</strong> el comprador puede vender en cualquier
            momento. La bonding curve garantiza liquidez permanente. Un sistema
            de off-ramp verificado convierte el USDC a moneda local.
          </li>
        </ul>
      </section>

      {/* 6 */}
      <section>
        <h2>6. Casos de uso y segmentos</h2>

        <h3>6.1 Creadores de contenido</h3>
        <p>
          El caso de uso más directo: un artista, músico, escritor, podcaster o
          youtuber lanza su token. Sus primeros fans compran a precio bajo. A
          medida que más personas se unen a la comunidad, el precio sube. El
          creador cobra un fee de cada transacción. Los fans tempranos tienen
          tokens más valiosos.
        </p>
        <p>
          El diferenciador frente a Patreon, membresías de YouTube o
          suscripciones de Instagram es que el apoyo no desaparece: si el fan
          decide salir, vende sus tokens y recupera (parte de) su inversión. Si
          la carrera del creador despega, el fan comparte el crecimiento.
        </p>

        <h3>6.2 Comunidades y proyectos</h3>
        <p>
          Un club de lectura, un grupo de investigación, un colectivo artístico o
          una organización sin ánimo de lucro puede usar Matiz para tokenizar su
          membresía. Los miembros más comprometidos tienen más tokens, lo que
          crea un sistema de reputación cuantificable y portable.
        </p>

        <h3>6.3 Plataforma genérica de token launch</h3>
        <p>
          Matiz Protocol no está restringido a creadores de contenido. Cualquier
          proyecto, empresa o individuo puede lanzar un token con bonding curve
          en cinco minutos y con $25. Esto lo posiciona como alternativa
          accesible a los procesos de IDO (Initial DEX Offering) tradicionales,
          que requieren semanas de configuración técnica y miles de dólares en
          liquidez inicial.
        </p>

        <h3>6.4 Comparación con protocolos existentes</h3>
        <div className="paper-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Factor</th>
                <th>Pump.fun</th>
                <th>Strata (discontinued)</th>
                <th>Friend.tech</th>
                <th>Matiz Protocol</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Curva configurable</td>
                <td>No (fija)</td>
                <td>Sí</td>
                <td>Fija</td>
                <td>Sí</td>
              </tr>
              <tr>
                <td>Sin wallet crypto</td>
                <td>No</td>
                <td>No</td>
                <td>No</td>
                <td>Sí (Privy)</td>
              </tr>
              <tr>
                <td>Pago con tarjeta</td>
                <td>No</td>
                <td>No</td>
                <td>No</td>
                <td>Sí (on-ramp verificado)</td>
              </tr>
              <tr>
                <td>Reserva intocable</td>
                <td>Sí</td>
                <td>Sí</td>
                <td>No</td>
                <td>Sí</td>
              </tr>
              <tr>
                <td>Fee lanzador custom</td>
                <td>No</td>
                <td>Sí</td>
                <td>No</td>
                <td>Sí (0-5%)</td>
              </tr>
              <tr>
                <td>Red</td>
                <td>Solana</td>
                <td>Solana</td>
                <td>Base</td>
                <td>Solana</td>
              </tr>
              <tr>
                <td>Estado actual</td>
                <td>Activo</td>
                <td>Descontinuado</td>
                <td>Inactivo</td>
                <td>Testnet (2025)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* 7 */}
      <section>
        <h2>7. Consideraciones regulatorias y económicas</h2>

        <h3>7.1 ¿Son los tokens sociales valores financieros?</h3>
        <p>
          Esta pregunta es central para cualquier protocolo de tokenización
          social y no tiene respuesta definitiva en la mayoría de jurisdicciones
          latinoamericanas. El diseño de Matiz Protocol incorpora características
          que distinguen sus tokens de los valores financieros tradicionales:
        </p>
        <ul>
          <li>
            <strong>No hay promesa de rendimiento:</strong> la plataforma no
            garantiza apreciación ni rentabilidad
          </li>
          <li>
            <strong>No hay distribución de beneficios:</strong> el token no da
            derecho a dividendos ni flujos de caja
          </li>
          <li>
            <strong>No hay governance:</strong> el token no otorga control sobre
            el protocolo ni sobre el creador
          </li>
          <li>
            <strong>Liquidez automática:</strong> el token puede venderse en
            cualquier momento al precio de la curva, eliminando el riesgo de
            iliquidez que es central en la regulación de valores
          </li>
        </ul>
        <p>
          La Superintendencia Financiera de Colombia (SFC) y equivalentes en la
          región no tienen aún un marco regulatorio explícito para tokens
          sociales. Recomendamos consulta legal antes de operar a escala
          comercial.
        </p>

        <h3>7.2 Riesgos para el comprador</h3>
        <p>
          La transparencia sobre los riesgos es parte del diseño de Matiz
          Protocol. El comprador debe entender:
        </p>
        <ul>
          <li>
            <strong>Riesgo de precio:</strong> si muchos holders venden
            simultáneamente, el precio bajará. El comprador puede salir con menos
            de lo que invirtió
          </li>
          <li>
            <strong>Riesgo de liquidez relativa:</strong> la bonding curve
            garantiza que siempre existe liquidez, pero no garantiza el precio al
            que se puede vender
          </li>
          <li>
            <strong>Riesgo reputacional del lanzador:</strong> el valor del token
            está asociado a la percepción de valor del proyecto o creador
          </li>
          <li>
            <strong>Ausencia de riesgo de custodia:</strong> los fondos están en
            el smart contract, no en la plataforma — este riesgo es prácticamente
            nulo
          </li>
        </ul>

        <h3>7.3 Mecanismos anti-manipulación</h3>
        <p>
          El diseño del protocolo incorpora protecciones estructurales contra la
          manipulación de mercado:
        </p>
        <ul>
          <li>
            <strong>KYC de plataforma:</strong> el proveedor de on-ramp
            verificado requiere verificación de identidad para on-ramps
            superiores a $150, elevando el costo de crear
            múltiples identidades para manipular el precio
          </li>
          <li>
            <strong>Vesting del lanzador:</strong> en su versión completa, el
            protocolo contempla que los tokens emitidos al lanzador tengan un
            período de bloqueo on-chain, eliminando la posibilidad de
            pump-and-dump coordinado
          </li>
          <li>
            <strong>Fee simétrico:</strong> el fee de plataforma aplica tanto a
            compras como a ventas, desincentivando operaciones de alta frecuencia
            sin valor económico real
          </li>
        </ul>
      </section>

      {/* 8 */}
      <section>
        <h2>8. Estado actual y resultados en testnet</h2>
        <p>
          Matiz Protocol se encuentra actualmente en fase de testnet en la red de
          pruebas de Solana. El smart contract está desplegado y verificable en
          Solana Explorer (Program ID:
          41nppqSazESeBmrgnud2j5Nz1MbsnPGeyAryPcKAefqa). La plataforma web está
          accesible en matiz.community.
        </p>
        <p>
          Las funcionalidades implementadas y verificadas en testnet incluyen:
        </p>
        <ul>
          <li>Creación de tokens con bonding curve de raíz cuadrada</li>
          <li>
            Instrucciones buy_v1 y sell_v1 con distribución de fees on-chain
          </li>
          <li>
            Verificación del invariante de solvencia en todas las transacciones
          </li>
          <li>
            Eliminación confirmada de la instrucción transfer_reserves del
            programa
          </li>
          <li>Integración de Privy para autenticación sin wallet nativa</li>
          <li>
            Páginas públicas de token con Open Graph para compartir en redes
            sociales
          </li>
        </ul>
        <p>
          La integración para on/off ramp con tarjeta de crédito está en proceso
          de implementación para la fase de mainnet.
        </p>
      </section>

      {/* 9 */}
      <section>
        <h2>9. Conclusiones</h2>
        <p>
          La tokenización social representa una oportunidad genuina de
          reequilibrar la relación entre creadores y plataformas. Los tokens
          sociales con bonding curve resuelven el problema de liquidez que había
          paralizado categorías anteriores de social tokens: no necesitan
          creadores de liquidez externos, no requieren pools de liquidez, y
          garantizan matemáticamente que cualquier holder puede salir en
          cualquier momento.
        </p>
        <p>
          La innovación de Matiz Protocol no es matemática —la función P = S^0.5 y
          el invariante de reserva estaban documentados desde Strata Protocol. La
          innovación es de adopción: hacer este mecanismo accesible a cualquier
          persona con una cuenta de Google y una tarjeta de crédito, sin ningún
          conocimiento de criptomonedas.
        </p>
        <p>
          El mercado de la economía del creador mueve más de $250 mil millones
          anuales globalmente. América Latina, con su penetración de Instagram
          superior al 70% en poblaciones urbanas y una cultura de apoyo al creador
          profundamente arraigada, representa un mercado inicial natural. La
          combinación de on-ramp en monedas locales (COP, MXN, BRL), login social
          sin fricción, y la promesa de transparencia absoluta en la custodia de
          fondos posiciona a Matiz Protocol de manera única en esta región.
        </p>
        <p>
          El código es público, el contrato es auditable, y la reserva es
          intocable. En un ecosistema donde la confianza es el activo más escaso,
          esa transparencia es la propuesta de valor más poderosa.
        </p>
      </section>

      {/* REFERENCIAS */}
      <section>
        <h2>Referencias</h2>
        <ol className="refs">
          <li>
            Buterin, V. (2018). Improving front running resistance of x*y=k
            market makers. Ethereum Research Forum.{" "}
            <a
              href="https://ethresear.ch/t/improving-front-running-resistance-of-x-y-k-market-makers"
              target="_blank"
              rel="noopener noreferrer"
            >
              ethresear.ch
            </a>
          </li>
          <li>
            Grith, M., Härdle, W. K., &amp; Park, J. (2013). Shape Invariant
            Modeling of Pricing Kernels and Risk Aversion. Journal of Financial
            Econometrics, 11(2), 370–399.{" "}
            <a
              href="https://academic.oup.com/jfec/article-abstract/11/2/370/782499"
              target="_blank"
              rel="noopener noreferrer"
            >
              academic.oup.com
            </a>
          </li>
          <li>
            Zargham, M. (2019). A State-Space Modeling Framework for Engineering
            Bonding Curve Mechanisms. BlockScience.
          </li>
          <li>
            Acebedo, P. F. (2023). Tokens Criptográficos Bidireccionales. Web3
            Token Solutions. pablofelipe@me.com
          </li>
          <li>
            Acebedo, P. F. (2023). La Tokenización Social: Camino a la
            tokenización de las personas, las marcas y el contenido. Web3 Token
            Solutions.
          </li>
          <li>
            StrataFoundation. (2021). Strata Protocol: Open-source protocol to
            launch tokens around a person, project, idea, or collective on
            Solana.{" "}
            <a
              href="https://github.com/StrataFoundation/strata"
              target="_blank"
              rel="noopener noreferrer"
            >
              github.com/StrataFoundation/strata
            </a>
          </li>
          <li>
            Mosseri, A. (2022). A Creator-Led Internet Built on Blockchain. TED
            Talk.{" "}
            <a
              href="https://www.ted.com/talks/adam_mosseri_a_creator_led_internet_built_on_blockchain"
              target="_blank"
              rel="noopener noreferrer"
            >
              ted.com
            </a>
          </li>
          <li>
            Matiz Protocol. (2025). Matiz — Tu matiz tiene una comunidad.{" "}
            <a
              href="https://matiz.community/"
              target="_blank"
              rel="noopener noreferrer"
            >
              matiz.community
            </a>
          </li>
        </ol>
      </section>

      <footer className="paper-foot">
        Pablo F. Acebedo · pablofelipe@me.com · linkedin.com/in/pablo-f-acebedo/
        <br />
        Matiz Protocol · matiz.community · Solana Testnet 2025
      </footer>
    </article>
  );
}
