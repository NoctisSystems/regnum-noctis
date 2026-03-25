"use client";

import { FormEvent, useState } from "react";
import { supabase } from "@/lib/supabase";

type FormData = {
  titulo: string;
  descricao: string;
  tipo: string;
  preco: string;
};

const initialForm: FormData = {
  titulo: "",
  descricao: "",
  tipo: "",
  preco: "",
};

export default function CriarCursoPage() {
  const [form, setForm] = useState<FormData>(initialForm);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  function update(field: keyof FormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function validar() {
    if (!form.titulo.trim()) return "Indica o título do curso.";
    if (!form.descricao.trim()) return "Indica a descrição do curso.";
    if (!form.tipo.trim()) return "Indica o tipo do curso.";
    if (!form.preco.trim()) return "Indica o preço do curso.";

    const precoNumero = Number(form.preco.replace(",", "."));

    if (Number.isNaN(precoNumero) || precoNumero < 0) {
      return "Indica um preço válido.";
    }

    return "";
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErro("");
    setSucesso("");

    const validacao = validar();
    if (validacao) {
      setErro(validacao);
      return;
    }

    try {
      setLoading(true);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setErro("Não foi possível validar a sessão do formador.");
        return;
      }

      const { data: formador, error: formadorError } = await supabase
        .from("formadores")
        .select("id, auth_id, status")
        .eq("auth_id", user.id)
        .single();

      if (formadorError || !formador) {
        setErro("Não foi possível associar este curso ao formador autenticado.");
        return;
      }

      if (formador.status !== "aprovado") {
        setErro("A conta de formador não está aprovada.");
        return;
      }

      const precoNumero = Number(form.preco.replace(",", "."));

      const payloadBase = {
        titulo: form.titulo.trim(),
        descricao: form.descricao.trim(),
        tipo: form.tipo.trim(),
        preco: precoNumero,
        publicado: false,
      };

      let insertError: any = null;

      const tentativaComFormador = await supabase
        .from("cursos")
        .insert([
          {
            ...payloadBase,
            formador_id: formador.id,
          },
        ])
        .select("id")
        .single();

      if (tentativaComFormador.error) {
        const mensagem = tentativaComFormador.error.message || "";

        const colunaNaoExiste =
          mensagem.toLowerCase().includes("formador_id") &&
          mensagem.toLowerCase().includes("does not exist");

        if (colunaNaoExiste) {
          const tentativaSemFormador = await supabase
            .from("cursos")
            .insert([payloadBase])
            .select("id")
            .single();

          insertError = tentativaSemFormador.error;

          if (!tentativaSemFormador.error) {
            setSucesso("Curso criado com sucesso como rascunho.");
            setForm(initialForm);
            return;
          }
        } else {
          insertError = tentativaComFormador.error;
        }
      } else {
        setSucesso("Curso criado com sucesso como rascunho.");
        setForm(initialForm);
        return;
      }

      if (insertError) {
        setErro(insertError.message || "Erro ao criar curso.");
      }
    } catch {
      setErro("Ocorreu um erro inesperado ao criar o curso.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top, rgba(166,120,61,0.08), transparent 22%), #2b160f",
        color: "#e6c27a",
        padding: "50px 20px 90px",
        fontFamily: "Cormorant Garamond, serif",
      }}
    >
      <section
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
        }}
      >
        <header
          style={{
            marginBottom: "34px",
          }}
        >
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

          <h1
            style={{
              margin: "0 0 14px 0",
              fontFamily: "Cinzel, serif",
              fontSize: "clamp(42px, 6vw, 62px)",
              lineHeight: 1.1,
              color: "#f0d79a",
              fontWeight: 500,
            }}
          >
            Criar Curso
          </h1>

          <p
            style={{
              margin: 0,
              fontSize: "24px",
              lineHeight: 1.7,
              color: "#d7b06c",
              maxWidth: "900px",
            }}
          >
            Cria a base do teu curso e guarda-o como rascunho. Depois poderás
            continuar a estruturação dos módulos, aulas, materiais e comunidade
            interna associada ao curso.
          </p>
        </header>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1.15fr) minmax(320px, 0.85fr)",
            gap: "28px",
            alignItems: "start",
          }}
        >
          <form
            onSubmit={handleSubmit}
            style={{
              border: "1px solid #8a5d31",
              padding: "34px",
              background:
                "linear-gradient(180deg, rgba(20,13,9,0.98) 0%, rgba(16,10,8,0.98) 100%)",
              display: "flex",
              flexDirection: "column",
              gap: "20px",
              boxShadow:
                "0 18px 42px rgba(0,0,0,0.24), inset 0 1px 0 rgba(255,225,170,0.03)",
            }}
          >
            <Input
              label="Título do curso"
              value={form.titulo}
              onChange={(v) => update("titulo", v)}
              placeholder="Ex.: Curso de Tarot do Básico ao Avançado"
            />

            <Textarea
              label="Descrição"
              value={form.descricao}
              onChange={(v) => update("descricao", v)}
              rows={7}
              placeholder="Descreve a proposta do curso, o seu foco, profundidade e aplicação."
            />

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "18px",
              }}
            >
              <Input
                label="Tipo"
                value={form.tipo}
                onChange={(v) => update("tipo", v)}
                placeholder="Ex.: Curso, Formação, Sacerdócio"
              />

              <Input
                label="Preço"
                value={form.preco}
                onChange={(v) => update("preco", v)}
                placeholder="Ex.: 297"
              />
            </div>

            <div
              style={{
                border: "1px solid rgba(166,120,61,0.22)",
                background: "rgba(32,18,13,0.45)",
                padding: "16px 18px",
              }}
            >
              <p
                style={{
                  margin: "0 0 8px 0",
                  fontSize: "16px",
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                  color: "#caa15a",
                }}
              >
                Estado inicial
              </p>

              <p
                style={{
                  margin: 0,
                  fontSize: "20px",
                  lineHeight: "1.7",
                  color: "#d7b06c",
                }}
              >
                O curso será criado como <strong>rascunho</strong>, para que
                possas continuar a construir conteúdos antes da publicação.
              </p>
            </div>

            {erro && (
              <div
                style={{
                  color: "#ffb4b4",
                  border: "1px solid rgba(255,107,107,0.35)",
                  background: "rgba(120,20,20,0.12)",
                  padding: "14px 16px",
                  fontSize: "18px",
                }}
              >
                {erro}
              </div>
            )}

            {sucesso && (
              <div
                style={{
                  color: "#bff1bf",
                  border: "1px solid rgba(74,222,128,0.35)",
                  background: "rgba(20,90,40,0.12)",
                  padding: "14px 16px",
                  fontSize: "18px",
                }}
              >
                {sucesso}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                border: "1px solid #c4914d",
                padding: "16px 22px",
                background:
                  "linear-gradient(180deg, #c4914d 0%, #a6783d 100%)",
                color: "#140d09",
                cursor: loading ? "not-allowed" : "pointer",
                fontSize: "18px",
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                boxShadow:
                  "0 0 24px rgba(230, 194, 122, 0.18), inset 0 1px 0 rgba(255,255,255,0.18)",
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? "A criar curso..." : "Criar curso"}
            </button>
          </form>

          <aside
            style={{
              border: "1px solid #8a5d31",
              padding: "34px",
              background:
                "linear-gradient(180deg, rgba(20,13,9,0.98) 0%, rgba(16,10,8,0.98) 100%)",
              boxShadow:
                "0 18px 42px rgba(0,0,0,0.24), inset 0 1px 0 rgba(255,225,170,0.03)",
            }}
          >
            <h2
              style={{
                fontFamily: "Cinzel, serif",
                fontSize: "34px",
                marginTop: 0,
                marginBottom: "20px",
                color: "#f0d79a",
                fontWeight: 500,
              }}
            >
              Estrutura recomendada
            </h2>

            <ul
              style={{
                margin: "0 0 24px 0",
                paddingLeft: "22px",
                lineHeight: 1.9,
                fontSize: "21px",
                color: "#d7b06c",
              }}
            >
              <li>Define um título claro e forte.</li>
              <li>Escreve uma descrição sólida e orientada ao aluno.</li>
              <li>Indica o tipo de formação.</li>
              <li>Define o valor inicial do curso.</li>
              <li>Guarda primeiro em rascunho.</li>
            </ul>

            <div
              style={{
                borderTop: "1px solid rgba(166,120,61,0.35)",
                paddingTop: "22px",
              }}
            >
              <p
                style={{
                  margin: "0 0 12px 0",
                  fontSize: "19px",
                  color: "#caa15a",
                }}
              >
                Próxima fase
              </p>

              <p
                style={{
                  margin: 0,
                  fontSize: "19px",
                  lineHeight: 1.8,
                  color: "#d7b06c",
                }}
              >
                Depois de criares o curso, o passo seguinte será estruturar
                módulos, aulas, materiais complementares e a comunidade interna
                desse curso.
              </p>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}

function Input({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>
      <label
        style={{
          display: "block",
          fontSize: "19px",
          marginBottom: "8px",
          color: "#e6c27a",
        }}
      >
        {label}
      </label>

      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: "100%",
          padding: "14px 14px",
          background: "#1a100c",
          border: "1px solid #8a5d31",
          color: "#e6c27a",
          fontSize: "18px",
          outline: "none",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03)",
        }}
      />
    </div>
  );
}

function Textarea({
  label,
  value,
  onChange,
  rows = 5,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  placeholder?: string;
}) {
  return (
    <div>
      <label
        style={{
          display: "block",
          fontSize: "19px",
          marginBottom: "8px",
          color: "#e6c27a",
        }}
      >
        {label}
      </label>

      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        placeholder={placeholder}
        style={{
          width: "100%",
          padding: "14px 14px",
          background: "#1a100c",
          border: "1px solid #8a5d31",
          color: "#e6c27a",
          fontSize: "18px",
          outline: "none",
          resize: "vertical",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03)",
        }}
      />
    </div>
  );
}