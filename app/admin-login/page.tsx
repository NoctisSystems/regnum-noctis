"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AdminLoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");

  async function handleLogin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErro("");

    if (!email.trim()) {
      setErro("Indica o email.");
      return;
    }

    if (!password.trim()) {
      setErro("Indica a palavra-passe.");
      return;
    }

    try {
      setLoading(true);

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        throw error;
      }

      if (!data.user) {
        setErro("Não foi possível validar o utilizador.");
        return;
      }

      const { data: adminData, error: adminError } = await supabase
        .from("admin")
        .select("id, auth_id, email")
        .eq("auth_id", data.user.id)
        .single();

      if (adminError || !adminData) {
        await supabase.auth.signOut();
        setErro("Não tens permissões de administrador.");
        return;
      }

      router.push("/admin");
      router.refresh();
    } catch (error: any) {
      setErro(error?.message || "Erro ao entrar.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={main}>
      <section style={card}>
        <p style={eyebrow}>Regnum Noctis</p>

        <h1 style={title}>Administração</h1>

        <p style={subtitle}>
          Entrada reservada à equipa de administração do Regnum Noctis.
        </p>

        {erro ? <div style={erroBox}>{erro}</div> : null}

        <form onSubmit={handleLogin} style={form}>
          <div>
            <label style={label} htmlFor="admin-email">
              Email
            </label>

            <input
              id="admin-email"
              type="email"
              style={input}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              placeholder="admin@regnumnoctis.pt"
            />
          </div>

          <div>
            <label style={label} htmlFor="admin-password">
              Palavra-passe
            </label>

            <input
              id="admin-password"
              type={mostrarPassword ? "text" : "password"}
              style={input}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              placeholder="A tua palavra-passe"
            />

            <button
              type="button"
              onClick={() => setMostrarPassword((prev) => !prev)}
              style={toggleButton}
            >
              {mostrarPassword
                ? "Ocultar palavra-passe"
                : "Mostrar palavra-passe"}
            </button>
          </div>

          <button type="submit" style={button} disabled={loading}>
            {loading ? "A entrar..." : "Entrar"}
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
  color: "#e6c27a",
  fontFamily: "Cormorant Garamond, serif",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  padding: "24px 16px",
};

const card: React.CSSProperties = {
  width: "100%",
  maxWidth: "520px",
  border: "1px solid #a6783d",
  background:
    "linear-gradient(180deg, rgba(20,13,9,0.98) 0%, rgba(16,10,8,0.98) 100%)",
  padding: "clamp(24px, 4vw, 40px)",
  boxShadow:
    "0 18px 42px rgba(0,0,0,0.24), inset 0 1px 0 rgba(255,225,170,0.04)",
};

const eyebrow: React.CSSProperties = {
  margin: "0 0 10px 0",
  textAlign: "center",
  textTransform: "uppercase",
  letterSpacing: "0.16em",
  fontSize: "14px",
  color: "#caa15a",
};

const title: React.CSSProperties = {
  fontFamily: "Cinzel, serif",
  fontSize: "clamp(34px, 6vw, 42px)",
  textAlign: "center",
  marginTop: 0,
  marginBottom: "12px",
  color: "#f0d79a",
  fontWeight: 500,
  lineHeight: 1.1,
};

const subtitle: React.CSSProperties = {
  textAlign: "center",
  marginTop: 0,
  marginBottom: "28px",
  fontSize: "clamp(18px, 2.3vw, 20px)",
  lineHeight: 1.7,
  color: "#caa15a",
};

const form: React.CSSProperties = {
  display: "grid",
  gap: "18px",
};

const label: React.CSSProperties = {
  display: "block",
  marginBottom: "8px",
  fontSize: "18px",
  color: "#e6c27a",
};

const input: React.CSSProperties = {
  width: "100%",
  padding: "14px 14px",
  border: "1px solid #a6783d",
  background: "#2b160f",
  color: "#e6c27a",
  fontSize: "18px",
  outline: "none",
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03)",
};

const button: React.CSSProperties = {
  marginTop: "10px",
  padding: "14px 18px",
  border: "1px solid #a6783d",
  background: "transparent",
  color: "#e6c27a",
  fontSize: "20px",
  cursor: "pointer",
  minHeight: "52px",
};

const toggleButton: React.CSSProperties = {
  marginTop: "8px",
  padding: 0,
  border: "none",
  background: "transparent",
  color: "#caa15a",
  fontSize: "16px",
  cursor: "pointer",
};

const erroBox: React.CSSProperties = {
  border: "1px solid rgba(239,68,68,0.4)",
  background: "rgba(239,68,68,0.08)",
  color: "#fecaca",
  padding: "12px 14px",
  marginBottom: "16px",
  textAlign: "center",
  fontSize: "17px",
  lineHeight: 1.6,
};