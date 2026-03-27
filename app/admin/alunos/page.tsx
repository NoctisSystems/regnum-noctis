"use client";

import { CSSProperties, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type Aluno = {
  id: number;
  nome: string | null;
  email: string | null;
  created_at?: string | null;
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
};

type LinhaAluno = {
  id: number;
  nome: string;
  email: string;
  cursos: string[];
  estado: string;
  created_at: string | null;
};

export default function AdminAlunosPage() {
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [pesquisa, setPesquisa] = useState("");

  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [inscricoes, setInscricoes] = useState<Inscricao[]>([]);

  const [mostrarNovoAluno, setMostrarNovoAluno] = useState(false);
  const [aGuardar, setAGuardar] = useState(false);

  const [usarAlunoExistente, setUsarAlunoExistente] = useState(false);
  const [alunoExistenteId, setAlunoExistenteId] = useState("");
  const [cursoId, setCursoId] = useState("");
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");

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
          .select("id, nome, email, created_at")
          .order("nome", { ascending: true }),

        supabase
          .from("cursos")
          .select("id, titulo")
          .order("titulo", { ascending: true }),

        supabase.from("inscricoes").select("id, aluno_id, curso_id, status"),
      ]);

      if (alunosRes.error) throw alunosRes.error;
      if (cursosRes.error) throw cursosRes.error;
      if (inscricoesRes.error) throw inscricoesRes.error;

      setAlunos((alunosRes.data || []) as Aluno[]);
      setCursos((cursosRes.data || []) as Curso[]);
      setInscricoes((inscricoesRes.data || []) as Inscricao[]);
    } catch (err: any) {
      setErro(err?.message || "Não foi possível carregar os alunos.");
    } finally {
      setLoading(false);
    }
  }

  function limparFormulario() {
    setUsarAlunoExistente(false);
    setAlunoExistenteId("");
    setCursoId("");
    setNome("");
    setEmail("");
  }

  async function criarAlunoEInscrever() {
    setErro("");
    setSucesso("");

    if (!cursoId) {
      setErro("Seleciona o curso.");
      return;
    }

    try {
      setAGuardar(true);

      let alunoIdFinal: number | null = null;

      if (usarAlunoExistente) {
        if (!alunoExistenteId) {
          setErro("Seleciona um aluno existente.");
          return;
        }

        alunoIdFinal = Number(alunoExistenteId);
      } else {
        const nomeLimpo = nome.trim();
        const emailLimpo = email.trim().toLowerCase();

        if (!nomeLimpo || !emailLimpo) {
          setErro("Preenche nome e email do aluno.");
          return;
        }

        const alunoExistentePorEmail = alunos.find(
          (aluno) => (aluno.email || "").trim().toLowerCase() === emailLimpo
        );

        if (alunoExistentePorEmail) {
          alunoIdFinal = alunoExistentePorEmail.id;
        } else {
          const { data: novoAluno, error: erroNovoAluno } = await supabase
            .from("alunos")
            .insert({
              nome: nomeLimpo,
              email: emailLimpo,
            })
            .select("id")
            .single();

          if (erroNovoAluno) {
            throw erroNovoAluno;
          }

          alunoIdFinal = novoAluno.id;
        }
      }

      if (!alunoIdFinal) {
        setErro("Não foi possível determinar o aluno.");
        return;
      }

      const jaExisteInscricao = inscricoes.some(
        (item) =>
          item.aluno_id === alunoIdFinal && item.curso_id === Number(cursoId)
      );

      if (jaExisteInscricao) {
        setErro("Este aluno já está associado a este curso.");
        return;
      }

      const { error: erroInscricao } = await supabase.from("inscricoes").insert({
        aluno_id: alunoIdFinal,
        curso_id: Number(cursoId),
        status: "ativo",
      });

      if (erroInscricao) {
        throw erroInscricao;
      }

      setSucesso("Aluno associado ao curso com sucesso.");
      limparFormulario();
      setMostrarNovoAluno(false);
      await carregarDados();
    } catch (err: any) {
      setErro(err?.message || "Não foi possível associar o aluno ao curso.");
    } finally {
      setAGuardar(false);
    }
  }

  function exportarCSV() {
    const linhas = linhasAlunosFiltradas.map((aluno) => ({
      nome: aluno.nome,
      email: aluno.email,
      cursos: aluno.cursos.join(" | "),
      estado: aluno.estado,
    }));

    const cabecalho = ["Nome", "Email", "Cursos", "Estado"];
    const conteudo = [
      cabecalho.join(";"),
      ...linhas.map((linha) =>
        [linha.nome, linha.email, linha.cursos, linha.estado]
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
    link.download = "alunos-regnum-noctis.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  const mapaCursos = useMemo(() => {
    return new Map<number, string>(
      cursos.map((curso) => [curso.id, curso.titulo || "Curso sem título"])
    );
  }, [cursos]);

  const linhasAlunos = useMemo<LinhaAluno[]>(() => {
    return alunos.map((aluno) => {
      const inscricoesDoAluno = inscricoes.filter(
        (inscricao) => inscricao.aluno_id === aluno.id
      );

      const nomesCursos = inscricoesDoAluno
        .map((inscricao) => mapaCursos.get(inscricao.curso_id) || "Curso")
        .filter(Boolean);

      const estados = inscricoesDoAluno
        .map((inscricao) => (inscricao.status || "").trim().toLowerCase())
        .filter(Boolean);

      let estadoFinal = "Sem inscrição";

      if (estados.some((estado) => estado === "ativo" || estado === "activa")) {
        estadoFinal = "Ativo";
      } else if (estados.length > 0) {
        estadoFinal = "Com inscrição";
      }

      return {
        id: aluno.id,
        nome: aluno.nome || "Sem nome",
        email: aluno.email || "Sem email",
        cursos: nomesCursos,
        estado: estadoFinal,
        created_at: aluno.created_at || null,
      };
    });
  }, [alunos, inscricoes, mapaCursos]);

  const linhasAlunosFiltradas = useMemo(() => {
    const termo = pesquisa.trim().toLowerCase();

    if (!termo) return linhasAlunos;

    return linhasAlunos.filter((aluno) => {
      return (
        aluno.nome.toLowerCase().includes(termo) ||
        aluno.email.toLowerCase().includes(termo) ||
        aluno.cursos.join(" ").toLowerCase().includes(termo)
      );
    });
  }, [linhasAlunos, pesquisa]);

  const totalAlunos = alunos.length;
  const inscricoesAtivas = inscricoes.filter((item) =>
    ["ativo", "activa"].includes((item.status || "").trim().toLowerCase())
  ).length;

  const agora = new Date();
  const novosEsteMes = alunos.filter((aluno) => {
    if (!aluno.created_at) return false;
    const data = new Date(aluno.created_at);
    return (
      data.getFullYear() === agora.getFullYear() &&
      data.getMonth() === agora.getMonth()
    );
  }).length;

  return (
    <main style={pagina}>
      <section style={hero}>
        <p style={kicker}>Administração</p>
        <h1 style={titulo}>Alunos</h1>
        <p style={descricao}>
          Gestão de alunos, associação manual a cursos e exportação da listagem.
        </p>
      </section>

      <section style={gridMetricas}>
        <div style={card}>
          <h3 style={cardTitle}>Total de alunos</h3>
          <p style={cardValue}>{loading ? "..." : totalAlunos}</p>
        </div>

        <div style={card}>
          <h3 style={cardTitle}>Inscrições ativas</h3>
          <p style={cardValue}>{loading ? "..." : inscricoesAtivas}</p>
        </div>

        <div style={card}>
          <h3 style={cardTitle}>Novos este mês</h3>
          <p style={cardValue}>{loading ? "..." : novosEsteMes}</p>
        </div>
      </section>

      {erro ? <div style={caixaErro}>{erro}</div> : null}
      {sucesso ? <div style={caixaSucesso}>{sucesso}</div> : null}

      <section style={barraTopo}>
        <input
          type="text"
          placeholder="Pesquisar aluno..."
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
              setMostrarNovoAluno((prev) => !prev);
              setErro("");
              setSucesso("");
            }}
          >
            {mostrarNovoAluno ? "Fechar" : "Novo aluno"}
          </button>
        </div>
      </section>

      {mostrarNovoAluno ? (
        <section style={boxFormulario}>
          <h2 style={tituloFormulario}>Inserir aluno num curso</h2>

          <div style={linhaRadios}>
            <label style={radioLabel}>
              <input
                type="radio"
                checked={!usarAlunoExistente}
                onChange={() => {
                  setUsarAlunoExistente(false);
                  setAlunoExistenteId("");
                }}
                style={{ accentColor: "#a6783d" }}
              />
              Criar aluno novo
            </label>

            <label style={radioLabel}>
              <input
                type="radio"
                checked={usarAlunoExistente}
                onChange={() => setUsarAlunoExistente(true)}
                style={{ accentColor: "#a6783d" }}
              />
              Usar aluno existente
            </label>
          </div>

          <div style={gridFormulario}>
            {usarAlunoExistente ? (
              <div>
                <label style={label}>Aluno</label>
                <select
                  value={alunoExistenteId}
                  onChange={(e) => setAlunoExistenteId(e.target.value)}
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
            ) : (
              <>
                <div>
                  <label style={label}>Nome do aluno</label>
                  <input
                    type="text"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    style={input}
                    placeholder="Nome"
                  />
                </div>

                <div>
                  <label style={label}>Email do aluno</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={input}
                    placeholder="Email"
                  />
                </div>
              </>
            )}

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
          </div>

          <div style={acoesFormulario}>
            <button
              type="button"
              style={{
                ...button,
                opacity: aGuardar ? 0.7 : 1,
                cursor: aGuardar ? "not-allowed" : "pointer",
              }}
              disabled={aGuardar}
              onClick={criarAlunoEInscrever}
            >
              {aGuardar ? "A guardar..." : "Guardar inscrição"}
            </button>

            <button
              type="button"
              style={buttonSecundario}
              onClick={() => {
                limparFormulario();
                setMostrarNovoAluno(false);
              }}
            >
              Cancelar
            </button>
          </div>
        </section>
      ) : null}

      <section style={listaCards}>
        {loading ? (
          <div style={linhaVazia}>A carregar alunos...</div>
        ) : linhasAlunosFiltradas.length === 0 ? (
          <div style={linhaVazia}>Ainda não existem alunos registados.</div>
        ) : (
          linhasAlunosFiltradas.map((aluno) => (
            <article key={aluno.id} style={cardLinha}>
              <div style={cardLinhaHeader}>
                <div>
                  <h3 style={nomeLinha}>{aluno.nome}</h3>
                  <p style={subLinha}>{aluno.email}</p>
                </div>

                <span style={badgeEstado}>{aluno.estado}</span>
              </div>

              <div style={gridInfo}>
                <div style={infoBloco}>
                  <p style={infoLabel}>Cursos</p>
                  <p style={infoValor}>
                    {aluno.cursos.length > 0
                      ? aluno.cursos.join(", ")
                      : "Sem cursos"}
                  </p>
                </div>

                <div style={infoBloco}>
                  <p style={infoLabel}>Registo</p>
                  <p style={infoValor}>
                    {aluno.created_at
                      ? new Date(aluno.created_at).toLocaleDateString("pt-PT")
                      : "—"}
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
  fontSize: "clamp(18px, 2.4vw, 21px)",
  lineHeight: 1.7,
  maxWidth: "900px",
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
  margin: "0 0 12px 0",
  color: "#e6c27a",
};

const cardValue: CSSProperties = {
  margin: 0,
  fontSize: "clamp(30px, 5vw, 40px)",
  fontFamily: "Cinzel, serif",
  color: "#e6c27a",
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

const linhaRadios: CSSProperties = {
  display: "flex",
  gap: "18px",
  flexWrap: "wrap",
  marginBottom: "20px",
};

const radioLabel: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  color: "#e6c27a",
  fontSize: "17px",
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

const badgeEstado: CSSProperties = {
  border: "1px solid rgba(166,120,61,0.5)",
  padding: "8px 12px",
  color: "#e6c27a",
  fontSize: "14px",
  textTransform: "uppercase",
  letterSpacing: "1px",
  background: "rgba(38,20,15,0.35)",
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