"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

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
  created_at: string | null;
  concluido: boolean | null;
  estado_acesso?: string | null;
  prazo_legal_ate?: string | null;
  renunciou_14_dias?: boolean | null;
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
  created_at: string | null;
  edicao_limitada?: boolean | null;
  limite_vagas?: number | null;
};

type LinhaCurso = {
  curso: Curso;
  inscricao: Inscricao;
};

export default function AlunoCursosPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [aluno, setAluno] = useState<AlunoRegisto | null>(null);
  const [inscricoes, setInscricoes] = useState<Inscricao[]>([]);
  const [cursos, setCursos] = useState<Curso[]>([]);

  useEffect(() => {
    carregarDados();
  }, []);

  async function carregarDados() {
    try {
      setLoading(true);
      setErro("");

      const {
        data: { user: authUser },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) {
        throw authError;
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

      if (!alunoEncontrado) {
        setAluno(null);
        setInscricoes([]);
        setCursos([]);
        setErro(
          "A tua conta autenticada ainda não está ligada corretamente ao registo de aluno da plataforma."
        );
        return;
      }

      setAluno(alunoEncontrado);

      const { data: inscricoesData, error: inscricoesError } = await supabase
        .from("inscricoes")
        .select(
          "id, aluno_id, curso_id, status, created_at, concluido, estado_acesso, prazo_legal_ate, renunciou_14_dias"
        )
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
          "id, titulo, descricao, preco, capa_url, tipo_produto, publicado, tem_certificado, created_at, edicao_limitada, limite_vagas"
        )
        .in("id", cursoIds)
        .order("id", { ascending: false });

      if (cursosError) {
        throw cursosError;
      }

      setCursos((cursosData || []) as Curso[]);
    } catch (error: any) {
      setErro(
        error?.message || "Não foi possível carregar os teus cursos."
      );
    } finally {
      setLoading(false);
    }
  }

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
  }, [cursos, inscricoes]);

  const totalCursos = linhasCursos.length;

  const totalConcluidos = linhasCursos.filter(
    (item) =>
      item.inscricao.concluido === true ||
      normalizarEstado(item.inscricao.status) === "concluido"
  ).length;

  const totalEmProgresso = linhasCursos.filter((item) => {
    const estado = normalizarEstado(item.inscricao.status);

    return (
      item.inscricao.concluido !== true &&
      ["ativo", "activa", "em_progresso", "concluido_parcial"].includes(estado)
    );
  }).length;

  if (loading) {
    return (
      <main
        style={{
          minHeight: "100vh",
          background:
            "radial-gradient(circle at top, rgba(166,120,61,0.08), transparent 20%), #2b160f",
          color: "#e6c27a",
          fontFamily: "Cormorant Garamond, serif",
          padding: "48px 16px 90px",
        }}
      >
        <section style={{ maxWidth: "1280px", margin: "0 auto" }}>
          <EstadoBox texto="A carregar os teus cursos..." />
        </section>
      </main>
    );
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top, rgba(166,120,61,0.08), transparent 20%), #2b160f",
        color: "#e6c27a",
        fontFamily: "Cormorant Garamond, serif",
        padding: "48px 16px 90px",
      }}
    >
      <section
        style={{
          maxWidth: "1280px",
          margin: "0 auto",
          display: "grid",
          gap: "24px",
        }}
      >
        <header style={{ display: "grid", gap: "10px" }}>
          <p
            style={{
              margin: 0,
              fontSize: "14px",
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: "#caa15a",
            }}
          >
            Área do Aluno
          </p>

          <h1
            style={{
              margin: 0,
              fontFamily: "Cinzel, serif",
              fontSize: "clamp(34px, 6vw, 60px)",
              lineHeight: 1.1,
              color: "#f0d79a",
              fontWeight: 500,
            }}
          >
            Meus Cursos
          </h1>

          <p
            style={{
              margin: 0,
              fontSize: "clamp(18px, 2.3vw, 24px)",
              lineHeight: 1.7,
              color: "#d7b06c",
              maxWidth: "940px",
            }}
          >
            Consulta os cursos associados à tua conta e entra diretamente em
            cada percurso.
          </p>
        </header>

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "18px",
          }}
        >
          <MetricCard
            titulo="Cursos"
            valor={String(totalCursos)}
            subtitulo="Na tua área"
          />
          <MetricCard
            titulo="Em progresso"
            valor={String(totalEmProgresso)}
            subtitulo="Ativos"
          />
          <MetricCard
            titulo="Concluídos"
            valor={String(totalConcluidos)}
            subtitulo="Finalizados"
          />
        </section>

        {erro ? <ErroBox texto={erro} /> : null}

        {!erro && linhasCursos.length === 0 ? (
          <EmptyState />
        ) : null}

        {!erro && linhasCursos.length > 0 ? (
          <section
            style={{
              display: "grid",
              gap: "18px",
            }}
          >
            {linhasCursos.map(({ curso, inscricao }) => (
              <article
                key={inscricao.id}
                style={{
                  border: "1px solid #8a5d31",
                  background:
                    "linear-gradient(180deg, rgba(20,13,9,0.98) 0%, rgba(16,10,8,0.98) 100%)",
                  padding: "22px",
                  boxShadow:
                    "0 12px 26px rgba(0,0,0,0.16), inset 0 1px 0 rgba(255,225,170,0.03)",
                  display: "grid",
                  gap: "16px",
                }}
              >
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: curso.capa_url
                      ? "minmax(140px, 220px) minmax(0, 1fr)"
                      : "1fr",
                    gap: "18px",
                    alignItems: "start",
                  }}
                >
                  {curso.capa_url ? (
                    <div
                      style={{
                        border: "1px solid rgba(166,120,61,0.22)",
                        background: "rgba(20,13,9,0.4)",
                        overflow: "hidden",
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

                  <div style={{ display: "grid", gap: "10px" }}>
                    <p
                      style={{
                        margin: 0,
                        fontSize: "13px",
                        color: "#caa15a",
                        textTransform: "uppercase",
                        letterSpacing: "0.12em",
                      }}
                    >
                      {traduzirTipoProduto(curso.tipo_produto)}
                    </p>

                    <h2
                      style={{
                        margin: 0,
                        fontFamily: "Cinzel, serif",
                        fontSize: "clamp(26px, 4vw, 34px)",
                        color: "#f0d79a",
                        lineHeight: 1.2,
                        fontWeight: 500,
                      }}
                    >
                      {curso.titulo || "Curso sem título"}
                    </h2>

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
                      }}
                    >
                      <Badge texto={`Estado: ${traduzirEstado(inscricao.status)}`} />
                      <Badge
                        texto={`Certificado: ${
                          curso.tem_certificado ? "Sim" : "Não"
                        }`}
                      />
                      <Badge
                        texto={
                          curso.edicao_limitada
                            ? `Edição limitada${
                                curso.limite_vagas
                                  ? ` (${curso.limite_vagas} vagas)`
                                  : ""
                              }`
                            : "Sem limite de vagas"
                        }
                      />
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: "12px",
                    flexWrap: "wrap",
                  }}
                >
                  <Link href={`/aluno/cursos/${curso.id}`} style={botao}>
                    Entrar no curso
                  </Link>
                </div>
              </article>
            ))}
          </section>
        ) : null}
      </section>
    </main>
  );
}

function normalizarEstado(estado: string | null) {
  return (estado || "").trim().toLowerCase();
}

function traduzirEstado(estado: string | null) {
  const valor = normalizarEstado(estado);

  if (valor === "ativo" || valor === "activa") return "Ativo";
  if (valor === "concluido") return "Concluído";
  if (valor === "cancelado") return "Cancelado";
  if (valor === "inativo") return "Inativo";
  if (valor === "em_progresso") return "Em progresso";

  return "Sem estado";
}

function traduzirTipoProduto(tipo: string | null) {
  if (tipo === "curso_video") return "Curso em vídeo";
  if (tipo === "pdf_digital") return "PDF digital";
  return "Conteúdo";
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
        padding: "20px",
      }}
    >
      <p
        style={{
          margin: "0 0 10px 0",
          fontSize: "14px",
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
          fontSize: "46px",
          lineHeight: 1,
          color: "#f0d79a",
        }}
      >
        {valor}
      </p>

      <p
        style={{
          margin: 0,
          fontSize: "18px",
          lineHeight: 1.6,
          color: "#d7b06c",
        }}
      >
        {subtitulo}
      </p>
    </article>
  );
}

function Badge({ texto }: { texto: string }) {
  return (
    <span
      style={{
        border: "1px solid rgba(166,120,61,0.28)",
        background: "rgba(20,13,9,0.4)",
        color: "#e6c27a",
        padding: "8px 10px",
        fontSize: "14px",
        lineHeight: 1.4,
      }}
    >
      {texto}
    </span>
  );
}

function EstadoBox({ texto }: { texto: string }) {
  return (
    <section
      style={{
        border: "1px solid #8a5d31",
        background:
          "linear-gradient(180deg, rgba(20,13,9,0.98) 0%, rgba(16,10,8,0.98) 100%)",
        padding: "28px",
        textAlign: "center",
        color: "#d7b06c",
        fontSize: "21px",
        lineHeight: 1.7,
      }}
    >
      {texto}
    </section>
  );
}

function ErroBox({ texto }: { texto: string }) {
  return (
    <section
      style={{
        border: "1px solid rgba(255,107,107,0.35)",
        background: "rgba(120,20,20,0.12)",
        padding: "18px 20px",
        color: "#ffb4b4",
        fontSize: "18px",
        lineHeight: 1.7,
      }}
    >
      {texto}
    </section>
  );
}

function EmptyState() {
  return (
    <section
      style={{
        border: "1px solid #8a5d31",
        background:
          "linear-gradient(180deg, rgba(20,13,9,0.98) 0%, rgba(16,10,8,0.98) 100%)",
        padding: "28px",
        display: "grid",
        gap: "14px",
      }}
    >
      <h2
        style={{
          margin: 0,
          fontFamily: "Cinzel, serif",
          fontSize: "clamp(28px, 4vw, 38px)",
          color: "#f0d79a",
          fontWeight: 500,
        }}
      >
        Ainda não tens cursos na tua área
      </h2>

      <p
        style={{
          margin: 0,
          color: "#d7b06c",
          fontSize: "19px",
          lineHeight: 1.7,
        }}
      >
        Os teus cursos só irão aparecer aqui quando houver compras registadas e
        associadas à tua conta.
      </p>

      <div style={{ display: "flex", justifyContent: "flex-start" }}>
        <a href="/cursos" style={botao}>
          Explorar cursos
        </a>
      </div>
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
  fontSize: "16px",
  background: "transparent",
  textAlign: "center",
};