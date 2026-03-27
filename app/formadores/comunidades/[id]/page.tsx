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

type Comunidade = {
  id: number;
  curso_id: number;
  titulo: string | null;
  descricao: string | null;
  ativa: boolean | null;
  created_at: string | null;
};

type Curso = {
  id: number;
  titulo: string | null;
  descricao: string | null;
  publicado: boolean | null;
};

type Topico = {
  id: number;
  comunidade_id: number;
  autor_aluno_id: number | null;
  autor_formador_id: number | null;
  titulo: string;
  conteudo: string;
  fixado: boolean | null;
  fechado: boolean | null;
  created_at: string | null;
  updated_at: string | null;
};

type Resposta = {
  id: number;
  topico_id: number;
  autor_aluno_id: number | null;
  autor_formador_id: number | null;
  conteudo: string;
  created_at: string | null;
  updated_at: string | null;
};

type Aluno = {
  id: number;
  nome: string | null;
  email: string | null;
};

type Params = {
  id: string;
};

export default function ComunidadeDetalhePage({
  params,
}: {
  params: Promise<Params>;
}) {
  const [comunidadeId, setComunidadeId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [formador, setFormador] = useState<Formador | null>(null);
  const [comunidade, setComunidade] = useState<Comunidade | null>(null);
  const [curso, setCurso] = useState<Curso | null>(null);
  const [topicos, setTopicos] = useState<Topico[]>([]);
  const [respostas, setRespostas] = useState<Resposta[]>([]);
  const [alunosMap, setAlunosMap] = useState<Record<number, Aluno>>({});
  const [novoTopicoTitulo, setNovoTopicoTitulo] = useState("");
  const [novoTopicoConteudo, setNovoTopicoConteudo] = useState("");
  const [criandoTopico, setCriandoTopico] = useState(false);
  const [respostasDraft, setRespostasDraft] = useState<Record<number, string>>(
    {}
  );
  const [aResponder, setAResponder] = useState<number | null>(null);

  useEffect(() => {
    let ativo = true;

    async function resolverParams() {
      const resolvido = await params;
      const idNumero = Number(resolvido.id);

      if (ativo) {
        if (Number.isNaN(idNumero)) {
          setErro("ID de comunidade inválido.");
          setLoading(false);
          return;
        }

        setComunidadeId(idNumero);
      }
    }

    resolverParams();

    return () => {
      ativo = false;
    };
  }, [params]);

  useEffect(() => {
    if (!comunidadeId) return;
    carregarDados(comunidadeId);
  }, [comunidadeId]);

  async function carregarDados(id: number) {
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

      const { data: comunidadeData, error: comunidadeError } = await supabase
        .from("comunidades")
        .select("id, curso_id, titulo, descricao, ativa, created_at")
        .eq("id", id)
        .single();

      if (comunidadeError || !comunidadeData) {
        setErro("Comunidade não encontrada.");
        setLoading(false);
        return;
      }

      setComunidade(comunidadeData as Comunidade);

      const { data: cursoData, error: cursoError } = await supabase
        .from("cursos")
        .select("id, titulo, descricao, publicado, formador_id")
        .eq("id", comunidadeData.curso_id)
        .single();

      if (cursoError || !cursoData) {
        setErro("Curso associado não encontrado.");
        setLoading(false);
        return;
      }

      if (cursoData.formador_id !== formadorData.id) {
        setErro("Não tens permissão para aceder a esta comunidade.");
        setLoading(false);
        return;
      }

      setCurso({
        id: cursoData.id,
        titulo: cursoData.titulo,
        descricao: cursoData.descricao,
        publicado: cursoData.publicado,
      });

      const { data: topicosData, error: topicosError } = await supabase
        .from("comunidade_topicos")
        .select(
          "id, comunidade_id, autor_aluno_id, autor_formador_id, titulo, conteudo, fixado, fechado, created_at, updated_at"
        )
        .eq("comunidade_id", id)
        .order("fixado", { ascending: false })
        .order("created_at", { ascending: false });

      if (topicosError) {
        setErro(topicosError.message || "Erro ao carregar tópicos.");
        setLoading(false);
        return;
      }

      const topicosLista = (topicosData || []) as Topico[];
      setTopicos(topicosLista);

      const topicoIds = topicosLista.map((topico) => topico.id);

      let respostasLista: Resposta[] = [];

      if (topicoIds.length > 0) {
        const { data: respostasData, error: respostasError } = await supabase
          .from("comunidade_respostas")
          .select(
            "id, topico_id, autor_aluno_id, autor_formador_id, conteudo, created_at, updated_at"
          )
          .in("topico_id", topicoIds)
          .order("created_at", { ascending: true });

        if (respostasError) {
          setErro(respostasError.message || "Erro ao carregar respostas.");
          setLoading(false);
          return;
        }

        respostasLista = (respostasData || []) as Resposta[];
        setRespostas(respostasLista);
      } else {
        setRespostas([]);
      }

      const alunoIdsSet = new Set<number>();

      for (const topico of topicosLista) {
        if (typeof topico.autor_aluno_id === "number") {
          alunoIdsSet.add(topico.autor_aluno_id);
        }
      }

      for (const resposta of respostasLista) {
        if (typeof resposta.autor_aluno_id === "number") {
          alunoIdsSet.add(resposta.autor_aluno_id);
        }
      }

      const alunoIds = Array.from(alunoIdsSet);

      if (alunoIds.length > 0) {
        const { data: alunosData } = await supabase
          .from("alunos")
          .select("id, nome, email")
          .in("id", alunoIds);

        const mapa: Record<number, Aluno> = {};
        for (const aluno of alunosData || []) {
          mapa[aluno.id] = aluno as Aluno;
        }
        setAlunosMap(mapa);
      } else {
        setAlunosMap({});
      }
    } catch {
      setErro("Ocorreu um erro inesperado ao carregar a comunidade.");
    } finally {
      setLoading(false);
    }
  }

  async function criarTopico() {
    if (!comunidadeId || !formador) return;

    setErro("");

    if (!novoTopicoTitulo.trim()) {
      setErro("Indica o título do tópico.");
      return;
    }

    if (!novoTopicoConteudo.trim()) {
      setErro("Indica o conteúdo do tópico.");
      return;
    }

    try {
      setCriandoTopico(true);

      const { error } = await supabase.from("comunidade_topicos").insert([
        {
          comunidade_id: comunidadeId,
          autor_formador_id: formador.id,
          titulo: novoTopicoTitulo.trim(),
          conteudo: novoTopicoConteudo.trim(),
          fixado: false,
          fechado: false,
        },
      ]);

      if (error) {
        setErro(error.message || "Erro ao criar tópico.");
        return;
      }

      setNovoTopicoTitulo("");
      setNovoTopicoConteudo("");
      await carregarDados(comunidadeId);
    } catch {
      setErro("Ocorreu um erro inesperado ao criar o tópico.");
    } finally {
      setCriandoTopico(false);
    }
  }

  async function responderTopico(topicoId: number) {
    if (!formador || !comunidadeId) return;

    const conteudo = (respostasDraft[topicoId] || "").trim();

    if (!conteudo) {
      setErro("Escreve a resposta antes de enviar.");
      return;
    }

    try {
      setAResponder(topicoId);
      setErro("");

      const { error } = await supabase.from("comunidade_respostas").insert([
        {
          topico_id: topicoId,
          autor_formador_id: formador.id,
          conteudo,
        },
      ]);

      if (error) {
        setErro(error.message || "Erro ao responder ao tópico.");
        return;
      }

      setRespostasDraft((prev) => ({ ...prev, [topicoId]: "" }));
      await carregarDados(comunidadeId);
    } catch {
      setErro("Ocorreu um erro inesperado ao responder.");
    } finally {
      setAResponder(null);
    }
  }

  async function alternarFixado(topico: Topico) {
    if (!comunidadeId) return;

    try {
      setErro("");

      const { error } = await supabase
        .from("comunidade_topicos")
        .update({ fixado: !topico.fixado })
        .eq("id", topico.id);

      if (error) {
        setErro(error.message || "Erro ao atualizar o tópico.");
        return;
      }

      await carregarDados(comunidadeId);
    } catch {
      setErro("Ocorreu um erro inesperado ao atualizar o tópico.");
    }
  }

  async function alternarFechado(topico: Topico) {
    if (!comunidadeId) return;

    try {
      setErro("");

      const { error } = await supabase
        .from("comunidade_topicos")
        .update({ fechado: !topico.fechado })
        .eq("id", topico.id);

      if (error) {
        setErro(error.message || "Erro ao atualizar o tópico.");
        return;
      }

      await carregarDados(comunidadeId);
    } catch {
      setErro("Ocorreu um erro inesperado ao atualizar o tópico.");
    }
  }

  const respostasPorTopico = useMemo(() => {
    const mapa: Record<number, Resposta[]> = {};

    for (const resposta of respostas) {
      if (!mapa[resposta.topico_id]) {
        mapa[resposta.topico_id] = [];
      }
      mapa[resposta.topico_id].push(resposta);
    }

    return mapa;
  }, [respostas]);

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
              fontSize: "clamp(34px, 6vw, 64px)",
              lineHeight: 1.1,
              color: "#f0d79a",
              fontWeight: 500,
            }}
          >
            Comunidade do Curso
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
            Acompanha dúvidas, cria tópicos de esclarecimento e mantém o apoio
            pedagógico organizado dentro da plataforma.
          </p>
        </header>

        {loading ? (
          <LoadingBox />
        ) : erro ? (
          <ErrorBox texto={erro} />
        ) : !comunidade || !curso ? (
          <ErrorBox texto="Não foi possível carregar a comunidade." />
        ) : (
          <>
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
                }}
              >
                <div style={{ flex: "1 1 520px", minWidth: "260px" }}>
                  <p
                    style={{
                      margin: "0 0 8px 0",
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                      color: "#caa15a",
                      fontSize: "14px",
                    }}
                  >
                    Comunidade associada
                  </p>

                  <h2
                    style={{
                      margin: "0 0 10px 0",
                      fontFamily: "Cinzel, serif",
                      fontSize: "clamp(26px, 4vw, 42px)",
                      color: "#f0d79a",
                      fontWeight: 500,
                    }}
                  >
                    {comunidade.titulo || "Comunidade sem título"}
                  </h2>

                  <p
                    style={{
                      margin: "0 0 10px 0",
                      fontSize: "clamp(18px, 2vw, 21px)",
                      color: "#d7b06c",
                      lineHeight: 1.7,
                    }}
                  >
                    {comunidade.descricao ||
                      "Descrição da comunidade em atualização."}
                  </p>

                  <p
                    style={{
                      margin: 0,
                      fontSize: "18px",
                      color: "#caa15a",
                    }}
                  >
                    Curso: {curso.titulo || "Curso sem título"}
                  </p>
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: "12px",
                    flexWrap: "wrap",
                  }}
                >
                  <Link
                    href="/formadores/comunidades"
                    style={botaoSecundario}
                  >
                    Voltar às comunidades
                  </Link>

                  <button
                    type="button"
                    onClick={() => comunidadeId && carregarDados(comunidadeId)}
                    style={botao}
                  >
                    Atualizar
                  </button>
                </div>
              </div>
            </section>

            <section
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
                gap: "24px",
                alignItems: "start",
              }}
            >
              <div style={{ display: "grid", gap: "24px" }}>
                <Panel>
                  <SectionHeader
                    subtitulo="Novo tópico"
                    titulo="Criar esclarecimento ou anúncio"
                  />

                  <div style={{ display: "grid", gap: "16px" }}>
                    <Input
                      label="Título do tópico"
                      value={novoTopicoTitulo}
                      onChange={setNovoTopicoTitulo}
                      placeholder="Ex.: Esclarecimento sobre a carta do Louco"
                    />

                    <Textarea
                      label="Conteúdo"
                      value={novoTopicoConteudo}
                      onChange={setNovoTopicoConteudo}
                      rows={6}
                      placeholder="Escreve aqui o esclarecimento, instrução ou anúncio para os alunos."
                    />

                    <button
                      type="button"
                      onClick={criarTopico}
                      style={botao}
                      disabled={criandoTopico}
                    >
                      {criandoTopico ? "A criar tópico..." : "Criar tópico"}
                    </button>
                  </div>
                </Panel>

                <Panel>
                  <SectionHeader
                    subtitulo="Tópicos"
                    titulo="Discussões da comunidade"
                  />

                  {topicos.length === 0 ? (
                    <p
                      style={{
                        margin: 0,
                        fontSize: "21px",
                        color: "#d7b06c",
                        lineHeight: 1.7,
                      }}
                    >
                      Ainda não existem tópicos nesta comunidade.
                    </p>
                  ) : (
                    <div style={{ display: "grid", gap: "18px" }}>
                      {topicos.map((topico) => {
                        const respostasDoTopico =
                          respostasPorTopico[topico.id] || [];
                        const nomeAluno =
                          typeof topico.autor_aluno_id === "number"
                            ? alunosMap[topico.autor_aluno_id]?.nome ||
                              alunosMap[topico.autor_aluno_id]?.email ||
                              `Aluno #${topico.autor_aluno_id}`
                            : null;

                        return (
                          <article
                            key={topico.id}
                            style={{
                              border: "1px solid rgba(166,120,61,0.22)",
                              background: "rgba(32,18,13,0.45)",
                              padding: "22px",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                gap: "14px",
                                flexWrap: "wrap",
                                alignItems: "flex-start",
                                marginBottom: "12px",
                              }}
                            >
                              <div style={{ flex: "1 1 420px", minWidth: "240px" }}>
                                <h3
                                  style={{
                                    margin: "0 0 8px 0",
                                    fontFamily: "Cinzel, serif",
                                    fontSize: "clamp(22px, 3vw, 28px)",
                                    color: "#e6c27a",
                                    fontWeight: 500,
                                  }}
                                >
                                  {topico.titulo}
                                </h3>

                                <p
                                  style={{
                                    margin: 0,
                                    fontSize: "18px",
                                    color: "#caa15a",
                                  }}
                                >
                                  Autor:{" "}
                                  {topico.autor_formador_id
                                    ? "Formador"
                                    : nomeAluno || "Aluno"}
                                </p>
                              </div>

                              <div
                                style={{
                                  display: "flex",
                                  gap: "10px",
                                  flexWrap: "wrap",
                                }}
                              >
                                <Tag texto={topico.fixado ? "Fixado" : "Normal"} />
                                <Tag
                                  texto={topico.fechado ? "Fechado" : "Aberto"}
                                />
                              </div>
                            </div>

                            <p
                              style={{
                                margin: "0 0 16px 0",
                                fontSize: "clamp(18px, 2vw, 21px)",
                                color: "#d7b06c",
                                lineHeight: 1.75,
                                whiteSpace: "pre-line",
                              }}
                            >
                              {topico.conteudo}
                            </p>

                            <div
                              style={{
                                display: "flex",
                                gap: "12px",
                                flexWrap: "wrap",
                                marginBottom: "16px",
                              }}
                            >
                              <button
                                type="button"
                                onClick={() => alternarFixado(topico)}
                                style={botaoSecundario}
                              >
                                {topico.fixado ? "Desafixar" : "Fixar"}
                              </button>

                              <button
                                type="button"
                                onClick={() => alternarFechado(topico)}
                                style={botaoSecundario}
                              >
                                {topico.fechado ? "Reabrir" : "Fechar"}
                              </button>
                            </div>

                            <div style={{ display: "grid", gap: "12px" }}>
                              {respostasDoTopico.map((resposta) => {
                                const nomeAlunoResposta =
                                  typeof resposta.autor_aluno_id === "number"
                                    ? alunosMap[resposta.autor_aluno_id]?.nome ||
                                      alunosMap[resposta.autor_aluno_id]?.email ||
                                      `Aluno #${resposta.autor_aluno_id}`
                                    : null;

                                return (
                                  <div
                                    key={resposta.id}
                                    style={{
                                      border: "1px solid rgba(166,120,61,0.16)",
                                      background: "rgba(20,13,9,0.5)",
                                      padding: "16px 18px",
                                    }}
                                  >
                                    <p
                                      style={{
                                        margin: "0 0 8px 0",
                                        fontSize: "16px",
                                        color: "#caa15a",
                                        textTransform: "uppercase",
                                        letterSpacing: "1px",
                                      }}
                                    >
                                      {resposta.autor_formador_id
                                        ? "Resposta do formador"
                                        : nomeAlunoResposta || "Resposta do aluno"}
                                    </p>

                                    <p
                                      style={{
                                        margin: 0,
                                        fontSize: "19px",
                                        color: "#d7b06c",
                                        lineHeight: 1.7,
                                        whiteSpace: "pre-line",
                                      }}
                                    >
                                      {resposta.conteudo}
                                    </p>
                                  </div>
                                );
                              })}
                            </div>

                            {!topico.fechado ? (
                              <div style={{ marginTop: "18px", display: "grid", gap: "12px" }}>
                                <Textarea
                                  label="Responder ao tópico"
                                  value={respostasDraft[topico.id] || ""}
                                  onChange={(valor) =>
                                    setRespostasDraft((prev) => ({
                                      ...prev,
                                      [topico.id]: valor,
                                    }))
                                  }
                                  rows={4}
                                  placeholder="Escreve aqui a tua resposta."
                                />

                                <button
                                  type="button"
                                  onClick={() => responderTopico(topico.id)}
                                  style={botao}
                                  disabled={aResponder === topico.id}
                                >
                                  {aResponder === topico.id
                                    ? "A responder..."
                                    : "Responder"}
                                </button>
                              </div>
                            ) : null}
                          </article>
                        );
                      })}
                    </div>
                  )}
                </Panel>
              </div>

              <div style={{ display: "grid", gap: "24px" }}>
                <Panel>
                  <SectionHeader
                    subtitulo="Resumo"
                    titulo="Estado da comunidade"
                  />

                  <StatusLine
                    label="Curso"
                    valor={curso.titulo || "Curso sem título"}
                  />
                  <StatusLine
                    label="Publicação do curso"
                    valor={curso.publicado ? "Publicado" : "Rascunho"}
                  />
                  <StatusLine
                    label="Estado da comunidade"
                    valor={comunidade.ativa ? "Ativa" : "Inativa"}
                  />
                  <StatusLine
                    label="Tópicos"
                    valor={String(topicos.length)}
                  />
                </Panel>

                <Panel>
                  <SectionHeader
                    subtitulo="Utilização"
                    titulo="Sugestões de uso"
                  />

                  <ChecklistItem texto="Criar tópicos de esclarecimento para dúvidas recorrentes." />
                  <ChecklistItem texto="Fixar anúncios importantes para a turma." />
                  <ChecklistItem texto="Responder no próprio tópico para manter o histórico organizado." />
                  <ChecklistItem texto="Criar módulos extra no curso quando as dúvidas exigirem aprofundamento." />
                </Panel>
              </div>
            </section>
          </>
        )}
      </section>
    </main>
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
}: {
  subtitulo: string;
  titulo: string;
}) {
  return (
    <div style={{ marginBottom: "18px" }}>
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
          fontSize: "clamp(26px, 4vw, 38px)",
          color: "#f0d79a",
          fontWeight: 500,
        }}
      >
        {titulo}
      </h2>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
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

      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: "100%",
          padding: "14px 14px",
          background: "#1a100c",
          border: "1px solid #8a5d31",
          color: "#e6c27a",
          fontSize: "18px",
          outline: "none",
        }}
      />
    </div>
  );
}

function Textarea({
  label,
  value,
  onChange,
  rows = 5,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  placeholder?: string;
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

      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        placeholder={placeholder}
        style={{
          width: "100%",
          padding: "14px 14px",
          background: "#1a100c",
          border: "1px solid #8a5d31",
          color: "#e6c27a",
          fontSize: "18px",
          outline: "none",
          resize: "vertical",
        }}
      />
    </div>
  );
}

function StatusLine({
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
        padding: "14px 16px",
        marginBottom: "12px",
      }}
    >
      <p
        style={{
          margin: "0 0 6px 0",
          fontSize: "15px",
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
          fontSize: "19px",
          color: "#d7b06c",
          lineHeight: 1.6,
          wordBreak: "break-word",
        }}
      >
        {valor}
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

function Tag({ texto }: { texto: string }) {
  return (
    <span
      style={{
        border: "1px solid rgba(166,120,61,0.45)",
        background: "rgba(32,18,13,0.55)",
        color: "#e6c27a",
        padding: "8px 12px",
        fontSize: "14px",
        textTransform: "uppercase",
        letterSpacing: "1px",
      }}
    >
      {texto}
    </span>
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
        A carregar comunidade
      </h2>

      <p
        style={{
          margin: 0,
          fontSize: "21px",
          lineHeight: "1.7",
          color: "#d7b06c",
        }}
      >
        A plataforma está a reunir os tópicos e respostas desta comunidade.
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