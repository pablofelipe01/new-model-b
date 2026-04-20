"use client";

import { useLanguage } from "@/components/providers/LanguageProvider";
import { MLogo } from "@/components/matiz/MLogo";
import Link from "next/link";

export default function TermsPage() {
  const { lang } = useLanguage();

  if (lang === "es") return <TermsES />;
  return <TermsEN />;
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "48px 20px 96px" }}>
      <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 32, color: "var(--text-secondary)", textDecoration: "none", fontSize: 14 }}>
        <MLogo size={20} /> ← matiz.community
      </Link>
      <div className="legal-content" style={{ color: "var(--text-secondary)", fontSize: 15, lineHeight: 1.7 }}>
        {children}
      </div>
    </div>
  );
}

function H1({ children }: { children: React.ReactNode }) {
  return <h1 className="display-m fraunces-italic" style={{ color: "var(--text-primary)", marginBottom: 8 }}>{children}</h1>;
}
function H2({ children }: { children: React.ReactNode }) {
  return <h2 style={{ color: "var(--text-primary)", fontSize: 20, fontWeight: 500, marginTop: 48, marginBottom: 12 }}>{children}</h2>;
}
function P({ children }: { children: React.ReactNode }) {
  return <p style={{ marginBottom: 16 }}>{children}</p>;
}
function UL({ children }: { children: React.ReactNode }) {
  return <ul style={{ paddingLeft: 20, marginBottom: 16 }}>{children}</ul>;
}
function Strong({ children }: { children: React.ReactNode }) {
  return <strong style={{ color: "var(--text-primary)", fontWeight: 500 }}>{children}</strong>;
}

function TermsEN() {
  return (
    <Shell>
      <H1>Terms of Service</H1>
      <p className="muted-small" style={{ marginBottom: 32 }}>Effective: April 2026 · matiz.community · Matiz Labs</p>

      <H2>1. Acceptance of Terms</H2>
      <P>By accessing or using Matiz, connecting a wallet, launching a token, or executing any transaction, you agree to these Terms of Service. If you do not agree, do not use the Platform.</P>

      <H2>2. What Matiz Is</H2>
      <P>Matiz is a <Strong>technology platform</Strong> that provides a web interface for deploying bonding curve token contracts on the Solana blockchain, tools for creators to tokenize community engagement, and a front-end for users to interact with on-chain smart contracts.</P>
      <P><Strong>Matiz is NOT</Strong> a broker, dealer, exchange, custodian, financial intermediary, registered securities platform, investment advisory service, or money transmission service. We do not take custody of your funds at any point.</P>

      <H2>3. Nature of Tokens</H2>
      <P>Tokens launched on Matiz are digital assets governed by bonding curve smart contracts. They are:</P>
      <UL>
        <li><Strong>NOT securities, equity, or ownership shares</Strong> in any company</li>
        <li><Strong>NOT financial instruments</Strong> of any kind</li>
        <li><Strong>NOT investments</Strong> with expected returns</li>
        <li><Strong>NOT regulated financial products</Strong></li>
      </UL>
      <P>Price is determined algorithmically. It increases when tokens are purchased and decreases when sold. There is <Strong>no guarantee</Strong> the price will go up. The value may go to zero.</P>

      <H2>4. Platform Fees</H2>
      <P>Launch fee: $25 USDC (one-time). Platform trade fee: 0.5% per transaction. Launcher fee: 0-5% (creator-configurable). All fees are encoded on-chain, verifiable, and non-refundable.</P>

      <H2>5. No Investment Advice</H2>
      <P>Nothing on Matiz constitutes financial, investment, tax, or legal advice. We do not recommend any token, endorse any creator, or guarantee any returns. You are solely responsible for your own decisions.</P>

      <H2>6. Assumption of Risk</H2>
      <P><Strong>You acknowledge and accept all risks</Strong>, including: loss of funds, smart contract bugs, blockchain outages, regulatory changes, price volatility, liquidity risk, creator abandonment, technology failures, and wallet key loss.</P>

      <H2>7. No Warranties</H2>
      <P>THE PLATFORM IS PROVIDED "AS IS" AND "AS AVAILABLE." WE MAKE NO WARRANTIES, EXPRESS OR IMPLIED.</P>

      <H2>8. Limitation of Liability</H2>
      <P>TO THE MAXIMUM EXTENT PERMITTED BY LAW, MATIZ LABS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES. OUR TOTAL LIABILITY SHALL NOT EXCEED THE FEES YOU HAVE PAID TO US IN THE 12 MONTHS PRECEDING THE CLAIM.</P>

      <H2>9. User Conduct</H2>
      <P>You agree not to: use the Platform for illegal purposes, impersonate others, commit fraud or market manipulation, attempt to hack the Platform, use bots for unfair advantage, or create offensive content.</P>

      <H2>10. Intellectual Property</H2>
      <P>You represent that you own or have the right to use all content you upload. You grant Matiz a non-exclusive, worldwide license to display your content on the Platform.</P>

      <H2>11. Tax Obligations</H2>
      <P><Strong>You are solely responsible for your tax obligations.</Strong> Matiz does not provide tax advice, withhold taxes, or report transactions to authorities.</P>

      <H2>12. Termination</H2>
      <P>We may restrict access to the Platform interface at any time. Termination does <Strong>not</Strong> affect your on-chain assets — tokens and reserves remain on Solana.</P>

      <H2>13. Dispute Resolution</H2>
      <P>Disputes shall be resolved through binding arbitration (ICC, Panama City). You waive any right to class action proceedings.</P>

      <H2>14. Governing Law</H2>
      <P>These Terms are governed by the laws of the Republic of Panama.</P>

      <H2>15. Contact</H2>
      <P>Email: legal@matiz.community</P>

      <div style={{ borderTop: "0.5px solid var(--border-subtle)", marginTop: 64, paddingTop: 32 }}>
        <H1>Risk Disclaimer</H1>
        <P><Strong>READ THIS CAREFULLY BEFORE USING MATIZ</Strong></P>
        <P>Matiz is a technology tool. It lets creators deploy bonding curve tokens and lets users interact with those tokens. We are not recommending, endorsing, or selling any token. We are providing software.</P>
        <H2>You Can Lose Money</H2>
        <UL>
          <li>You can lose 100% of what you put in. Tokens can go to zero.</li>
          <li>Past price increases do not predict future increases.</li>
          <li>A few large sells can crash the price for everyone.</li>
          <li>Transparent does not mean risk-free. Fair does not mean profitable.</li>
        </UL>
        <P><Strong>If you cannot afford to lose what you are spending — do not spend it.</Strong></P>
        <P>By using Matiz, you confirm that you have read, understood, and accepted this Risk Disclaimer.</P>
      </div>
    </Shell>
  );
}

function TermsES() {
  return (
    <Shell>
      <H1>Terminos de Servicio</H1>
      <p className="muted-small" style={{ marginBottom: 32 }}>Vigente: abril 2026 · matiz.community · Matiz Labs</p>

      <H2>1. Aceptacion de los Terminos</H2>
      <P>Al acceder o usar Matiz, conectar una billetera, lanzar un token o ejecutar cualquier transaccion, aceptas estos Terminos de Servicio. Si no estas de acuerdo, no uses la Plataforma.</P>

      <H2>2. Que es Matiz</H2>
      <P>Matiz es una <Strong>plataforma tecnologica</Strong> que provee una interfaz web para desplegar contratos de curva de vinculacion en Solana, herramientas para tokenizar comunidades, y un front-end para interactuar con contratos on-chain.</P>
      <P><Strong>Matiz NO es</Strong> un broker, casa de bolsa, custodio, intermediario financiero, plataforma de valores, servicio de asesoria de inversiones ni servicio de transmision de dinero. No tomamos custodia de tus fondos en ningun momento.</P>

      <H2>3. Naturaleza de los Tokens</H2>
      <P>Los tokens lanzados en Matiz son activos digitales gobernados por contratos inteligentes. Son:</P>
      <UL>
        <li><Strong>NO valores, acciones ni participaciones</Strong> en ninguna empresa</li>
        <li><Strong>NO instrumentos financieros</Strong> de ningun tipo</li>
        <li><Strong>NO inversiones</Strong> con retornos esperados</li>
        <li><Strong>NO productos financieros regulados</Strong></li>
      </UL>
      <P>El precio esta determinado algoritmicamente. Sube cuando se compra y baja cuando se vende. <Strong>No hay garantia</Strong> de que el precio suba. El valor puede llegar a cero.</P>

      <H2>4. Comisiones</H2>
      <P>Lanzamiento: $25 USDC (una vez). Plataforma: 0.5% por transaccion. Lanzador: 0-5% (configurable). Todas codificadas on-chain, verificables y no reembolsables.</P>

      <H2>5. No es Asesoria de Inversion</H2>
      <P>Nada en Matiz constituye asesoria financiera, de inversiones, fiscal o legal. No recomendamos ningun token, no respaldamos ningun creador, no garantizamos ningun retorno. Eres el unico responsable de tus decisiones.</P>

      <H2>6. Asuncion de Riesgo</H2>
      <P><Strong>Reconoces y aceptas todos los riesgos</Strong>: perdida de fondos, bugs en contratos, interrupciones de red, cambios regulatorios, volatilidad, riesgo de liquidez, abandono del creador, fallos tecnologicos y perdida de claves.</P>

      <H2>7. Sin Garantias</H2>
      <P>LA PLATAFORMA SE PROVEE "TAL CUAL" Y "SEGUN DISPONIBILIDAD." NO HACEMOS GARANTIAS EXPRESAS O IMPLICITAS.</P>

      <H2>8. Limitacion de Responsabilidad</H2>
      <P>EN LA MAXIMA MEDIDA PERMITIDA POR LA LEY, MATIZ LABS NO SERA RESPONSABLE POR DANOS INDIRECTOS, INCIDENTALES, ESPECIALES, CONSECUENTES O PUNITIVOS. NUESTRA RESPONSABILIDAD TOTAL NO EXCEDERA LAS COMISIONES PAGADAS EN LOS 12 MESES ANTERIORES.</P>

      <H2>9. Conducta del Usuario</H2>
      <P>Aceptas no: usar la Plataforma ilegalmente, suplantar identidades, cometer fraude o manipulacion, intentar hackear, usar bots para ventaja injusta, ni crear contenido ofensivo.</P>

      <H2>10. Propiedad Intelectual</H2>
      <P>Declaras que eres dueno del contenido que subes. Otorgas a Matiz una licencia no exclusiva mundial para mostrar tu contenido en la Plataforma.</P>

      <H2>11. Obligaciones Fiscales</H2>
      <P><Strong>Eres el unico responsable de tus obligaciones fiscales.</Strong> Matiz no provee asesoria fiscal, no retiene impuestos ni reporta transacciones.</P>

      <H2>12. Terminacion</H2>
      <P>Podemos restringir acceso a la interfaz en cualquier momento. La terminacion <Strong>no</Strong> afecta tus activos on-chain.</P>

      <H2>13. Resolucion de Disputas</H2>
      <P>Las disputas se resolveran mediante arbitraje vinculante (ICC, Ciudad de Panama). Renuncias a acciones colectivas.</P>

      <H2>14. Ley Aplicable</H2>
      <P>Estos Terminos se rigen por las leyes de la Republica de Panama.</P>

      <H2>15. Contacto</H2>
      <P>Email: legal@matiz.community</P>

      <div style={{ borderTop: "0.5px solid var(--border-subtle)", marginTop: 64, paddingTop: 32 }}>
        <H1>Aviso de Riesgos</H1>
        <P><Strong>LEE ESTO CUIDADOSAMENTE ANTES DE USAR MATIZ</Strong></P>
        <P>Matiz es una herramienta tecnologica. Permite desplegar tokens de curva de vinculacion e interactuar con ellos. No estamos recomendando, respaldando ni vendiendo ningun token. Estamos proporcionando software.</P>
        <H2>Puedes Perder Dinero</H2>
        <UL>
          <li>Puedes perder el 100% de lo que pongas. Los tokens pueden llegar a cero.</li>
          <li>Aumentos de precio pasados no predicen aumentos futuros.</li>
          <li>Unas pocas ventas grandes pueden derrumbar el precio para todos.</li>
          <li>Transparente no significa libre de riesgo. Justo no significa rentable.</li>
        </UL>
        <P><Strong>Si no puedes permitirte perder lo que vas a gastar — no lo gastes.</Strong></P>
        <P>Al usar Matiz, confirmas que has leido, entendido y aceptado este Aviso de Riesgos.</P>
      </div>
    </Shell>
  );
}
