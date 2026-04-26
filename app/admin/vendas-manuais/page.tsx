"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type Curso = {
  id: number;
  titulo: string | null;
  preco: number | null;
  preco_eur: number | null;
  preco_brl: number | null;
  formador_id: number | null;
  publicado: boolean | null;
};

type FormState = {
  curso_id: string;
  aluno_email: string;
  aluno_nome: string;
  valor_total: string;
  moeda: "eur" | "brl";
  regiao_checkout: "eu" | "br";
  metodo_pagamento: string;
  referencia_pagamento: string;
  comissao_percentual_override: string;
  observacoes: string;
};

const formInicial: FormState = {
  curso_id: "",
  aluno_email: "",
  aluno_nome: "",
  valor_total: "",
  moeda: "eur",
  regiao_checkout: "eu",
  metodo_pagamento: "transferencia_bancaria",
  referencia_pagamento: "",
  comissao_percentual_override: "",
  observacoes: "",
};

function normalizarNumero(valor: string) {
  const texto = valor.trim().replace(",", ".");
  if (!texto) return null;

  const numero = Number(texto);
  if (Number.isNaN(numero)) return null;

  return numero;
}

function validarEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function formatarMoeda(valor: number | null | undefined, moeda: "eur" | "brl") {
  return new Intl.NumberFormat(moeda === "brl" ? "pt-BR" : "pt-PT", {
    style: "currency",
    currency: moeda === "brl" ? "BRL" : "EUR",
  }).format(Number(valor || 0));
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

export default function AdminVendasManuaisPage() {
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [form, setForm] = useState<FormState>(formInicial);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  const cursoSelecionado = useMemo(() => {
    const id = Number(form.curso_id || 0);
    return cursos.find((curso) => curso.id === id) || null;
  }, [cursos, form.curso_id]);

  const valorReferencia = useMemo(() => {
    if (!cursoSelecionado) return "";

    if (form.moeda === "brl") {
      return cursoSelecionado.preco_brl
        ? formatarMoeda(cursoSelecionado.preco_brl, "brl")
        : "Sem preço BRL configurado";
    }

    const valorEur = cursoSelecionado.preco_eur ?? cursoSelecionado.preco;

    return valorEur ? formatarMoeda(valorEur, "eur") : "Sem preço EUR configurado";
  }, [cursoSelecionado, form.moeda]);

  const carregarCursos = useCallback(async () => {
    setLoading(true);
    setErro("");

    try {
      const { data, error } = await supabase
        .from("cursos")
        .select("id, titulo, preco, preco_eur, preco_brl, formador_id, publicado")
        .order("id", { ascending: false });

      if (error) {
        setErro(error.message || "Não foi possível carregar os cursos.");
        return;
      }

      setCursos((data || []) as Curso[]);
    } catch (error: unknown) {
      setErro(getErrorMessage(error, "Ocorreu um erro ao carregar os cursos."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void carregarCursos();
  }, [carregarCursos]);

  function update<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function validarFormulario() {
    const cursoId = Number(form.curso_id || 0);

    if (!cursoId || Number.isNaN(cursoId)) {
      return "Seleciona o curso.";
    }

    if (!form.aluno_email.trim() || !validarEmail(form.aluno_email.trim())) {
      return "Indica um email válido para o aluno.";
    }

    const valorTotal = normalizarNumero(form.valor_total);
    if (valorTotal !== null && valorTotal <= 0) {
      return "O valor pago tem de ser superior a zero ou ficar vazio para usar o preço do curso.";
    }

    const comissao = normalizarNumero(form.comissao_percentual_override);
    if (comissao !== null && (comissao < 0 || comissao > 100)) {
      return "A comissão manual tem de estar entre 0 e 100.";
    }

    if (!form.metodo_pagamento.trim()) {
      return "Indica o método de pagamento.";
    }

    return "";
  }

  async function registarVendaManual(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setErro("");
    setSucesso("");

    const validacao = validarFormulario();

    if (validacao) {
      setErro(validacao);
      return;
    }

    try {
      setSubmitting(true);

      const {
        data: { session },
      } = await supabase.auth.getSession();

      const token = session?.access_token;

      if (!token) {
        setErro("Sessão administrativa em falta. Entra novamente na administração.");
        return;
      }

      const valorTotal = normalizarNumero(form.valor_total);
      const comissaoOverride = normalizarNumero(form.comissao_percentual_override);

      const response = await fetch("/api/admin/vendas-manuais", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          curso_id: Number(form.curso_id),
          aluno_email: form.aluno_email.trim().toLowerCase(),
          aluno_nome: form.aluno_nome.trim() || null,
          valor_total: valorTotal,
          moeda: form.moeda,
          regiao_checkout: form.regiao_checkout,
          metodo_pagamento: form.metodo_pagamento.trim(),
          referencia_pagamento: form.referencia_pagamento.trim() || null,
          comissao_percentual_override: comissaoOverride,
          observacoes: form.observacoes.trim() || null,
        }),
      });

      const data = (await response.json()) as {
        ok?: boolean;
        venda_id?: number;
        mensagem?: string;
        error?: string;
      };

      if (!response.ok || !data.ok) {
        setErro(data.error || "Não foi possível registar a venda manual.");
        return;
      }

      setSucesso(
        data.mensagem ||
          `Venda manual registada com sucesso. ID da venda: ${data.venda_id}.`
      );

      setForm(formInicial);
    } catch (error: unknown) {
      setErro(
        getErrorMessage(error, "Ocorreu um erro inesperado ao registar a venda manual.")
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main style={pagina}>
      <section style={container}>
        <header style={header}>
          <div>
            <p style={eyebrow}>Administração</p>
            <h1 style={titulo}>Vendas manuais</h1>
            <p style={subtitulo}>
              Regista pagamentos diretos quando o checkout Stripe falhar ou quando a
              compra for tratada fora da Stripe. A plataforma cria a venda, ativa o
              acesso do aluno e lança o saldo do formador.
            </p>
          </div>

          <div style={acoesTopo}>
            <button
              type="button"
              onClick={() => void carregarCursos()}
              style={botaoSecundario}
              disabled={loading}
            >
              Atualizar
            </button>

            <Link href="/admin" style={botaoSecundario}>
              Voltar à admin
            </Link>
          </div>
        </header>

        {erro ? <Mensagem tipo="erro" texto={erro} /> : null}
        {sucesso ? <Mensagem tipo="sucesso" texto={sucesso} /> : null}

        <form onSubmit={registarVendaManual} style={card}>
          <h2 style={sectionTitle}>Dados da venda</h2>

          <div style={grid2}>
            <CampoSelect
              label="Curso"
              value={form.curso_id}
              onChange={(valor) => update("curso_id", valor)}
              options={[
                { value: "", label: loading ? "A carregar cursos..." : "Selecionar curso" },
                ...cursos.map((curso) => ({
                  value: String(curso.id),
                  label: `#${curso.id} — ${curso.titulo || "Sem título"}${
                    curso.publicado ? "" : " — rascunho"
                  }`,
                })),
              ]}
            />

            <CampoSelect
              label="Moeda"
              value={form.moeda}
              onChange={(valor) => {
                const moeda = valor === "brl" ? "brl" : "eur";
                update("moeda", moeda);
                update("regiao_checkout", moeda === "brl" ? "br" : "eu");
              }}
              options={[
                { value: "eur", label: "EUR" },
                { value: "brl", label: "BRL" },
              ]}
            />
          </div>

          <div style={infoBox}>
            <p style={infoTexto}>
              Valor de referência do curso: <strong>{valorReferencia || "—"}</strong>
            </p>
            <p style={infoTexto}>
              Podes deixar o campo “Valor pago” vazio para usar o preço do curso.
            </p>
          </div>

          <div style={grid2}>
            <CampoTexto
              label="Email do aluno"
              value={form.aluno_email}
              onChange={(valor) => update("aluno_email", valor)}
              placeholder="aluno@email.com"
            />

            <CampoTexto
              label="Nome do aluno"
              value={form.aluno_nome}
              onChange={(valor) => update("aluno_nome", valor)}
              placeholder="Opcional"
            />
          </div>

          <div style={grid2}>
            <CampoTexto
              label="Valor pago"
              value={form.valor_total}
              onChange={(valor) => update("valor_total", valor)}
              placeholder="Opcional. Ex.: 97"
              type="number"
            />

            <CampoSelect
              label="Região comercial"
              value={form.regiao_checkout}
              onChange={(valor) => update("regiao_checkout", valor === "br" ? "br" : "eu")}
              options={[
                { value: "eu", label: "EU / Resto do mundo" },
                { value: "br", label: "Brasil" },
              ]}
            />
          </div>

          <h2 style={sectionTitle}>Pagamento e comissão</h2>

          <div style={grid2}>
            <CampoSelect
              label="Método de pagamento"
              value={form.metodo_pagamento}
              onChange={(valor) => update("metodo_pagamento", valor)}
              options={[
                { value: "transferencia_bancaria", label: "Transferência bancária" },
                { value: "mb_way", label: "MB WAY" },
                { value: "paypal", label: "PayPal" },
                { value: "stripe_falhou", label: "Stripe falhou" },
                { value: "outro", label: "Outro" },
              ]}
            />

            <CampoTexto
              label="Comissão manual"
              value={form.comissao_percentual_override}
              onChange={(valor) => update("comissao_percentual_override", valor)}
              placeholder="Opcional. Ex.: 20 ou 0"
              type="number"
            />
          </div>

          <CampoTexto
            label="Referência do pagamento"
            value={form.referencia_pagamento}
            onChange={(valor) => update("referencia_pagamento", valor)}
            placeholder="Opcional. Ex.: comprovativo recebido, transferência confirmada..."
          />

          <CampoTextarea
            label="Observações internas"
            value={form.observacoes}
            onChange={(valor) => update("observacoes", valor)}
            placeholder="Notas internas para auditoria administrativa."
            rows={5}
          />

          <div style={zonaAcoes}>
            <button type="submit" style={botaoPrimario} disabled={submitting}>
              {submitting ? "A registar..." : "Registar venda manual"}
            </button>

            <button
              type="button"
              style={botaoSecundario}
              onClick={() => {
                setForm(formInicial);
                setErro("");
                setSucesso("");
              }}
              disabled={submitting}
            >
              Limpar
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}

function CampoTexto({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (valor: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        step={type === "number" ? "0.01" : undefined}
        min={type === "number" ? "0" : undefined}
        style={campoStyle}
      />
    </div>
  );
}

function CampoTextarea({
  label,
  value,
  onChange,
  placeholder,
  rows,
}: {
  label: string;
  value: string;
  onChange: (valor: string) => void;
  placeholder?: string;
  rows: number;
}) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        rows={rows}
        style={{ ...campoStyle, resize: "vertical" }}
      />
    </div>
  );
}

function CampoSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (valor: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        style={campoStyle}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value} style={optionStyle}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function Mensagem({ tipo, texto }: { tipo: "erro" | "sucesso"; texto: string }) {
  return (
    <section
      style={{
        border:
          tipo === "erro"
            ? "1px solid rgba(255,107,107,0.35)"
            : "1px solid rgba(74,222,128,0.35)",
        background:
          tipo === "erro" ? "rgba(120,20,20,0.12)" : "rgba(20,90,40,0.12)",
        color: tipo === "erro" ? "#ffb4b4" : "#bff1bf",
        padding: "18px",
        fontSize: "19px",
        lineHeight: 1.7,
        marginBottom: "18px",
      }}
    >
      {texto}
    </section>
  );
}

const pagina: React.CSSProperties = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at top, rgba(166,120,61,0.08), transparent 22%), #2b160f",
  color: "#e6c27a",
  fontFamily: "Cormorant Garamond, serif",
  padding: "42px 16px 90px",
};

const container: React.CSSProperties = {
  maxWidth: "1100px",
  margin: "0 auto",
};

const header: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: "18px",
  alignItems: "flex-end",
  flexWrap: "wrap",
  marginBottom: "28px",
};

const eyebrow: React.CSSProperties = {
  margin: "0 0 10px 0",
  letterSpacing: "0.16em",
  textTransform: "uppercase",
  color: "#caa15a",
  fontSize: "15px",
};

const titulo: React.CSSProperties = {
  margin: 0,
  fontFamily: "Cinzel, serif",
  fontSize: "clamp(34px, 6vw, 58px)",
  lineHeight: 1.1,
  color: "#f0d79a",
  fontWeight: 500,
};

const subtitulo: React.CSSProperties = {
  margin: "14px 0 0 0",
  fontSize: "clamp(19px, 2.4vw, 24px)",
  lineHeight: 1.7,
  color: "#d7b06c",
  maxWidth: "820px",
};

const acoesTopo: React.CSSProperties = {
  display: "flex",
  gap: "12px",
  flexWrap: "wrap",
};

const card: React.CSSProperties = {
  border: "1px solid #8a5d31",
  background:
    "linear-gradient(180deg, rgba(20,13,9,0.98) 0%, rgba(16,10,8,0.98) 100%)",
  padding: "clamp(20px, 3vw, 30px)",
  boxShadow: "0 18px 42px rgba(0,0,0,0.24), inset 0 1px 0 rgba(255,225,170,0.03)",
  display: "grid",
  gap: "20px",
};

const sectionTitle: React.CSSProperties = {
  margin: "0 0 -4px 0",
  fontFamily: "Cinzel, serif",
  fontSize: "30px",
  color: "#f0d79a",
  fontWeight: 500,
};

const grid2: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
  gap: "16px",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  marginBottom: "8px",
  fontSize: "19px",
  color: "#e6c27a",
};

const campoStyle: React.CSSProperties = {
  width: "100%",
  padding: "14px",
  background: "#1a100c",
  border: "1px solid #8a5d31",
  color: "#e6c27a",
  fontSize: "18px",
  outline: "none",
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03)",
};

const optionStyle: React.CSSProperties = {
  background: "#1a100c",
  color: "#e6c27a",
};

const infoBox: React.CSSProperties = {
  border: "1px solid rgba(166,120,61,0.22)",
  background: "rgba(32,18,13,0.45)",
  padding: "16px",
};

const infoTexto: React.CSSProperties = {
  margin: "0 0 6px 0",
  fontSize: "18px",
  lineHeight: 1.6,
  color: "#d7b06c",
};

const zonaAcoes: React.CSSProperties = {
  display: "flex",
  gap: "12px",
  flexWrap: "wrap",
  alignItems: "center",
};

const botaoPrimario: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  border: "1px solid #c4914d",
  padding: "14px 18px",
  background: "linear-gradient(180deg, #c4914d 0%, #a6783d 100%)",
  color: "#140d09",
  cursor: "pointer",
  fontSize: "16px",
  fontWeight: 700,
  textDecoration: "none",
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