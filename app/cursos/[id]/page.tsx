import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
};

type Curso = {
  id: number;
  titulo?: string | null;
  descricao?: string | null;
  preco?: number | null;
  preco_eur?: number | null;
  preco_brl?: number | null;
  publicado?: boolean | null;
  capa_url?: string | null;
  tipo_produto?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

function construirCapaSrc(capaUrl: string | null, supabaseUrl: string) {
  if (!capaUrl) return null;

  const valor = capaUrl.trim();

  if (!valor) return null;

  if (valor.startsWith("http://") || valor.startsWith("https://")) {
    return valor;
  }

  return `${supabaseUrl}/storage/v1/object/public/curso_capas/${valor.replace(
    /^\/+/,
    ""
  )}`;
}

function formatarPreco(curso: Curso) {
  if (typeof curso.preco_eur === "number") {
    return `${curso.preco_eur.toFixed(2)} €`;
  }

  if (typeof curso.preco === "number") {
    return `${curso.preco.toFixed(2)} €`;
  }

  return "Preço sob consulta";
}

export default async function CursoDetalhePage({ params }: PageProps) {
  const { id } = await params;
  const cursoId = Number(id);

  if (!Number.isFinite(cursoId)) {
    notFound();
  }

  const supabase = getSupabaseAdmin();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

  const { data: curso, error } = await supabase
    .from("cursos")
    .select("*")
    .eq("id", cursoId)
    .eq("publicado", true)
    .maybeSingle();

  if (error || !curso) {
    notFound();
  }

  const cursoData = curso as Curso;
  const capaSrc = construirCapaSrc(cursoData.capa_url ?? null, supabaseUrl);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(166,120,61,0.18),transparent_30%),linear-gradient(180deg,#120907_0%,#1a0d09_42%,#120907_100%)] text-[#f3e7d0]">
      <section className="mx-auto max-w-7xl px-6 py-16 md:px-8 lg:px-10">
        <div className="mb-8">
          <Link
            href="/cursos"
            className="inline-flex items-center gap-2 rounded-full border border-[#a6783d]/30 bg-[#2b160f]/60 px-4 py-2 text-sm text-[#e6c27a] transition hover:border-[#d7b06f]/50 hover:bg-[#2b160f]"
          >
            ← Voltar aos cursos
          </Link>
        </div>

        <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="relative overflow-hidden rounded-[30px] border border-[#a6783d]/25 bg-[#1b0f0b]/80 shadow-[0_20px_70px_rgba(0,0,0,0.35)]">
            <div className="relative aspect-[4/3] w-full bg-[#24120d]">
              {capaSrc ? (
                <Image
                  src={capaSrc}
                  alt={cursoData.titulo ?? "Curso"}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(135deg,#2b160f_0%,#1a0c08_100%)] text-sm uppercase tracking-[0.3em] text-[#cda86a]/70">
                  Sem capa
                </div>
              )}

              <div className="absolute inset-0 bg-gradient-to-t from-[#120907]/70 via-transparent to-transparent" />
            </div>
          </div>

          <div className="flex flex-col justify-center">
            <span className="mb-4 inline-flex w-fit rounded-full border border-[#a6783d]/30 bg-[#2b160f]/80 px-4 py-1 text-xs uppercase tracking-[0.28em] text-[#ddb97a]">
              {cursoData.tipo_produto || "Curso"}
            </span>

            <h1 className="text-4xl font-semibold tracking-tight text-[#f7e6c1] md:text-5xl">
              {cursoData.titulo || "Curso sem título"}
            </h1>

            <p className="mt-6 text-base leading-8 text-[#e0d2ba]/90 md:text-lg">
              {cursoData.descricao || "Sem descrição disponível."}
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <div className="rounded-2xl border border-[#a6783d]/25 bg-[#1b0f0b]/90 px-5 py-4">
                <div className="text-xs uppercase tracking-[0.25em] text-[#b99256]">
                  Preço
                </div>
                <div className="mt-1 text-2xl font-semibold text-[#f3d18c]">
                  {formatarPreco(cursoData)}
                </div>
              </div>

              <div className="rounded-2xl border border-[#a6783d]/25 bg-[#1b0f0b]/90 px-5 py-4">
                <div className="text-xs uppercase tracking-[0.25em] text-[#b99256]">
                  Estado
                </div>
                <div className="mt-1 text-base font-medium text-[#f6e5bf]">
                  Publicado
                </div>
              </div>
            </div>

            <div className="mt-10">
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-2xl border border-[#c59a53]/40 bg-[linear-gradient(180deg,#3a2117_0%,#2a150f_100%)] px-6 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-[#f3d18c] shadow-[0_0_25px_rgba(166,120,61,0.18)] transition hover:border-[#e6c27a]/55 hover:shadow-[0_0_35px_rgba(230,194,122,0.22)]"
              >
                Comprar curso
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}