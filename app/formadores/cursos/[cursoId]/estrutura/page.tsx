"use client";

import Link from "next/link";
import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
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
  publicado: boolean | null;
  tem_certificado: boolean | null;
  modo_certificado: string | null;
  certificado_tipo?: string | null;
  tem_manual_geral: boolean | null;
  created_at: string | null;
  modo_acesso_14_dias?: string | null;
};

type Modulo = {
  id: number;
  curso_id: number;
  titulo: string | null;
  ordem: number | null;
  liberado_pre_renuncia: boolean | null;
};

type Aula = {
  id: number;
  curso_id: number;
  modulo_id: number | null;
  titulo: string | null;
  video_url: string | null;
  ordem: number | null;
  created_at: string | null;
  publica: boolean | null;
  liberada_pre_renuncia: boolean | null;
};

export default function EstruturaCursoFormadorPage() {
  const params = useParams<{ cursoId: string }>();
  const cursoId = Number(params?.cursoId || 0);

  const [loading, setLoading] = useState(true);
  const [savingCurso, setSavingCurso] = useState(false);
  const [savingModuloId, setSavingModuloId] = useState<number | null>(null);
  const [savingAulaId, setSavingAulaId] = useState<number | null>(null);
  const [creatingModulo, setCreatingModulo] = useState(false);
  const [creatingAula, setCreatingAula] = useState(false);
  const [uploadingNovaAula, setUploadingNovaAula] = useState(false);
  const [uploadingVideoAulaId, setUploadingVideoAulaId] = useState<number | null>(null);
  const [removingVideoAulaId, setRemovingVideoAulaId] = useState<number | null>(null);
  const [deletingAulaId, setDeletingAulaId] = useState<number | null>(null);

  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  const [formador, setFormador] = useState<Formador | null>(null);
  const [curso, setCurso] = useState<Curso | null>(null);
  const [modulos, setModulos] = useState<Modulo[]>([]);
  const [aulas, setAulas] = useState<Aula[]>([]);

  const [tituloNovoModulo, setTituloNovoModulo] = useState("");

  const [novaAulaTitulo, setNovaAulaTitulo] = useState("");
  const [novaAulaModuloId, setNovaAulaModuloId] = useState("");
  const [novaAulaPublica, setNovaAulaPublica] = useState(false);
  const [novaAulaPreRenuncia, setNovaAulaPreRenuncia] = useState(false);
  const [novoVideoFicheiro, setNovoVideoFicheiro] = useState<File | null>(null);

  const [aulaVideoFiles, setAulaVideoFiles] = useState<Record<number, File | null>>({});

  useEffect(() => {
    carregarDados();
  }, [cursoId]);

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
          "id, titulo, descricao, tipo_produto, preco, publicado, tem_certificado, modo_certificado, certificado_tipo, tem_manual_geral, created_at, modo_acesso_14_dias"
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

      setCurso(cursoData as Curso);

      const { data: modulosData, error: modulosError } = await supabase
        .from("modulos")
        .select("id, curso_id, titulo, ordem, liberado_pre_renuncia")
        .eq("curso_id", cursoId)
        .order("ordem", { ascending: true });

      if (modulosError) {
        throw modulosError;
      }

      setModulos((modulosData || []) as Modulo[]);

      const { data: aulasData, error: aulasError } = await supabase
        .from("aulas")
        .select(
          "id, curso_id, modulo_id, titulo, video_url, ordem, created_at, publica, liberada_pre_renuncia"
        )
        .eq("curso_id", cursoId)
        .order("ordem", { ascending: true });

      if (aulasError) {
        throw aulasError;
      }

      setAulas((aulasData || []) as Aula[]);
    } catch (error: any) {
      setErro(error?.message || "Ocorreu um erro inesperado ao carregar o curso.");
    } finally {
      setLoading(false);
    }
  }

  async function guardarCurso14Dias() {
    if (!curso) return;

    try {
      setErro("");
      setSucesso("");
      setSavingCurso(true);

      const { error } = await supabase
        .from("cursos")
        .update({
          modo_acesso_14_dias:
            curso.modo_acesso_14_dias || "sem_acesso_ate_renuncia",
        })
        .eq("id", curso.id);

      if (error) throw error;

      setSucesso("Configuração dos 14 dias guardada com sucesso.");
    } catch (error: any) {
      setErro(error?.message || "Não foi possível guardar a configuração do curso.");
    } finally {
      setSavingCurso(false);
    }
  }

  async function criarModulo(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErro("");
    setSucesso("");

    const titulo = tituloNovoModulo.trim();

    if (!titulo) {
      setErro("Indica o título do módulo.");
      return;
    }

    try {
      setCreatingModulo(true);

      const ordem =
        modulos.length > 0
          ? Math.max(...modulos.map((m) => Number(m.ordem || 0))) + 1
          : 1;

      const { error } = await supabase.from("modulos").insert([
        {
          curso_id: cursoId,
          titulo,
          ordem,
          liberado_pre_renuncia: false,
        },
      ]);

      if (error) throw error;

      setTituloNovoModulo("");
      setSucesso("Módulo criado com sucesso.");
      await carregarDados();
    } catch (error: any) {
      setErro(error?.message || "Não foi possível criar o módulo.");
    } finally {
      setCreatingModulo(false);
    }
  }

  async function uploadParaBunny(aulaTitulo: string, file: File) {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      throw new Error("Não foi possível validar a sessão do formador.");
    }

    const body = new FormData();
    body.append("cursoId", String(cursoId));
    body.append("aulaTitulo", aulaTitulo);
    body.append("file", file);

    const response = await fetch("/api/formadores/bunny-upload", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
      body,
    });

    const json = await response.json();

    if (!response.ok) {
      throw new Error(json?.error || "Falha no upload para o Bunny.");
    }

    return json as { success: boolean; videoId: string; tituloVideo: string };
  }

  async function apagarVideoNoBunny(aulaId: number, apagarAula: boolean) {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      throw new Error("Não foi possível validar a sessão do formador.");
    }

    const response = await fetch("/api/formadores/bunny-delete", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        aulaId,
        apagarAula,
      }),
    });

    const json = await response.json();

    if (!response.ok) {
      throw new Error(json?.error || "Falha ao apagar no Bunny.");
    }

    return json as {
      success: boolean;
      apagouVideo: boolean;
      apagouAula: boolean;
    };
  }

  async function criarAula(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErro("");
    setSucesso("");

    const titulo = novaAulaTitulo.trim();

    if (!titulo) {
      setErro("Indica o título da aula.");
      return;
    }

    if (!novoVideoFicheiro) {
      setErro("Seleciona o vídeo da aula.");
      return;
    }

    try {
      setCreatingAula(true);
      setUploadingNovaAula(true);

      const bunnyData = await uploadParaBunny(titulo, novoVideoFicheiro);

      const ordem =
        aulas.length > 0
          ? Math.max(...aulas.map((a) => Number(a.ordem || 0))) + 1
          : 1;

      const { error } = await supabase.from("aulas").insert([
        {
          curso_id: cursoId,
          modulo_id: novaAulaModuloId ? Number(novaAulaModuloId) : null,
          titulo,
          video_url: bunnyData.videoId,
          ordem,
          publica: novaAulaPublica,
          liberada_pre_renuncia: novaAulaPreRenuncia,
        },
      ]);

      if (error) throw error;

      setNovaAulaTitulo("");
      setNovaAulaModuloId("");
      setNovaAulaPublica(false);
      setNovaAulaPreRenuncia(false);
      setNovoVideoFicheiro(null);

      setSucesso("Aula criada com sucesso e vídeo enviado para o Bunny.");
      await carregarDados();
    } catch (error: any) {
      setErro(error?.message || "Não foi possível criar a aula.");
    } finally {
      setCreatingAula(false);
      setUploadingNovaAula(false);
    }
  }

  async function guardarModulo(modulo: Modulo) {
    try {
      setErro("");
      setSucesso("");
      setSavingModuloId(modulo.id);

      const { error } = await supabase
        .from("modulos")
        .update({
          titulo: modulo.titulo?.trim() || null,
          ordem: Number(modulo.ordem || 0) || 1,
          liberado_pre_renuncia: !!modulo.liberado_pre_renuncia,
        })
        .eq("id", modulo.id);

      if (error) throw error;

      setSucesso(`Módulo "${modulo.titulo || "sem título"}" guardado com sucesso.`);
    } catch (error: any) {
      setErro(error?.message || "Não foi possível guardar o módulo.");
    } finally {
      setSavingModuloId(null);
    }
  }

  async function guardarAula(aula: Aula) {
    try {
      setErro("");
      setSucesso("");
      setSavingAulaId(aula.id);

      const { error } = await supabase
        .from("aulas")
        .update({
          titulo: aula.titulo?.trim() || null,
          ordem: Number(aula.ordem || 0) || 1,
          modulo_id: aula.modulo_id || null,
          publica: !!aula.publica,
          liberada_pre_renuncia: !!aula.liberada_pre_renuncia,
        })
        .eq("id", aula.id);

      if (error) throw error;

      setSucesso(`Aula "${aula.titulo || "sem título"}" guardada com sucesso.`);
    } catch (error: any) {
      setErro(error?.message || "Não foi possível guardar a aula.");
    } finally {
      setSavingAulaId(null);
    }
  }

  async function substituirVideoAula(aula: Aula) {
    const file = aulaVideoFiles[aula.id];

    if (!file) {
      setErro("Seleciona primeiro o novo vídeo da aula.");
      return;
    }

    try {
      setErro("");
      setSucesso("");
      setUploadingVideoAulaId(aula.id);

      const videoAntigo = aula.video_url;
      const bunnyData = await uploadParaBunny(aula.titulo || "Aula sem título", file);

      const { error } = await supabase
        .from("aulas")
        .update({
          video_url: bunnyData.videoId,
        })
        .eq("id", aula.id);

      if (error) throw error;

      if (videoAntigo) {
        try {
          await apagarVideoNoBunny(aula.id, false);
        } catch {
          // O novo já ficou ligado. Não rebentamos a operação só porque
          // o vídeo antigo falhou ao apagar.
        }
      }

      setAulaVideoFiles((prev) => ({ ...prev, [aula.id]: null }));
      setSucesso(`Vídeo da aula "${aula.titulo || "sem título"}" substituído com sucesso.`);
      await carregarDados();
    } catch (error: any) {
      setErro(error?.message || "Não foi possível substituir o vídeo.");
    } finally {
      setUploadingVideoAulaId(null);
    }
  }

  async function removerVideoDaAula(aula: Aula) {
    if (!aula.video_url) {
      setErro("Esta aula não tem vídeo associado.");
      return;
    }

    try {
      setErro("");
      setSucesso("");
      setRemovingVideoAulaId(aula.id);

      await apagarVideoNoBunny(aula.id, false);

      setSucesso(`Vídeo removido da aula "${aula.titulo || "sem título"}".`);
      await carregarDados();
    } catch (error: any) {
      setErro(error?.message || "Não foi possível remover o vídeo.");
    } finally {
      setRemovingVideoAulaId(null);
    }
  }

  async function apagarAula(aula: Aula) {
    try {
      setErro("");
      setSucesso("");
      setDeletingAulaId(aula.id);

      if (aula.video_url) {
        await apagarVideoNoBunny(aula.id, true);
      } else {
        const { error } = await supabase.from("aulas").delete().eq("id", aula.id);

        if (error) {
          throw error;
        }
      }

      setSucesso(`A aula "${aula.titulo || "sem título"}" foi apagada com sucesso.`);
      await carregarDados();
    } catch (error: any) {
      setErro(error?.message || "Não foi possível apagar a aula.");
    } finally {
      setDeletingAulaId(null);
    }
  }

  function atualizarModulo(
    id: number,
    campo: "titulo" | "ordem" | "liberado_pre_renuncia",
    valor: string | number | boolean
  ) {
    setModulos((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [campo]: valor } : item))
    );
  }

  function atualizarAula(
    id: number,
    campo:
      | "titulo"
      | "ordem"
      | "modulo_id"
      | "publica"
      | "liberada_pre_renuncia",
    valor: string | number | boolean | null
  ) {
    setAulas((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [campo]: valor } : item))
    );
  }

  const aulasComModulo = useMemo(() => {
    const mapaModulos = new Map<number, string>(
      modulos.map((modulo) => [modulo.id, modulo.titulo || "Módulo sem título"])
    );

    return aulas.map((aula) => ({
      ...aula,
      moduloTitulo: aula.modulo_id
        ? mapaModulos.get(aula.modulo_id) || null
        : null,
    }));
  }, [aulas, modulos]);

  if (loading) {
    return (
      <main style={main}>
        <section style={container}>
          <BoxEstado texto="A carregar estrutura do curso..." />
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
                  Gestão interna da estrutura do curso, incluindo módulos, aulas
                  e controlo do conteúdo disponível durante o prazo legal.
                </p>
              </div>

              <div style={acoesHero}>
                <Link href={`/formadores/cursos/${cursoId}`} style={botaoSecundario}>
                  Voltar ao conteúdo
                </Link>
              </div>
            </header>

            <section style={cardGrande}>
              <div style={secaoHeader}>
                <div>
                  <p style={miniKicker}>Prazo legal de 14 dias</p>
                  <h2 style={secaoTitulo}>Configuração do curso</h2>
                </div>

                <button
                  type="button"
                  onClick={guardarCurso14Dias}
                  disabled={savingCurso}
                  style={{
                    ...botao,
                    opacity: savingCurso ? 0.7 : 1,
                    cursor: savingCurso ? "not-allowed" : "pointer",
                  }}
                >
                  {savingCurso ? "Guardar..." : "Guardar configuração"}
                </button>
              </div>

              <div style={grid2}>
                <div>
                  <label style={label}>Modo de acesso durante os 14 dias</label>
                  <select
                    value={curso.modo_acesso_14_dias || "sem_acesso_ate_renuncia"}
                    onChange={(e) =>
                      setCurso((prev) =>
                        prev
                          ? { ...prev, modo_acesso_14_dias: e.target.value }
                          : prev
                      )
                    }
                    style={input}
                  >
                    <option value="sem_acesso_ate_renuncia">
                      Sem acesso até renúncia ou fim do prazo
                    </option>
                    <option value="acesso_modulo_1">
                      Permitir apenas o módulo 1
                    </option>
                    <option value="acesso_conteudo_marcado">
                      Permitir apenas conteúdo marcado
                    </option>
                  </select>
                </div>

                <div style={infoCard}>
                  <p style={infoLabel}>Resumo</p>
                  <p style={infoText}>
                    {curso.modo_acesso_14_dias === "sem_acesso_ate_renuncia"
                      ? "Enquanto o prazo legal estiver ativo, o aluno não vê aulas privadas. Só terá acesso integral após renúncia ou fim do prazo."
                      : curso.modo_acesso_14_dias === "acesso_modulo_1"
                      ? "Enquanto o prazo legal estiver ativo, o aluno vê apenas o primeiro módulo."
                      : "Enquanto o prazo legal estiver ativo, o aluno vê apenas módulos ou aulas marcados para acesso pré-renúncia."}
                  </p>
                </div>
              </div>
            </section>

            <section style={gridPrincipal}>
              <section style={cardGrande}>
                <div style={secaoHeader}>
                  <div>
                    <p style={miniKicker}>Módulos</p>
                    <h2 style={secaoTitulo}>Criar módulo</h2>
                  </div>
                </div>

                <form onSubmit={criarModulo} style={formGrid}>
                  <div>
                    <label style={label}>Título do módulo</label>
                    <input
                      value={tituloNovoModulo}
                      onChange={(e) => setTituloNovoModulo(e.target.value)}
                      style={input}
                      placeholder="Ex.: Módulo 1 — Introdução"
                    />
                  </div>

                  <div style={acoesFormulario}>
                    <button
                      type="submit"
                      disabled={creatingModulo}
                      style={{
                        ...botao,
                        opacity: creatingModulo ? 0.7 : 1,
                        cursor: creatingModulo ? "not-allowed" : "pointer",
                      }}
                    >
                      {creatingModulo ? "Criar..." : "Criar módulo"}
                    </button>
                  </div>
                </form>

                <div style={lista}>
                  {modulos.length === 0 ? (
                    <BoxEstadoInterno texto="Ainda não existem módulos neste curso." />
                  ) : (
                    modulos.map((modulo) => (
                      <article key={modulo.id} style={itemCard}>
                        <div style={grid3}>
                          <div>
                            <label style={label}>Título</label>
                            <input
                              value={modulo.titulo || ""}
                              onChange={(e) =>
                                atualizarModulo(modulo.id, "titulo", e.target.value)
                              }
                              style={input}
                            />
                          </div>

                          <div>
                            <label style={label}>Ordem</label>
                            <input
                              type="number"
                              min="1"
                              value={String(modulo.ordem ?? 1)}
                              onChange={(e) =>
                                atualizarModulo(
                                  modulo.id,
                                  "ordem",
                                  Number(e.target.value)
                                )
                              }
                              style={input}
                            />
                          </div>

                          <label style={checkboxLinha}>
                            <input
                              type="checkbox"
                              checked={!!modulo.liberado_pre_renuncia}
                              onChange={(e) =>
                                atualizarModulo(
                                  modulo.id,
                                  "liberado_pre_renuncia",
                                  e.target.checked
                                )
                              }
                              style={{ accentColor: "#a6783d" }}
                            />
                            <span>Disponível antes da renúncia</span>
                          </label>
                        </div>

                        <div style={itemAcoes}>
                          <button
                            type="button"
                            onClick={() => guardarModulo(modulo)}
                            disabled={savingModuloId === modulo.id}
                            style={{
                              ...botaoSecundario,
                              opacity: savingModuloId === modulo.id ? 0.7 : 1,
                              cursor:
                                savingModuloId === modulo.id
                                  ? "not-allowed"
                                  : "pointer",
                            }}
                          >
                            {savingModuloId === modulo.id ? "Guardar..." : "Guardar módulo"}
                          </button>
                        </div>
                      </article>
                    ))
                  )}
                </div>
              </section>

              <section style={cardGrande}>
                <div style={secaoHeader}>
                  <div>
                    <p style={miniKicker}>Aulas</p>
                    <h2 style={secaoTitulo}>Criar aula</h2>
                  </div>
                </div>

                <form onSubmit={criarAula} style={lista}>
                  <div style={grid2}>
                    <div>
                      <label style={label}>Título da aula</label>
                      <input
                        value={novaAulaTitulo}
                        onChange={(e) => setNovaAulaTitulo(e.target.value)}
                        style={input}
                        placeholder="Ex.: Aula de apresentação"
                      />
                    </div>

                    <div>
                      <label style={label}>Módulo</label>
                      <select
                        value={novaAulaModuloId}
                        onChange={(e) => setNovaAulaModuloId(e.target.value)}
                        style={input}
                      >
                        <option value="">Sem módulo associado</option>
                        {modulos.map((modulo) => (
                          <option key={modulo.id} value={modulo.id}>
                            {modulo.titulo || "Módulo sem título"}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label style={label}>Vídeo da aula</label>

                    <UploadField
                      buttonText={
                        uploadingNovaAula
                          ? "A enviar vídeo..."
                          : novoVideoFicheiro
                          ? novoVideoFicheiro.name
                          : "Selecionar vídeo"
                      }
                      accept="video/*"
                      onChange={(e) =>
                        setNovoVideoFicheiro(e.target.files?.[0] || null)
                      }
                      disabled={uploadingNovaAula || creatingAula}
                    />
                  </div>

                  <div style={grid2}>
                    <label style={checkboxLinha}>
                      <input
                        type="checkbox"
                        checked={novaAulaPublica}
                        onChange={(e) => setNovaAulaPublica(e.target.checked)}
                        style={{ accentColor: "#a6783d" }}
                      />
                      <span>Aula pública</span>
                    </label>

                    <label style={checkboxLinha}>
                      <input
                        type="checkbox"
                        checked={novaAulaPreRenuncia}
                        onChange={(e) =>
                          setNovaAulaPreRenuncia(e.target.checked)
                        }
                        style={{ accentColor: "#a6783d" }}
                      />
                      <span>Disponível antes da renúncia</span>
                    </label>
                  </div>

                  <div style={acoesFormulario}>
                    <button
                      type="submit"
                      disabled={creatingAula || uploadingNovaAula}
                      style={{
                        ...botao,
                        opacity: creatingAula || uploadingNovaAula ? 0.7 : 1,
                        cursor:
                          creatingAula || uploadingNovaAula
                            ? "not-allowed"
                            : "pointer",
                      }}
                    >
                      {uploadingNovaAula
                        ? "A enviar vídeo..."
                        : creatingAula
                        ? "Criar..."
                        : "Criar aula"}
                    </button>
                  </div>
                </form>

                <div style={lista}>
                  {aulasComModulo.length === 0 ? (
                    <BoxEstadoInterno texto="Ainda não existem aulas neste curso." />
                  ) : (
                    aulasComModulo.map((aula) => (
                      <article key={aula.id} style={itemCard}>
                        <div style={grid2}>
                          <div>
                            <label style={label}>Título</label>
                            <input
                              value={aula.titulo || ""}
                              onChange={(e) =>
                                atualizarAula(aula.id, "titulo", e.target.value)
                              }
                              style={input}
                            />
                          </div>

                          <div>
                            <label style={label}>Módulo</label>
                            <select
                              value={aula.modulo_id ? String(aula.modulo_id) : ""}
                              onChange={(e) =>
                                atualizarAula(
                                  aula.id,
                                  "modulo_id",
                                  e.target.value ? Number(e.target.value) : null
                                )
                              }
                              style={input}
                            >
                              <option value="">Sem módulo associado</option>
                              {modulos.map((modulo) => (
                                <option key={modulo.id} value={modulo.id}>
                                  {modulo.titulo || "Módulo sem título"}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div style={grid2}>
                          <div>
                            <label style={label}>Vídeo atualmente associado</label>
                            <div style={infoCard}>
                              <p style={infoLabel}>Bunny video ID</p>
                              <p style={infoText}>
                                {aula.video_url || "Sem vídeo associado"}
                              </p>
                            </div>
                          </div>

                          <div>
                            <label style={label}>Ordem</label>
                            <input
                              type="number"
                              min="1"
                              value={String(aula.ordem ?? 1)}
                              onChange={(e) =>
                                atualizarAula(
                                  aula.id,
                                  "ordem",
                                  Number(e.target.value)
                                )
                              }
                              style={input}
                            />
                          </div>
                        </div>

                        <div>
                          <label style={label}>Substituir vídeo</label>

                          <UploadField
                            buttonText={
                              uploadingVideoAulaId === aula.id
                                ? "A enviar vídeo..."
                                : aulaVideoFiles[aula.id]
                                ? aulaVideoFiles[aula.id]?.name || "Vídeo selecionado"
                                : "Selecionar novo vídeo"
                            }
                            accept="video/*"
                            onChange={(e) =>
                              setAulaVideoFiles((prev) => ({
                                ...prev,
                                [aula.id]: e.target.files?.[0] || null,
                              }))
                            }
                            disabled={uploadingVideoAulaId === aula.id}
                          />
                        </div>

                        <div style={grid2}>
                          <label style={checkboxLinha}>
                            <input
                              type="checkbox"
                              checked={!!aula.publica}
                              onChange={(e) =>
                                atualizarAula(aula.id, "publica", e.target.checked)
                              }
                              style={{ accentColor: "#a6783d" }}
                            />
                            <span>Aula pública</span>
                          </label>

                          <label style={checkboxLinha}>
                            <input
                              type="checkbox"
                              checked={!!aula.liberada_pre_renuncia}
                              onChange={(e) =>
                                atualizarAula(
                                  aula.id,
                                  "liberada_pre_renuncia",
                                  e.target.checked
                                )
                              }
                              style={{ accentColor: "#a6783d" }}
                            />
                            <span>Disponível antes da renúncia</span>
                          </label>
                        </div>

                        <div style={infoCard}>
                          <p style={infoLabel}>Estado atual</p>
                          <p style={infoText}>
                            {aula.publica
                              ? "Esta aula pode ser mostrada publicamente."
                              : aula.liberada_pre_renuncia
                              ? "Esta aula fica disponível a compradores durante o prazo legal."
                              : aula.moduloTitulo
                              ? `Esta aula pertence a "${aula.moduloTitulo}" e ficará sujeita às regras do módulo e do curso.`
                              : "Esta aula ficará sujeita apenas às regras gerais do curso."}
                          </p>
                        </div>

                        <div style={itemAcoes}>
                          <button
                            type="button"
                            onClick={() => substituirVideoAula(aula)}
                            disabled={uploadingVideoAulaId === aula.id}
                            style={{
                              ...botaoSecundario,
                              opacity: uploadingVideoAulaId === aula.id ? 0.7 : 1,
                              cursor:
                                uploadingVideoAulaId === aula.id
                                  ? "not-allowed"
                                  : "pointer",
                            }}
                          >
                            {uploadingVideoAulaId === aula.id
                              ? "A enviar..."
                              : "Substituir vídeo"}
                          </button>

                          <button
                            type="button"
                            onClick={() => removerVideoDaAula(aula)}
                            disabled={
                              removingVideoAulaId === aula.id || !aula.video_url
                            }
                            style={{
                              ...botaoSecundario,
                              opacity:
                                removingVideoAulaId === aula.id || !aula.video_url
                                  ? 0.7
                                  : 1,
                              cursor:
                                removingVideoAulaId === aula.id || !aula.video_url
                                  ? "not-allowed"
                                  : "pointer",
                            }}
                          >
                            {removingVideoAulaId === aula.id
                              ? "A remover..."
                              : "Remover vídeo"}
                          </button>

                          <button
                            type="button"
                            onClick={() => guardarAula(aula)}
                            disabled={savingAulaId === aula.id}
                            style={{
                              ...botaoSecundario,
                              opacity: savingAulaId === aula.id ? 0.7 : 1,
                              cursor:
                                savingAulaId === aula.id
                                  ? "not-allowed"
                                  : "pointer",
                            }}
                          >
                            {savingAulaId === aula.id ? "Guardar..." : "Guardar aula"}
                          </button>

                          <button
                            type="button"
                            onClick={() => apagarAula(aula)}
                            disabled={deletingAulaId === aula.id}
                            style={{
                              ...botaoSecundario,
                              opacity: deletingAulaId === aula.id ? 0.7 : 1,
                              cursor:
                                deletingAulaId === aula.id
                                  ? "not-allowed"
                                  : "pointer",
                            }}
                          >
                            {deletingAulaId === aula.id ? "A apagar..." : "Apagar aula"}
                          </button>
                        </div>
                      </article>
                    ))
                  )}
                </div>
              </section>
            </section>
          </>
        )}
      </section>
    </main>
  );
}

function UploadField({
  buttonText,
  accept,
  onChange,
  disabled,
}: {
  buttonText: string;
  accept: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
}) {
  return (
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
        width: "fit-content",
        maxWidth: "100%",
        wordBreak: "break-word",
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
  );
}

function BoxEstado({ texto }: { texto: string }) {
  return <section style={estadoBox}>{texto}</section>;
}

function BoxEstadoInterno({ texto }: { texto: string }) {
  return <section style={estadoInterno}>{texto}</section>;
}

function BoxErro({ texto }: { texto: string }) {
  return <section style={erroBox}>{texto}</section>;
}

function BoxSucesso({ texto }: { texto: string }) {
  return <section style={sucessoBox}>{texto}</section>;
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

const gridPrincipal: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
  gap: "24px",
  alignItems: "start",
};

const grid2: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
  gap: "16px",
};

const grid3: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: "16px",
  alignItems: "end",
};

const formGrid: React.CSSProperties = {
  display: "grid",
  gap: "16px",
};

const lista: React.CSSProperties = {
  display: "grid",
  gap: "14px",
};

const itemCard: React.CSSProperties = {
  border: "1px solid rgba(166,120,61,0.18)",
  background: "rgba(20,13,9,0.45)",
  padding: "18px",
  display: "grid",
  gap: "14px",
};

const itemAcoes: React.CSSProperties = {
  display: "flex",
  justifyContent: "flex-end",
  gap: "12px",
  flexWrap: "wrap",
};

const label: React.CSSProperties = {
  display: "block",
  marginBottom: "8px",
  color: "#caa15a",
  fontSize: "14px",
  textTransform: "uppercase",
  letterSpacing: "1px",
};

const input: React.CSSProperties = {
  width: "100%",
  padding: "12px 14px",
  border: "1px solid #8a5d31",
  background: "#140d09",
  color: "#e6c27a",
  fontSize: "17px",
  outline: "none",
};

const checkboxLinha: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  minHeight: "46px",
  color: "#e6c27a",
  fontSize: "17px",
  flexWrap: "wrap",
};

const acoesFormulario: React.CSSProperties = {
  display: "flex",
  gap: "12px",
  flexWrap: "wrap",
};

const infoCard: React.CSSProperties = {
  border: "1px solid rgba(166,120,61,0.18)",
  background: "rgba(20,13,9,0.36)",
  padding: "14px 16px",
};

const infoLabel: React.CSSProperties = {
  margin: "0 0 8px 0",
  fontSize: "13px",
  color: "#caa15a",
  textTransform: "uppercase",
  letterSpacing: "1px",
};

const infoText: React.CSSProperties = {
  margin: 0,
  color: "#d7b06c",
  fontSize: "17px",
  lineHeight: 1.7,
  wordBreak: "break-word",
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

const estadoInterno: React.CSSProperties = {
  border: "1px solid rgba(166,120,61,0.18)",
  background: "rgba(20,13,9,0.35)",
  padding: "20px",
  textAlign: "center",
  color: "#d7b06c",
  fontSize: "18px",
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