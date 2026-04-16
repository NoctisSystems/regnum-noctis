"use client";

import Link from "next/link";
import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type Formador = {
  id: number;
  nome: string | null;
  email: string | null;
  auth_id: string | null;
  status: string | null;
};

type ResumoFinanceiroFormador = {
  saldo_disponivel: number | null;
  saldo_retido: number | null;
  saldo_em_analise: number | null;
  saldo_chargeback: number | null;
  total_pago: number | null;
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
  created_at: string | null;
  updated_at: string | null;
  pago_em: string | null;
};

const resumoFinanceiroInicial: ResumoFinanceiroFormador = {
  saldo_disponivel: 0,
  saldo_retido: 0,
  saldo_em_analise: 0,
  saldo_chargeback: 0,
  total_pago: 0,
};

export default function FormadorLevantamentosPage() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingComprovativo, setUploadingComprovativo] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  const [formador, setFormador] = useState<Formador | null>(null);
  const [resumoFinanceiro, setResumoFinanceiro] =
    useState<ResumoFinanceiroFormador>(resumoFinanceiroInicial);
  const [levantamentosRecentes, setLevantamentosRecentes] = useState<
    Levantamento[]
  >([]);

  const [valorPedido, setValorPedido] = useState("");
  const [comprovativoFile, setComprovativoFile] = useState<File | null>(null);
  const [comprovativoPath, setComprovativoPath] = useState("");
  const [observacoes, setObservacoes] = useState("");

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

  async function carregarResumoFinanceiro(formadorId: number) {
    try {
      const tentativas = [
        supabase
          .from("formadores_resumo_financeiro")
          .select(
            "saldo_disponivel, saldo_retido, saldo_em_analise, saldo_chargeback, total_pago"
          )
          .eq("formador_id", formadorId)
          .maybeSingle(),

        supabase
          .from("formador_resumo_financeiro")
          .select(
            "saldo_disponivel, saldo_retido, saldo_em_analise, saldo_chargeback, total_pago"
          )
          .eq("formador_id", formadorId)
          .maybeSingle(),

        supabase
          .from("vw_formador_resumo_financeiro")
          .select(
            "saldo_disponivel, saldo_retido, saldo_em_analise, saldo_chargeback, total_pago"
          )
          .eq("formador_id", formadorId)
          .maybeSingle(),
      ];

      for (const tentativa of tentativas) {
        const { data, error } = await tentativa;

        if (!error && data) {
          setResumoFinanceiro({
            saldo_disponivel: normalizarNumero(data.saldo_disponivel),
            saldo_retido: normalizarNumero(data.saldo_retido),
            saldo_em_analise: normalizarNumero(data.saldo_em_analise),
            saldo_chargeback: normalizarNumero(data.saldo_chargeback),
            total_pago: normalizarNumero(data.total_pago),
          });
          return;
        }
      }

      setResumoFinanceiro(resumoFinanceiroInicial);
    } catch {
      setResumoFinanceiro(resumoFinanceiroInicial);
    }
  }

  async function carregarLevantamentosRecentes(formadorId: number) {
    try {
      const { data, error } = await supabase
        .from("levantamentos_formador")
        .select(
          "id, formador_id, valor_solicitado, valor_bruto, valor_liquido, estado, comprovativo_url, observacoes_admin, created_at, updated_at, pago_em"
        )
        .eq("formador_id", formadorId)
        .order("created_at", { ascending: false })
        .limit(6);

      if (error) {
        throw error;
      }

      setLevantamentosRecentes((data || []) as Levantamento[]);
    } catch {
      setLevantamentosRecentes([]);
    }
  }

  async function carregarDados() {
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

      await Promise.all([
        carregarResumoFinanceiro(formadorData.id),
        carregarLevantamentosRecentes(formadorData.id),
      ]);
    } catch {
      setErro("Ocorreu um erro inesperado ao carregar os levantamentos.");
    } finally {
      setLoading(false);
    }
  }

  const saldoDisponivel = useMemo(
    () => normalizarNumero(resumoFinanceiro.saldo_disponivel),
    [resumoFinanceiro]
  );

  const existePedidoAberto = useMemo(() => {
    return levantamentosRecentes.some((item) =>
      [
        "aguarda_fatura",
        "fatura_enviada",
        "em_analise",
        "validado_admin",
        "aguarda_validacao",
      ].includes(normalizarEstado(item.estado))
    );
  }, [levantamentosRecentes]);

  function validarPedido() {
    if (!formador) {
      return "Não foi possível validar o formador autenticado.";
    }

    if (saldoDisponivel <= 0) {
      return "Não tens saldo disponível para levantamento.";
    }

    if (!valorPedido.trim()) {
      return "Indica o valor que pretendes levantar.";
    }

    const valorNumero = Number(valorPedido.replace(",", "."));

    if (Number.isNaN(valorNumero) || valorNumero <= 0) {
      return "Indica um valor válido para levantamento.";
    }

    if (valorNumero > saldoDisponivel) {
      return "O valor pedido não pode ultrapassar o saldo disponível.";
    }

    if (!comprovativoPath.trim()) {
      return "Tens de enviar o comprovativo ou fatura antes de pedir o levantamento.";
    }

    return "";
  }

  async function handleComprovativoChange(
    e: ChangeEvent<HTMLInputElement>
  ) {
    const file = e.target.files?.[0] || null;
    setErro("");
    setSucesso("");
    setComprovativoFile(file);

    if (!file) {
      setComprovativoPath("");
      return;
    }

    try {
      setUploadingComprovativo(true);

      const tiposPermitidos = [
        "application/pdf",
        "image/png",
        "image/jpeg",
        "image/jpg",
        "image/webp",
      ];

      if (!tiposPermitidos.includes(file.type)) {
        setErro("O comprovativo tem de estar em PDF, PNG, JPG ou WEBP.");
        setComprovativoPath("");
        return;
      }

      const maxBytes = 10 * 1024 * 1024;
      if (file.size > maxBytes) {
        setErro("O comprovativo não pode ultrapassar 10 MB.");
        setComprovativoPath("");
        return;
      }

      if (!formador) {
        setErro("Não foi possível validar o formador autenticado.");
        setComprovativoPath("");
        return;
      }

      const extensao = file.name.split(".").pop()?.toLowerCase() || "pdf";
      const nomeFicheiro = `formador-${formador.id}/levantamentos/${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}.${extensao}`;

      const { error: uploadError } = await supabase.storage
        .from("comprovativos_levantamento")
        .upload(nomeFicheiro, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        throw uploadError;
      }

      setComprovativoPath(nomeFicheiro);
      setSucesso("Comprovativo carregado com sucesso.");
    } catch (error: any) {
      setErro(
        error?.message ||
          "Não foi possível carregar o comprovativo do levantamento."
      );
      setComprovativoPath("");
    } finally {
      setUploadingComprovativo(false);
    }
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErro("");
    setSucesso("");

    const validacao = validarPedido();
    if (validacao) {
      setErro(validacao);
      return;
    }

    try {
      setSubmitting(true);

      if (!formador) {
        setErro("Não foi possível validar o formador autenticado.");
        return;
      }

      const valorNumero = Number(valorPedido.replace(",", "."));

      const payload = {
        formador_id: formador.id,
        valor_solicitado: valorNumero,
        comprovativo_url: comprovativoPath.trim(),
        estado: "fatura_enviada",
        observacoes_formador: observacoes.trim() || null,
      };

      const { error: insertError } = await supabase
        .from("levantamentos_formador")
        .insert([payload]);

      if (insertError) {
        throw insertError;
      }

      setSucesso("Pedido de levantamento enviado com sucesso.");
      setValorPedido("");
      setComprovativoFile(null);
      setComprovativoPath("");
      setObservacoes("");

      await Promise.all([
        carregarResumoFinanceiro(formador.id),
        carregarLevantamentosRecentes(formador.id),
      ]);
    } catch (error: any) {
      setErro(
        error?.message || "Não foi possível criar o pedido de levantamento."
      );
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
                Levantamentos
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
                Consulta os saldos do formador, envia a documentação exigida e
                acompanha o estado dos pedidos de levantamento.
              </p>
            </div>

            <div
              style={{
                display: "flex",
                gap: "12px",
                flexWrap: "wrap",
              }}
            >
              <Link href="/formadores/dashboard" style={botaoSecundario}>
                Voltar à dashboard
              </Link>

              <Link href="/formadores/levantamentos/historico" style={botao}>
                Ver histórico completo
              </Link>
            </div>
          </div>
        </header>

        {loading ? (
          <LoadingBox />
        ) : erro ? (
          <ErrorBox texto={erro} />
        ) : (
          <>
            <section style={{ marginBottom: "32px" }}>
              <SectionTitle
                titulo="Resumo financeiro"
                subtitulo="Situação atual dos saldos"
              />

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                  gap: "18px",
                }}
              >
                <MoneyCard
                  titulo="Saldo disponível"
                  valor={formatarEuro(resumoFinanceiro.saldo_disponivel)}
                  subtitulo="Pode seguir para pedido"
                />
                <MoneyCard
                  titulo="Saldo retido"
                  valor={formatarEuro(resumoFinanceiro.saldo_retido)}
                  subtitulo="Ainda não libertado"
                />
                <MoneyCard
                  titulo="Em análise"
                  valor={formatarEuro(resumoFinanceiro.saldo_em_analise)}
                  subtitulo="Aguarda validação"
                />
                <MoneyCard
                  titulo="Chargeback / bloqueios"
                  valor={formatarEuro(resumoFinanceiro.saldo_chargeback)}
                  subtitulo="Sob retenção"
                />
                <MoneyCard
                  titulo="Total já pago"
                  valor={formatarEuro(resumoFinanceiro.total_pago)}
                  subtitulo="Histórico liquidado"
                />
              </div>
            </section>

            <section
              style={{
                display: "grid",
                gridTemplateColumns: "minmax(0, 1.05fr) minmax(320px, 0.95fr)",
                gap: "24px",
                alignItems: "start",
              }}
            >
              <section
                style={{
                  border: "1px solid #8a5d31",
                  background:
                    "linear-gradient(180deg, rgba(20,13,9,0.98) 0%, rgba(16,10,8,0.98) 100%)",
                  padding: "26px",
                  boxShadow:
                    "0 12px 26px rgba(0,0,0,0.16), inset 0 1px 0 rgba(255,225,170,0.03)",
                }}
              >
                <SectionTitle
                  titulo="Pedir levantamento"
                  subtitulo="Envio com comprovativo obrigatório"
                />

                <div
                  style={{
                    border: "1px solid rgba(166,120,61,0.22)",
                    background: "rgba(32,18,13,0.45)",
                    padding: "18px",
                    marginBottom: "18px",
                  }}
                >
                  <p
                    style={{
                      margin: "0 0 10px 0",
                      fontSize: "19px",
                      color: "#f0d79a",
                      lineHeight: 1.7,
                    }}
                  >
                    O levantamento só pode seguir com fatura ou comprovativo
                    enviado pelo formador.
                  </p>

                  <p
                    style={{
                      margin: 0,
                      fontSize: "18px",
                      color: "#d7b06c",
                      lineHeight: 1.75,
                    }}
                  >
                    O pedido entra para validação administrativa. O pagamento
                    não é automático e pode ficar retido em caso de análise,
                    incidentes ou saldo ainda cativo.
                  </p>
                </div>

                {existePedidoAberto ? (
                  <div
                    style={{
                      border: "1px solid rgba(166,120,61,0.25)",
                      background: "rgba(166,120,61,0.06)",
                      padding: "16px",
                      marginBottom: "18px",
                      color: "#d7b06c",
                      fontSize: "18px",
                      lineHeight: 1.7,
                    }}
                  >
                    Existe pelo menos um pedido recente ainda em tratamento.
                    Podes continuar a consultar o histórico, mas confirma se
                    precisas mesmo de abrir um novo pedido.
                  </div>
                ) : null}

                {erro ? <InlineError texto={erro} /> : null}
                {sucesso ? <InlineSuccess texto={sucesso} /> : null}

                <form
                  onSubmit={handleSubmit}
                  style={{
                    display: "grid",
                    gap: "18px",
                  }}
                >
                  <div>
                    <label style={label}>Valor a levantar</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={valorPedido}
                      onChange={(e) => setValorPedido(e.target.value)}
                      placeholder="Ex.: 150.00"
                      style={input}
                    />
                    <p style={helperText}>
                      Saldo disponível atual:{" "}
                      <strong>{formatarEuro(saldoDisponivel)}</strong>
                    </p>
                  </div>

                  <div>
                    <label style={label}>Comprovativo / fatura</label>

                    <label style={uploadButton}>
                      Selecionar ficheiro
                      <input
                        type="file"
                        accept=".pdf,image/png,image/jpeg,image/jpg,image/webp"
                        onChange={handleComprovativoChange}
                        style={{ display: "none" }}
                      />
                    </label>

                    <p style={helperText}>
                      Formatos aceites: PDF, PNG, JPG e WEBP. Máximo: 10 MB.
                    </p>

                    {uploadingComprovativo ? (
                      <p style={helperText}>A carregar comprovativo...</p>
                    ) : comprovativoPath ? (
                      <p style={helperText}>
                        Ficheiro carregado com sucesso.
                      </p>
                    ) : comprovativoFile ? (
                      <p style={helperText}>
                        Ficheiro selecionado: <strong>{comprovativoFile.name}</strong>
                      </p>
                    ) : null}
                  </div>

                  <div>
                    <label style={label}>Observações do formador</label>
                    <textarea
                      value={observacoes}
                      onChange={(e) => setObservacoes(e.target.value)}
                      rows={4}
                      placeholder="Opcional. Ex.: observações sobre a documentação enviada."
                      style={textarea}
                    />
                  </div>

                  <div
                    style={{
                      display: "flex",
                      gap: "12px",
                      flexWrap: "wrap",
                    }}
                  >
                    <button
                      type="submit"
                      disabled={submitting || uploadingComprovativo}
                      style={{
                        ...submitButton,
                        opacity: submitting || uploadingComprovativo ? 0.7 : 1,
                        cursor:
                          submitting || uploadingComprovativo
                            ? "not-allowed"
                            : "pointer",
                      }}
                    >
                      {uploadingComprovativo
                        ? "A carregar comprovativo..."
                        : submitting
                        ? "A enviar pedido..."
                        : "Pedir levantamento"}
                    </button>

                    <Link
                      href="/formadores/levantamentos/historico"
                      style={botaoSecundario}
                    >
                      Ver histórico
                    </Link>
                  </div>
                </form>
              </section>

              <section
                style={{
                  border: "1px solid #8a5d31",
                  background:
                    "linear-gradient(180deg, rgba(20,13,9,0.98) 0%, rgba(16,10,8,0.98) 100%)",
                  padding: "26px",
                  boxShadow:
                    "0 12px 26px rgba(0,0,0,0.16), inset 0 1px 0 rgba(255,225,170,0.03)",
                }}
              >
                <SectionTitle
                  titulo="Pedidos recentes"
                  subtitulo="Últimos levantamentos do formador"
                />

                {levantamentosRecentes.length === 0 ? (
                  <EmptyBox texto="Ainda não existem pedidos de levantamento registados." />
                ) : (
                  <div
                    style={{
                      display: "grid",
                      gap: "14px",
                    }}
                  >
                    {levantamentosRecentes.map((item) => (
                      <article
                        key={item.id}
                        style={{
                          border: "1px solid rgba(166,120,61,0.18)",
                          background: "rgba(32,18,13,0.40)",
                          padding: "16px",
                        }}
                      >
                        <div
                          style={{
                            display: "grid",
                            gap: "8px",
                          }}
                        >
                          <p style={itemEyebrow}>
                            Pedido #{item.id} •{" "}
                            {formatarData(item.created_at)}
                          </p>

                          <h3 style={itemTitle}>
                            {formatarEuro(
                              item.valor_solicitado ??
                                item.valor_liquido ??
                                item.valor_bruto
                            )}
                          </h3>

                          <p style={itemText}>
                            Estado:{" "}
                            <strong>{traduzirEstadoLevantamento(item.estado)}</strong>
                          </p>

                          {item.comprovativo_url ? (
                            <p style={itemText}>
                              Documentação enviada com o pedido.
                            </p>
                          ) : (
                            <p style={itemText}>
                              Sem comprovativo associado.
                            </p>
                          )}

                          {item.observacoes_admin ? (
                            <p style={itemText}>
                              Observações da administração:{" "}
                              {item.observacoes_admin}
                            </p>
                          ) : null}
                        </div>
                      </article>
                    ))}

                    <div
                      style={{
                        display: "flex",
                        justifyContent: "flex-start",
                        marginTop: "6px",
                      }}
                    >
                      <Link
                        href="/formadores/levantamentos/historico"
                        style={botao}
                      >
                        Abrir histórico completo
                      </Link>
                    </div>
                  </div>
                )}
              </section>
            </section>
          </>
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
  if (!valor) return "Data indisponível";

  const data = new Date(valor);
  if (Number.isNaN(data.getTime())) return "Data indisponível";

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

function SectionTitle({
  titulo,
  subtitulo,
}: {
  titulo: string;
  subtitulo: string;
}) {
  return (
    <div style={{ marginBottom: "18px" }}>
      <p
        style={{
          margin: "0 0 8px 0",
          fontSize: "14px",
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: "#caa15a",
        }}
      >
        {subtitulo}
      </p>

      <h2
        style={{
          margin: 0,
          fontFamily: "Cinzel, serif",
          fontSize: "clamp(28px, 4vw, 40px)",
          color: "#f0d79a",
          fontWeight: 500,
        }}
      >
        {titulo}
      </h2>
    </div>
  );
}

function MoneyCard({
  titulo,
  valor,
  subtitulo,
}: {
  titulo: string;
  valor: string;
  subtitulo: string;
}) {
  return (
    <article
      style={{
        border: "1px solid #8a5d31",
        background:
          "linear-gradient(180deg, rgba(20,13,9,0.98) 0%, rgba(16,10,8,0.98) 100%)",
        padding: "22px",
        boxShadow:
          "0 12px 26px rgba(0,0,0,0.16), inset 0 1px 0 rgba(255,225,170,0.03)",
      }}
    >
      <p
        style={{
          margin: "0 0 10px 0",
          fontSize: "15px",
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: "#caa15a",
        }}
      >
        {titulo}
      </p>

      <p
        style={{
          margin: "0 0 8px 0",
          fontFamily: "Cinzel, serif",
          fontSize: "30px",
          color: "#f0d79a",
          lineHeight: 1.2,
          wordBreak: "break-word",
        }}
      >
        {valor}
      </p>

      <p
        style={{
          margin: 0,
          fontSize: "18px",
          color: "#d7b06c",
          lineHeight: 1.6,
        }}
      >
        {subtitulo}
      </p>
    </article>
  );
}

function EmptyBox({ texto }: { texto: string }) {
  return (
    <div
      style={{
        border: "1px solid rgba(166,120,61,0.18)",
        background: "rgba(32,18,13,0.35)",
        padding: "20px",
        color: "#d7b06c",
        fontSize: "18px",
        lineHeight: 1.7,
      }}
    >
      {texto}
    </div>
  );
}

function InlineError({ texto }: { texto: string }) {
  return (
    <div
      style={{
        color: "#ffb4b4",
        border: "1px solid rgba(255,107,107,0.35)",
        background: "rgba(120,20,20,0.12)",
        padding: "14px 16px",
        fontSize: "18px",
      }}
    >
      {texto}
    </div>
  );
}

function InlineSuccess({ texto }: { texto: string }) {
  return (
    <div
      style={{
        color: "#bff1bf",
        border: "1px solid rgba(74,222,128,0.35)",
        background: "rgba(20,90,40,0.12)",
        padding: "14px 16px",
        fontSize: "18px",
      }}
    >
      {texto}
    </div>
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
        A carregar levantamentos
      </h2>

      <p
        style={{
          margin: 0,
          fontSize: "clamp(18px, 2.2vw, 22px)",
          lineHeight: 1.7,
          color: "#dfbe81",
        }}
      >
        A plataforma está a reunir o resumo financeiro e os pedidos recentes do
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

const itemEyebrow: React.CSSProperties = {
  margin: 0,
  fontSize: "14px",
  color: "#caa15a",
  letterSpacing: "0.08em",
  textTransform: "uppercase",
};

const itemTitle: React.CSSProperties = {
  margin: 0,
  fontFamily: "Cinzel, serif",
  fontSize: "28px",
  color: "#f0d79a",
  lineHeight: 1.2,
  fontWeight: 500,
};

const itemText: React.CSSProperties = {
  margin: 0,
  fontSize: "18px",
  color: "#d7b06c",
  lineHeight: 1.7,
};

const label: React.CSSProperties = {
  display: "block",
  fontSize: "18px",
  marginBottom: "8px",
  color: "#e6c27a",
};

const input: React.CSSProperties = {
  width: "100%",
  padding: "14px 14px",
  background: "#1a100c",
  border: "1px solid #8a5d31",
  color: "#e6c27a",
  fontSize: "17px",
  outline: "none",
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03)",
};

const textarea: React.CSSProperties = {
  width: "100%",
  padding: "14px 14px",
  background: "#1a100c",
  border: "1px solid #8a5d31",
  color: "#e6c27a",
  fontSize: "17px",
  outline: "none",
  resize: "vertical",
  minHeight: "120px",
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03)",
  fontFamily: "Cormorant Garamond, serif",
};

const helperText: React.CSSProperties = {
  margin: "10px 0 0 0",
  fontSize: "16px",
  color: "#caa15a",
  lineHeight: 1.6,
};

const uploadButton: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  border: "1px solid #a6783d",
  background: "linear-gradient(180deg, #24140f 0%, #1a100c 100%)",
  color: "#e6c27a",
  padding: "12px 18px",
  fontSize: "16px",
  cursor: "pointer",
  boxShadow: "0 0 14px rgba(166, 120, 61, 0.1)",
  width: "min(100%, 240px)",
  textAlign: "center",
};

const submitButton: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  border: "1px solid #c4914d",
  padding: "16px 22px",
  background: "linear-gradient(180deg, #c4914d 0%, #a6783d 100%)",
  color: "#140d09",
  fontSize: "17px",
  fontWeight: 700,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  boxShadow:
    "0 0 24px rgba(230, 194, 122, 0.18), inset 0 1px 0 rgba(255,255,255,0.18)",
};

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