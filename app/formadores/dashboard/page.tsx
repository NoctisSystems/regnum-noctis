"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type Formador = {
  id: number;
  nome: string | null;
  email: string | null;
  auth_id: string | null;
  status: string | null;
};

type Curso = {
  id: number;
  titulo: string | null;
  publicado: boolean | null;
};

type Inscricao = {
  id: number;
  curso_id: number;
  aluno_id: number;
  concluido: boolean | null;
};

type Comunidade = {
  id: number;
  curso_id: number;
};

type Topico = {
  id: number;
  comunidade_id: number;
  fechado: boolean | null;
};

export default function DashboardFormadorPage() {
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [formador, setFormador] = useState<Formador | null>(null);
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [inscricoes, setInscricoes] = useState<Inscricao[]>([]);
  const [comunidades, setComunidades] = useState<Comunidade[]>([]);
  const [topicos, setTopicos] = useState<Topico[]>([]);

  useEffect(() => {
    carregarDados();
  }, []);

  async function encontrarFormadorComRecuperacao(
    userId: string,
    userEmail: string | null | undefined
  ) {
    const { data: porAuthId } = await supabase
      .from("formadores")
      .select("id, nome, email, auth_id, status")
      .eq("auth_id", userId)
      .maybeSingle();

    if (porAuthId) {
      return porAuthId as Formador;
    }

    if (!userEmail) {
      return null;
    }

    const { data: porEmail } = await supabase
      .from("formadores")
      .select("id, nome, email, auth_id, status")
      .eq("email", userEmail)
      .maybeSingle();

    if (!porEmail) {
      return null;
    }

    if (!porEmail.auth_id) {
      const { error: updateError } = await supabase
        .from("formadores")
        .update({ auth_id: userId })
        .eq("id", porEmail.id);

      if (!updateError) {
        return {
          ...(porEmail as Formador),
          auth_id: userId,
        };
      }
    }

    return porEmail as Formador;
  }

  async function carregarDados() {
    setLoading(true);
    setErro("");

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setErro("Não foi possível validar a sessão do formador.");
        setLoading(false);
        return;
      }

      const formadorData = await encontrarFormadorComRecuperacao(
        user.id,
        user.email
      );

      if (!formadorData) {
        setErro(
          "Não foi possível encontrar o registo do formador. O login está válido, mas o registo da tabela formadores ainda não ficou corretamente ligado a esta conta."
        );
        setLoading(false);
        return;
      }

      if (formadorData.status !== "aprovado") {
        setErro("A conta de formador ainda não está aprovada.");
        setLoading(false);
        return;
      }

      setFormador(formadorData);

      const { data: cursosData, error: cursosError } = await supabase
        .from("cursos")
        .select("id, titulo, publicado")
        .eq("formador_id", formadorData.id)
        .order("id", { ascending: false });

      if (cursosError) {
        setErro(cursosError.message || "Erro ao carregar cursos.");
        setLoading(false);
        return;
      }

      const cursosLista = (cursosData || []) as Curso[];
      setCursos(cursosLista);

      if (cursosLista.length === 0) {
        setInscricoes([]);
        setComunidades([]);
        setTopicos([]);
        setLoading(false);
        return;
      }

      const cursoIds = cursosLista.map((curso) => curso.id);

      const { data: inscricoesData } = await supabase
        .from("inscricoes")
        .select("id, curso_id, aluno_id, concluido")
        .in("curso_id", cursoIds);

      setInscricoes((inscricoesData || []) as Inscricao[]);

      const { data: comunidadesData } = await supabase
        .from("comunidades")
        .select("id, curso_id")
        .in("curso_id", cursoIds);

      const comunidadesLista = (comunidadesData || []) as Comunidade[];
      setComunidades(comunidadesLista);

      if (comunidadesLista.length > 0) {
        const comunidadeIds = comunidadesLista.map((comunidade) => comunidade.id);

        const { data: topicosData } = await supabase
          .from("comunidade_topicos")
          .select("id, comunidade_id, fechado")
          .in("comunidade_id", comunidadeIds);

        setTopicos((topicosData || []) as Topico[]);
      } else {
        setTopicos([]);
      }
    } catch {
      setErro("Ocorreu um erro inesperado ao carregar a dashboard.");
    } finally {
      setLoading(false);
    }
  }

  const totalCursos = cursos.length;
  const totalAlunos = useMemo(
    () => new Set(inscricoes.map((i) => i.aluno_id)).size,
    [inscricoes]
  );
  const totalComunidades = comunidades.length;
  const totalDuvidasPendentes = topicos.filter((topico) => !topico.fechado).length;
  const cursoMaisRecente = cursos[0] || null;

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top, rgba(166,120,61,0.08), transparent 20%), #2b160f",
        color: "#e6c27a",
        fontFamily: "Cormorant Garamond, serif",
        padding: "50px 20px 90px",
      }}
    >
      <section
        style={{
          maxWidth: "1280px",
          margin: "0 auto",
        }}
      >
        <header style={{ marginBottom: "34px" }}>
          <p
            style={{
              margin: "0 0 10px 0",
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: "#caa15a",
              fontSize: "15px",
            }}
          >
            Área do Formador
          </p>

          <h1
            style={{
              margin: "0 0 14px 0",
              fontFamily: "Cinzel, serif",
              fontSize: "clamp(42px, 6vw, 64px)",
              lineHeight: 1.1,
              color: "#f0d79a",
              fontWeight: 500,
            }}
          >
            Dashboard do Formador
          </h1>

          <p
            style={{
              margin: 0,
              fontSize: "24px",
              lineHeight: 1.7,
              color: "#d7b06c",
              maxWidth: "980px",
            }}
          >
            {formador?.nome
              ? `Bem-vinda à tua área, ${formador.nome}. Gere os teus cursos, acompanha os alunos inscritos e responde às dúvidas das tuas turmas através das comunidades internas da plataforma.`
              : "Gere os teus cursos, acompanha os alunos inscritos e responde às dúvidas das tuas turmas através das comunidades internas da plataforma."}
          </p>
        </header>

        {loading ? (
          <LoadingBox />
        ) : erro ? (
          <ErrorBox texto={erro} />
        ) : (
          <>
            <section
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: "18px",
                marginBottom: "36px",
              }}
            >
              <MetricCard titulo="Cursos" valor={String(totalCursos)} subtitulo="Cursos criados" />
              <MetricCard titulo="Alunos" valor={String(totalAlunos)} subtitulo="Inscritos ativos" />
              <MetricCard titulo="Comunidades" valor={String(totalComunidades)} subtitulo="Por curso" />
              <MetricCard titulo="Dúvidas" valor={String(totalDuvidasPendentes)} subtitulo="Tópicos abertos" />
            </section>

            <section
              style={{
                border: "1px solid #8a5d31",
                background:
                  "linear-gradient(180deg, rgba(20,13,9,0.98) 0%, rgba(16,10,8,0.98) 100%)",
                padding: "30px",
                boxShadow:
                  "0 18px 42px rgba(0,0,0,0.24), inset 0 1px 0 rgba(255,225,170,0.03)",
                marginBottom: "34px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-end",
                  gap: "20px",
                  flexWrap: "wrap",
                  marginBottom: "22px",
                }}
              >
                <div>
                  <p
                    style={{
                      margin: "0 0 8px 0",
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                      color: "#caa15a",
                      fontSize: "14px",
                    }}
                  >
                    Atalhos principais
                  </p>

                  <h2
                    style={{
                      margin: 0,
                      fontFamily: "Cinzel, serif",
                      fontSize: "clamp(28px, 4vw, 40px)",
                      color: "#f0d79a",
                      fontWeight: 500,
                    }}
                  >
                    Gestão rápida
                  </h2>
                </div>

                <button type="button" onClick={carregarDados} style={botaoSecundario}>
                  Atualizar dashboard
                </button>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                  gap: "18px",
                }}
              >
                <ShortcutCard
                  titulo="Criar curso"
                  descricao="Cria um novo curso e começa a estruturar módulos, aulas e materiais."
                  href="/formadores/criar-curso"
                  textoBotao="Abrir"
                />
                <ShortcutCard
                  titulo="Os meus cursos"
                  descricao="Consulta os teus cursos, edita conteúdos e acompanha a estrutura de cada formação."
                  href="/formadores/cursos"
                  textoBotao="Ver cursos"
                />
                <ShortcutCard
                  titulo="Alunos inscritos"
                  descricao="Acompanha quem comprou os teus cursos e consulta o progresso dos alunos."
                  href="/formadores/alunos"
                  textoBotao="Ver alunos"
                />
                <ShortcutCard
                  titulo="Comunidades"
                  descricao="Entra nas comunidades internas dos teus cursos e responde às dúvidas das turmas."
                  href="/formadores/comunidades"
                  textoBotao="Abrir comunidades"
                />
              </div>
            </section>

            <section
              style={{
                display: "grid",
                gridTemplateColumns: "1.2fr 0.8fr",
                gap: "24px",
                alignItems: "start",
              }}
            >
              <div style={{ display: "grid", gap: "24px" }}>
                <Panel>
                  <SectionHeader
                    subtitulo="Cursos"
                    titulo="Os teus cursos"
                    acaoTexto="Gerir cursos"
                    acaoHref="/formadores/cursos"
                  />

                  {cursoMaisRecente ? (
                    <InfoBox
                      titulo={cursoMaisRecente.titulo || "Curso sem título"}
                      descricao={
                        cursoMaisRecente.publicado
                          ? "Este é o curso mais recente já publicado na tua área."
                          : "Este é o curso mais recente e ainda está em rascunho."
                      }
                    />
                  ) : (
                    <EmptyState
                      titulo="Ainda não tens cursos criados"
                      descricao="Quando criares o teu primeiro curso, ele será apresentado aqui com acesso direto à edição, módulos, aulas e alunos inscritos."
                      botaoTexto="Criar primeiro curso"
                      botaoHref="/formadores/criar-curso"
                    />
                  )}
                </Panel>

                <Panel>
                  <SectionHeader
                    subtitulo="Comunidades"
                    titulo="Comunidades dos cursos"
                    acaoTexto="Ver todas"
                    acaoHref="/formadores/comunidades"
                  />

                  <div
                    style={{
                      border: "1px solid rgba(166,120,61,0.22)",
                      background: "rgba(32,18,13,0.45)",
                      padding: "22px",
                    }}
                  >
                    <p
                      style={{
                        margin: "0 0 14px 0",
                        fontSize: "22px",
                        color: "#e6c27a",
                        lineHeight: 1.6,
                      }}
                    >
                      Cada curso pode ter uma comunidade própria, acessível automaticamente aos alunos inscritos.
                    </p>

                    <p
                      style={{
                        margin: 0,
                        fontSize: "20px",
                        color: "#d7b06c",
                        lineHeight: 1.7,
                      }}
                    >
                      Isto permite responder a dúvidas, publicar avisos, orientar exercícios e manter a turma organizada dentro da própria plataforma, sem depender de aplicações externas.
                    </p>
                  </div>
                </Panel>
              </div>

              <div style={{ display: "grid", gap: "24px" }}>
                <Panel>
                  <SectionHeader
                    subtitulo="Alunos"
                    titulo="Inscritos e progresso"
                    acaoTexto="Abrir área"
                    acaoHref="/formadores/alunos"
                  />

                  <InfoBox
                    titulo="Acompanhamento da turma"
                    descricao="Aqui podes acompanhar os alunos inscritos em cada curso, verificar progresso, acessos e participação nas comunidades."
                  />
                </Panel>

                <Panel>
                  <SectionHeader subtitulo="Planeamento" titulo="Próximos passos" />

                  <ChecklistItem texto="Criar ou atualizar cursos" />
                  <ChecklistItem texto="Publicar módulos e aulas" />
                  <ChecklistItem texto="Acompanhar alunos inscritos" />
                  <ChecklistItem texto="Responder dúvidas por comunidade de curso" />
                </Panel>
              </div>
            </section>
          </>
        )}
      </section>
    </main>
  );
}

function MetricCard({
  titulo,
  valor,
  subtitulo,
}: {
  titulo: string;
  valor: string;
  subtitulo: string;
}) {
  return (
    <article
      style={{
        border: "1px solid #8a5d31",
        background:
          "linear-gradient(180deg, rgba(20,13,9,0.98) 0%, rgba(16,10,8,0.98) 100%)",
        padding: "22px",
        boxShadow:
          "0 12px 26px rgba(0,0,0,0.16), inset 0 1px 0 rgba(255,225,170,0.03)",
      }}
    >
      <p
        style={{
          margin: "0 0 10px 0",
          fontSize: "15px",
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: "#caa15a",
        }}
      >
        {titulo}
      </p>

      <p
        style={{
          margin: "0 0 8px 0",
          fontFamily: "Cinzel, serif",
          fontSize: "44px",
          color: "#f0d79a",
          lineHeight: 1,
        }}
      >
        {valor}
      </p>

      <p
        style={{
          margin: 0,
          fontSize: "19px",
          color: "#d7b06c",
          lineHeight: 1.6,
        }}
      >
        {subtitulo}
      </p>
    </article>
  );
}

function ShortcutCard({
  titulo,
  descricao,
  href,
  textoBotao,
}: {
  titulo: string;
  descricao: string;
  href: string;
  textoBotao: string;
}) {
  return (
    <article
      style={{
        border: "1px solid rgba(166,120,61,0.22)",
        background: "rgba(32,18,13,0.45)",
        padding: "22px",
        minHeight: "220px",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <h3
        style={{
          margin: "0 0 12px 0",
          fontFamily: "Cinzel, serif",
          fontSize: "28px",
          color: "#e6c27a",
          fontWeight: 500,
        }}
      >
        {titulo}
      </h3>

      <p
        style={{
          margin: "0 0 20px 0",
          fontSize: "20px",
          color: "#d7b06c",
          lineHeight: 1.7,
          flex: 1,
        }}
      >
        {descricao}
      </p>

      <Link href={href} style={botao}>
        {textoBotao}
      </Link>
    </article>
  );
}

function Panel({ children }: { children: React.ReactNode }) {
  return (
    <section
      style={{
        border: "1px solid #8a5d31",
        background:
          "linear-gradient(180deg, rgba(20,13,9,0.98) 0%, rgba(16,10,8,0.98) 100%)",
        padding: "28px",
        boxShadow:
          "0 12px 26px rgba(0,0,0,0.16), inset 0 1px 0 rgba(255,225,170,0.03)",
      }}
    >
      {children}
    </section>
  );
}

function SectionHeader({
  subtitulo,
  titulo,
  acaoTexto,
  acaoHref,
}: {
  subtitulo: string;
  titulo: string;
  acaoTexto?: string;
  acaoHref?: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-end",
        gap: "18px",
        flexWrap: "wrap",
        marginBottom: "20px",
      }}
    >
      <div>
        <p
          style={{
            margin: "0 0 8px 0",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "#caa15a",
            fontSize: "14px",
          }}
        >
          {subtitulo}
        </p>

        <h2
          style={{
            margin: 0,
            fontFamily: "Cinzel, serif",
            fontSize: "clamp(26px, 4vw, 36px)",
            color: "#f0d79a",
            fontWeight: 500,
          }}
        >
          {titulo}
        </h2>
      </div>

      {acaoTexto && acaoHref ? (
        <Link href={acaoHref} style={botaoSecundario}>
          {acaoTexto}
        </Link>
      ) : null}
    </div>
  );
}

function EmptyState({
  titulo,
  descricao,
  botaoTexto,
  botaoHref,
}: {
  titulo: string;
  descricao: string;
  botaoTexto: string;
  botaoHref: string;
}) {
  return (
    <div
      style={{
        border: "1px solid rgba(166,120,61,0.22)",
        background: "rgba(32,18,13,0.45)",
        padding: "24px",
      }}
    >
      <h3
        style={{
          margin: "0 0 12px 0",
          fontFamily: "Cinzel, serif",
          fontSize: "30px",
          color: "#e6c27a",
          fontWeight: 500,
        }}
      >
        {titulo}
      </h3>

      <p
        style={{
          margin: "0 0 18px 0",
          fontSize: "21px",
          color: "#d7b06c",
          lineHeight: 1.7,
        }}
      >
        {descricao}
      </p>

      <Link href={botaoHref} style={botao}>
        {botaoTexto}
      </Link>
    </div>
  );
}

function InfoBox({
  titulo,
  descricao,
}: {
  titulo: string;
  descricao: string;
}) {
  return (
    <div
      style={{
        border: "1px solid rgba(166,120,61,0.22)",
        background: "rgba(32,18,13,0.45)",
        padding: "22px",
      }}
    >
      <h3
        style={{
          margin: "0 0 12px 0",
          fontFamily: "Cinzel, serif",
          fontSize: "28px",
          color: "#e6c27a",
          fontWeight: 500,
        }}
      >
        {titulo}
      </h3>

      <p
        style={{
          margin: 0,
          fontSize: "20px",
          color: "#d7b06c",
          lineHeight: 1.7,
        }}
      >
        {descricao}
      </p>
    </div>
  );
}

function ChecklistItem({ texto }: { texto: string }) {
  return (
    <div
      style={{
        border: "1px solid rgba(166,120,61,0.18)",
        background: "rgba(32,18,13,0.35)",
        padding: "16px 18px",
        marginBottom: "12px",
      }}
    >
      <p
        style={{
          margin: 0,
          fontSize: "20px",
          color: "#d7b06c",
          lineHeight: 1.6,
        }}
      >
        {texto}
      </p>
    </div>
  );
}

function LoadingBox() {
  return (
    <section
      style={{
        border: "1px solid rgba(166,120,61,0.7)",
        background:
          "linear-gradient(180deg, rgba(15,9,7,0.96) 0%, rgba(28,16,12,0.98) 100%)",
        padding: "30px",
        boxShadow:
          "0 16px 40px rgba(0,0,0,0.26), inset 0 1px 0 rgba(255,225,170,0.04)",
      }}
    >
      <h2
        style={{
          fontFamily: "Cinzel, serif",
          fontSize: "34px",
          margin: "0 0 18px 0",
          color: "#f0d79a",
          fontWeight: 500,
        }}
      >
        A carregar dashboard
      </h2>

      <p
        style={{
          margin: 0,
          fontSize: "22px",
          lineHeight: 1.7,
          color: "#dfbe81",
        }}
      >
        A plataforma está a reunir cursos, alunos e comunidades do formador.
      </p>
    </section>
  );
}

function ErrorBox({ texto }: { texto: string }) {
  return (
    <section
      style={{
        border: "1px solid rgba(255,107,107,0.35)",
        background: "rgba(120,20,20,0.12)",
        padding: "24px",
        color: "#ffb4b4",
        fontSize: "20px",
        lineHeight: 1.7,
      }}
    >
      {texto}
    </section>
  );
}

const botao: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  textDecoration: "none",
  border: "1px solid #a6783d",
  color: "#e6c27a",
  padding: "14px 18px",
  fontSize: "18px",
  background: "transparent",
};

const botaoSecundario: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  textDecoration: "none",
  border: "1px solid rgba(166,120,61,0.6)",
  color: "#e6c27a",
  padding: "12px 16px",
  fontSize: "16px",
  background: "rgba(32,18,13,0.55)",
  cursor: "pointer",
};