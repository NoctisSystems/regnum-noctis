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
  certificado_tipo: string;
  certificado_titulo: string;
  texto_certificado: string;
  horas_certificado: string;
  certificado_pronto_path: string;
  certificado_modelo_path: string;
  tem_manual_geral: boolean;
};

const initialForm: FormData = {
  titulo: "",
  descricao: "",
  tipo_produto: "curso_video",
  preco: "",
  capa_url: "",
  tem_certificado: false,
  certificado_tipo: "padrao_plataforma",
  certificado_titulo: "",
  texto_certificado: "",
  horas_certificado: "",
  certificado_pronto_path: "",
  certificado_modelo_path: "",
  tem_manual_geral: false,
};

export default function CriarCursoPage() {
  const [form, setForm] = useState<FormData>(initialForm);
  const [loading, setLoading] = useState(false);
  const [uploadingCapa, setUploadingCapa] = useState(false);
  const [uploadingCertificadoPronto, setUploadingCertificadoPronto] =
    useState(false);
  const [uploadingModeloCertificado, setUploadingModeloCertificado] =
    useState(false);
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

  const usaPadraoPlataforma = useMemo(
    () => form.certificado_tipo === "padrao_plataforma",
    [form.certificado_tipo]
  );

  const usaUploadPronto = useMemo(
    () => form.certificado_tipo === "upload_pronto",
    [form.certificado_tipo]
  );

  const usaModeloPersonalizado = useMemo(
    () => form.certificado_tipo === "modelo_personalizado",
    [form.certificado_tipo]
  );

  function update<K extends keyof FormData>(field: K, value: FormData[K]) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function validar() {
    if (!form.titulo.trim()) return "Indica o título.";
    if (!form.descricao.trim()) return "Indica a descrição.";
    if (!form.tipo_produto.trim()) return "Indica o tipo.";
    if (!form.preco.trim()) return "Indica o preço.";

    const precoNumero = Number(form.preco.replace(",", "."));
    if (Number.isNaN(precoNumero) || precoNumero < 0) {
      return "Indica um preço válido.";
    }

    if (form.tem_certificado) {
      if (!form.certificado_tipo.trim()) {
        return "Indica a forma como o certificado será tratado.";
      }

      if (usaUploadPronto && !form.certificado_pronto_path.trim()) {
        return "Faz o upload do certificado já pronto.";
      }

      if (usaModeloPersonalizado) {
        if (!form.certificado_modelo_path.trim()) {
          return "Faz o upload do modelo base do certificado.";
        }

        if (!form.texto_certificado.trim()) {
          return "Indica o texto do certificado.";
        }
      }
    }

    return "";
  }

  async function obterUtilizadorAutenticado() {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      throw new Error("Não foi possível validar a sessão do formador.");
    }

    return user;
  }

  async function handleUploadCapa(file: File | null) {
    if (!file) return;

    setErro("");
    setSucesso("");

    try {
      setUploadingCapa(true);

      const tiposPermitidos = ["image/jpeg", "image/png", "image/webp"];
      if (!tiposPermitidos.includes(file.type)) {
        setErro("A capa tem de estar em JPG, PNG ou WEBP.");
        return;
      }

      const maxBytes = 5 * 1024 * 1024;
      if (file.size > maxBytes) {
        setErro("A capa não pode ultrapassar 5 MB.");
        return;
      }

      const user = await obterUtilizadorAutenticado();

      const extensao = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const nomeFicheiro = `formadores/${user.id}/capas/curso-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}.${extensao}`;

      const { error: uploadError } = await supabase.storage
        .from("curso_capas")
        .upload(nomeFicheiro, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        setErro(uploadError.message || "Não foi possível carregar a capa.");
        return;
      }

      const { data } = supabase.storage.from("curso_capas").getPublicUrl(nomeFicheiro);

      update("capa_url", data.publicUrl);
      setSucesso("Capa carregada com sucesso.");
    } catch (error: any) {
      setErro(error?.message || "Ocorreu um erro inesperado ao carregar a capa.");
    } finally {
      setUploadingCapa(false);
    }
  }

  async function handleUploadCertificado(
    file: File | null,
    tipo: "pronto" | "modelo"
  ) {
    if (!file) return;

    setErro("");
    setSucesso("");

    try {
      if (tipo === "pronto") {
        setUploadingCertificadoPronto(true);
      } else {
        setUploadingModeloCertificado(true);
      }

      const tiposPermitidos = [
        "application/pdf",
        "image/jpeg",
        "image/png",
        "image/webp",
      ];

      if (!tiposPermitidos.includes(file.type)) {
        setErro("O certificado tem de estar em PDF, JPG, PNG ou WEBP.");
        return;
      }

      const maxBytes = 10 * 1024 * 1024;
      if (file.size > maxBytes) {
        setErro("O ficheiro do certificado não pode ultrapassar 10 MB.");
        return;
      }

      const user = await obterUtilizadorAutenticado();

      const extensao = file.name.split(".").pop()?.toLowerCase() || "pdf";
      const prefixo = tipo === "pronto" ? "certificado-pronto" : "modelo-certificado";

      const nomeFicheiro = `formadores/${user.id}/certificados/${prefixo}-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}.${extensao}`;

      const { error: uploadError } = await supabase.storage
        .from("certificados")
        .upload(nomeFicheiro, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        setErro(uploadError.message || "Não foi possível carregar o certificado.");
        return;
      }

      if (tipo === "pronto") {
        update("certificado_pronto_path", nomeFicheiro);
        setSucesso("Certificado pronto carregado com sucesso.");
      } else {
        update("certificado_modelo_path", nomeFicheiro);
        setSucesso("Modelo base do certificado carregado com sucesso.");
      }
    } catch (error: any) {
      setErro(error?.message || "Ocorreu um erro inesperado ao carregar o certificado.");
    } finally {
      if (tipo === "pronto") {
        setUploadingCertificadoPronto(false);
      } else {
        setUploadingModeloCertificado(false);
      }
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
        setErro("Não foi possível associar este conteúdo ao formador autenticado.");
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
        modo_certificado: form.tem_certificado
          ? usaPadraoPlataforma
            ? "automatico"
            : "manual"
          : null,
        certificado_tipo: form.tem_certificado ? form.certificado_tipo : null,
        certificado_titulo: form.tem_certificado
          ? form.certificado_titulo.trim() || form.titulo.trim()
          : null,
        texto_certificado: form.tem_certificado
          ? !usaUploadPronto
            ? form.texto_certificado.trim() || null
            : null
          : null,
        horas_certificado: form.tem_certificado
          ? form.horas_certificado.trim() || null
          : null,
        certificado_pronto_path: form.tem_certificado
          ? form.certificado_pronto_path.trim() || null
          : null,
        certificado_modelo_path: form.tem_certificado
          ? form.certificado_modelo_path.trim() || null
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
        setErro(insertError.message || "Erro ao criar conteúdo.");
        return;
      }

      if (cursoCriado && typeof cursoCriado.id === "number" && isCursoVideo) {
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
          ? "Curso criado com sucesso como rascunho."
          : "PDF criado com sucesso como rascunho."
      );

      setForm(initialForm);
    } catch {
      setErro("Ocorreu um erro inesperado ao criar o conteúdo.");
    } finally {
      setLoading(false);
    }
  }

  const algumUploadAtivo =
    uploadingCapa || uploadingCertificadoPronto || uploadingModeloCertificado;

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top, rgba(166,120,61,0.08), transparent 22%), #2b160f",
        color: "#e6c27a",
        padding: "clamp(28px, 4vw, 50px) 16px 90px",
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
            Criar Conteúdo
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
            Cria um curso em vídeo ou um PDF digital. O conteúdo será guardado
            como rascunho para poderes estruturar tudo com calma antes da
            publicação.
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
              label="Tipo"
              value={form.tipo_produto}
              onChange={(v) => update("tipo_produto", v)}
              options={[
                { value: "curso_video", label: "Curso em vídeo" },
                { value: "pdf_digital", label: "PDF digital" },
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
              placeholder="Descreve o conteúdo, o seu objetivo, o público e a sua proposta."
            />

            <Input
              label="Preço"
              value={form.preco}
              onChange={(v) => update("preco", v)}
              placeholder="Ex.: 297"
            />

            <div style={caixaInterna}>
              <h2 style={subTitulo}>Capa</h2>

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
                accept="image/png,image/jpeg,image/webp"
                onChange={(e) => handleUploadCapa(e.target.files?.[0] || null)}
                style={{
                  ...campoBase,
                  padding: "12px",
                }}
              />

              <p style={{ ...textoAjuda, marginTop: "12px" }}>
                Formatos aceites: JPG, PNG ou WEBP. Máximo: 5 MB.
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
                  Os módulos, aulas, vídeos, textos e materiais complementares
                  serão organizados depois da criação do curso.
                </p>
              </div>
            ) : null}

            {isPdfDigital ? (
              <div style={caixaInterna}>
                <h2 style={subTitulo}>Configuração do PDF digital</h2>
                <p style={textoAjuda}>
                  Este conteúdo será tratado como material digital autónomo, sem
                  módulos nem aulas.
                </p>
              </div>
            ) : null}

            <div style={caixaInterna}>
              <h2 style={subTitulo}>Certificado</h2>

              <label style={checkboxLinha}>
                <input
                  type="checkbox"
                  checked={form.tem_certificado}
                  onChange={(e) => update("tem_certificado", e.target.checked)}
                  style={{ accentColor: "#a6783d" }}
                />
                <span>Este conteúdo terá certificado</span>
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
                    label="Como queres tratar o certificado?"
                    value={form.certificado_tipo}
                    onChange={(v) => update("certificado_tipo", v)}
                    options={[
                      {
                        value: "padrao_plataforma",
                        label: "Usar padrão da plataforma",
                      },
                      {
                        value: "upload_pronto",
                        label: "Enviar certificado já pronto",
                      },
                      {
                        value: "modelo_personalizado",
                        label: "Enviar modelo e personalizar texto",
                      },
                    ]}
                  />

                  <Input
                    label="Carga horária / horas"
                    value={form.horas_certificado}
                    onChange={(v) => update("horas_certificado", v)}
                    placeholder="Opcional"
                  />

                  {usaPadraoPlataforma ? (
                    <>
                      <Input
                        label="Título do certificado"
                        value={form.certificado_titulo}
                        onChange={(v) => update("certificado_titulo", v)}
                        placeholder="Se deixares vazio, será usado o título do curso"
                      />

                      <Textarea
                        label="Texto do certificado"
                        value={form.texto_certificado}
                        onChange={(v) => update("texto_certificado", v)}
                        rows={4}
                        placeholder="Texto opcional do certificado."
                      />
                    </>
                  ) : null}

                  {usaUploadPronto ? (
                    <div style={caixaUploadSecundaria}>
                      <label
                        style={{
                          display: "block",
                          fontSize: "19px",
                          marginBottom: "10px",
                          color: "#e6c27a",
                        }}
                      >
                        Upload do certificado já pronto
                      </label>

                      <input
                        type="file"
                        accept="application/pdf,image/png,image/jpeg,image/webp"
                        onChange={(e) =>
                          handleUploadCertificado(
                            e.target.files?.[0] || null,
                            "pronto"
                          )
                        }
                        style={{
                          ...campoBase,
                          padding: "12px",
                        }}
                      />

                      <p style={{ ...textoAjuda, marginTop: "12px" }}>
                        Usa esta opção se o certificado já estiver totalmente
                        preenchido e pronto a usar.
                      </p>

                      {form.certificado_pronto_path ? (
                        <p style={{ ...textoAjuda, marginTop: "12px" }}>
                          Ficheiro carregado:{" "}
                          <strong>{form.certificado_pronto_path}</strong>
                        </p>
                      ) : null}
                    </div>
                  ) : null}

                  {usaModeloPersonalizado ? (
                    <>
                      <div style={caixaUploadSecundaria}>
                        <label
                          style={{
                            display: "block",
                            fontSize: "19px",
                            marginBottom: "10px",
                            color: "#e6c27a",
                          }}
                        >
                          Upload do modelo base do certificado
                        </label>

                        <input
                          type="file"
                          accept="application/pdf,image/png,image/jpeg,image/webp"
                          onChange={(e) =>
                            handleUploadCertificado(
                              e.target.files?.[0] || null,
                              "modelo"
                            )
                          }
                          style={{
                            ...campoBase,
                            padding: "12px",
                          }}
                        />

                        <p style={{ ...textoAjuda, marginTop: "12px" }}>
                          Envia aqui o modelo base que queres reutilizar para os
                          teus cursos.
                        </p>

                        {form.certificado_modelo_path ? (
                          <p style={{ ...textoAjuda, marginTop: "12px" }}>
                            Ficheiro carregado:{" "}
                            <strong>{form.certificado_modelo_path}</strong>
                          </p>
                        ) : null}
                      </div>

                      <Input
                        label="Título do certificado"
                        value={form.certificado_titulo}
                        onChange={(v) => update("certificado_titulo", v)}
                        placeholder="Se deixares vazio, será usado o título do curso"
                      />

                      <Textarea
                        label="Texto do certificado"
                        value={form.texto_certificado}
                        onChange={(v) => update("texto_certificado", v)}
                        rows={5}
                        placeholder="Texto principal do certificado, em tamanho mais pequeno do que o título."
                      />
                    </>
                  ) : null}
                </div>
              ) : null}
            </div>

            <div style={caixaInterna}>
              <p style={textoEstado}>
                O conteúdo será criado como <strong>rascunho</strong>.
              </p>
            </div>

            {erro ? <MensagemErro texto={erro} /> : null}
            {sucesso ? <MensagemSucesso texto={sucesso} /> : null}

            <button
              type="submit"
              disabled={loading || algumUploadAtivo}
              style={{
                border: "1px solid #c4914d",
                padding: "16px 22px",
                background:
                  "linear-gradient(180deg, #c4914d 0%, #a6783d 100%)",
                color: "#140d09",
                cursor: loading || algumUploadAtivo ? "not-allowed" : "pointer",
                fontSize: "18px",
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                boxShadow:
                  "0 0 24px rgba(230, 194, 122, 0.18), inset 0 1px 0 rgba(255,255,255,0.18)",
                opacity: loading || algumUploadAtivo ? 0.7 : 1,
              }}
            >
              {uploadingCapa
                ? "A carregar capa..."
                : uploadingCertificadoPronto
                ? "A carregar certificado..."
                : uploadingModeloCertificado
                ? "A carregar modelo..."
                : loading
                ? "A criar..."
                : isCursoVideo
                ? "Criar curso"
                : "Criar PDF"}
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
              <li>Certificado: opcional e configurável por conteúdo.</li>
              <li>Publicação: o conteúdo nasce como rascunho.</li>
            </ul>

            <div
              style={{
                borderTop: "1px solid rgba(166,120,61,0.35)",
                paddingTop: "22px",
                display: "grid",
                gap: "14px",
              }}
            >
              <p
                style={{
                  margin: 0,
                  fontSize: "19px",
                  color: "#caa15a",
                }}
              >
                Certificados
              </p>

              <p
                style={{
                  margin: 0,
                  fontSize: "19px",
                  lineHeight: 1.8,
                  color: "#d7b06c",
                }}
              >
                Podes escolher entre usar o padrão da plataforma, enviar um
                certificado já pronto, ou carregar um modelo base para depois
                usar título e texto personalizados.
              </p>

              <p
                style={{
                  margin: 0,
                  fontSize: "19px",
                  lineHeight: 1.8,
                  color: "#d7b06c",
                }}
              >
                No modo personalizado, o título do certificado pode ficar
                separado do texto principal, permitindo uma hierarquia visual
                mais clara.
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
                organizar módulos, aulas, PDFs, conteúdos textuais, aula pública
                e comunidade interna.
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

const caixaUploadSecundaria: React.CSSProperties = {
  border: "1px solid rgba(166,120,61,0.18)",
  background: "rgba(20,13,9,0.35)",
  padding: "16px",
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
  flexWrap: "wrap",
};

const textoEstado: React.CSSProperties = {
  margin: 0,
  fontSize: "20px",
  lineHeight: 1.7,
  color: "#d7b06c",
};