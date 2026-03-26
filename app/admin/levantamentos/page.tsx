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
    <>
      <h1
        style={{
          fontFamily: "Cinzel, serif",
          fontSize: "48px",
          marginBottom: "24px",
          color: "#e6c27a",
        }}
      >
        Levantamentos
      </h1>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "24px",
          marginBottom: "32px",
        }}
      >
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
          <p style={cardValue}>{loading ? "..." : formatarEuro(totalValorPedido)}</p>
        </div>
      </div>

      {erro ? <div style={caixaErro}>{erro}</div> : null}
      {sucesso ? <div style={caixaSucesso}>{sucesso}</div> : null}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "16px",
          flexWrap: "wrap",
          marginBottom: "24px",
        }}
      >
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
      </div>

      <div style={box}>
        <div style={headerTabela}>
          <span style={colunaNome}>Formador</span>
          <span style={coluna}>Valores</span>
          <span style={coluna}>Estado</span>
          <span style={coluna}>Datas</span>
          <span style={coluna}>Documentos</span>
          <span style={coluna}>Gestão</span>
        </div>

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
      </div>
    </>
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
    <div style={linhaTabela}>
      <div>
        <div style={colunaNomeValor}>{linha.formadorNome}</div>
        <div style={subtexto}>{linha.formadorEmail}</div>
        <div style={subtexto}>Pedido #{linha.id}</div>
      </div>

      <div>
        <div style={colunaValor}>
          Pedido: <strong>{formatarEuro(linha.valorPedido)}</strong>
        </div>
        <div style={subtexto}>
          Aprovado:{" "}
          {linha.valorAprovado !== null
            ? formatarEuro(linha.valorAprovado)
            : "—"}
        </div>
      </div>

      <div>
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
        <div style={subtexto}>Pedido: {formatarData(linha.pedidoEm)}</div>
        <div style={subtexto}>
          Fatura: {formatarData(linha.faturaEnviadaEm)}
        </div>
        <div style={subtexto}>Validado: {formatarData(linha.validadoEm)}</div>
        <div style={subtexto}>Pago: {formatarData(linha.pagoEm)}</div>
      </div>

      <div style={{ display: "grid", gap: "8px" }}>
        {linha.faturaUrl ? (
          <a href={linha.faturaUrl} target="_blank" style={linkMini}>
            Ver fatura
          </a>
        ) : (
          <span style={subtexto}>Sem fatura</span>
        )}

        {linha.comprovativoUrl ? (
          <a href={linha.comprovativoUrl} target="_blank" style={linkMini}>
            Ver comprovativo
          </a>
        ) : (
          <span style={subtexto}>Sem comprovativo</span>
        )}
      </div>

      <div style={{ display: "grid", gap: "10px" }}>
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

        <textarea
          value={observacoes}
          onChange={(e) => setObservacoes(e.target.value)}
          placeholder="Observações da administração"
          rows={3}
          style={textareaTabela}
          disabled={saving}
        />

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
    </div>
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

const card: CSSProperties = {
  border: "1px solid #a6783d",
  padding: "24px",
  background: "linear-gradient(145deg, #1a0f0a, #140d09)",
  boxShadow: "0 0 20px rgba(166, 120, 61, 0.12)",
};

const cardTitle: CSSProperties = {
  fontSize: "22px",
  marginBottom: "14px",
  color: "#e6c27a",
};

const cardValue: CSSProperties = {
  fontSize: "34px",
  fontFamily: "Cinzel, serif",
  color: "#e6c27a",
  lineHeight: 1.15,
};

const inputPesquisa: CSSProperties = {
  minWidth: "280px",
  flex: 1,
  maxWidth: "420px",
  padding: "12px 14px",
  border: "1px solid #a6783d",
  background: "#140d09",
  color: "#e6c27a",
  fontSize: "18px",
  outline: "none",
};

const button: CSSProperties = {
  padding: "12px 18px",
  border: "1px solid #a6783d",
  background: "#a6783d",
  color: "#140d09",
  fontSize: "17px",
  cursor: "pointer",
};

const buttonSecundario: CSSProperties = {
  padding: "12px 18px",
  border: "1px solid #a6783d",
  background: "transparent",
  color: "#e6c27a",
  fontSize: "17px",
  cursor: "pointer",
};

const box: CSSProperties = {
  border: "1px solid #a6783d",
  background: "#140d09",
  overflow: "hidden",
};

const headerTabela: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1.35fr 1fr 0.95fr 1fr 1fr 1.2fr",
  gap: "16px",
  padding: "16px 18px",
  background: "#1b110c",
  color: "#e6c27a",
  fontSize: "18px",
  borderBottom: "1px solid #8a5d31",
};

const linhaTabela: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1.35fr 1fr 0.95fr 1fr 1fr 1.2fr",
  gap: "16px",
  padding: "18px",
  borderTop: "1px solid #8a5d31",
  color: "#e6c27a",
  alignItems: "start",
};

const linhaVazia: CSSProperties = {
  padding: "28px 18px",
  textAlign: "center",
  color: "#caa15a",
  fontSize: "21px",
  borderTop: "1px solid #8a5d31",
};

const colunaNome: CSSProperties = {
  fontWeight: 600,
};

const coluna: CSSProperties = {
  fontWeight: 600,
};

const colunaNomeValor: CSSProperties = {
  fontWeight: 600,
  color: "#f2d38f",
  fontSize: "18px",
  marginBottom: "6px",
};

const colunaValor: CSSProperties = {
  color: "#e6c27a",
  lineHeight: 1.5,
};

const subtexto: CSSProperties = {
  color: "#caa15a",
  lineHeight: 1.5,
  fontSize: "15px",
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

const linkMini: CSSProperties = {
  color: "#f0d79a",
  textDecoration: "none",
  border: "1px solid rgba(166, 120, 61, 0.55)",
  padding: "8px 10px",
  display: "inline-block",
  fontSize: "15px",
};

const caixaErro: CSSProperties = {
  border: "1px solid rgba(255,107,107,0.35)",
  background: "rgba(120,20,20,0.12)",
  padding: "16px 18px",
  color: "#ffb4b4",
  fontSize: "18px",
  lineHeight: 1.6,
  marginBottom: "20px",
};

const caixaSucesso: CSSProperties = {
  border: "1px solid rgba(74,222,128,0.35)",
  background: "rgba(20,90,40,0.12)",
  padding: "16px 18px",
  color: "#bff1bf",
  fontSize: "18px",
  lineHeight: 1.6,
  marginBottom: "20px",
};