import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase-admin";

type Formador = {
  id: number;
  nome: string | null;
  bio_curta: string | null;
  bio: string | null;
  area_ensino: string | null;
  foto_url: string | null;
  status: string | null;
};

export default async function FormadorDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  const formadorId = Number(resolvedParams.id);

  if (Number.isNaN(formadorId)) {
    notFound();
  }

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
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const fotoSrc =
    formador.foto_url && supabaseUrl
      ? `${supabaseUrl}/storage/v1/object/public/formadores-fotos/${formador.foto_url}`
      : null;

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
          marginTop: 0,
          marginRight: "auto",
          marginBottom: 0,
          marginLeft: "auto",
          display: "grid",
          gridTemplateColumns: "380px minmax(0, 1fr)",
          gap: "34px",
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
              height: "500px",
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
            paddingTop: "34px",
            paddingRight: "30px",
            paddingBottom: "34px",
            paddingLeft: "30px",
          }}
        >
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
            Formador
          </p>

          <h1
            style={{
              fontFamily: "Cinzel, serif",
              fontSize: "clamp(38px, 5vw, 56px)",
              marginTop: 0,
              marginRight: 0,
              marginBottom: "14px",
              marginLeft: 0,
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
              marginTop: 0,
              marginRight: 0,
              marginBottom: "16px",
              marginLeft: 0,
            }}
          >
            {formador.area_ensino || "Área em atualização"}
          </p>

          {formador.bio_curta && (
            <p
              style={{
                fontSize: "23px",
                lineHeight: "1.7",
                color: "#d7b06c",
                marginTop: 0,
                marginRight: 0,
                marginBottom: "24px",
                marginLeft: 0,
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
                marginTop: 0,
                marginRight: 0,
                marginBottom: "12px",
                marginLeft: 0,
              }}
            >
              Sobre o formador
            </p>

            <p
              style={{
                fontSize: "22px",
                lineHeight: "1.85",
                color: "#d7b06c",
                marginTop: 0,
                marginRight: 0,
                marginBottom: 0,
                marginLeft: 0,
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