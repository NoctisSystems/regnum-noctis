"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Formador = {
  id: number;
  nome: string | null;
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
  capa_url: string | null;
  tipo_produto: string | null;
  preco: number | null;
  preco_eur: number | null;
  preco_brl: number | null;
  checkout_eu_ativo: boolean | null;
  checkout_br_ativo: boolean | null;
  tem_certificado: boolean | null;
  modo_certificado: string | null;
  texto_certificado: string | null;
  horas_certificado: string | null;
  pdf_path?: string | null;
};

type Aula = {
  id: number;
  curso_id: number;
  titulo: string | null;
  ordem: number | null;
  gratuito: boolean | null;
};

type FormCurso = {
  titulo: string;
  descricao: string;
  preco_eur: string;
  preco_brl: string;
  checkout_eu_ativo: boolean;
  checkout_br_ativo: boolean;
  tem_certificado: boolean;
  modo_certificado: string;
  texto_certificado: string;
  horas_certificado: string;
  publicado: boolean;
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

function normalizarNumeroInput(valor: string) {
  const texto = valor.trim().replace(",", ".");
  if (!texto) return null;

  const numero = Number(texto);
  if (Number.isNaN(numero)) return null;

  return numero;
}

function numeroOuVazio(valor?: number | string | null) {
  if (valor === null || valor === undefined) return "";
  return String(valor);
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

export default function GestaoCursoPage() {
  const router = useRouter();
  const params = useParams<{ cursoId: string }>();
  const cursoId = Number(params?.cursoId);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [apagandoCurso, setApagandoCurso] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [formadorId, setFormadorId] = useState<number | null>(null);
  const [curso, setCurso] = useState<Curso | null>(null);
  const [aulas, setAulas] = useState<Aula[]>([]);
  const [form, setForm] = useState<FormCurso>({
    titulo: "",
    descricao: "",
    preco_eur: "",
    preco_brl: "",
    checkout_eu_ativo: true,
    checkout_br_ativo: false,
    tem_certificado: false,
    modo_certificado: "manual",
    texto_certificado: "",
    horas_certificado: "",
    publicado: false,
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

  const encontrarFormadorComRecuperacao = useCallback(
    async (userId: string, userEmail: string | null | undefined) => {
      const { data: porAuthId, error: erroPorAuthId } = await supabase
        .from("formadores")
        .select("id, nome, email, auth_id, status")
        .eq("auth_id", userId)
        .maybeSingle();

      if (erroPorAuthId) {
        throw erroPorAuthId;
      }

      if (porAuthId) {
        return porAuthId as Formador;
      }

      if (!userEmail) {
        return null;
      }

      const emailNormalizado = userEmail.trim().toLowerCase();

      const { data: porEmail, error: erroPorEmail } = await supabase
        .from("formadores")
        .select("id, nome, email, auth_id, status")
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
          ...(porEmail as Formador),
          auth_id: userId,
        };
      }

      return porEmail as Formador;
    },
    []
  );

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

      const formador = await encontrarFormadorComRecuperacao(user.id, user.email);

      if (!formador) {
        setErro("Não foi possível encontrar o registo do formador.");
        setLoading(false);
        return;
      }

      if (formador.status !== "aprovado") {
        router.replace("/formadores/dashboard");
        return;
      }

      setFormadorId(formador.id);

      const { data: cursoData, error: cursoError } = await supabase
        .from("cursos")
        .select(
          "id, titulo, descricao, publicado, created_at, updated_at, capa_url, tipo_produto, preco, preco_eur, preco_brl, checkout_eu_ativo, checkout_br_ativo, tem_certificado, modo_certificado, texto_certificado, horas_certificado, pdf_path"
        )
        .eq("id", cursoId)
        .eq("formador_id", formador.id)
        .maybeSingle();

      if (cursoError || !cursoData) {
        setErro("Não foi possível carregar este curso.");
        setLoading(false);
        return;
      }

      const cursoTipado = cursoData as Curso;
      setCurso(cursoTipado);

      setForm({
        titulo: cursoTipado.titulo || "",
        descricao: cursoTipado.descricao || "",
        preco_eur: numeroOuVazio(cursoTipado.preco_eur),
        preco_brl: numeroOuVazio(cursoTipado.preco_brl),
        checkout_eu_ativo:
          cursoTipado.checkout_eu_ativo === null
            ? true
            : Boolean(cursoTipado.checkout_eu_ativo),
        checkout_br_ativo: Boolean(cursoTipado.checkout_br_ativo),
        tem_certificado: Boolean(cursoTipado.tem_certificado),
        modo_certificado: cursoTipado.modo_certificado || "manual",
        texto_certificado: cursoTipado.texto_certificado || "",
        horas_certificado: cursoTipado.horas_certificado || "",
        publicado: Boolean(cursoTipado.publicado),
      });

      const { data: aulasData, error: aulasError } = await supabase
        .from("aulas")
        .select("id, curso_id, titulo, ordem, gratuito")
        .eq("curso_id", cursoId)
        .order("ordem", { ascending: true, nullsFirst: false })
        .order("id", { ascending: true });

      if (aulasError) {
        setErro(aulasError.message || "Não foi possível carregar as aulas.");
        setLoading(false);
        return;
      }

      setAulas((aulasData || []) as Aula[]);
    } catch (error: unknown) {
      setErro(
        getErrorMessage(
          error,
          "Ocorreu um erro inesperado ao carregar a gestão do curso."
        )
      );
    } finally {
      setLoading(false);
    }
  }, [cursoId, encontrarFormadorComRecuperacao, obterUtilizadorAutenticado, router]);

  useEffect(() => {
    if (!Number.isFinite(cursoId) || cursoId <= 0) {
      router.replace("/formadores/cursos");
      return;
    }

    void carregarDados();
  }, [carregarDados, cursoId, router]);

  const totalAulas = useMemo(() => aulas.length, [aulas]);
  const totalGratuitas = useMemo(
    () => aulas.filter((aula) => aula.gratuito).length,
    [aulas]
  );

  async function guardarCurso(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!curso || !formadorId) return;

    setSaving(true);
    setErro("");
    setSucesso("");

    try {
      const payload = {
        titulo: form.titulo.trim() || null,
        descricao: form.descricao.trim() || null,
        preco_eur: normalizarNumeroInput(form.preco_eur),
        preco_brl: normalizarNumeroInput(form.preco_brl),
        checkout_eu_ativo: form.checkout_eu_ativo,
        checkout_br_ativo: form.checkout_br_ativo,
        tem_certificado: form.tem_certificado,
        modo_certificado: form.tem_certificado
          ? form.modo_certificado || null
          : null,
        texto_certificado: form.tem_certificado
          ? form.texto_certificado.trim() || null
          : null,
        horas_certificado: form.tem_certificado
          ? form.horas_certificado.trim() || null
          : null,
        publicado: form.publicado,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("cursos")
        .update(payload)
        .eq("id", curso.id)
        .eq("formador_id", formadorId);

      if (error) {
        setErro(error.message || "Não foi possível guardar o curso.");
        setSaving(false);
        return;
      }

      setSucesso("Curso atualizado com sucesso.");
      await carregarDados();
    } catch (error: unknown) {
      setErro(
        getErrorMessage(
          error,
          "Ocorreu um erro inesperado ao guardar o curso."
        )
      );
    } finally {
      setSaving(false);
    }
  }

  async function apagarCurso() {
    if (!curso) return;

    const confirmar = window.confirm(
      "Tens a certeza que queres apagar este curso? Esta ação vai remover o curso, módulos, aulas e ficheiros associados."
    );

    if (!confirmar) return;

    setApagandoCurso(true);
    setErro("");
    setSucesso("");

    try {
      const response = await fetch("/api/formadores/apagar-curso", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cursoId: curso.id,
        }),
      });

      const data = (await response.json()) as {
        success?: boolean;
        error?: string;
        avisos?: string[];
      };

      if (!response.ok || !data.success) {
        setErro(data.error || "Não foi possível apagar o curso.");
        setApagandoCurso(false);
        return;
      }

      if (Array.isArray(data.avisos) && data.avisos.length > 0) {
        setSucesso(
          `Curso apagado com sucesso. Existem avisos pendentes: ${data.avisos.join(" | ")}`
        );
      } else {
        setSucesso("Curso apagado com sucesso.");
      }

      router.push("/formadores/cursos");
    } catch (error: unknown) {
      setErro(
        getErrorMessage(error, "Ocorreu um erro inesperado ao apagar o curso.")
      );
    } finally {
      setApagandoCurso(false);
    }
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
          maxWidth: "1280px",
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
                Gestão do Curso
              </h1>

              <p
                style={{
                  margin: "14px 0 0 0",
                  fontSize: "clamp(20px, 2.5vw, 25px)",
                  lineHeight: 1.7,
                  color: "#d7b06c",
                  maxWidth: "880px",
                }}
              >
                Aqui podes gerir os dados principais do curso, publicação,
                preços, certificado e acesso direto à estrutura.
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
                href={`/formadores/cursos/${cursoId}/estrutura`}
                style={botaoPrimario}
              >
                Ir para a estrutura
              </Link>
            </div>
          </div>
        </header>

        {loading ? (
          <BlocoMensagem texto="A carregar gestão do curso..." />
        ) : erro ? (
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
                titulo="Estado"
                valor={form.publicado ? "Publicado" : "Rascunho"}
                subtitulo="Situação atual do curso"
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

            <section
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                gap: "18px",
                marginBottom: "24px",
              }}
            >
              <ActionCard
                titulo="Estrutura do curso"
                texto="Entra na área da estrutura para criares módulos, aulas e organizares o conteúdo."
                actions={
                  <Link
                    href={`/formadores/cursos/${curso.id}/estrutura`}
                    style={botaoPrimario}
                  >
                    Abrir estrutura
                  </Link>
                }
              />

              <ActionCard
                titulo="Capa e ficheiros"
                texto={
                  curso.capa_url
                    ? "Este curso já tem capa definida. O upload visual da gestão pode ser afinado na próxima fase."
                    : "Ainda não existe capa definida para este curso."
                }
                actions={
                  <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                    <span style={pillInfo}>
                      {curso.capa_url ? "Capa configurada" : "Sem capa"}
                    </span>
                    {curso.pdf_path ? (
                      <span style={pillInfo}>PDF associado</span>
                    ) : null}
                  </div>
                }
              />

              <ActionCard
                titulo="Publicação"
                texto="Podes manter o curso em rascunho enquanto preparas a estrutura, ou publicá-lo quando estiver pronto."
                actions={
                  <span style={pillInfo}>
                    {form.publicado ? "Publicado" : "Rascunho"}
                  </span>
                }
              />
            </section>

            <form
              onSubmit={guardarCurso}
              style={{
                border: "1px solid #8a5d31",
                background:
                  "linear-gradient(180deg, rgba(20,13,9,0.98) 0%, rgba(16,10,8,0.98) 100%)",
                padding: "26px",
                boxShadow:
                  "0 18px 42px rgba(0,0,0,0.24), inset 0 1px 0 rgba(255,225,170,0.03)",
                display: "grid",
                gap: "22px",
              }}
            >
              <SectionTitle titulo="Dados principais" />

              <div style={grid2}>
                <CampoTexto
                  label="Título do curso"
                  value={form.titulo}
                  onChange={(valor) =>
                    setForm((prev) => ({ ...prev, titulo: valor }))
                  }
                />

                <CampoTexto
                  label="Data de criação"
                  value={formatarData(curso.created_at)}
                  onChange={() => {}}
                  disabled
                />
              </div>

              <CampoTextarea
                label="Descrição"
                value={form.descricao}
                onChange={(valor) =>
                  setForm((prev) => ({ ...prev, descricao: valor }))
                }
                rows={6}
              />

              <SectionTitle titulo="Preços e checkouts" />

              <div style={grid2}>
                <CampoTexto
                  label="Preço EUR"
                  value={form.preco_eur}
                  onChange={(valor) =>
                    setForm((prev) => ({ ...prev, preco_eur: valor }))
                  }
                  type="number"
                />

                <CampoTexto
                  label="Preço BRL"
                  value={form.preco_brl}
                  onChange={(valor) =>
                    setForm((prev) => ({ ...prev, preco_brl: valor }))
                  }
                  type="number"
                />
              </div>

              <div style={grid2}>
                <LinhaCheck
                  texto="Checkout EU ativo"
                  checked={form.checkout_eu_ativo}
                  onChange={(checked) =>
                    setForm((prev) => ({ ...prev, checkout_eu_ativo: checked }))
                  }
                />
                <LinhaCheck
                  texto="Checkout BR ativo"
                  checked={form.checkout_br_ativo}
                  onChange={(checked) =>
                    setForm((prev) => ({ ...prev, checkout_br_ativo: checked }))
                  }
                />
              </div>

              <SectionTitle titulo="Certificado" />

              <LinhaCheck
                texto="Este curso tem certificado"
                checked={form.tem_certificado}
                onChange={(checked) =>
                  setForm((prev) => ({ ...prev, tem_certificado: checked }))
                }
              />

              {form.tem_certificado ? (
                <>
                  <div style={grid2}>
                    <CampoSelect
                      label="Modo de certificado"
                      value={form.modo_certificado}
                      onChange={(valor) =>
                        setForm((prev) => ({ ...prev, modo_certificado: valor }))
                      }
                      options={[
                        { value: "manual", label: "Manual" },
                        { value: "automatico", label: "Automático" },
                      ]}
                    />

                    <CampoTexto
                      label="Carga horária"
                      value={form.horas_certificado}
                      onChange={(valor) =>
                        setForm((prev) => ({ ...prev, horas_certificado: valor }))
                      }
                    />
                  </div>

                  <CampoTextarea
                    label="Texto do certificado"
                    value={form.texto_certificado}
                    onChange={(valor) =>
                      setForm((prev) => ({ ...prev, texto_certificado: valor }))
                    }
                    rows={4}
                  />
                </>
              ) : null}

              <SectionTitle titulo="Publicação" />

              <LinhaCheck
                texto="Curso publicado"
                checked={form.publicado}
                onChange={(checked) =>
                  setForm((prev) => ({ ...prev, publicado: checked }))
                }
              />

              {sucesso ? <BlocoSucesso texto={sucesso} /> : null}
              {erro ? <BlocoErro texto={erro} /> : null}

              <div
                style={{
                  display: "flex",
                  gap: "12px",
                  flexWrap: "wrap",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                  <button type="submit" style={botaoPrimario} disabled={saving}>
                    {saving ? "A guardar..." : "Guardar alterações"}
                  </button>

                  <Link
                    href={`/formadores/cursos/${curso.id}/estrutura`}
                    style={botaoSecundario}
                  >
                    Gerir estrutura
                  </Link>
                </div>

                <button
                  type="button"
                  onClick={() => void apagarCurso()}
                  style={botaoPerigo}
                  disabled={apagandoCurso}
                >
                  {apagandoCurso ? "A apagar curso..." : "Apagar curso"}
                </button>
              </div>
            </form>
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
          fontSize: "34px",
          color: "#f0d79a",
          lineHeight: 1.1,
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

function ActionCard({
  titulo,
  texto,
  actions,
}: {
  titulo: string;
  texto: string;
  actions: React.ReactNode;
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
        display: "flex",
        flexDirection: "column",
        gap: "14px",
      }}
    >
      <h3
        style={{
          margin: 0,
          fontFamily: "Cinzel, serif",
          fontSize: "28px",
          color: "#f0d79a",
          fontWeight: 500,
        }}
      >
        {titulo}
      </h3>

      <p
        style={{
          margin: 0,
          fontSize: "20px",
          lineHeight: 1.75,
          color: "#d7b06c",
          flex: 1,
        }}
      >
        {texto}
      </p>

      <div>{actions}</div>
    </article>
  );
}

function SectionTitle({ titulo }: { titulo: string }) {
  return (
    <h2
      style={{
        margin: "0 0 -4px 0",
        fontFamily: "Cinzel, serif",
        fontSize: "30px",
        color: "#f0d79a",
        fontWeight: 500,
      }}
    >
      {titulo}
    </h2>
  );
}

function CampoTexto({
  label,
  value,
  onChange,
  type = "text",
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (valor: string) => void;
  type?: string;
  disabled?: boolean;
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
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: "100%",
          padding: "14px 14px",
          background: disabled ? "rgba(26,16,12,0.55)" : "#1a100c",
          border: "1px solid #8a5d31",
          color: "#e6c27a",
          fontSize: "18px",
          outline: "none",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03)",
          opacity: disabled ? 0.75 : 1,
        }}
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
        value={value}
        rows={rows}
        onChange={(e) => onChange(e.target.value)}
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
        padding: "30px",
        boxShadow:
          "0 16px 40px rgba(0,0,0,0.26), inset 0 1px 0 rgba(255,225,170,0.04)",
        textAlign: "center",
      }}
    >
      <p
        style={{
          margin: 0,
          fontSize: "22px",
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
        padding: "20px",
        color: "#ffb4b4",
        fontSize: "20px",
        lineHeight: 1.7,
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
        padding: "20px",
        color: "#bff1bf",
        fontSize: "20px",
        lineHeight: 1.7,
      }}
    >
      {texto}
    </section>
  );
}

const grid2: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
  gap: "16px",
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