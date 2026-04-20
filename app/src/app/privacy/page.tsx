"use client";

import { useLanguage } from "@/components/providers/LanguageProvider";
import { MLogo } from "@/components/matiz/MLogo";
import Link from "next/link";

export default function PrivacyPage() {
  const { lang } = useLanguage();
  const en = lang === "en";

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "48px 20px 96px" }}>
      <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 32, color: "var(--text-secondary)", textDecoration: "none", fontSize: 14 }}>
        <MLogo size={20} /> ← matiz.community
      </Link>
      <div style={{ color: "var(--text-secondary)", fontSize: 15, lineHeight: 1.7 }}>
        <h1 className="display-m fraunces-italic" style={{ color: "var(--text-primary)", marginBottom: 8 }}>
          {en ? "Privacy Policy" : "Politica de Privacidad"}
        </h1>
        <p className="muted-small" style={{ marginBottom: 32 }}>
          {en ? "Effective: April 2026" : "Vigente: abril 2026"} · matiz.community
        </p>

        <h2 style={{ color: "var(--text-primary)", fontSize: 20, fontWeight: 500, marginTop: 48, marginBottom: 12 }}>
          {en ? "What We Collect" : "Que recopilamos"}
        </h2>
        <p style={{ marginBottom: 16 }}>
          {en
            ? "Matiz collects minimal data necessary to operate the Platform:"
            : "Matiz recopila datos minimos necesarios para operar la Plataforma:"}
        </p>
        <ul style={{ paddingLeft: 20, marginBottom: 16 }}>
          <li>{en ? "Email address (if you sign in with Google/email via Privy)" : "Correo electronico (si inicias sesion con Google/email via Privy)"}</li>
          <li>{en ? "Wallet address (public by nature of blockchain)" : "Direccion de billetera (publica por naturaleza de blockchain)"}</li>
          <li>{en ? "Transaction data (public on-chain)" : "Datos de transacciones (publicos on-chain)"}</li>
          <li>{en ? "Basic analytics (page views, via Vercel Analytics)" : "Analiticas basicas (vistas de pagina, via Vercel Analytics)"}</li>
        </ul>

        <h2 style={{ color: "var(--text-primary)", fontSize: 20, fontWeight: 500, marginTop: 48, marginBottom: 12 }}>
          {en ? "What We Do NOT Collect" : "Que NO recopilamos"}
        </h2>
        <ul style={{ paddingLeft: 20, marginBottom: 16 }}>
          <li>{en ? "Private keys or seed phrases — ever" : "Claves privadas o frases de recuperacion — nunca"}</li>
          <li>{en ? "Credit card or bank information (handled by third-party payment processors)" : "Informacion de tarjetas o bancaria (manejada por procesadores de pago terceros)"}</li>
          <li>{en ? "Government-issued ID (unless required by a third-party KYC provider)" : "Documentos de identidad (a menos que lo requiera un proveedor KYC tercero)"}</li>
        </ul>

        <h2 style={{ color: "var(--text-primary)", fontSize: 20, fontWeight: 500, marginTop: 48, marginBottom: 12 }}>
          {en ? "Third-Party Services" : "Servicios de terceros"}
        </h2>
        <p style={{ marginBottom: 16 }}>
          {en
            ? "We use: Privy (authentication, embedded wallets), Vercel (hosting, analytics), Pinata (IPFS image storage), Helius (Solana RPC). Each has its own privacy policy."
            : "Usamos: Privy (autenticacion, billeteras embebidas), Vercel (hosting, analiticas), Pinata (almacenamiento de imagenes IPFS), Helius (Solana RPC). Cada uno tiene su propia politica de privacidad."}
        </p>

        <h2 style={{ color: "var(--text-primary)", fontSize: 20, fontWeight: 500, marginTop: 48, marginBottom: 12 }}>
          {en ? "Blockchain Transparency" : "Transparencia de blockchain"}
        </h2>
        <p style={{ marginBottom: 16 }}>
          {en
            ? "All transactions on Solana are public and permanent. Your wallet address, token balances, and transaction history are visible to anyone. This is a feature of blockchain technology, not something we control."
            : "Todas las transacciones en Solana son publicas y permanentes. Tu direccion de billetera, saldos de tokens e historial de transacciones son visibles para cualquiera. Esto es una caracteristica de la tecnologia blockchain, no algo que controlemos."}
        </p>

        <h2 style={{ color: "var(--text-primary)", fontSize: 20, fontWeight: 500, marginTop: 48, marginBottom: 12 }}>
          {en ? "Data Retention" : "Retencion de datos"}
        </h2>
        <p style={{ marginBottom: 16 }}>
          {en
            ? "We retain account data as long as your account is active. On-chain data is permanent and cannot be deleted by anyone, including us."
            : "Retenemos datos de cuenta mientras tu cuenta este activa. Los datos on-chain son permanentes y no pueden ser eliminados por nadie, incluyendonos."}
        </p>

        <h2 style={{ color: "var(--text-primary)", fontSize: 20, fontWeight: 500, marginTop: 48, marginBottom: 12 }}>
          {en ? "Contact" : "Contacto"}
        </h2>
        <p style={{ marginBottom: 16 }}>
          {en ? "Email: legal@matiz.community" : "Email: legal@matiz.community"}
        </p>
      </div>
    </div>
  );
}
