"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type Formador = {
  id: number;
  nome: string | null;
  email: string | null;
  status: string | null;
};

type FormState = {
  formador_id: string;
  valor: string;
  moeda: "eur" | "brl";
  operacao: "credito" | "debito";
  saldo_destino: "disponivel" | "retido";
  descricao: string;
  referencia: string;
  venda_id: string;
  curso_id: string;
  aluno_id: string;
};

const formInicial: FormState = {
  formador_id: "",
  valor: "",
  moeda: "eur",
  operacao: "credito",
  saldo_destino: "disponivel",
  descricao: "",
  referencia: "",
  venda_id: "",
  curso_id: "",
  aluno_id: "",
};

function normalizarNumero(valor: string) {
  const texto = valor.trim().replace(",", ".");
  if (!texto) return null;

  const numero = Number(texto);
  if (Number.isNaN(numero)) return null;

  return numero;
}

function formatarMoeda(valor: number, moeda: "eur" | "brl") {
  return new Intl.NumberFormat(moeda === "brl" ? "pt-BR" : "pt-PT", {
    style: "currency",
    currency: moeda === "brl" ? "BRL" : "EUR",
  }).format(valor || 0);
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

export default function AdminSaldosFormadoresPage() {
  const [formadores, setFormadores] = useState<Formador[]>([]);
  const [form, setForm] = useState<FormState>(formInicial);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  const formadorSelecionado = useMemo(() => {
    const id = Number(form.formador_id || 0);
    return formadores.find((formador) => formador.id === id) || null;
  }, [form.formador_id, formadores]);

  const carregarFormadores = useCallback(async () => {
    setLoading(true);
    setErro("");

    try {
      const { data, error } = await supabase
        .from("formadores")
        .select("id, nome, email, status")
        .order("nome", { ascending: true, nullsFirst: false });

      if (error) {
        setErro(error.message || "Não foi possível carregar os formadores.");
        return;
      }

      setFormadores((data || []) as Formador[]);
    } catch (error: unknown) {
      setErro(getErrorMessage(error, "Ocorreu um erro ao carregar os formadores."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void carregarFormadores();
  }, [carregarFormadores]);

  function update<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function validarFormulario() {
    const formadorId = Number(form.formador_id || 0);
    const valor = normalizarNumero(form.valor);

    if (!formadorId || Number.isNaN(formadorId)) {
      return "Seleciona o formador.";
    }

    if (valor === null || valor <= 0) {
      return "Indica um valor superior a zero.";
    }

    if (!form.descricao.trim()) {
      return "Indica uma descrição para o movimento.";
    }

    if (form.venda_id.trim()) {
      const vendaId = normalizarNumero(form.venda_id);
      if (vendaId === null || vendaId <= 0) return "O ID da venda é inválido.";
    }

    if (form.curso_id.trim()) {
      const cursoId = normalizarNumero(form.curso_id);
      if (cursoId === null || cursoId <= 0) return "O ID do curso é inválido.";
    }

    if (form.aluno_id.trim()) {
      const alunoId = normalizarNumero(form.aluno_id);
      if (alunoId === null || alunoId <= 0) return "O ID do aluno é inválido.";
    }

    return "";
  }

  async function ajustarSaldo(event: FormEvent<HTMLFormElement>) {
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

      const response = await fetch("/api/admin/saldos-formadores", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          formador_id: Number(form.formador_id),
          valor: normalizarNumero(form.valor),
          moeda: form.moeda,
          operacao: form.operacao,
          saldo_destino: form.saldo_destino,
          descricao: form.descricao.trim(),
          referencia: form.referencia.trim() || null,
          venda_id: form.venda_id.trim() ? Number(form.venda_id) : null,
          curso_id: form.curso_id.trim() ? Number(form.curso_id) : null,
          aluno_id: form.aluno_id.trim() ? Number(form.aluno_id) : null,
        }),
      });

      const data = (await response.json()) as {
        ok?: boolean;
        movimento_id?: number;
        mensagem?: string;
        error?: string;
      };

      if (!response.ok || !data.ok) {
        setErro(data.error || "Não foi possível ajustar o saldo do formador.");
        return;
      }

      setSucesso(
        data.mensagem ||
          `Movimento financeiro lançado com sucesso. ID: ${data.movimento_id}.`
      );

      setForm(formInicial);
    } catch (error: unknown) {
      setErro(
        getErrorMessage(error, "Ocorreu um erro inesperado ao ajustar o saldo.")
      );
    } finally {
      setSubmitting(false);
    }
  }

  const valorPreview = normalizarNumero(form.valor);

  return (
    <main style={pagina}>
      <section style={container}>
        <header style={header}>
          <div>
            <p style={eyebrow}>Administração</p>
            <h1 style={titulo}>Saldos dos formadores</h1>
            <p style={subtitulo}>
              Lança créditos ou débitos administrativos no saldo interno dos
              formadores. Usa esta área apenas para correções, compensações,
              bónus ou ajustes manuais devidamente justificados.
            </p>
          </div>

          <div style={acoesTopo}>
            <button
              type="button"
              onClick={() => void carregarFormadores()}
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

        <form onSubmit={ajustarSaldo} style={card}>
          <h2 style={sectionTitle}>Movimento financeiro manual</h2>

          <div style={grid2}>
            <CampoSelect
              label="Formador"
              value={form.formador_id}
              onChange={(valor) => update("formador_id", valor)}
              options={[
                {
                  value: "",
                  label: loading ? "A carregar formadores..." : "Selecionar formador",
                },
                ...formadores.map((formador) => ({
                  value: String(formador.id),
                  label: `#${formador.id} — ${
                    formador.nome || formador.email || "Sem nome"
                  }${formador.status ? ` — ${formador.status}` : ""}`,
                })),
              ]}
            />

            <CampoSelect
              label="Operação"
              value={form.operacao}
              onChange={(valor) =>
                update("operacao", valor === "debito" ? "debito" : "credito")
              }
              options={[
                { value: "credito", label: "Crédito ao formador" },
                { value: "debito", label: "Débito ao formador" },
              ]}
            />
          </div>

          <div style={infoBox}>
            <p style={infoTexto}>
              Formador selecionado:{" "}
              <strong>
                {formadorSelecionado
                  ? formadorSelecionado.nome || formadorSelecionado.email || formadorSelecionado.id
                  : "—"}
              </strong>
            </p>
            <p style={infoTexto}>
              Valor a lançar:{" "}
              <strong>
                {valorPreview !== null ? formatarMoeda(valorPreview, form.moeda) : "—"}
              </strong>
            </p>
          </div>

          <div style={grid2}>
            <CampoTexto
              label="Valor"
              value={form.valor}
              onChange={(valor) => update("valor", valor)}
              placeholder="Ex.: 25"
              type="number"
            />

            <CampoSelect
              label="Moeda"
              value={form.moeda}
              onChange={(valor) => update("moeda", valor === "brl" ? "brl" : "eur")}
              options={[
                { value: "eur", label: "EUR" },
                { value: "brl", label: "BRL" },
              ]}
            />
          </div>

          <CampoSelect
            label="Destino do saldo"
            value={form.saldo_destino}
            onChange={(valor) =>
              update("saldo_destino", valor === "retido" ? "retido" : "disponivel")
            }
            options={[
              { value: "disponivel", label: "Saldo disponível" },
              { value: "retido", label: "Saldo retido" },
            ]}
          />

          <CampoTexto
            label="Descrição"
            value={form.descricao}
            onChange={(valor) => update("descricao", valor)}
            placeholder="Ex.: Correção administrativa, bónus, compensação..."
          />

          <CampoTexto
            label="Referência"
            value={form.referencia}
            onChange={(valor) => update("referencia", valor)}
            placeholder="Opcional. Ex.: ajuste interno, comprovativo, acordo..."
          />

          <h2 style={sectionTitle}>Ligação opcional a registos</h2>

          <div style={grid3}>
            <CampoTexto
              label="ID da venda"
              value={form.venda_id}
              onChange={(valor) => update("venda_id", valor)}
              placeholder="Opcional"
              type="number"
            />

            <CampoTexto
              label="ID do curso"
              value={form.curso_id}
              onChange={(valor) => update("curso_id", valor)}
              placeholder="Opcional"
              type="number"
            />

            <CampoTexto
              label="ID do aluno"
              value={form.aluno_id}
              onChange={(valor) => update("aluno_id", valor)}
              placeholder="Opcional"
              type="number"
            />
          </div>

          <div style={alerta}>
            <p style={alertaTexto}>
              Esta área altera movimentos financeiros internos. Para vendas reais
              com aluno e curso, usa preferencialmente a página “Vendas manuais”,
              porque ela cria venda, inscrição, snapshot e saldo do formador.
            </p>
          </div>

          <div style={zonaAcoes}>
            <button type="submit" style={botaoPrimario} disabled={submitting}>
              {submitting ? "A lançar..." : "Lançar movimento"}
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

const grid3: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
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

const alerta: React.CSSProperties = {
  border: "1px solid rgba(230,194,122,0.28)",
  background: "rgba(70,48,18,0.16)",
  padding: "16px",
};

const alertaTexto: React.CSSProperties = {
  margin: 0,
  fontSize: "18px",
  lineHeight: 1.7,
  color: "#e2c88e",
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