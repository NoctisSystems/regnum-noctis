"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AlunoLoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  async function handleLogin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErro("");
    setSucesso("");

    if (!email.trim()) {
      setErro("Indica o teu email.");
      return;
    }

    if (!password.trim()) {
      setErro("Indica a tua palavra-passe.");
      return;
    }

    try {
      setLoading(true);

      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        throw error;
      }

      setSucesso("Login efetuado com sucesso.");

      setTimeout(() => {
        router.push("/aluno/dashboard");
      }, 1000);
    } catch (error: any) {
      setErro(error?.message || "Não foi possível iniciar sessão.");
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
        paddingTop: "60px",
        paddingRight: "20px",
        paddingBottom: "80px",
        paddingLeft: "20px",
      }}
    >
      <section
        style={{
          maxWidth: "620px",
          marginTop: "0",
          marginRight: "auto",
          marginBottom: "0",
          marginLeft: "auto",
          border: "1px solid #8a5d31",
          background: "#140d09",
          paddingTop: "40px",
          paddingRight: "32px",
          paddingBottom: "40px",
          paddingLeft: "32px",
          boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
        }}
      >
        <p
          style={{
            letterSpacing: "3px",
            textTransform: "uppercase",
            color: "#caa15a",
            fontSize: "15px",
            marginTop: 0,
            marginRight: 0,
            marginBottom: "14px",
            marginLeft: 0,
            textAlign: "center",
          }}
        >
          Área do Aluno
        </p>

        <h1
          style={{
            fontFamily: "Cinzel, serif",
            fontSize: "42px",
            marginTop: 0,
            marginRight: 0,
            marginBottom: "16px",
            marginLeft: 0,
            textAlign: "center",
            color: "#e6c27a",
          }}
        >
          Entrar
        </h1>

        <p
          style={{
            fontSize: "21px",
            lineHeight: "1.75",
            color: "#d7b06c",
            textAlign: "center",
            marginTop: 0,
            marginRight: 0,
            marginBottom: "30px",
            marginLeft: 0,
          }}
        >
          Acede à tua conta para veres os teus cursos e conteúdos.
        </p>

        {erro && (
          <div
            style={{
              border: "1px solid rgba(239,68,68,0.35)",
              background: "rgba(239,68,68,0.08)",
              color: "#fecaca",
              paddingTop: "14px",
              paddingRight: "16px",
              paddingBottom: "14px",
              paddingLeft: "16px",
              marginTop: 0,
              marginRight: 0,
              marginBottom: "18px",
              marginLeft: 0,
            }}
          >
            {erro}
          </div>
        )}

        {sucesso && (
          <div
            style={{
              border: "1px solid rgba(16,185,129,0.35)",
              background: "rgba(16,185,129,0.08)",
              color: "#bbf7d0",
              paddingTop: "14px",
              paddingRight: "16px",
              paddingBottom: "14px",
              paddingLeft: "16px",
              marginTop: 0,
              marginRight: 0,
              marginBottom: "18px",
              marginLeft: 0,
            }}
          >
            {sucesso}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div style={campoWrap}>
            <label style={label}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={input}
              placeholder="teuemail@exemplo.com"
            />
          </div>

          <div
            style={{
              marginTop: 0,
              marginRight: 0,
              marginBottom: "24px",
              marginLeft: 0,
            }}
          >
            <label style={label}>Palavra-passe</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={input}
              placeholder="A tua palavra-passe"
            />
          </div>

          <button type="submit" disabled={loading} style={botaoPrincipal}>
            {loading ? "A entrar..." : "Entrar"}
          </button>
        </form>

        <div
          style={{
            textAlign: "center",
            marginTop: "24px",
            marginRight: 0,
            marginBottom: 0,
            marginLeft: 0,
            fontSize: "19px",
            color: "#d7b06c",
          }}
        >
          Ainda não tens conta?{" "}
          <a href="/aluno/registo" style={linkInline}>
            Criar conta
          </a>
        </div>
      </section>
    </main>
  );
}

const campoWrap = {
  marginTop: 0,
  marginRight: 0,
  marginBottom: "18px",
  marginLeft: 0,
};

const label = {
  display: "block",
  fontSize: "18px",
  color: "#e6c27a",
  marginTop: 0,
  marginRight: 0,
  marginBottom: "8px",
  marginLeft: 0,
};

const input = {
  width: "100%",
  paddingTop: "14px",
  paddingRight: "14px",
  paddingBottom: "14px",
  paddingLeft: "14px",
  background: "#1a100c",
  border: "1px solid #8a5d31",
  color: "#e6c27a",
  fontSize: "18px",
  outline: "none",
};

const botaoPrincipal = {
  width: "100%",
  border: "1px solid #a6783d",
  color: "#e6c27a",
  background: "transparent",
  paddingTop: "14px",
  paddingRight: "18px",
  paddingBottom: "14px",
  paddingLeft: "18px",
  fontSize: "20px",
  cursor: "pointer",
};

const linkInline = {
  color: "#e6c27a",
  textDecoration: "underline",
};