import { supabase } from "@/lib/supabase";

type Formador = {
  id: string;
  nome: string;
  bio: string | null;
  area_ensino: string | null;
  portfolio: string | null;
  redes_sociais: string | null;
  status: string;
};

export default async function FormadoresPage() {
  const { data, error } = await supabase
    .from("formadores")
    .select("id, nome, bio, area_ensino, portfolio, redes_sociais, status")
    .eq("status", "aprovado")
    .order("nome", { ascending: true });

  const formadores = (data || []) as Formador[];

  return (
    <main
      style={{
        minHeight: "100vh",
        color: "#e6c27a",
        fontFamily: "Cormorant Garamond, serif",
      }}
    >
      <section
        style={{
          maxWidth: "1150px",
          margin: "0 auto",
          padding: "10px 0 34px 0",
        }}
      >
        <p
          style={{
            letterSpacing: "3px",
            textTransform: "uppercase",
            color: "#caa15a",
            fontSize: "18px",
            marginBottom: "16px",
          }}
        >
          Administração
        </p>

        <h1
          style={{
            fontFamily: "Cinzel, serif",
            fontSize: "58px",
            fontWeight: 500,
            margin: "0 0 18px 0",
            color: "#e6c27a",
          }}
        >
          Formadores
        </h1>

        <p
          style={{
            fontSize: "24px",
            lineHeight: "1.75",
            color: "#d7b06c",
            maxWidth: "980px",
            margin: 0,
          }}
        >
          Aqui tens a lista dos formadores já aprovados e visíveis na
          plataforma.
        </p>
      </section>

      <section
        style={{
          maxWidth: "1150px",
          margin: "0 auto",
        }}
      >
        {error ? (
          <div
            style={{
              border: "1px solid #8a5d31",
              background: "#140d09",
              padding: "30px",
              textAlign: "center",
              color: "#f0c9c9",
            }}
          >
            Ocorreu um erro ao carregar os formadores.
          </div>
        ) : formadores.length === 0 ? (
          <div
            style={{
              border: "1px solid #8a5d31",
              background: "#140d09",
              padding: "40px",
              textAlign: "center",
            }}
          >
            <h2
              style={{
                fontFamily: "Cinzel, serif",
                fontSize: "34px",
                marginTop: 0,
                marginBottom: "14px",
                color: "#e6c27a",
              }}
            >
              Ainda não existem formadores aprovados
            </h2>

            <p
              style={{
                fontSize: "22px",
                lineHeight: "1.7",
                color: "#d7b06c",
                margin: 0,
              }}
            >
              Assim que aprovares candidaturas, os formadores aparecerão aqui.
            </p>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "26px",
            }}
          >
            {formadores.map((formador) => (
              <article
                key={formador.id}
                style={{
                  background: "#140d09",
                  border: "1px solid #8a5d31",
                  padding: "26px",
                  minHeight: "360px",
                  boxShadow: "0 10px 30px rgba(0,0,0,0.22)",
                }}
              >
                <div
                  style={{
                    width: "100%",
                    height: "180px",
                    border: "1px solid #8a5d31",
                    background:
                      "radial-gradient(circle at top, rgba(212,175,55,0.08), transparent 45%), #1a100c",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#b9a773",
                    marginBottom: "18px",
                  }}
                >
                  Foto do Formador
                </div>

                <h2
                  style={{
                    fontFamily: "Cinzel, serif",
                    fontSize: "30px",
                    marginTop: 0,
                    marginBottom: "12px",
                    color: "#e6c27a",
                  }}
                >
                  {formador.nome}
                </h2>

                {formador.area_ensino && (
                  <p
                    style={{
                      fontSize: "18px",
                      letterSpacing: "1px",
                      textTransform: "uppercase",
                      color: "#caa15a",
                      marginTop: 0,
                      marginBottom: "14px",
                    }}
                  >
                    {formador.area_ensino}
                  </p>
                )}

                <p
                  style={{
                    fontSize: "21px",
                    lineHeight: "1.7",
                    color: "#d7b06c",
                    marginTop: 0,
                    marginBottom: "18px",
                  }}
                >
                  {formador.bio || "Perfil em atualização."}
                </p>

                <div
                  style={{
                    display: "flex",
                    gap: "12px",
                    flexWrap: "wrap",
                    marginTop: "auto",
                  }}
                >
                  <a
                    href={formador.portfolio || "#"}
                    target={formador.portfolio ? "_blank" : undefined}
                    rel={formador.portfolio ? "noreferrer" : undefined}
                    style={{
                      textDecoration: "none",
                      border: "1px solid #a6783d",
                      color: "#e6c27a",
                      padding: "12px 18px",
                      fontSize: "18px",
                      display: "inline-block",
                      background: "transparent",
                    }}
                  >
                    Ver perfil
                  </a>

                  {formador.redes_sociais && (
                    <a
                      href={formador.redes_sociais}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        textDecoration: "none",
                        border: "1px solid #a6783d",
                        color: "#e6c27a",
                        padding: "12px 18px",
                        fontSize: "18px",
                        display: "inline-block",
                        background: "transparent",
                      }}
                    >
                      Redes sociais
                    </a>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}