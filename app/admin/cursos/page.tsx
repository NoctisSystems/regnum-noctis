"use client";

import Link from "next/link";
import { CSSProperties, useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type Curso = {
  id: number;
  titulo: string | null;
  descricao: string | null;
  publicado: boolean | null;
  created_at: string | null;
  updated_at: string | null;
  tipo_produto: string | null;
  preco: number | null;
  preco_eur: number | null;
  preco_brl: number | null;
  formador_id: number | null;
};

type Formador = {
  id: number;
  nome: string | null;
  email: string | null;
};

type LinhaCurso = {
  id: number;
  titulo: string;
  descricao: string;
  publicado: boolean;
  tipoProduto: string;
  precoEur: number;
  precoBrl: number;
  formadorNome: string;
  createdAt: string | null;
  updatedAt: string | null;
};

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

function formatarData(valor: string | null) {
  if (!valor) return "—";

  const data = new Date(valor);

  if (Number.isNaN(data.getTime())) return "—";

  return data.toLocaleDateString("pt-PT");
}

function formatarEuro(valor: number) {
  return new Intl.NumberFormat("pt-PT", {
    style: "currency",
    currency: "EUR",
  }).format(valor || 0);
}

export default function AdminCursosPage() {
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [pesquisa, setPesquisa] = useState("");
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [formadores, setFormadores] = useState<Formador[]>([]);

  const carregarDados = useCallback(async () => {
    setLoading(true);
    setErro("");
    setSucesso("");

    try {
      const [cursosRes, formadoresRes] = await Promise.all([
        supabase
          .from("cursos")
          .select(
            "id, titulo, descricao, publicado, created_at, updated_at, tipo_produto, preco, preco_eur, preco_brl, formador_id"
          )
          .order("id", { ascending: false }),

        supabase
          .from("formadores")
          .select("id, nome, email")
          .order("nome", { ascending: true }),
      ]);

      if (cursosRes.error) throw cursosRes.error;
      if (formadoresRes.error) throw formadoresRes.error;

      setCursos((cursosRes.data || []) as Curso[]);
      setFormadores((formadoresRes.data || []) as Formador[]);
    } catch (err: unknown) {
      setErro(getErrorMessage(err, "Não foi possível carregar os cursos."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void carregarDados();
  }, [carregarDados]);

  const mapaFormadores = useMemo(() => {
    return new Map<number, Formador>(
      formadores.map((formador) => [formador.id, formador])
    );
  }, [formadores]);

  const linhasCursos = useMemo<LinhaCurso[]>(() => {
    return cursos.map((curso) => {
      const formador = curso.formador_id
        ? mapaFormadores.get(curso.formador_id)
        : null;

      return {
        id: curso.id,
        titulo: curso.titulo?.trim() || "Curso sem título",
        descricao: curso.descricao?.trim() || "Sem descrição.",
        publicado: Boolean(curso.publicado),
        tipoProduto: curso.tipo_produto || "—",
        precoEur: Number(curso.preco_eur ?? curso.preco ?? 0),
        precoBrl: Number(curso.preco_brl ?? 0),
        formadorNome: formador?.nome || "Sem formador associado",
        createdAt: curso.created_at,
        updatedAt: curso.updated_at,
      };
    });
  }, [cursos, mapaFormadores]);

  const linhasFiltradas = useMemo(() => {
    const termo = pesquisa.trim().toLowerCase();

    if (!termo) return linhasCursos;

    return linhasCursos.filter((linha) => {
      return (
        String(linha.id).includes(termo) ||
        linha.titulo.toLowerCase().includes(termo) ||
        linha.descricao.toLowerCase().includes(termo) ||
        linha.tipoProduto.toLowerCase().includes(termo) ||
        linha.formadorNome.toLowerCase().includes(termo) ||
        (linha.publicado ? "publicado" : "rascunho").includes(termo)
      );
    });
  }, [linhasCursos, pesquisa]);

  const totalCursos = cursos.length;
  const totalPublicados = cursos.filter((curso) => curso.publicado).length;
  const totalRascunhos = cursos.filter((curso) => !curso.publicado).length;
  const totalPendentes = 0;

  function exportarCSV() {
    const linhas = linhasFiltradas.map((linha) => ({
      id: linha.id,
      titulo: linha.titulo,
      formador: linha.formadorNome,
      tipo: linha.tipoProduto,
      estado: linha.publicado ? "Publicado" : "Rascunho",
      preco_eur: formatarEuro(linha.precoEur),
      criado_em: formatarData(linha.createdAt),
      atualizado_em: formatarData(linha.updatedAt),
    }));

    const cabecalho = [
      "ID",
      "Título",
      "Formador",
      "Tipo",
      "Estado",
      "Preço EUR",
      "Criado em",
      "Atualizado em",
    ];

    const conteudo = [
      cabecalho.join(";"),
      ...linhas.map((linha) =>
        [
          linha.id,
          linha.titulo,
          linha.formador,
          linha.tipo,
          linha.estado,
          linha.preco_eur,
          linha.criado_em,
          linha.atualizado_em,
        ]
          .map((valor) => `"${String(valor ?? "").replace(/"/g, '""')}"`)
          .join(";")
      ),
    ].join("\n");

    const blob = new Blob([conteudo], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "cursos-regnum-noctis.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main style={pagina}>
      <section>
        <p style={eyebrow}>Administração</p>

        <h1 style={titulo}>Cursos</h1>

        <p style={descricao}>
          Visão geral da área de cursos da administração.
        </p>
      </section>

      <section style={cardsGrid}>
        <div style={card}>
          <h3 style={cardTitle}>Total de cursos</h3>
          <p style={cardValue}>{loading ? "..." : totalCursos}</p>
        </div>

        <div style={card}>
          <h3 style={cardTitle}>Publicados</h3>
          <p style={cardValue}>{loading ? "..." : totalPublicados}</p>
        </div>

        <div style={card}>
          <h3 style={cardTitle}>Pendentes</h3>
          <p style={cardValue}>{loading ? "..." : totalPendentes}</p>
        </div>

        <div style={card}>
          <h3 style={cardTitle}>Rascunhos</h3>
          <p style={cardValue}>{loading ? "..." : totalRascunhos}</p>
        </div>
      </section>

      {erro ? <div style={caixaErro}>{erro}</div> : null}
      {sucesso ? <div style={caixaSucesso}>{sucesso}</div> : null}

      <section style={barraTopo}>
        <input
          type="text"
          placeholder="Pesquisar curso..."
          value={pesquisa}
          onChange={(e) => setPesquisa(e.target.value)}
          style={inputPesquisa}
        />

        <div style={acoesTopo}>
          <button
            type="button"
            style={buttonSecundario}
            onClick={exportarCSV}
          >
            Exportar
          </button>

          <button
            type="button"
            style={buttonSecundario}
            onClick={() => void carregarDados()}
          >
            Atualizar
          </button>

          <Link href="/formadores/criar-curso" style={buttonLink}>
            Criar curso
          </Link>
        </div>
      </section>

      <section style={box}>
        {loading ? (
          <div style={linhaVazia}>A carregar cursos...</div>
        ) : linhasFiltradas.length === 0 ? (
          <div style={linhaVazia}>Ainda não existem cursos registados.</div>
        ) : (
          <div style={lista}>
            {linhasFiltradas.map((linha) => (
              <article key={linha.id} style={cardLinha}>
                <div style={cardLinhaHeader}>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <p style={miniLabel}>Curso #{linha.id}</p>
                    <h2 style={nomeLinha}>{linha.titulo}</h2>
                    <p style={subLinha}>{linha.descricao}</p>
                  </div>

                  <span
                    style={{
                      ...badgeEstado,
                      border: linha.publicado
                        ? "1px solid rgba(74,222,128,0.35)"
                        : "1px solid rgba(166,120,61,0.45)",
                      background: linha.publicado
                        ? "rgba(20,90,40,0.18)"
                        : "rgba(38,20,15,0.35)",
                      color: linha.publicado ? "#c8ffd7" : "#e6c27a",
                    }}
                  >
                    {linha.publicado ? "Publicado" : "Rascunho"}
                  </span>
                </div>

                <div style={gridInfo}>
                  <div style={infoBloco}>
                    <p style={infoLabel}>Formador</p>
                    <p style={infoValor}>{linha.formadorNome}</p>
                  </div>

                  <div style={infoBloco}>
                    <p style={infoLabel}>Tipo</p>
                    <p style={infoValor}>{linha.tipoProduto}</p>
                  </div>

                  <div style={infoBloco}>
                    <p style={infoLabel}>Preço EUR</p>
                    <p style={infoValor}>{formatarEuro(linha.precoEur)}</p>
                  </div>

                  <div style={infoBloco}>
                    <p style={infoLabel}>Preço BRL</p>
                    <p style={infoValor}>
                      {linha.precoBrl > 0 ? linha.precoBrl : "—"}
                    </p>
                  </div>

                  <div style={infoBloco}>
                    <p style={infoLabel}>Criado em</p>
                    <p style={infoValor}>{formatarData(linha.createdAt)}</p>
                  </div>

                  <div style={infoBloco}>
                    <p style={infoLabel}>Atualizado em</p>
                    <p style={infoValor}>{formatarData(linha.updatedAt)}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

const pagina: CSSProperties = {
  display: "grid",
  gap: "24px",
};

const eyebrow: CSSProperties = {
  margin: "0 0 10px 0",
  fontSize: "14px",
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  color: "#caa15a",
};

const titulo: CSSProperties = {
  fontFamily: "Cinzel, serif",
  fontSize: "clamp(34px, 5vw, 48px)",
  margin: "0 0 14px 0",
  color: "#e6c27a",
};

const descricao: CSSProperties = {
  margin: 0,
  color: "#d7b06c",
  fontSize: "clamp(18px, 2.2vw, 21px)",
  lineHeight: 1.7,
  maxWidth: "900px",
};

const cardsGrid: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "18px",
};

const card: CSSProperties = {
  border: "1px solid #a6783d",
  padding: "20px",
  background: "linear-gradient(145deg, #1a0f0a, #140d09)",
  boxShadow: "0 0 20px rgba(166, 120, 61, 0.12)",
};

const cardTitle: CSSProperties = {
  fontSize: "20px",
  marginBottom: "12px",
  color: "#e6c27a",
};

const cardValue: CSSProperties = {
  fontSize: "clamp(30px, 5vw, 40px)",
  fontFamily: "Cinzel, serif",
  color: "#e6c27a",
  margin: 0,
  lineHeight: 1.1,
};

const barraTopo: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "stretch",
  gap: "12px",
  flexWrap: "wrap",
};

const acoesTopo: CSSProperties = {
  display: "flex",
  gap: "12px",
  flexWrap: "wrap",
};

const inputPesquisa: CSSProperties = {
  minWidth: "260px",
  flex: 1,
  width: "100%",
  maxWidth: "100%",
  padding: "12px 14px",
  border: "1px solid #a6783d",
  background: "#140d09",
  color: "#e6c27a",
  fontSize: "17px",
  outline: "none",
};

const buttonSecundario: CSSProperties = {
  padding: "12px 18px",
  border: "1px solid #a6783d",
  background: "transparent",
  color: "#e6c27a",
  fontSize: "17px",
  cursor: "pointer",
  minHeight: "46px",
};

const buttonLink: CSSProperties = {
  padding: "12px 18px",
  border: "1px solid #a6783d",
  background: "#a6783d",
  color: "#140d09",
  fontSize: "17px",
  textDecoration: "none",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: "46px",
};

const box: CSSProperties = {
  border: "1px solid #a6783d",
  background: "#140d09",
  overflow: "hidden",
};

const lista: CSSProperties = {
  display: "grid",
  gap: "14px",
  padding: "16px",
};

const cardLinha: CSSProperties = {
  border: "1px solid #8a5d31",
  background: "rgba(38,20,15,0.35)",
  padding: "18px",
};

const cardLinhaHeader: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "12px",
  flexWrap: "wrap",
  marginBottom: "14px",
};

const miniLabel: CSSProperties = {
  margin: "0 0 8px 0",
  fontSize: "13px",
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  color: "#caa15a",
};

const nomeLinha: CSSProperties = {
  margin: "0 0 8px 0",
  color: "#f2d38f",
  fontSize: "26px",
  lineHeight: 1.2,
  fontFamily: "Cinzel, serif",
  fontWeight: 500,
};

const subLinha: CSSProperties = {
  margin: 0,
  color: "#d7b06c",
  fontSize: "17px",
  lineHeight: 1.7,
  wordBreak: "break-word",
};

const badgeEstado: CSSProperties = {
  display: "inline-block",
  padding: "8px 12px",
  fontSize: "14px",
  textTransform: "uppercase",
  letterSpacing: "1px",
};

const gridInfo: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "12px",
};

const infoBloco: CSSProperties = {
  border: "1px solid rgba(166,120,61,0.24)",
  background: "rgba(20,13,9,0.45)",
  padding: "14px",
};

const infoLabel: CSSProperties = {
  margin: "0 0 8px 0",
  color: "#caa15a",
  fontSize: "13px",
  textTransform: "uppercase",
  letterSpacing: "1px",
};

const infoValor: CSSProperties = {
  margin: 0,
  color: "#e6c27a",
  fontSize: "17px",
  lineHeight: 1.6,
  wordBreak: "break-word",
};

const linhaVazia: CSSProperties = {
  padding: "28px 18px",
  textAlign: "center",
  color: "#caa15a",
  fontSize: "21px",
  borderTop: "1px solid #8a5d31",
};

const caixaErro: CSSProperties = {
  border: "1px solid rgba(255,107,107,0.35)",
  background: "rgba(120,20,20,0.12)",
  padding: "16px 18px",
  color: "#ffb4b4",
  fontSize: "18px",
  lineHeight: 1.6,
};

const caixaSucesso: CSSProperties = {
  border: "1px solid rgba(74,222,128,0.35)",
  background: "rgba(20,90,40,0.12)",
  padding: "16px 18px",
  color: "#bff1bf",
  fontSize: "18px",
  lineHeight: 1.6,
};