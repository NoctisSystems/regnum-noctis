"use client";

import { ChangeEvent, FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
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
  pdf_path: string;
  tem_certificado: boolean;
  modo_certificado: string;
  certificado_tipo: string;
  certificado_titulo: string;
  texto_certificado: string;
  horas_certificado: string;
  certificado_pronto_path: string;
  certificado_modelo_path: string;
  tem_manual_geral: boolean;
  modo_acesso_14_dias: string;
};

const initialForm: FormData = {
  titulo: "",
  descricao: "",
  tipo_produto: "curso_video",
  preco: "",
  capa_url: "",
  pdf_path: "",
  tem_certificado: false,
  modo_certificado: "manual",
  certificado_tipo: "padrao_regnum",
  certificado_titulo: "",
  texto_certificado: "",
  horas_certificado: "",
  certificado_pronto_path: "",
  certificado_modelo_path: "",
  tem_manual_geral: false,
  modo_acesso_14_dias: "sem_acesso_ate_renuncia",
};

export default function CriarCursoPage() {
  const router = useRouter();

  const [form, setForm] = useState<FormData>(initialForm);

  const [loading, setLoading] = useState(false);
  const [uploadingCapa, setUploadingCapa] = useState(false);
  const [uploadingPdf, setUploadingPdf] = useState(false);
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

  const usaPadraoRegnum = useMemo(
    () => form.certificado_tipo === "padrao_regnum",
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

  const algumUploadAtivo =
    uploadingCapa ||
    uploadingPdf ||
    uploadingCertificadoPronto ||
    uploadingModeloCertificado;

  function update<K extends keyof FormData>(field: K, value: FormData[K]) {
    setForm((prev) => ({ ...prev, [field]: value }));
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

  function validarParaRascunho() {
    if (!form.titulo.trim()) {
      return "Indica o título.";
    }

    if (!form.tipo_produto.trim()) {
      return "Indica o tipo de conteúdo.";
    }

    if (form.preco.trim()) {
      const precoNumero = Number(form.preco.replace(",", "."));
      if (Number.isNaN(precoNumero) || precoNumero < 0) {
        return "Indica um preço válido.";
      }
    }

    return "";
  }

  async function handleUploadCapa(file: File | null) {
    if (!file) return;

    setErro("");
    setSucesso("");

    try {
      setUploadingCapa(true);

      const tiposPermitidos = ["image/png", "image/jpeg", "image/webp"];
      if (!tiposPermitidos.includes(file.type)) {
        setErro("A capa tem de estar em PNG, JPG ou WEBP.");
        return;
      }

      const maxBytes = 5 * 1024 * 1024;
      if (file.size > maxBytes) {
        setErro("A capa não pode ultrapassar 5 MB.");
        return;
      }

      const user = await obterUtilizadorAutenticado();

      const extensao =
        file.type === "image/png"
          ? "png"
          : file.type === "image/webp"
          ? "webp"
          : "jpg";

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

      const { data } = supabase.storage
        .from("curso_capas")
        .getPublicUrl(nomeFicheiro);

      update("capa_url", data.publicUrl);
      setSucesso("Capa carregada com sucesso.");
    } catch (error: any) {
      setErro(
        error?.message || "Ocorreu um erro inesperado ao carregar a capa."
      );
    } finally {
      setUploadingCapa(false);
    }
  }

  async function handleUploadPdf(file: File | null) {
    if (!file) return;

    setErro("");
    setSucesso("");

    try {
      setUploadingPdf(true);

      if (file.type !== "application/pdf") {
        setErro("O ficheiro principal do conteúdo tem de estar em PDF.");
        return;
      }

      const maxBytes = 25 * 1024 * 1024;
      if (file.size > maxBytes) {
        setErro("O PDF não pode ultrapassar 25 MB.");
        return;
      }

      const user = await obterUtilizadorAutenticado();

      const nomeFicheiro = `formadores/${user.id}/pdfs/pdf-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}.pdf`;

      const { error: uploadError } = await supabase.storage
        .from("cursos_pdfs")
        .upload(nomeFicheiro, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        setErro(uploadError.message || "Não foi possível carregar o PDF.");
        return;
      }

      update("pdf_path", nomeFicheiro);
      setSucesso("PDF carregado com sucesso.");
    } catch (error: any) {
      setErro(
        error?.message || "Ocorreu um erro inesperado ao carregar o PDF."
      );
    } finally {
      setUploadingPdf(false);
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

      const tiposPermitidos = ["application/pdf", "image/png"];
      if (!tiposPermitidos.includes(file.type)) {
        setErro("O certificado tem de estar em PDF ou PNG.");
        return;
      }

      const maxBytes = 10 * 1024 * 1024;
      if (file.size > maxBytes) {
        setErro("O ficheiro do certificado não pode ultrapassar 10 MB.");
        return;
      }

      const user = await obterUtilizadorAutenticado();

      const extensao = file.type === "image/png" ? "png" : "pdf";
      const prefixo =
        tipo === "pronto" ? "certificado-pronto" : "modelo-certificado";

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
        setErro(
          uploadError.message || "Não foi possível carregar o certificado."
        );
        return;
      }

      if (tipo === "pronto") {
        update("certificado_pronto_path", nomeFicheiro);
        setSucesso("Certificado já pronto carregado com sucesso.");
      } else {
        update("certificado_modelo_path", nomeFicheiro);
        setSucesso("Modelo base do certificado carregado com sucesso.");
      }
    } catch (error: any) {
      setErro(
        error?.message ||
          "Ocorreu um erro inesperado ao carregar o certificado."
      );
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

    const validacao = validarParaRascunho();
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
        setErro(
          "Não foi possível associar este conteúdo ao formador autenticado."
        );
        return;
      }

      const formadorAtual = formador as Formador;

      if (formadorAtual.status !== "aprovado") {
        setErro("A conta de formador não está aprovada.");
        return;
      }

      const precoNumero = form.preco.trim()
        ? Number(form.preco.replace(",", "."))
        : null;

      const payload = {
        formador_id: formadorAtual.id,
        titulo: form.titulo.trim(),
        descricao: form.descricao.trim() || null,
        tipo_produto: form.tipo_produto,
        preco: precoNumero,
        publicado: false,
        modo_acesso_14_dias: form.modo_acesso_14_dias || null,
        dias_prazo_legal: 14,
        tem_certificado: form.tem_certificado,
        modo_certificado: form.tem_certificado
          ? form.modo_certificado || null
          : null,
        certificado_tipo: form.tem_certificado
          ? form.certificado_tipo || null
          : null,
        certificado_titulo: form.tem_certificado
          ? form.certificado_titulo.trim() || null
          : null,
        texto_certificado: form.tem_certificado
          ? form.texto_certificado.trim() || null
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
        pdf_path: isPdfDigital ? form.pdf_path.trim() || null : null,
      };

      const { data: cursoCriado, error: insertError } = await supabase
        .from("cursos")
        .insert([payload])
        .select("id, tipo_produto")
        .single();

      if (insertError) {
        setErro(insertError.message || "Erro ao criar conteúdo.");
        return;
      }

      if (
        cursoCriado &&
        typeof cursoCriado.id === "number" &&
        form.tipo_produto === "curso_video"
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
          ? "Curso criado com sucesso como rascunho."
          : "PDF digital criado com sucesso como rascunho."
      );

      const novoId = cursoCriado?.id;

      if (typeof novoId === "number") {
        if (form.tipo_produto === "curso_video") {
          router.push(`/formadores/cursos/${novoId}/estrutura`);
          return;
        }

        router.push(`/formadores/cursos/${novoId}`);
        return;
      }

      setForm(initialForm);
    } catch {
      setErro("Ocorreu um erro inesperado ao criar o conteúdo.");
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
        padding: "clamp(28px, 4vw, 50px) 16px 90px",
        fontFamily: "Cormorant Garamond, serif",
      }}
    >
      <section
        style={{
          maxWidth: "960px",
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
              maxWidth: "920px",
            }}
          >
            Cria aqui o rascunho do teu conteúdo. Nesta fase só o título é
            obrigatório. O resto pode ser tratado depois, com calma, antes da
            publicação.
          </p>
        </header>

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
            placeholder="Opcional nesta fase"
          />

          <Input
            label="Preço"
            value={form.preco}
            onChange={(v) => update("preco", v)}
            placeholder="Opcional nesta fase"
          />

          <div style={caixaInterna}>
            <h2 style={subTitulo}>Prazo legal de 14 dias</h2>

            <SelectField
              label="Acesso do aluno durante os 14 dias"
              value={form.modo_acesso_14_dias}
              onChange={(v) => update("modo_acesso_14_dias", v)}
              options={[
                {
                  value: "sem_acesso_ate_renuncia",
                  label: "Sem acesso até renúncia ou fim do prazo",
                },
                {
                  value: "acesso_modulo_1",
                  label: "Permitir apenas o módulo 1",
                },
                {
                  value: "acesso_conteudo_marcado",
                  label: "Permitir apenas conteúdo marcado",
                },
              ]}
            />

            <p style={textoAjuda}>
              Podes deixar esta configuração como está por agora e alterá-la
              depois.
            </p>
          </div>

          <div style={caixaInterna}>
            <h2 style={subTitulo}>Capa do curso</h2>

            <UploadField
              label="Upload da capa"
              buttonText={uploadingCapa ? "A carregar capa..." : "Selecionar capa"}
              accept="image/png,image/jpeg,image/webp"
              onChange={(e) => handleUploadCapa(e.target.files?.[0] || null)}
              disabled={uploadingCapa}
            />

            <p style={{ ...textoAjuda, marginTop: "10px" }}>
              Formatos aceites: <strong>PNG, JPG e WEBP</strong>. Medida
              recomendada para melhor definição: <strong>1920 × 1080 px</strong>.
              Proporção ideal: <strong>16:9</strong>. Máximo: <strong>5 MB</strong>.
            </p>

            <p style={{ ...textoAjuda, marginTop: "10px" }}>
              A capa não é obrigatória para criar o rascunho.
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
                Depois de criares o rascunho, segues para a área da estrutura
                para organizares módulos, aulas, vídeos e conteúdo público.
              </p>
            </div>
          ) : null}

          {isPdfDigital ? (
            <div style={caixaInterna}>
              <h2 style={subTitulo}>PDF digital</h2>

              <UploadField
                label="Upload do PDF principal"
                buttonText={uploadingPdf ? "A carregar PDF..." : "Selecionar PDF"}
                accept="application/pdf"
                onChange={(e) => handleUploadPdf(e.target.files?.[0] || null)}
                disabled={uploadingPdf}
              />

              <p style={{ ...textoAjuda, marginTop: "10px" }}>
                Formato obrigatório: <strong>PDF</strong>.
              </p>

              <p style={{ ...textoAjuda, marginTop: "10px" }}>
                O upload do PDF também pode ser tratado depois, na gestão do
                conteúdo.
              </p>

              {form.pdf_path ? (
                <p style={{ ...textoAjuda, marginTop: "12px" }}>
                  Ficheiro carregado: <strong>{form.pdf_path}</strong>
                </p>
              ) : null}
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
                  label="Modo de emissão do certificado"
                  value={form.modo_certificado}
                  onChange={(v) => update("modo_certificado", v)}
                  options={[
                    { value: "manual", label: "Manual" },
                    { value: "automatico", label: "Automático" },
                  ]}
                />

                <SelectField
                  label="Tipo de certificado"
                  value={form.certificado_tipo}
                  onChange={(v) => update("certificado_tipo", v)}
                  options={[
                    {
                      value: "padrao_regnum",
                      label: "Usar certificado padrão do Regnum",
                    },
                    {
                      value: "upload_pronto",
                      label: "Enviar certificado já pronto",
                    },
                    {
                      value: "modelo_personalizado",
                      label: "Enviar modelo base do certificado",
                    },
                  ]}
                />

                <Input
                  label="Título interno do certificado"
                  value={form.certificado_titulo}
                  onChange={(v) => update("certificado_titulo", v)}
                  placeholder="Opcional"
                />

                <Input
                  label="Carga horária / horas"
                  value={form.horas_certificado}
                  onChange={(v) => update("horas_certificado", v)}
                  placeholder="Opcional"
                />

                <Textarea
                  label="Texto interno do certificado"
                  value={form.texto_certificado}
                  onChange={(v) => update("texto_certificado", v)}
                  rows={4}
                  placeholder="Opcional"
                />

                {usaPadraoRegnum ? (
                  <div style={caixaUploadSecundaria}>
                    <p
                      style={{
                        margin: "0 0 10px 0",
                        fontSize: "19px",
                        color: "#e6c27a",
                      }}
                    >
                      Certificado padrão do Regnum
                    </p>

                    <p style={textoAjuda}>
                      Nesta opção, não precisas de carregar ficheiro nesta
                      fase.
                    </p>
                  </div>
                ) : null}

                {usaUploadPronto ? (
                  <div style={caixaUploadSecundaria}>
                    <UploadField
                      label="Upload do certificado já pronto"
                      buttonText={
                        uploadingCertificadoPronto
                          ? "A carregar certificado..."
                          : "Selecionar certificado"
                      }
                      accept="application/pdf,image/png"
                      onChange={(e) =>
                        handleUploadCertificado(
                          e.target.files?.[0] || null,
                          "pronto"
                        )
                      }
                      disabled={uploadingCertificadoPronto}
                    />

                    <p style={{ ...textoAjuda, marginTop: "10px" }}>
                      Formatos aceites: <strong>PDF ou PNG</strong>. Medida
                      recomendada: <strong>1536 × 1024 px</strong>, em
                      horizontal.
                    </p>

                    <p style={{ ...textoAjuda, marginTop: "10px" }}>
                      Também podes deixar isto para depois.
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
                  <div style={caixaUploadSecundaria}>
                    <UploadField
                      label="Upload do modelo base do certificado"
                      buttonText={
                        uploadingModeloCertificado
                          ? "A carregar modelo..."
                          : "Selecionar modelo"
                      }
                      accept="application/pdf,image/png"
                      onChange={(e) =>
                        handleUploadCertificado(
                          e.target.files?.[0] || null,
                          "modelo"
                        )
                      }
                      disabled={uploadingModeloCertificado}
                    />

                    <p style={{ ...textoAjuda, marginTop: "10px" }}>
                      Formatos aceites: <strong>PDF ou PNG</strong>. Medida
                      recomendada: <strong>1536 × 1024 px</strong>, em
                      horizontal.
                    </p>

                    <p style={{ ...textoAjuda, marginTop: "10px" }}>
                      Também podes deixar isto para depois.
                    </p>

                    {form.certificado_modelo_path ? (
                      <p style={{ ...textoAjuda, marginTop: "12px" }}>
                        Ficheiro carregado:{" "}
                        <strong>{form.certificado_modelo_path}</strong>
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>

          <div style={caixaInterna}>
            <p style={textoEstado}>
              O conteúdo será criado como <strong>rascunho</strong>. A capa,
              descrição, preço, PDF, certificado e restantes detalhes podem
              ser tratados depois.
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
            {loading
              ? "A criar..."
              : isCursoVideo
              ? "Iniciar criação do curso"
              : "Iniciar criação do PDF"}
          </button>
        </form>
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

function UploadField({
  label,
  buttonText,
  accept,
  onChange,
  disabled,
}: {
  label: string;
  buttonText: string;
  accept: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
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

      <label
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          textDecoration: "none",
          border: "1px solid #a6783d",
          color: "#e6c27a",
          padding: "12px 18px",
          fontSize: "15px",
          background: "rgba(32,18,13,0.55)",
          cursor: disabled ? "not-allowed" : "pointer",
          textAlign: "center",
          opacity: disabled ? 0.7 : 1,
          minHeight: "46px",
        }}
      >
        {buttonText}
        <input
          type="file"
          accept={accept}
          onChange={onChange}
          disabled={disabled}
          style={{ display: "none" }}
        />
      </label>
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