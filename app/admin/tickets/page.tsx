"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type TicketRow = {
  id: number;
  created_at: string;
  updated_at: string;
  tipo: string;
  estado: string;
  prioridade: string;
  razao: string;
  assunto: string;
  formador_envolvido: boolean;
  aluno_id: number | null;
  formador_id: number | null;
  curso_id: number | null;
  admin_responsavel_id: number | null;
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

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

export default function AdminTicketsPage() {
  const pathname = usePathname();

  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [tickets, setTickets] = useState<TicketRow[]>([]);
  const [alunosMap, setAlunosMap] = useState<Record<number, Aluno>>({});
  const [formadoresMap, setFormadoresMap] = useState<Record<number, Formador>>(
    {}
  );
  const [cursosMap, setCursosMap] = useState<Record<number, Curso>>({});

  const [busca, setBusca] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [filtroTipo, setFiltroTipo] = useState("todos");
  const [filtroPrioridade, setFiltroPrioridade] = useState("todos");

  useEffect(() => {
    void carregarTickets();
  }, []);

  async function carregarTickets() {
    setLoading(true);
    setErro("");

    try {
      const { data, error } = await supabase
        .from("suporte_tickets")
        .select(
          "id, created_at, updated_at, tipo, estado, prioridade, razao, assunto, formador_envolvido, aluno_id, formador_id, curso_id, admin_responsavel_id"
        )
        .order("updated_at", { ascending: false });

      if (error) {
        throw error;
      }

      const ticketsData = (data || []) as TicketRow[];
      setTickets(ticketsData);

      const alunoIds = Array.from(
        new Set(
          ticketsData
            .map((ticket) => ticket.aluno_id)
            .filter((id): id is number => typeof id === "number")
        )
      );

      const formadorIds = Array.from(
        new Set(
          ticketsData
            .map((ticket) => ticket.formador_id)
            .filter((id): id is number => typeof id === "number")
        )
      );

      const cursoIds = Array.from(
        new Set(
          ticketsData
            .map((ticket) => ticket.curso_id)
            .filter((id): id is number => typeof id === "number")
        )
      );

      if (alunoIds.length > 0) {
        const { data: alunosData, error: alunosError } = await supabase
          .from("alunos")
          .select("id, nome, email")
          .in("id", alunoIds);

        if (alunosError) {
          throw alunosError;
        }

        const nextMap: Record<number, Aluno> = {};
        (alunosData || []).forEach((aluno) => {
          nextMap[aluno.id] = aluno as Aluno;
        });
        setAlunosMap(nextMap);
      } else {
        setAlunosMap({});
      }

      if (formadorIds.length > 0) {
        const { data: formadoresData, error: formadoresError } = await supabase
          .from("formadores")
          .select("id, nome, email")
          .in("id", formadorIds);

        if (formadoresError) {
          throw formadoresError;
        }

        const nextMap: Record<number, Formador> = {};
        (formadoresData || []).forEach((formador) => {
          nextMap[formador.id] = formador as Formador;
        });
        setFormadoresMap(nextMap);
      } else {
        setFormadoresMap({});
      }

      if (cursoIds.length > 0) {
        const { data: cursosData, error: cursosError } = await supabase
          .from("cursos")
          .select("id, titulo")
          .in("id", cursoIds);

        if (cursosError) {
          throw cursosError;
        }

        const nextMap: Record<number, Curso> = {};
        (cursosData || []).forEach((curso) => {
          nextMap[curso.id] = curso as Curso;
        });
        setCursosMap(nextMap);
      } else {
        setCursosMap({});
      }
    } catch (err: unknown) {
      setErro(getErrorMessage(err, "Ocorreu um erro ao carregar os tickets."));
    } finally {
      setLoading(false);
    }
  }

  const ticketsFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    return tickets.filter((ticket) => {
      if (filtroEstado !== "todos" && ticket.estado !== filtroEstado) {
        return false;
      }

      if (filtroTipo !== "todos" && ticket.tipo !== filtroTipo) {
        return false;
      }

      if (
        filtroPrioridade !== "todos" &&
        ticket.prioridade !== filtroPrioridade
      ) {
        return false;
      }

      if (!termo) {
        return true;
      }

      const aluno = ticket.aluno_id ? alunosMap[ticket.aluno_id] : null;
      const formador = ticket.formador_id
        ? formadoresMap[ticket.formador_id]
        : null;
      const curso = ticket.curso_id ? cursosMap[ticket.curso_id] : null;

      const textoPesquisa = [
        String(ticket.id),
        ticket.assunto,
        ticket.razao,
        ticket.tipo,
        ticket.estado,
        aluno?.nome,
        aluno?.email,
        formador?.nome,
        formador?.email,
        curso?.titulo,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return textoPesquisa.includes(termo);
    });
  }, [
    tickets,
    busca,
    filtroEstado,
    filtroTipo,
    filtroPrioridade,
    alunosMap,
    formadoresMap,
    cursosMap,
  ]);

  const totalAbertos = tickets.filter((ticket) =>
    [
      "aberto",
      "em_analise",
      "aguarda_resposta_formador",
      "aguarda_resposta_admin",
      "aguarda_resposta_aluno",
    ].includes(ticket.estado)
  ).length;

  const totalComFormador = tickets.filter(
    (ticket) => ticket.formador_envolvido
  ).length;

  return (
    <>
      <section className="admin-top-nav-card fade-in-up">
        <div className="admin-top-nav-grid">
          {menuAdmin.map((item) => {
            const isActive = pathname === item.href;

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

      {loading ? (
        <LoadingBox />
      ) : erro ? (
        <ErrorBox texto={erro} />
      ) : (
        <>
          <section className="admin-summary-panel fade-in-up fade-delay-1">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: "18px",
                flexWrap: "wrap",
                alignItems: "flex-end",
                marginBottom: "20px",
              }}
            >
              <div>
                <p className="admin-summary-label" style={{ marginBottom: "10px" }}>
                  Suporte
                </p>
                <h1 className="admin-summary-title" style={{ marginBottom: 0 }}>
                  Tickets da plataforma
                </h1>
              </div>

              <button
                type="button"
                onClick={() => void carregarTickets()}
                className="admin-top-nav-link"
                style={{
                  minHeight: "48px",
                  paddingInline: "18px",
                  cursor: "pointer",
                }}
              >
                Atualizar
              </button>
            </div>

            <div className="admin-summary-grid">
              <ResumoItem
                label="Total de tickets"
                value={String(tickets.length)}
              />
              <ResumoItem label="Tickets abertos" value={String(totalAbertos)} />
              <ResumoItem
                label="Com formador envolvido"
                value={String(totalComFormador)}
              />
              <ResumoItem
                label="Resolvidos / fechados"
                value={String(
                  tickets.filter((ticket) =>
                    ["resolvido", "fechado"].includes(ticket.estado)
                  ).length
                )}
              />
            </div>
          </section>

          <section className="admin-summary-panel fade-in-up fade-delay-2">
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "2fr repeat(3, minmax(180px, 1fr))",
                gap: "14px",
              }}
            >
              <Input
                label="Pesquisar"
                value={busca}
                onChange={setBusca}
                placeholder="ID, aluno, formador, curso, assunto..."
              />

              <Select
                label="Estado"
                value={filtroEstado}
                onChange={setFiltroEstado}
                options={[
                  { value: "todos", label: "Todos" },
                  { value: "aberto", label: "Aberto" },
                  { value: "em_analise", label: "Em análise" },
                  {
                    value: "aguarda_resposta_aluno",
                    label: "Aguarda aluno",
                  },
                  {
                    value: "aguarda_resposta_formador",
                    label: "Aguarda formador",
                  },
                  { value: "aguarda_resposta_admin", label: "Aguarda admin" },
                  { value: "resolvido", label: "Resolvido" },
                  { value: "fechado", label: "Fechado" },
                ]}
              />

              <Select
                label="Tipo"
                value={filtroTipo}
                onChange={setFiltroTipo}
                options={[
                  { value: "todos", label: "Todos" },
                  { value: "suporte_aluno", label: "Suporte aluno" },
                  { value: "reembolso", label: "Reembolso" },
                  { value: "chargeback", label: "Chargeback" },
                  { value: "pagamento", label: "Pagamento" },
                  { value: "acesso_curso", label: "Acesso curso" },
                  { value: "conteudo_curso", label: "Conteúdo curso" },
                  { value: "certificado", label: "Certificado" },
                  { value: "outro", label: "Outro" },
                ]}
              />

              <Select
                label="Prioridade"
                value={filtroPrioridade}
                onChange={setFiltroPrioridade}
                options={[
                  { value: "todos", label: "Todas" },
                  { value: "baixa", label: "Baixa" },
                  { value: "normal", label: "Normal" },
                  { value: "alta", label: "Alta" },
                  { value: "urgente", label: "Urgente" },
                ]}
              />
            </div>
          </section>

          <section className="fade-in-up fade-delay-3">
            {ticketsFiltrados.length === 0 ? (
              <EmptyBox />
            ) : (
              <div
                style={{
                  display: "grid",
                  gap: "16px",
                }}
              >
                {ticketsFiltrados.map((ticket) => {
                  const aluno = ticket.aluno_id
                    ? alunosMap[ticket.aluno_id]
                    : null;
                  const formador = ticket.formador_id
                    ? formadoresMap[ticket.formador_id]
                    : null;
                  const curso = ticket.curso_id
                    ? cursosMap[ticket.curso_id]
                    : null;

                  return (
                    <Link
                      key={ticket.id}
                      href={`/admin/tickets/${ticket.id}`}
                      className="admin-card-link"
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          gap: "18px",
                          alignItems: "flex-start",
                          flexWrap: "wrap",
                        }}
                      >
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p
                            style={{
                              margin: "0 0 10px 0",
                              fontSize: "14px",
                              letterSpacing: "0.08em",
                              textTransform: "uppercase",
                              color: "#caa15a",
                            }}
                          >
                            Ticket #{ticket.id}
                          </p>

                          <h2
                            style={{
                              margin: "0 0 12px 0",
                              fontFamily: "Cinzel, serif",
                              fontSize: "clamp(24px, 3vw, 30px)",
                              color: "#f0d79a",
                              fontWeight: 500,
                              lineHeight: 1.2,
                            }}
                          >
                            {ticket.assunto}
                          </h2>

                          <p
                            style={{
                              margin: "0 0 12px 0",
                              fontSize: "18px",
                              lineHeight: 1.6,
                              color: "#d8b36f",
                            }}
                          >
                            Razão: {ticket.razao}
                          </p>

                          <div
                            style={{
                              display: "grid",
                              gap: "6px",
                              color: "#d8b36f",
                              fontSize: "18px",
                            }}
                          >
                            <span>
                              Aluno: {aluno?.nome || "Não atribuído"}
                              {aluno?.email ? ` — ${aluno.email}` : ""}
                            </span>
                            <span>
                              Formador: {formador?.nome || "Sem formador"}
                            </span>
                            <span>
                              Curso: {curso?.titulo || "Sem curso associado"}
                            </span>
                          </div>
                        </div>

                        <div
                          style={{
                            display: "grid",
                            gap: "10px",
                            minWidth: "220px",
                          }}
                        >
                          <Tag label={ticket.estado} />
                          <Tag label={`Tipo: ${ticket.tipo}`} />
                          <Tag label={`Prioridade: ${ticket.prioridade}`} />
                          {ticket.formador_envolvido ? (
                            <Tag label="Formador envolvido" />
                          ) : null}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </section>
        </>
      )}
    </>
  );
}

function ResumoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="admin-summary-item">
      <p className="admin-summary-label">{label}</p>
      <p className="admin-summary-value">{value}</p>
    </div>
  );
}

function Tag({ label }: { label: string }) {
  return (
    <div
      style={{
        border: "1px solid rgba(166,120,61,0.28)",
        background: "rgba(38, 20, 15, 0.35)",
        padding: "10px 12px",
        color: "#f0d79a",
        fontSize: "16px",
        lineHeight: 1.5,
      }}
    >
      {label}
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
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label style={{ display: "grid", gap: "8px" }}>
      <span
        style={{
          fontSize: "15px",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "#caa15a",
        }}
      >
        {label}
      </span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        style={fieldStyle}
      />
    </label>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <label style={{ display: "grid", gap: "8px" }}>
      <span
        style={{
          fontSize: "15px",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "#caa15a",
        }}
      >
        {label}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        style={fieldStyle}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value} style={{ color: "#140d09" }}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function LoadingBox() {
  return (
    <section className="admin-summary-panel fade-in-up">
      <h2 className="admin-summary-title">A carregar tickets</h2>
      <p className="admin-loading-text">
        A administração está a reunir os tickets de suporte, os respetivos
        estados e as ligações a alunos, formadores e cursos.
      </p>
    </section>
  );
}

function ErrorBox({ texto }: { texto: string }) {
  return <section className="admin-error-box fade-in-up">{texto}</section>;
}

function EmptyBox() {
  return (
    <section className="admin-summary-panel fade-in-up">
      <h2 className="admin-summary-title">Sem resultados</h2>
      <p className="admin-loading-text">
        Não existem tickets a mostrar com os filtros atuais.
      </p>
    </section>
  );
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