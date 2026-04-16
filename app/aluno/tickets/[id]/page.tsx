"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type Aluno = {
  id: number;
  nome: string | null;
  email: string | null;
  auth_id: string | null;
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
  mensagem_inicial: string;
  aluno_id: number | null;
  formador_id: number | null;
  curso_id: number | null;
  formador_envolvido: boolean;
};

type Mensagem = {
  id: number;
  created_at: string;
  autor_tipo: "aluno" | "formador" | "admin" | "sistema";
  autor_aluno_id: number | null;
  autor_formador_id: number | null;
  autor_admin_id: number | null;
  mensagem: string;
  visivel_para_aluno: boolean;
  visivel_para_formador: boolean;
  visivel_para_admin: boolean;
};

type Curso = {
  id: number;
  titulo: string | null;
};

type Formador = {
  id: number;
  nome: string | null;
};

export default function AlunoTicketDetalhePage() {
  const params = useParams();
  const ticketId = Number(params.id);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  const [aluno, setAluno] = useState<Aluno | null>(null);
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [curso, setCurso] = useState<Curso | null>(null);
  const [formador, setFormador] = useState<Formador | null>(null);
  const [novaMensagem, setNovaMensagem] = useState("");

  useEffect(() => {
    if (!Number.isFinite(ticketId)) {
      setErro("ID de ticket inválido.");
      setLoading(false);
      return;
    }

    carregarTudo();
  }, [ticketId]);

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
        throw new Error("Não foi possível validar a sessão do aluno.");
      }

      const alunoData = await encontrarAlunoComRecuperacao(user.id, user.email);

      if (!alunoData) {
        throw new Error("Não foi possível identificar o aluno.");
      }

      setAluno(alunoData);

      const { data: ticketData, error: ticketError } = await supabase
        .from("suporte_tickets")
        .select(
          "id, created_at, updated_at, tipo, estado, prioridade, razao, assunto, mensagem_inicial, aluno_id, formador_id, curso_id, formador_envolvido"
        )
        .eq("id", ticketId)
        .eq("aluno_id", alunoData.id)
        .maybeSingle();

      if (ticketError || !ticketData) {
        throw new Error("Não foi possível carregar o ticket.");
      }

      const ticketCast = ticketData as Ticket;
      setTicket(ticketCast);

      const { data: mensagensData, error: mensagensError } = await supabase
        .from("suporte_ticket_mensagens")
        .select(
          "id, created_at, autor_tipo, autor_aluno_id, autor_formador_id, autor_admin_id, mensagem, visivel_para_aluno, visivel_para_formador, visivel_para_admin"
        )
        .eq("ticket_id", ticketId)
        .eq("visivel_para_aluno", true)
        .order("created_at", { ascending: true });

      if (mensagensError) {
        throw mensagensError;
      }

      setMensagens((mensagensData || []) as Mensagem[]);

      if (ticketCast.curso_id) {
        const { data: cursoData } = await supabase
          .from("cursos")
          .select("id, titulo")
          .eq("id", ticketCast.curso_id)
          .maybeSingle();

        setCurso((cursoData as Curso | null) || null);
      } else {
        setCurso(null);
      }

      if (ticketCast.formador_id) {
        const { data: formadorData } = await supabase
          .from("formadores")
          .select("id, nome")
          .eq("id", ticketCast.formador_id)
          .maybeSingle();

        setFormador((formadorData as Formador | null) || null);
      } else {
        setFormador(null);
      }
    } catch (err: any) {
      setErro(err?.message || "Ocorreu um erro ao carregar o ticket.");
    } finally {
      setLoading(false);
    }
  }

  const timeline = useMemo(() => {
    const inicial = ticket
      ? [
          {
            chave: `inicial-${ticket.id}`,
            created_at: ticket.created_at,
            titulo: "Mensagem inicial",
            texto: ticket.mensagem_inicial,
            autor: "Aluno",
          },
        ]
      : [];

    const outras = mensagens.map((mensagem) => ({
      chave: `mensagem-${mensagem.id}`,
      created_at: mensagem.created_at,
      titulo: "Mensagem",
      texto: mensagem.mensagem,
      autor: capitalizarAutor(mensagem.autor_tipo),
    }));

    return [...inicial, ...outras].sort(
      (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
  }, [ticket, mensagens]);

  async function enviarMensagem() {
    if (!ticket || !aluno) return;

    if (!novaMensagem.trim()) {
      setErro("Escreve a tua mensagem antes de enviar.");
      return;
    }

    setSubmitting(true);
    setErro("");
    setSucesso("");

    try {
      const { error: insertError } = await supabase
        .from("suporte_ticket_mensagens")
        .insert({
          ticket_id: ticket.id,
          autor_tipo: "aluno",
          autor_aluno_id: aluno.id,
          mensagem: novaMensagem.trim(),
          visivel_para_aluno: true,
          visivel_para_formador: ticket.formador_envolvido,
          visivel_para_admin: true,
        });

      if (insertError) {
        throw insertError;
      }

      const { error: updateError } = await supabase
        .from("suporte_tickets")
        .update({
          estado: ticket.formador_envolvido
            ? "aguarda_resposta_admin"
            : "aguarda_resposta_admin",
        })
        .eq("id", ticket.id);

      if (updateError) {
        throw updateError;
      }

      setNovaMensagem("");
      setSucesso("Mensagem enviada com sucesso.");
      await carregarTudo();
    } catch (err: any) {
      setErro(err?.message || "Não foi possível enviar a mensagem.");
    } finally {
      setSubmitting(false);
    }
  }

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
      <section style={{ maxWidth: "1180px", margin: "0 auto" }}>
        {loading ? (
          <Box>
            <h2 style={tituloSecao}>A carregar ticket</h2>
            <p style={textoBase}>
              Estamos a reunir o histórico do ticket selecionado.
            </p>
          </Box>
        ) : erro && !ticket ? (
          <ErrorBox texto={erro} />
        ) : !ticket ? (
          <ErrorBox texto="Ticket não encontrado." />
        ) : (
          <>
            <Box>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: "14px",
                  flexWrap: "wrap",
                  alignItems: "flex-start",
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={tagTopStyle}>Ticket #{ticket.id}</p>

                  <h1
                    style={{
                      margin: "0 0 12px 0",
                      fontFamily: "Cinzel, serif",
                      fontSize: "clamp(30px, 5vw, 44px)",
                      color: "#f0d79a",
                      lineHeight: 1.12,
                      fontWeight: 500,
                    }}
                  >
                    {ticket.assunto}
                  </h1>

                  <p style={textoBase}>Razão: {ticket.razao}</p>
                  <p style={{ ...textoBase, marginTop: "10px" }}>
                    Curso: {curso?.titulo || "Sem curso associado"}
                  </p>
                  <p style={{ ...textoBase, marginTop: "10px" }}>
                    Formador: {formador?.nome || "Sem formador"}
                  </p>
                </div>

                <Link href="/aluno/tickets" style={botaoSecundario}>
                  Voltar aos tickets
                </Link>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                  gap: "12px",
                  marginTop: "18px",
                }}
              >
                <Tag texto={`Estado: ${ticket.estado}`} />
                <Tag texto={`Tipo: ${ticket.tipo}`} />
                <Tag texto={`Prioridade: ${ticket.prioridade}`} />
                {ticket.formador_envolvido ? (
                  <Tag texto="Formador envolvido" />
                ) : null}
              </div>

              {erro ? <ErrorInline texto={erro} /> : null}
              {sucesso ? <SuccessInline texto={sucesso} /> : null}
            </Box>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "minmax(0, 1fr)",
                gap: "22px",
                marginTop: "22px",
              }}
            >
              <Box>
                <h2 style={tituloSecao}>Histórico do ticket</h2>

                <div style={{ display: "grid", gap: "14px" }}>
                  {timeline.map((item) => (
                    <div key={item.chave} style={timelineItemStyle}>
                      <p style={timelineMetaStyle}>
                        {formatarDataHora(item.created_at)} — {item.autor}
                      </p>
                      <h3 style={tituloCardStyle}>{item.titulo}</h3>
                      <p
                        style={{
                          ...textoBase,
                          whiteSpace: "pre-wrap",
                        }}
                      >
                        {item.texto}
                      </p>
                    </div>
                  ))}
                </div>
              </Box>

              <Box>
                <h2 style={tituloSecao}>Responder</h2>

                <div style={{ display: "grid", gap: "14px" }}>
                  <textarea
                    value={novaMensagem}
                    onChange={(event) => setNovaMensagem(event.target.value)}
                    rows={8}
                    placeholder="Escreve aqui a tua resposta."
                    style={textareaStyle}
                  />

                  <button
                    type="button"
                    onClick={enviarMensagem}
                    disabled={submitting}
                    style={{
                      ...botaoPrimario,
                      cursor: submitting ? "not-allowed" : "pointer",
                      opacity: submitting ? 0.7 : 1,
                    }}
                  >
                    {submitting ? "A enviar..." : "Enviar mensagem"}
                  </button>
                </div>
              </Box>
            </div>
          </>
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
        marginTop: "18px",
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
        marginTop: "18px",
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

function capitalizarAutor(valor: string) {
  if (!valor) return "Desconhecido";
  return valor.charAt(0).toUpperCase() + valor.slice(1);
}

function formatarDataHora(valor: string) {
  return new Intl.DateTimeFormat("pt-PT", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(valor));
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

const textareaStyle: React.CSSProperties = {
  width: "100%",
  minHeight: "160px",
  padding: "14px 16px",
  border: "1px solid rgba(166,120,61,0.42)",
  background: "rgba(20,13,9,0.82)",
  color: "#f0d79a",
  outline: "none",
  resize: "vertical",
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

const botaoSecundario: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: "48px",
  border: "1px solid rgba(166,120,61,0.6)",
  background: "rgba(32,18,13,0.55)",
  color: "#e6c27a",
  textDecoration: "none",
  padding: "12px 16px",
  textAlign: "center",
};

const tagTopStyle: React.CSSProperties = {
  margin: "0 0 10px 0",
  fontSize: "14px",
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "#caa15a",
};

const timelineItemStyle: React.CSSProperties = {
  border: "1px solid rgba(166,120,61,0.22)",
  background: "rgba(32,18,13,0.45)",
  padding: "18px",
};

const timelineMetaStyle: React.CSSProperties = {
  margin: "0 0 8px 0",
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