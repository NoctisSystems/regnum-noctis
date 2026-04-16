"use client";

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
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

type Mensagem = {
  id: number;
  created_at: string;
  autor_tipo: "formador" | "admin" | "sistema";
  autor_formador_id: number | null;
  autor_admin_id: number | null;
  mensagem: string;
};

type Formador = {
  id: number;
  nome: string | null;
  email: string | null;
};

type Admin = {
  id: number;
  auth_id: string | null;
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

export default function AdminChatFormadorDetalhePage() {
  const pathname = usePathname();
  const params = useParams();
  const conversaId = Number(params.id);

  const [loading, setLoading] = useState(true);
  const [submittingMensagem, setSubmittingMensagem] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  const [conversa, setConversa] = useState<Conversa | null>(null);
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [formador, setFormador] = useState<Formador | null>(null);
  const [adminAtual, setAdminAtual] = useState<Admin | null>(null);

  const [novaMensagem, setNovaMensagem] = useState("");
  const [novoEstado, setNovoEstado] = useState("");

  useEffect(() => {
    if (!Number.isFinite(conversaId)) {
      setErro("ID de conversa inválido.");
      setLoading(false);
      return;
    }

    carregarTudo();
  }, [conversaId]);

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

      const { data: conversaData, error: conversaError } = await supabase
        .from("chat_admin_formador_conversas")
        .select(
          "id, created_at, updated_at, formador_id, admin_responsavel_id, categoria, assunto, estado"
        )
        .eq("id", conversaId)
        .maybeSingle();

      if (conversaError || !conversaData) {
        throw new Error("Não foi possível carregar a conversa.");
      }

      const conversaCast = conversaData as Conversa;
      setConversa(conversaCast);
      setNovoEstado(conversaCast.estado);

      const { data: mensagensData, error: mensagensError } = await supabase
        .from("chat_admin_formador_mensagens")
        .select(
          "id, created_at, autor_tipo, autor_formador_id, autor_admin_id, mensagem"
        )
        .eq("conversa_id", conversaId)
        .order("created_at", { ascending: true });

      if (mensagensError) {
        throw mensagensError;
      }

      setMensagens((mensagensData || []) as Mensagem[]);

      const { data: formadorData, error: formadorError } = await supabase
        .from("formadores")
        .select("id, nome, email")
        .eq("id", conversaCast.formador_id)
        .maybeSingle();

      if (formadorError) {
        throw formadorError;
      }

      setFormador((formadorData as Formador | null) || null);
    } catch (err: any) {
      setErro(err?.message || "Ocorreu um erro ao carregar a conversa.");
    } finally {
      setLoading(false);
    }
  }

  async function guardarEstado() {
    if (!conversa || !adminAtual) return;

    setErro("");
    setSucesso("");

    const { error } = await supabase
      .from("chat_admin_formador_conversas")
      .update({
        estado: novoEstado,
        admin_responsavel_id: adminAtual.id,
      })
      .eq("id", conversa.id);

    if (error) {
      setErro(error.message || "Não foi possível atualizar a conversa.");
      return;
    }

    setSucesso("Conversa atualizada com sucesso.");
    await carregarTudo();
  }

  async function enviarMensagem() {
    if (!conversa || !adminAtual) return;

    if (!novaMensagem.trim()) {
      setErro("Escreve a mensagem antes de enviar.");
      return;
    }

    setSubmittingMensagem(true);
    setErro("");
    setSucesso("");

    try {
      const { error: insertError } = await supabase
        .from("chat_admin_formador_mensagens")
        .insert({
          conversa_id: conversa.id,
          autor_tipo: "admin",
          autor_admin_id: adminAtual.id,
          mensagem: novaMensagem.trim(),
        });

      if (insertError) {
        throw insertError;
      }

      const { error: updateError } = await supabase
        .from("chat_admin_formador_conversas")
        .update({
          estado: "aguarda_formador",
          admin_responsavel_id: adminAtual.id,
        })
        .eq("id", conversa.id);

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

  if (loading) {
    return (
      <>
        <TopNav pathname={pathname} />
        <LoadingBox />
      </>
    );
  }

  if (erro && !conversa) {
    return (
      <>
        <TopNav pathname={pathname} />
        <ErrorBox texto={erro} />
      </>
    );
  }

  if (!conversa) {
    return (
      <>
        <TopNav pathname={pathname} />
        <ErrorBox texto="Conversa não encontrada." />
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
              Conversa #{conversa.id}
            </p>

            <h1 className="admin-summary-title" style={{ marginBottom: "12px" }}>
              {conversa.assunto}
            </h1>

            <p
              style={{
                margin: 0,
                color: "#d8b36f",
                fontSize: "19px",
                lineHeight: 1.7,
              }}
            >
              Formador: {formador?.nome || "Sem nome"}
              {formador?.email ? ` — ${formador.email}` : ""}
            </p>
          </div>

          <Link
            href="/admin/chat-formadores"
            className="admin-top-nav-link"
            style={{ minHeight: "48px", paddingInline: "18px" }}
          >
            Voltar ao chat
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
            <SectionTitle titulo="Histórico da conversa" />

            <div style={{ display: "grid", gap: "14px" }}>
              {mensagens.length === 0 ? (
                <p
                  style={{
                    margin: 0,
                    color: "#d8b36f",
                    fontSize: "18px",
                    lineHeight: 1.7,
                  }}
                >
                  Ainda não existem mensagens nesta conversa.
                </p>
              ) : (
                mensagens.map((mensagem) => (
                  <div
                    key={mensagem.id}
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
                      {formatarDataHora(mensagem.created_at)} —{" "}
                      {capitalizarAutor(mensagem.autor_tipo)}
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
                      {mensagem.mensagem}
                    </p>
                  </div>
                ))
              )}
            </div>
          </Panel>

          <Panel>
            <SectionTitle titulo="Responder ao formador" />

            <div style={{ display: "grid", gap: "14px" }}>
              <textarea
                value={novaMensagem}
                onChange={(event) => setNovaMensagem(event.target.value)}
                rows={7}
                placeholder="Escreve a resposta da administração."
                style={textareaStyle}
              />

              <button
                type="button"
                onClick={enviarMensagem}
                disabled={submittingMensagem}
                className="admin-top-nav-link active"
                style={{
                  minHeight: "48px",
                  paddingInline: "18px",
                  width: "fit-content",
                  cursor: submittingMensagem ? "not-allowed" : "pointer",
                  opacity: submittingMensagem ? 0.7 : 1,
                }}
              >
                {submittingMensagem ? "A enviar..." : "Enviar mensagem"}
              </button>
            </div>
          </Panel>
        </div>

        <div style={{ display: "grid", gap: "22px" }}>
          <Panel>
            <SectionTitle titulo="Dados da conversa" />

            <InfoRow label="Categoria">
              <TextValue>{conversa.categoria}</TextValue>
            </InfoRow>

            <InfoRow label="Estado">
              <select
                value={novoEstado}
                onChange={(event) => setNovoEstado(event.target.value)}
                style={fieldStyle}
              >
                <option value="aberto">Aberto</option>
                <option value="em_analise">Em análise</option>
                <option value="aguarda_formador">Aguarda formador</option>
                <option value="aguarda_admin">Aguarda admin</option>
                <option value="fechado">Fechado</option>
              </select>
            </InfoRow>

            <InfoRow label="Criado em">
              <TextValue>{formatarDataHora(conversa.created_at)}</TextValue>
            </InfoRow>

            <InfoRow label="Atualizado em">
              <TextValue>{formatarDataHora(conversa.updated_at)}</TextValue>
            </InfoRow>

            <button
              type="button"
              onClick={guardarEstado}
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

            <InfoRow label="Formador">
              <TextValue>
                {formador?.nome || "Sem nome"}
                {formador?.email ? ` — ${formador.email}` : ""}
              </TextValue>
            </InfoRow>

            <InfoRow label="Admin responsável">
              <TextValue>
                {conversa.admin_responsavel_id
                  ? `Admin #${conversa.admin_responsavel_id}`
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
            (item.href === "/admin/chat-formadores" &&
              pathname.startsWith("/admin/chat-formadores")) ||
            (item.href === "/admin/tickets" &&
              pathname.startsWith("/admin/tickets"));

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
      <h2 className="admin-summary-title">A carregar conversa</h2>
      <p className="admin-loading-text">
        A administração está a reunir o histórico do chat interno com o
        formador.
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