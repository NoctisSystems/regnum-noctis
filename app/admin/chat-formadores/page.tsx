"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type Conversa = {
  id: number;
  created_at: string;
  updated_at: string;
  formador_id: number;
  admin_responsavel_id: number | null;
  categoria: string;
  assunto: string;
  estado: string;
};

type Formador = {
  id: number;
  nome: string | null;
  email: string | null;
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

export default function AdminChatFormadoresPage() {
  const pathname = usePathname();

  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [conversas, setConversas] = useState<Conversa[]>([]);
  const [formadoresMap, setFormadoresMap] = useState<Record<number, Formador>>(
    {}
  );

  const [busca, setBusca] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [filtroCategoria, setFiltroCategoria] = useState("todos");

  useEffect(() => {
    carregarConversas();
  }, []);

  async function carregarConversas() {
    setLoading(true);
    setErro("");

    try {
      const { data, error } = await supabase
        .from("chat_admin_formador_conversas")
        .select(
          "id, created_at, updated_at, formador_id, admin_responsavel_id, categoria, assunto, estado"
        )
        .order("updated_at", { ascending: false });

      if (error) {
        throw error;
      }

      const conversasData = (data || []) as Conversa[];
      setConversas(conversasData);

      const formadorIds = Array.from(
        new Set(conversasData.map((conversa) => conversa.formador_id))
      );

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
    } catch (err: any) {
      setErro(
        err?.message ||
          "Ocorreu um erro ao carregar o chat interno dos formadores."
      );
    } finally {
      setLoading(false);
    }
  }

  const conversasFiltradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    return conversas.filter((conversa) => {
      if (filtroEstado !== "todos" && conversa.estado !== filtroEstado) {
        return false;
      }

      if (
        filtroCategoria !== "todos" &&
        conversa.categoria !== filtroCategoria
      ) {
        return false;
      }

      if (!termo) return true;

      const formador = formadoresMap[conversa.formador_id];
      const texto = [
        String(conversa.id),
        conversa.assunto,
        conversa.categoria,
        conversa.estado,
        formador?.nome,
        formador?.email,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return texto.includes(termo);
    });
  }, [conversas, busca, filtroEstado, filtroCategoria, formadoresMap]);

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
            <p className="admin-summary-label" style={{ marginBottom: "10px" }}>
              Suporte interno
            </p>
            <h1 className="admin-summary-title">Chat com formadores</h1>

            <div className="admin-summary-grid" style={{ marginTop: "18px" }}>
              <ResumoItem label="Total de conversas" value={String(conversas.length)} />
              <ResumoItem
                label="Abertas"
                value={String(
                  conversas.filter((item) =>
                    ["aberto", "em_analise", "aguarda_formador", "aguarda_admin"].includes(item.estado)
                  ).length
                )}
              />
              <ResumoItem
                label="Fechadas"
                value={String(
                  conversas.filter((item) => item.estado === "fechado").length
                )}
              />
            </div>
          </section>

          <section className="admin-summary-panel fade-in-up fade-delay-2">
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "2fr 1fr 1fr",
                gap: "14px",
              }}
            >
              <Input
                label="Pesquisar"
                value={busca}
                onChange={setBusca}
                placeholder="ID, assunto, categoria, formador..."
              />

              <Select
                label="Estado"
                value={filtroEstado}
                onChange={setFiltroEstado}
                options={[
                  { value: "todos", label: "Todos" },
                  { value: "aberto", label: "Aberto" },
                  { value: "em_analise", label: "Em análise" },
                  { value: "aguarda_formador", label: "Aguarda formador" },
                  { value: "aguarda_admin", label: "Aguarda admin" },
                  { value: "fechado", label: "Fechado" },
                ]}
              />

              <Select
                label="Categoria"
                value={filtroCategoria}
                onChange={setFiltroCategoria}
                options={[
                  { value: "todos", label: "Todas" },
                  { value: "doenca_ausencia", label: "Doença / ausência" },
                  { value: "problema_tecnico", label: "Problema técnico" },
                  { value: "atualizacao_curso", label: "Atualização de curso" },
                  { value: "problema_aluno", label: "Problema com aluno" },
                  { value: "pagamentos", label: "Pagamentos" },
                  { value: "levantamentos", label: "Levantamentos" },
                  { value: "comunidades", label: "Comunidades" },
                  { value: "outro", label: "Outro" },
                ]}
              />
            </div>
          </section>

          <section className="fade-in-up fade-delay-3">
            {conversasFiltradas.length === 0 ? (
              <EmptyBox />
            ) : (
              <div style={{ display: "grid", gap: "16px" }}>
                {conversasFiltradas.map((conversa) => {
                  const formador = formadoresMap[conversa.formador_id];

                  return (
                    <Link
                      key={conversa.id}
                      href={`/admin/chat-formadores/${conversa.id}`}
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
                            Conversa #{conversa.id}
                          </p>

                          <h2
                            style={{
                              margin: "0 0 12px 0",
                              fontFamily: "Cinzel, serif",
                              fontSize: "clamp(24px, 3vw, 30px)",
                              color: "#f0d79a",
                              fontWeight: 500,
                            }}
                          >
                            {conversa.assunto}
                          </h2>

                          <p
                            style={{
                              margin: "0 0 10px 0",
                              color: "#d8b36f",
                              fontSize: "18px",
                              lineHeight: 1.6,
                            }}
                          >
                            Formador: {formador?.nome || "Sem nome"}
                            {formador?.email ? ` — ${formador.email}` : ""}
                          </p>

                          <p
                            style={{
                              margin: 0,
                              color: "#d8b36f",
                              fontSize: "18px",
                              lineHeight: 1.6,
                            }}
                          >
                            Última atualização:{" "}
                            {formatarDataHora(conversa.updated_at)}
                          </p>
                        </div>

                        <div style={{ display: "grid", gap: "10px", minWidth: "220px" }}>
                          <Tag label={conversa.estado} />
                          <Tag label={`Categoria: ${conversa.categoria}`} />
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
      <h2 className="admin-summary-title">A carregar conversas</h2>
      <p className="admin-loading-text">
        A administração está a reunir as conversas internas dos formadores.
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
        Não existem conversas a mostrar com os filtros atuais.
      </p>
    </section>
  );
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