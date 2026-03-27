"use client";

import { CSSProperties, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type Aluno = {
  id: number;
  nome: string | null;
  email: string | null;
};

type Curso = {
  id: number;
  titulo: string | null;
};

type Inscricao = {
  id: number;
  aluno_id: number;
  curso_id: number;
  status: string | null;
  created_at?: string | null;
};

type LinhaInscricao = {
  id: number;
  alunoNome: string;
  alunoEmail: string;
  cursoTitulo: string;
  status: string;
  createdAt: string | null;
};

export default function AdminInscricoesPage() {
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [pesquisa, setPesquisa] = useState("");

  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [inscricoes, setInscricoes] = useState<Inscricao[]>([]);

  const [mostrarNovaInscricao, setMostrarNovaInscricao] = useState(false);
  const [aGuardarNova, setAGuardarNova] = useState(false);
  const [savingStatusId, setSavingStatusId] = useState<number | null>(null);

  const [alunoId, setAlunoId] = useState("");
  const [cursoId, setCursoId] = useState("");
  const [statusNovo, setStatusNovo] = useState("ativo");

  useEffect(() => {
    carregarDados();
  }, []);

  async function carregarDados() {
    setLoading(true);
    setErro("");
    setSucesso("");

    try {
      const [alunosRes, cursosRes, inscricoesRes] = await Promise.all([
        supabase
          .from("alunos")
          .select("id, nome, email")
          .order("nome", { ascending: true }),

        supabase
          .from("cursos")
          .select("id, titulo")
          .order("titulo", { ascending: true }),

        supabase
          .from("inscricoes")
          .select("id, aluno_id, curso_id, status, created_at")
          .order("id", { ascending: false }),
      ]);

      if (alunosRes.error) throw alunosRes.error;
      if (cursosRes.error) throw cursosRes.error;
      if (inscricoesRes.error) throw inscricoesRes.error;

      setAlunos((alunosRes.data || []) as Aluno[]);
      setCursos((cursosRes.data || []) as Curso[]);
      setInscricoes((inscricoesRes.data || []) as Inscricao[]);
    } catch (err: any) {
      setErro(err?.message || "Não foi possível carregar as inscrições.");
    } finally {
      setLoading(false);
    }
  }

  function limparFormulario() {
    setAlunoId("");
    setCursoId("");
    setStatusNovo("ativo");
  }

  async function criarInscricao() {
    setErro("");
    setSucesso("");

    if (!alunoId) {
      setErro("Seleciona o aluno.");
      return;
    }

    if (!cursoId) {
      setErro("Seleciona o curso.");
      return;
    }

    const alunoIdNum = Number(alunoId);
    const cursoIdNum = Number(cursoId);

    const jaExiste = inscricoes.some(
      (item) => item.aluno_id === alunoIdNum && item.curso_id === cursoIdNum
    );

    if (jaExiste) {
      setErro("Este aluno já está inscrito neste curso.");
      return;
    }

    try {
      setAGuardarNova(true);

      const { error } = await supabase.from("inscricoes").insert({
        aluno_id: alunoIdNum,
        curso_id: cursoIdNum,
        status: statusNovo,
      });

      if (error) throw error;

      setSucesso("Inscrição criada com sucesso.");
      limparFormulario();
      setMostrarNovaInscricao(false);
      await carregarDados();
    } catch (err: any) {
      setErro(err?.message || "Não foi possível criar a inscrição.");
    } finally {
      setAGuardarNova(false);
    }
  }

  async function atualizarStatus(inscricaoId: number, novoStatus: string) {
    setErro("");
    setSucesso("");

    try {
      setSavingStatusId(inscricaoId);

      const { error } = await supabase
        .from("inscricoes")
        .update({ status: novoStatus })
        .eq("id", inscricaoId);

      if (error) throw error;

      setInscricoes((prev) =>
        prev.map((item) =>
          item.id === inscricaoId ? { ...item, status: novoStatus } : item
        )
      );

      setSucesso("Estado da inscrição atualizado com sucesso.");
    } catch (err: any) {
      setErro(err?.message || "Não foi possível atualizar a inscrição.");
    } finally {
      setSavingStatusId(null);
    }
  }

  function exportarCSV() {
    const linhas = linhasFiltradas.map((linha) => ({
      aluno: linha.alunoNome,
      email: linha.alunoEmail,
      curso: linha.cursoTitulo,
      status: linha.status,
      data: formatarData(linha.createdAt),
    }));

    const cabecalho = ["Aluno", "Email", "Curso", "Estado", "Data"];
    const conteudo = [
      cabecalho.join(";"),
      ...linhas.map((linha) =>
        [linha.aluno, linha.email, linha.curso, linha.status, linha.data]
          .map((valor) => `"${String(valor || "").replace(/"/g, '""')}"`)
          .join(";")
      ),
    ].join("\n");

    const blob = new Blob([conteudo], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "inscricoes-regnum-noctis.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  const mapaAlunos = useMemo(() => {
    return new Map<number, Aluno>(alunos.map((aluno) => [aluno.id, aluno]));
  }, [alunos]);

  const mapaCursos = useMemo(() => {
    return new Map<number, Curso>(cursos.map((curso) => [curso.id, curso]));
  }, [cursos]);

  const linhasInscricoes = useMemo<LinhaInscricao[]>(() => {
    return inscricoes.map((inscricao) => {
      const aluno = mapaAlunos.get(inscricao.aluno_id);
      const curso = mapaCursos.get(inscricao.curso_id);

      return {
        id: inscricao.id,
        alunoNome: aluno?.nome || "Aluno sem nome",
        alunoEmail: aluno?.email || "Sem email",
        cursoTitulo: curso?.titulo || "Curso sem título",
        status: inscricao.status || "ativo",
        createdAt: inscricao.created_at || null,
      };
    });
  }, [inscricoes, mapaAlunos, mapaCursos]);

  const linhasFiltradas = useMemo(() => {
    const termo = pesquisa.trim().toLowerCase();

    if (!termo) return linhasInscricoes;

    return linhasInscricoes.filter((linha) => {
      return (
        linha.alunoNome.toLowerCase().includes(termo) ||
        linha.alunoEmail.toLowerCase().includes(termo) ||
        linha.cursoTitulo.toLowerCase().includes(termo) ||
        linha.status.toLowerCase().includes(termo)
      );
    });
  }, [linhasInscricoes, pesquisa]);

  const totalInscricoes = inscricoes.length;
  const inscricoesAtivas = inscricoes.filter((item) =>
    ["ativo", "activa"].includes((item.status || "").trim().toLowerCase())
  ).length;
  const inscricoesConcluidas = inscricoes.filter(
    (item) => (item.status || "").trim().toLowerCase() === "concluido"
  ).length;

  return (
    <main style={pagina}>
      <section style={hero}>
        <p style={kicker}>Administração</p>
        <h1 style={titulo}>Inscrições</h1>
        <p style={descricao}>
          Gestão manual das inscrições entre alunos e cursos.
        </p>
      </section>

      <section style={gridMetricas}>
        <div style={card}>
          <h3 style={cardTitle}>Total de inscrições</h3>
          <p style={cardValue}>{loading ? "..." : totalInscricoes}</p>
        </div>

        <div style={card}>
          <h3 style={cardTitle}>Inscrições ativas</h3>
          <p style={cardValue}>{loading ? "..." : inscricoesAtivas}</p>
        </div>

        <div style={card}>
          <h3 style={cardTitle}>Concluídas</h3>
          <p style={cardValue}>{loading ? "..." : inscricoesConcluidas}</p>
        </div>
      </section>

      {erro ? <div style={caixaErro}>{erro}</div> : null}
      {sucesso ? <div style={caixaSucesso}>{sucesso}</div> : null}

      <section style={barraTopo}>
        <input
          type="text"
          placeholder="Pesquisar inscrição..."
          value={pesquisa}
          onChange={(e) => setPesquisa(e.target.value)}
          style={inputPesquisa}
        />

        <div style={acoesTopo}>
          <button type="button" style={buttonSecundario} onClick={exportarCSV}>
            Exportar
          </button>

          <button
            type="button"
            style={button}
            onClick={() => {
              setMostrarNovaInscricao((prev) => !prev);
              setErro("");
              setSucesso("");
            }}
          >
            {mostrarNovaInscricao ? "Fechar" : "Nova inscrição"}
          </button>
        </div>
      </section>

      {mostrarNovaInscricao ? (
        <section style={boxFormulario}>
          <h2 style={tituloFormulario}>Criar inscrição manual</h2>

          <div style={gridFormulario}>
            <div>
              <label style={label}>Aluno</label>
              <select
                value={alunoId}
                onChange={(e) => setAlunoId(e.target.value)}
                style={input}
              >
                <option value="">Selecionar aluno</option>
                {alunos.map((aluno) => (
                  <option key={aluno.id} value={aluno.id}>
                    {(aluno.nome || "Sem nome") +
                      " — " +
                      (aluno.email || "Sem email")}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={label}>Curso</label>
              <select
                value={cursoId}
                onChange={(e) => setCursoId(e.target.value)}
                style={input}
              >
                <option value="">Selecionar curso</option>
                {cursos.map((curso) => (
                  <option key={curso.id} value={curso.id}>
                    {curso.titulo || "Curso sem título"}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={label}>Estado</label>
              <select
                value={statusNovo}
                onChange={(e) => setStatusNovo(e.target.value)}
                style={input}
              >
                <option value="ativo">Ativo</option>
                <option value="inativo">Inativo</option>
                <option value="cancelado">Cancelado</option>
                <option value="concluido">Concluído</option>
              </select>
            </div>
          </div>

          <div style={acoesFormulario}>
            <button
              type="button"
              style={{
                ...button,
                opacity: aGuardarNova ? 0.7 : 1,
                cursor: aGuardarNova ? "not-allowed" : "pointer",
              }}
              disabled={aGuardarNova}
              onClick={criarInscricao}
            >
              {aGuardarNova ? "A guardar..." : "Guardar inscrição"}
            </button>

            <button
              type="button"
              style={buttonSecundario}
              onClick={() => {
                limparFormulario();
                setMostrarNovaInscricao(false);
              }}
            >
              Cancelar
            </button>
          </div>
        </section>
      ) : null}

      <section style={listaCards}>
        {loading ? (
          <div style={linhaVazia}>A carregar inscrições...</div>
        ) : linhasFiltradas.length === 0 ? (
          <div style={linhaVazia}>Ainda não existem inscrições registadas.</div>
        ) : (
          linhasFiltradas.map((linha) => (
            <article key={linha.id} style={cardLinha}>
              <div style={cardLinhaHeader}>
                <div>
                  <h3 style={nomeLinha}>{linha.alunoNome}</h3>
                  <p style={subLinha}>{linha.alunoEmail}</p>
                </div>

                <select
                  value={linha.status}
                  onChange={(e) => atualizarStatus(linha.id, e.target.value)}
                  disabled={savingStatusId === linha.id}
                  style={{
                    ...inputTabela,
                    minWidth: "180px",
                    opacity: savingStatusId === linha.id ? 0.7 : 1,
                  }}
                >
                  <option value="ativo">Ativo</option>
                  <option value="inativo">Inativo</option>
                  <option value="cancelado">Cancelado</option>
                  <option value="concluido">Concluído</option>
                </select>
              </div>

              <div style={gridInfo}>
                <div style={infoBloco}>
                  <p style={infoLabel}>Curso</p>
                  <p style={infoValor}>{linha.cursoTitulo}</p>
                </div>

                <div style={infoBloco}>
                  <p style={infoLabel}>Data</p>
                  <p style={infoValor}>{formatarData(linha.createdAt)}</p>
                </div>

                <div style={infoBloco}>
                  <p style={infoLabel}>Ações</p>
                  <p style={infoValor}>
                    {savingStatusId === linha.id
                      ? "A guardar..."
                      : "Atualização direta"}
                  </p>
                </div>
              </div>
            </article>
          ))
        )}
      </section>
    </main>
  );
}

function formatarData(valor: string | null) {
  if (!valor) return "—";

  const data = new Date(valor);

  if (Number.isNaN(data.getTime())) return "—";

  return data.toLocaleDateString("pt-PT");
}

const pagina: CSSProperties = {
  display: "grid",
  gap: "24px",
};

const hero: CSSProperties = {
  display: "grid",
  gap: "10px",
};

const kicker: CSSProperties = {
  margin: 0,
  fontSize: "14px",
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  color: "#caa15a",
};

const titulo: CSSProperties = {
  fontFamily: "Cinzel, serif",
  fontSize: "clamp(34px, 5vw, 48px)",
  margin: 0,
  color: "#e6c27a",
};

const descricao: CSSProperties = {
  margin: 0,
  color: "#d7b06c",
  fontSize: "clamp(18px, 2.2vw, 21px)",
  lineHeight: 1.7,
};

const gridMetricas: CSSProperties = {
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

const input: CSSProperties = {
  width: "100%",
  padding: "12px 14px",
  border: "1px solid #8a5d31",
  background: "#140d09",
  color: "#e6c27a",
  fontSize: "17px",
  outline: "none",
};

const inputTabela: CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  border: "1px solid #8a5d31",
  background: "#140d09",
  color: "#e6c27a",
  fontSize: "15px",
  outline: "none",
};

const label: CSSProperties = {
  display: "block",
  marginBottom: "8px",
  color: "#caa15a",
  fontSize: "14px",
  textTransform: "uppercase",
  letterSpacing: "1px",
};

const button: CSSProperties = {
  padding: "12px 18px",
  border: "1px solid #a6783d",
  background: "#a6783d",
  color: "#140d09",
  fontSize: "17px",
  cursor: "pointer",
  minHeight: "46px",
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

const boxFormulario: CSSProperties = {
  border: "1px solid #a6783d",
  background: "linear-gradient(145deg, #1a0f0a, #140d09)",
  padding: "20px",
  boxShadow: "0 0 20px rgba(166, 120, 61, 0.12)",
};

const tituloFormulario: CSSProperties = {
  fontFamily: "Cinzel, serif",
  fontSize: "clamp(24px, 4vw, 30px)",
  marginTop: 0,
  marginBottom: "18px",
  color: "#e6c27a",
};

const gridFormulario: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
  gap: "16px",
  marginBottom: "18px",
};

const acoesFormulario: CSSProperties = {
  display: "flex",
  gap: "12px",
  flexWrap: "wrap",
};

const listaCards: CSSProperties = {
  display: "grid",
  gap: "14px",
};

const cardLinha: CSSProperties = {
  border: "1px solid #a6783d",
  background: "#140d09",
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

const nomeLinha: CSSProperties = {
  margin: "0 0 6px 0",
  color: "#f2d38f",
  fontSize: "22px",
  lineHeight: 1.3,
};

const subLinha: CSSProperties = {
  margin: 0,
  color: "#d7b06c",
  fontSize: "17px",
  lineHeight: 1.6,
  wordBreak: "break-word",
};

const gridInfo: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "12px",
};

const infoBloco: CSSProperties = {
  border: "1px solid rgba(166,120,61,0.24)",
  background: "rgba(38,20,15,0.35)",
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
  border: "1px solid #a6783d",
  background: "#140d09",
  padding: "28px 18px",
  textAlign: "center",
  color: "#caa15a",
  fontSize: "21px",
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