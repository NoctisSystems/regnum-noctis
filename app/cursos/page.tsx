import { supabase } from "@/lib/supabase";

type Curso = {
  id: string;
  titulo: string | null;
  descricao: string | null;
  preco: number | null;
  tipo: string | null;
  publicado: boolean | null;
};

type Formador = {
  id: string;
  nome: string | null;
  bio: string | null;
  area_ensino: string | null;
  portfolio: string | null;
  redes_sociais: string | null;
  status: string | null;
};

export default async function CursosPage() {
  let cursos: Curso[] = [];
  let formadores: Formador[] = [];
  let cursosError = "";
  let formadoresError = "";

  try {
    const { data, error } = await supabase
      .from("cursos")
      .select("id, titulo, descricao, preco, tipo, publicado")
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
      .select("id, nome, bio, area_ensino, portfolio, redes_sociais, status")
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
      {/* HERO */}
      <section
        style={{
          maxWidth: "1150px",
          marginTop: "0",
          marginRight: "auto",
          marginBottom: "50px",
          marginLeft: "auto",
          textAlign: "center",
          paddingTop: "10px",
          paddingRight: "20px",
          paddingBottom: "50px",
          paddingLeft: "20px",
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
            marginTop: 0,
            marginRight: 0,
            marginBottom: "16px",
            marginLeft: 0,
          }}
        >
          Catálogo de Aprendizagem
        </p>

        <h1
          style={{
            fontFamily: "Cinzel, serif",
            fontSize: "clamp(42px, 6vw, 64px)",
            fontWeight: 500,
            marginTop: 0,
            marginRight: 0,
            marginBottom: "18px",
            marginLeft: 0,
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
            marginTop: 0,
            marginRight: 0,
            marginBottom: "28px",
            marginLeft: 0,
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
              color: "#a6783d",
              fontSize: "24px",
              lineHeight: 1,
            }}
          >
            ✦
          </div>
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
            marginTop: 0,
            marginRight: "auto",
            marginBottom: 0,
            marginLeft: "auto",
          }}
        >
          Explora os percursos disponíveis no Regnum Noctis e encontra formação
          estruturada nas áreas da espiritualidade, dos sistemas oraculares, das
          práticas mágicas e dos caminhos iniciáticos.
        </p>
      </section>

      {/* CURSOS */}
      <section
        style={{
          paddingTop: 0,
          paddingRight: "20px",
          paddingBottom: "34px",
          paddingLeft: "20px",
        }}
      >
        <div
          style={{
            maxWidth: "1150px",
            marginTop: 0,
            marginRight: "auto",
            marginBottom: 0,
            marginLeft: "auto",
          }}
        >
          <div
            style={{
              border: "1px solid #8a5d31",
              background: "#140d09",
              paddingTop: "34px",
              paddingRight: "30px",
              paddingBottom: "34px",
              paddingLeft: "30px",
              boxShadow: "0 10px 30px rgba(0,0,0,0.22)",
              marginTop: 0,
              marginRight: 0,
              marginBottom: "26px",
              marginLeft: 0,
            }}
          >
            <h2
              style={{
                fontFamily: "Cinzel, serif",
                fontSize: "clamp(28px, 4vw, 40px)",
                marginTop: 0,
                marginRight: 0,
                marginBottom: "14px",
                marginLeft: 0,
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
                marginTop: 0,
                marginRight: 0,
                marginBottom: 0,
                marginLeft: 0,
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
                paddingTop: "16px",
                paddingRight: "18px",
                paddingBottom: "16px",
                paddingLeft: "18px",
              }}
            >
              Erro ao carregar cursos: {cursosError}
            </div>
          ) : cursos.length === 0 ? (
            <div
              style={{
                border: "1px solid #8a5d31",
                background: "#140d09",
                paddingTop: "38px",
                paddingRight: "30px",
                paddingBottom: "38px",
                paddingLeft: "30px",
                textAlign: "center",
              }}
            >
              <h3
                style={{
                  fontFamily: "Cinzel, serif",
                  fontSize: "34px",
                  marginTop: 0,
                  marginRight: 0,
                  marginBottom: "14px",
                  marginLeft: 0,
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
                  marginTop: 0,
                  marginRight: 0,
                  marginBottom: 0,
                  marginLeft: 0,
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
              {cursos.map((curso) => (
                <article
                  key={curso.id}
                  style={{
                    background: "#140d09",
                    border: "1px solid #8a5d31",
                    paddingTop: "26px",
                    paddingRight: "24px",
                    paddingBottom: "26px",
                    paddingLeft: "24px",
                    minHeight: "340px",
                    boxShadow: "0 10px 30px rgba(0,0,0,0.22)",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <div
                    style={{
                      width: "100%",
                      height: "160px",
                      border: "1px solid #8a5d31",
                      background:
                        "radial-gradient(circle at top, rgba(212,175,55,0.08), transparent 45%), #1a100c",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#b9a773",
                      marginTop: 0,
                      marginRight: 0,
                      marginBottom: "18px",
                      marginLeft: 0,
                    }}
                  >
                    Capa do Curso
                  </div>

                  <p
                    style={{
                      letterSpacing: "1.5px",
                      textTransform: "uppercase",
                      color: "#caa15a",
                      fontSize: "14px",
                      marginTop: 0,
                      marginRight: 0,
                      marginBottom: "10px",
                      marginLeft: 0,
                    }}
                  >
                    {curso.tipo || "Curso"}
                  </p>

                  <h3
                    style={{
                      fontFamily: "Cinzel, serif",
                      fontSize: "28px",
                      marginTop: 0,
                      marginRight: 0,
                      marginBottom: "14px",
                      marginLeft: 0,
                      color: "#e6c27a",
                    }}
                  >
                    {curso.titulo || "Curso sem título"}
                  </h3>

                  <p
                    style={{
                      fontSize: "20px",
                      lineHeight: "1.7",
                      color: "#d7b06c",
                      marginTop: 0,
                      marginRight: 0,
                      marginBottom: "18px",
                      marginLeft: 0,
                      flex: 1,
                    }}
                  >
                    {curso.descricao || "Descrição em atualização."}
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

                    <a href="#" style={botaoCard}>
                      Ver curso
                    </a>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* FORMADORES */}
      <section
        style={{
          paddingTop: 0,
          paddingRight: "20px",
          paddingBottom: "34px",
          paddingLeft: "20px",
        }}
      >
        <div
          style={{
            maxWidth: "1150px",
            marginTop: 0,
            marginRight: "auto",
            marginBottom: 0,
            marginLeft: "auto",
            border: "1px solid #8a5d31",
            background: "#140d09",
            paddingTop: "34px",
            paddingRight: "30px",
            paddingBottom: "34px",
            paddingLeft: "30px",
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
              marginTop: 0,
              marginRight: 0,
              marginBottom: "24px",
              marginLeft: 0,
            }}
          >
            <div>
              <p
                style={{
                  letterSpacing: "2px",
                  textTransform: "uppercase",
                  color: "#caa15a",
                  fontSize: "14px",
                  marginTop: 0,
                  marginRight: 0,
                  marginBottom: "10px",
                  marginLeft: 0,
                }}
              >
                Formadores da Plataforma
              </p>

              <h2
                style={{
                  fontFamily: "Cinzel, serif",
                  fontSize: "clamp(28px, 4vw, 40px)",
                  marginTop: 0,
                  marginRight: 0,
                  marginBottom: "12px",
                  marginLeft: 0,
                  color: "#e6c27a",
                }}
              >
                Conhece os nossos formadores
              </h2>

              <p
                style={{
                  fontSize: "21px",
                  lineHeight: "1.75",
                  color: "#d7b06c",
                  maxWidth: "760px",
                  marginTop: 0,
                  marginRight: 0,
                  marginBottom: 0,
                  marginLeft: 0,
                }}
              >
                Explora os perfis dos formadores que integram o Regnum Noctis e
                conhece as áreas de ensino presentes na plataforma.
              </p>
            </div>

            <a href="/formadores" style={botaoSecundario}>
              Ver vitrine completa
            </a>
          </div>

          {formadoresError ? (
            <div
              style={{
                border: "1px solid rgba(239,68,68,0.28)",
                background: "rgba(239,68,68,0.08)",
                color: "#fecaca",
                paddingTop: "16px",
                paddingRight: "18px",
                paddingBottom: "16px",
                paddingLeft: "18px",
              }}
            >
              Erro ao carregar formadores: {formadoresError}
            </div>
          ) : formadores.length === 0 ? (
            <div
              style={{
                border: "1px solid rgba(138,93,49,0.7)",
                background: "#120b08",
                paddingTop: "26px",
                paddingRight: "22px",
                paddingBottom: "26px",
                paddingLeft: "22px",
              }}
            >
              <p
                style={{
                  fontSize: "21px",
                  lineHeight: "1.7",
                  color: "#d7b06c",
                  marginTop: 0,
                  marginRight: 0,
                  marginBottom: 0,
                  marginLeft: 0,
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
                gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                gap: "22px",
              }}
            >
              {formadores.slice(0, 3).map((formador) => (
                <article
                  key={formador.id}
                  style={{
                    border: "1px solid rgba(138,93,49,0.7)",
                    background: "#120b08",
                    paddingTop: "22px",
                    paddingRight: "20px",
                    paddingBottom: "22px",
                    paddingLeft: "20px",
                    minHeight: "300px",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <div
                    style={{
                      width: "100%",
                      height: "150px",
                      border: "1px solid #8a5d31",
                      background:
                        "radial-gradient(circle at top, rgba(212,175,55,0.08), transparent 45%), #1a100c",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#b9a773",
                      marginTop: 0,
                      marginRight: 0,
                      marginBottom: "16px",
                      marginLeft: 0,
                    }}
                  >
                    Foto do Formador
                  </div>

                  <h3
                    style={{
                      fontFamily: "Cinzel, serif",
                      fontSize: "26px",
                      marginTop: 0,
                      marginRight: 0,
                      marginBottom: "10px",
                      marginLeft: 0,
                      color: "#e6c27a",
                    }}
                  >
                    {formador.nome || "Formador"}
                  </h3>

                  <p
                    style={{
                      letterSpacing: "1px",
                      textTransform: "uppercase",
                      color: "#caa15a",
                      fontSize: "14px",
                      marginTop: 0,
                      marginRight: 0,
                      marginBottom: "12px",
                      marginLeft: 0,
                    }}
                  >
                    {formador.area_ensino || "Área em atualização"}
                  </p>

                  <p
                    style={{
                      fontSize: "20px",
                      lineHeight: "1.7",
                      color: "#d7b06c",
                      marginTop: 0,
                      marginRight: 0,
                      marginBottom: "16px",
                      marginLeft: 0,
                      flex: 1,
                    }}
                  >
                    {formador.bio || "Perfil em atualização."}
                  </p>

                  <a href="/formadores" style={botaoCard}>
                    Ver perfil
                  </a>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* BLOCO FINAL */}
      <section
        style={{
          paddingTop: 0,
          paddingRight: "20px",
          paddingBottom: "0",
          paddingLeft: "20px",
        }}
      >
        <div
          style={{
            maxWidth: "1150px",
            marginTop: 0,
            marginRight: "auto",
            marginBottom: 0,
            marginLeft: "auto",
            border: "1px solid #8a5d31",
            background:
              "linear-gradient(180deg, rgba(20,13,9,1) 0%, rgba(26,16,12,1) 100%)",
            paddingTop: "34px",
            paddingRight: "30px",
            paddingBottom: "34px",
            paddingLeft: "30px",
            textAlign: "center",
            boxShadow: "0 10px 30px rgba(0,0,0,0.22)",
          }}
        >
          <h2
            style={{
              fontFamily: "Cinzel, serif",
              fontSize: "clamp(28px, 4vw, 40px)",
              marginTop: 0,
              marginRight: 0,
              marginBottom: "16px",
              marginLeft: 0,
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
              marginTop: 0,
              marginRight: "auto",
              marginBottom: 0,
              marginLeft: "auto",
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