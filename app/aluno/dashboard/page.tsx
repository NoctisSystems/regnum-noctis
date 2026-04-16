"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type DashboardUser = {
  authId: string;
  email: string;
  nome: string;
  alunoId: number | null;
};

type DashboardTab =
  | "resumo"
  | "meus-cursos"
  | "certificados"
  | "aulas-salvas";

type AlunoRegisto = {
  id: number;
  nome: string | null;
  email: string | null;
  auth_id: string | null;
};

type Inscricao = {
  id: number;
  aluno_id: number;
  curso_id: number;
  status: string | null;
  created_at?: string | null;
  concluido?: boolean | null;
};

type Curso = {
  id: number;
  titulo: string | null;
  descricao: string | null;
  preco: number | null;
  capa_url: string | null;
  tipo_produto: string | null;
  publicado: boolean | null;
  tem_certificado: boolean | null;
  created_at?: string | null;
};

type LinhaCurso = {
  curso: Curso;
  inscricao: Inscricao;
};

export default function AlunoDashboardPage() {
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [user, setUser] = useState<DashboardUser | null>(null);
  const [activeTab, setActiveTab] = useState<DashboardTab>("meus-cursos");
  const [menuAberto, setMenuAberto] = useState(false);
  const [inscricoes, setInscricoes] = useState<Inscricao[]>([]);
  const [cursos, setCursos] = useState<Curso[]>([]);

  useEffect(() => {
    async function verificarSessaoECarregarDados() {
      try {
        setLoading(true);
        setErro("");

        const {
          data: { user: authUser },
          error,
        } = await supabase.auth.getUser();

        if (error) {
          throw error;
        }

        if (!authUser) {
          router.push("/aluno/login");
          return;
        }

        const { data: alunoData, error: alunoError } = await supabase
          .from("alunos")
          .select("id, nome, email, auth_id")
          .eq("auth_id", authUser.id)
          .maybeSingle();

        if (alunoError) {
          throw alunoError;
        }

        const alunoEncontrado = (alunoData as AlunoRegisto | null) || null;

        setUser({
          authId: authUser.id,
          email: authUser.email ?? "",
          nome:
            alunoEncontrado?.nome?.trim() ||
            authUser.user_metadata?.nome ||
            "Aluno",
          alunoId: alunoEncontrado?.id ?? null,
        });

        if (!alunoEncontrado) {
          setInscricoes([]);
          setCursos([]);
          setErro(
            "A tua conta autenticada ainda não está ligada corretamente ao registo de aluno da plataforma."
          );
          return;
        }

        const { data: inscricoesData, error: inscricoesError } = await supabase
          .from("inscricoes")
          .select("id, aluno_id, curso_id, status, created_at, concluido")
          .eq("aluno_id", alunoEncontrado.id)
          .order("id", { ascending: false });

        if (inscricoesError) {
          throw inscricoesError;
        }

        const inscricoesLista = (inscricoesData || []) as Inscricao[];
        setInscricoes(inscricoesLista);

        if (inscricoesLista.length === 0) {
          setCursos([]);
          return;
        }

        const cursoIds = Array.from(
          new Set(inscricoesLista.map((item) => item.curso_id))
        );

        const { data: cursosData, error: cursosError } = await supabase
          .from("cursos")
          .select(
            "id, titulo, descricao, preco, capa_url, tipo_produto, publicado, tem_certificado, created_at"
          )
          .in("id", cursoIds)
          .order("id", { ascending: false });

        if (cursosError) {
          throw cursosError;
        }

        setCursos((cursosData || []) as Curso[]);
      } catch (error: any) {
        setErro(
          error?.message || "Não foi possível carregar a dashboard do aluno."
        );
      } finally {
        setLoading(false);
      }
    }

    verificarSessaoECarregarDados();
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
    if (!user?.nome?.trim()) {
      if (!user?.email) return "Aluno";
      return user.email;
    }

    return user.nome;
  }, [user]);

  const inicial = useMemo(() => {
    if (user?.nome?.trim()) return user.nome.trim().charAt(0).toUpperCase();
    if (user?.email) return user.email.charAt(0).toUpperCase();
    return "A";
  }, [user]);

  const linhasCursos = useMemo<LinhaCurso[]>(() => {
    const mapaCursos = new Map<number, Curso>(
      cursos.map((curso) => [curso.id, curso])
    );

    return inscricoes
      .map((inscricao) => {
        const curso = mapaCursos.get(inscricao.curso_id);

        if (!curso) return null;

        return {
          curso,
          inscricao,
        };
      })
      .filter(Boolean) as LinhaCurso[];
  }, [inscricoes, cursos]);

  const totalCursos = linhasCursos.length;

  const cursosConcluidos = linhasCursos.filter(
    (item) =>
      item.inscricao.concluido === true ||
      (item.inscricao.status || "").trim().toLowerCase() === "concluido"
  ).length;

  const cursosEmProgresso = linhasCursos.filter((item) => {
    const estado = (item.inscricao.status || "").trim().toLowerCase();

    return (
      item.inscricao.concluido !== true &&
      ["ativo", "activa", "em_progresso", "concluido_parcial"].includes(estado)
    );
  }).length;

  const progressoMedio = totalCursos
    ? Math.round((cursosConcluidos / totalCursos) * 100)
    : 0;

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
                te dar uma visão clara do teu percurso, dos teus acessos e da
                tua evolução dentro da plataforma.
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
                A tua área já está ligada aos teus cursos reais
              </h2>

              <p className="home-text">
                Os teus cursos passam agora a ser carregados com base nas
                inscrições reais associadas à tua conta. Podes consultá-los na
                tab “Meus Cursos” ou abrir a listagem completa.
              </p>

              <div className="aluno-dashboard-quick-actions">
                <Link href="/aluno/cursos" className="home-action-button">
                  Ver todos os meus cursos
                </Link>
              </div>
            </article>
          </div>
        )}

        {activeTab === "meus-cursos" && (
          <div className="aluno-dashboard-stack">
            <article className="home-card home-card-premium aluno-dashboard-panel">
              <p className="home-card-kicker">Meus Cursos</p>
              <h2 className="home-section-title">
                {linhasCursos.length === 0
                  ? "Ainda não tens cursos na tua área"
                  : "Os teus cursos"}
              </h2>

              {linhasCursos.length === 0 ? (
                <div className="aluno-dashboard-empty-block">
                  <p className="home-text center-title">
                    Os teus cursos só irão aparecer aqui quando houver compras
                    registadas e associadas à tua conta.
                  </p>

                  <div className="aluno-dashboard-quick-actions">
                    <a href="/cursos" className="home-action-button">
                      Explorar Cursos
                    </a>
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    display: "grid",
                    gap: "16px",
                    marginTop: "8px",
                  }}
                >
                  {linhasCursos.map(({ curso, inscricao }) => (
                    <article
                      key={inscricao.id}
                      style={{
                        border: "1px solid rgba(166,120,61,0.22)",
                        background: "rgba(32,18,13,0.45)",
                        padding: "18px",
                        display: "grid",
                        gap: "14px",
                      }}
                    >
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: curso.capa_url
                            ? "minmax(120px, 180px) minmax(0, 1fr)"
                            : "1fr",
                          gap: "14px",
                          alignItems: "start",
                        }}
                      >
                        {curso.capa_url ? (
                          <div
                            style={{
                              border: "1px solid rgba(166,120,61,0.18)",
                              overflow: "hidden",
                              background: "rgba(20,13,9,0.4)",
                            }}
                          >
                            <img
                              src={curso.capa_url}
                              alt={curso.titulo || "Curso"}
                              style={{
                                width: "100%",
                                aspectRatio: "4 / 3",
                                objectFit: "cover",
                                display: "block",
                              }}
                            />
                          </div>
                        ) : null}

                        <div style={{ display: "grid", gap: "8px" }}>
                          <p
                            style={{
                              margin: 0,
                              fontSize: "13px",
                              color: "#caa15a",
                              letterSpacing: "0.1em",
                              textTransform: "uppercase",
                            }}
                          >
                            {traduzirTipoProduto(curso.tipo_produto)}
                          </p>

                          <h3
                            style={{
                              margin: 0,
                              fontFamily: "Cinzel, serif",
                              fontSize: "clamp(24px, 3vw, 30px)",
                              color: "#f0d79a",
                              lineHeight: 1.2,
                              fontWeight: 500,
                            }}
                          >
                            {curso.titulo || "Curso sem título"}
                          </h3>

                          <p
                            style={{
                              margin: 0,
                              color: "#d7b06c",
                              fontSize: "18px",
                              lineHeight: 1.7,
                            }}
                          >
                            {curso.descricao || "Descrição em atualização."}
                          </p>

                          <div
                            style={{
                              display: "flex",
                              flexWrap: "wrap",
                              gap: "10px",
                              marginTop: "4px",
                            }}
                          >
                            <span style={miniBadge}>
                              Estado: {traduzirEstadoInscricao(inscricao.status)}
                            </span>

                            <span style={miniBadge}>
                              Certificado: {curso.tem_certificado ? "Sim" : "Não"}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div
                        style={{
                          display: "flex",
                          justifyContent: "flex-end",
                          flexWrap: "wrap",
                          gap: "12px",
                        }}
                      >
                        <Link
                          href={`/aluno/cursos/${curso.id}`}
                          className="home-action-button"
                        >
                          Entrar no curso
                        </Link>
                      </div>
                    </article>
                  ))}

                  <div className="aluno-dashboard-quick-actions">
                    <Link href="/aluno/cursos" className="home-action-button">
                      Abrir listagem completa
                    </Link>
                  </div>
                </div>
              )}
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
                Quando os cursos tiverem certificados disponíveis e emitidos,
                esta área permitirá a consulta e o acesso aos documentos
                correspondentes.
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

function traduzirTipoProduto(tipo: string | null) {
  if (tipo === "curso_video") return "Curso em vídeo";
  if (tipo === "pdf_digital") return "PDF digital";
  return "Conteúdo";
}

function traduzirEstadoInscricao(estado: string | null) {
  const valor = (estado || "").trim().toLowerCase();

  if (valor === "ativo" || valor === "activa") return "Ativo";
  if (valor === "concluido") return "Concluído";
  if (valor === "cancelado") return "Cancelado";
  if (valor === "inativo") return "Inativo";

  return "Sem estado";
}

const miniBadge: React.CSSProperties = {
  border: "1px solid rgba(166,120,61,0.28)",
  background: "rgba(20,13,9,0.4)",
  color: "#e6c27a",
  padding: "8px 10px",
  fontSize: "14px",
  lineHeight: 1.4,
};