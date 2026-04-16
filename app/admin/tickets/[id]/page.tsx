"use client";

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

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
  formador_envolvido: boolean;
  aluno_id: number | null;
  formador_id: number | null;
  curso_id: number | null;
  admin_responsavel_id: number | null;
};

type TicketMensagem = {
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

type NotaInterna = {
  id: number;
  created_at: string;
  admin_id: number | null;
  nota: string;
};

type Admin = {
  id: number;
  auth_id: string | null;
  nome: string | null;
  email: string | null;
};

type Aluno = {
  id: number;
  nome: string | null;
  email: string | null;
};

type Formador = {
  id: number;
  nome: string | null;
  email: string | null;
};

type Curso = {
  id: number;
  titulo: string | null;
};

const menuAdmin = [
  { href: "/admin/cursos", label: "Cursos" },
  { href: "/admin/candidaturas-formador", label: "Candidaturas" },
  { href: "/admin/formadores", label: "Formadores" },
  { href: "/admin/alunos", label: "Alunos" },
  { href: "/admin/inscricoes", label: "Inscrições" },
  { href: "/admin/publicidade", label: "Publicidade" },
  { href: "/admin/publicidade-candidaturas", label: "Pedidos publicidade" },
  { href: "/admin/vendas", label: "Vendas" },
  { href: "/admin/levantamentos", label: "Levantamentos" },
  { href: "/admin/tickets", label: "Tickets" },
  { href: "/admin/chat-formadores", label: "Chat formadores" },
];

export default function AdminTicketDetalhePage() {
  const pathname = usePathname();
  const params = useParams();
  const ticketId = Number(params.id);

  const [loading, setLoading] = useState(true);
  const [submittingMensagem, setSubmittingMensagem] = useState(false);
  const [submittingNota, setSubmittingNota] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [mensagens, setMensagens] = useState<TicketMensagem[]>([]);
  const [notas, setNotas] = useState<NotaInterna[]>([]);
  const [adminAtual, setAdminAtual] = useState<Admin | null>(null);

  const [aluno, setAluno] = useState<Aluno | null>(null);
  const [formador, setFormador] = useState<Formador | null>(null);
  const [curso, setCurso] = useState<Curso | null>(null);

  const [novaMensagem, setNovaMensagem] = useState("");
  const [novaNota, setNovaNota] = useState("");
  const [novoEstado, setNovoEstado] = useState("");
  const [novaPrioridade, setNovaPrioridade] = useState("");

  useEffect(() => {
    if (!Number.isFinite(ticketId)) {
      setErro("ID de ticket inválido.");
      setLoading(false);
      return;
    }

    carregarTudo();
  }, [ticketId]);

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
        throw new Error("Não foi possível validar a sessão de administrador.");
      }

      const { data: adminData, error: adminError } = await supabase
        .from("admin")
        .select("id, auth_id, nome, email")
        .eq("auth_id", user.id)
        .maybeSingle();

      if (adminError || !adminData) {
        throw new Error("Não foi possível identificar o administrador atual.");
      }

      setAdminAtual(adminData as Admin);

      const { data: ticketData, error: ticketError } = await supabase
        .from("suporte_tickets")
        .select(
          "id, created_at, updated_at, tipo, estado, prioridade, razao, assunto, mensagem_inicial, formador_envolvido, aluno_id, formador_id, curso_id, admin_responsavel_id"
        )
        .eq("id", ticketId)
        .maybeSingle();

      if (ticketError || !ticketData) {
        throw new Error("Não foi possível carregar o ticket.");
      }

      const ticketCast = ticketData as Ticket;
      setTicket(ticketCast);
      setNovoEstado(ticketCast.estado);
      setNovaPrioridade(ticketCast.prioridade);

      const { data: mensagensData, error: mensagensError } = await supabase
        .from("suporte_ticket_mensagens")
        .select(
          "id, created_at, autor_tipo, autor_aluno_id, autor_formador_id, autor_admin_id, mensagem, visivel_para_aluno, visivel_para_formador, visivel_para_admin"
        )
        .eq("ticket_id", ticketId)
        .order("created_at", { ascending: true });

      if (mensagensError) {
        throw mensagensError;
      }

      setMensagens((mensagensData || []) as TicketMensagem[]);

      const { data: notasData, error: notasError } = await supabase
        .from("suporte_ticket_notas_internas")
        .select("id, created_at, admin_id, nota")
        .eq("ticket_id", ticketId)
        .order("created_at", { ascending: true });

      if (notasError) {
        throw notasError;
      }

      setNotas((notasData || []) as NotaInterna[]);

      if (ticketCast.aluno_id) {
        const { data: alunoData } = await supabase
          .from("alunos")
          .select("id, nome, email")
          .eq("id", ticketCast.aluno_id)
          .maybeSingle();

        setAluno((alunoData as Aluno | null) || null);
      } else {
        setAluno(null);
      }

      if (ticketCast.formador_id) {
        const { data: formadorData } = await supabase
          .from("formadores")
          .select("id, nome, email")
          .eq("id", ticketCast.formador_id)
          .maybeSingle();

        setFormador((formadorData as Formador | null) || null);
      } else {
        setFormador(null);
      }

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
    } catch (err: any) {
      setErro(err?.message || "Ocorreu um erro ao carregar o ticket.");
    } finally {
      setLoading(false);
    }
  }

  const timeline = useMemo(() => {
    const entradaInicial = ticket
      ? [
          {
            chave: `inicial-${ticket.id}`,
            created_at: ticket.created_at,
            tipo: "inicial" as const,
            titulo: "Mensagem inicial do ticket",
            texto: ticket.mensagem_inicial,
            autor: "Aluno / origem do ticket",
          },
        ]
      : [];

    const entradasMensagens = mensagens.map((mensagem) => ({
      chave: `mensagem-${mensagem.id}`,
      created_at: mensagem.created_at,
      tipo: "mensagem" as const,
      titulo: "Mensagem",
      texto: mensagem.mensagem,
      autor: capitalizarAutor(mensagem.autor_tipo),
    }));

    return [...entradaInicial, ...entradasMensagens].sort(
      (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
  }, [ticket, mensagens]);

  async function guardarMetadadosTicket() {
    if (!ticket) return;

    setErro("");
    setSucesso("");

    const updates: Record<string, any> = {};
    if (novoEstado !== ticket.estado) {
      updates.estado = novoEstado;
    }
    if (novaPrioridade !== ticket.prioridade) {
      updates.prioridade = novaPrioridade;
    }
    if (
      adminAtual &&
      (!ticket.admin_responsavel_id ||
        ticket.admin_responsavel_id !== adminAtual.id)
    ) {
      updates.admin_responsavel_id = adminAtual.id;
    }

    if (Object.keys(updates).length === 0) {
      return;
    }

    const { error } = await supabase
      .from("suporte_tickets")
      .update(updates)
      .eq("id", ticket.id);

    if (error) {
      setErro(error.message || "Não foi possível atualizar o ticket.");
      return;
    }

    setSucesso("Ticket atualizado com sucesso.");
    await carregarTudo();
  }

  async function envolverFormador() {
    if (!ticket) return;

    setErro("");
    setSucesso("");

    if (!ticket.formador_id) {
      setErro("Este ticket não tem formador associado.");
      return;
    }

    const { error: updateError } = await supabase
      .from("suporte_tickets")
      .update({
        formador_envolvido: true,
        estado: "aguarda_resposta_formador",
        admin_responsavel_id: adminAtual?.id || ticket.admin_responsavel_id,
      })
      .eq("id", ticket.id);

    if (updateError) {
      setErro(updateError.message || "Não foi possível envolver o formador.");
      return;
    }

    const { error: mensagemError } = await supabase
      .from("suporte_ticket_mensagens")
      .insert({
        ticket_id: ticket.id,
        autor_tipo: "admin",
        autor_admin_id: adminAtual?.id || null,
        mensagem:
          "A administração envolveu o formador neste ticket para prestar esclarecimento ao aluno.",
        visivel_para_aluno: true,
        visivel_para_formador: true,
        visivel_para_admin: true,
      });

    if (mensagemError) {
      setErro(
        mensagemError.message ||
          "O formador foi envolvido, mas não foi possível registar a mensagem automática."
      );
      await carregarTudo();
      return;
    }

    setSucesso("Formador envolvido no ticket com sucesso.");
    await carregarTudo();
  }

  async function enviarMensagem() {
    if (!ticket || !adminAtual) return;

    if (!novaMensagem.trim()) {
      setErro("Escreve a mensagem antes de enviar.");
      return;
    }

    setSubmittingMensagem(true);
    setErro("");
    setSucesso("");

    try {
      const { error: insertError } = await supabase
        .from("suporte_ticket_mensagens")
        .insert({
          ticket_id: ticket.id,
          autor_tipo: "admin",
          autor_admin_id: adminAtual.id,
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
            ? "aguarda_resposta_aluno"
            : "aguarda_resposta_aluno",
          admin_responsavel_id: adminAtual.id,
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
      setSubmittingMensagem(false);
    }
  }

  async function guardarNotaInterna() {
    if (!ticket || !adminAtual) return;

    if (!novaNota.trim()) {
      setErro("Escreve a nota interna antes de guardar.");
      return;
    }

    setSubmittingNota(true);
    setErro("");
    setSucesso("");

    try {
      const { error } = await supabase
        .from("suporte_ticket_notas_internas")
        .insert({
          ticket_id: ticket.id,
          admin_id: adminAtual.id,
          nota: novaNota.trim(),
        });

      if (error) {
        throw error;
      }

      setNovaNota("");
      setSucesso("Nota interna guardada com sucesso.");
      await carregarTudo();
    } catch (err: any) {
      setErro(err?.message || "Não foi possível guardar a nota interna.");
    } finally {
      setSubmittingNota(false);
    }
  }

  if (loading) {
    return (
      <>
        <TopNav pathname={pathname} />
        <LoadingBox />
      </>
    );
  }

  if (erro && !ticket) {
    return (
      <>
        <TopNav pathname={pathname} />
        <ErrorBox texto={erro} />
      </>
    );
  }

  if (!ticket) {
    return (
      <>
        <TopNav pathname={pathname} />
        <ErrorBox texto="Ticket não encontrado." />
      </>
    );
  }

  return (
    <>
      <TopNav pathname={pathname} />

      <section className="admin-summary-panel fade-in-up">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: "18px",
            flexWrap: "wrap",
            alignItems: "flex-start",
          }}
        >
          <div style={{ minWidth: 0, flex: 1 }}>
            <p className="admin-summary-label" style={{ marginBottom: "10px" }}>
              Ticket #{ticket.id}
            </p>

            <h1 className="admin-summary-title" style={{ marginBottom: "12px" }}>
              {ticket.assunto}
            </h1>

            <p
              style={{
                margin: 0,
                color: "#d8b36f",
                fontSize: "19px",
                lineHeight: 1.7,
              }}
            >
              Razão: {ticket.razao}
            </p>
          </div>

          <Link
            href="/admin/tickets"
            className="admin-top-nav-link"
            style={{ minHeight: "48px", paddingInline: "18px" }}
          >
            Voltar aos tickets
          </Link>
        </div>

        {sucesso ? (
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
            {sucesso}
          </div>
        ) : null}

        {erro ? (
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
            {erro}
          </div>
        ) : null}
      </section>

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "1.15fr 0.85fr",
          gap: "22px",
        }}
        className="fade-in-up fade-delay-1"
      >
        <div style={{ display: "grid", gap: "22px" }}>
          <Panel>
            <SectionTitle titulo="Timeline do ticket" />
            <div style={{ display: "grid", gap: "14px" }}>
              {timeline.map((item) => (
                <div
                  key={item.chave}
                  style={{
                    border: "1px solid rgba(166,120,61,0.22)",
                    background: "rgba(32,18,13,0.45)",
                    padding: "18px",
                  }}
                >
                  <p
                    style={{
                      margin: "0 0 8px 0",
                      fontSize: "14px",
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      color: "#caa15a",
                    }}
                  >
                    {formatarDataHora(item.created_at)} — {item.autor}
                  </p>
                  <h3
                    style={{
                      margin: "0 0 10px 0",
                      fontFamily: "Cinzel, serif",
                      color: "#f0d79a",
                      fontSize: "24px",
                      fontWeight: 500,
                    }}
                  >
                    {item.titulo}
                  </h3>
                  <p
                    style={{
                      margin: 0,
                      color: "#d8b36f",
                      fontSize: "19px",
                      lineHeight: 1.7,
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {item.texto}
                  </p>
                </div>
              ))}
            </div>
          </Panel>

          <Panel>
            <SectionTitle titulo="Responder no ticket" />
            <div style={{ display: "grid", gap: "14px" }}>
              <textarea
                value={novaMensagem}
                onChange={(event) => setNovaMensagem(event.target.value)}
                rows={7}
                placeholder="Escreve a resposta da administração. Se o formador estiver envolvido, a mensagem também poderá ser visível para ele."
                style={textareaStyle}
              />

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: "14px",
                  flexWrap: "wrap",
                }}
              >
                <button
                  type="button"
                  onClick={enviarMensagem}
                  disabled={submittingMensagem}
                  className="admin-top-nav-link active"
                  style={{
                    minHeight: "48px",
                    paddingInline: "18px",
                    cursor: submittingMensagem ? "not-allowed" : "pointer",
                    opacity: submittingMensagem ? 0.7 : 1,
                  }}
                >
                  {submittingMensagem ? "A enviar..." : "Enviar resposta"}
                </button>

                {!ticket.formador_envolvido && ticket.formador_id ? (
                  <button
                    type="button"
                    onClick={envolverFormador}
                    className="admin-top-nav-link"
                    style={{
                      minHeight: "48px",
                      paddingInline: "18px",
                      cursor: "pointer",
                    }}
                  >
                    Envolver formador
                  </button>
                ) : null}
              </div>
            </div>
          </Panel>

          <Panel>
            <SectionTitle titulo="Notas internas da administração" />
            <div style={{ display: "grid", gap: "14px" }}>
              {notas.length === 0 ? (
                <p
                  style={{
                    margin: 0,
                    color: "#d8b36f",
                    fontSize: "18px",
                    lineHeight: 1.7,
                  }}
                >
                  Ainda não existem notas internas neste ticket.
                </p>
              ) : (
                notas.map((nota) => (
                  <div
                    key={nota.id}
                    style={{
                      border: "1px solid rgba(166,120,61,0.22)",
                      background: "rgba(32,18,13,0.45)",
                      padding: "18px",
                    }}
                  >
                    <p
                      style={{
                        margin: "0 0 10px 0",
                        fontSize: "14px",
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        color: "#caa15a",
                      }}
                    >
                      {formatarDataHora(nota.created_at)}
                    </p>
                    <p
                      style={{
                        margin: 0,
                        color: "#d8b36f",
                        fontSize: "19px",
                        lineHeight: 1.7,
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      {nota.nota}
                    </p>
                  </div>
                ))
              )}

              <textarea
                value={novaNota}
                onChange={(event) => setNovaNota(event.target.value)}
                rows={5}
                placeholder="Escreve uma nota interna invisível para o aluno."
                style={textareaStyle}
              />

              <button
                type="button"
                onClick={guardarNotaInterna}
                disabled={submittingNota}
                className="admin-top-nav-link"
                style={{
                  minHeight: "48px",
                  paddingInline: "18px",
                  width: "fit-content",
                  cursor: submittingNota ? "not-allowed" : "pointer",
                  opacity: submittingNota ? 0.7 : 1,
                }}
              >
                {submittingNota ? "A guardar..." : "Guardar nota interna"}
              </button>
            </div>
          </Panel>
        </div>

        <div style={{ display: "grid", gap: "22px" }}>
          <Panel>
            <SectionTitle titulo="Dados do ticket" />

            <InfoRow label="Estado">
              <select
                value={novoEstado}
                onChange={(event) => setNovoEstado(event.target.value)}
                style={fieldStyle}
              >
                <option value="aberto">Aberto</option>
                <option value="em_analise">Em análise</option>
                <option value="aguarda_resposta_aluno">Aguarda aluno</option>
                <option value="aguarda_resposta_formador">Aguarda formador</option>
                <option value="aguarda_resposta_admin">Aguarda admin</option>
                <option value="resolvido">Resolvido</option>
                <option value="fechado">Fechado</option>
              </select>
            </InfoRow>

            <InfoRow label="Prioridade">
              <select
                value={novaPrioridade}
                onChange={(event) => setNovaPrioridade(event.target.value)}
                style={fieldStyle}
              >
                <option value="baixa">Baixa</option>
                <option value="normal">Normal</option>
                <option value="alta">Alta</option>
                <option value="urgente">Urgente</option>
              </select>
            </InfoRow>

            <InfoRow label="Tipo">
              <TextValue>{ticket.tipo}</TextValue>
            </InfoRow>

            <InfoRow label="Criado em">
              <TextValue>{formatarDataHora(ticket.created_at)}</TextValue>
            </InfoRow>

            <InfoRow label="Atualizado em">
              <TextValue>{formatarDataHora(ticket.updated_at)}</TextValue>
            </InfoRow>

            <InfoRow label="Formador envolvido">
              <TextValue>{ticket.formador_envolvido ? "Sim" : "Não"}</TextValue>
            </InfoRow>

            <button
              type="button"
              onClick={guardarMetadadosTicket}
              className="admin-top-nav-link active"
              style={{
                minHeight: "48px",
                paddingInline: "18px",
                width: "fit-content",
                cursor: "pointer",
                marginTop: "12px",
              }}
            >
              Guardar alterações
            </button>
          </Panel>

          <Panel>
            <SectionTitle titulo="Participantes" />

            <InfoRow label="Aluno">
              <TextValue>
                {aluno?.nome || "Não atribuído"}
                {aluno?.email ? ` — ${aluno.email}` : ""}
              </TextValue>
            </InfoRow>

            <InfoRow label="Formador">
              <TextValue>
                {formador?.nome || "Sem formador"}
                {formador?.email ? ` — ${formador.email}` : ""}
              </TextValue>
            </InfoRow>

            <InfoRow label="Curso">
              <TextValue>{curso?.titulo || "Sem curso associado"}</TextValue>
            </InfoRow>

            <InfoRow label="Admin responsável">
              <TextValue>
                {ticket.admin_responsavel_id
                  ? `Admin #${ticket.admin_responsavel_id}`
                  : "Ainda não atribuído"}
              </TextValue>
            </InfoRow>
          </Panel>
        </div>
      </section>
    </>
  );
}

function TopNav({ pathname }: { pathname: string }) {
  return (
    <section className="admin-top-nav-card fade-in-up">
      <div className="admin-top-nav-grid">
        {menuAdmin.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href === "/admin/tickets" && pathname.startsWith("/admin/tickets")) ||
            (item.href === "/admin/chat-formadores" &&
              pathname.startsWith("/admin/chat-formadores"));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`admin-top-nav-link ${isActive ? "active" : ""}`}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function SectionTitle({ titulo }: { titulo: string }) {
  return (
    <h2
      style={{
        margin: "0 0 18px 0",
        fontFamily: "Cinzel, serif",
        fontSize: "32px",
        color: "#f0d79a",
        fontWeight: 500,
      }}
    >
      {titulo}
    </h2>
  );
}

function InfoRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: "grid", gap: "8px", marginBottom: "14px" }}>
      <p
        style={{
          margin: 0,
          fontSize: "14px",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "#caa15a",
        }}
      >
        {label}
      </p>
      {children}
    </div>
  );
}

function TextValue({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        border: "1px solid rgba(166,120,61,0.22)",
        background: "rgba(32,18,13,0.45)",
        padding: "14px 16px",
        color: "#d8b36f",
        fontSize: "18px",
        lineHeight: 1.6,
        wordBreak: "break-word",
      }}
    >
      {children}
    </div>
  );
}

function Panel({ children }: { children: React.ReactNode }) {
  return (
    <section
      className="admin-summary-panel"
      style={{
        marginBottom: 0,
      }}
    >
      {children}
    </section>
  );
}

function LoadingBox() {
  return (
    <section className="admin-summary-panel fade-in-up">
      <h2 className="admin-summary-title">A carregar ticket</h2>
      <p className="admin-loading-text">
        A administração está a reunir mensagens, notas internas e participantes
        do ticket selecionado.
      </p>
    </section>
  );
}

function ErrorBox({ texto }: { texto: string }) {
  return <section className="admin-error-box fade-in-up">{texto}</section>;
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

const fieldStyle: React.CSSProperties = {
  width: "100%",
  minHeight: "50px",
  border: "1px solid rgba(166,120,61,0.42)",
  background: "rgba(20,13,9,0.82)",
  color: "#f0d79a",
  padding: "12px 14px",
  outline: "none",
};

const textareaStyle: React.CSSProperties = {
  width: "100%",
  border: "1px solid rgba(166,120,61,0.42)",
  background: "rgba(20,13,9,0.82)",
  color: "#f0d79a",
  padding: "14px 16px",
  outline: "none",
  resize: "vertical",
  minHeight: "140px",
  fontFamily: "Cormorant Garamond, serif",
  fontSize: "18px",
};