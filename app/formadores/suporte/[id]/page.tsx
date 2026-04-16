"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
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
  formador_id: number;
};

type Mensagem = {
  id: number;
  created_at: string;
  autor_tipo: "formador" | "admin" | "sistema";
  autor_formador_id: number | null;
  autor_admin_id: number | null;
  mensagem: string;
};

export default function FormadorSuporteDetalhePage() {
  const params = useParams();
  const conversaId = Number(params.id);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  const [formador, setFormador] = useState<Formador | null>(null);
  const [conversa, setConversa] = useState<Conversa | null>(null);
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [novaMensagem, setNovaMensagem] = useState("");

  useEffect(() => {
    if (!Number.isFinite(conversaId)) {
      setErro("ID de conversa inválido.");
      setLoading(false);
      return;
    }

    carregarTudo();
  }, [conversaId]);

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
        throw new Error("Não foi possível validar a sessão do formador.");
      }

      const formadorData = await encontrarFormadorComRecuperacao(
        user.id,
        user.email
      );

      if (!formadorData) {
        throw new Error("Não foi possível identificar o registo do formador.");
      }

      if (formadorData.status !== "aprovado") {
        throw new Error("A conta de formador ainda não está aprovada.");
      }

      setFormador(formadorData);

      const { data: conversaData, error: conversaError } = await supabase
        .from("chat_admin_formador_conversas")
        .select("id, created_at, updated_at, categoria, assunto, estado, formador_id")
        .eq("id", conversaId)
        .eq("formador_id", formadorData.id)
        .maybeSingle();

      if (conversaError || !conversaData) {
        throw new Error("Não foi possível carregar a conversa.");
      }

      setConversa(conversaData as Conversa);

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
    } catch (err: any) {
      setErro(err?.message || "Ocorreu um erro ao carregar a conversa.");
    } finally {
      setLoading(false);
    }
  }

  async function enviarMensagem() {
    if (!conversa || !formador) return;

    if (!novaMensagem.trim()) {
      setErro("Escreve a tua mensagem antes de enviar.");
      return;
    }

    setSubmitting(true);
    setErro("");
    setSucesso("");

    try {
      const { error: insertError } = await supabase
        .from("chat_admin_formador_mensagens")
        .insert({
          conversa_id: conversa.id,
          autor_tipo: "formador",
          autor_formador_id: formador.id,
          mensagem: novaMensagem.trim(),
        });

      if (insertError) {
        throw insertError;
      }

      const { error: updateError } = await supabase
        .from("chat_admin_formador_conversas")
        .update({
          estado: "aguarda_admin",
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
        padding: "40px 16px 90px",
        fontFamily: "Cormorant Garamond, serif",
      }}
    >
      <section style={{ maxWidth: "1180px", margin: "0 auto" }}>
        {loading ? (
          <Box>
            <h2 style={tituloSecao}>A carregar conversa</h2>
            <p style={textoBase}>
              Estamos a reunir o histórico da conversa interna.
            </p>
          </Box>
        ) : erro && !conversa ? (
          <ErrorBox texto={erro} />
        ) : !conversa ? (
          <ErrorBox texto="Conversa não encontrada." />
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
                  <p style={tagTopStyle}>Conversa #{conversa.id}</p>

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
                    {conversa.assunto}
                  </h1>

                  <p style={textoBase}>Categoria: {conversa.categoria}</p>
                </div>

                <Link href="/formadores/suporte" style={botaoSecundario}>
                  Voltar ao suporte
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
                <Tag texto={`Estado: ${conversa.estado}`} />
                <Tag texto={`Criado em: ${formatarDataHora(conversa.created_at)}`} />
                <Tag
                  texto={`Atualizado em: ${formatarDataHora(conversa.updated_at)}`}
                />
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
                <h2 style={tituloSecao}>Histórico da conversa</h2>

                <div style={{ display: "grid", gap: "14px" }}>
                  {mensagens.length === 0 ? (
                    <div style={blocoVazioStyle}>
                      <p style={textoBase}>
                        Ainda não existem mensagens nesta conversa.
                      </p>
                    </div>
                  ) : (
                    mensagens.map((mensagem) => (
                      <div key={mensagem.id} style={timelineItemStyle}>
                        <p style={timelineMetaStyle}>
                          {formatarDataHora(mensagem.created_at)} —{" "}
                          {capitalizarAutor(mensagem.autor_tipo)}
                        </p>

                        <p
                          style={{
                            ...textoBase,
                            whiteSpace: "pre-wrap",
                          }}
                        >
                          {mensagem.mensagem}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </Box>

              <Box>
                <h2 style={tituloSecao}>Responder à administração</h2>

                <div style={{ display: "grid", gap: "14px" }}>
                  <textarea
                    value={novaMensagem}
                    onChange={(event) => setNovaMensagem(event.target.value)}
                    rows={8}
                    placeholder="Escreve a tua resposta."
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

const blocoVazioStyle: React.CSSProperties = {
  border: "1px solid rgba(166,120,61,0.22)",
  background: "rgba(32,18,13,0.45)",
  padding: "18px",
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