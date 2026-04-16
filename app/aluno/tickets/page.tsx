"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type Aluno = {
  id: number;
  nome: string | null;
  email: string | null;
  auth_id: string | null;
};

type InscricaoBase = {
  id: number;
  curso_id: number | null;
};

type Curso = {
  id: number;
  titulo: string | null;
  formador_id: number | null;
};

type Formador = {
  id: number;
  nome: string | null;
};

type Ticket = {
  id: number;
  created_at: string;
  updated_at: string;
  tipo: string;
  estado: string;
  prioridade: string;
  razao: string;
  assunto: string;
  curso_id: number | null;
  formador_id: number | null;
  formador_envolvido: boolean;
};

type FormNovoTicket = {
  inscricao_id: string;
  curso_id: string;
  formador_id: string;
  tipo: string;
  prioridade: string;
  razao: string;
  assunto: string;
  mensagem_inicial: string;
};

const formInicial: FormNovoTicket = {
  inscricao_id: "",
  curso_id: "",
  formador_id: "",
  tipo: "suporte_aluno",
  prioridade: "normal",
  razao: "",
  assunto: "",
  mensagem_inicial: "",
};

export default function AlunoTicketsPage() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  const [aluno, setAluno] = useState<Aluno | null>(null);
  const [inscricoes, setInscricoes] = useState<InscricaoBase[]>([]);
  const [cursosMap, setCursosMap] = useState<Record<number, Curso>>({});
  const [formadoresMap, setFormadoresMap] = useState<Record<number, Formador>>(
    {}
  );
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [form, setForm] = useState<FormNovoTicket>(formInicial);
  const [filtroEstado, setFiltroEstado] = useState("todos");

  useEffect(() => {
    carregarTudo();
  }, []);

  async function encontrarAlunoComRecuperacao(
    userId: string,
    userEmail: string | null | undefined
  ) {
    const { data: porAuthId } = await supabase
      .from("alunos")
      .select("id, nome, email, auth_id")
      .eq("auth_id", userId)
      .maybeSingle();

    if (porAuthId) {
      return porAuthId as Aluno;
    }

    if (!userEmail) {
      return null;
    }

    const { data: porEmail } = await supabase
      .from("alunos")
      .select("id, nome, email, auth_id")
      .eq("email", userEmail)
      .maybeSingle();

    if (!porEmail) {
      return null;
    }

    if (!porEmail.auth_id) {
      const { error: updateError } = await supabase
        .from("alunos")
        .update({ auth_id: userId })
        .eq("id", porEmail.id);

      if (!updateError) {
        return {
          ...(porEmail as Aluno),
          auth_id: userId,
        };
      }
    }

    return porEmail as Aluno;
  }

  async function carregarTudo() {
    setLoading(true);
    setErro("");
    setSucesso("");

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setErro("Não foi possível validar a sessão do aluno.");
        setLoading(false);
        return;
      }

      const alunoData = await encontrarAlunoComRecuperacao(user.id, user.email);

      if (!alunoData) {
        setErro(
          "Não foi possível encontrar o registo do aluno ligado a esta conta."
        );
        setLoading(false);
        return;
      }

      setAluno(alunoData);

      const { data: inscricoesData, error: inscricoesError } = await supabase
        .from("inscricoes")
        .select("id, curso_id")
        .eq("aluno_id", alunoData.id)
        .order("id", { ascending: false });

      if (inscricoesError) {
        throw inscricoesError;
      }

      const inscricoesLista = (inscricoesData || []) as InscricaoBase[];
      setInscricoes(inscricoesLista);

      const cursoIds = Array.from(
        new Set(
          inscricoesLista
            .map((item) => item.curso_id)
            .filter((id): id is number => typeof id === "number")
        )
      );

      if (cursoIds.length > 0) {
        const { data: cursosData, error: cursosError } = await supabase
          .from("cursos")
          .select("id, titulo, formador_id")
          .in("id", cursoIds);

        if (cursosError) {
          throw cursosError;
        }

        const cursosMapLocal: Record<number, Curso> = {};
        (cursosData || []).forEach((curso) => {
          cursosMapLocal[curso.id] = curso as Curso;
        });
        setCursosMap(cursosMapLocal);

        const formadorIds = Array.from(
          new Set(
            (cursosData || [])
              .map((curso) => curso.formador_id)
              .filter((id): id is number => typeof id === "number")
          )
        );

        if (formadorIds.length > 0) {
          const { data: formadoresData, error: formadoresError } =
            await supabase
              .from("formadores")
              .select("id, nome")
              .in("id", formadorIds);

          if (formadoresError) {
            throw formadoresError;
          }

          const formadoresMapLocal: Record<number, Formador> = {};
          (formadoresData || []).forEach((formador) => {
            formadoresMapLocal[formador.id] = formador as Formador;
          });
          setFormadoresMap(formadoresMapLocal);
        } else {
          setFormadoresMap({});
        }
      } else {
        setCursosMap({});
        setFormadoresMap({});
      }

      const { data: ticketsData, error: ticketsError } = await supabase
        .from("suporte_tickets")
        .select(
          "id, created_at, updated_at, tipo, estado, prioridade, razao, assunto, curso_id, formador_id, formador_envolvido"
        )
        .eq("aluno_id", alunoData.id)
        .order("updated_at", { ascending: false });

      if (ticketsError) {
        throw ticketsError;
      }

      setTickets((ticketsData || []) as Ticket[]);
    } catch (err: any) {
      setErro(err?.message || "Ocorreu um erro ao carregar os tickets.");
    } finally {
      setLoading(false);
    }
  }

  function atualizarForm<K extends keyof FormNovoTicket>(
    campo: K,
    valor: FormNovoTicket[K]
  ) {
    setForm((prev) => ({ ...prev, [campo]: valor }));
  }

  function handleInscricaoChange(inscricaoId: string) {
    const inscricao = inscricoes.find((item) => String(item.id) === inscricaoId);

    if (!inscricao?.curso_id) {
      setForm((prev) => ({
        ...prev,
        inscricao_id: inscricaoId,
        curso_id: "",
        formador_id: "",
      }));
      return;
    }

    const curso = cursosMap[inscricao.curso_id];

    setForm((prev) => ({
      ...prev,
      inscricao_id: inscricaoId,
      curso_id: String(inscricao.curso_id),
      formador_id: curso?.formador_id ? String(curso.formador_id) : "",
    }));
  }

  function validar() {
    if (!form.inscricao_id) return "Seleciona a inscrição / curso.";
    if (!form.curso_id) return "Não foi possível identificar o curso.";
    if (!form.razao.trim()) return "Indica a razão do ticket.";
    if (!form.assunto.trim()) return "Indica o assunto.";
    if (!form.mensagem_inicial.trim()) return "Escreve a mensagem inicial.";
    return "";
  }

  async function abrirTicket(event: FormEvent) {
    event.preventDefault();

    if (!aluno) {
      setErro("Não foi possível identificar o aluno.");
      return;
    }

    const validacao = validar();
    if (validacao) {
      setErro(validacao);
      return;
    }

    setSubmitting(true);
    setErro("");
    setSucesso("");

    try {
      const payload = {
        origem: "aluno",
        tipo: form.tipo,
        estado: "aberto",
        prioridade: form.prioridade,
        aluno_id: aluno.id,
        formador_id: form.formador_id ? Number(form.formador_id) : null,
        curso_id: Number(form.curso_id),
        inscricao_id: Number(form.inscricao_id),
        razao: form.razao.trim(),
        assunto: form.assunto.trim(),
        mensagem_inicial: form.mensagem_inicial.trim(),
        formador_envolvido: false,
      };

      const { data: ticketData, error: ticketError } = await supabase
        .from("suporte_tickets")
        .insert(payload)
        .select("id")
        .single();

      if (ticketError) {
        throw ticketError;
      }

      const { error: mensagemError } = await supabase
        .from("suporte_ticket_mensagens")
        .insert({
          ticket_id: ticketData.id,
          autor_tipo: "aluno",
          autor_aluno_id: aluno.id,
          mensagem: form.mensagem_inicial.trim(),
          visivel_para_aluno: true,
          visivel_para_formador: false,
          visivel_para_admin: true,
        });

      if (mensagemError) {
        throw mensagemError;
      }

      setForm(formInicial);
      setSucesso("Ticket aberto com sucesso.");
      await carregarTudo();
    } catch (err: any) {
      setErro(err?.message || "Não foi possível abrir o ticket.");
    } finally {
      setSubmitting(false);
    }
  }

  const ticketsFiltrados = useMemo(() => {
    if (filtroEstado === "todos") return tickets;
    return tickets.filter((ticket) => ticket.estado === filtroEstado);
  }, [tickets, filtroEstado]);

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top, rgba(166,120,61,0.08), transparent 20%), #2b160f",
        color: "#e6c27a",
        padding: "34px 16px 80px",
        fontFamily: "Cormorant Garamond, serif",
      }}
    >
      <section style={{ maxWidth: "1240px", margin: "0 auto" }}>
        <header style={{ marginBottom: "26px" }}>
          <p
            style={{
              margin: "0 0 10px 0",
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: "#caa15a",
              fontSize: "14px",
            }}
          >
            Área do aluno
          </p>

          <h1
            style={{
              margin: "0 0 14px 0",
              fontFamily: "Cinzel, serif",
              fontSize: "clamp(32px, 6vw, 56px)",
              color: "#f0d79a",
              lineHeight: 1.1,
              fontWeight: 500,
            }}
          >
            Tickets de suporte
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
            Abre tickets formais para qualquer problema relacionado com cursos,
            acessos, pagamentos, certificados ou questões técnicas da
            plataforma.
          </p>
        </header>

        {loading ? (
          <Box>
            <h2 style={tituloSecao}>A carregar tickets</h2>
            <p style={textoBase}>
              Estamos a reunir os teus cursos, inscrições e histórico de
              suporte.
            </p>
          </Box>
        ) : erro && !aluno ? (
          <ErrorBox texto={erro} />
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0, 1.05fr) minmax(320px, 0.95fr)",
              gap: "22px",
            }}
          >
            <div style={{ display: "grid", gap: "22px" }}>
              <Box>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: "14px",
                    flexWrap: "wrap",
                    alignItems: "flex-end",
                    marginBottom: "18px",
                  }}
                >
                  <div>
                    <h2 style={tituloSecao}>Os teus tickets</h2>
                    <p style={textoBase}>
                      Consulta o histórico e acompanha o estado de cada pedido.
                    </p>
                  </div>

                  <label style={{ display: "grid", gap: "8px", minWidth: "220px" }}>
                    <span style={labelStyle}>Estado</span>
                    <select
                      value={filtroEstado}
                      onChange={(event) => setFiltroEstado(event.target.value)}
                      style={fieldStyle}
                    >
                      <option value="todos">Todos</option>
                      <option value="aberto">Aberto</option>
                      <option value="em_analise">Em análise</option>
                      <option value="aguarda_resposta_aluno">
                        Aguarda aluno
                      </option>
                      <option value="aguarda_resposta_formador">
                        Aguarda formador
                      </option>
                      <option value="aguarda_resposta_admin">
                        Aguarda administração
                      </option>
                      <option value="resolvido">Resolvido</option>
                      <option value="fechado">Fechado</option>
                    </select>
                  </label>
                </div>

                {ticketsFiltrados.length === 0 ? (
                  <div style={blocoVazioStyle}>
                    <p style={textoBase}>
                      Ainda não tens tickets registados.
                    </p>
                  </div>
                ) : (
                  <div style={{ display: "grid", gap: "14px" }}>
                    {ticketsFiltrados.map((ticket) => {
                      const curso = ticket.curso_id
                        ? cursosMap[ticket.curso_id]
                        : null;
                      const formador = ticket.formador_id
                        ? formadoresMap[ticket.formador_id]
                        : null;

                      return (
                        <Link
                          key={ticket.id}
                          href={`/aluno/tickets/${ticket.id}`}
                          style={cardLinkStyle}
                        >
                          <p style={tagTopStyle}>Ticket #{ticket.id}</p>

                          <h3 style={tituloCardStyle}>{ticket.assunto}</h3>

                          <p style={textoBase}>
                            Curso: {curso?.titulo || "Sem curso associado"}
                          </p>

                          <p style={{ ...textoBase, marginTop: "8px" }}>
                            Formador: {formador?.nome || "Sem formador"}
                          </p>

                          <div
                            style={{
                              display: "grid",
                              gap: "8px",
                              marginTop: "14px",
                            }}
                          >
                            <Tag texto={`Estado: ${ticket.estado}`} />
                            <Tag texto={`Razão: ${ticket.razao}`} />
                            {ticket.formador_envolvido ? (
                              <Tag texto="Formador envolvido no ticket" />
                            ) : null}
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </Box>
            </div>

            <div style={{ display: "grid", gap: "22px" }}>
              <Box>
                <h2 style={tituloSecao}>Abrir novo ticket</h2>
                <p style={textoBase}>
                  Preenche os dados com cuidado para que a administração consiga
                  analisar o caso de forma completa.
                </p>

                <form
                  onSubmit={abrirTicket}
                  style={{
                    display: "grid",
                    gap: "14px",
                    marginTop: "18px",
                  }}
                >
                  <label style={{ display: "grid", gap: "8px" }}>
                    <span style={labelStyle}>Curso / inscrição</span>
                    <select
                      value={form.inscricao_id}
                      onChange={(event) =>
                        handleInscricaoChange(event.target.value)
                      }
                      style={fieldStyle}
                    >
                      <option value="">Selecionar</option>
                      {inscricoes.map((inscricao) => {
                        const curso = inscricao.curso_id
                          ? cursosMap[inscricao.curso_id]
                          : null;

                        return (
                          <option key={inscricao.id} value={String(inscricao.id)}>
                            #{inscricao.id} — {curso?.titulo || "Curso"}
                          </option>
                        );
                      })}
                    </select>
                  </label>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                      gap: "14px",
                    }}
                  >
                    <label style={{ display: "grid", gap: "8px" }}>
                      <span style={labelStyle}>Tipo</span>
                      <select
                        value={form.tipo}
                        onChange={(event) =>
                          atualizarForm("tipo", event.target.value)
                        }
                        style={fieldStyle}
                      >
                        <option value="suporte_aluno">Suporte aluno</option>
                        <option value="reembolso">Reembolso</option>
                        <option value="chargeback">Chargeback</option>
                        <option value="pagamento">Pagamento</option>
                        <option value="acesso_curso">Acesso ao curso</option>
                        <option value="conteudo_curso">Conteúdo do curso</option>
                        <option value="certificado">Certificado</option>
                        <option value="outro">Outro</option>
                      </select>
                    </label>

                    <label style={{ display: "grid", gap: "8px" }}>
                      <span style={labelStyle}>Prioridade</span>
                      <select
                        value={form.prioridade}
                        onChange={(event) =>
                          atualizarForm("prioridade", event.target.value)
                        }
                        style={fieldStyle}
                      >
                        <option value="baixa">Baixa</option>
                        <option value="normal">Normal</option>
                        <option value="alta">Alta</option>
                        <option value="urgente">Urgente</option>
                      </select>
                    </label>
                  </div>

                  <label style={{ display: "grid", gap: "8px" }}>
                    <span style={labelStyle}>Razão</span>
                    <input
                      value={form.razao}
                      onChange={(event) =>
                        atualizarForm("razao", event.target.value)
                      }
                      placeholder="Ex.: não consigo aceder ao curso"
                      style={fieldStyle}
                    />
                  </label>

                  <label style={{ display: "grid", gap: "8px" }}>
                    <span style={labelStyle}>Assunto</span>
                    <input
                      value={form.assunto}
                      onChange={(event) =>
                        atualizarForm("assunto", event.target.value)
                      }
                      placeholder="Escreve um assunto claro"
                      style={fieldStyle}
                    />
                  </label>

                  <label style={{ display: "grid", gap: "8px" }}>
                    <span style={labelStyle}>Mensagem inicial</span>
                    <textarea
                      value={form.mensagem_inicial}
                      onChange={(event) =>
                        atualizarForm("mensagem_inicial", event.target.value)
                      }
                      rows={8}
                      placeholder="Descreve o problema com detalhe."
                      style={textareaStyle}
                    />
                  </label>

                  {erro ? <ErrorInline texto={erro} /> : null}
                  {sucesso ? <SuccessInline texto={sucesso} /> : null}

                  <button
                    type="submit"
                    disabled={submitting}
                    style={{
                      ...botaoPrimario,
                      cursor: submitting ? "not-allowed" : "pointer",
                      opacity: submitting ? 0.7 : 1,
                    }}
                  >
                    {submitting ? "A abrir ticket..." : "Abrir ticket"}
                  </button>
                </form>
              </Box>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}

function Box({ children }: { children: React.ReactNode }) {
  return (
    <section
      style={{
        border: "1px solid #8a5d31",
        background:
          "linear-gradient(180deg, rgba(20,13,9,0.98) 0%, rgba(16,10,8,0.98) 100%)",
        padding: "clamp(20px, 3vw, 28px)",
        boxShadow:
          "0 18px 42px rgba(0,0,0,0.24), inset 0 1px 0 rgba(255,225,170,0.03)",
      }}
    >
      {children}
    </section>
  );
}

function Tag({ texto }: { texto: string }) {
  return (
    <div
      style={{
        border: "1px solid rgba(166,120,61,0.22)",
        background: "rgba(32,18,13,0.45)",
        padding: "10px 12px",
        color: "#f0d79a",
        fontSize: "16px",
        lineHeight: 1.5,
      }}
    >
      {texto}
    </div>
  );
}

function ErrorBox({ texto }: { texto: string }) {
  return (
    <section
      style={{
        border: "1px solid rgba(255,107,107,0.35)",
        background: "rgba(120,20,20,0.12)",
        padding: "22px",
        color: "#ffb4b4",
        fontSize: "18px",
        lineHeight: 1.7,
      }}
    >
      {texto}
    </section>
  );
}

function ErrorInline({ texto }: { texto: string }) {
  return (
    <div
      style={{
        border: "1px solid rgba(255,107,107,0.35)",
        background: "rgba(120,20,20,0.12)",
        padding: "14px 16px",
        color: "#ffb4b4",
        fontSize: "18px",
      }}
    >
      {texto}
    </div>
  );
}

function SuccessInline({ texto }: { texto: string }) {
  return (
    <div
      style={{
        border: "1px solid rgba(74,222,128,0.35)",
        background: "rgba(20,90,40,0.12)",
        padding: "14px 16px",
        color: "#bff1bf",
        fontSize: "18px",
      }}
    >
      {texto}
    </div>
  );
}

const tituloSecao: React.CSSProperties = {
  margin: "0 0 10px 0",
  fontFamily: "Cinzel, serif",
  fontSize: "clamp(26px, 4vw, 34px)",
  color: "#f0d79a",
  fontWeight: 500,
};

const textoBase: React.CSSProperties = {
  margin: 0,
  color: "#d7b06c",
  fontSize: "clamp(18px, 2vw, 20px)",
  lineHeight: 1.7,
};

const labelStyle: React.CSSProperties = {
  fontSize: "15px",
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "#caa15a",
};

const fieldStyle: React.CSSProperties = {
  width: "100%",
  minHeight: "50px",
  padding: "12px 14px",
  border: "1px solid rgba(166,120,61,0.42)",
  background: "rgba(20,13,9,0.82)",
  color: "#f0d79a",
  outline: "none",
};

const textareaStyle: React.CSSProperties = {
  ...fieldStyle,
  minHeight: "160px",
  resize: "vertical" as const,
  fontFamily: "Cormorant Garamond, serif",
  fontSize: "18px",
};

const botaoPrimario: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: "52px",
  width: "100%",
  border: "1px solid #c4914d",
  background: "linear-gradient(180deg, #c4914d 0%, #a6783d 100%)",
  color: "#140d09",
  padding: "14px 18px",
  fontWeight: 700,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
};

const blocoVazioStyle: React.CSSProperties = {
  border: "1px solid rgba(166,120,61,0.22)",
  background: "rgba(32,18,13,0.45)",
  padding: "18px",
};

const cardLinkStyle: React.CSSProperties = {
  display: "block",
  border: "1px solid rgba(166,120,61,0.22)",
  background: "rgba(32,18,13,0.45)",
  padding: "18px",
  textDecoration: "none",
};

const tagTopStyle: React.CSSProperties = {
  margin: "0 0 10px 0",
  fontSize: "14px",
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "#caa15a",
};

const tituloCardStyle: React.CSSProperties = {
  margin: "0 0 10px 0",
  fontFamily: "Cinzel, serif",
  fontSize: "clamp(22px, 3vw, 28px)",
  color: "#f0d79a",
  fontWeight: 500,
  lineHeight: 1.2,
};