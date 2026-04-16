"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type Formador = {
  id: number;
  nome: string | null;
  email: string | null;
  auth_id: string | null;
  status: string | null;
};

type Conversa = {
  id: number;
  created_at: string;
  updated_at: string;
  categoria: string;
  assunto: string;
  estado: string;
};

type NovoChat = {
  categoria: string;
  assunto: string;
  mensagem: string;
};

const formInicial: NovoChat = {
  categoria: "outro",
  assunto: "",
  mensagem: "",
};

export default function FormadorSuportePage() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  const [formador, setFormador] = useState<Formador | null>(null);
  const [conversas, setConversas] = useState<Conversa[]>([]);
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [form, setForm] = useState<NovoChat>(formInicial);

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
    setSucesso("");

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

      const { data: conversasData, error: conversasError } = await supabase
        .from("chat_admin_formador_conversas")
        .select("id, created_at, updated_at, categoria, assunto, estado")
        .eq("formador_id", formadorData.id)
        .order("updated_at", { ascending: false });

      if (conversasError) {
        throw conversasError;
      }

      setConversas((conversasData || []) as Conversa[]);
    } catch (err: any) {
      setErro(
        err?.message ||
          "Ocorreu um erro ao carregar o suporte interno do formador."
      );
    } finally {
      setLoading(false);
    }
  }

  function atualizarForm<K extends keyof NovoChat>(
    campo: K,
    valor: NovoChat[K]
  ) {
    setForm((prev) => ({ ...prev, [campo]: valor }));
  }

  function validar() {
    if (!form.categoria.trim()) return "Seleciona a categoria.";
    if (!form.assunto.trim()) return "Indica o assunto.";
    if (!form.mensagem.trim()) return "Escreve a mensagem inicial.";
    return "";
  }

  async function criarConversa(event: FormEvent) {
    event.preventDefault();

    if (!formador) {
      setErro("Não foi possível identificar o formador.");
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
      const { data: conversaData, error: conversaError } = await supabase
        .from("chat_admin_formador_conversas")
        .insert({
          formador_id: formador.id,
          categoria: form.categoria,
          assunto: form.assunto.trim(),
          estado: "aberto",
        })
        .select("id")
        .single();

      if (conversaError) {
        throw conversaError;
      }

      const { error: mensagemError } = await supabase
        .from("chat_admin_formador_mensagens")
        .insert({
          conversa_id: conversaData.id,
          autor_tipo: "formador",
          autor_formador_id: formador.id,
          mensagem: form.mensagem.trim(),
        });

      if (mensagemError) {
        throw mensagemError;
      }

      setForm(formInicial);
      setSucesso("Conversa interna criada com sucesso.");
      await carregarTudo();
    } catch (err: any) {
      setErro(err?.message || "Não foi possível abrir a conversa.");
    } finally {
      setSubmitting(false);
    }
  }

  const conversasFiltradas = useMemo(() => {
    if (filtroEstado === "todos") return conversas;
    return conversas.filter((item) => item.estado === filtroEstado);
  }, [conversas, filtroEstado]);

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
      <section style={{ maxWidth: "1240px", margin: "0 auto" }}>
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
            Suporte interno
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
            Comunica diretamente com a administração para questões operacionais,
            técnicas, pagamentos, levantamentos, comunidades ou qualquer outra
            situação interna.
          </p>
        </header>

        {loading ? (
          <Box>
            <h2 style={tituloSecao}>A carregar suporte</h2>
            <p style={textoBase}>
              Estamos a reunir as tuas conversas internas com a administração.
            </p>
          </Box>
        ) : erro && !formador ? (
          <ErrorBox texto={erro} />
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0, 1.02fr) minmax(320px, 0.98fr)",
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
                    <h2 style={tituloSecao}>Conversas existentes</h2>
                    <p style={textoBase}>
                      Acompanha o estado das conversas internas já abertas.
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
                      <option value="aguarda_formador">Aguarda formador</option>
                      <option value="aguarda_admin">Aguarda administração</option>
                      <option value="fechado">Fechado</option>
                    </select>
                  </label>
                </div>

                {conversasFiltradas.length === 0 ? (
                  <div style={blocoVazioStyle}>
                    <p style={textoBase}>
                      Ainda não tens conversas internas registadas.
                    </p>
                  </div>
                ) : (
                  <div style={{ display: "grid", gap: "14px" }}>
                    {conversasFiltradas.map((conversa) => (
                      <Link
                        key={conversa.id}
                        href={`/formadores/suporte/${conversa.id}`}
                        style={cardLinkStyle}
                      >
                        <p style={tagTopStyle}>Conversa #{conversa.id}</p>

                        <h3 style={tituloCardStyle}>{conversa.assunto}</h3>

                        <p style={textoBase}>Categoria: {conversa.categoria}</p>

                        <div
                          style={{
                            display: "grid",
                            gap: "8px",
                            marginTop: "14px",
                          }}
                        >
                          <Tag texto={`Estado: ${conversa.estado}`} />
                          <Tag
                            texto={`Atualizado em: ${formatarDataHora(
                              conversa.updated_at
                            )}`}
                          />
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </Box>
            </div>

            <div style={{ display: "grid", gap: "22px" }}>
              <Box>
                <h2 style={tituloSecao}>Abrir nova conversa</h2>
                <p style={textoBase}>
                  Usa esta área para informar a administração de ausências,
                  problemas técnicos, dúvidas operacionais ou outras situações.
                </p>

                <form
                  onSubmit={criarConversa}
                  style={{
                    display: "grid",
                    gap: "14px",
                    marginTop: "18px",
                  }}
                >
                  <label style={{ display: "grid", gap: "8px" }}>
                    <span style={labelStyle}>Categoria</span>
                    <select
                      value={form.categoria}
                      onChange={(event) =>
                        atualizarForm("categoria", event.target.value)
                      }
                      style={fieldStyle}
                    >
                      <option value="doenca_ausencia">Doença / ausência</option>
                      <option value="problema_tecnico">Problema técnico</option>
                      <option value="atualizacao_curso">
                        Atualização de curso
                      </option>
                      <option value="problema_aluno">Problema com aluno</option>
                      <option value="pagamentos">Pagamentos</option>
                      <option value="levantamentos">Levantamentos</option>
                      <option value="comunidades">Comunidades</option>
                      <option value="outro">Outro</option>
                    </select>
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
                      value={form.mensagem}
                      onChange={(event) =>
                        atualizarForm("mensagem", event.target.value)
                      }
                      rows={8}
                      placeholder="Descreve a situação com o máximo de clareza."
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
                    {submitting ? "A abrir conversa..." : "Abrir conversa"}
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