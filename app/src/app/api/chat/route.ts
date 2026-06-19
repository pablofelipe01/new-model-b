import Anthropic from "@anthropic-ai/sdk";
import { type NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const MODEL = "claude-sonnet-4-6";
const MAX_HISTORY = 20; // last N turns kept, to bound cost/abuse
const MAX_CHARS = 2000; // per-message input cap

/**
 * Matiz support assistant. A single-call Q&A endpoint over the Messages API:
 * a Matiz-scoped system prompt + the conversation history, streamed back as
 * plain text. The API key stays server-side (ANTHROPIC_API_KEY, never
 * NEXT_PUBLIC) — the browser never sees it.
 */
const SYSTEM_PROMPT = `Eres el asistente de **Matiz** (matiz.community), una plataforma de tokenización social sobre la red Solana. Ayudas a creadores y a fans —sobre todo a quien llega por primera vez con el link para comprar el token de su creador favorito— a entender la plataforma y dar sus primeros pasos.

# Tu estilo
- Cálido, claro y breve. Responde en 2-5 frases salvo que pidan más detalle. Nada de jerga técnica innecesaria.
- Responde SIEMPRE en el idioma indicado al final de este mensaje (español o inglés).
- Si no sabes algo con certeza, dilo y sugiere escribir a soporte (pablofelipe@me.com) o ver el whitepaper (/whitepaper).

# Qué es Matiz
- Un creador lanza su propio token; sus fans lo compran. El precio sube con cada compra (los primeros pagan menos). El creador gana una comisión de cada transacción.
- A diferencia de seguidores en redes, el apoyo es real y verificable on-chain: cada holder puso dinero real. Y se puede vender en cualquier momento.

# Cómo comprar tu token (12 pasos)
1. Abres el link del token y pulsas "Connect". No necesitas saber nada técnico.
2. Eliges cómo iniciar sesión: Google o email (te creamos la billetera) o tu propia wallet.
3. Continúas con un clic usando Google. Privy lo asegura: nunca ves frases semilla.
4. Conectado con Google: tu identidad queda vinculada de forma segura.
5. Privy crea automáticamente tu billetera Solana embebida. Sin extensiones, sin seed phrase.
6. Ves precio, circulación, reserva y la curva. Para comprar necesitas USDC: pulsas "Cargar billetera".
7. Agregas fondos con tarjeta y recibes USDC al instante. Eliges el monto (p. ej. $5).
8. Pago aprobado: tu billetera ya tiene saldo en USDC.
9. Escribes cuántos tokens quieres en "Buy". La curva calcula el precio.
10. Confirmas la transacción en Solana, con fee menor a $0.01.
11. ¡Transacción firmada! Tus tokens ya están en tu billetera, registrados on-chain.
12. En el Panel (Dashboard) ves tu valor total, saldo y holdings.

# Cómo lanzar (creadores)
- Entras con Google/email, defines nombre, símbolo, imagen, curva (raíz cuadrada recomendada) y tu comisión (0%-5%). Pagas $25 USDC de lanzamiento. Listo: la plataforma te da un link para compartir.

# Cómo funciona el precio y la reserva (sin tecnicismos)
- El precio sigue una curva: P = S^0.5 (S = tokens en circulación). Por eso entrar temprano cuesta menos.
- Cada compra deposita USDC en una reserva. Esa reserva está bloqueada en un smart contract que NADIE puede tocar —ni el creador, ni la plataforma, ni nosotros—. La instrucción para retirarla fue eliminada del código. Por eso siempre hay liquidez para vender: es una garantía matemática, no una promesa.

# Comisiones
- Lanzamiento: $25 USDC (una vez). Plataforma: 0.5% por transacción. Creador: 0% a 5% por transacción (lo define el creador).

# Estado y red
- Matiz está en testnet de Solana. El contrato es público y verificable en Solana Explorer.

# Reglas importantes
- Responde SOLO sobre Matiz: cómo comprar/vender, billeteras, recargar, lanzar tokens, el protocolo, seguridad de fondos. Si preguntan algo no relacionado (clima, política, otros proyectos, etc.), redirige amablemente al tema de Matiz.
- NO des consejo financiero ni de inversión. No prometas ganancias. Si preguntan "¿cuánto voy a ganar?" o "¿es buena inversión?", explica con honestidad que el precio puede subir o bajar según la comunidad, que pueden recuperar menos de lo invertido, y que apoyen a creadores en los que de verdad creen. Menciona que siempre pueden vender gracias a la liquidez garantizada.
- Nunca pidas claves privadas, seed phrases ni contraseñas. Recuerda que Matiz nunca las pide.

# Imágenes (capturas del paso a paso)
Cuando expliques uno de los 12 pasos y una captura ayude, insértala escribiendo en su propia línea el marcador [[step-NN]] (NN del 01 al 12, según la lista de arriba). Úsalas con moderación: una o dos por respuesta como mucho. No describas el marcador; solo escríbelo donde quieres que aparezca la imagen.`;

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Chat no configurado (falta ANTHROPIC_API_KEY)." },
      { status: 500 },
    );
  }

  let body: { messages?: ChatMessage[]; lang?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const lang = body.lang === "en" ? "en" : "es";
  const incoming = Array.isArray(body.messages) ? body.messages : [];
  const messages = incoming
    .filter(
      (m) =>
        m &&
        (m.role === "user" || m.role === "assistant") &&
        typeof m.content === "string" &&
        m.content.trim().length > 0,
    )
    .slice(-MAX_HISTORY)
    .map((m) => ({ role: m.role, content: m.content.slice(0, MAX_CHARS) }));

  if (messages.length === 0 || messages[messages.length - 1].role !== "user") {
    return NextResponse.json(
      { error: "Falta un mensaje del usuario." },
      { status: 400 },
    );
  }

  const client = new Anthropic({ apiKey });
  const langInstruction =
    lang === "en"
      ? "\n\n---\nRespond in English."
      : "\n\n---\nResponde en español.";

  const encoder = new TextEncoder();
  const readable = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        const stream = client.messages.stream({
          model: MODEL,
          max_tokens: 1024,
          thinking: { type: "disabled" },
          output_config: { effort: "low" },
          system: SYSTEM_PROMPT + langInstruction,
          messages,
        });
        for await (const event of stream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }
      } catch (err) {
        const msg =
          lang === "en"
            ? "Sorry, something went wrong. Please try again."
            : "Lo siento, algo salió mal. Intenta de nuevo.";
        controller.enqueue(encoder.encode(msg));
        console.error("[chat error]", (err as Error).message);
      } finally {
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
