"use client";

import { FormEvent, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type Formador = {
  id: number;
  status: string | null;
  auth_id: string | null;
};

type FormData = {
  titulo: string;
  descricao: string;
  tipo_produto: string;
  preco: string;
  capa_url: string;
  tem_certificado: boolean;
  modo_certificado: string;
  texto_certificado: string;
  horas_certificado: string;
  tem_manual_geral: boolean;
};

const initialForm: FormData = {
  titulo: "",
  descricao: "",
  tipo_produto: "curso_video",
  preco: "",
  capa_url: "",
  tem_certificado: false,
  modo_certificado: "automatico",
  texto_certificado: "",
  horas_certificado: "",
  tem_manual_geral: false,
};

export default function CriarCursoPage() {
  const [form, setForm] = useState<FormData>(initialForm);
  const [loading, setLoading] = useState(false);
  const [uploadingCapa, setUploadingCapa] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  const isCursoVideo = useMemo(
    () => form.tipo_produto === "curso_video",
    [form.tipo_produto]
  );

  const isPdfDigital = useMemo(
    () => form.tipo_produto === "pdf_digital",
    [form.tipo_produto]
  );

  const isProdutoFisico = useMemo(
    () => form.tipo_produto === "produto_fisico",
    [form.tipo_produto]
  );

  function update<K extends keyof FormData>(field: K, value: FormData[K]) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function validar() {
    if (!form.titulo.trim()) return "Indica o título do produto.";
    if (!form.descricao.trim()) return "Indica a descrição do produto.";
    if (!form.tipo_produto.trim()) return "Indica o tipo de produto.";
    if (!form.preco.trim()) return "Indica o preço.";

    const precoNumero = Number(form.preco.replace(",", "."));
    if (Number.isNaN(precoNumero) || precoNumero < 0) {
      return "Indica um preço válido.";
    }

    if (form.tem_certificado && !form.modo_certificado.trim()) {
      return "Indica o modo do certificado.";
    }

    return "";
  }

  async function handleUploadCapa(file: File | null) {
    if (!file) return;

    setErro("");
    setSucesso("");

    try {
      setUploadingCapa(true);

      const extensao = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const nomeFicheiro = `curso-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}.${extensao}`;

      const { error: uploadError } = await supabase.storage
        .from("curso_capas")
        .upload(nomeFicheiro, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        setErro(uploadError.message || "Não foi possível fazer upload da capa.");
        return;
      }

      const { data } = supabase.storage
        .from("curso_capas")
        .getPublicUrl(nomeFicheiro);

      update("capa_url", data.publicUrl);
      setSucesso("Capa carregada com sucesso.");
    } catch {
      setErro("Ocorreu um erro inesperado ao carregar a capa.");
    } finally {
      setUploadingCapa(false);
    }
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
        .select("id, status, auth_id")
        .eq("auth_id", user.id)
        .single();

      if (formadorError || !formador) {
        setErro("Não foi possível associar este produto ao formador autenticado.");
        return;
      }

      const formadorAtual = formador as Formador;

      if (formadorAtual.status !== "aprovado") {
        setErro("A conta de formador não está aprovada.");
        return;
      }

      const precoNumero = Number(form.preco.replace(",", "."));

      const payload = {
        formador_id: formadorAtual.id,
        titulo: form.titulo.trim(),
        descricao: form.descricao.trim(),
        tipo_produto: form.tipo_produto,
        preco: precoNumero,
        publicado: false,
        tem_certificado: form.tem_certificado,
        modo_certificado: form.tem_certificado ? form.modo_certificado : null,
        texto_certificado: form.tem_certificado
          ? form.texto_certificado.trim() || null
          : null,
        horas_certificado: form.tem_certificado
          ? form.horas_certificado.trim() || null
          : null,
        tem_manual_geral: isCursoVideo ? form.tem_manual_geral : false,
        capa_url: form.capa_url.trim() || null,
      };

      const { data: cursoCriado, error: insertError } = await supabase
        .from("cursos")
        .insert([payload])
        .select("id")
        .single();

      if (insertError) {
        setErro(insertError.message || "Erro ao criar produto.");
        return;
      }

      if (
        cursoCriado &&
        typeof cursoCriado.id === "number" &&
        isCursoVideo
      ) {
        await supabase.from("comunidades").insert([
          {
            curso_id: cursoCriado.id,
            titulo: `Comunidade - ${form.titulo.trim()}`,
            descricao: `Comunidade interna do curso ${form.titulo.trim()}.`,
            ativa: true,
          },
        ]);
      }

      setSucesso(
        isCursoVideo
          ? "Curso criado com sucesso como rascunho. A comunidade interna base também foi preparada."
          : "Produto criado com sucesso como rascunho."
      );

      setForm(initialForm);
    } catch {
      setErro("Ocorreu um erro inesperado ao criar o produto.");
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
        padding: "50px 16px 90px",
        fontFamily: "Cormorant Garamond, serif",
      }}
    >
      <section
        style={{
          maxWidth: "1180px",
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
              fontSize: "clamp(34px, 6vw, 62px)",
              lineHeight: 1.1,
              color: "#f0d79a",
              fontWeight: 500,
            }}
          >
            Criar Produto
          </h1>

          <p
            style={{
              margin: 0,
              fontSize: "clamp(18px, 2.4vw, 24px)",
              lineHeight: 1.7,
              color: "#d7b06c",
              maxWidth: "960px",
            }}
          >
            Cria um curso em vídeo, um PDF digital ou um produto físico. O
            conteúdo será guardado como rascunho para poderes estruturar tudo
            com calma antes da publicação.
          </p>
        </header>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: "28px",
            alignItems: "start",
          }}
        >
          <form
            onSubmit={handleSubmit}
            style={{
              border: "1px solid #8a5d31",
              padding: "clamp(20px, 3vw, 34px)",
              background:
                "linear-gradient(180deg, rgba(20,13,9,0.98) 0%, rgba(16,10,8,0.98) 100%)",
              display: "flex",
              flexDirection: "column",
              gap: "20px",
              boxShadow:
                "0 18px 42px rgba(0,0,0,0.24), inset 0 1px 0 rgba(255,225,170,0.03)",
            }}
          >
            <SelectField
              label="Tipo de produto"
              value={form.tipo_produto}
              onChange={(v) => update("tipo_produto", v)}
              options={[
                { value: "curso_video", label: "Curso em vídeo" },
                { value: "pdf_digital", label: "PDF digital" },
                { value: "produto_fisico", label: "Produto físico" },
              ]}
            />

            <Input
              label="Título"
              value={form.titulo}
              onChange={(v) => update("titulo", v)}
              placeholder="Ex.: Curso de Tarot do Básico ao Avançado"
            />

            <Textarea
              label="Descrição"
              value={form.descricao}
              onChange={(v) => update("descricao", v)}
              rows={7}
              placeholder="Descreve o produto, o seu objetivo, o público e a sua proposta."
            />

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: "18px",
              }}
            >
              <Input
                label="Preço"
                value={form.preco}
                onChange={(v) => update("preco", v)}
                placeholder="Ex.: 297"
              />

              <Input
                label="URL da capa"
                value={form.capa_url}
                onChange={(v) => update("capa_url", v)}
                placeholder="Opcional"
              />
            </div>

            <div style={caixaInterna}>
              <h2 style={subTitulo}>Capa do curso</h2>

              <label
                style={{
                  display: "block",
                  fontSize: "19px",
                  marginBottom: "10px",
                  color: "#e6c27a",
                }}
              >
                Upload da capa
              </label>

              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleUploadCapa(e.target.files?.[0] || null)}
                style={{
                  ...campoBase,
                  padding: "12px",
                }}
              />

              <p style={{ ...textoAjuda, marginTop: "12px" }}>
                O upload será feito para o bucket público <strong>curso_capas</strong>.
              </p>

              {form.capa_url ? (
                <div style={{ marginTop: "16px" }}>
                  <p
                    style={{
                      margin: "0 0 10px 0",
                      fontSize: "18px",
                      color: "#caa15a",
                    }}
                  >
                    Pré-visualização da capa
                  </p>

                  <img
                    src={form.capa_url}
                    alt="Pré-visualização da capa"
                    style={{
                      width: "100%",
                      maxWidth: "320px",
                      border: "1px solid rgba(166,120,61,0.35)",
                      display: "block",
                    }}
                  />
                </div>
              ) : null}
            </div>

            {isCursoVideo ? (
              <div style={caixaInterna}>
                <h2 style={subTitulo}>Configuração do curso em vídeo</h2>

                <label style={checkboxLinha}>
                  <input
                    type="checkbox"
                    checked={form.tem_manual_geral}
                    onChange={(e) =>
                      update("tem_manual_geral", e.target.checked)
                    }
                    style={{ accentColor: "#a6783d" }}
                  />
                  <span>Este curso terá manual geral</span>
                </label>

                <p style={textoAjuda}>
                  Os módulos, aulas, vídeos, textos, PDFs por aula e aula
                  introdutória pública serão estruturados depois da criação do
                  curso.
                </p>
              </div>
            ) : null}

            {isPdfDigital ? (
              <div style={caixaInterna}>
                <h2 style={subTitulo}>Configuração do PDF digital</h2>
                <p style={textoAjuda}>
                  Este produto será tratado como material digital autónomo, sem
                  estrutura de módulos e aulas.
                </p>
              </div>
            ) : null}

            {isProdutoFisico ? (
              <div style={caixaInterna}>
                <h2 style={subTitulo}>Configuração do produto físico</h2>
                <p style={textoAjuda}>
                  Este produto será tratado como item físico. Mais tarde podes
                  ligar imagens, detalhes adicionais e lógica de stock, se
                  necessário.
                </p>
              </div>
            ) : null}

            <div style={caixaInterna}>
              <h2 style={subTitulo}>Certificado</h2>

              <label style={checkboxLinha}>
                <input
                  type="checkbox"
                  checked={form.tem_certificado}
                  onChange={(e) =>
                    update("tem_certificado", e.target.checked)
                  }
                  style={{ accentColor: "#a6783d" }}
                />
                <span>Este produto terá certificado</span>
              </label>

              {form.tem_certificado ? (
                <div
                  style={{
                    display: "grid",
                    gap: "16px",
                    marginTop: "16px",
                  }}
                >
                  <SelectField
                    label="Modo do certificado"
                    value={form.modo_certificado}
                    onChange={(v) => update("modo_certificado", v)}
                    options={[
                      { value: "automatico", label: "Automático" },
                      { value: "manual", label: "Manual" },
                    ]}
                  />

                  <Input
                    label="Carga horária / horas"
                    value={form.horas_certificado}
                    onChange={(v) => update("horas_certificado", v)}
                    placeholder="Opcional"
                  />

                  <Textarea
                    label="Texto do certificado"
                    value={form.texto_certificado}
                    onChange={(v) => update("texto_certificado", v)}
                    rows={4}
                    placeholder="Texto opcional para personalizar a redação do certificado."
                  />
                </div>
              ) : null}
            </div>

            <div style={caixaInterna}>
              <p style={textoEstado}>
                O produto será criado como <strong>rascunho</strong>.
              </p>
            </div>

            {erro ? <MensagemErro texto={erro} /> : null}
            {sucesso ? <MensagemSucesso texto={sucesso} /> : null}

            <button
              type="submit"
              disabled={loading || uploadingCapa}
              style={{
                border: "1px solid #c4914d",
                padding: "16px 22px",
                background:
                  "linear-gradient(180deg, #c4914d 0%, #a6783d 100%)",
                color: "#140d09",
                cursor:
                  loading || uploadingCapa ? "not-allowed" : "pointer",
                fontSize: "18px",
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                boxShadow:
                  "0 0 24px rgba(230, 194, 122, 0.18), inset 0 1px 0 rgba(255,255,255,0.18)",
                opacity: loading || uploadingCapa ? 0.7 : 1,
              }}
            >
              {uploadingCapa
                ? "A carregar capa..."
                : loading
                ? "A criar..."
                : "Criar produto"}
            </button>
          </form>

          <aside
            style={{
              border: "1px solid #8a5d31",
              padding: "clamp(20px, 3vw, 34px)",
              background:
                "linear-gradient(180deg, rgba(20,13,9,0.98) 0%, rgba(16,10,8,0.98) 100%)",
              boxShadow:
                "0 18px 42px rgba(0,0,0,0.24), inset 0 1px 0 rgba(255,225,170,0.03)",
            }}
          >
            <h2
              style={{
                fontFamily: "Cinzel, serif",
                fontSize: "clamp(26px, 4vw, 34px)",
                marginTop: 0,
                marginBottom: "20px",
                color: "#f0d79a",
                fontWeight: 500,
              }}
            >
              Como isto funciona
            </h2>

            <ul
              style={{
                margin: "0 0 24px 0",
                paddingLeft: "22px",
                lineHeight: 1.9,
                fontSize: "clamp(18px, 2vw, 21px)",
                color: "#d7b06c",
              }}
            >
              <li>Curso em vídeo: estrutura modular com aulas e comunidade.</li>
              <li>PDF digital: material autónomo sem estrutura de aulas.</li>
              <li>Produto físico: item físico para venda dentro da plataforma.</li>
              <li>Certificado: opcional e configurável por produto.</li>
              <li>Publicação: o produto nasce como rascunho.</li>
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
                Depois de criares um curso em vídeo, o passo seguinte será
                estruturar módulos, aulas, PDFs, conteúdos textuais, aula
                pública e comunidade interna.
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
        style={campoBase}
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
          ...campoBase,
          resize: "vertical",
        }}
      />
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
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

      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={campoBase}
      >
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
            style={{
              background: "#1a100c",
              color: "#e6c27a",
            }}
          >
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function MensagemErro({ texto }: { texto: string }) {
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

function MensagemSucesso({ texto }: { texto: string }) {
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

const campoBase: React.CSSProperties = {
  width: "100%",
  padding: "14px 14px",
  background: "#1a100c",
  border: "1px solid #8a5d31",
  color: "#e6c27a",
  fontSize: "18px",
  outline: "none",
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03)",
};

const caixaInterna: React.CSSProperties = {
  border: "1px solid rgba(166,120,61,0.22)",
  background: "rgba(32,18,13,0.45)",
  padding: "18px 18px",
};

const subTitulo: React.CSSProperties = {
  margin: "0 0 14px 0",
  fontFamily: "Cinzel, serif",
  fontSize: "28px",
  color: "#e6c27a",
  fontWeight: 500,
};

const textoAjuda: React.CSSProperties = {
  margin: 0,
  fontSize: "19px",
  lineHeight: 1.7,
  color: "#d7b06c",
};

const checkboxLinha: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  fontSize: "19px",
  color: "#e6c27a",
};

const textoEstado: React.CSSProperties = {
  margin: 0,
  fontSize: "20px",
  lineHeight: 1.7,
  color: "#d7b06c",
};