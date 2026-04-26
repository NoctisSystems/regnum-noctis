"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function SairAdminPage() {
  const [mensagem, setMensagem] = useState("A terminar sessão administrativa...");

  useEffect(() => {
    let timeoutId: number | null = null;

    async function terminarSessao() {
      try {
        await supabase.auth.signOut({ scope: "local" });
      } catch {
        // Mesmo que o refresh token esteja inválido, limpamos o estado local.
      } finally {
        try {
          Object.keys(localStorage)
            .filter((key) => key.startsWith("sb-"))
            .forEach((key) => localStorage.removeItem(key));

          sessionStorage.clear();
        } catch {
          // Ignorado para não bloquear a saída.
        }

        setMensagem("Sessão terminada. A redirecionar...");

        timeoutId = window.setTimeout(() => {
          window.location.href = "/admin-login";
        }, 500);
      }
    }

    void terminarSessao();

    return () => {
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
    };
  }, []);

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top, rgba(166,120,61,0.08), transparent 22%), #2b160f",
        color: "#e6c27a",
        fontFamily: "Cormorant Garamond, serif",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "40px 16px",
      }}
    >
      <section
        style={{
          width: "100%",
          maxWidth: "560px",
          border: "1px solid #a6783d",
          background:
            "linear-gradient(180deg, rgba(20,13,9,0.98) 0%, rgba(16,10,8,0.98) 100%)",
          padding: "clamp(24px, 4vw, 40px)",
          textAlign: "center",
          boxShadow:
            "0 18px 42px rgba(0,0,0,0.24), inset 0 1px 0 rgba(255,225,170,0.04)",
        }}
      >
        <p
          style={{
            margin: "0 0 10px 0",
            textTransform: "uppercase",
            letterSpacing: "0.16em",
            fontSize: "14px",
            color: "#caa15a",
          }}
        >
          Administração
        </p>

        <h1
          style={{
            fontFamily: "Cinzel, serif",
            fontSize: "clamp(32px, 5vw, 42px)",
            margin: "0 0 14px 0",
            color: "#f0d79a",
            fontWeight: 500,
          }}
        >
          Sair
        </h1>

        <p
          style={{
            margin: "0 0 22px 0",
            fontSize: "20px",
            lineHeight: 1.7,
            color: "#d7b06c",
          }}
        >
          {mensagem}
        </p>

        <Link
          href="/admin-login"
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            textDecoration: "none",
            border: "1px solid rgba(166,120,61,0.6)",
            color: "#e6c27a",
            padding: "12px 16px",
            fontSize: "15px",
            background: "rgba(32,18,13,0.55)",
            textAlign: "center",
          }}
        >
          Ir para o login
        </Link>
      </section>
    </main>
  );
}