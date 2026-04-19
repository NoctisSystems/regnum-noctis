"use client";

import { CSSProperties, useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type AdminVendasMetricas = {
  total_vendas: number | null;
  total_vendido_bruto: number | null;
  total_recebido_liquido: number | null;
  total_taxas_stripe: number | null;
  comissao_plataforma_liquida: number | null;
  total_formadores: number | null;
  total_afiliados_bruto: number | null;
  total_taxa_plataforma_afiliados: number | null;
  total_afiliados_liquido: number | null;
};

type Pagamento = {
  id: number;
  aluno_id: number;
  curso_id: number | null;
  valor: number | null;
  status: string | null;
  metodo: string | null;
  stripe_paymente_id: string | null;
  created_at: string | null;
  formador_id: number | null;
  moeda: string | null;
  comissao_plataforma: number | null;
  valor_formador: number | null;
  updated_at: string;
  valor_bruto: number | null;
  valor_taxas_stripe?: number | null;
  valor_recebido_liquido?: number | null;
  valor_comissao_plataforma_liquida?: number | null;
  valor_liquido_formador_final?: number | null;
  valor_comissao_afiliado_bruta?: number | null;
  valor_taxa_plataforma_afiliado?: number | null;
  valor_comissao_afiliado_liquida?: number | null;
};

type Aluno = {
  id: number;
  nome: string | null;
  email: string | null;
};

type Curso = {
  id: number;
  titulo: string | null;
};

type Formador = {
  id: number;
  nome: string | null;
  email: string | null;
};

type LinhaVenda = {
  id: number;
  alunoNome: string;
  alunoEmail: string;
  cursoTitulo: string;
  formadorNome: string;
  valorBruto: number;
  valorRecebidoLiquido: number;
  taxasStripe: number;
  comissaoPlataforma: number;
  valorFormador: number;
  afiliadoBruto: number;
  taxaPlataformaAfiliado: number;
  afiliadoLiquido: number;
  valor: number;
  status: string;
  metodo: string;
  moeda: string;
  stripePaymentId: string | null;
  createdAt: string | null;
  updatedAt: string;
};

const metricasVazias: AdminVendasMetricas = {
  total_vendas: 0,
  total_vendido_bruto: 0,
  total_recebido_liquido: 0,
  total_taxas_stripe: 0,
  comissao_plataforma_liquida: 0,
  total_formadores: 0,
  total_afiliados_bruto: 0,
  total_taxa_plataforma_afiliados: 0,
  total_afiliados_liquido: 0,
};

export default function AdminVendasPage() {
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [pesquisa, setPesquisa] = useState("");

  const [metricas, setMetricas] = useState<AdminVendasMetricas>(metricasVazias);
  const [pagamentos, setPagamentos] = useState<Pagamento[]>([]);
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [formadores, setFormadores] = useState<Formador[]>([]);

  const carregarDados = useCallback(async () => {
    setLoading(true);
    setErro("");

    try {
      const [metricasRes, pagamentosRes, alunosRes, cursosRes, formadoresRes] =
        await Promise.all([
          supabase
            .from("admin_vendas_metricas")
            .select("*")
            .limit(1)
            .maybeSingle(),

          supabase
            .from("pagamentos")
            .select(
              "id, aluno_id, curso_id, valor, status, metodo, stripe_paymente_id, created_at, formador_id, moeda, comissao_plataforma, valor_formador, updated_at, valor_bruto, valor_taxas_stripe, valor_recebido_liquido, valor_comissao_plataforma_liquida, valor_liquido_formador_final, valor_comissao_afiliado_bruta, valor_taxa_plataforma_afiliado, valor_comissao_afiliado_liquida"
            )
            .order("created_at", { ascending: false }),

          supabase
            .from("alunos")
            .select("id, nome, email")
            .order("nome", { ascending: true }),

          supabase
            .from("cursos")
            .select("id, titulo")
            .order("titulo", { ascending: true }),

          supabase
            .from("formadores")
            .select("id, nome, email")
            .order("nome", { ascending: true }),
        ]);

      if (metricasRes.error) throw metricasRes.error;
      if (pagamentosRes.error) throw pagamentosRes.error;
      if (alunosRes.error) throw alunosRes.error;
      if (cursosRes.error) throw cursosRes.error;
      if (formadoresRes.error) throw formadoresRes.error;

      setMetricas((metricasRes.data as AdminVendasMetricas | null) || metricasVazias);
      setPagamentos((pagamentosRes.data || []) as Pagamento[]);
      setAlunos((alunosRes.data || []) as Aluno[]);
      setCursos((cursosRes.data || []) as Curso[]);
      setFormadores((formadoresRes.data || []) as Formador[]);
    } catch (err: any) {
      setErro(err?.message || "Não foi possível carregar as vendas.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  const mapaAlunos = useMemo(() => {
    return new Map<number, Aluno>(alunos.map((item) => [item.id, item]));
  }, [alunos]);

  const mapaCursos = useMemo(() => {
    return new Map<number, Curso>(cursos.map((item) => [item.id, item]));
  }, [cursos]);

  const mapaFormadores = useMemo(() => {
    return new Map<number, Formador>(formadores.map((item) => [item.id, item]));
  }, [formadores]);

  const linhas = useMemo<LinhaVenda[]>(() => {
    return pagamentos.map((pagamento) => {
      const aluno = mapaAlunos.get(pagamento.aluno_id);
      const curso = pagamento.curso_id
        ? mapaCursos.get(pagamento.curso_id)
        : undefined;
      const formador = pagamento.formador_id
        ? mapaFormadores.get(pagamento.formador_id)
        : undefined;

      return {
        id: pagamento.id,
        alunoNome: aluno?.nome || `Aluno #${pagamento.aluno_id}`,
        alunoEmail: aluno?.email || "Sem email",
        cursoTitulo: curso?.titulo || "Sem curso associado",
        formadorNome: formador?.nome || "Sem formador associado",
        valorBruto: Number(pagamento.valor_bruto ?? pagamento.valor ?? 0),
        valorRecebidoLiquido: Number(pagamento.valor_recebido_liquido ?? 0),
        taxasStripe: Number(pagamento.valor_taxas_stripe ?? 0),
        comissaoPlataforma: Number(
          pagamento.valor_comissao_plataforma_liquida ??
            pagamento.comissao_plataforma ??
            0
        ),
        valorFormador: Number(
          pagamento.valor_liquido_formador_final ?? pagamento.valor_formador ?? 0
        ),
        afiliadoBruto: Number(pagamento.valor_comissao_afiliado_bruta ?? 0),
        taxaPlataformaAfiliado: Number(
          pagamento.valor_taxa_plataforma_afiliado ?? 0
        ),
        afiliadoLiquido: Number(pagamento.valor_comissao_afiliado_liquida ?? 0),
        valor: Number(pagamento.valor ?? 0),
        status: pagamento.status || "sem estado",
        metodo: pagamento.metodo || "—",
        moeda: pagamento.moeda || "EUR",
        stripePaymentId: pagamento.stripe_paymente_id,
        createdAt: pagamento.created_at,
        updatedAt: pagamento.updated_at,
      };
    });
  }, [pagamentos, mapaAlunos, mapaCursos, mapaFormadores]);

  const linhasFiltradas = useMemo(() => {
    const termo = pesquisa.trim().toLowerCase();

    if (!termo) return linhas;

    return linhas.filter((linha) => {
      return (
        linha.alunoNome.toLowerCase().includes(termo) ||
        linha.alunoEmail.toLowerCase().includes(termo) ||
        linha.cursoTitulo.toLowerCase().includes(termo) ||
        linha.formadorNome.toLowerCase().includes(termo) ||
        linha.status.toLowerCase().includes(termo) ||
        linha.metodo.toLowerCase().includes(termo) ||
        String(linha.id).includes(termo) ||
        (linha.stripePaymentId || "").toLowerCase().includes(termo)
      );
    });
  }, [linhas, pesquisa]);

  return (
    <main style={main}>
      <section style={topo}>
        <p style={eyebrow}>Administração</p>
        <h1 style={titulo}>Vendas</h1>
        <p style={descricao}>
          Consulta das vendas registadas, estado dos pagamentos e distribuição
          financeira real da plataforma.
        </p>
      </section>

      <section style={statsGrid}>
        <StatCard
          label="Total de vendas"
          value={loading ? "..." : String(metricas.total_vendas || 0)}
        />
        <StatCard
          label="Total vendido"
          value={
            loading ? "..." : formatarEuro(Number(metricas.total_vendido_bruto || 0))
          }
        />
        <StatCard
          label="Taxas Stripe"
          value={
            loading ? "..." : formatarEuro(Number(metricas.total_taxas_stripe || 0))
          }
        />
        <StatCard
          label="Total recebido líquido"
          value={
            loading
              ? "..."
              : formatarEuro(Number(metricas.total_recebido_liquido || 0))
          }
        />
        <StatCard
          label="Comissão líquida da plataforma"
          value={
            loading
              ? "..."
              : formatarEuro(Number(metricas.comissao_plataforma_liquida || 0))
          }
        />
        <StatCard
          label="Total formadores"
          value={
            loading ? "..." : formatarEuro(Number(metricas.total_formadores || 0))
          }
        />
        <StatCard
          label="Afiliados bruto"
          value={
            loading
              ? "..."
              : formatarEuro(Number(metricas.total_afiliados_bruto || 0))
          }
        />
        <StatCard
          label="Taxa plataforma afiliados"
          value={
            loading
              ? "..."
              : formatarEuro(
                  Number(metricas.total_taxa_plataforma_afiliados || 0)
                )
          }
        />
        <StatCard
          label="Afiliados líquido"
          value={
            loading
              ? "..."
              : formatarEuro(Number(metricas.total_afiliados_liquido || 0))
          }
        />
      </section>

      {erro ? <MensagemErro texto={erro} /> : null}

      <section style={barra}>
        <input
          type="text"
          placeholder="Pesquisar venda..."
          value={pesquisa}
          onChange={(e) => setPesquisa(e.target.value)}
          style={inputPesquisa}
        />

        <button type="button" style={botaoSecundario} onClick={carregarDados}>
          Atualizar
        </button>
      </section>

      {loading ? (
        <EstadoBox texto="A carregar vendas..." />
      ) : linhasFiltradas.length === 0 ? (
        <EstadoBox texto="Ainda não existem vendas registadas." />
      ) : (
        <section style={lista}>
          {linhasFiltradas.map((linha) => (
            <article key={linha.id} style={card}>
              <div style={cardHeader}>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <p style={miniLabel}>Venda #{linha.id}</p>
                  <h2 style={cardTitulo}>{linha.cursoTitulo}</h2>
                  <p style={subtextoBloco}>
                    {linha.alunoNome} • {linha.formadorNome}
                  </p>
                </div>

                <span style={badgeEstado(linha.status)}>{linha.status}</span>
              </div>

              <div style={grid4}>
                <InfoBox
                  titulo="Aluno"
                  valor={`${linha.alunoNome}\n${linha.alunoEmail}`}
                />
                <InfoBox titulo="Curso" valor={linha.cursoTitulo} />
                <InfoBox titulo="Formador" valor={linha.formadorNome} />
                <InfoBox titulo="Método" valor={`${linha.metodo} • ${linha.moeda}`} />
              </div>

              <div style={grid4}>
                <InfoBox titulo="Bruto" valor={formatarEuro(linha.valorBruto)} />
                <InfoBox
                  titulo="Taxas Stripe"
                  valor={formatarEuro(linha.taxasStripe)}
                />
                <InfoBox
                  titulo="Recebido líquido"
                  valor={formatarEuro(linha.valorRecebidoLiquido)}
                />
                <InfoBox
                  titulo="Comissão plataforma"
                  valor={formatarEuro(linha.comissaoPlataforma)}
                />
              </div>

              <div style={grid4}>
                <InfoBox
                  titulo="Valor formador"
                  valor={formatarEuro(linha.valorFormador)}
                />
                <InfoBox
                  titulo="Afiliado bruto"
                  valor={formatarEuro(linha.afiliadoBruto)}
                />
                <InfoBox
                  titulo="Taxa plataforma afiliado"
                  valor={formatarEuro(linha.taxaPlataformaAfiliado)}
                />
                <InfoBox
                  titulo="Afiliado líquido"
                  valor={formatarEuro(linha.afiliadoLiquido)}
                />
              </div>

              <div style={grid2}>
                <InfoBox
                  titulo="Stripe Payment ID"
                  valor={linha.stripePaymentId || "—"}
                />
                <InfoBox
                  titulo="Datas"
                  valor={`Criado: ${formatarDataHora(
                    linha.createdAt
                  )}\nAtualizado: ${formatarDataHora(linha.updatedAt)}`}
                />
              </div>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <article style={statCard}>
      <p style={statLabel}>{label}</p>
      <p style={statValue}>{value}</p>
    </article>
  );
}

function InfoBox({ titulo, valor }: { titulo: string; valor: string }) {
  return (
    <div style={infoCard}>
      <p style={infoLabel}>{titulo}</p>
      <p style={infoValor}>{valor}</p>
    </div>
  );
}

function EstadoBox({ texto }: { texto: string }) {
  return <div style={estadoBox}>{texto}</div>;
}

function MensagemErro({ texto }: { texto: string }) {
  return <div style={caixaErro}>{texto}</div>;
}

function formatarEuro(valor: number) {
  return new Intl.NumberFormat("pt-PT", {
    style: "currency",
    currency: "EUR",
  }).format(valor || 0);
}

function formatarDataHora(valor: string | null) {
  if (!valor) return "—";

  const data = new Date(valor);

  if (Number.isNaN(data.getTime())) return "—";

  return data.toLocaleString("pt-PT");
}

function badgeEstado(estado: string): CSSProperties {
  const normalizado = estado.trim().toLowerCase();

  if (
    ["paid", "pago", "concluido", "succeeded", "sucesso"].includes(normalizado)
  ) {
    return {
      display: "inline-block",
      padding: "8px 12px",
      border: "1px solid rgba(74,222,128,0.4)",
      background: "rgba(20,90,40,0.15)",
      color: "#bff1bf",
      fontSize: "15px",
    };
  }

  if (
    ["pending", "pendente", "processing", "em_processamento"].includes(normalizado)
  ) {
    return {
      display: "inline-block",
      padding: "8px 12px",
      border: "1px solid rgba(230,194,122,0.4)",
      background: "rgba(120,90,20,0.15)",
      color: "#f0d79a",
      fontSize: "15px",
    };
  }

  if (
    ["failed", "falhou", "cancelado", "canceled", "reembolsado", "refunded"].includes(
      normalizado
    )
  ) {
    return {
      display: "inline-block",
      padding: "8px 12px",
      border: "1px solid rgba(255,107,107,0.4)",
      background: "rgba(120,20,20,0.15)",
      color: "#ffb4b4",
      fontSize: "15px",
    };
  }

  return {
    display: "inline-block",
    padding: "8px 12px",
    border: "1px solid rgba(166,120,61,0.45)",
    background: "rgba(38,20,15,0.35)",
    color: "#e6c27a",
    fontSize: "15px",
  };
}

const main: CSSProperties = {
  color: "#e6c27a",
  fontFamily: "Cormorant Garamond, serif",
};

const topo: CSSProperties = {
  marginBottom: "24px",
  maxWidth: "980px",
};

const eyebrow: CSSProperties = {
  margin: "0 0 10px 0",
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  fontSize: "14px",
  color: "#caa15a",
};

const titulo: CSSProperties = {
  margin: "0 0 12px 0",
  fontFamily: "Cinzel, serif",
  fontSize: "clamp(32px, 5vw, 48px)",
  color: "#f0d79a",
  lineHeight: 1.08,
  fontWeight: 500,
};

const descricao: CSSProperties = {
  margin: 0,
  color: "#d7b06c",
  fontSize: "clamp(18px, 2.3vw, 22px)",
  lineHeight: 1.7,
};

const statsGrid: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "16px",
  marginBottom: "24px",
};

const statCard: CSSProperties = {
  border: "1px solid #a6783d",
  padding: "20px",
  background: "linear-gradient(145deg, #1a0f0a, #140d09)",
  boxShadow: "0 0 20px rgba(166, 120, 61, 0.12)",
};

const statLabel: CSSProperties = {
  margin: "0 0 10px 0",
  fontSize: "18px",
  color: "#e6c27a",
};

const statValue: CSSProperties = {
  margin: 0,
  fontSize: "30px",
  lineHeight: 1.15,
  fontFamily: "Cinzel, serif",
  color: "#f0d79a",
};

const barra: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "12px",
  flexWrap: "wrap",
  marginBottom: "24px",
};

const inputPesquisa: CSSProperties = {
  minWidth: "260px",
  flex: 1,
  width: "100%",
  maxWidth: "520px",
  padding: "12px 14px",
  border: "1px solid #a6783d",
  background: "#140d09",
  color: "#e6c27a",
  fontSize: "17px",
  outline: "none",
};

const botaoSecundario: CSSProperties = {
  padding: "12px 18px",
  border: "1px solid #a6783d",
  background: "transparent",
  color: "#e6c27a",
  fontSize: "16px",
  cursor: "pointer",
  minHeight: "46px",
};

const lista: CSSProperties = {
  display: "grid",
  gap: "16px",
};

const card: CSSProperties = {
  border: "1px solid #a6783d",
  background: "linear-gradient(145deg, #1a0f0a, #140d09)",
  boxShadow: "0 0 20px rgba(166, 120, 61, 0.12)",
  padding: "clamp(16px, 2vw, 20px)",
};

const cardHeader: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "14px",
  flexWrap: "wrap",
  marginBottom: "16px",
};

const miniLabel: CSSProperties = {
  margin: "0 0 8px 0",
  fontSize: "13px",
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  color: "#caa15a",
};

const cardTitulo: CSSProperties = {
  margin: "0 0 8px 0",
  fontFamily: "Cinzel, serif",
  fontSize: "clamp(22px, 3vw, 28px)",
  color: "#f0d79a",
  lineHeight: 1.15,
};

const subtextoBloco: CSSProperties = {
  margin: 0,
  fontSize: "17px",
  lineHeight: 1.6,
  color: "#d7b06c",
};

const grid4: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
  gap: "12px",
  marginBottom: "12px",
};

const grid2: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
  gap: "12px",
  marginBottom: "12px",
};

const infoCard: CSSProperties = {
  border: "1px solid rgba(166,120,61,0.28)",
  background: "rgba(38,20,15,0.35)",
  padding: "14px 16px",
};

const infoLabel: CSSProperties = {
  margin: "0 0 8px 0",
  color: "#caa15a",
  fontSize: "14px",
  textTransform: "uppercase",
  letterSpacing: "1px",
};

const infoValor: CSSProperties = {
  margin: 0,
  color: "#e6c27a",
  fontSize: "17px",
  lineHeight: 1.7,
  whiteSpace: "pre-wrap",
  wordBreak: "break-word",
};

const estadoBox: CSSProperties = {
  border: "1px solid #a6783d",
  background: "#140d09",
  padding: "24px 18px",
  textAlign: "center",
  color: "#caa15a",
  fontSize: "20px",
  marginBottom: "20px",
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