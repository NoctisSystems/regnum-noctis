import Link from "next/link";
import { supabase } from "@/lib/supabase";

type Curso = {
  id: string;
  titulo: string | null;
  descricao: string | null;
  preco: number | null;
  tipo: string | null;
  publicado: boolean | null;
  capa_url: string | null;
};

type Formador = {
  id: string;
  nome: string | null;
  bio_curta: string | null;
  area_ensino: string | null;
  foto_url: string | null;
  status: string | null;
};

const FORMADOR_FIXO_ID = "1";
const TOTAL_FORMADORES_EM_DESTAQUE = 4;

export default async function CursosPage() {
  let cursos: Curso[] = [];
  let formadores: Formador[] = [];
  let cursosError = "";
  let formadoresError = "";

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";

  try {
    const { data, error } = await supabase
      .from("cursos")
      .select("id, titulo, descricao, preco, tipo, publicado, capa_url")
      .eq("publicado", true)
      .order("created_at", { ascending: false });

    if (error) {
      cursosError = error.message;
    } else {
      cursos = (data || []) as Curso[];
    }
  } catch (error: any) {
    cursosError = error?.message || "Erro ao carregar cursos.";
  }

  try {
    const { data, error } = await supabase
      .from("formadores")
      .select("id, nome, bio_curta, area_ensino, foto_url, status")
      .eq("status", "aprovado")
      .order("nome", { ascending: true });

    if (error) {
      formadoresError = error.message;
    } else {
      formadores = (data || []) as Formador[];
    }
  } catch (error: any) {
    formadoresError = error?.message || "Erro ao carregar formadores.";
  }

  const formadorFixo =
    formadores.find((formador) => formador.id === FORMADOR_FIXO_ID) || null;

  const restantesFormadores = formadores.filter(
    (formador) => formador.id !== formadorFixo?.id
  );

  const formadoresDinamicos = baralharArray(restantesFormadores).slice(
    0,
    Math.max(TOTAL_FORMADORES_EM_DESTAQUE - (formadorFixo ? 1 : 0), 0)
  );

  const formadoresEmDestaque = formadorFixo
    ? [formadorFixo, ...formadoresDinamicos]
    : formadoresDinamicos;

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#2b160f",
        color: "#e6c27a",
        fontFamily: "Cormorant Garamond, serif",
        paddingTop: "60px",
        paddingRight: "20px",
        paddingBottom: "90px",
        paddingLeft: "20px",
      }}
    >
      <section
        style={{
          maxWidth: "1150px",
          margin: "0 auto 50px auto",
          textAlign: "center",
          padding: "10px 20px 50px 20px",
          background:
            "radial-gradient(circle at center, rgba(106,58,27,0.30) 0%, rgba(43,22,15,0) 68%)",
        }}
      >
        <p
          style={{
            letterSpacing: "3px",
            textTransform: "uppercase",
            color: "#caa15a",
            fontSize: "16px",
            margin: "0 0 16px 0",
          }}
        >
          Catálogo de Aprendizagem
        </p>

        <h1
          style={{
            fontFamily: "Cinzel, serif",
            fontSize: "clamp(42px, 6vw, 64px)",
            fontWeight: 500,
            margin: "0 0 18px 0",
            color: "#e6c27a",
          }}
        >
          Cursos
        </h1>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "14px",
            margin: "0 0 28px 0",
          }}
        >
          <div
            style={{
              width: "180px",
              height: "1px",
              background: "#a6783d",
            }}
          />
          <div
            style={{
              width: "10px",
              height: "10px",
              borderRadius: "999px",
              background: "#a6783d",
            }}
          />
          <div
            style={{
              width: "180px",
              height: "1px",
              background: "#a6783d",
            }}
          />
        </div>

        <p
          style={{
            fontSize: "clamp(22px, 2.4vw, 28px)",
            lineHeight: "1.75",
            color: "#e6c27a",
            maxWidth: "980px",
            margin: "0 auto",
          }}
        >
          Explora os percursos disponíveis no Regnum Noctis e encontra formação
          estruturada nas áreas da espiritualidade, dos sistemas oraculares, das
          práticas mágicas e dos caminhos iniciáticos.
        </p>
      </section>

      <section
        style={{
          padding: "0 20px 26px 20px",
        }}
      >
        <div
          style={{
            maxWidth: "1150px",
            margin: "0 auto",
          }}
        >
          <div
            style={{
              border: "1px solid #8a5d31",
              background: "#140d09",
              padding: "34px 30px",
              boxShadow: "0 10px 30px rgba(0,0,0,0.22)",
              marginBottom: "26px",
            }}
          >
            <h2
              style={{
                fontFamily: "Cinzel, serif",
                fontSize: "clamp(28px, 4vw, 40px)",
                margin: "0 0 14px 0",
                color: "#e6c27a",
              }}
            >
              Percursos disponíveis
            </h2>

            <p
              style={{
                fontSize: "22px",
                lineHeight: "1.75",
                color: "#d7b06c",
                margin: 0,
              }}
            >
              Aqui encontrarás cursos organizados com base, profundidade e
              aplicação prática. À medida que a plataforma crescer, esta área
              passará a reunir o catálogo completo disponível para alunos.
            </p>
          </div>

          {cursosError ? (
            <div
              style={{
                border: "1px solid rgba(239,68,68,0.28)",
                background: "rgba(239,68,68,0.08)",
                color: "#fecaca",
                padding: "16px 18px",
              }}
            >
              Erro ao carregar cursos: {cursosError}
            </div>
          ) : cursos.length === 0 ? (
            <div
              style={{
                border: "1px solid #8a5d31",
                background: "#140d09",
                padding: "38px 30px",
                textAlign: "center",
              }}
            >
              <h3
                style={{
                  fontFamily: "Cinzel, serif",
                  fontSize: "34px",
                  margin: "0 0 14px 0",
                  color: "#e6c27a",
                }}
              >
                Catálogo em expansão
              </h3>

              <p
                style={{
                  fontSize: "22px",
                  lineHeight: "1.75",
                  color: "#d7b06c",
                  margin: 0,
                }}
              >
                Os cursos serão apresentados aqui assim que estiverem publicados
                na plataforma.
              </p>
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                gap: "24px",
              }}
            >
              {cursos.map((curso) => {
                const capaSrc = construirUrlStorage({
                  supabaseUrl,
                  bucket: "curso_capas",
                  valor: curso.capa_url,
                });

                return (
                  <article
                    key={curso.id}
                    style={{
                      background:
                        "linear-gradient(180deg, rgba(20,13,9,1) 0%, rgba(17,10,8,1) 100%)",
                      border: "1px solid #8a5d31",
                      minHeight: "430px",
                      boxShadow: "0 10px 30px rgba(0,0,0,0.22)",
                      display: "flex",
                      flexDirection: "column",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: "100%",
                        height: "220px",
                        borderBottom: "1px solid #8a5d31",
                        background:
                          "radial-gradient(circle at top, rgba(212,175,55,0.08), transparent 45%), #1a100c",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#b9a773",
                        overflow: "hidden",
                      }}
                    >
                      {capaSrc ? (
                        <img
                          src={capaSrc}
                          alt={curso.titulo || "Curso"}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            display: "block",
                          }}
                        />
                      ) : (
                        <span
                          style={{
                            fontSize: "18px",
                            color: "#b9a773",
                          }}
                        >
                          Capa do curso
                        </span>
                      )}
                    </div>

                    <div
                      style={{
                        padding: "24px",
                        display: "flex",
                        flexDirection: "column",
                        flex: 1,
                      }}
                    >
                      <p
                        style={{
                          letterSpacing: "1.5px",
                          textTransform: "uppercase",
                          color: "#caa15a",
                          fontSize: "13px",
                          margin: "0 0 10px 0",
                        }}
                      >
                        {curso.tipo || "Curso"}
                      </p>

                      <h3
                        style={{
                          fontFamily: "Cinzel, serif",
                          fontSize: "28px",
                          margin: "0 0 14px 0",
                          color: "#e6c27a",
                          lineHeight: 1.2,
                        }}
                      >
                        {curso.titulo || "Curso sem título"}
                      </h3>

                      <p
                        style={{
                          fontSize: "19px",
                          lineHeight: "1.7",
                          color: "#d7b06c",
                          margin: "0 0 18px 0",
                          flex: 1,
                        }}
                      >
                        {limitarTexto(
                          curso.descricao || "Descrição em atualização.",
                          180
                        )}
                      </p>

                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: "12px",
                          flexWrap: "wrap",
                        }}
                      >
                        <span
                          style={{
                            fontSize: "22px",
                            color: "#f0d38b",
                          }}
                        >
                          {typeof curso.preco === "number"
                            ? `${curso.preco.toFixed(2)} €`
                            : "Preço em atualização"}
                        </span>

                        <Link href={`/cursos/${curso.id}`} style={botaoCard}>
                          Ver curso
                        </Link>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <section
        style={{
          padding: "0 20px 34px 20px",
        }}
      >
        <div
          style={{
            maxWidth: "1150px",
            margin: "0 auto",
            border: "1px solid #8a5d31",
            background: "#140d09",
            padding: "28px 30px",
            boxShadow: "0 10px 30px rgba(0,0,0,0.22)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
              gap: "20px",
              flexWrap: "wrap",
              marginBottom: "20px",
            }}
          >
            <div>
              <p
                style={{
                  letterSpacing: "2px",
                  textTransform: "uppercase",
                  color: "#caa15a",
                  fontSize: "14px",
                  margin: "0 0 10px 0",
                }}
              >
                Formadores da Plataforma
              </p>

              <h2
                style={{
                  fontFamily: "Cinzel, serif",
                  fontSize: "clamp(24px, 3vw, 34px)",
                  margin: "0 0 10px 0",
                  color: "#e6c27a",
                }}
              >
                Conhece alguns dos nossos formadores
              </h2>

              <p
                style={{
                  fontSize: "19px",
                  lineHeight: "1.7",
                  color: "#d7b06c",
                  maxWidth: "760px",
                  margin: 0,
                }}
              >
                Descobre quem ensina na plataforma e explora depois a vitrine
                completa para conheceres melhor cada percurso.
              </p>
            </div>

            <Link href="/vitrine-formadores" style={botaoSecundario}>
              Ver vitrine completa
            </Link>
          </div>

          {formadoresError ? (
            <div
              style={{
                border: "1px solid rgba(239,68,68,0.28)",
                background: "rgba(239,68,68,0.08)",
                color: "#fecaca",
                padding: "16px 18px",
              }}
            >
              Erro ao carregar formadores: {formadoresError}
            </div>
          ) : formadoresEmDestaque.length === 0 ? (
            <div
              style={{
                border: "1px solid rgba(138,93,49,0.7)",
                background: "#120b08",
                padding: "22px 20px",
              }}
            >
              <p
                style={{
                  fontSize: "19px",
                  lineHeight: "1.7",
                  color: "#d7b06c",
                  margin: 0,
                }}
              >
                A vitrine de formadores será apresentada aqui à medida que forem
                aprovados e publicados novos perfis.
              </p>
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
                gap: "16px",
              }}
            >
              {formadoresEmDestaque.map((formador) => {
                const fotoSrc = construirUrlStorage({
                  supabaseUrl,
                  bucket: "formadores-fotos",
                  valor: formador.foto_url,
                });

                return (
                  <article
                    key={formador.id}
                    style={{
                      border: "1px solid rgba(138,93,49,0.7)",
                      background:
                        "linear-gradient(180deg, rgba(18,11,8,1) 0%, rgba(16,10,8,1) 100%)",
                      padding: "18px 16px",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      textAlign: "center",
                      minHeight: "250px",
                    }}
                  >
                    <div
                      style={{
                        width: "88px",
                        height: "88px",
                        borderRadius: "999px",
                        border: "1px solid #8a5d31",
                        background:
                          "radial-gradient(circle at top, rgba(212,175,55,0.08), transparent 45%), #1a100c",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#b9a773",
                        overflow: "hidden",
                        marginBottom: "14px",
                        flexShrink: 0,
                      }}
                    >
                      {fotoSrc ? (
                        <img
                          src={fotoSrc}
                          alt={formador.nome || "Formador"}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            display: "block",
                          }}
                        />
                      ) : (
                        <span
                          style={{
                            fontSize: "13px",
                            padding: "8px",
                            lineHeight: 1.3,
                          }}
                        >
                          Sem foto
                        </span>
                      )}
                    </div>

                    <h3
                      style={{
                        fontFamily: "Cinzel, serif",
                        fontSize: "21px",
                        margin: "0 0 14px 0",
                        color: "#e6c27a",
                        lineHeight: 1.25,
                      }}
                    >
                      {formador.nome || "Formador"}
                    </h3>

                    <div style={{ marginTop: "auto" }}>
                      <Link
                        href={`/vitrine-formadores/${formador.id}`}
                        style={botaoMiniPerfil}
                      >
                        Ver perfil
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <section
        style={{
          padding: "0 20px 0 20px",
        }}
      >
        <div
          style={{
            maxWidth: "1150px",
            margin: "0 auto",
            border: "1px solid #8a5d31",
            background:
              "linear-gradient(180deg, rgba(20,13,9,1) 0%, rgba(26,16,12,1) 100%)",
            padding: "34px 30px",
            textAlign: "center",
            boxShadow: "0 10px 30px rgba(0,0,0,0.22)",
          }}
        >
          <h2
            style={{
              fontFamily: "Cinzel, serif",
              fontSize: "clamp(28px, 4vw, 40px)",
              margin: "0 0 16px 0",
              color: "#e6c27a",
            }}
          >
            Um catálogo pensado para aprofundar
          </h2>

          <p
            style={{
              fontSize: "22px",
              lineHeight: "1.8",
              color: "#d7b06c",
              maxWidth: "900px",
              margin: "0 auto",
            }}
          >
            O Regnum Noctis não reúne conteúdos para consumo rápido. Reúne
            percursos organizados para quem quer estudar com seriedade, prática e
            sentido de direção.
          </p>
        </div>
      </section>
    </main>
  );
}

function construirUrlStorage({
  supabaseUrl,
  bucket,
  valor,
}: {
  supabaseUrl: string;
  bucket: string;
  valor: string | null;
}) {
  if (!valor) return null;

  const valorLimpo = valor.trim();

  if (!valorLimpo) return null;

  if (
    valorLimpo.startsWith("http://") ||
    valorLimpo.startsWith("https://")
  ) {
    return valorLimpo;
  }

  if (!supabaseUrl) return null;

  const caminho = valorLimpo.replace(/^\/+/, "");

  return `${supabaseUrl}/storage/v1/object/public/${bucket}/${caminho}`;
}

function limitarTexto(texto: string, max: number) {
  if (texto.length <= max) return texto;
  return `${texto.slice(0, max).trim()}...`;
}

function baralharArray<T>(array: T[]) {
  const copia = [...array];

  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }

  return copia;
}

const botaoCard = {
  textDecoration: "none",
  border: "1px solid #a6783d",
  color: "#e6c27a",
  paddingTop: "12px",
  paddingRight: "18px",
  paddingBottom: "12px",
  paddingLeft: "18px",
  fontSize: "18px",
  display: "inline-block",
  background: "transparent",
};

const botaoSecundario = {
  textDecoration: "none",
  border: "1px solid #a6783d",
  color: "#e6c27a",
  paddingTop: "12px",
  paddingRight: "18px",
  paddingBottom: "12px",
  paddingLeft: "18px",
  fontSize: "18px",
  display: "inline-block",
  background: "transparent",
};

const botaoMiniPerfil = {
  textDecoration: "none",
  border: "1px solid #a6783d",
  color: "#e6c27a",
  paddingTop: "10px",
  paddingRight: "14px",
  paddingBottom: "10px",
  paddingLeft: "14px",
  fontSize: "16px",
  display: "inline-block",
  background: "transparent",
};