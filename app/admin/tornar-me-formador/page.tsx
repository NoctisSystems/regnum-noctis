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
        background: "#2b160f",
        color: "#e6c27a",
        fontFamily: "Cormorant Garamond, serif",
        padding: "60px 20px 80px 20px",
      }}
    >
      <section
        style={{
          maxWidth: "1150px",
          margin: "0 auto",
          textAlign: "center",
          padding: "10px 0 40px 0",
          background:
            "radial-gradient(circle at center, rgba(106,58,27,0.28) 0%, rgba(43,22,15,0) 68%)",
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
          Vitrine de Formadores
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

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "14px",
            marginBottom: "28px",
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
            fontSize: "24px",
            lineHeight: "1.75",
            color: "#d7b06c",
            maxWidth: "980px",
            margin: "0 auto",
          }}
        >
          Conhece os formadores presentes na plataforma e explora as áreas de
          ensino disponíveis dentro do Regnum Noctis.
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
              Brevemente disponível
            </h2>

            <p
              style={{
                fontSize: "22px",
                lineHeight: "1.7",
                color: "#d7b06c",
                margin: 0,
              }}
            >
              A vitrine de formadores será preenchida assim que existirem
              perfis aprovados e publicados na plataforma.
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
                  transition: "all 0.35s ease",
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