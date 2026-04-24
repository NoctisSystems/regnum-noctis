"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type FormadorSessao = {
  id: number;
  email: string | null;
  auth_id: string | null;
  status: string | null;
};

type Curso = {
  id: number;
  titulo: string | null;
  descricao: string | null;
  publicado: boolean | null;
  created_at: string | null;
  updated_at: string | null;
};

type Modulo = {
  id: number;
  curso_id: number;
  titulo: string | null;
  descricao: string | null;
  ordem: number | null;
  created_at: string | null;
};

type Aula = {
  id: number;
  curso_id: number;
  modulo_id: number | null;
  titulo: string | null;
  descricao: string | null;
  ordem: number | null;
  gratuito: boolean | null;
  created_at: string | null;
};

type FormModulo = {
  titulo: string;
  descricao: string;
  ordem: string;
};

type FormAula = {
  modulo_id: string;
  titulo: string;
  descricao: string;
  ordem: string;
  gratuito: boolean;
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function formatarData(valor?: string | null) {
  if (!valor) return "—";

  const data = new Date(valor);

  if (Number.isNaN(data.getTime())) return "—";

  return new Intl.DateTimeFormat("pt-PT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(data);
}

function numeroOuNull(valor: string) {
  const texto = valor.trim();
  if (!texto) return null;

  const numero = Number(texto);
  if (Number.isNaN(numero)) return null;

  return numero;
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

function ordenarModulos(lista: Modulo[]) {
  return [...lista].sort((a, b) => {
    const ordemA = a.ordem ?? 999999;
    const ordemB = b.ordem ?? 999999;

    if (ordemA !== ordemB) return ordemA - ordemB;
    return a.id - b.id;
  });
}

function ordenarAulas(lista: Aula[]) {
  return [...lista].sort((a, b) => {
    const ordemA = a.ordem ?? 999999;
    const ordemB = b.ordem ?? 999999;

    if (ordemA !== ordemB) return ordemA - ordemB;
    return a.id - b.id;
  });
}

export default function EstruturaCursoPage() {
  const router = useRouter();
  const params = useParams<{ cursoId: string }>();
  const cursoId = Number(params?.cursoId);

  const [loading, setLoading] = useState(true);
  const [savingModulo, setSavingModulo] = useState(false);
  const [savingAula, setSavingAula] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  const [curso, setCurso] = useState<Curso | null>(null);
  const [modulos, setModulos] = useState<Modulo[]>([]);
  const [aulas, setAulas] = useState<Aula[]>([]);

  const [editingModuloId, setEditingModuloId] = useState<number | null>(null);
  const [editingAulaId, setEditingAulaId] = useState<number | null>(null);

  const [formModulo, setFormModulo] = useState<FormModulo>({
    titulo: "",
    descricao: "",
    ordem: "",
  });

  const [formAula, setFormAula] = useState<FormAula>({
    modulo_id: "",
    titulo: "",
    descricao: "",
    ordem: "",
    gratuito: false,
  });

  const obterUtilizadorAutenticado = useCallback(async () => {
    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (!userError && userData.user) {
      return userData.user;
    }

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (!sessionError && session?.user) {
      return session.user;
    }

    await sleep(250);

    const { data: retryData, error: retryError } = await supabase.auth.getUser();

    if (!retryError && retryData.user) {
      return retryData.user;
    }

    return null;
  }, []);

  const encontrarFormadorSessao = useCallback(
    async (userId: string, userEmail: string | null | undefined) => {
      const { data: porAuthId, error: erroPorAuthId } = await supabase
        .from("formadores")
        .select("id, email, auth_id, status")
        .eq("auth_id", userId)
        .maybeSingle();

      if (erroPorAuthId) {
        throw erroPorAuthId;
      }

      if (porAuthId) {
        return porAuthId as FormadorSessao;
      }

      if (!userEmail) {
        return null;
      }

      const emailNormalizado = userEmail.trim().toLowerCase();

      const { data: porEmail, error: erroPorEmail } = await supabase
        .from("formadores")
        .select("id, email, auth_id, status")
        .ilike("email", emailNormalizado)
        .maybeSingle();

      if (erroPorEmail) {
        throw erroPorEmail;
      }

      if (!porEmail) {
        return null;
      }

      if (porEmail.auth_id && porEmail.auth_id !== userId) {
        return null;
      }

      if (!porEmail.auth_id) {
        const { error: updateError } = await supabase
          .from("formadores")
          .update({ auth_id: userId })
          .eq("id", porEmail.id);

        if (updateError) {
          throw updateError;
        }

        return {
          ...(porEmail as FormadorSessao),
          auth_id: userId,
        };
      }

      return porEmail as FormadorSessao;
    },
    []
  );

  const limparFormularioModulo = useCallback(() => {
    setEditingModuloId(null);
    setFormModulo({
      titulo: "",
      descricao: "",
      ordem: "",
    });
  }, []);

  const limparFormularioAula = useCallback(() => {
    setEditingAulaId(null);
    setFormAula({
      modulo_id: "",
      titulo: "",
      descricao: "",
      ordem: "",
      gratuito: false,
    });
  }, []);

  const carregarDados = useCallback(async () => {
    setLoading(true);
    setErro("");
    setSucesso("");

    try {
      const user = await obterUtilizadorAutenticado();

      if (!user) {
        router.replace("/formadores/login");
        return;
      }

      const formadorSessao = await encontrarFormadorSessao(user.id, user.email);

      if (!formadorSessao) {
        setErro("Não foi possível validar o acesso do formador.");
        setLoading(false);
        return;
      }

      if (formadorSessao.status !== "aprovado") {
        router.replace("/formadores/dashboard");
        return;
      }

      const { data: cursoData, error: cursoError } = await supabase
        .from("cursos")
        .select("id, titulo, descricao, publicado, created_at, updated_at")
        .eq("id", cursoId)
        .eq("formador_id", formadorSessao.id)
        .maybeSingle();

      if (cursoError || !cursoData) {
        setErro("Não foi possível carregar este curso.");
        setLoading(false);
        return;
      }

      setCurso(cursoData as Curso);

      const { data: modulosData, error: modulosError } = await supabase
        .from("modulos")
        .select("id, curso_id, titulo, descricao, ordem, created_at")
        .eq("curso_id", cursoId)
        .order("ordem", { ascending: true, nullsFirst: false })
        .order("id", { ascending: true });

      if (modulosError) {
        setErro(modulosError.message || "Erro ao carregar módulos.");
        setLoading(false);
        return;
      }

      const { data: aulasData, error: aulasError } = await supabase
        .from("aulas")
        .select(
          "id, curso_id, modulo_id, titulo, descricao, ordem, gratuito, created_at"
        )
        .eq("curso_id", cursoId)
        .order("ordem", { ascending: true, nullsFirst: false })
        .order("id", { ascending: true });

      if (aulasError) {
        setErro(aulasError.message || "Erro ao carregar aulas.");
        setLoading(false);
        return;
      }

      setModulos(ordenarModulos((modulosData || []) as Modulo[]));
      setAulas(ordenarAulas((aulasData || []) as Aula[]));
    } catch (error: unknown) {
      setErro(
        getErrorMessage(
          error,
          "Ocorreu um erro inesperado ao carregar a estrutura do curso."
        )
      );
    } finally {
      setLoading(false);
    }
  }, [cursoId, encontrarFormadorSessao, obterUtilizadorAutenticado, router]);

  useEffect(() => {
    if (!Number.isFinite(cursoId) || cursoId <= 0) {
      router.replace("/formadores/cursos");
      return;
    }

    void carregarDados();
  }, [carregarDados, cursoId, router]);

  const totalModulos = useMemo(() => modulos.length, [modulos]);
  const totalAulas = useMemo(() => aulas.length, [aulas]);
  const totalGratuitas = useMemo(
    () => aulas.filter((aula) => aula.gratuito).length,
    [aulas]
  );

  const aulasSemModulo = useMemo(
    () => aulas.filter((aula) => !aula.modulo_id),
    [aulas]
  );

  async function guardarModulo(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!curso) return;

    if (!formModulo.titulo.trim()) {
      setErro("Indica o título do módulo.");
      return;
    }

    setSavingModulo(true);
    setErro("");
    setSucesso("");

    try {
      const payload = {
        curso_id: curso.id,
        titulo: formModulo.titulo.trim(),
        descricao: formModulo.descricao.trim() || null,
        ordem: numeroOuNull(formModulo.ordem),
      };

      if (editingModuloId) {
        const { error } = await supabase
          .from("modulos")
          .update(payload)
          .eq("id", editingModuloId)
          .eq("curso_id", curso.id);

        if (error) {
          setErro(error.message || "Não foi possível atualizar o módulo.");
          setSavingModulo(false);
          return;
        }

        setSucesso("Módulo atualizado com sucesso.");
      } else {
        const { error } = await supabase.from("modulos").insert([payload]);

        if (error) {
          setErro(error.message || "Não foi possível criar o módulo.");
          setSavingModulo(false);
          return;
        }

        setSucesso("Módulo criado com sucesso.");
      }

      limparFormularioModulo();
      await carregarDados();
    } catch (error: unknown) {
      setErro(
        getErrorMessage(
          error,
          "Ocorreu um erro inesperado ao guardar o módulo."
        )
      );
    } finally {
      setSavingModulo(false);
    }
  }

  async function guardarAula(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!curso) return;

    if (!formAula.titulo.trim()) {
      setErro("Indica o título da aula.");
      return;
    }

    setSavingAula(true);
    setErro("");
    setSucesso("");

    try {
      const payload = {
        curso_id: curso.id,
        modulo_id: numeroOuNull(formAula.modulo_id),
        titulo: formAula.titulo.trim(),
        descricao: formAula.descricao.trim() || null,
        ordem: numeroOuNull(formAula.ordem),
        gratuito: formAula.gratuito,
      };

      if (editingAulaId) {
        const { error } = await supabase
          .from("aulas")
          .update(payload)
          .eq("id", editingAulaId)
          .eq("curso_id", curso.id);

        if (error) {
          setErro(error.message || "Não foi possível atualizar a aula.");
          setSavingAula(false);
          return;
        }

        setSucesso("Aula atualizada com sucesso.");
      } else {
        const { error } = await supabase.from("aulas").insert([payload]);

        if (error) {
          setErro(error.message || "Não foi possível criar a aula.");
          setSavingAula(false);
          return;
        }

        setSucesso("Aula criada com sucesso.");
      }

      limparFormularioAula();
      await carregarDados();
    } catch (error: unknown) {
      setErro(
        getErrorMessage(error, "Ocorreu um erro inesperado ao guardar a aula.")
      );
    } finally {
      setSavingAula(false);
    }
  }

  function editarModulo(modulo: Modulo) {
    setEditingModuloId(modulo.id);
    setFormModulo({
      titulo: modulo.titulo || "",
      descricao: modulo.descricao || "",
      ordem:
        modulo.ordem !== null && modulo.ordem !== undefined
          ? String(modulo.ordem)
          : "",
    });
    setSucesso("");
    setErro("");
  }

  function editarAula(aula: Aula) {
    setEditingAulaId(aula.id);
    setFormAula({
      modulo_id:
        aula.modulo_id !== null && aula.modulo_id !== undefined
          ? String(aula.modulo_id)
          : "",
      titulo: aula.titulo || "",
      descricao: aula.descricao || "",
      ordem:
        aula.ordem !== null && aula.ordem !== undefined
          ? String(aula.ordem)
          : "",
      gratuito: Boolean(aula.gratuito),
    });
    setSucesso("");
    setErro("");
  }

  async function apagarModulo(moduloId: number) {
    if (!curso) return;

    const temAulasLigadas = aulas.some((aula) => aula.modulo_id === moduloId);

    if (temAulasLigadas) {
      setErro(
        "Não podes apagar este módulo enquanto existirem aulas associadas ao mesmo."
      );
      return;
    }

    const confirmar = window.confirm(
      "Tens a certeza que queres apagar este módulo?"
    );

    if (!confirmar) return;

    setErro("");
    setSucesso("");

    try {
      const { error } = await supabase
        .from("modulos")
        .delete()
        .eq("id", moduloId)
        .eq("curso_id", curso.id);

      if (error) {
        setErro(error.message || "Não foi possível apagar o módulo.");
        return;
      }

      if (editingModuloId === moduloId) {
        limparFormularioModulo();
      }

      setSucesso("Módulo apagado com sucesso.");
      await carregarDados();
    } catch (error: unknown) {
      setErro(
        getErrorMessage(
          error,
          "Ocorreu um erro inesperado ao apagar o módulo."
        )
      );
    }
  }

  async function apagarAula(aulaId: number) {
    if (!curso) return;

    const confirmar = window.confirm(
      "Tens a certeza que queres apagar esta aula?"
    );

    if (!confirmar) return;

    setErro("");
    setSucesso("");

    try {
      const { error } = await supabase
        .from("aulas")
        .delete()
        .eq("id", aulaId)
        .eq("curso_id", curso.id);

      if (error) {
        setErro(error.message || "Não foi possível apagar a aula.");
        return;
      }

      if (editingAulaId === aulaId) {
        limparFormularioAula();
      }

      setSucesso("Aula apagada com sucesso.");
      await carregarDados();
    } catch (error: unknown) {
      setErro(
        getErrorMessage(error, "Ocorreu um erro inesperado ao apagar a aula.")
      );
    }
  }

  function aulasDoModulo(moduloId: number) {
    return aulas.filter((aula) => aula.modulo_id === moduloId);
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top, rgba(166,120,61,0.08), transparent 20%), #2b160f",
        color: "#e6c27a",
        fontFamily: "Cormorant Garamond, serif",
        padding: "42px 16px 90px",
      }}
    >
      <section
        style={{
          maxWidth: "1380px",
          margin: "0 auto",
        }}
      >
        <header style={{ marginBottom: "28px" }}>
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

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
              gap: "18px",
              flexWrap: "wrap",
            }}
          >
            <div>
              <h1
                style={{
                  margin: 0,
                  fontFamily: "Cinzel, serif",
                  fontSize: "clamp(34px, 6vw, 64px)",
                  lineHeight: 1.1,
                  color: "#f0d79a",
                  fontWeight: 500,
                }}
              >
                Estrutura do Curso
              </h1>

              <p
                style={{
                  margin: "14px 0 0 0",
                  fontSize: "clamp(20px, 2.5vw, 25px)",
                  lineHeight: 1.7,
                  color: "#d7b06c",
                  maxWidth: "900px",
                }}
              >
                Cria módulos, organiza aulas e marca as aulas gratuitas de
                demonstração do teu curso.
              </p>
            </div>

            <div
              style={{
                display: "flex",
                gap: "12px",
                flexWrap: "wrap",
              }}
            >
              <button
                type="button"
                onClick={() => void carregarDados()}
                style={botaoSecundario}
              >
                Atualizar
              </button>

              <Link href="/formadores/cursos" style={botaoSecundario}>
                Voltar aos cursos
              </Link>

              <Link
                href={`/formadores/cursos/${cursoId}`}
                style={botaoPrimario}
              >
                Voltar à gestão
              </Link>
            </div>
          </div>
        </header>

        {loading ? (
          <BlocoMensagem texto="A carregar estrutura do curso..." />
        ) : erro && !curso ? (
          <BlocoErro texto={erro} />
        ) : !curso ? (
          <BlocoErro texto="Curso não encontrado." />
        ) : (
          <>
            <section
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: "18px",
                marginBottom: "28px",
              }}
            >
              <ResumoCard
                titulo="Curso"
                valor={curso.titulo || "Sem título"}
                subtitulo="Curso atual"
                compact
              />
              <ResumoCard
                titulo="Módulos"
                valor={String(totalModulos)}
                subtitulo="Módulos criados"
              />
              <ResumoCard
                titulo="Aulas"
                valor={String(totalAulas)}
                subtitulo="Aulas criadas"
              />
              <ResumoCard
                titulo="Gratuitas"
                valor={String(totalGratuitas)}
                subtitulo="Aulas de demonstração"
              />
            </section>

            {sucesso ? <BlocoSucesso texto={sucesso} /> : null}
            {erro ? <BlocoErro texto={erro} /> : null}

            <section
              style={{
                display: "grid",
                gridTemplateColumns:
                  "minmax(320px, 420px) minmax(320px, 420px) minmax(0, 1fr)",
                gap: "18px",
                alignItems: "start",
              }}
            >
              <form onSubmit={guardarModulo} style={painelLateral}>
                <h2 style={tituloPainel}>
                  {editingModuloId ? "Editar Módulo" : "Novo Módulo"}
                </h2>

                <CampoTexto
                  label="Título do módulo"
                  value={formModulo.titulo}
                  onChange={(valor) =>
                    setFormModulo((prev) => ({ ...prev, titulo: valor }))
                  }
                />

                <CampoTextarea
                  label="Descrição"
                  value={formModulo.descricao}
                  onChange={(valor) =>
                    setFormModulo((prev) => ({ ...prev, descricao: valor }))
                  }
                  rows={5}
                />

                <CampoTexto
                  label="Ordem"
                  value={formModulo.ordem}
                  onChange={(valor) =>
                    setFormModulo((prev) => ({ ...prev, ordem: valor }))
                  }
                  type="number"
                />

                <div
                  style={{
                    display: "flex",
                    gap: "12px",
                    flexWrap: "wrap",
                  }}
                >
                  <button
                    type="submit"
                    style={botaoPrimario}
                    disabled={savingModulo}
                  >
                    {savingModulo
                      ? "A guardar..."
                      : editingModuloId
                      ? "Guardar módulo"
                      : "Criar módulo"}
                  </button>

                  {editingModuloId ? (
                    <button
                      type="button"
                      onClick={limparFormularioModulo}
                      style={botaoSecundario}
                    >
                      Cancelar
                    </button>
                  ) : null}
                </div>
              </form>

              <form onSubmit={guardarAula} style={painelLateral}>
                <h2 style={tituloPainel}>
                  {editingAulaId ? "Editar Aula" : "Nova Aula"}
                </h2>

                <CampoSelect
                  label="Módulo"
                  value={formAula.modulo_id}
                  onChange={(valor) =>
                    setFormAula((prev) => ({ ...prev, modulo_id: valor }))
                  }
                  options={[
                    { value: "", label: "Sem módulo" },
                    ...modulos.map((modulo) => ({
                      value: String(modulo.id),
                      label: modulo.titulo || `Módulo #${modulo.id}`,
                    })),
                  ]}
                />

                <CampoTexto
                  label="Título da aula"
                  value={formAula.titulo}
                  onChange={(valor) =>
                    setFormAula((prev) => ({ ...prev, titulo: valor }))
                  }
                />

                <CampoTextarea
                  label="Descrição"
                  value={formAula.descricao}
                  onChange={(valor) =>
                    setFormAula((prev) => ({ ...prev, descricao: valor }))
                  }
                  rows={5}
                />

                <CampoTexto
                  label="Ordem"
                  value={formAula.ordem}
                  onChange={(valor) =>
                    setFormAula((prev) => ({ ...prev, ordem: valor }))
                  }
                  type="number"
                />

                <LinhaCheck
                  texto="Aula gratuita / demonstração"
                  checked={formAula.gratuito}
                  onChange={(checked) =>
                    setFormAula((prev) => ({ ...prev, gratuito: checked }))
                  }
                />

                <div
                  style={{
                    display: "flex",
                    gap: "12px",
                    flexWrap: "wrap",
                  }}
                >
                  <button
                    type="submit"
                    style={botaoPrimario}
                    disabled={savingAula}
                  >
                    {savingAula
                      ? "A guardar..."
                      : editingAulaId
                      ? "Guardar aula"
                      : "Criar aula"}
                  </button>

                  {editingAulaId ? (
                    <button
                      type="button"
                      onClick={limparFormularioAula}
                      style={botaoSecundario}
                    >
                      Cancelar
                    </button>
                  ) : null}
                </div>
              </form>

              <section
                style={{
                  border: "1px solid #8a5d31",
                  background:
                    "linear-gradient(180deg, rgba(20,13,9,0.98) 0%, rgba(16,10,8,0.98) 100%)",
                  padding: "24px",
                  boxShadow:
                    "0 12px 26px rgba(0,0,0,0.16), inset 0 1px 0 rgba(255,225,170,0.03)",
                }}
              >
                <h2 style={tituloPainel}>Estrutura Atual</h2>

                {modulos.length === 0 && aulas.length === 0 ? (
                  <BlocoMensagem texto="Ainda não existem módulos nem aulas neste curso." />
                ) : (
                  <div
                    style={{
                      display: "grid",
                      gap: "16px",
                    }}
                  >
                    {modulos.map((modulo, moduloIndex) => {
                      const aulasLigadas = ordenarAulas(aulasDoModulo(modulo.id));

                      return (
                        <article key={modulo.id} style={blocoEstrutura}>
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "flex-start",
                              gap: "12px",
                              flexWrap: "wrap",
                            }}
                          >
                            <div style={{ flex: 1, minWidth: "240px" }}>
                              <div
                                style={{
                                  display: "flex",
                                  gap: "8px",
                                  flexWrap: "wrap",
                                  marginBottom: "10px",
                                }}
                              >
                                <span style={pillInfo}>
                                  Módulo {moduloIndex + 1}
                                </span>
                                <span style={pillInfo}>
                                  Ordem: {modulo.ordem ?? "—"}
                                </span>
                              </div>

                              <h3 style={tituloBloco}>
                                {modulo.titulo || "Módulo sem título"}
                              </h3>

                              <p style={textoBloco}>
                                {modulo.descricao || "Sem descrição."}
                              </p>

                              <p style={textoData}>
                                Criado em: {formatarData(modulo.created_at)}
                              </p>
                            </div>

                            <div
                              style={{
                                display: "flex",
                                gap: "10px",
                                flexWrap: "wrap",
                              }}
                            >
                              <button
                                type="button"
                                onClick={() => editarModulo(modulo)}
                                style={botaoSecundario}
                              >
                                Editar módulo
                              </button>

                              <button
                                type="button"
                                onClick={() => void apagarModulo(modulo.id)}
                                style={botaoPerigo}
                              >
                                Apagar módulo
                              </button>
                            </div>
                          </div>

                          <div
                            style={{
                              marginTop: "16px",
                              display: "grid",
                              gap: "12px",
                            }}
                          >
                            {aulasLigadas.length === 0 ? (
                              <div style={caixaVaziaInterna}>
                                Ainda não existem aulas neste módulo.
                              </div>
                            ) : (
                              aulasLigadas.map((aula, aulaIndex) => (
                                <div key={aula.id} style={blocoInternoAula}>
                                  <div
                                    style={{
                                      display: "flex",
                                      justifyContent: "space-between",
                                      alignItems: "flex-start",
                                      gap: "12px",
                                      flexWrap: "wrap",
                                    }}
                                  >
                                    <div style={{ flex: 1, minWidth: "220px" }}>
                                      <div
                                        style={{
                                          display: "flex",
                                          gap: "8px",
                                          flexWrap: "wrap",
                                          marginBottom: "10px",
                                        }}
                                      >
                                        <span style={pillInfo}>
                                          Aula {aulaIndex + 1}
                                        </span>
                                        <span style={pillInfo}>
                                          Ordem: {aula.ordem ?? "—"}
                                        </span>
                                        <span style={pillInfo}>
                                          {aula.gratuito
                                            ? "Gratuita"
                                            : "Reservada"}
                                        </span>
                                      </div>

                                      <h4 style={tituloAula}>
                                        {aula.titulo || "Aula sem título"}
                                      </h4>

                                      <p style={textoBloco}>
                                        {aula.descricao || "Sem descrição."}
                                      </p>

                                      <p style={textoData}>
                                        Criada em: {formatarData(aula.created_at)}
                                      </p>
                                    </div>

                                    <div
                                      style={{
                                        display: "flex",
                                        gap: "10px",
                                        flexWrap: "wrap",
                                      }}
                                    >
                                      <button
                                        type="button"
                                        onClick={() => editarAula(aula)}
                                        style={botaoSecundario}
                                      >
                                        Editar aula
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() => void apagarAula(aula.id)}
                                        style={botaoPerigo}
                                      >
                                        Apagar aula
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </article>
                      );
                    })}

                    {aulasSemModulo.length > 0 ? (
                      <article style={blocoEstrutura}>
                        <h3 style={tituloBloco}>Aulas sem módulo</h3>

                        <div
                          style={{
                            marginTop: "16px",
                            display: "grid",
                            gap: "12px",
                          }}
                        >
                          {aulasSemModulo.map((aula, index) => (
                            <div key={aula.id} style={blocoInternoAula}>
                              <div
                                style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "flex-start",
                                  gap: "12px",
                                  flexWrap: "wrap",
                                }}
                              >
                                <div style={{ flex: 1, minWidth: "220px" }}>
                                  <div
                                    style={{
                                      display: "flex",
                                      gap: "8px",
                                      flexWrap: "wrap",
                                      marginBottom: "10px",
                                    }}
                                  >
                                    <span style={pillInfo}>
                                      Aula {index + 1}
                                    </span>
                                    <span style={pillInfo}>
                                      Ordem: {aula.ordem ?? "—"}
                                    </span>
                                    <span style={pillInfo}>
                                      {aula.gratuito
                                        ? "Gratuita"
                                        : "Reservada"}
                                    </span>
                                  </div>

                                  <h4 style={tituloAula}>
                                    {aula.titulo || "Aula sem título"}
                                  </h4>

                                  <p style={textoBloco}>
                                    {aula.descricao || "Sem descrição."}
                                  </p>

                                  <p style={textoData}>
                                    Criada em: {formatarData(aula.created_at)}
                                  </p>
                                </div>

                                <div
                                  style={{
                                    display: "flex",
                                    gap: "10px",
                                    flexWrap: "wrap",
                                  }}
                                >
                                  <button
                                    type="button"
                                    onClick={() => editarAula(aula)}
                                    style={botaoSecundario}
                                  >
                                    Editar aula
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => void apagarAula(aula.id)}
                                    style={botaoPerigo}
                                  >
                                    Apagar aula
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </article>
                    ) : null}
                  </div>
                )}
              </section>
            </section>
          </>
        )}
      </section>
    </main>
  );
}

function ResumoCard({
  titulo,
  valor,
  subtitulo,
  compact = false,
}: {
  titulo: string;
  valor: string;
  subtitulo: string;
  compact?: boolean;
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
      <p
        style={{
          margin: "0 0 10px 0",
          fontSize: "15px",
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: "#caa15a",
        }}
      >
        {titulo}
      </p>

      <p
        style={{
          margin: "0 0 8px 0",
          fontFamily: "Cinzel, serif",
          fontSize: compact ? "28px" : "34px",
          color: "#f0d79a",
          lineHeight: 1.2,
        }}
      >
        {valor}
      </p>

      <p
        style={{
          margin: 0,
          fontSize: "19px",
          color: "#d7b06c",
          lineHeight: 1.6,
        }}
      >
        {subtitulo}
      </p>
    </article>
  );
}

function CampoTexto({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (valor: string) => void;
  type?: string;
}) {
  return (
    <div>
      <label
        style={{
          display: "block",
          marginBottom: "8px",
          fontSize: "19px",
          color: "#e6c27a",
        }}
      >
        {label}
      </label>

      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={campoBase}
      />
    </div>
  );
}

function CampoTextarea({
  label,
  value,
  onChange,
  rows,
}: {
  label: string;
  value: string;
  onChange: (valor: string) => void;
  rows: number;
}) {
  return (
    <div>
      <label
        style={{
          display: "block",
          marginBottom: "8px",
          fontSize: "19px",
          color: "#e6c27a",
        }}
      >
        {label}
      </label>

      <textarea
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          ...campoBase,
          resize: "vertical",
        }}
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
      <label
        style={{
          display: "block",
          marginBottom: "8px",
          fontSize: "19px",
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
            style={{ background: "#1a100c", color: "#e6c27a" }}
          >
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function LinhaCheck({
  texto,
  checked,
  onChange,
}: {
  texto: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label
      style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        fontSize: "19px",
        color: "#e6c27a",
        flexWrap: "wrap",
        border: "1px solid rgba(166,120,61,0.22)",
        background: "rgba(32,18,13,0.45)",
        padding: "14px 16px",
      }}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        style={{ accentColor: "#a6783d" }}
      />
      <span>{texto}</span>
    </label>
  );
}

function BlocoMensagem({ texto }: { texto: string }) {
  return (
    <section
      style={{
        border: "1px solid #8a5d31",
        background:
          "linear-gradient(180deg, rgba(20,13,9,0.98) 0%, rgba(16,10,8,0.98) 100%)",
        padding: "24px",
        textAlign: "center",
      }}
    >
      <p
        style={{
          margin: 0,
          fontSize: "21px",
          lineHeight: 1.7,
          color: "#dfbe81",
        }}
      >
        {texto}
      </p>
    </section>
  );
}

function BlocoErro({ texto }: { texto: string }) {
  return (
    <section
      style={{
        border: "1px solid rgba(255,107,107,0.35)",
        background: "rgba(120,20,20,0.12)",
        padding: "18px",
        color: "#ffb4b4",
        fontSize: "19px",
        lineHeight: 1.7,
        marginBottom: "14px",
      }}
    >
      {texto}
    </section>
  );
}

function BlocoSucesso({ texto }: { texto: string }) {
  return (
    <section
      style={{
        border: "1px solid rgba(74,222,128,0.35)",
        background: "rgba(20,90,40,0.12)",
        padding: "18px",
        color: "#bff1bf",
        fontSize: "19px",
        lineHeight: 1.7,
        marginBottom: "14px",
      }}
    >
      {texto}
    </section>
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

const painelLateral: React.CSSProperties = {
  border: "1px solid #8a5d31",
  background:
    "linear-gradient(180deg, rgba(20,13,9,0.98) 0%, rgba(16,10,8,0.98) 100%)",
  padding: "24px",
  boxShadow:
    "0 12px 26px rgba(0,0,0,0.16), inset 0 1px 0 rgba(255,225,170,0.03)",
  display: "grid",
  gap: "18px",
  alignSelf: "start",
};

const tituloPainel: React.CSSProperties = {
  margin: 0,
  fontFamily: "Cinzel, serif",
  fontSize: "32px",
  color: "#f0d79a",
  fontWeight: 500,
};

const blocoEstrutura: React.CSSProperties = {
  border: "1px solid rgba(166,120,61,0.22)",
  background: "rgba(32,18,13,0.45)",
  padding: "18px",
};

const blocoInternoAula: React.CSSProperties = {
  border: "1px solid rgba(166,120,61,0.18)",
  background: "rgba(20,13,9,0.35)",
  padding: "16px",
};

const caixaVaziaInterna: React.CSSProperties = {
  border: "1px dashed rgba(166,120,61,0.25)",
  background: "rgba(20,13,9,0.2)",
  padding: "16px",
  color: "#d7b06c",
  fontSize: "18px",
  lineHeight: 1.6,
};

const tituloBloco: React.CSSProperties = {
  margin: "0 0 10px 0",
  fontFamily: "Cinzel, serif",
  fontSize: "28px",
  color: "#f0d79a",
  fontWeight: 500,
};

const tituloAula: React.CSSProperties = {
  margin: "0 0 10px 0",
  fontFamily: "Cinzel, serif",
  fontSize: "24px",
  color: "#f0d79a",
  fontWeight: 500,
};

const textoBloco: React.CSSProperties = {
  margin: 0,
  fontSize: "19px",
  lineHeight: 1.7,
  color: "#d7b06c",
  whiteSpace: "pre-line",
};

const textoData: React.CSSProperties = {
  margin: "10px 0 0 0",
  fontSize: "16px",
  color: "#caa15a",
};

const pillInfo: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  border: "1px solid rgba(166,120,61,0.4)",
  color: "#f0dfbf",
  padding: "8px 12px",
  fontSize: "14px",
  background: "rgba(43,22,15,0.7)",
  textAlign: "center",
};

const botaoPrimario: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  textDecoration: "none",
  border: "1px solid #a6783d",
  color: "#e6c27a",
  padding: "14px 18px",
  fontSize: "16px",
  background: "transparent",
  textAlign: "center",
  cursor: "pointer",
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

const botaoPerigo: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  textDecoration: "none",
  border: "1px solid rgba(255,107,107,0.45)",
  color: "#ffb4b4",
  padding: "12px 16px",
  fontSize: "15px",
  background: "rgba(120,20,20,0.12)",
  cursor: "pointer",
  textAlign: "center",
};