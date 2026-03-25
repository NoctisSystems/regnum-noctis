"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function LoginFormadorPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErro("");

    if (!email.trim() || !password.trim()) {
      setErro("Preenche o email e a palavra-passe.");
      return;
    }

    try {
      setLoading(true);

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        setErro("Email ou palavra-passe inválidos.");
        return;
      }

      const authId = data.user?.id;

      if (!authId) {
        setErro("Não foi possível validar o utilizador.");
        return;
      }

      const { data: formador, error: formadorError } = await supabase
        .from("formadores")
        .select("id, status, auth_id")
        .eq("email", email.trim())
        .single();

      if (formadorError || !formador) {
        await supabase.auth.signOut();
        setErro("Esta conta não está autorizada como formador.");
        return;
      }

      if (formador.status !== "aprovado") {
        await supabase.auth.signOut();
        setErro("A tua conta de formador ainda não está aprovada.");
        return;
      }

      if (formador.auth_id && formador.auth_id !== authId) {
        await supabase.auth.signOut();
        setErro("Esta conta não corresponde ao registo do formador.");
        return;
      }

      window.location.href = "/formadores/dashboard";
    } catch {
      setErro("Ocorreu um erro ao iniciar sessão.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#2b160f",
        color: "#e6c27a",
        fontFamily: "Cormorant Garamond, serif",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "40px 20px",
      }}
    >
      <section
        style={{
          width: "100%",
          maxWidth: "520px",
          border: "1px solid #a6783d",
          background: "#140d09",
          padding: "40px",
        }}
      >
        <h1
          style={{
            fontFamily: "Cinzel, serif",
            fontSize: "42px",
            textAlign: "center",
            marginTop: 0,
            marginBottom: "12px",
          }}
        >
          Login Formador
        </h1>

        <p
          style={{
            textAlign: "center",
            fontSize: "20px",
            color: "#caa15a",
            marginBottom: "30px",
          }}
        >
          Entra na tua área de formador
        </p>

        <form onSubmit={handleSubmit} style={{ display: "grid", gap: "18px" }}>
          <div>
            <label style={label}>Email</label>
            <input
              type="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={input}
              required
            />
          </div>

          <div>
            <label style={label}>Palavra-passe</label>
            <input
              type="password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={input}
              required
            />
          </div>

          {erro && (
            <div
              style={{
                color: "#ffb4b4",
                border: "1px solid rgba(255,107,107,0.35)",
                background: "rgba(120,20,20,0.12)",
                padding: "12px 14px",
                fontSize: "18px",
              }}
            >
              {erro}
            </div>
          )}

          <button type="submit" style={button} disabled={loading}>
            {loading ? "A entrar..." : "Entrar"}
          </button>
        </form>

        <div
          style={{
            marginTop: "24px",
            textAlign: "center",
            fontSize: "18px",
            color: "#caa15a",
            lineHeight: "1.7",
            display: "grid",
            gap: "10px",
          }}
        >
          <div>
            Ainda não configuraste o teu acesso?
            <br />
            <Link
              href="/formadores/primeiro-login"
              style={{
                color: "#e6c27a",
                textDecoration: "underline",
                fontWeight: 700,
              }}
            >
              Fazer primeiro login
            </Link>
          </div>

          <div style={{ marginTop: "8px" }}>
            Ainda não és formador?
            <br />
            <Link
              href="/tornar-me-formador"
              style={{
                color: "#e6c27a",
                textDecoration: "underline",
              }}
            >
              Submeter candidatura
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

const label: React.CSSProperties = {
  display: "block",
  marginBottom: "8px",
  fontSize: "18px",
  color: "#e6c27a",
};

const input: React.CSSProperties = {
  width: "100%",
  padding: "12px",
  border: "1px solid #a6783d",
  background: "#2b160f",
  color: "#e6c27a",
  fontSize: "18px",
  outline: "none",
};

const button: React.CSSProperties = {
  marginTop: "10px",
  padding: "14px",
  border: "1px solid #a6783d",
  background: "transparent",
  color: "#e6c27a",
  fontSize: "20px",
  cursor: "pointer",
  opacity: 1,
};