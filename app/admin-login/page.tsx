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
    } catch (error: any) {
      setErro(error?.message || "Erro ao entrar.");
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
          maxWidth: "460px",
          border: "1px solid #a6783d",
          background: "#140d09",
          padding: "36px",
          boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
        }}
      >
        <h1
          style={{
            fontFamily: "Cinzel, serif",
            fontSize: "38px",
            textAlign: "center",
            marginTop: 0,
            marginBottom: "12px",
          }}
        >
          Administração
        </h1>

        <p
          style={{
            textAlign: "center",
            marginTop: 0,
            marginBottom: "28px",
            fontSize: "20px",
            color: "#caa15a",
          }}
        >
          Entrada reservada à equipa de administração do Regnum Noctis.
        </p>

        {erro && (
          <div
            style={{
              border: "1px solid rgba(239,68,68,0.4)",
              background: "rgba(239,68,68,0.08)",
              color: "#fecaca",
              padding: "12px",
              marginBottom: "16px",
              textAlign: "center",
            }}
          >
            {erro}
          </div>
        )}

        <form onSubmit={handleLogin} style={{ display: "grid", gap: "18px" }}>
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
            />

            <button
              type="button"
              onClick={() => setMostrarPassword((prev) => !prev)}
              style={toggleButton}
            >
              {mostrarPassword ? "Ocultar palavra-passe" : "Mostrar palavra-passe"}
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
  padding: "12px 18px",
  border: "1px solid #a6783d",
  background: "transparent",
  color: "#e6c27a",
  fontSize: "20px",
  cursor: "pointer",
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