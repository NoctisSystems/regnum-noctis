"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AlunoLoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mostrarPassword, setMostrarPassword] = useState(false);
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
    <main className="auth-page">
      <section className="auth-card home-card-premium">
        <div className="auth-hero">
          <p className="auth-eyebrow">Área do Aluno</p>

          <h1 className="auth-hero-title">Entrar</h1>

          <div className="auth-hero-divider" aria-hidden="true">
            <span className="line"></span>
            <span className="star">✦</span>
            <span className="line"></span>
          </div>

          <p className="auth-hero-text">
            Acede à tua conta para veres os teus cursos e conteúdos.
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
            <div className="auth-label-row">
              <label className="auth-label" htmlFor="password">
                Palavra-passe
              </label>

              <button
                type="button"
                className="auth-password-toggle"
                onClick={() => setMostrarPassword((prev) => !prev)}
              >
                {mostrarPassword ? "Ocultar" : "Mostrar"}
              </button>
            </div>

            <input
              id="password"
              type={mostrarPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="auth-input"
              placeholder="A tua palavra-passe"
              autoComplete="current-password"
            />

            <div className="auth-forgot-wrap">
              <a href="/aluno/recuperar-password" className="auth-forgot-link">
                Esqueci-me da palavra-passe
              </a>
            </div>
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