"use client";

import { FormEvent, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function RecuperarPasswordAlunoPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  async function handleRecuperarPassword(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErro("");
    setSucesso("");

    if (!email.trim()) {
      setErro("Indica o teu email.");
      return;
    }

    try {
      setLoading(true);

      const { error } = await supabase.auth.resetPasswordForEmail(
        email.trim(),
        {
          redirectTo: `${window.location.origin}/aluno/login`,
        }
      );

      if (error) {
        throw error;
      }

      setSucesso(
        "Se o email existir na plataforma, foi enviado um link para redefinires a tua palavra-passe."
      );
    } catch (error: any) {
      setErro(
        error?.message ||
          "Não foi possível iniciar a recuperação da palavra-passe."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card home-card-premium">
        <div className="auth-hero">
          <p className="auth-eyebrow">Área do Aluno</p>

          <h1 className="auth-hero-title">Recuperar palavra-passe</h1>

          <div className="auth-hero-divider" aria-hidden="true">
            <span className="line"></span>
            <span className="star">✦</span>
            <span className="line"></span>
          </div>

          <p className="auth-hero-text">
            Introduz o teu email para receberes o link de recuperação da tua
            conta.
          </p>
        </div>

        {erro && <div className="auth-message auth-error">{erro}</div>}
        {sucesso && <div className="auth-message auth-success">{sucesso}</div>}

        <form onSubmit={handleRecuperarPassword} className="auth-form">
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

          <button
            type="submit"
            disabled={loading}
            className="home-action-button auth-submit"
          >
            {loading ? "A enviar..." : "Enviar link de recuperação"}
          </button>
        </form>

        <div className="auth-footer-link center-title">
          Já te lembras da palavra-passe? <a href="/aluno/login">Entrar</a>
        </div>
      </section>
    </main>
  );
}