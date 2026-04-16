"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
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
  descricao: string | null;
  tipo_produto: string | null;
  preco: number | null;
  publicado: boolean | null;
  tem_certificado: boolean | null;
  modo_certificado: string | null;
  certificado_tipo: string | null;
  tem_manual_geral: boolean | null;
  created_at: string | null;
};

type Comunidade = {
  id: number;
  curso_id: number;
};

type Modulo = {
  id: number;
  curso_id: number;
};

type Aula = {
  id: number;
  curso_id: number;
};

export default function CursosFormadorPage() {
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [formador, setFormador] = useState<Formador | null>(null);
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [comunidadesMap, setComunidadesMap] = useState<Record<number, number>>(
    {}
  );
  const [modulosMap, setModulosMap] = useState<Record<number, number>>({});
  const [aulasMap, setAulasMap] = useState<Record<number, number>>({});

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
        .select(
          "id, titulo, descricao, tipo_produto, preco, publicado, tem_certificado, modo_certificado, certificado_tipo, tem_manual_geral, created_at"
        )
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
        setComunidadesMap({});
        setModulosMap({});
        setAulasMap({});
        setLoading(false);
        return;
      }

      const cursoIds = cursosLista.map((curso) => curso.id);

      const { data: comunidadesData } = await supabase
        .from("comunidades")
        .select("id, curso_id")
        .in("curso_id", cursoIds);

      const comunidadesContagem: Record<number, number> = {};
      for (const comunidade of (comunidadesData || []) as Comunidade[]) {
        comunidadesContagem[comunidade.curso_id] =
          (comunidadesContagem[comunidade.curso_id] || 0) + 1;
      }
      setComunidadesMap(comunidadesContagem);

      const { data: modulosData } = await supabase
        .from("modulos")
        .select("id, curso_id")
        .in("curso_id", cursoIds);

      const modulosContagem: Record<number, number> = {};
      for (const modulo of (modulosData || []) as Modulo[]) {
        modulosContagem[modulo.curso_id] =
          (modulosContagem[modulo.curso_id] || 0) + 1;
      }
      setModulosMap(modulosContagem);

      const { data: aulasData } = await supabase
        .from("aulas")
        .select("id, curso_id")
        .in("curso_id", cursoIds);

      const aulasContagem: Record<number, number> = {};
      for (const aula of (aulasData || []) as Aula[]) {
        aulasContagem[aula.curso_id] = (aulasContagem[aula.curso_id] || 0) + 1;
      }
      setAulasMap(aulasContagem);
    } catch {
      setErro("Ocorreu um erro inesperado ao carregar os cursos.");
    } finally {
      setLoading(false);
    }
  }

  const totalCursos = cursos.length;
  const totalPublicados = cursos.filter((curso) => curso.publicado).length;
  const totalRascunhos = cursos.filter((curso) => !curso.publicado).length;
  const totalCertificados = cursos.filter(
    (curso) => curso.tem_certificado
  ).length;

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
            Os Meus Cursos
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
            Consulta os cursos criados, acompanha a sua estrutura interna e
            gere o estado de publicação, comunidade, módulos e aulas.
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
            subtitulo="Cursos criados"
          />
          <MetricCard
            titulo="Publicados"
            valor={String(totalPublicados)}
            subtitulo="Visíveis ao público"
          />
          <MetricCard
            titulo="Rascunhos"
            valor={String(totalRascunhos)}
            subtitulo="Ainda em preparação"
          />
          <MetricCard
            titulo="Certificados"
            valor={String(totalCertificados)}
            subtitulo="Cursos com certificado"
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
                Gestão de cursos
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
                Catálogo do formador
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

              <Link href="/formadores/criar-curso" style={botao}>
                Criar curso
              </Link>
            </div>
          </div>
        </section>

        {loading ? (
          <LoadingBox />
        ) : erro ? (
          <ErrorBox texto={erro} />
        ) : cursos.length === 0 ? (
          <EmptyState
            titulo="Ainda não tens cursos criados"
            descricao="Quando criares o teu primeiro curso, ele aparecerá aqui com acesso à gestão principal, estrutura e restantes áreas internas."
            botaoHref="/formadores/criar-curso"
            botaoTexto="Criar primeiro curso"
          />
        ) : (
          <div
            style={{
              display: "grid",
              gap: "20px",
            }}
          >
            {cursos.map((curso) => (
              <article
                key={curso.id}
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
                        fontSize: "clamp(26px, 4vw, 34px)",
                        color: "#e6c27a",
                        fontWeight: 500,
                      }}
                    >
                      {curso.titulo || "Curso sem título"}
                    </h2>

                    <p
                      style={{
                        margin: "0 0 10px 0",
                        fontSize: "clamp(18px, 2vw, 21px)",
                        color: "#d7b06c",
                        lineHeight: 1.7,
                        maxWidth: "850px",
                      }}
                    >
                      {curso.descricao || "Descrição em atualização."}
                    </p>

                    <p
                      style={{
                        margin: 0,
                        fontSize: "18px",
                        color: "#caa15a",
                      }}
                    >
                      Criado em:{" "}
                      {curso.created_at
                        ? new Date(curso.created_at).toLocaleDateString("pt-PT")
                        : "Data indisponível"}
                    </p>
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gap: "10px",
                      minWidth: "210px",
                      flex: "0 1 260px",
                    }}
                  >
                    <StatusBox
                      label="Tipo"
                      valor={traduzirTipoProduto(curso.tipo_produto)}
                    />
                    <StatusBox
                      label="Estado"
                      valor={curso.publicado ? "Publicado" : "Rascunho"}
                    />
                    <StatusBox
                      label="Preço"
                      valor={
                        typeof curso.preco === "number"
                          ? `${curso.preco.toFixed(2)} €`
                          : "Sem preço"
                      }
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
                    label="Módulos"
                    valor={String(modulosMap[curso.id] || 0)}
                  />
                  <InfoMini
                    label="Aulas"
                    valor={String(aulasMap[curso.id] || 0)}
                  />
                  <InfoMini
                    label="Comunidades"
                    valor={String(comunidadesMap[curso.id] || 0)}
                  />
                  <InfoMini
                    label="Certificado"
                    valor={traduzirCertificado(
                      curso.tem_certificado,
                      curso.modo_certificado,
                      curso.certificado_tipo
                    )}
                  />
                  <InfoMini
                    label="Manual geral"
                    valor={curso.tem_manual_geral ? "Sim" : "Não"}
                  />
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: "12px",
                    flexWrap: "wrap",
                  }}
                >
                  <Link href={`/formadores/cursos/${curso.id}`} style={botao}>
                    Gerir curso
                  </Link>

                  <Link
                    href={`/formadores/cursos/${curso.id}/estrutura`}
                    style={botaoSecundario}
                  >
                    Gerir estrutura
                  </Link>

                  <Link href="/formadores/comunidades" style={botaoSecundario}>
                    Comunidades
                  </Link>

                  <Link href="/formadores/alunos" style={botaoSecundario}>
                    Ver alunos
                  </Link>
                </div>
              </article>
            ))}
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

function traduzirCertificado(
  temCertificado: boolean | null,
  modoCertificado: string | null,
  certificadoTipo: string | null
) {
  if (!temCertificado) return "Não";

  if (modoCertificado === "manual") {
    if (certificadoTipo === "upload_pronto") {
      return "Certificado próprio manual";
    }

    if (certificadoTipo === "modelo_personalizado") {
      return "Modelo próprio manual";
    }

    return "Certificado manual";
  }

  if (modoCertificado === "automatico") {
    return "Certificado automático";
  }

  return "Sim";
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
        A carregar cursos
      </h2>

      <p
        style={{
          margin: 0,
          fontSize: "21px",
          lineHeight: "1.7",
          color: "#d7b06c",
        }}
      >
        A plataforma está a reunir os cursos, módulos, aulas e comunidades
        associadas.
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