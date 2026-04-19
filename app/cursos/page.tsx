import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ regiao?: string | string[] }>;
};

type RegiaoCheckout = "EU" | "BR";

type Curso = {
  id: number;
  titulo: string | null;
  descricao: string | null;
  preco: number | null;
  preco_eur: number | null;
  preco_brl: number | null;
  tipo: string | null;
  tipo_produto: string | null;
  publicado: boolean | null;
  capa_url: string | null;
  checkout_eu_ativo: boolean | null;
  checkout_br_ativo: boolean | null;
  tem_certificado: boolean | null;
  horas_certificado: string | null;
  tem_manual_geral: boolean | null;
  formador_id: number | null;
};

type Formador = {
  id: number;
  nome: string | null;
  bio_curta: string | null;
  bio: string | null;
  area_ensino: string | null;
  foto_url: string | null;
  status: string | null;
};

export const dynamic = "force-dynamic";

export default async function CursoDetalhePage({
  params,
  searchParams,
}: PageProps) {
  const resolvedParams = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const cursoId = Number(resolvedParams.id);

  if (!cursoId || Number.isNaN(cursoId)) {
    notFound();
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const regiao = await resolverRegiaoCheckout(resolvedSearchParams.regiao);

  const { data: cursoData, error: cursoError } = await supabase
    .from("cursos")
    .select(
      "id, titulo, descricao, preco, preco_eur, preco_brl, tipo, tipo_produto, publicado, capa_url, checkout_eu_ativo, checkout_br_ativo, tem_certificado, horas_certificado, tem_manual_geral, formador_id"
    )
    .eq("id", cursoId)
    .eq("publicado", true)
    .maybeSingle();

  if (cursoError || !cursoData) {
    notFound();
  }

  const curso = cursoData as Curso;

  let formador: Formador | null = null;
  let formadorError = "";

  if (curso.formador_id) {
    const { data: formadorData, error } = await supabase
      .from("formadores")
      .select("id, nome, bio_curta, bio, area_ensino, foto_url, status")
      .eq("id", curso.formador_id)
      .eq("status", "aprovado")
      .maybeSingle();

    if (error) {
      formadorError = error.message;
    } else {
      formador = (formadorData as Formador | null) || null;
    }
  }

  const capaSrc = construirUrlStorage({
    supabaseUrl,
    bucket: "curso_capas",
    valor: curso.capa_url,
  });

  const fotoFormadorSrc = construirUrlStorage({
    supabaseUrl,
    bucket: "formadores-fotos",
    valor: formador?.foto_url || null,
  });

  const precoInfo = obterPrecoCurso(curso, regiao);

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#2b160f",
        color: "#e6c27a",
        fontFamily: "Cormorant Garamond, serif",
        paddingTop: "50px",
        paddingRight: "20px",
        paddingBottom: "90px",
        paddingLeft: "20px",
      }}
    >
      <section
        style={{
          maxWidth: "1180px",
          margin: "0 auto",
          display: "grid",
          gap: "24px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "14px",
            flexWrap: "wrap",
          }}
        >
          <Link href="/cursos" style={botaoSecundario}>
            Voltar aos cursos
          </Link>

          <div
            style={{
              border: "1px solid rgba(166,120,61,0.35)",
              background: "rgba(20,13,9,0.55)",
              padding: "10px 14px",
              color: "#d7b06c",
              fontSize: "16px",
            }}
          >
            Região comercial ativa:{" "}
            <strong style={{ color: "#f0d38b" }}>{regiao}</strong>
          </div>
        </div>

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1.12fr) minmax(320px, 0.88fr)",
            gap: "24px",
            alignItems: "start",
          }}
        >
          <article
            style={{
              border: "1px solid #8a5d31",
              background:
                "linear-gradient(180deg, rgba(20,13,9,1) 0%, rgba(16,10,8,1) 100%)",
              boxShadow: "0 10px 30px rgba(0,0,0,0.22)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: "100%",
                height: "440px",
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
                    fontSize: "20px",
                    color: "#b9a773",
                  }}
                >
                  Capa do curso
                </span>
              )}
            </div>

            <div
              style={{
                padding: "30px",
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
                {traduzirTipoProduto(curso.tipo_produto, curso.tipo)}
              </p>

              <h1
                style={{
                  fontFamily: "Cinzel, serif",
                  fontSize: "clamp(34px, 5vw, 56px)",
                  fontWeight: 500,
                  margin: "0 0 18px 0",
                  color: "#e6c27a",
                  lineHeight: 1.12,
                }}
              >
                {curso.titulo || "Curso sem título"}
              </h1>

              <div
                style={{
                  width: "100%",
                  maxWidth: "260px",
                  height: "1px",
                  background: "#8a5d31",
                  margin: "0 0 24px 0",
                }}
              />

              <p
                style={{
                  fontSize: "22px",
                  lineHeight: "1.82",
                  color: "#d7b06c",
                  margin: 0,
                  whiteSpace: "pre-wrap",
                }}
              >
                {curso.descricao || "Descrição em atualização."}
              </p>
            </div>
          </article>

          <aside
            style={{
              display: "grid",
              gap: "20px",
            }}
          >
            <section style={cardLateral}>
              <h2 style={tituloCardLateral}>Condições comerciais</h2>

              <div
                style={{
                  display: "grid",
                  gap: "12px",
                  marginBottom: "16px",
                }}
              >
                <LinhaPrecoDetalhe
                  label="Preço apresentado"
                  valor={precoInfo.texto}
                  destaque
                />

                <LinhaPrecoDetalhe
                  label="Estado do checkout"
                  valor={precoInfo.disponivel ? "Disponível" : "Indisponível"}
                  sucesso={precoInfo.disponivel}
                />

                <LinhaPrecoDetalhe
                  label="Checkout EU"
                  valor={
                    curso.checkout_eu_ativo
                      ? formatarMoeda(obterPrecoEur(curso), "EUR")
                      : "Indisponível"
                  }
                />

                <LinhaPrecoDetalhe
                  label="Checkout BR"
                  valor={
                    curso.checkout_br_ativo
                      ? formatarMoeda(
                          typeof curso.preco_brl === "number"
                            ? curso.preco_brl
                            : null,
                          "BRL"
                        )
                      : "Indisponível"
                  }
                />
              </div>

              <p
                style={{
                  fontSize: "17px",
                  lineHeight: 1.7,
                  color: "#d7b06c",
                  margin: "0 0 18px 0",
                }}
              >
                {precoInfo.subtexto}
              </p>

              <div
                style={{
                  display: "grid",
                  gap: "12px",
                }}
              >
                <Link
                  href={`/cursos/${curso.id}?regiao=EU`}
                  style={botaoSecundario}
                >
                  Ver em EU
                </Link>

                <Link
                  href={`/cursos/${curso.id}?regiao=BR`}
                  style={botaoSecundario}
                >
                  Ver em BR
                </Link>

                <form
                  action="/api/checkout"
                  method="post"
                  style={{
                    display: "grid",
                    gap: "12px",
                    marginTop: "8px",
                  }}
                >
                  <input type="hidden" name="cursoId" value={curso.id} />
                  <input type="hidden" name="regiao" value={regiao} />

                  <label
                    style={{
                      display: "block",
                      fontSize: "16px",
                      color: "#e6c27a",
                    }}
                  >
                    Email de compra
                  </label>

                  <input
                    type="email"
                    name="email"
                    required
                    placeholder="Indica o email que ficará associado à compra"
                    style={{
                      width: "100%",
                      padding: "14px 14px",
                      background: "#1a100c",
                      border: "1px solid #8a5d31",
                      color: "#e6c27a",
                      fontSize: "17px",
                      outline: "none",
                    }}
                  />

                  <button
                    type="submit"
                    disabled={!precoInfo.disponivel}
                    style={{
                      ...botaoPrincipal,
                      opacity: precoInfo.disponivel ? 1 : 0.7,
                      cursor: precoInfo.disponivel ? "pointer" : "not-allowed",
                    }}
                  >
                    {precoInfo.disponivel
                      ? "Validar compra"
                      : "Checkout indisponível nesta região"}
                  </button>
                </form>
              </div>
            </section>

            <section style={cardLateral}>
              <h2 style={tituloCardLateral}>Detalhes do conteúdo</h2>

              <div style={{ display: "grid", gap: "12px" }}>
                <LinhaPrecoDetalhe
                  label="Formato"
                  valor={traduzirTipoProduto(curso.tipo_produto, curso.tipo)}
                />
                <LinhaPrecoDetalhe
                  label="Certificado"
                  valor={curso.tem_certificado ? "Sim" : "Não"}
                />
                <LinhaPrecoDetalhe
                  label="Carga horária"
                  valor={curso.horas_certificado || "Não indicada"}
                />
                <LinhaPrecoDetalhe
                  label="Manual geral"
                  valor={curso.tem_manual_geral ? "Sim" : "Não"}
                />
              </div>
            </section>

            {formador ? (
              <section style={cardLateral}>
                <h2 style={tituloCardLateral}>Formador</h2>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "14px",
                    marginBottom: "16px",
                  }}
                >
                  <div
                    style={{
                      width: "82px",
                      height: "82px",
                      borderRadius: "999px",
                      border: "1px solid #8a5d31",
                      background:
                        "radial-gradient(circle at top, rgba(212,175,55,0.08), transparent 45%), #1a100c",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#b9a773",
                      overflow: "hidden",
                      flexShrink: 0,
                    }}
                  >
                    {fotoFormadorSrc ? (
                      <img
                        src={fotoFormadorSrc}
                        alt={formador.nome || "Formador"}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          display: "block",
                        }}
                      />
                    ) : (
                      <span style={{ fontSize: "12px" }}>Sem foto</span>
                    )}
                  </div>

                  <div>
                    <h3
                      style={{
                        fontFamily: "Cinzel, serif",
                        fontSize: "24px",
                        margin: "0 0 6px 0",
                        color: "#e6c27a",
                        lineHeight: 1.2,
                      }}
                    >
                      {formador.nome || "Formador"}
                    </h3>

                    <p
                      style={{
                        margin: 0,
                        color: "#caa15a",
                        fontSize: "17px",
                        lineHeight: 1.6,
                      }}
                    >
                      {formador.area_ensino || "Área em atualização"}
                    </p>
                  </div>
                </div>

                <p
                  style={{
                    margin: 0,
                    fontSize: "18px",
                    lineHeight: "1.75",
                    color: "#d7b06c",
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {formador.bio_curta ||
                    formador.bio ||
                    "Perfil do formador em atualização."}
                </p>
              </section>
            ) : formadorError ? (
              <section style={cardLateral}>
                <h2 style={tituloCardLateral}>Formador</h2>
                <p
                  style={{
                    margin: 0,
                    fontSize: "17px",
                    lineHeight: 1.7,
                    color: "#ffb4b4",
                  }}
                >
                  {formadorError}
                </p>
              </section>
            ) : null}
          </aside>
        </section>
      </section>
    </main>
  );
}

async function resolverRegiaoCheckout(
  regiaoQuery?: string | string[]
): Promise<RegiaoCheckout> {
  const valor = Array.isArray(regiaoQuery) ? regiaoQuery[0] : regiaoQuery;
  const normalizada = (valor || "").trim().toUpperCase();

  if (normalizada === "EU" || normalizada === "BR") {
    return normalizada;
  }

  return inferirRegiaoCheckout();
}

async function inferirRegiaoCheckout(): Promise<RegiaoCheckout> {
  const headerStore = await headers();
  const acceptLanguage = headerStore.get("accept-language") || "";
  const normalizado = acceptLanguage.toLowerCase();

  if (normalizado.includes("pt-br") || normalizado.includes("br")) {
    return "BR";
  }

  return "EU";
}

function obterPrecoEur(curso: Curso) {
  if (typeof curso.preco_eur === "number") return curso.preco_eur;
  if (typeof curso.preco === "number") return curso.preco;
  return null;
}

function obterPrecoCurso(curso: Curso, regiao: RegiaoCheckout) {
  const precoEur = obterPrecoEur(curso);
  const precoBrl =
    typeof curso.preco_brl === "number" ? curso.preco_brl : null;

  if (regiao === "BR") {
    if (curso.checkout_br_ativo && precoBrl !== null) {
      return {
        texto: formatarMoeda(precoBrl, "BRL"),
        subtexto:
          "Preço preparado para a região comercial BR. A validação final do checkout será feita no backend.",
        disponivel: true,
      };
    }

    if (curso.checkout_eu_ativo && precoEur !== null) {
      return {
        texto: formatarMoeda(precoEur, "EUR"),
        subtexto:
          "O checkout BR ainda não está ativo neste conteúdo. Neste momento existe apenas checkout europeu.",
        disponivel: false,
      };
    }

    return {
      texto: "Preço em atualização",
      subtexto:
        "Este conteúdo ainda não tem checkout ativo para a região BR.",
      disponivel: false,
    };
  }

  if (curso.checkout_eu_ativo && precoEur !== null) {
    return {
      texto: formatarMoeda(precoEur, "EUR"),
      subtexto:
        "Preço preparado para a região comercial EU. A validação final do checkout será feita no backend.",
        disponivel: true,
    };
  }

  if (curso.checkout_br_ativo && precoBrl !== null) {
    return {
      texto: formatarMoeda(precoBrl, "BRL"),
      subtexto:
        "O checkout EU ainda não está ativo neste conteúdo. Neste momento existe apenas checkout BR.",
      disponivel: false,
    };
  }

  return {
    texto: "Preço em atualização",
    subtexto:
      "Este conteúdo ainda não tem checkout ativo para a região EU.",
    disponivel: false,
  };
}

function formatarMoeda(valor: number | null, moeda: "EUR" | "BRL") {
  if (typeof valor !== "number") return "Preço em atualização";

  return new Intl.NumberFormat(moeda === "EUR" ? "pt-PT" : "pt-BR", {
    style: "currency",
    currency: moeda,
  }).format(valor || 0);
}

function traduzirTipoProduto(
  tipoProduto: string | null,
  tipoLegacy: string | null
) {
  if (tipoProduto === "curso_video") return "Curso em vídeo";
  if (tipoProduto === "pdf_digital") return "PDF digital";
  return tipoLegacy || "Curso";
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

function LinhaPrecoDetalhe({
  label,
  valor,
  destaque = false,
  sucesso = false,
}: {
  label: string;
  valor: string;
  destaque?: boolean;
  sucesso?: boolean;
}) {
  return (
    <div
      style={{
        border: "1px solid rgba(166,120,61,0.22)",
        background: "rgba(32,18,13,0.45)",
        padding: "14px 16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "12px",
        flexWrap: "wrap",
      }}
    >
      <span
        style={{
          fontSize: "14px",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "#caa15a",
        }}
      >
        {label}
      </span>

      <span
        style={{
          fontSize: destaque ? "22px" : "18px",
          color: sucesso ? "#bff1bf" : destaque ? "#f0d38b" : "#e6c27a",
        }}
      >
        {valor}
      </span>
    </div>
  );
}

const cardLateral: React.CSSProperties = {
  border: "1px solid #8a5d31",
  background:
    "linear-gradient(180deg, rgba(20,13,9,1) 0%, rgba(16,10,8,1) 100%)",
  padding: "24px",
  boxShadow: "0 10px 30px rgba(0,0,0,0.22)",
};

const tituloCardLateral: React.CSSProperties = {
  fontFamily: "Cinzel, serif",
  fontSize: "30px",
  margin: "0 0 18px 0",
  color: "#e6c27a",
};

const botaoPrincipal: React.CSSProperties = {
  textDecoration: "none",
  border: "1px solid #c4914d",
  color: "#140d09",
  paddingTop: "14px",
  paddingRight: "18px",
  paddingBottom: "14px",
  paddingLeft: "18px",
  fontSize: "18px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  background: "linear-gradient(180deg, #c4914d 0%, #a6783d 100%)",
  fontWeight: 700,
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
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  background: "transparent",
};