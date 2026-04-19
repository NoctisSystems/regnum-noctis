"use client";

import Link from "next/link";
import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Formador = {
  id: number;
  nome: string | null;
  auth_id: string | null;
  status: string | null;
};

type Curso = {
  id: number;
  titulo: string | null;
  descricao: string | null;
  tipo_produto: string | null;
  preco: number | null;
  preco_eur: number | null;
  preco_brl: number | null;
  checkout_eu_ativo: boolean | null;
  checkout_br_ativo: boolean | null;
  publicado: boolean | null;
  tem_certificado: boolean | null;
  modo_certificado: string | null;
  certificado_tipo: string | null;
  certificado_titulo: string | null;
  horas_certificado: string | null;
  certificado_pronto_path: string | null;
  certificado_modelo_path: string | null;
  tem_manual_geral: boolean | null;
  created_at: string | null;
  modo_acesso_14_dias: string | null;
  capa_url: string | null;
  usa_comissao_override: boolean | null;
  comissao_percentual_override: number | null;
  edicao_limitada: boolean | null;
  limite_vagas: number | null;
};

type Comunidade = {
  id: number;
  curso_id: number;
  titulo: string | null;
  ativa: boolean | null;
};

type Modulo = {
  id: number;
  curso_id: number;
};

type Aula = {
  id: number;
  curso_id: number;
};

type CursoForm = {
  titulo: string;
  descricao: string;
  tipo_produto: string;
  preco: string;
  preco_eur: string;
  preco_brl: string;
  checkout_eu_ativo: boolean;
  checkout_br_ativo: boolean;
  capa_url: string;
  publicado: boolean;
  tem_certificado: boolean;
  certificado_tipo: string;
  certificado_titulo: string;
  horas_certificado: string;
  certificado_pronto_path: string;
  certificado_modelo_path: string;
  tem_manual_geral: boolean;
  modo_acesso_14_dias: string;
  usa_comissao_override: boolean;
  comissao_percentual_override: string;
  edicao_limitada: boolean;
  limite_vagas: string;
};

export default function CursoGestaoFormadorPage() {
  const router = useRouter();
  const params = useParams<{ cursoId: string }>();
  const cursoId = Number(params?.cursoId || 0);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingCapa, setUploadingCapa] = useState(false);
  const [uploadingCertificadoPronto, setUploadingCertificadoPronto] =
    useState(false);
  const [uploadingModeloCertificado, setUploadingModeloCertificado] =
    useState(false);
  const [deletingCurso, setDeletingCurso] = useState(false);

  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  const [formador, setFormador] = useState<Formador | null>(null);
  const [curso, setCurso] = useState<Curso | null>(null);
  const [comunidade, setComunidade] = useState<Comunidade | null>(null);
  const [totalModulos, setTotalModulos] = useState(0);
  const [totalAulas, setTotalAulas] = useState(0);

  const [form, setForm] = useState<CursoForm>({
    titulo: "",
    descricao: "",
    tipo_produto: "curso_video",
    preco: "",
    preco_eur: "",
    preco_brl: "",
    checkout_eu_ativo: true,
    checkout_br_ativo: false,
    capa_url: "",
    publicado: false,
    tem_certificado: false,
    certificado_tipo: "upload_pronto",
    certificado_titulo: "",
    horas_certificado: "",
    certificado_pronto_path: "",
    certificado_modelo_path: "",
    tem_manual_geral: false,
    modo_acesso_14_dias: "sem_acesso_ate_renuncia",
    usa_comissao_override: false,
    comissao_percentual_override: "",
    edicao_limitada: false,
    limite_vagas: "",
  });

  useEffect(() => {
    carregarDados();
  }, [cursoId]);

  const isCursoVideo = useMemo(
    () => form.tipo_produto === "curso_video",
    [form.tipo_produto]
  );

  const isPdfDigital = useMemo(
    () => form.tipo_produto === "pdf_digital",
    [form.tipo_produto]
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
    uploadingCapa || uploadingCertificadoPronto || uploadingModeloCertificado;

  async function carregarDados() {
    setLoading(true);
    setErro("");
    setSucesso("");

    try {
      if (!cursoId || Number.isNaN(cursoId)) {
        setErro("Curso inválido.");
        setLoading(false);
        return;
      }

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setErro("Não foi possível validar a sessão do formador.");
        setLoading(false);
        return;
      }

      const { data: formadorData, error: formadorError } = await supabase
        .from("formadores")
        .select("id, nome, auth_id, status")
        .eq("auth_id", user.id)
        .single();

      if (formadorError || !formadorData) {
        setErro("Não foi possível encontrar o registo do formador.");
        setLoading(false);
        return;
      }

      if (formadorData.status !== "aprovado") {
        setErro("A conta de formador ainda não está aprovada.");
        setLoading(false);
        return;
      }

      setFormador(formadorData as Formador);

      const { data: cursoData, error: cursoError } = await supabase
        .from("cursos")
        .select(
          `
          id,
          titulo,
          descricao,
          tipo_produto,
          preco,
          preco_eur,
          preco_brl,
          checkout_eu_ativo,
          checkout_br_ativo,
          publicado,
          tem_certificado,
          modo_certificado,
          certificado_tipo,
          certificado_titulo,
          horas_certificado,
          certificado_pronto_path,
          certificado_modelo_path,
          tem_manual_geral,
          created_at,
          modo_acesso_14_dias,
          capa_url,
          usa_comissao_override,
          comissao_percentual_override,
          edicao_limitada,
          limite_vagas
        `
        )
        .eq("id", cursoId)
        .eq("formador_id", formadorData.id)
        .maybeSingle();

      if (cursoError) {
        throw cursoError;
      }

      if (!cursoData) {
        setErro("Curso não encontrado ou sem acesso para este formador.");
        setLoading(false);
        return;
      }

      const cursoAtual = cursoData as Curso;
      setCurso(cursoAtual);

      setForm({
        titulo: cursoAtual.titulo || "",
        descricao: cursoAtual.descricao || "",
        tipo_produto: cursoAtual.tipo_produto || "curso_video",
        preco:
          typeof cursoAtual.preco === "number" ? String(cursoAtual.preco) : "",
        preco_eur:
          typeof cursoAtual.preco_eur === "number"
            ? String(cursoAtual.preco_eur)
            : typeof cursoAtual.preco === "number"
            ? String(cursoAtual.preco)
            : "",
        preco_brl:
          typeof cursoAtual.preco_brl === "number"
            ? String(cursoAtual.preco_brl)
            : "",
        checkout_eu_ativo: cursoAtual.checkout_eu_ativo ?? true,
        checkout_br_ativo: cursoAtual.checkout_br_ativo ?? false,
        capa_url: cursoAtual.capa_url || "",
        publicado: !!cursoAtual.publicado,
        tem_certificado: !!cursoAtual.tem_certificado,
        certificado_tipo: cursoAtual.certificado_tipo || "upload_pronto",
        certificado_titulo: cursoAtual.certificado_titulo || "",
        horas_certificado: cursoAtual.horas_certificado || "",
        certificado_pronto_path: cursoAtual.certificado_pronto_path || "",
        certificado_modelo_path: cursoAtual.certificado_modelo_path || "",
        tem_manual_geral: !!cursoAtual.tem_manual_geral,
        modo_acesso_14_dias:
          cursoAtual.modo_acesso_14_dias || "sem_acesso_ate_renuncia",
        usa_comissao_override: !!cursoAtual.usa_comissao_override,
        comissao_percentual_override:
          typeof cursoAtual.comissao_percentual_override === "number"
            ? String(cursoAtual.comissao_percentual_override)
            : "",
        edicao_limitada: !!cursoAtual.edicao_limitada,
        limite_vagas:
          typeof cursoAtual.limite_vagas === "number"
            ? String(cursoAtual.limite_vagas)
            : "",
      });

      const [
        { data: comunidadeData },
        { count: modulosCount },
        { count: aulasCount },
      ] = await Promise.all([
        supabase
          .from("comunidades")
          .select("id, curso_id, titulo, ativa")
          .eq("curso_id", cursoId)
          .maybeSingle(),
        supabase
          .from("modulos")
          .select("*", { count: "exact", head: true })
          .eq("curso_id", cursoId),
        supabase
          .from("aulas")
          .select("*", { count: "exact", head: true })
          .eq("curso_id", cursoId),
      ]);

      setComunidade((comunidadeData as Comunidade | null) || null);
      setTotalModulos(modulosCount || 0);
      setTotalAulas(aulasCount || 0);
    } catch (error: any) {
      setErro(
        error?.message || "Ocorreu um erro inesperado ao carregar o curso."
      );
    } finally {
      setLoading(false);
    }
  }

  function update<K extends keyof CursoForm>(field: K, value: CursoForm[K]) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function validarPrecoOpcional(valor: string, nome: string) {
    if (!valor.trim()) return "";

    const numero = Number(valor.replace(",", "."));

    if (Number.isNaN(numero) || numero < 0) {
      return `Indica um ${nome} válido.`;
    }

    return "";
  }

  function validar() {
    if (!form.titulo.trim()) return "Indica o título do conteúdo.";
    if (!form.descricao.trim()) return "Indica a descrição do conteúdo.";
    if (!form.tipo_produto.trim()) return "Indica o tipo de conteúdo.";

    const erroPrecoBase = validarPrecoOpcional(form.preco, "preço base");
    if (erroPrecoBase) return erroPrecoBase;

    const erroPrecoEur = validarPrecoOpcional(form.preco_eur, "preço EUR");
    if (erroPrecoEur) return erroPrecoEur;

    const erroPrecoBrl = validarPrecoOpcional(form.preco_brl, "preço BRL");
    if (erroPrecoBrl) return erroPrecoBrl;

    if (!form.preco.trim() && !form.preco_eur.trim() && !form.preco_brl.trim()) {
      return "Indica pelo menos um preço para o conteúdo.";
    }

    if (form.checkout_eu_ativo && !form.preco_eur.trim()) {
      return "Se o checkout EU estiver ativo, tens de indicar o preço EUR.";
    }

    if (form.checkout_br_ativo && !form.preco_brl.trim()) {
      return "Se o checkout BR estiver ativo, tens de indicar o preço BRL.";
    }

    if (!form.checkout_eu_ativo && !form.checkout_br_ativo) {
      return "Ativa pelo menos um checkout regional.";
    }

    if (!form.modo_acesso_14_dias.trim()) {
      return "Indica a configuração do prazo legal de 14 dias.";
    }

    if (form.tem_certificado) {
      if (!form.certificado_tipo.trim()) {
        return "Indica como queres disponibilizar o certificado.";
      }

      if (usaUploadPronto && !form.certificado_pronto_path.trim()) {
        return "Faz o upload do certificado próprio já pronto.";
      }

      if (usaModeloPersonalizado && !form.certificado_modelo_path.trim()) {
        return "Faz o upload do modelo base do certificado.";
      }
    }

    if (form.usa_comissao_override) {
      const percentagem = Number(
        form.comissao_percentual_override.replace(",", ".")
      );

      if (Number.isNaN(percentagem) || percentagem < 0 || percentagem > 100) {
        return "A comissão override tem de estar entre 0 e 100.";
      }
    }

    if (form.edicao_limitada) {
      const limite = Number(form.limite_vagas);
      if (Number.isNaN(limite) || limite < 1 || !Number.isInteger(limite)) {
        return "O limite de vagas tem de ser um número inteiro válido.";
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
        setSucesso("Certificado próprio carregado com sucesso.");
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

  async function guardarCurso(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErro("");
    setSucesso("");

    const validacao = validar();
    if (validacao) {
      setErro(validacao);
      return;
    }

    try {
      setSaving(true);

      const precoNumero = form.preco.trim()
        ? Number(form.preco.replace(",", "."))
        : null;

      const precoEurNumero = form.preco_eur.trim()
        ? Number(form.preco_eur.replace(",", "."))
        : null;

      const precoBrlNumero = form.preco_brl.trim()
        ? Number(form.preco_brl.replace(",", "."))
        : null;

      const payload = {
        titulo: form.titulo.trim(),
        descricao: form.descricao.trim(),
        tipo_produto: form.tipo_produto,
        preco: precoNumero,
        preco_eur: precoEurNumero,
        preco_brl: precoBrlNumero,
        checkout_eu_ativo: form.checkout_eu_ativo,
        checkout_br_ativo: form.checkout_br_ativo,
        capa_url: form.capa_url.trim() || null,
        publicado: form.publicado,
        modo_acesso_14_dias: form.modo_acesso_14_dias,
        dias_prazo_legal: 14,
        tem_certificado: form.tem_certificado,
        modo_certificado: form.tem_certificado ? "manual" : null,
        certificado_tipo: form.tem_certificado ? form.certificado_tipo : null,
        certificado_titulo: form.tem_certificado
          ? form.certificado_titulo.trim() || form.titulo.trim()
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
        usa_comissao_override: form.usa_comissao_override,
        comissao_percentual_override: form.usa_comissao_override
          ? Number(form.comissao_percentual_override.replace(",", "."))
          : null,
        edicao_limitada: form.edicao_limitada,
        limite_vagas: form.edicao_limitada ? Number(form.limite_vagas) : null,
      };

      const { error } = await supabase
        .from("cursos")
        .update(payload)
        .eq("id", cursoId);

      if (error) {
        throw error;
      }

      setSucesso("Curso atualizado com sucesso.");
      await carregarDados();
    } catch (error: any) {
      setErro(error?.message || "Não foi possível guardar o curso.");
    } finally {
      setSaving(false);
    }
  }

  async function apagarCurso() {
    if (!curso) return;

    const confirmou = window.confirm(
      "Tens a certeza que queres apagar este conteúdo? Esta ação é irreversível."
    );

    if (!confirmou) return;

    try {
      setDeletingCurso(true);
      setErro("");
      setSucesso("");

      const { error } = await supabase.from("cursos").delete().eq("id", curso.id);

      if (error) {
        throw error;
      }

      router.push("/formadores/cursos");
    } catch (error: any) {
      setErro(error?.message || "Não foi possível apagar o curso.");
    } finally {
      setDeletingCurso(false);
    }
  }

  if (loading) {
    return (
      <main style={main}>
        <section style={container}>
          <BoxEstado texto="A carregar gestão do curso..." />
        </section>
      </main>
    );
  }

  return (
    <main style={main}>
      <section style={container}>
        {erro ? <BoxErro texto={erro} /> : null}
        {sucesso ? <BoxSucesso texto={sucesso} /> : null}

        {!curso ? (
          <BoxEstado texto="Curso não encontrado." />
        ) : (
          <>
            <header style={hero}>
              <div style={{ display: "grid", gap: "10px" }}>
                <p style={kicker}>Área do Formador</p>
                <h1 style={titulo}>{curso.titulo || "Curso sem título"}</h1>
                <p style={descricao}>
                  Gestão principal do conteúdo, incluindo dados gerais,
                  publicação, certificado, capa, comissão, edição limitada e
                  preços regionais.
                </p>
              </div>

              <div style={acoesHero}>
                <Link href="/formadores/cursos" style={botaoSecundario}>
                  Voltar aos cursos
                </Link>

                <Link
                  href={`/formadores/cursos/${curso.id}/estrutura`}
                  style={botao}
                >
                  Gerir estrutura
                </Link>
              </div>
            </header>

            <section
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: "18px",
              }}
            >
              <MetricCard
                titulo="Estado"
                valor={form.publicado ? "Publicado" : "Rascunho"}
                subtitulo="Situação atual"
              />
              <MetricCard
                titulo="Tipo"
                valor={traduzirTipoProduto(form.tipo_produto)}
                subtitulo="Formato do conteúdo"
              />
              <MetricCard
                titulo="Módulos"
                valor={String(totalModulos)}
                subtitulo="Estrutura atual"
              />
              <MetricCard
                titulo="Aulas"
                valor={String(totalAulas)}
                subtitulo="Conteúdo registado"
              />
              <MetricCard
                titulo="Comunidade"
                valor={comunidade ? "Sim" : "Não"}
                subtitulo="Ligação interna"
              />
            </section>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "minmax(0, 1.1fr) minmax(320px, 0.9fr)",
                gap: "24px",
                alignItems: "start",
              }}
            >
              <form onSubmit={guardarCurso} style={cardGrande}>
                <div style={secaoHeader}>
                  <div>
                    <p style={miniKicker}>Dados do conteúdo</p>
                    <h2 style={secaoTitulo}>Gestão principal</h2>
                  </div>

                  <button
                    type="submit"
                    disabled={saving || algumUploadAtivo}
                    style={{
                      ...botao,
                      opacity: saving || algumUploadAtivo ? 0.7 : 1,
                      cursor:
                        saving || algumUploadAtivo ? "not-allowed" : "pointer",
                    }}
                  >
                    {uploadingCapa
                      ? "A carregar capa..."
                      : uploadingCertificadoPronto
                      ? "A carregar certificado..."
                      : uploadingModeloCertificado
                      ? "A carregar modelo..."
                      : saving
                      ? "Guardar..."
                      : "Guardar curso"}
                  </button>
                </div>

                <div style={lista}>
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
                    placeholder="Título do curso"
                  />

                  <Textarea
                    label="Descrição"
                    value={form.descricao}
                    onChange={(v) => update("descricao", v)}
                    rows={7}
                    placeholder="Descrição do conteúdo"
                  />

                  <div style={caixaInterna}>
                    <h3 style={subTitulo}>Preços e checkouts por região</h3>

                    <div style={grid2}>
                      <Input
                        label="Preço base"
                        value={form.preco}
                        onChange={(v) => update("preco", v)}
                        placeholder="Opcional. Campo legado/base"
                      />

                      <div style={infoMiniBox}>
                        <p style={infoMiniLabel}>Lógica regional</p>
                        <p style={infoMiniValue}>
                          O checkout EU usa o preço EUR. O checkout BR usa o
                          preço BRL.
                        </p>
                      </div>
                    </div>

                    <div style={grid2}>
                      <Input
                        label="Preço EUR"
                        value={form.preco_eur}
                        onChange={(v) => update("preco_eur", v)}
                        placeholder="Ex.: 97"
                      />

                      <Input
                        label="Preço BRL"
                        value={form.preco_brl}
                        onChange={(v) => update("preco_brl", v)}
                        placeholder="Ex.: 497"
                      />
                    </div>

                    <div style={grid2}>
                      <label style={checkboxLinha}>
                        <input
                          type="checkbox"
                          checked={form.checkout_eu_ativo}
                          onChange={(e) =>
                            update("checkout_eu_ativo", e.target.checked)
                          }
                          style={{ accentColor: "#a6783d" }}
                        />
                        <span>Checkout EU ativo</span>
                      </label>

                      <label style={checkboxLinha}>
                        <input
                          type="checkbox"
                          checked={form.checkout_br_ativo}
                          onChange={(e) =>
                            update("checkout_br_ativo", e.target.checked)
                          }
                          style={{ accentColor: "#a6783d" }}
                        />
                        <span>Checkout BR ativo</span>
                      </label>
                    </div>

                    <p style={textoAjuda}>
                      Se ativares um checkout regional, tens de preencher o preço
                      correspondente. A validação final do checkout deve ser feita
                      no backend, com base na região da conta do aluno.
                    </p>
                  </div>

                  <div style={grid2}>
                    <SelectField
                      label="Prazo legal de 14 dias"
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
                  </div>

                  <div style={caixaInterna}>
                    <h3 style={subTitulo}>Publicação e disponibilidade</h3>

                    <div style={grid2}>
                      <label style={checkboxLinha}>
                        <input
                          type="checkbox"
                          checked={form.publicado}
                          onChange={(e) => update("publicado", e.target.checked)}
                          style={{ accentColor: "#a6783d" }}
                        />
                        <span>Conteúdo publicado</span>
                      </label>

                      {isCursoVideo ? (
                        <label style={checkboxLinha}>
                          <input
                            type="checkbox"
                            checked={form.tem_manual_geral}
                            onChange={(e) =>
                              update("tem_manual_geral", e.target.checked)
                            }
                            style={{ accentColor: "#a6783d" }}
                          />
                          <span>Tem manual geral</span>
                        </label>
                      ) : (
                        <div />
                      )}
                    </div>
                  </div>

                  <div style={caixaInterna}>
                    <h3 style={subTitulo}>Capa</h3>

                    <label style={labelFixa}>Upload da capa</label>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        handleUploadCapa(e.target.files?.[0] || null)
                      }
                      style={{ ...campoBase, padding: "12px" }}
                    />

                    <p style={textoAjuda}>
                      Formatos aceites: JPG, PNG ou WEBP. Máximo: 5 MB.
                    </p>

                    {form.capa_url ? (
                      <div style={{ marginTop: "16px" }}>
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

                  <div style={caixaInterna}>
                    <h3 style={subTitulo}>Certificado</h3>

                    <label style={checkboxLinha}>
                      <input
                        type="checkbox"
                        checked={form.tem_certificado}
                        onChange={(e) =>
                          update("tem_certificado", e.target.checked)
                        }
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
                          label="Como queres disponibilizar o certificado?"
                          value={form.certificado_tipo}
                          onChange={(v) => update("certificado_tipo", v)}
                          options={[
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

                        {usaUploadPronto ? (
                          <div style={caixaUploadSecundaria}>
                            <label style={labelFixa}>
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
                              style={{ ...campoBase, padding: "12px" }}
                            />

                            {form.certificado_pronto_path ? (
                              <p style={textoAjuda}>
                                Ficheiro carregado:{" "}
                                <strong>{form.certificado_pronto_path}</strong>
                              </p>
                            ) : null}
                          </div>
                        ) : null}

                        {usaModeloPersonalizado ? (
                          <div style={caixaUploadSecundaria}>
                            <label style={labelFixa}>
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
                              style={{ ...campoBase, padding: "12px" }}
                            />

                            {form.certificado_modelo_path ? (
                              <p style={textoAjuda}>
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
                    <h3 style={subTitulo}>Comissão override</h3>

                    <label style={checkboxLinha}>
                      <input
                        type="checkbox"
                        checked={form.usa_comissao_override}
                        onChange={(e) =>
                          update("usa_comissao_override", e.target.checked)
                        }
                        style={{ accentColor: "#a6783d" }}
                      />
                      <span>Usar comissão específica neste conteúdo</span>
                    </label>

                    {form.usa_comissao_override ? (
                      <div style={{ marginTop: "16px" }}>
                        <Input
                          label="Percentagem de comissão override"
                          value={form.comissao_percentual_override}
                          onChange={(v) =>
                            update("comissao_percentual_override", v)
                          }
                          placeholder="Ex.: 0, 10, 20, 30"
                        />
                      </div>
                    ) : null}
                  </div>

                  <div style={caixaInterna}>
                    <h3 style={subTitulo}>Edição limitada</h3>

                    <label style={checkboxLinha}>
                      <input
                        type="checkbox"
                        checked={form.edicao_limitada}
                        onChange={(e) =>
                          update("edicao_limitada", e.target.checked)
                        }
                        style={{ accentColor: "#a6783d" }}
                      />
                      <span>Este conteúdo tem vagas limitadas</span>
                    </label>

                    {form.edicao_limitada ? (
                      <div style={{ marginTop: "16px" }}>
                        <Input
                          label="Limite de vagas"
                          value={form.limite_vagas}
                          onChange={(v) => update("limite_vagas", v)}
                          placeholder="Ex.: 12"
                        />
                      </div>
                    ) : null}
                  </div>
                </div>
              </form>

              <aside style={cardGrande}>
                <div>
                  <p style={miniKicker}>Resumo interno</p>
                  <h2 style={secaoTitulo}>Estado do conteúdo</h2>
                </div>

                <div style={lista}>
                  <InfoMini
                    label="Tipo"
                    valor={traduzirTipoProduto(form.tipo_produto)}
                  />
                  <InfoMini
                    label="Preço EUR"
                    valor={
                      form.preco_eur
                        ? `${Number(form.preco_eur.replace(",", ".")).toFixed(2)} €`
                        : "Sem preço EUR"
                    }
                  />
                  <InfoMini
                    label="Preço BRL"
                    valor={
                      form.preco_brl
                        ? `${Number(form.preco_brl.replace(",", ".")).toFixed(2)} R$`
                        : "Sem preço BRL"
                    }
                  />
                  <InfoMini
                    label="Checkout EU"
                    valor={form.checkout_eu_ativo ? "Ativo" : "Inativo"}
                  />
                  <InfoMini
                    label="Checkout BR"
                    valor={form.checkout_br_ativo ? "Ativo" : "Inativo"}
                  />
                  <InfoMini
                    label="Publicação"
                    valor={form.publicado ? "Publicado" : "Rascunho"}
                  />
                  <InfoMini
                    label="Certificado"
                    valor={form.tem_certificado ? "Sim" : "Não"}
                  />
                  <InfoMini
                    label="Comunidade"
                    valor={comunidade ? "Ligada" : "Sem comunidade"}
                  />
                  <InfoMini
                    label="Criado em"
                    valor={
                      curso.created_at
                        ? new Date(curso.created_at).toLocaleDateString("pt-PT")
                        : "Data indisponível"
                    }
                  />
                </div>

                <div style={caixaInterna}>
                  <h3 style={subTitulo}>Estrutura pedagógica</h3>
                  <p style={textoAjuda}>
                    A gestão de módulos, aulas, conteúdo público e conteúdo
                    pré-renúncia passou para uma área própria.
                  </p>

                  <div
                    style={{
                      marginTop: "14px",
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "12px",
                    }}
                  >
                    <Link
                      href={`/formadores/cursos/${curso.id}/estrutura`}
                      style={botao}
                    >
                      Abrir estrutura
                    </Link>
                  </div>
                </div>

                <div style={caixaInterna}>
                  <h3 style={subTitulo}>Zona crítica</h3>
                  <p style={textoAjuda}>
                    Usa esta ação apenas quando tiveres a certeza. Apagar o
                    conteúdo é irreversível.
                  </p>

                  <div
                    style={{
                      marginTop: "14px",
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "12px",
                    }}
                  >
                    <button
                      type="button"
                      onClick={apagarCurso}
                      disabled={deletingCurso}
                      style={{
                        ...botaoPerigo,
                        opacity: deletingCurso ? 0.7 : 1,
                        cursor: deletingCurso ? "not-allowed" : "pointer",
                      }}
                    >
                      {deletingCurso ? "A apagar..." : "Apagar conteúdo"}
                    </button>
                  </div>
                </div>
              </aside>
            </div>
          </>
        )}
      </section>
    </main>
  );
}

function traduzirTipoProduto(tipo: string | null) {
  if (tipo === "curso_video") return "Curso em vídeo";
  if (tipo === "pdf_digital") return "PDF digital";
  return "Conteúdo";
}

function BoxEstado({ texto }: { texto: string }) {
  return <section style={estadoBox}>{texto}</section>;
}

function BoxErro({ texto }: { texto: string }) {
  return <section style={erroBox}>{texto}</section>;
}

function BoxSucesso({ texto }: { texto: string }) {
  return <section style={sucessoBox}>{texto}</section>;
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
      <label style={labelFixa}>{label}</label>
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
      <label style={labelFixa}>{label}</label>
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
      <label style={labelFixa}>{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={campoBase}
      >
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
            style={{ background: "#1a100c", color: "#e6c27a" }}
          >
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function MetricCard({
  titulo,
  valor,
  subtitulo,
}: {
  titulo: string;
  valor: string;
  subtitulo: string;
}) {
  return (
    <article
      style={{
        border: "1px solid #8a5d31",
        background:
          "linear-gradient(180deg, rgba(20,13,9,0.98) 0%, rgba(16,10,8,0.98) 100%)",
        padding: "22px",
        boxShadow:
          "0 12px 26px rgba(0,0,0,0.16), inset 0 1px 0 rgba(255,225,170,0.03)",
      }}
    >
      <p style={metricLabel}>{titulo}</p>
      <p style={metricValue}>{valor}</p>
      <p style={metricText}>{subtitulo}</p>
    </article>
  );
}

function InfoMini({
  label,
  valor,
}: {
  label: string;
  valor: string;
}) {
  return (
    <div
      style={{
        border: "1px solid rgba(166,120,61,0.16)",
        background: "rgba(20,13,9,0.5)",
        padding: "16px 18px",
      }}
    >
      <p style={infoMiniLabel}>{label}</p>
      <p style={infoMiniValue}>{valor}</p>
    </div>
  );
}

const main: React.CSSProperties = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at top, rgba(166,120,61,0.08), transparent 20%), #2b160f",
  color: "#e6c27a",
  fontFamily: "Cormorant Garamond, serif",
  padding: "40px 16px 90px",
};

const container: React.CSSProperties = {
  maxWidth: "1280px",
  margin: "0 auto",
  display: "grid",
  gap: "24px",
};

const hero: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-end",
  gap: "18px",
  flexWrap: "wrap",
};

const kicker: React.CSSProperties = {
  margin: 0,
  fontSize: "14px",
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  color: "#caa15a",
};

const titulo: React.CSSProperties = {
  margin: 0,
  fontFamily: "Cinzel, serif",
  fontSize: "clamp(34px, 5vw, 52px)",
  color: "#f0d79a",
  lineHeight: 1.1,
  fontWeight: 500,
};

const descricao: React.CSSProperties = {
  margin: 0,
  color: "#d7b06c",
  fontSize: "clamp(18px, 2.2vw, 22px)",
  lineHeight: 1.7,
  maxWidth: "920px",
};

const acoesHero: React.CSSProperties = {
  display: "flex",
  gap: "12px",
  flexWrap: "wrap",
};

const cardGrande: React.CSSProperties = {
  border: "1px solid #8a5d31",
  background:
    "linear-gradient(180deg, rgba(20,13,9,0.98) 0%, rgba(16,10,8,0.98) 100%)",
  padding: "24px",
  boxShadow:
    "0 12px 26px rgba(0,0,0,0.16), inset 0 1px 0 rgba(255,225,170,0.03)",
  display: "grid",
  gap: "18px",
};

const secaoHeader: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-end",
  gap: "18px",
  flexWrap: "wrap",
};

const miniKicker: React.CSSProperties = {
  margin: "0 0 8px 0",
  fontSize: "13px",
  color: "#caa15a",
  textTransform: "uppercase",
  letterSpacing: "0.12em",
};

const secaoTitulo: React.CSSProperties = {
  margin: 0,
  fontFamily: "Cinzel, serif",
  fontSize: "clamp(26px, 4vw, 36px)",
  color: "#f0d79a",
  fontWeight: 500,
};

const grid2: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
  gap: "16px",
};

const lista: React.CSSProperties = {
  display: "grid",
  gap: "16px",
};

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

const labelFixa: React.CSSProperties = {
  display: "block",
  fontSize: "19px",
  marginBottom: "8px",
  color: "#e6c27a",
};

const estadoBox: React.CSSProperties = {
  border: "1px solid #8a5d31",
  background:
    "linear-gradient(180deg, rgba(20,13,9,0.98) 0%, rgba(16,10,8,0.98) 100%)",
  padding: "28px",
  textAlign: "center",
  color: "#d7b06c",
  fontSize: "21px",
  lineHeight: 1.7,
};

const erroBox: React.CSSProperties = {
  border: "1px solid rgba(255,107,107,0.35)",
  background: "rgba(120,20,20,0.12)",
  padding: "18px 20px",
  color: "#ffb4b4",
  fontSize: "18px",
  lineHeight: 1.7,
};

const sucessoBox: React.CSSProperties = {
  border: "1px solid rgba(74,222,128,0.35)",
  background: "rgba(20,90,40,0.12)",
  padding: "18px 20px",
  color: "#bff1bf",
  fontSize: "18px",
  lineHeight: 1.7,
};

const metricLabel: React.CSSProperties = {
  margin: "0 0 10px 0",
  fontSize: "15px",
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  color: "#caa15a",
};

const metricValue: React.CSSProperties = {
  margin: "0 0 8px 0",
  fontFamily: "Cinzel, serif",
  fontSize: "30px",
  color: "#f0d79a",
  lineHeight: 1.2,
  wordBreak: "break-word",
};

const metricText: React.CSSProperties = {
  margin: 0,
  fontSize: "18px",
  color: "#d7b06c",
  lineHeight: 1.6,
};

const infoMiniLabel: React.CSSProperties = {
  margin: "0 0 8px 0",
  fontSize: "15px",
  color: "#caa15a",
  textTransform: "uppercase",
  letterSpacing: "1px",
};

const infoMiniValue: React.CSSProperties = {
  margin: 0,
  fontSize: "20px",
  color: "#d7b06c",
  lineHeight: 1.6,
};

const infoMiniBox: React.CSSProperties = {
  border: "1px solid rgba(166,120,61,0.16)",
  background: "rgba(20,13,9,0.5)",
  padding: "16px 18px",
};

const botao: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  textDecoration: "none",
  border: "1px solid #c4914d",
  padding: "13px 18px",
  background: "linear-gradient(180deg, #c4914d 0%, #a6783d 100%)",
  color: "#140d09",
  fontSize: "16px",
  fontWeight: 700,
  minHeight: "46px",
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
  minHeight: "46px",
};

const botaoPerigo: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  border: "1px solid rgba(255,107,107,0.5)",
  background: "rgba(120,20,20,0.2)",
  color: "#ffb4b4",
  padding: "13px 18px",
  fontSize: "16px",
  minHeight: "46px",
};