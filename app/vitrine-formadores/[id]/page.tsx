import { notFound } from "next/navigation";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

type Formador = {
  id: number;
  nome: string | null;
  bio_curta: string | null;
  bio: string | null;
  area_ensino: string | null;
  foto_url: string | null;
  status: string | null;
};

type PageProps = {
  params: Promise<{ id: string }>;
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

export default async function FormadorDetalhePage({ params }: PageProps) {
  const resolvedParams = await params;
  const formadorId = Number(resolvedParams.id);

  if (Number.isNaN(formadorId)) {
    notFound();
  }

  const supabaseAdmin = getSupabaseAdmin();

  const { data, error } = await supabaseAdmin
    .from("formadores")
    .select("id, nome, bio_curta, bio, area_ensino, foto_url, status")
    .eq("id", formadorId)
    .eq("status", "aprovado")
    .single();

  if (error || !data) {
    notFound();
  }

  const formador = data as Formador;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const fotoSrc = construirFotoSrc(formador.foto_url, supabaseUrl);

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#2b160f",
        color: "#e6c27a",
        fontFamily: "Cormorant Garamond, serif",
        paddingTop: "clamp(40px, 6vw, 60px)",
        paddingRight: "clamp(14px, 4vw, 16px)",
        paddingBottom: "clamp(70px, 8vw, 90px)",
        paddingLeft: "clamp(14px, 4vw, 16px)",
      }}
    >
      <section
        style={{
          maxWidth: "1150px",
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(min(100%, 280px), 1fr))",
          gap: "24px",
          alignItems: "start",
        }}
      >
        <div
          style={{
            border: "1px solid #8a5d31",
            background: "#140d09",
            boxShadow: "0 10px 30px rgba(0,0,0,0.22)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: "100%",
              height: "clamp(320px, 55vw, 500px)",
              background:
                "radial-gradient(circle at top, rgba(212,175,55,0.08), transparent 45%), #1a100c",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#b9a773",
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
              <span>Sem fotografia</span>
            )}
          </div>
        </div>

        <div
          style={{
            border: "1px solid #8a5d31",
            background: "#140d09",
            boxShadow: "0 10px 30px rgba(0,0,0,0.22)",
            padding: "clamp(20px, 4vw, 28px) clamp(18px, 4vw, 22px)",
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
            Formador
          </p>

          <h1
            style={{
              fontFamily: "Cinzel, serif",
              fontSize: "clamp(28px, 5vw, 56px)",
              margin: "0 0 14px 0",
              color: "#e6c27a",
              lineHeight: 1.1,
            }}
          >
            {formador.nome || "Formador"}
          </h1>

          <p
            style={{
              letterSpacing: "1px",
              textTransform: "uppercase",
              color: "#caa15a",
              fontSize: "14px",
              margin: "0 0 16px 0",
            }}
          >
            {formador.area_ensino || "Área em atualização"}
          </p>

          {formador.bio_curta && (
            <p
              style={{
                fontSize: "clamp(18px, 2.5vw, 23px)",
                lineHeight: "1.7",
                color: "#d7b06c",
                margin: "0 0 24px 0",
              }}
            >
              {formador.bio_curta}
            </p>
          )}

          <div
            style={{
              borderTop: "1px solid rgba(166,120,61,0.35)",
              paddingTop: "24px",
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
              Sobre o formador
            </p>

            <p
              style={{
                fontSize: "clamp(18px, 2.4vw, 22px)",
                lineHeight: "1.85",
                color: "#d7b06c",
                margin: 0,
                whiteSpace: "pre-line",
              }}
            >
              {formador.bio || "Biografia em atualização."}
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}