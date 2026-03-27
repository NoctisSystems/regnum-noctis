"use client";

import { CSSProperties, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type Levantamento = {
  id: number;
  formador_id: number;
  valor_pedido: number;
  valor_aprovado: number | null;
  estado: string;
  fatura_url: string | null;
  comprovativo_url: string | null;
  observacoes_admin: string | null;
  pedido_em: string;
  fatura_enviada_em: string | null;
  validado_em: string | null;
  pago_em: string | null;
  created_at: string;
  updated_at: string;
};

type Formador = {
  id: number;
  nome: string | null;
  email: string | null;
};

type LinhaLevantamento = {
  id: number;
  formadorNome: string;
  formadorEmail: string;
  valorPedido: number;
  valorAprovado: number | null;
  estado: string;
  faturaUrl: string | null;
  comprovativoUrl: string | null;
  observacoesAdmin: string | null;
  pedidoEm: string;
  faturaEnviadaEm: string | null;
  validadoEm: string | null;
  pagoEm: string | null;
  createdAt: string;
  updatedAt: string;
};

export default function AdminLevantamentosPage() {
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [pesquisa, setPesquisa] = useState("");

  const [levantamentos, setLevantamentos] = useState<Levantamento[]>([]);
  const [formadores, setFormadores] = useState<Formador[]>([]);

  const [savingId, setSavingId] = useState<number | null>(null);

  useEffect(() => {
    carregarDados();
  }, []);

  async function carregarDados() {
    setLoading(true);
    setErro("");
    setSucesso("");

    try {
      const [levantamentosRes, formadoresRes] = await Promise.all([
        supabase
          .from("levantamentos_formador")
          .select(
            "id, formador_id, valor_pedido, valor_aprovado, estado, fatura_url, comprovativo_url, observacoes_admin, pedido_em, fatura_enviada_em, validado_em, pago_em, created_at, updated_at"
          )
          .order("created_at", { ascending: false }),

        supabase
          .from("formadores")
          .select("id, nome, email")
          .order("nome", { ascending: true }),
      ]);

      if (levantamentosRes.error) throw levantamentosRes.error;
      if (formadoresRes.error) throw formadoresRes.error;

      setLevantamentos((levantamentosRes.data || []) as Levantamento[]);
      setFormadores((formadoresRes.data || []) as Formador[]);
    } catch (err: any) {
      setErro(err?.message || "Não foi possível carregar os levantamentos.");
    } finally {
      setLoading(false);
    }
  }

  const mapaFormadores = useMemo(() => {
    return new Map<number, Formador>(
      formadores.map((formador) => [formador.id, formador])
    );
  }, [formadores]);

  const linhas = useMemo<LinhaLevantamento[]>(() => {
    return levantamentos.map((levantamento) => {
      const formador = mapaFormadores.get(levantamento.formador_id);

      return {
        id: levantamento.id,
        formadorNome: formador?.nome || `Formador #${levantamento.formador_id}`,
        formadorEmail: formador?.email || "Sem email",
        valorPedido: Number(levantamento.valor_pedido || 0),
        valorAprovado:
          levantamento.valor_aprovado === null
            ? null
            : Number(levantamento.valor_aprovado),
        estado: levantamento.estado || "aguarda_fatura",
        faturaUrl: levantamento.fatura_url,
        comprovativoUrl: levantamento.comprovativo_url,
        observacoesAdmin: levantamento.observacoes_admin,
        pedidoEm: levantamento.pedido_em,
        faturaEnviadaEm: levantamento.fatura_enviada_em,
        validadoEm: levantamento.validado_em,
        pagoEm: levantamento.pago_em,
        createdAt: levantamento.created_at,
        updatedAt: levantamento.updated_at,
      };
    });
  }, [levantamentos, mapaFormadores]);

  const linhasFiltradas = useMemo(() => {
    const termo = pesquisa.trim().toLowerCase();

    if (!termo) return linhas;

    return linhas.filter((linha) => {
      return (
        linha.formadorNome.toLowerCase().includes(termo) ||
        linha.formadorEmail.toLowerCase().includes(termo) ||
        linha.estado.toLowerCase().includes(termo) ||
        String(linha.id).includes(termo)
      );
    });
  }, [linhas, pesquisa]);

  const totalLevantamentos = linhas.length;
  const totalPendentes = linhas.filter((linha) =>
    ["aguarda_fatura", "fatura_enviada", "validado_admin"].includes(
      linha.estado
    )
  ).length;
  const totalPagos = linhas.filter((linha) => linha.estado === "pago").length;

  const totalValorPedido = linhas.reduce(
    (acc, linha) => acc + Number(linha.valorPedido || 0),
    0
  );

  async function atualizarLevantamento(
    levantamentoId: number,
    dados: {
      estado: string;
      valor_aprovado: number | null;
      observacoes_admin: string | null;
    }
  ) {
    setErro("");
    setSucesso("");

    try {
      setSavingId(levantamentoId);

      const updatePayload: Record<string, any> = {
        estado: dados.estado,
        valor_aprovado: dados.valor_aprovado,
        observacoes_admin: dados.observacoes_admin,
        updated_at: new Date().toISOString(),
      };

      if (dados.estado === "fatura_enviada") {
        updatePayload.fatura_enviada_em = new Date().toISOString();
      }

      if (dados.estado === "validado_admin") {
        updatePayload.validado_em = new Date().toISOString();
      }

      if (dados.estado === "pago") {
        updatePayload.pago_em = new Date().toISOString();
      }

      const { error } = await supabase
        .from("levantamentos_formador")
        .update(updatePayload)
        .eq("id", levantamentoId);

      if (error) throw error;

      setLevantamentos((prev) =>
        prev.map((item) =>
          item.id === levantamentoId
            ? {
                ...item,
                estado: dados.estado,
                valor_aprovado: dados.valor_aprovado,
                observacoes_admin: dados.observacoes_admin,
                updated_at: updatePayload.updated_at,
                fatura_enviada_em:
                  updatePayload.fatura_enviada_em ?? item.fatura_enviada_em,
                validado_em: updatePayload.validado_em ?? item.validado_em,
                pago_em: updatePayload.pago_em ?? item.pago_em,
              }
            : item
        )
      );

      setSucesso("Levantamento atualizado com sucesso.");
    } catch (err: any) {
      setErro(err?.message || "Não foi possível atualizar o levantamento.");
    } finally {
      setSavingId(null);
    }
  }

  return (
    <main style={pagina}>
      <section style={hero}>
        <p style={kicker}>Administração</p>
        <h1 style={titulo}>Levantamentos</h1>
        <p style={descricao}>
          Gestão dos pedidos de levantamento dos formadores.
        </p>
      </section>

      <section style={gridMetricas}>
        <div style={card}>
          <h3 style={cardTitle}>Total de pedidos</h3>
          <p style={cardValue}>{loading ? "..." : totalLevantamentos}</p>
        </div>

        <div style={card}>
          <h3 style={cardTitle}>Pendentes</h3>
          <p style={cardValue}>{loading ? "..." : totalPendentes}</p>
        </div>

        <div style={card}>
          <h3 style={cardTitle}>Pagos</h3>
          <p style={cardValue}>{loading ? "..." : totalPagos}</p>
        </div>

        <div style={card}>
          <h3 style={cardTitle}>Valor pedido</h3>
          <p style={cardValue}>
            {loading ? "..." : formatarEuro(totalValorPedido)}
          </p>
        </div>
      </section>

      {erro ? <div style={caixaErro}>{erro}</div> : null}
      {sucesso ? <div style={caixaSucesso}>{sucesso}</div> : null}

      <section style={barraTopo}>
        <input
          type="text"
          placeholder="Pesquisar levantamento..."
          value={pesquisa}
          onChange={(e) => setPesquisa(e.target.value)}
          style={inputPesquisa}
        />

        <button type="button" style={buttonSecundario} onClick={carregarDados}>
          Atualizar
        </button>
      </section>

      <section style={listaCards}>
        {loading ? (
          <div style={linhaVazia}>A carregar levantamentos...</div>
        ) : linhasFiltradas.length === 0 ? (
          <div style={linhaVazia}>Ainda não existem levantamentos registados.</div>
        ) : (
          linhasFiltradas.map((linha) => (
            <LinhaLevantamentoItem
              key={linha.id}
              linha={linha}
              saving={savingId === linha.id}
              onGuardar={atualizarLevantamento}
            />
          ))
        )}
      </section>
    </main>
  );
}

function LinhaLevantamentoItem({
  linha,
  saving,
  onGuardar,
}: {
  linha: LinhaLevantamento;
  saving: boolean;
  onGuardar: (
    levantamentoId: number,
    dados: {
      estado: string;
      valor_aprovado: number | null;
      observacoes_admin: string | null;
    }
  ) => Promise<void>;
}) {
  const [estado, setEstado] = useState(linha.estado || "aguarda_fatura");
  const [valorAprovado, setValorAprovado] = useState(
    linha.valorAprovado !== null ? String(linha.valorAprovado) : ""
  );
  const [observacoes, setObservacoes] = useState(linha.observacoesAdmin || "");

  useEffect(() => {
    setEstado(linha.estado || "aguarda_fatura");
    setValorAprovado(
      linha.valorAprovado !== null ? String(linha.valorAprovado) : ""
    );
    setObservacoes(linha.observacoesAdmin || "");
  }, [linha]);

  return (
    <article style={cardLinha}>
      <div style={cardLinhaHeader}>
        <div>
          <h3 style={nomeLinha}>{linha.formadorNome}</h3>
          <p style={subLinha}>{linha.formadorEmail}</p>
          <p style={subLinha}>Pedido #{linha.id}</p>
        </div>

        <div style={badgeEstadoWrap}>
          <span style={badgeEstado}>{linha.estado}</span>
        </div>
      </div>

      <div style={gridInfo}>
        <div style={infoBloco}>
          <p style={infoLabel}>Valores</p>
          <p style={infoValor}>
            Pedido: <strong>{formatarEuro(linha.valorPedido)}</strong>
          </p>
          <p style={infoValor}>
            Aprovado:{" "}
            {linha.valorAprovado !== null
              ? formatarEuro(linha.valorAprovado)
              : "—"}
          </p>
        </div>

        <div style={infoBloco}>
          <p style={infoLabel}>Datas</p>
          <p style={infoValor}>Pedido: {formatarData(linha.pedidoEm)}</p>
          <p style={infoValor}>
            Fatura: {formatarData(linha.faturaEnviadaEm)}
          </p>
          <p style={infoValor}>Validado: {formatarData(linha.validadoEm)}</p>
          <p style={infoValor}>Pago: {formatarData(linha.pagoEm)}</p>
        </div>

        <div style={infoBloco}>
          <p style={infoLabel}>Documentos</p>

          <div style={{ display: "grid", gap: "8px" }}>
            {linha.faturaUrl ? (
              <a href={linha.faturaUrl} target="_blank" style={linkMini}>
                Ver fatura
              </a>
            ) : (
              <span style={subLinha}>Sem fatura</span>
            )}

            {linha.comprovativoUrl ? (
              <a href={linha.comprovativoUrl} target="_blank" style={linkMini}>
                Ver comprovativo
              </a>
            ) : (
              <span style={subLinha}>Sem comprovativo</span>
            )}
          </div>
        </div>
      </div>

      <div style={gridGestao}>
        <div>
          <label style={label}>Estado</label>
          <select
            value={estado}
            onChange={(e) => setEstado(e.target.value)}
            style={inputTabela}
            disabled={saving}
          >
            <option value="aguarda_fatura">Aguarda fatura</option>
            <option value="fatura_enviada">Fatura enviada</option>
            <option value="validado_admin">Validado admin</option>
            <option value="pago">Pago</option>
            <option value="rejeitado">Rejeitado</option>
          </select>
        </div>

        <div>
          <label style={label}>Valor aprovado</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={valorAprovado}
            onChange={(e) => setValorAprovado(e.target.value)}
            placeholder="Valor aprovado"
            style={inputTabela}
            disabled={saving}
          />
        </div>

        <div style={{ gridColumn: "1 / -1" }}>
          <label style={label}>Observações da administração</label>
          <textarea
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
            placeholder="Observações da administração"
            rows={3}
            style={textareaTabela}
            disabled={saving}
          />
        </div>
      </div>

      <div style={rodapeAcoes}>
        <button
          type="button"
          style={{
            ...button,
            opacity: saving ? 0.7 : 1,
            cursor: saving ? "not-allowed" : "pointer",
          }}
          disabled={saving}
          onClick={() =>
            onGuardar(linha.id, {
              estado,
              valor_aprovado:
                valorAprovado.trim() === "" ? null : Number(valorAprovado),
              observacoes_admin: observacoes.trim() || null,
            })
          }
        >
          {saving ? "A guardar..." : "Guardar"}
        </button>
      </div>
    </article>
  );
}

function formatarEuro(valor: number) {
  return new Intl.NumberFormat("pt-PT", {
    style: "currency",
    currency: "EUR",
  }).format(valor || 0);
}

function formatarData(valor: string | null) {
  if (!valor) return "—";

  const data = new Date(valor);

  if (Number.isNaN(data.getTime())) return "—";

  return data.toLocaleDateString("pt-PT");
}

const pagina: CSSProperties = {
  display: "grid",
  gap: "24px",
};

const hero: CSSProperties = {
  display: "grid",
  gap: "10px",
};

const kicker: CSSProperties = {
  margin: 0,
  fontSize: "14px",
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  color: "#caa15a",
};

const titulo: CSSProperties = {
  fontFamily: "Cinzel, serif",
  fontSize: "clamp(34px, 5vw, 48px)",
  margin: 0,
  color: "#e6c27a",
};

const descricao: CSSProperties = {
  margin: 0,
  color: "#d7b06c",
  fontSize: "clamp(18px, 2.2vw, 21px)",
  lineHeight: 1.7,
};

const gridMetricas: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "18px",
};

const card: CSSProperties = {
  border: "1px solid #a6783d",
  padding: "20px",
  background: "linear-gradient(145deg, #1a0f0a, #140d09)",
  boxShadow: "0 0 20px rgba(166, 120, 61, 0.12)",
};

const cardTitle: CSSProperties = {
  fontSize: "20px",
  marginBottom: "12px",
  color: "#e6c27a",
};

const cardValue: CSSProperties = {
  fontSize: "clamp(28px, 4.8vw, 34px)",
  fontFamily: "Cinzel, serif",
  color: "#e6c27a",
  lineHeight: 1.15,
  margin: 0,
};

const barraTopo: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "stretch",
  gap: "12px",
  flexWrap: "wrap",
};

const inputPesquisa: CSSProperties = {
  minWidth: "260px",
  flex: 1,
  width: "100%",
  maxWidth: "100%",
  padding: "12px 14px",
  border: "1px solid #a6783d",
  background: "#140d09",
  color: "#e6c27a",
  fontSize: "17px",
  outline: "none",
};

const button: CSSProperties = {
  padding: "12px 18px",
  border: "1px solid #a6783d",
  background: "#a6783d",
  color: "#140d09",
  fontSize: "17px",
  cursor: "pointer",
  minHeight: "46px",
};

const buttonSecundario: CSSProperties = {
  padding: "12px 18px",
  border: "1px solid #a6783d",
  background: "transparent",
  color: "#e6c27a",
  fontSize: "17px",
  cursor: "pointer",
  minHeight: "46px",
};

const listaCards: CSSProperties = {
  display: "grid",
  gap: "14px",
};

const cardLinha: CSSProperties = {
  border: "1px solid #a6783d",
  background: "#140d09",
  padding: "18px",
};

const cardLinhaHeader: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "12px",
  flexWrap: "wrap",
  marginBottom: "14px",
};

const nomeLinha: CSSProperties = {
  margin: "0 0 6px 0",
  color: "#f2d38f",
  fontSize: "22px",
  lineHeight: 1.3,
};

const subLinha: CSSProperties = {
  margin: "0 0 4px 0",
  color: "#caa15a",
  lineHeight: 1.5,
  fontSize: "15px",
};

const badgeEstadoWrap: CSSProperties = {
  display: "flex",
  alignItems: "center",
};

const badgeEstado: CSSProperties = {
  display: "inline-block",
  padding: "8px 12px",
  border: "1px solid rgba(166,120,61,0.45)",
  background: "rgba(38,20,15,0.35)",
  color: "#e6c27a",
  fontSize: "14px",
  textTransform: "uppercase",
  letterSpacing: "1px",
};

const gridInfo: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "12px",
  marginBottom: "14px",
};

const infoBloco: CSSProperties = {
  border: "1px solid rgba(166,120,61,0.24)",
  background: "rgba(38,20,15,0.35)",
  padding: "14px",
};

const infoLabel: CSSProperties = {
  margin: "0 0 8px 0",
  color: "#caa15a",
  fontSize: "13px",
  textTransform: "uppercase",
  letterSpacing: "1px",
};

const infoValor: CSSProperties = {
  margin: "0 0 6px 0",
  color: "#e6c27a",
  fontSize: "17px",
  lineHeight: 1.6,
};

const gridGestao: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "12px",
  marginBottom: "14px",
};

const label: CSSProperties = {
  display: "block",
  marginBottom: "8px",
  color: "#caa15a",
  fontSize: "14px",
  textTransform: "uppercase",
  letterSpacing: "1px",
};

const inputTabela: CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  border: "1px solid #8a5d31",
  background: "#140d09",
  color: "#e6c27a",
  fontSize: "15px",
  outline: "none",
};

const textareaTabela: CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  border: "1px solid #8a5d31",
  background: "#140d09",
  color: "#e6c27a",
  fontSize: "15px",
  outline: "none",
  resize: "vertical",
  fontFamily: "Cormorant Garamond, serif",
};

const rodapeAcoes: CSSProperties = {
  display: "flex",
  justifyContent: "flex-end",
  flexWrap: "wrap",
};

const linkMini: CSSProperties = {
  color: "#f0d79a",
  textDecoration: "none",
  border: "1px solid rgba(166, 120, 61, 0.55)",
  padding: "8px 10px",
  display: "inline-block",
  fontSize: "15px",
};

const linhaVazia: CSSProperties = {
  border: "1px solid #a6783d",
  background: "#140d09",
  padding: "28px 18px",
  textAlign: "center",
  color: "#caa15a",
  fontSize: "21px",
};

const caixaErro: CSSProperties = {
  border: "1px solid rgba(255,107,107,0.35)",
  background: "rgba(120,20,20,0.12)",
  padding: "16px 18px",
  color: "#ffb4b4",
  fontSize: "18px",
  lineHeight: 1.6,
};

const caixaSucesso: CSSProperties = {
  border: "1px solid rgba(74,222,128,0.35)",
  background: "rgba(20,90,40,0.12)",
  padding: "16px 18px",
  color: "#bff1bf",
  fontSize: "18px",
  lineHeight: 1.6,
};