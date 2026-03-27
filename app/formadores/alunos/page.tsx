"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type Formador = {
  id: number;
  nome: string | null;
  auth_id: string | null;
  status: string | null;
};

type Curso = {
  id: number;
  titulo: string | null;
  tipo_produto: string | null;
  publicado: boolean | null;
};

type Inscricao = {
  id: number;
  aluno_id: number;
  curso_id: number;
  formador_id: number | null;
  progresso_percentagem: number | null;
  concluido: boolean | null;
  concluido_em: string | null;
  certificado_emitido: boolean | null;
  codigo_watermark_curso: string | null;
  texto_licenciamento: string | null;
  created_at: string | null;
};

type Aluno = {
  id: number;
  nome: string | null;
  email: string | null;
  auth_id: string | null;
  codigo_watermark: string | null;
};

export default function AlunosFormadorPage() {
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [formador, setFormador] = useState<Formador | null>(null);
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [inscricoes, setInscricoes] = useState<Inscricao[]>([]);
  const [alunosMap, setAlunosMap] = useState<Record<number, Aluno>>({});
  const [filtroCurso, setFiltroCurso] = useState<string>("todos");
  const [filtroEstado, setFiltroEstado] = useState<string>("todos");

  useEffect(() => {
    carregarDados();
  }, []);

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

      const { data: formadorData, error: formadorError } = await supabase
        .from("formadores")
        .select("id, nome, auth_id, status")
        .eq("auth_id", user.id)
        .single();

      if (formadorError || !formadorData) {
        setErro("Não foi possível encontrar o registo do formador.");
        setLoading(false);
        return;
      }

      if (formadorData.status !== "aprovado") {
        setErro("A conta de formador ainda não está aprovada.");
        setLoading(false);
        return;
      }

      setFormador(formadorData as Formador);

      const { data: cursosData, error: cursosError } = await supabase
        .from("cursos")
        .select("id, titulo, tipo_produto, publicado")
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
        setAlunosMap({});
        setLoading(false);
        return;
      }

      const cursoIds = cursosLista.map((curso) => curso.id);

      const { data: inscricoesData, error: inscricoesError } = await supabase
        .from("inscricoes")
        .select(
          "id, aluno_id, curso_id, formador_id, progresso_percentagem, concluido, concluido_em, certificado_emitido, codigo_watermark_curso, texto_licenciamento, created_at"
        )
        .in("curso_id", cursoIds)
        .order("created_at", { ascending: false });

      if (inscricoesError) {
        setErro(inscricoesError.message || "Erro ao carregar inscrições.");
        setLoading(false);
        return;
      }

      const inscricoesLista = (inscricoesData || []) as Inscricao[];
      setInscricoes(inscricoesLista);

      if (inscricoesLista.length === 0) {
        setAlunosMap({});
        setLoading(false);
        return;
      }

      const alunoIds = Array.from(
        new Set(inscricoesLista.map((inscricao) => inscricao.aluno_id))
      );

      const { data: alunosData, error: alunosError } = await supabase
        .from("alunos")
        .select("id, nome, email, auth_id, codigo_watermark")
        .in("id", alunoIds);

      if (alunosError) {
        setErro(alunosError.message || "Erro ao carregar alunos.");
        setLoading(false);
        return;
      }

      const mapa: Record<number, Aluno> = {};

      for (const aluno of alunosData || []) {
        mapa[aluno.id] = aluno as Aluno;
      }

      setAlunosMap(mapa);
    } catch {
      setErro("Ocorreu um erro inesperado ao carregar os alunos inscritos.");
    } finally {
      setLoading(false);
    }
  }

  const cursosMap = useMemo(() => {
    const mapa = new Map<number, Curso>();

    for (const curso of cursos) {
      mapa.set(curso.id, curso);
    }

    return mapa;
  }, [cursos]);

  const inscricoesFiltradas = useMemo(() => {
    return inscricoes.filter((inscricao) => {
      const passaCurso =
        filtroCurso === "todos" ||
        String(inscricao.curso_id) === String(filtroCurso);

      const passaEstado =
        filtroEstado === "todos" ||
        (filtroEstado === "concluido" && inscricao.concluido) ||
        (filtroEstado === "em_progresso" && !inscricao.concluido);

      return passaCurso && passaEstado;
    });
  }, [inscricoes, filtroCurso, filtroEstado]);

  const totalInscricoes = inscricoes.length;
  const totalConcluidos = inscricoes.filter((i) => i.concluido).length;
  const totalEmProgresso = inscricoes.filter((i) => !i.concluido).length;
  const totalCertificados = inscricoes.filter((i) => i.certificado_emitido).length;

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top, rgba(166,120,61,0.08), transparent 20%), #2b160f",
        color: "#e6c27a",
        fontFamily: "Cormorant Garamond, serif",
        padding: "50px 16px 90px",
      }}
    >
      <section
        style={{
          maxWidth: "1280px",
          margin: "0 auto",
        }}
      >
        <header
          style={{
            marginBottom: "34px",
          }}
        >
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
              fontSize: "clamp(34px, 6vw, 64px)",
              lineHeight: 1.1,
              color: "#f0d79a",
              fontWeight: 500,
            }}
          >
            Alunos Inscritos
          </h1>

          <p
            style={{
              margin: 0,
              fontSize: "clamp(18px, 2.4vw, 24px)",
              lineHeight: 1.7,
              color: "#d7b06c",
              maxWidth: "980px",
            }}
          >
            Acompanha os alunos inscritos nos teus cursos, consulta o progresso,
            o estado de conclusão e os dados de licenciamento associados ao
            acesso de cada aluno.
          </p>
        </header>

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "18px",
            marginBottom: "34px",
          }}
        >
          <MetricCard
            titulo="Inscrições"
            valor={String(totalInscricoes)}
            subtitulo="Total de inscrições"
          />
          <MetricCard
            titulo="Concluídos"
            valor={String(totalConcluidos)}
            subtitulo="Cursos terminados"
          />
          <MetricCard
            titulo="Em progresso"
            valor={String(totalEmProgresso)}
            subtitulo="Alunos ativos"
          />
          <MetricCard
            titulo="Certificados"
            valor={String(totalCertificados)}
            subtitulo="Emitidos"
          />
        </section>

        <section
          style={{
            border: "1px solid #8a5d31",
            background:
              "linear-gradient(180deg, rgba(20,13,9,0.98) 0%, rgba(16,10,8,0.98) 100%)",
            padding: "clamp(20px, 3vw, 28px)",
            boxShadow:
              "0 18px 42px rgba(0,0,0,0.24), inset 0 1px 0 rgba(255,225,170,0.03)",
            marginBottom: "28px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: "18px",
              alignItems: "flex-end",
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
                Filtros
              </p>

              <h2
                style={{
                  margin: 0,
                  fontFamily: "Cinzel, serif",
                  fontSize: "clamp(26px, 4vw, 40px)",
                  color: "#f0d79a",
                  fontWeight: 500,
                }}
              >
                Gestão da turma
              </h2>
            </div>

            <div
              style={{
                display: "flex",
                gap: "12px",
                flexWrap: "wrap",
              }}
            >
              <Link href="/formadores/dashboard" style={botaoSecundario}>
                Voltar à dashboard
              </Link>

              <button type="button" onClick={carregarDados} style={botao}>
                Atualizar
              </button>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: "18px",
            }}
          >
            <SelectField
              label="Filtrar por curso"
              value={filtroCurso}
              onChange={setFiltroCurso}
              options={[
                { value: "todos", label: "Todos os cursos" },
                ...cursos.map((curso) => ({
                  value: String(curso.id),
                  label: curso.titulo || `Curso #${curso.id}`,
                })),
              ]}
            />

            <SelectField
              label="Filtrar por estado"
              value={filtroEstado}
              onChange={setFiltroEstado}
              options={[
                { value: "todos", label: "Todos os estados" },
                { value: "em_progresso", label: "Em progresso" },
                { value: "concluido", label: "Concluído" },
              ]}
            />
          </div>
        </section>

        {loading ? (
          <LoadingBox />
        ) : erro ? (
          <ErrorBox texto={erro} />
        ) : cursos.length === 0 ? (
          <EmptyState
            titulo="Ainda não tens cursos associados"
            descricao="Quando os teus cursos estiverem criados, as inscrições dos alunos passarão a aparecer aqui."
            botaoHref="/formadores/criar-curso"
            botaoTexto="Criar curso"
          />
        ) : inscricoes.length === 0 ? (
          <EmptyState
            titulo="Ainda não existem alunos inscritos"
            descricao="Assim que houver compras ou acessos registados nos teus cursos, esta área mostrará cada aluno, o respetivo curso e o estado de progresso."
            botaoHref="/formadores/cursos"
            botaoTexto="Ver cursos"
          />
        ) : (
          <div
            style={{
              display: "grid",
              gap: "20px",
            }}
          >
            {inscricoesFiltradas.map((inscricao) => {
              const aluno = alunosMap[inscricao.aluno_id];
              const curso = cursosMap.get(inscricao.curso_id);

              return (
                <article
                  key={inscricao.id}
                  style={{
                    border: "1px solid #8a5d31",
                    background:
                      "linear-gradient(180deg, rgba(20,13,9,0.98) 0%, rgba(16,10,8,0.98) 100%)",
                    padding: "24px",
                    boxShadow:
                      "0 12px 26px rgba(0,0,0,0.16), inset 0 1px 0 rgba(255,225,170,0.03)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: "18px",
                      flexWrap: "wrap",
                      alignItems: "flex-start",
                      marginBottom: "18px",
                    }}
                  >
                    <div style={{ flex: "1 1 520px", minWidth: "260px" }}>
                      <h2
                        style={{
                          margin: "0 0 10px 0",
                          fontFamily: "Cinzel, serif",
                          fontSize: "clamp(26px, 4vw, 32px)",
                          color: "#e6c27a",
                          fontWeight: 500,
                        }}
                      >
                        {aluno?.nome || "Aluno sem nome"}
                      </h2>

                      <p
                        style={{
                          margin: "0 0 8px 0",
                          fontSize: "clamp(18px, 2vw, 20px)",
                          color: "#d7b06c",
                          wordBreak: "break-word",
                        }}
                      >
                        {aluno?.email || "Email indisponível"}
                      </p>

                      <p
                        style={{
                          margin: 0,
                          fontSize: "18px",
                          color: "#caa15a",
                        }}
                      >
                        Curso: {curso?.titulo || "Curso não encontrado"}
                      </p>
                    </div>

                    <div
                      style={{
                        display: "grid",
                        gap: "10px",
                        minWidth: "220px",
                        flex: "0 1 250px",
                      }}
                    >
                      <StatusBox
                        label="Estado"
                        valor={inscricao.concluido ? "Concluído" : "Em progresso"}
                      />
                      <StatusBox
                        label="Progresso"
                        valor={`${Number(inscricao.progresso_percentagem || 0).toFixed(0)}%`}
                      />
                      <StatusBox
                        label="Certificado"
                        valor={inscricao.certificado_emitido ? "Emitido" : "Não emitido"}
                      />
                    </div>
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                      gap: "14px",
                      marginBottom: "18px",
                    }}
                  >
                    <InfoMini
                      label="Tipo de produto"
                      valor={traduzirTipoProduto(curso?.tipo_produto || null)}
                    />
                    <InfoMini
                      label="Curso publicado"
                      valor={curso?.publicado ? "Sim" : "Não"}
                    />
                    <InfoMini
                      label="Código do aluno"
                      valor={aluno?.codigo_watermark || "Não definido"}
                    />
                    <InfoMini
                      label="Watermark da inscrição"
                      valor={inscricao.codigo_watermark_curso || "Não definido"}
                    />
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gap: "14px",
                    }}
                  >
                    <InfoBloco
                      label="Texto de licenciamento"
                      valor={
                        inscricao.texto_licenciamento ||
                        "Texto de licenciamento em atualização."
                      }
                    />

                    <InfoBloco
                      label="Data de inscrição"
                      valor={
                        inscricao.created_at
                          ? new Date(inscricao.created_at).toLocaleString("pt-PT")
                          : "Data indisponível"
                      }
                    />

                    <InfoBloco
                      label="Data de conclusão"
                      valor={
                        inscricao.concluido_em
                          ? new Date(inscricao.concluido_em).toLocaleString("pt-PT")
                          : "Ainda não concluído"
                      }
                    />
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}

function traduzirTipoProduto(tipo: string | null) {
  if (tipo === "curso_video") return "Curso em vídeo";
  if (tipo === "pdf_digital") return "PDF digital";
  if (tipo === "produto_fisico") return "Produto físico";
  return "Não definido";
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <label
        style={{
          display: "block",
          fontSize: "19px",
          marginBottom: "8px",
          color: "#e6c27a",
        }}
      >
        {label}
      </label>

      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: "100%",
          padding: "14px 14px",
          background: "#1a100c",
          border: "1px solid #8a5d31",
          color: "#e6c27a",
          fontSize: "18px",
          outline: "none",
        }}
      >
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
            style={{
              background: "#1a100c",
              color: "#e6c27a",
            }}
          >
            {option.label}
          </option>
        ))}
      </select>
    </div>
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

function StatusBox({
  label,
  valor,
}: {
  label: string;
  valor: string;
}) {
  return (
    <div
      style={{
        border: "1px solid rgba(166,120,61,0.22)",
        background: "rgba(32,18,13,0.45)",
        padding: "12px 14px",
      }}
    >
      <p
        style={{
          margin: "0 0 6px 0",
          fontSize: "14px",
          textTransform: "uppercase",
          letterSpacing: "1px",
          color: "#caa15a",
        }}
      >
        {label}
      </p>

      <p
        style={{
          margin: 0,
          fontSize: "18px",
          color: "#d7b06c",
          lineHeight: 1.5,
        }}
      >
        {valor}
      </p>
    </div>
  );
}

function InfoMini({
  label,
  valor,
}: {
  label: string;
  valor: string;
}) {
  return (
    <div
      style={{
        border: "1px solid rgba(166,120,61,0.16)",
        background: "rgba(20,13,9,0.5)",
        padding: "16px 18px",
      }}
    >
      <p
        style={{
          margin: "0 0 8px 0",
          fontSize: "15px",
          color: "#caa15a",
          textTransform: "uppercase",
          letterSpacing: "1px",
        }}
      >
        {label}
      </p>

      <p
        style={{
          margin: 0,
          fontSize: "20px",
          color: "#d7b06c",
          lineHeight: 1.6,
          whiteSpace: "pre-line",
          wordBreak: "break-word",
        }}
      >
        {valor}
      </p>
    </div>
  );
}

function InfoBloco({
  label,
  valor,
}: {
  label: string;
  valor: string;
}) {
  return (
    <div
      style={{
        border: "1px solid rgba(166,120,61,0.16)",
        background: "rgba(20,13,9,0.5)",
        padding: "16px 18px",
      }}
    >
      <p
        style={{
          margin: "0 0 8px 0",
          fontSize: "15px",
          color: "#caa15a",
          textTransform: "uppercase",
          letterSpacing: "1px",
        }}
      >
        {label}
      </p>

      <p
        style={{
          margin: 0,
          fontSize: "19px",
          color: "#d7b06c",
          lineHeight: 1.7,
          whiteSpace: "pre-line",
          wordBreak: "break-word",
        }}
      >
        {valor}
      </p>
    </div>
  );
}

function LoadingBox() {
  return (
    <div
      style={{
        border: "1px solid #8a5d31",
        background:
          "linear-gradient(180deg, rgba(20,13,9,0.98) 0%, rgba(16,10,8,0.98) 100%)",
        padding: "34px",
        textAlign: "center",
      }}
    >
      <h2
        style={{
          fontFamily: "Cinzel, serif",
          fontSize: "32px",
          margin: "0 0 14px 0",
          color: "#e6c27a",
          fontWeight: 500,
        }}
      >
        A carregar alunos inscritos
      </h2>

      <p
        style={{
          margin: 0,
          fontSize: "21px",
          lineHeight: "1.7",
          color: "#d7b06c",
        }}
      >
        A plataforma está a reunir inscrições, progresso e dados de
        licenciamento dos alunos.
      </p>
    </div>
  );
}

function ErrorBox({ texto }: { texto: string }) {
  return (
    <div
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
    </div>
  );
}

function EmptyState({
  titulo,
  descricao,
  botaoHref,
  botaoTexto,
}: {
  titulo: string;
  descricao: string;
  botaoHref: string;
  botaoTexto: string;
}) {
  return (
    <div
      style={{
        border: "1px solid #8a5d31",
        background:
          "linear-gradient(180deg, rgba(20,13,9,0.98) 0%, rgba(16,10,8,0.98) 100%)",
        padding: "34px",
        boxShadow:
          "0 18px 42px rgba(0,0,0,0.24), inset 0 1px 0 rgba(255,225,170,0.03)",
      }}
    >
      <h2
        style={{
          fontFamily: "Cinzel, serif",
          fontSize: "34px",
          margin: "0 0 14px 0",
          color: "#e6c27a",
          fontWeight: 500,
        }}
      >
        {titulo}
      </h2>

      <p
        style={{
          margin: "0 0 20px 0",
          fontSize: "21px",
          lineHeight: "1.75",
          color: "#d7b06c",
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
  cursor: "pointer",
  textAlign: "center",
};

const botaoSecundario: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  textDecoration: "none",
  border: "1px solid rgba(166,120,61,0.6)",
  color: "#e6c27a",
  padding: "12px 16px",
  fontSize: "15px",
  background: "rgba(32,18,13,0.55)",
  cursor: "pointer",
  textAlign: "center",
};