"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type DashboardUser = {
  id: string;
  email: string;
};

type DashboardTab =
  | "resumo"
  | "meus-cursos"
  | "certificados"
  | "aulas-salvas";

export default function AlunoDashboardPage() {
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [user, setUser] = useState<DashboardUser | null>(null);
  const [activeTab, setActiveTab] = useState<DashboardTab>("meus-cursos");
  const [menuAberto, setMenuAberto] = useState(false);

  useEffect(() => {
    async function verificarSessao() {
      try {
        setLoading(true);
        setErro("");

        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();

        if (error) {
          throw error;
        }

        if (!user) {
          router.push("/aluno/login");
          return;
        }

        setUser({
          id: user.id,
          email: user.email ?? "",
        });
      } catch (error: any) {
        setErro(
          error?.message || "Não foi possível carregar a dashboard do aluno."
        );
      } finally {
        setLoading(false);
      }
    }

    verificarSessao();
  }, [router]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setMenuAberto(false);
      }
    }

    if (menuAberto) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuAberto]);

  async function terminarSessao() {
    await supabase.auth.signOut();
    router.push("/aluno/login");
  }

  const nomeApresentacao = useMemo(() => {
    if (!user?.email) return "Aluno";
    return user.email;
  }, [user]);

  const inicial = useMemo(() => {
    if (!user?.email) return "A";
    return user.email.charAt(0).toUpperCase();
  }, [user]);

  const totalCursos = 0;
  const cursosConcluidos = 0;
  const cursosEmProgresso = 0;
  const progressoMedio = 0;

  if (loading) {
    return (
      <main className="aluno-dashboard-page">
        <section className="aluno-dashboard-shell">
          <article className="home-card home-card-premium aluno-dashboard-loading-card">
            <p className="home-card-kicker center-title">Área do Aluno</p>
            <h1 className="home-section-title center-title">
              A carregar a tua dashboard...
            </h1>
            <p className="home-text center-title">
              Estamos a preparar o teu espaço dentro do Regnum Noctis.
            </p>
          </article>
        </section>
      </main>
    );
  }

  return (
    <main className="aluno-dashboard-page">
      <section className="aluno-dashboard-shell">
        <div className="aluno-dashboard-topbar">
          <div className="aluno-dashboard-tabs">
            <button
              className={`aluno-dashboard-tab ${
                activeTab === "resumo" ? "active" : ""
              }`}
              onClick={() => setActiveTab("resumo")}
              type="button"
            >
              Resumo
            </button>

            <button
              className={`aluno-dashboard-tab ${
                activeTab === "meus-cursos" ? "active" : ""
              }`}
              onClick={() => setActiveTab("meus-cursos")}
              type="button"
            >
              Meus Cursos
            </button>

            <button
              className={`aluno-dashboard-tab ${
                activeTab === "certificados" ? "active" : ""
              }`}
              onClick={() => setActiveTab("certificados")}
              type="button"
            >
              Certificados
            </button>

            <button
              className={`aluno-dashboard-tab ${
                activeTab === "aulas-salvas" ? "active" : ""
              }`}
              onClick={() => setActiveTab("aulas-salvas")}
              type="button"
            >
              Aulas Salvas
            </button>
          </div>

          <div className="aluno-dashboard-profile" ref={dropdownRef}>
            <button
              type="button"
              className="aluno-dashboard-hamburger"
              onClick={() => setMenuAberto((prev) => !prev)}
              aria-label="Abrir menu do aluno"
            >
              <span />
              <span />
              <span />
            </button>

            <button
              type="button"
              className="aluno-dashboard-avatar-button"
              onClick={() => setMenuAberto((prev) => !prev)}
              aria-label="Abrir perfil do aluno"
            >
              <span className="aluno-dashboard-avatar">{inicial}</span>
            </button>

            {menuAberto && (
              <div className="aluno-dashboard-dropdown">
                <div className="aluno-dashboard-dropdown-email">
                  {nomeApresentacao}
                </div>

                <button
                  type="button"
                  className={`aluno-dashboard-dropdown-link ${
                    activeTab === "resumo" ? "active" : ""
                  }`}
                  onClick={() => {
                    setActiveTab("resumo");
                    setMenuAberto(false);
                  }}
                >
                  <span className="aluno-dashboard-dropdown-icon">◈</span>
                  <span>Resumo</span>
                </button>

                <button
                  type="button"
                  className={`aluno-dashboard-dropdown-link ${
                    activeTab === "meus-cursos" ? "active" : ""
                  }`}
                  onClick={() => {
                    setActiveTab("meus-cursos");
                    setMenuAberto(false);
                  }}
                >
                  <span className="aluno-dashboard-dropdown-icon">▣</span>
                  <span>Meus cursos</span>
                </button>

                <button
                  type="button"
                  className={`aluno-dashboard-dropdown-link ${
                    activeTab === "certificados" ? "active" : ""
                  }`}
                  onClick={() => {
                    setActiveTab("certificados");
                    setMenuAberto(false);
                  }}
                >
                  <span className="aluno-dashboard-dropdown-icon">◉</span>
                  <span>Certificados</span>
                </button>

                <button
                  type="button"
                  className={`aluno-dashboard-dropdown-link ${
                    activeTab === "aulas-salvas" ? "active" : ""
                  }`}
                  onClick={() => {
                    setActiveTab("aulas-salvas");
                    setMenuAberto(false);
                  }}
                >
                  <span className="aluno-dashboard-dropdown-icon">◆</span>
                  <span>Aulas salvas</span>
                </button>

                <button
                  type="button"
                  className="aluno-dashboard-dropdown-link danger"
                  onClick={terminarSessao}
                >
                  <span className="aluno-dashboard-dropdown-icon">↪</span>
                  <span>Sair</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {erro ? (
          <article className="home-card home-card-premium aluno-dashboard-panel">
            <p className="home-card-kicker center-title">Erro</p>
            <h2 className="home-section-title center-title">
              Não foi possível carregar a tua área
            </h2>
            <p className="home-text center-title">{erro}</p>
          </article>
        ) : null}

        {activeTab === "resumo" && (
          <div className="aluno-dashboard-stack">
            <article className="home-card home-card-premium aluno-dashboard-panel">
              <p className="home-card-kicker">Resumo</p>
              <h1 className="home-section-title aluno-dashboard-main-title">
                O teu percurso no Regnum Noctis
              </h1>

              <p className="home-text aluno-dashboard-main-text">
                Bem-vinda, {nomeApresentacao}. Esta dashboard foi organizada para
                te dar uma visão clara do teu percurso, dos teus acessos e da tua
                evolução dentro da plataforma.
              </p>

              <div className="aluno-dashboard-stats-grid">
                <div className="aluno-dashboard-stat-box">
                  <span className="aluno-dashboard-stat-number">
                    {totalCursos}
                  </span>
                  <span className="aluno-dashboard-stat-label">
                    Cursos ativos
                  </span>
                </div>

                <div className="aluno-dashboard-stat-box">
                  <span className="aluno-dashboard-stat-number">
                    {progressoMedio}%
                  </span>
                  <span className="aluno-dashboard-stat-label">
                    Progresso médio
                  </span>
                </div>

                <div className="aluno-dashboard-stat-box">
                  <span className="aluno-dashboard-stat-number">
                    {cursosConcluidos}
                  </span>
                  <span className="aluno-dashboard-stat-label">
                    Cursos concluídos
                  </span>
                </div>
              </div>
            </article>

            <article className="home-card home-card-premium aluno-dashboard-panel">
              <p className="home-card-kicker">Estado atual</p>
              <h2 className="home-section-title">
                A tua área está pronta para receber os teus cursos
              </h2>

              <p className="home-text">
                À medida que os teus cursos forem comprados e associados à tua
                conta, os respetivos acessos passarão a surgir automaticamente na
                tab “Meus Cursos”.
              </p>

              <div className="aluno-dashboard-quick-actions">
                <a href="/cursos" className="home-action-button">
                  Explorar Cursos
                </a>
              </div>
            </article>
          </div>
        )}

        {activeTab === "meus-cursos" && (
          <div className="aluno-dashboard-stack">
            <article className="home-card home-card-premium aluno-dashboard-panel">
              <p className="home-card-kicker">Meus Cursos</p>
              <h2 className="home-section-title">
                Ainda não tens cursos na tua área
              </h2>

              <div className="aluno-dashboard-empty-block">
                <p className="home-text center-title">
                  Os teus cursos só irão aparecer aqui quando houver compras
                  registadas e associadas à tua conta.
                </p>

                <p className="home-text center-title">
                  Quando isso acontecer, os cards serão gerados automaticamente
                  com base nos cursos reais do aluno, mostrando o progresso, os
                  acessos e as informações relevantes de cada curso.
                </p>

                <div className="aluno-dashboard-quick-actions">
                  <a href="/cursos" className="home-action-button">
                    Explorar Cursos
                  </a>
                </div>
              </div>
            </article>
          </div>
        )}

        {activeTab === "certificados" && (
          <div className="aluno-dashboard-stack">
            <article className="home-card home-card-premium aluno-dashboard-panel">
              <p className="home-card-kicker">Certificados</p>
              <h2 className="home-section-title">
                Os teus certificados aparecerão aqui
              </h2>

              <p className="home-text">
                Quando os cursos tiverem certificados disponíveis, esta área
                permitirá a consulta e o acesso aos documentos correspondentes.
              </p>
            </article>
          </div>
        )}

        {activeTab === "aulas-salvas" && (
          <div className="aluno-dashboard-stack">
            <article className="home-card home-card-premium aluno-dashboard-panel">
              <p className="home-card-kicker">Aulas Salvas</p>
              <h2 className="home-section-title">
                Conteúdos guardados para continuar depois
              </h2>

              <p className="home-text">
                Aqui poderás reunir aulas marcadas, pontos de continuação e
                conteúdos guardados para retomares o estudo quando quiseres.
              </p>
            </article>
          </div>
        )}
      </section>
    </main>
  );
}