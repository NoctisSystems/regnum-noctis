"use client";

import { CSSProperties, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

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
  comissaoPlataforma: number;
  valorFormador: number;
  valor: number;
  status: string;
  metodo: string;
  moeda: string;
  stripePaymentId: string | null;
  createdAt: string | null;
  updatedAt: string;
};

export default function AdminVendasPage() {
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [pesquisa, setPesquisa] = useState("");

  const [pagamentos, setPagamentos] = useState<Pagamento[]>([]);
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [formadores, setFormadores] = useState<Formador[]>([]);

  useEffect(() => {
    carregarDados();
  }, []);

  async function carregarDados() {
    setLoading(true);
    setErro("");

    try {
      const [pagamentosRes, alunosRes, cursosRes, formadoresRes] =
        await Promise.all([
          supabase
            .from("pagamentos")
            .select(
              "id, aluno_id, curso_id, valor, status, metodo, stripe_paymente_id, created_at, formador_id, moeda, comissao_plataforma, valor_formador, updated_at, valor_bruto"
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

      if (pagamentosRes.error) throw pagamentosRes.error;
      if (alunosRes.error) throw alunosRes.error;
      if (cursosRes.error) throw cursosRes.error;
      if (formadoresRes.error) throw formadoresRes.error;

      setPagamentos((pagamentosRes.data || []) as Pagamento[]);
      setAlunos((alunosRes.data || []) as Aluno[]);
      setCursos((cursosRes.data || []) as Curso[]);
      setFormadores((formadoresRes.data || []) as Formador[]);
    } catch (err: any) {
      setErro(err?.message || "Não foi possível carregar as vendas.");
    } finally {
      setLoading(false);
    }
  }

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
        valorBruto: Number(
          pagamento.valor_bruto ?? pagamento.valor ?? 0
        ),
        comissaoPlataforma: Number(pagamento.comissao_plataforma ?? 0),
        valorFormador: Number(pagamento.valor_formador ?? 0),
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

  const totalVendas = linhas.length;
  const totalRecebido = linhas.reduce(
    (acc, linha) => acc + Number(linha.valorBruto || 0),
    0
  );
  const totalComissoes = linhas.reduce(
    (acc, linha) => acc + Number(linha.comissaoPlataforma || 0),
    0
  );
  const totalFormadores = linhas.reduce(
    (acc, linha) => acc + Number(linha.valorFormador || 0),
    0
  );

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
        Vendas
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
          <h3 style={cardTitle}>Total de vendas</h3>
          <p style={cardValue}>{loading ? "..." : totalVendas}</p>
        </div>

        <div style={card}>
          <h3 style={cardTitle}>Total recebido</h3>
          <p style={cardValue}>
            {loading ? "..." : formatarEuro(totalRecebido)}
          </p>
        </div>

        <div style={card}>
          <h3 style={cardTitle}>Comissão plataforma</h3>
          <p style={cardValue}>
            {loading ? "..." : formatarEuro(totalComissoes)}
          </p>
        </div>

        <div style={card}>
          <h3 style={cardTitle}>Total formadores</h3>
          <p style={cardValue}>
            {loading ? "..." : formatarEuro(totalFormadores)}
          </p>
        </div>
      </div>

      {erro ? <div style={caixaErro}>{erro}</div> : null}

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
          placeholder="Pesquisar venda..."
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
          <span style={colunaNome}>Venda</span>
          <span style={coluna}>Aluno</span>
          <span style={coluna}>Curso</span>
          <span style={coluna}>Formador</span>
          <span style={coluna}>Valores</span>
          <span style={coluna}>Estado</span>
          <span style={coluna}>Data</span>
        </div>

        {loading ? (
          <div style={linhaVazia}>A carregar vendas...</div>
        ) : linhasFiltradas.length === 0 ? (
          <div style={linhaVazia}>Ainda não existem vendas registadas.</div>
        ) : (
          linhasFiltradas.map((linha) => (
            <div key={linha.id} style={linhaTabela}>
              <div>
                <div style={colunaNomeValor}>Venda #{linha.id}</div>
                <div style={subtexto}>Método: {linha.metodo}</div>
                <div style={subtexto}>Moeda: {linha.moeda}</div>
                <div style={subtexto}>
                  Stripe: {linha.stripePaymentId || "—"}
                </div>
              </div>

              <div>
                <div style={colunaNomeValor}>{linha.alunoNome}</div>
                <div style={subtexto}>{linha.alunoEmail}</div>
              </div>

              <div style={colunaValor}>{linha.cursoTitulo}</div>

              <div style={colunaValor}>{linha.formadorNome}</div>

              <div>
                <div style={colunaValor}>
                  Bruto: {formatarEuro(linha.valorBruto)}
                </div>
                <div style={subtexto}>
                  Comissão: {formatarEuro(linha.comissaoPlataforma)}
                </div>
                <div style={subtexto}>
                  Formador: {formatarEuro(linha.valorFormador)}
                </div>
              </div>

              <div>
                <span style={badgeEstado(linha.status)}>{linha.status}</span>
              </div>

              <div>
                <div style={subtexto}>
                  Criado: {formatarDataHora(linha.createdAt)}
                </div>
                <div style={subtexto}>
                  Atualizado: {formatarDataHora(linha.updatedAt)}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
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

  if (["paid", "pago", "concluido", "succeeded", "sucesso"].includes(normalizado)) {
    return {
      display: "inline-block",
      padding: "8px 12px",
      border: "1px solid rgba(74,222,128,0.4)",
      background: "rgba(20,90,40,0.15)",
      color: "#bff1bf",
      fontSize: "15px",
    };
  }

  if (["pending", "pendente", "processing", "em_processamento"].includes(normalizado)) {
    return {
      display: "inline-block",
      padding: "8px 12px",
      border: "1px solid rgba(230,194,122,0.4)",
      background: "rgba(120,90,20,0.15)",
      color: "#f0d79a",
      fontSize: "15px",
    };
  }

  if (["failed", "falhou", "cancelado", "canceled", "reembolsado", "refunded"].includes(normalizado)) {
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
  gridTemplateColumns: "1.1fr 1.2fr 1.2fr 1fr 1.1fr 0.8fr 1fr",
  gap: "16px",
  padding: "16px 18px",
  background: "#1b110c",
  color: "#e6c27a",
  fontSize: "18px",
  borderBottom: "1px solid #8a5d31",
};

const linhaTabela: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1.1fr 1.2fr 1.2fr 1fr 1.1fr 0.8fr 1fr",
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

const caixaErro: CSSProperties = {
  border: "1px solid rgba(255,107,107,0.35)",
  background: "rgba(120,20,20,0.12)",
  padding: "16px 18px",
  color: "#ffb4b4",
  fontSize: "18px",
  lineHeight: 1.6,
  marginBottom: "20px",
};