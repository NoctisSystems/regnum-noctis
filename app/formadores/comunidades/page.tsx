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

type Comunidade = {
  id: number;
  curso_id: number;
  titulo: string | null;
  descricao: string | null;
  ativa: boolean | null;
  created_at: string | null;
};

type TopicoCount = {
  comunidade_id: number;
  total: number;
};

export default function ComunidadesFormadorPage() {
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [formador, setFormador] = useState<Formador | null>(null);
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [comunidades, setComunidades] = useState<Comunidade[]>([]);
  const [topicosCount, setTopicosCount] = useState<Record<number, number>>({});

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
        .select("id, nome, email, auth_id, status")
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
        .select("id, titulo, publicado")
        .eq("formador_id", formadorData.id)
        .order("id", { ascending: false });

      if (cursosError) {
        setErro(cursosError.message || "Erro ao carregar cursos.");
        setLoading(false);
        return;
      }

      const cursosLista = ((cursosData || []) as Curso[]).filter(
        (curso) => typeof curso.id === "number"
      );

      setCursos(cursosLista);

      if (cursosLista.length === 0) {
        setComunidades([]);
        setTopicosCount({});
        setLoading(false);
        return;
      }

      const cursoIds = cursosLista.map((curso) => curso.id);

      const { data: comunidadesData, error: comunidadesError } = await supabase
        .from("comunidades")
        .select("id, curso_id, titulo, descricao, ativa, created_at")
        .in("curso_id", cursoIds)
        .order("id", { ascending: false });

      if (comunidadesError) {
        setErro(comunidadesError.message || "Erro ao carregar comunidades.");
        setLoading(false);
        return;
      }

      const comunidadesLista = (comunidadesData || []) as Comunidade[];
      setComunidades(comunidadesLista);

      if (comunidadesLista.length === 0) {
        setTopicosCount({});
        setLoading(false);
        return;
      }

      const comunidadeIds = comunidadesLista.map((comunidade) => comunidade.id);

      const { data: topicosData, error: topicosError } = await supabase
        .from("comunidade_topicos")
        .select("comunidade_id")
        .in("comunidade_id", comunidadeIds);

      if (topicosError) {
        setErro(topicosError.message || "Erro ao carregar tópicos.");
        setLoading(false);
        return;
      }

      const mapa: Record<number, number> = {};

      for (const item of topicosData || []) {
        const comunidadeId = Number(item.comunidade_id);
        mapa[comunidadeId] = (mapa[comunidadeId] || 0) + 1;
      }

      setTopicosCount(mapa);
    } catch {
      setErro("Ocorreu um erro inesperado ao carregar as comunidades.");
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

  const totalCursos = cursos.length;
  const totalComunidades = comunidades.length;
  const totalTopicos = Object.values(topicosCount).reduce(
    (acc, valor) => acc + valor,
    0
  );

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
              fontSize: "clamp(42px, 6vw, 64px)",
              lineHeight: 1.1,
              color: "#f0d79a",
              fontWeight: 500,
            }}
          >
            Comunidades
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
            Gere as comunidades internas associadas aos teus cursos, acompanha
            os tópicos publicados pelos alunos e mantém o apoio pedagógico
            dentro da plataforma.
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
            titulo="Cursos"
            valor={String(totalCursos)}
            subtitulo="Cursos associados"
          />
          <MetricCard
            titulo="Comunidades"
            valor={String(totalComunidades)}
            subtitulo="Comunidades existentes"
          />
          <MetricCard
            titulo="Tópicos"
            valor={String(totalTopicos)}
            subtitulo="Tópicos registados"
          />
          <MetricCard
            titulo="Formador"
            valor={formador?.nome ? "1" : "0"}
            subtitulo={formador?.nome || "Conta não carregada"}
          />
        </section>

        <section
          style={{
            border: "1px solid #8a5d31",
            background:
              "linear-gradient(180deg, rgba(20,13,9,0.98) 0%, rgba(16,10,8,0.98) 100%)",
            padding: "28px",
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
                Gestão interna
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
                Apoio pedagógico por curso
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

              <button
                type="button"
                onClick={carregarDados}
                style={botao}
              >
                Atualizar
              </button>
            </div>
          </div>
        </section>

        {loading ? (
          <LoadingBox />
        ) : erro ? (
          <ErrorBox texto={erro} />
        ) : cursos.length === 0 ? (
          <EmptyState
            titulo="Ainda não tens cursos com estrutura criada"
            descricao="As comunidades surgem associadas aos cursos. Quando começares a criar os teus cursos, esta área ficará pronta para acompanhar as turmas."
            botaoHref="/formadores/criar-curso"
            botaoTexto="Criar curso"
          />
        ) : comunidades.length === 0 ? (
          <EmptyState
            titulo="Ainda não existem comunidades para os teus cursos"
            descricao="Os teus cursos já existem, mas ainda não têm comunidades associadas. A seguir podemos tratar da criação automática de uma comunidade por curso."
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
            {comunidades.map((comunidade) => {
              const curso = cursosMap.get(comunidade.curso_id);
              const totalTopicosComunidade = topicosCount[comunidade.id] || 0;

              return (
                <article
                  key={comunidade.id}
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
                    <div>
                      <p
                        style={{
                          margin: "0 0 10px 0",
                          fontSize: "15px",
                          letterSpacing: "0.12em",
                          textTransform: "uppercase",
                          color: "#caa15a",
                        }}
                      >
                        Comunidade do curso
                      </p>

                      <h2
                        style={{
                          margin: "0 0 10px 0",
                          fontFamily: "Cinzel, serif",
                          fontSize: "32px",
                          color: "#e6c27a",
                          fontWeight: 500,
                        }}
                      >
                        {comunidade.titulo || "Comunidade sem título"}
                      </h2>

                      <p
                        style={{
                          margin: "0 0 8px 0",
                          fontSize: "21px",
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
                        Curso associado: {curso?.titulo || "Curso não encontrado"}
                      </p>
                    </div>

                    <div
                      style={{
                        display: "grid",
                        gap: "10px",
                        minWidth: "180px",
                      }}
                    >
                      <StatusBox
                        label="Estado"
                        valor={comunidade.ativa ? "Ativa" : "Inativa"}
                      />
                      <StatusBox
                        label="Tópicos"
                        valor={String(totalTopicosComunidade)}
                      />
                      <StatusBox
                        label="Publicação do curso"
                        valor={curso?.publicado ? "Publicado" : "Rascunho"}
                      />
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      gap: "12px",
                      flexWrap: "wrap",
                    }}
                  >
                    <Link
                      href={`/formadores/comunidades/${comunidade.id}`}
                      style={botao}
                    >
                      Abrir comunidade
                    </Link>

                    <Link
                      href="/formadores/cursos"
                      style={botaoSecundario}
                    >
                      Ver curso
                    </Link>
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
        A carregar comunidades
      </h2>

      <p
        style={{
          margin: 0,
          fontSize: "21px",
          lineHeight: "1.7",
          color: "#d7b06c",
        }}
      >
        A plataforma está a reunir os cursos, comunidades e tópicos associados.
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
  fontSize: "18px",
  background: "transparent",
  cursor: "pointer",
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
};