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

type Ticket = {
  id: number;
  created_at: string;
  updated_at: string;
  tipo: string;
  estado: string;
  prioridade: string;
  razao: string;
  assunto: string;
  aluno_id: number | null;
  curso_id: number | null;
  formador_envolvido: boolean;
};

type Curso = {
  id: number;
  titulo: string | null;
};

type Aluno = {
  id: number;
  nome: string | null;
  email: string | null;
};

export default function FormadorTicketsPage() {
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  const [formador, setFormador] = useState<Formador | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [cursosMap, setCursosMap] = useState<Record<number, Curso>>({});
  const [alunosMap, setAlunosMap] = useState<Record<number, Aluno>>({});
  const [filtroEstado, setFiltroEstado] = useState("todos");

  useEffect(() => {
    carregarTudo();
  }, []);

  async function encontrarFormadorComRecuperacao(
    userId: string,
    userEmail: string | null | undefined
  ) {
    const { data: porAuthId } = await supabase
      .from("formadores")
      .select("id, nome, email, auth_id, status")
      .eq("auth_id", userId)
      .maybeSingle();

    if (porAuthId) {
      return porAuthId as Formador;
    }

    if (!userEmail) return null;

    const { data: porEmail } = await supabase
      .from("formadores")
      .select("id, nome, email, auth_id, status")
      .eq("email", userEmail)
      .maybeSingle();

    if (!porEmail) return null;

    if (!porEmail.auth_id) {
      const { error: updateError } = await supabase
        .from("formadores")
        .update({ auth_id: userId })
        .eq("id", porEmail.id);

      if (!updateError) {
        return {
          ...(porEmail as Formador),
          auth_id: userId,
        };
      }
    }

    return porEmail as Formador;
  }

  async function carregarTudo() {
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

      const formadorData = await encontrarFormadorComRecuperacao(
        user.id,
        user.email
      );

      if (!formadorData) {
        setErro("Não foi possível identificar o registo do formador.");
        setLoading(false);
        return;
      }

      if (formadorData.status !== "aprovado") {
        setErro("A conta de formador ainda não está aprovada.");
        setLoading(false);
        return;
      }

      setFormador(formadorData);

      const { data: ticketsData, error: ticketsError } = await supabase
        .from("suporte_tickets")
        .select(
          "id, created_at, updated_at, tipo, estado, prioridade, razao, assunto, aluno_id, curso_id, formador_envolvido"
        )
        .eq("formador_id", formadorData.id)
        .eq("formador_envolvido", true)
        .order("updated_at", { ascending: false });

      if (ticketsError) {
        throw ticketsError;
      }

      const ticketsLista = (ticketsData || []) as Ticket[];
      setTickets(ticketsLista);

      const cursoIds = Array.from(
        new Set(
          ticketsLista
            .map((ticket) => ticket.curso_id)
            .filter((id): id is number => typeof id === "number")
        )
      );

      const alunoIds = Array.from(
        new Set(
          ticketsLista
            .map((ticket) => ticket.aluno_id)
            .filter((id): id is number => typeof id === "number")
        )
      );

      if (cursoIds.length > 0) {
        const { data: cursosData, error: cursosError } = await supabase
          .from("cursos")
          .select("id, titulo")
          .in("id", cursoIds);

        if (cursosError) {
          throw cursosError;
        }

        const mapLocal: Record<number, Curso> = {};
        (cursosData || []).forEach((curso) => {
          mapLocal[curso.id] = curso as Curso;
        });
        setCursosMap(mapLocal);
      } else {
        setCursosMap({});
      }

      if (alunoIds.length > 0) {
        const { data: alunosData, error: alunosError } = await supabase
          .from("alunos")
          .select("id, nome, email")
          .in("id", alunoIds);

        if (alunosError) {
          throw alunosError;
        }

        const mapLocal: Record<number, Aluno> = {};
        (alunosData || []).forEach((aluno) => {
          mapLocal[aluno.id] = aluno as Aluno;
        });
        setAlunosMap(mapLocal);
      } else {
        setAlunosMap({});
      }
    } catch (err: any) {
      setErro(err?.message || "Ocorreu um erro ao carregar os tickets.");
    } finally {
      setLoading(false);
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
        padding: "40px 16px 90px",
        fontFamily: "Cormorant Garamond, serif",
      }}
    >
      <section style={{ maxWidth: "1180px", margin: "0 auto" }}>
        <header style={{ marginBottom: "28px" }}>
          <p
            style={{
              margin: "0 0 10px 0",
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: "#caa15a",
              fontSize: "14px",
            }}
          >
            Área do formador
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
            Tickets em que foste envolvido
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
            Consulta os tickets em que a administração te envolveu para
            prestares esclarecimentos ao aluno.
          </p>
        </header>

        {loading ? (
          <Box>
            <h2 style={tituloSecao}>A carregar tickets</h2>
            <p style={textoBase}>
              Estamos a reunir os tickets em que foste envolvido.
            </p>
          </Box>
        ) : erro ? (
          <ErrorBox texto={erro} />
        ) : (
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
                <h2 style={tituloSecao}>Lista de tickets</h2>
                <p style={textoBase}>
                  Aqui aparecem apenas os tickets em que a administração te
                  envolveu diretamente.
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
                  <option value="aguarda_resposta_formador">
                    Aguarda formador
                  </option>
                  <option value="aguarda_resposta_admin">
                    Aguarda administração
                  </option>
                  <option value="aguarda_resposta_aluno">Aguarda aluno</option>
                  <option value="resolvido">Resolvido</option>
                  <option value="fechado">Fechado</option>
                </select>
              </label>
            </div>

            {ticketsFiltrados.length === 0 ? (
              <div style={blocoVazioStyle}>
                <p style={textoBase}>
                  Ainda não existem tickets para mostrar.
                </p>
              </div>
            ) : (
              <div style={{ display: "grid", gap: "14px" }}>
                {ticketsFiltrados.map((ticket) => {
                  const curso = ticket.curso_id ? cursosMap[ticket.curso_id] : null;
                  const aluno = ticket.aluno_id ? alunosMap[ticket.aluno_id] : null;

                  return (
                    <Link
                      key={ticket.id}
                      href={`/formadores/tickets/${ticket.id}`}
                      style={cardLinkStyle}
                    >
                      <p style={tagTopStyle}>Ticket #{ticket.id}</p>

                      <h3 style={tituloCardStyle}>{ticket.assunto}</h3>

                      <p style={textoBase}>
                        Curso: {curso?.titulo || "Sem curso associado"}
                      </p>

                      <p style={{ ...textoBase, marginTop: "8px" }}>
                        Aluno: {aluno?.nome || "Sem aluno identificado"}
                        {aluno?.email ? ` — ${aluno.email}` : ""}
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
                        <Tag texto={`Prioridade: ${ticket.prioridade}`} />
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </Box>
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