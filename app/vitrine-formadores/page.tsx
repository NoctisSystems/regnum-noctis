import Link from "next/link";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

type Formador = {
  id: number;
  nome: string | null;
  bio_curta: string | null;
  foto_url: string | null;
  status: string | null;
};

function construirFotoSrc(fotoUrl: string | null, supabaseUrl: string) {
  if (!fotoUrl) return null;

  const valor = fotoUrl.trim();

  if (!valor) return null;

  if (valor.startsWith("http://") || valor.startsWith("https://")) {
    return valor;
  }

  return `${supabaseUrl}/storage/v1/object/public/formadores-fotos/${valor.replace(
    /^\/+/,
    ""
  )}`;
}

export default async function VitrineFormadoresPage() {
  const supabaseAdmin = getSupabaseAdmin();

  const { data, error } = await supabaseAdmin
    .from("formadores")
    .select("id, nome, bio_curta, foto_url, status")
    .eq("status", "aprovado")
    .order("nome", { ascending: true });

  const formadores = (data || []) as Formador[];
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top, rgba(166,120,61,0.08), transparent 20%), #2b160f",
        color: "#e6c27a",
        fontFamily: "Cormorant Garamond, serif",
        padding: "60px 16px 90px",
      }}
    >
      <section
        style={{
          maxWidth: "1280px",
          margin: "0 auto 36px auto",
          textAlign: "center",
        }}
      >
        <h1
          style={{
            fontFamily: "Cinzel, serif",
            fontSize: "clamp(34px, 6vw, 62px)",
            margin: "0 0 14px 0",
            color: "#f0d79a",
            lineHeight: 1.1,
          }}
        >
          Formadores
        </h1>

        <p
          style={{
            margin: 0,
            fontSize: "clamp(18px, 2.4vw, 24px)",
            lineHeight: 1.7,
            color: "#d7b06c",
          }}
        >
          Conhece os formadores do Regnum Noctis
        </p>
      </section>

      <section
        style={{
          maxWidth: "1280px",
          margin: "0 auto",
        }}
      >
        {error ? (
          <div
            style={{
              border: "1px solid rgba(239,68,68,0.28)",
              background: "rgba(239,68,68,0.08)",
              color: "#fecaca",
              padding: "18px",
              textAlign: "center",
            }}
          >
            Erro ao carregar formadores: {error.message}
          </div>
        ) : formadores.length === 0 ? (
          <div
            style={{
              border: "1px solid #8a5d31",
              background: "#140d09",
              padding: "28px",
              textAlign: "center",
            }}
          >
            <h2
              style={{
                fontFamily: "Cinzel, serif",
                fontSize: "clamp(26px, 4vw, 32px)",
                margin: "0 0 14px 0",
                color: "#e6c27a",
              }}
            >
              Ainda não existem formadores publicados
            </h2>

            <p
              style={{
                margin: 0,
                fontSize: "clamp(18px, 2.1vw, 21px)",
                lineHeight: 1.7,
                color: "#d7b06c",
              }}
            >
              Os perfis aparecerão aqui assim que forem aprovados e publicados.
            </p>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 260px))",
              justifyContent: "center",
              gap: "22px",
            }}
          >
            {formadores.map((formador) => {
              const fotoSrc = construirFotoSrc(formador.foto_url, supabaseUrl);

              return (
                <article
                  key={formador.id}
                  style={{
                    width: "100%",
                    maxWidth: "260px",
                    background:
                      "linear-gradient(180deg, rgba(20,13,9,0.98) 0%, rgba(16,10,8,0.98) 100%)",
                    border: "1px solid rgba(166,120,61,0.45)",
                    boxShadow: "0 10px 24px rgba(0,0,0,0.24)",
                    padding: "14px",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <div
                    style={{
                      width: "100%",
                      height: "300px",
                      overflow: "hidden",
                      background: "#1a100c",
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
                      <div
                        style={{
                          width: "100%",
                          height: "100%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#a6783d",
                          fontSize: "18px",
                          textAlign: "center",
                          padding: "20px",
                        }}
                      >
                        Sem fotografia
                      </div>
                    )}
                  </div>

                  <h2
                    style={{
                      fontFamily: "Cinzel, serif",
                      fontSize: "22px",
                      lineHeight: 1.2,
                      textAlign: "center",
                      margin: "0 0 12px 0",
                      color: "#e6c27a",
                      minHeight: "54px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {formador.nome || "Formador"}
                  </h2>

                  <p
                    style={{
                      margin: "0 0 16px 0",
                      textAlign: "center",
                      fontSize: "17px",
                      lineHeight: 1.6,
                      color: "#d7b06c",
                      minHeight: "82px",
                    }}
                  >
                    {limitarTexto(
                      formador.bio_curta || "Perfil em atualização.",
                      110
                    )}
                  </p>

                  <Link
                    href={`/vitrine-formadores/${formador.id}`}
                    style={{
                      display: "block",
                      textAlign: "center",
                      textDecoration: "none",
                      border: "1px solid #a6783d",
                      color: "#e6c27a",
                      padding: "12px 14px",
                      fontSize: "14px",
                      fontWeight: 700,
                      background: "transparent",
                      textTransform: "uppercase",
                      letterSpacing: "0.04em",
                    }}
                  >
                    Ver perfil
                  </Link>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}

function limitarTexto(texto: string, max: number) {
  if (texto.length <= max) return texto;
  return `${texto.slice(0, max).trim()}...`;
}