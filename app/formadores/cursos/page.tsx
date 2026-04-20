"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
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
};

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

function formatarPreco(
  precoEur?: number | null,
  precoBase?: number | null
): string {
  const valor =
    typeof precoEur === "number"
      ? precoEur
      : typeof precoBase === "number"
      ? precoBase
      : null;

  if (valor === null || Number.isNaN(valor)) {
    return "—";
  }

  return new Intl.NumberFormat("pt-PT", {
    style: "currency",
    currency: "EUR",
  }).format(valor);
}

export default function FormadorCursosPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [cursos, setCursos] = useState<Curso[]>([]);

  const encontrarFormadorComRecuperacao = useCallback(
    async (userId: string, userEmail: string | null | undefined) => {
      const { data: porAuthId } = await supabase
        .from("formadores")
        .select("id, nome, email, auth_id, status")
        .eq("auth_id", userId)
        .maybeSingle();

      if (porAuthId) {
        return porAuthId as Formador;
      }

      if (!userEmail) {
        return null;
      }

      const { data: porEmail } = await supabase
        .from("formadores")
        .select("id, nome, email, auth_id, status")
        .eq("email", userEmail)
        .maybeSingle();

      if (!porEmail) {
        return null;
      }

      if (!porEmail.auth_id) {
        const { error: updateError } = await supabase
          .from("formadores")
          .update({ auth_id: userId })
          .eq("id", porEmail.id);

        if (!updateError) {
          return {
            ...(porEmail as Formador),
            auth_id: userId,
          };
        }
      }

      return porEmail as Formador;
    },
    []
  );

  const carregarDados = useCallback(async () => {
    setLoading(true);
    setErro("");

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        router.replace("/formadores/login");
        return;
      }

      const formadorData = await encontrarFormadorComRecuperacao(
        user.id,
        user.email
      );

      if (!formadorData) {
        setErro(
          "Não foi possível encontrar o registo do formador associado à sessão atual."
        );
        setLoading(false);
        return;
      }

      if (formadorData.status !== "aprovado") {
        router.replace("/formadores/dashboard");
        return;
      }

      

      const { data: cursosData, error: cursosError } = await supabase
        .from("cursos")
        .select(
          "id, titulo, descricao, publicado, created_at, updated_at, capa_url, tipo_produto, preco, preco_eur, preco_brl"
        )
        .eq("formador_id", formadorData.id)
        .order("id", { ascending: false });

      if (cursosError) {
        setErro(cursosError.message || "Erro ao carregar cursos.");
        setLoading(false);
        return;
      }

      setCursos((cursosData || []) as Curso[]);
    } catch {
      setErro("Ocorreu um erro inesperado ao carregar os cursos.");
    } finally {
      setLoading(false);
    }
  }, [encontrarFormadorComRecuperacao, router]);

  useEffect(() => {
    void carregarDados();
  }, [carregarDados]);

  const totalCursos = useMemo(() => cursos.length, [cursos]);
  const totalPublicados = useMemo(
    () => cursos.filter((curso) => curso.publicado).length,
    [cursos]
  );
  const totalRascunhos = useMemo(
    () => cursos.filter((curso) => !curso.publicado).length,
    [cursos]
  );

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
                Os Meus Cursos
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
                Cada curso criado aparece automaticamente aqui em formato de
                card, para poderes entrar e gerir o conteúdo de forma direta.
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

              <Link href="/formadores/dashboard" style={botaoSecundario}>
                Voltar à dashboard
              </Link>

              <Link href="/formadores/criar-curso" style={botaoPrimario}>
                Criar novo curso
              </Link>
            </div>
          </div>
        </header>

        {loading ? (
          <BlocoMensagem texto="A carregar cursos..." />
        ) : erro ? (
          <BlocoErro texto={erro} />
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
                titulo="Total"
                valor={String(totalCursos)}
                subtitulo="Cursos criados"
              />
              <ResumoCard
                titulo="Rascunhos"
                valor={String(totalRascunhos)}
                subtitulo="Ainda não publicados"
              />
              <ResumoCard
                titulo="Publicados"
                valor={String(totalPublicados)}
                subtitulo="Disponíveis para venda"
              />
            </section>

            {cursos.length === 0 ? (
              <section
                style={{
                  border: "1px dashed rgba(166,120,61,0.35)",
                  background:
                    "linear-gradient(180deg, rgba(20,13,9,0.98) 0%, rgba(16,10,8,0.98) 100%)",
                  padding: "36px 24px",
                  textAlign: "center",
                  boxShadow:
                    "0 18px 42px rgba(0,0,0,0.24), inset 0 1px 0 rgba(255,225,170,0.03)",
                }}
              >
                <h2
                  style={{
                    margin: "0 0 12px 0",
                    fontFamily: "Cinzel, serif",
                    fontSize: "clamp(28px, 4vw, 38px)",
                    color: "#f0d79a",
                    fontWeight: 500,
                  }}
                >
                  Ainda não tens cursos criados
                </h2>

                <p
                  style={{
                    margin: "0 auto",
                    maxWidth: "760px",
                    fontSize: "clamp(20px, 2.3vw, 24px)",
                    lineHeight: 1.75,
                    color: "#d7b06c",
                  }}
                >
                  Assim que criares o teu primeiro curso, ele aparecerá
                  automaticamente aqui em formato de card para poderes entrar e
                  gerir a respetiva estrutura.
                </p>

                <div style={{ marginTop: "24px" }}>
                  <Link href="/formadores/criar-curso" style={botaoPrimario}>
                    Criar primeiro curso
                  </Link>
                </div>
              </section>
            ) : (
              <section
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(290px, 1fr))",
                  gap: "18px",
                }}
              >
                {cursos.map((curso) => (
                  <article
                    key={curso.id}
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
                      minHeight: "320px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        gap: "12px",
                      }}
                    >
                      <h2
                        style={{
                          margin: 0,
                          fontFamily: "Cinzel, serif",
                          fontSize: "clamp(25px, 3vw, 30px)",
                          lineHeight: 1.2,
                          color: "#f0d79a",
                          fontWeight: 500,
                        }}
                      >
                        {curso.titulo?.trim() || "Curso sem título"}
                      </h2>

                      <span
                        style={{
                          border: curso.publicado
                            ? "1px solid rgba(74,222,128,0.35)"
                            : "1px solid rgba(166,120,61,0.45)",
                          background: curso.publicado
                            ? "rgba(20,90,40,0.18)"
                            : "rgba(43,22,15,0.7)",
                          color: curso.publicado ? "#c8ffd7" : "#f0dfbf",
                          padding: "6px 10px",
                          fontSize: "13px",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {curso.publicado ? "Publicado" : "Rascunho"}
                      </span>
                    </div>

                    <p
                      style={{
                        margin: 0,
                        fontSize: "20px",
                        lineHeight: 1.75,
                        color: "#d7b06c",
                        flex: 1,
                      }}
                    >
                      {curso.descricao?.trim() || "Sem descrição."}
                    </p>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "repeat(auto-fit, minmax(130px, 1fr))",
                        gap: "12px",
                      }}
                    >
                      <MiniInfo
                        rotulo="Preço EUR"
                        valor={formatarPreco(curso.preco_eur, curso.preco)}
                      />
                      <MiniInfo
                        rotulo="Criado em"
                        valor={formatarData(curso.created_at)}
                      />
                      <MiniInfo
                        rotulo="Atualizado em"
                        valor={formatarData(curso.updated_at)}
                      />
                    </div>

                    <div
                      style={{
                        display: "flex",
                        gap: "12px",
                        flexWrap: "wrap",
                        marginTop: "4px",
                      }}
                    >
                      <Link
                        href={`/formadores/cursos/${curso.id}`}
                        style={botaoPrimario}
                      >
                        Gerir curso
                      </Link>

                      <Link
                        href={`/formadores/cursos/${curso.id}/estrutura`}
                        style={botaoSecundario}
                      >
                        Estrutura
                      </Link>
                    </div>
                  </article>
                ))}
              </section>
            )}
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
          fontSize: "44px",
          color: "#f0d79a",
          lineHeight: 1,
        }}
      >
        {valor}
      </p>

      <p
        style={{
          margin: 0,
          fontSize: "20px",
          color: "#d7b06c",
          lineHeight: 1.6,
        }}
      >
        {subtitulo}
      </p>
    </article>
  );
}

function MiniInfo({
  rotulo,
  valor,
}: {
  rotulo: string;
  valor: string;
}) {
  return (
    <div
      style={{
        border: "1px solid rgba(166,120,61,0.22)",
        background: "rgba(32,18,13,0.45)",
        padding: "12px 14px",
      }}
    >
      <p
        style={{
          margin: "0 0 6px 0",
          fontSize: "13px",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "#caa15a",
        }}
      >
        {rotulo}
      </p>

      <p
        style={{
          margin: 0,
          fontSize: "18px",
          lineHeight: 1.5,
          color: "#f0dfbf",
        }}
      >
        {valor}
      </p>
    </div>
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
        padding: "24px",
        color: "#ffb4b4",
        fontSize: "20px",
        lineHeight: 1.7,
      }}
    >
      {texto}
    </section>
  );
}

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