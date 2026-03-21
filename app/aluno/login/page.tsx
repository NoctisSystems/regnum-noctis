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

      if (error) throw error;

      setSucesso("Login efetuado com sucesso.");

      setTimeout(() => {
        router.push("/aluno/dashboard");
      }, 800);
    } catch (error: any) {
      setErro(error?.message || "Não foi possível iniciar sessão.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card home-card-premium">
        <div className="auth-hero">
          <p className="auth-eyebrow">Área do Aluno</p>

          <h1 className="auth-hero-title">Entrar no teu percurso</h1>

          <div className="auth-hero-divider" aria-hidden="true">
            <span className="line"></span>
            <span className="star">✦</span>
            <span className="line"></span>
          </div>

          <p className="auth-hero-text">
            Acede aos teus cursos, acompanha o teu progresso e organiza o teu
            percurso dentro do Regnum Noctis.
          </p>
        </div>

        {erro && <div className="auth-message auth-error">{erro}</div>}
        {sucesso && <div className="auth-message auth-success">{sucesso}</div>}

        <form onSubmit={handleLogin} className="auth-form">
          <div className="auth-field">
            <label className="auth-label" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="auth-input"
              placeholder="teuemail@exemplo.com"
              autoComplete="email"
            />
          </div>

          <div className="auth-field">
            <label className="auth-label" htmlFor="password">
              Palavra-passe
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="auth-input"
              placeholder="A tua palavra-passe"
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="home-action-button auth-submit"
          >
            {loading ? "A entrar..." : "Entrar"}
          </button>
        </form>

        <div className="auth-footer-link center-title">
          Ainda não tens conta? <a href="/aluno/registo">Criar conta</a>
        </div>
      </section>
    </main>
  );
}