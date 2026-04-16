"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Formador = {
  id: number;
  nome: string | null;
  email: string | null;
  auth_id: string | null;
  status: string | null;
};

type Levantamento = {
  id: number;
  formador_id: number;
  valor_solicitado: number | null;
  valor_bruto: number | null;
  valor_liquido: number | null;
  estado: string | null;
  comprovativo_url: string | null;
  observacoes_admin: string | null;
  observacoes_formador: string | null;
  created_at: string | null;
  updated_at: string | null;
  pago_em: string | null;
};

export default function HistoricoLevantamentosFormadorPage() {
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [formador, setFormador] = useState<Formador | null>(null);
  const [levantamentos, setLevantamentos] = useState<Levantamento[]>([]);

  useEffect(() => {
    carregarDados();
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

    if (!userEmail) {
      return null;
    }

    const { data: porEmail } = await supabase
      .from("formadores")
      .select("id, nome, email, auth_id, status")
      .eq("email", userEmail)
      .maybeSingle();

    if (!porEmail) {
      return null;
    }

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

  async function carregarDados() {
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
        setErro(
          "Não foi possível encontrar o registo do formador. O login está válido, mas o registo ainda não ficou corretamente ligado a esta conta."
        );
        setLoading(false);
        return;
      }

      if (formadorData.status !== "aprovado") {
        setErro("A conta de formador ainda não está aprovada.");
        setLoading(false);
        return;
      }

      setFormador(formadorData);

      const { data, error } = await supabase
        .from("levantamentos_formador")
        .select(
          "id, formador_id, valor_solicitado, valor_bruto, valor_liquido, estado, comprovativo_url, observacoes_admin, observacoes_formador, created_at, updated_at, pago_em"
        )
        .eq("formador_id", formadorData.id)
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      setLevantamentos((data || []) as Levantamento[]);
    } catch (error: any) {
      setErro(
        error?.message ||
          "Ocorreu um erro inesperado ao carregar o histórico de levantamentos."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top, rgba(166,120,61,0.08), transparent 20%), #2b160f",
        color: "#e6c27a",
        fontFamily: "Cormorant Garamond, serif",
        padding: "50px 16px 90px",
      }}
    >
      <section
        style={{
          maxWidth: "1280px",
          margin: "0 auto",
        }}
      >
        <header style={{ marginBottom: "28px" }}>
          <p
            style={{
              margin: "0 0 10px 0",
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: "#caa15a",
              fontSize: "15px",
            }}
          >
            Área do Formador
          </p>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
              gap: "18px",
              flexWrap: "wrap",
            }}
          >
            <div>
              <h1
                style={{
                  margin: "0 0 12px 0",
                  fontFamily: "Cinzel, serif",
                  fontSize: "clamp(34px, 6vw, 64px)",
                  lineHeight: 1.1,
                  color: "#f0d79a",
                  fontWeight: 500,
                }}
              >
                Histórico de Levantamentos
              </h1>

              <p
                style={{
                  margin: 0,
                  fontSize: "clamp(18px, 2.2vw, 22px)",
                  lineHeight: 1.7,
                  color: "#d7b06c",
                  maxWidth: "900px",
                }}
              >
                Consulta todos os pedidos enviados, respetivos estados, valores
                e observações associadas à validação administrativa.
              </p>
            </div>

            <div
              style={{
                display: "flex",
                gap: "12px",
                flexWrap: "wrap",
              }}
            >
              <Link href="/formadores/levantamentos" style={botaoSecundario}>
                Voltar a levantamentos
              </Link>

              <Link href="/formadores/dashboard" style={botao}>
                Voltar à dashboard
              </Link>
            </div>
          </div>
        </header>

        {loading ? (
          <LoadingBox />
        ) : erro ? (
          <ErrorBox texto={erro} />
        ) : levantamentos.length === 0 ? (
          <EmptyBox texto="Ainda não existem pedidos de levantamento registados no histórico." />
        ) : (
          <div
            style={{
              display: "grid",
              gap: "18px",
            }}
          >
            {levantamentos.map((item) => (
              <article
                key={item.id}
                style={{
                  border: "1px solid #8a5d31",
                  background:
                    "linear-gradient(180deg, rgba(20,13,9,0.98) 0%, rgba(16,10,8,0.98) 100%)",
                  padding: "24px",
                  boxShadow:
                    "0 12px 26px rgba(0,0,0,0.16), inset 0 1px 0 rgba(255,225,170,0.03)",
                }}
              >
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                    gap: "14px",
                    marginBottom: "18px",
                  }}
                >
                  <InfoMini
                    label="Pedido"
                    valor={`#${item.id}`}
                  />
                  <InfoMini
                    label="Valor pedido"
                    valor={formatarEuro(
                      item.valor_solicitado ??
                        item.valor_liquido ??
                        item.valor_bruto
                    )}
                  />
                  <InfoMini
                    label="Estado"
                    valor={traduzirEstadoLevantamento(item.estado)}
                  />
                  <InfoMini
                    label="Criado em"
                    valor={formatarData(item.created_at)}
                  />
                  <InfoMini
                    label="Atualizado em"
                    valor={formatarData(item.updated_at)}
                  />
                  <InfoMini
                    label="Pago em"
                    valor={formatarData(item.pago_em)}
                  />
                </div>

                <div
                  style={{
                    display: "grid",
                    gap: "12px",
                  }}
                >
                  <BlocoTexto
                    titulo="Documentação"
                    texto={
                      item.comprovativo_url
                        ? "Este pedido tem comprovativo ou fatura associados."
                        : "Este pedido não tem comprovativo associado."
                    }
                  />

                  {item.observacoes_formador ? (
                    <BlocoTexto
                      titulo="Observações do formador"
                      texto={item.observacoes_formador}
                    />
                  ) : null}

                  {item.observacoes_admin ? (
                    <BlocoTexto
                      titulo="Observações da administração"
                      texto={item.observacoes_admin}
                    />
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

function normalizarNumero(valor: unknown) {
  if (typeof valor === "number" && !Number.isNaN(valor)) return valor;
  if (typeof valor === "string") {
    const convertido = Number(valor);
    if (!Number.isNaN(convertido)) return convertido;
  }
  return 0;
}

function normalizarEstado(valor: string | null | undefined) {
  return (valor || "").trim().toLowerCase();
}

function formatarEuro(valor: number | null | undefined) {
  return new Intl.NumberFormat("pt-PT", {
    style: "currency",
    currency: "EUR",
  }).format(normalizarNumero(valor));
}

function formatarData(valor: string | null | undefined) {
  if (!valor) return "—";

  const data = new Date(valor);
  if (Number.isNaN(data.getTime())) return "—";

  return data.toLocaleDateString("pt-PT");
}

function traduzirEstadoLevantamento(estado: string | null | undefined) {
  const valor = normalizarEstado(estado);

  if (valor === "aguarda_fatura") return "Aguarda fatura";
  if (valor === "fatura_enviada") return "Fatura enviada";
  if (valor === "aguarda_validacao") return "Aguarda validação";
  if (valor === "em_analise") return "Em análise";
  if (valor === "validado_admin") return "Validado pela administração";
  if (valor === "pago") return "Pago";
  if (valor === "recusado") return "Recusado";
  if (valor === "cancelado") return "Cancelado";

  return estado || "Sem estado";
}

function InfoMini({
  label,
  valor,
}: {
  label: string;
  valor: string;
}) {
  return (
    <div
      style={{
        border: "1px solid rgba(166,120,61,0.16)",
        background: "rgba(20,13,9,0.5)",
        padding: "16px 18px",
      }}
    >
      <p
        style={{
          margin: "0 0 8px 0",
          fontSize: "15px",
          color: "#caa15a",
          textTransform: "uppercase",
          letterSpacing: "1px",
        }}
      >
        {label}
      </p>

      <p
        style={{
          margin: 0,
          fontSize: "20px",
          color: "#d7b06c",
          lineHeight: 1.6,
          wordBreak: "break-word",
        }}
      >
        {valor}
      </p>
    </div>
  );
}

function BlocoTexto({
  titulo,
  texto,
}: {
  titulo: string;
  texto: string;
}) {
  return (
    <div
      style={{
        border: "1px solid rgba(166,120,61,0.18)",
        background: "rgba(32,18,13,0.40)",
        padding: "16px",
      }}
    >
      <p
        style={{
          margin: "0 0 10px 0",
          fontSize: "16px",
          color: "#caa15a",
          textTransform: "uppercase",
          letterSpacing: "0.08em",
        }}
      >
        {titulo}
      </p>

      <p
        style={{
          margin: 0,
          fontSize: "18px",
          color: "#d7b06c",
          lineHeight: 1.75,
        }}
      >
        {texto}
      </p>
    </div>
  );
}

function EmptyBox({ texto }: { texto: string }) {
  return (
    <section
      style={{
        border: "1px solid rgba(166,120,61,0.18)",
        background:
          "linear-gradient(180deg, rgba(20,13,9,0.98) 0%, rgba(16,10,8,0.98) 100%)",
        padding: "28px",
        color: "#d7b06c",
        fontSize: "20px",
        lineHeight: 1.7,
      }}
    >
      {texto}
    </section>
  );
}

function LoadingBox() {
  return (
    <section
      style={{
        border: "1px solid rgba(166,120,61,0.7)",
        background:
          "linear-gradient(180deg, rgba(15,9,7,0.96) 0%, rgba(28,16,12,0.98) 100%)",
        padding: "30px",
        boxShadow:
          "0 16px 40px rgba(0,0,0,0.26), inset 0 1px 0 rgba(255,225,170,0.04)",
      }}
    >
      <h2
        style={{
          fontFamily: "Cinzel, serif",
          fontSize: "clamp(26px, 4vw, 34px)",
          margin: "0 0 18px 0",
          color: "#f0d79a",
          fontWeight: 500,
        }}
      >
        A carregar histórico
      </h2>

      <p
        style={{
          margin: 0,
          fontSize: "clamp(18px, 2.2vw, 22px)",
          lineHeight: 1.7,
          color: "#dfbe81",
        }}
      >
        A plataforma está a reunir todos os pedidos de levantamento do
        formador.
      </p>
    </section>
  );
}

function ErrorBox({ texto }: { texto: string }) {
  return (
    <section
      style={{
        border: "1px solid rgba(255,107,107,0.35)",
        background: "rgba(120,20,20,0.12)",
        padding: "24px",
        color: "#ffb4b4",
        fontSize: "20px",
        lineHeight: 1.7,
      }}
    >
      {texto}
    </section>
  );
}

const botao: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  textDecoration: "none",
  border: "1px solid #a6783d",
  color: "#e6c27a",
  padding: "14px 18px",
  fontSize: "16px",
  background: "transparent",
  textAlign: "center",
};

const botaoSecundario: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  textDecoration: "none",
  border: "1px solid rgba(166,120,61,0.6)",
  color: "#e6c27a",
  padding: "12px 16px",
  fontSize: "15px",
  background: "rgba(32,18,13,0.55)",
  cursor: "pointer",
  textAlign: "center",
};