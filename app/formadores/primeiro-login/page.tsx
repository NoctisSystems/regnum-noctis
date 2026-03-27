"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function PrimeiroLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    setSucesso("");

    if (!email.trim() || !password || !confirmPassword) {
      setErro("Preenche todos os campos.");
      return;
    }

    if (password !== confirmPassword) {
      setErro("As palavras-passe não coincidem.");
      return;
    }

    try {
      setLoading(true);

      const { data: formador, error: formadorError } = await supabase
        .from("formadores")
        .select("id, email, status, auth_id")
        .eq("email", email.trim())
        .single();

      if (formadorError || !formador) {
        setErro("Este email não corresponde a um formador aprovado.");
        return;
      }

      if (formador.status !== "aprovado") {
        setErro("A tua candidatura ainda não foi aprovada.");
        return;
      }

      if (formador.auth_id) {
        setErro("Esta conta já foi ativada. Faz login normalmente.");
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      });

      if (error) {
        setErro(error.message);
        return;
      }

      const userId = data.user?.id;

      if (!userId) {
        setErro("Não foi possível criar a conta.");
        return;
      }

      const { error: updateError } = await supabase
        .from("formadores")
        .update({ auth_id: userId })
        .eq("id", formador.id);

      if (updateError) {
        setErro("Conta criada, mas falhou a ligação ao registo do formador.");
        return;
      }

      setSucesso("Conta criada com sucesso. Já podes fazer login.");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
    } catch {
      setErro("Ocorreu um erro inesperado.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={main}>
      <section style={card}>
        <h1 style={title}>Primeiro Login</h1>

        <p style={subtitle}>
          Configura o teu acesso de formador com o email usado na candidatura.
        </p>

        <form onSubmit={handleSubmit} style={formStyle}>
          <div>
            <label style={label}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={input}
              required
            />
          </div>

          <div>
            <label style={label}>Palavra-passe</label>
            <div style={passwordWrapper}>
              <input
                type={mostrarPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={inputComBotao}
                required
              />
              <button
                type="button"
                onClick={() => setMostrarPassword((v) => !v)}
                style={toggleButton}
              >
                {mostrarPassword ? "Ocultar" : "Ver"}
              </button>
            </div>
          </div>

          <div>
            <label style={label}>Confirmar palavra-passe</label>
            <input
              type={mostrarPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              style={input}
              required
            />
          </div>

          {erro && <div style={erroStyle}>{erro}</div>}
          {sucesso && <div style={sucessoStyle}>{sucesso}</div>}

          <button type="submit" style={button} disabled={loading}>
            {loading ? "A criar conta..." : "Criar conta"}
          </button>
        </form>
      </section>
    </main>
  );
}

const main: React.CSSProperties = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at top, rgba(166,120,61,0.08), transparent 22%), #2b160f",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  padding: "40px 16px",
  fontFamily: "Cormorant Garamond, serif",
};

const card: React.CSSProperties = {
  width: "100%",
  maxWidth: "720px",
  border: "1px solid #a6783d",
  background: "#140d09",
  padding: "clamp(24px, 5vw, 56px) clamp(18px, 5vw, 50px)",
  boxShadow:
    "0 18px 42px rgba(0,0,0,0.24), inset 0 1px 0 rgba(255,225,170,0.03)",
};

const title: React.CSSProperties = {
  fontFamily: "Cinzel, serif",
  fontSize: "clamp(34px, 6vw, 56px)",
  textAlign: "center",
  color: "#e6c27a",
  marginTop: 0,
  marginBottom: "14px",
};

const subtitle: React.CSSProperties = {
  textAlign: "center",
  fontSize: "clamp(18px, 2.4vw, 24px)",
  color: "#caa15a",
  marginTop: 0,
  marginBottom: "32px",
  lineHeight: 1.6,
};

const formStyle: React.CSSProperties = {
  display: "grid",
  gap: "22px",
};

const label: React.CSSProperties = {
  display: "block",
  marginBottom: "10px",
  fontSize: "22px",
  color: "#e6c27a",
};

const input: React.CSSProperties = {
  width: "100%",
  padding: "18px",
  border: "1px solid #a6783d",
  background: "#2b160f",
  color: "#e6c27a",
  fontSize: "22px",
  outline: "none",
};

const passwordWrapper: React.CSSProperties = {
  position: "relative",
};

const inputComBotao: React.CSSProperties = {
  width: "100%",
  padding: "18px 96px 18px 18px",
  border: "1px solid #a6783d",
  background: "#2b160f",
  color: "#e6c27a",
  fontSize: "22px",
  outline: "none",
};

const toggleButton: React.CSSProperties = {
  position: "absolute",
  right: "12px",
  top: "50%",
  transform: "translateY(-50%)",
  background: "transparent",
  border: "1px solid #a6783d",
  color: "#e6c27a",
  cursor: "pointer",
  fontSize: "15px",
  padding: "8px 12px",
};

const button: React.CSSProperties = {
  marginTop: "10px",
  padding: "18px",
  border: "1px solid #a6783d",
  background: "transparent",
  color: "#e6c27a",
  fontSize: "24px",
  cursor: "pointer",
};

const erroStyle: React.CSSProperties = {
  color: "#ffb4b4",
  border: "1px solid rgba(255,107,107,0.35)",
  background: "rgba(120,20,20,0.12)",
  padding: "14px",
  fontSize: "19px",
};

const sucessoStyle: React.CSSProperties = {
  color: "#bff1bf",
  border: "1px solid rgba(74,222,128,0.35)",
  background: "rgba(20,90,40,0.12)",
  padding: "14px",
  fontSize: "19px",
};