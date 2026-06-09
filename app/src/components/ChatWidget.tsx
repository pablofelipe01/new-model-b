"use client";

import { useEffect, useRef, useState } from "react";

import { useLanguage } from "@/components/providers/LanguageProvider";

interface Msg {
  role: "user" | "assistant";
  content: string;
}

/** Renders **bold** spans and [[step-NN]] image markers inside a message. */
function renderRich(text: string) {
  const parts = text.split(/(\[\[step-\d{2}\]\])/g);
  return parts.map((part, i) => {
    const img = part.match(/^\[\[step-(\d{2})\]\]$/);
    if (img) {
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={i}
          src={`/blog/como-comprar-tu-token/step-${img[1]}.jpg`}
          alt={`Paso ${img[1]}`}
          className="chat-step-img"
        />
      );
    }
    const bolds = part.split(/(\*\*[^*]+\*\*)/g);
    return (
      <span key={i}>
        {bolds.map((b, j) => {
          const m = b.match(/^\*\*([^*]+)\*\*$/);
          return m ? <strong key={j}>{m[1]}</strong> : <span key={j}>{b}</span>;
        })}
      </span>
    );
  });
}

export function ChatWidget() {
  const { lang } = useLanguage();
  const es = lang === "es";
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const greeting = es
    ? "¡Hola! 👋 Soy el asistente de Matiz. Puedo ayudarte a comprar el token de tu creador, recargar tu billetera o entender cómo funciona. ¿En qué te ayudo?"
    : "Hi! 👋 I'm the Matiz assistant. I can help you buy your creator's token, fund your wallet, or understand how it works. How can I help?";

  const starters = es
    ? ["¿Cómo compro un token?", "¿Cómo recargo mi billetera?", "¿Mi dinero está seguro?"]
    : ["How do I buy a token?", "How do I fund my wallet?", "Is my money safe?"];

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, open]);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    setInput("");
    const history: Msg[] = [...messages, { role: "user", content: trimmed }];
    setMessages([...history, { role: "assistant", content: "" }]);
    setBusy(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history, lang }),
      });
      if (!res.ok || !res.body) throw new Error("bad response");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setMessages((prev) => {
          const next = [...prev];
          next[next.length - 1] = { role: "assistant", content: acc };
          return next;
        });
      }
    } catch {
      setMessages((prev) => {
        const next = [...prev];
        next[next.length - 1] = {
          role: "assistant",
          content: es
            ? "Lo siento, hubo un problema de conexión. Intenta de nuevo."
            : "Sorry, there was a connection problem. Please try again.",
        };
        return next;
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {/* Launcher */}
      <button
        type="button"
        className="chat-fab"
        onClick={() => setOpen((o) => !o)}
        aria-label={es ? "Abrir asistente" : "Open assistant"}
      >
        {open ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M6 6l12 12M6 18L18 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path
              d="M4 5.5A2.5 2.5 0 016.5 3h11A2.5 2.5 0 0120 5.5v7A2.5 2.5 0 0117.5 15H9l-4 4v-4H6.5A2.5 2.5 0 014 12.5v-7z"
              fill="currentColor"
            />
          </svg>
        )}
      </button>

      {open && (
        <div className="chat-panel">
          <div className="chat-header">
            <div>
              <div className="chat-title">{es ? "Asistente Matiz" : "Matiz Assistant"}</div>
              <div className="chat-sub">{es ? "Resuelve tus dudas al instante" : "Instant answers"}</div>
            </div>
            <button type="button" className="chat-close" onClick={() => setOpen(false)} aria-label="Cerrar">
              ✕
            </button>
          </div>

          <div className="chat-body" ref={scrollRef}>
            <div className="chat-msg assistant">{renderRich(greeting)}</div>

            {messages.length === 0 && (
              <div className="chat-starters">
                {starters.map((s) => (
                  <button key={s} type="button" className="chat-chip" onClick={() => send(s)}>
                    {s}
                  </button>
                ))}
              </div>
            )}

            {messages.map((m, i) => (
              <div key={i} className={`chat-msg ${m.role}`}>
                {m.content
                  ? renderRich(m.content)
                  : busy && i === messages.length - 1 && (
                      <span className="chat-typing">
                        <span />
                        <span />
                        <span />
                      </span>
                    )}
              </div>
            ))}
          </div>

          <form
            className="chat-input-row"
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
          >
            <input
              type="text"
              className="input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={es ? "Escribe tu pregunta…" : "Type your question…"}
              disabled={busy}
            />
            <button type="submit" className="btn btn-primary" disabled={busy || !input.trim()}>
              {es ? "Enviar" : "Send"}
            </button>
          </form>

          <div className="chat-foot">
            {es ? "Asistente de Matiz · no es consejo financiero" : "Matiz assistant · not financial advice"}
          </div>
        </div>
      )}
    </>
  );
}
