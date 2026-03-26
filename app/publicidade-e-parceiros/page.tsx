import Link from "next/link";
import { supabase } from "@/lib/supabase";

type PublicidadeParceiro = {
  id: number;
  nome: string;
  slug: string | null;
  tipo: string;
  plano: string;
  descricao_curta: string | null;
  descricao: string | null;
  imagem_url: string | null;
  link_url: string | null;
  email_contacto: string | null;
  whatsapp_contacto: string | null;
  estado: string;
  mostrar_na_home: boolean;
  ordem_home: number | null;
  destaque: boolean;
  data_inicio: string | null;
  data_fim: string | null;
  ativo: boolean;
  notas_admin: string | null;
  created_at: string;
  updated_at: string;
};

export default async function PublicidadeParceirosPage() {
  let registos: PublicidadeParceiro[] = [];
  let erro = "";

  try {
    const { data, error } = await supabase
      .from("publicidade_parceiros")
      .select("*")
      .eq("ativo", true)
      .eq("estado", "ativo")
      .order("destaque", { ascending: false })
      .order("ordem_home", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: false });

    if (error) {
      erro = error.message;
    } else {
      registos = (data || []) as PublicidadeParceiro[];
    }
  } catch (err: any) {
    erro = err?.message || "Não foi possível carregar a página.";
  }

  const destaques = registos.filter((item) => item.destaque);
  const restantes = registos.filter((item) => !item.destaque);

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
          margin: "0 auto 42px auto",
          textAlign: "center",
          padding: "10px 20px 44px 20px",
          background:
            "radial-gradient(circle at center, rgba(106,58,27,0.26) 0%, rgba(43,22,15,0) 68%)",
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
          Regnum Noctis
        </p>

        <h1
          style={{
            fontFamily: "Cinzel, serif",
            fontSize: "clamp(40px, 5vw, 62px)",
            fontWeight: 500,
            margin: "0 0 18px 0",
            color: "#e6c27a",
            lineHeight: 1.08,
          }}
        >
          Publicidade e Parceiros
        </h1>

        <p
          style={{
            fontSize: "clamp(22px, 2.4vw, 28px)",
            lineHeight: "1.75",
            color: "#d7b06c",
            maxWidth: "980px",
            margin: "0 auto 26px auto",
          }}
        >
          Conhece marcas, projetos, serviços e parceiros que marcam presença no
          ecossistema do Regnum Noctis.
        </p>

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "14px",
            flexWrap: "wrap",
          }}
        >
          <a href="#destaques" style={botaoPrincipal}>
            Ver destaques
          </a>

          <a href="#listagem" style={botaoSecundario}>
            Ver listagem completa
          </a>

          <Link href="/publicidade" style={botaoSecundario}>
            Divulgar no Regnum Noctis
          </Link>
        </div>
      </section>

      {erro ? (
        <section
          style={{
            maxWidth: "1150px",
            margin: "0 auto 24px auto",
          }}
        >
          <div
            style={{
              border: "1px solid rgba(255,107,107,0.35)",
              background: "rgba(120,20,20,0.12)",
              padding: "16px 18px",
              color: "#ffb4b4",
              fontSize: "18px",
              lineHeight: 1.6,
            }}
          >
            Erro ao carregar publicidade e parceiros: {erro}
          </div>
        </section>
      ) : null}

      {destaques.length > 0 ? (
        <section
          id="destaques"
          style={{
            maxWidth: "1150px",
            margin: "0 auto 34px auto",
          }}
        >
          <div
            style={{
              marginBottom: "22px",
              textAlign: "center",
            }}
          >
            <p
              style={{
                letterSpacing: "2px",
                textTransform: "uppercase",
                color: "#caa15a",
                fontSize: "14px",
                margin: "0 0 10px 0",
              }}
            >
              Em destaque
            </p>

            <h2
              style={{
                fontFamily: "Cinzel, serif",
                fontSize: "clamp(30px, 4vw, 44px)",
                margin: 0,
                color: "#e6c27a",
              }}
            >
              Presenças com maior visibilidade
            </h2>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: "24px",
            }}
          >
            {destaques.map((item) => (
              <article
                key={item.id}
                style={{
                  border: "1px solid #c4914d",
                  background:
                    "linear-gradient(180deg, rgba(34,20,15,1) 0%, rgba(18,10,8,1) 100%)",
                  boxShadow:
                    "0 0 24px rgba(230,194,122,0.10), 0 10px 30px rgba(0,0,0,0.22)",
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <ImagemPublicidade item={item} altura="220px" />

                <div style={{ padding: "24px" }}>
                  <p style={miniMeta}>
                    {item.tipo === "parceiro" ? "Parceiro" : "Publicidade"} •{" "}
                    {formatarPlano(item.plano)}
                  </p>

                  <h3
                    style={{
                      fontFamily: "Cinzel, serif",
                      fontSize: "30px",
                      margin: "0 0 12px 0",
                      color: "#f0d79a",
                    }}
                  >
                    {item.nome}
                  </h3>

                  <p
                    style={{
                      fontSize: "20px",
                      lineHeight: "1.75",
                      color: "#d7b06c",
                      margin: "0 0 20px 0",
                    }}
                  >
                    {item.descricao_curta ||
                      item.descricao ||
                      "Presença em destaque na plataforma."}
                  </p>

                  <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                    {item.link_url ? (
                      <a
                        href={item.link_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={botaoCard}
                      >
                        Visitar
                      </a>
                    ) : null}

                    {item.whatsapp_contacto ? (
                      <a
                        href={normalizarWhatsapp(item.whatsapp_contacto)}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={botaoCard}
                      >
                        WhatsApp
                      </a>
                    ) : null}

                    {item.email_contacto ? (
                      <a
                        href={`mailto:${item.email_contacto}`}
                        style={botaoCard}
                      >
                        Email
                      </a>
                    ) : null}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <section
        id="listagem"
        style={{
          maxWidth: "1150px",
          margin: "0 auto 34px auto",
        }}
      >
        <div
          style={{
            marginBottom: "22px",
            textAlign: "center",
          }}
        >
          <p
            style={{
              letterSpacing: "2px",
              textTransform: "uppercase",
              color: "#caa15a",
              fontSize: "14px",
              margin: "0 0 10px 0",
            }}
          >
            Listagem completa
          </p>

          <h2
            style={{
              fontFamily: "Cinzel, serif",
              fontSize: "clamp(30px, 4vw, 44px)",
              margin: "0 0 10px 0",
              color: "#e6c27a",
            }}
          >
            Todos os parceiros e anúncios ativos
          </h2>

          <p
            style={{
              fontSize: "21px",
              lineHeight: "1.75",
              color: "#d7b06c",
              maxWidth: "860px",
              margin: "0 auto",
            }}
          >
            Uma montra organizada para dar visibilidade a marcas, projetos e
            serviços aprovados pela plataforma.
          </p>
        </div>

        {registos.length === 0 && !erro ? (
          <div
            style={{
              border: "1px solid #8a5d31",
              background:
                "linear-gradient(180deg, rgba(20,13,9,0.98) 0%, rgba(16,10,8,0.98) 100%)",
              padding: "34px 30px",
              boxShadow: "0 10px 30px rgba(0,0,0,0.22)",
              textAlign: "center",
            }}
          >
            <h3
              style={{
                fontFamily: "Cinzel, serif",
                fontSize: "32px",
                margin: "0 0 14px 0",
                color: "#e6c27a",
              }}
            >
              Ainda sem registos públicos
            </h3>

            <p
              style={{
                fontSize: "21px",
                lineHeight: "1.8",
                color: "#d7b06c",
                margin: "0 0 18px 0",
              }}
            >
              Assim que forem aprovadas presenças de publicidade e parceiros,
              irão aparecer aqui.
            </p>

            <Link href="/publicidade" style={botaoPrincipal}>
              Ver planos de divulgação
            </Link>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: "22px",
            }}
          >
            {registos.map((item) => (
              <article
                key={item.id}
                style={{
                  border: "1px solid #8a5d31",
                  background:
                    "linear-gradient(180deg, rgba(20,13,9,1) 0%, rgba(16,10,8,1) 100%)",
                  boxShadow: "0 10px 30px rgba(0,0,0,0.22)",
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column",
                  minHeight: "100%",
                }}
              >
                <ImagemPublicidade item={item} altura="170px" />

                <div
                  style={{
                    padding: "22px 20px",
                    display: "flex",
                    flexDirection: "column",
                    flex: 1,
                  }}
                >
                  <p style={miniMeta}>
                    {item.tipo === "parceiro" ? "Parceiro" : "Publicidade"} •{" "}
                    {formatarPlano(item.plano)}
                  </p>

                  <h3
                    style={{
                      fontFamily: "Cinzel, serif",
                      fontSize: "26px",
                      margin: "0 0 12px 0",
                      color: "#e6c27a",
                      lineHeight: 1.2,
                    }}
                  >
                    {item.nome}
                  </h3>

                  <p
                    style={{
                      fontSize: "19px",
                      lineHeight: "1.75",
                      color: "#d7b06c",
                      margin: "0 0 18px 0",
                      flex: 1,
                    }}
                  >
                    {limitarTexto(
                      item.descricao_curta ||
                        item.descricao ||
                        "Presença aprovada na plataforma.",
                      150
                    )}
                  </p>

                  <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                    {item.link_url ? (
                      <a
                        href={item.link_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={botaoCard}
                      >
                        Visitar
                      </a>
                    ) : null}

                    {item.email_contacto ? (
                      <a
                        href={`mailto:${item.email_contacto}`}
                        style={botaoCard}
                      >
                        Email
                      </a>
                    ) : null}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section
        style={{
          maxWidth: "1150px",
          margin: "0 auto",
        }}
      >
        <article
          style={{
            border: "1px solid #8a5d31",
            background:
              "linear-gradient(180deg, rgba(20,13,9,1) 0%, rgba(16,10,8,1) 100%)",
            padding: "34px 30px",
            boxShadow: "0 10px 30px rgba(0,0,0,0.22)",
            textAlign: "center",
          }}
        >
          <p
            style={{
              letterSpacing: "2px",
              textTransform: "uppercase",
              color: "#caa15a",
              fontSize: "14px",
              margin: "0 0 12px 0",
            }}
          >
            Divulgação
          </p>

          <h2
            style={{
              fontFamily: "Cinzel, serif",
              fontSize: "clamp(30px, 4vw, 44px)",
              margin: "0 0 16px 0",
              color: "#e6c27a",
            }}
          >
            Queres divulgar o teu projeto?
          </h2>

          <p
            style={{
              fontSize: "22px",
              lineHeight: "1.8",
              color: "#d7b06c",
              maxWidth: "860px",
              margin: "0 auto 24px auto",
            }}
          >
            Consulta os planos disponíveis e envia a tua candidatura de
            publicidade para análise.
          </p>

          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "16px",
              flexWrap: "wrap",
            }}
          >
            <Link href="/publicidade" style={botaoPrincipal}>
              Ver planos
            </Link>

            <Link href="/publicidade/candidatura" style={botaoSecundario}>
              Enviar candidatura
            </Link>
          </div>
        </article>
      </section>
    </main>
  );
}

function ImagemPublicidade({
  item,
  altura,
}: {
  item: PublicidadeParceiro;
  altura: string;
}) {
  return (
    <div
      style={{
        width: "100%",
        height: altura,
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
      {item.imagem_url ? (
        <img
          src={item.imagem_url}
          alt={item.nome}
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
            fontSize: "16px",
            color: "#b9a773",
          }}
        >
          Sem imagem
        </span>
      )}
    </div>
  );
}

function formatarPlano(plano: string) {
  if (plano === "home") return "Plano Home";
  if (plano === "destaque") return "Plano Destaque";
  return "Plano Base";
}

function limitarTexto(texto: string, max: number) {
  if (texto.length <= max) return texto;
  return `${texto.slice(0, max).trim()}...`;
}

function normalizarWhatsapp(valor: string) {
  const limpo = valor.replace(/[^\d]/g, "");
  return `https://wa.me/${limpo}`;
}

const miniMeta: React.CSSProperties = {
  letterSpacing: "1.5px",
  textTransform: "uppercase",
  color: "#caa15a",
  fontSize: "13px",
  margin: "0 0 10px 0",
};

const botaoPrincipal: React.CSSProperties = {
  textDecoration: "none",
  border: "1px solid #a6783d",
  color: "#140d09",
  paddingTop: "12px",
  paddingRight: "18px",
  paddingBottom: "12px",
  paddingLeft: "18px",
  fontSize: "18px",
  display: "inline-block",
  background: "#a6783d",
};

const botaoSecundario: React.CSSProperties = {
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

const botaoCard: React.CSSProperties = {
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