"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AlunoRegistoPage() {
  const router = useRouter();

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmarPassword, setConfirmarPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  async function handleRegisto(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErro("");
    setSucesso("");

    if (!nome.trim()) {
      setErro("Indica o teu nome.");
      return;
    }

    if (!email.trim()) {
      setErro("Indica o teu email.");
      return;
    }

    if (!password.trim()) {
      setErro("Indica uma palavra-passe.");
      return;
    }

    if (password.length < 6) {
      setErro("A palavra-passe deve ter pelo menos 6 caracteres.");
      return;
    }

    if (password !== confirmarPassword) {
      setErro("As palavras-passe não coincidem.");
      return;
    }

    try {
      setLoading(true);

      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            nome: nome.trim(),
            tipo: "aluno",
          },
        },
      });

      if (error) {
        throw error;
      }

      if (data.user) {
        const { error: insertError } = await supabase.from("alunos").upsert([
          {
            id: data.user.id,
            nome: nome.trim(),
            email: email.trim(),
            created_at: new Date().toISOString(),
          },
        ]);

        if (insertError) {
          throw insertError;
        }
      }

      setSucesso("Conta criada com sucesso.");

      setNome("");
      setEmail("");
      setPassword("");
      setConfirmarPassword("");

      setTimeout(() => {
        router.push("/aluno/login");
      }, 1200);
    } catch (error: any) {
      setErro(error?.message || "Não foi possível criar a conta.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card home-card-premium">
        <p className="home-card-kicker">Área do Aluno</p>
        <h1 className="home-section-title auth-title">Criar conta</h1>

        <p className="home-text auth-text">
          Regista-te para poderes comprar cursos, acompanhar o teu progresso e
          aceder ao teu percurso na plataforma.
        </p>

        {erro && <div className="auth-message auth-error">{erro}</div>}
        {sucesso && <div className="auth-message auth-success">{sucesso}</div>}

        <form onSubmit={handleRegisto} className="auth-form">
          <div className="auth-field">
            <label className="auth-label">Nome</label>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="auth-input"
              placeholder="O teu nome"
            />
          </div>

          <div className="auth-field">
            <label className="auth-label">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="auth-input"
              placeholder="teuemail@exemplo.com"
            />
          </div>

          <div className="auth-field">
            <label className="auth-label">Palavra-passe</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="auth-input"
              placeholder="Escolhe uma palavra-passe"
            />
          </div>

          <div className="auth-field">
            <label className="auth-label">Confirmar palavra-passe</label>
            <input
              type="password"
              value={confirmarPassword}
              onChange={(e) => setConfirmarPassword(e.target.value)}
              className="auth-input"
              placeholder="Repete a palavra-passe"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="home-action-button auth-submit"
          >
            {loading ? "A criar conta..." : "Criar conta"}
          </button>
        </form>

        <div className="auth-footer-link">
          Já tens conta? <a href="/aluno/login">Entrar</a>
        </div>
      </section>
    </main>
  );
}