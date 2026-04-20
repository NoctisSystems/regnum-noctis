import Image from "next/image";
import Link from "next/link";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

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

export default async function CursosPage() {
  const supabase = getSupabaseAdmin();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

  const { data: cursos, error } = await supabase
    .from("cursos")
    .select("*")
    .eq("publicado", true)
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <main className="min-h-screen bg-[#140b08] px-6 py-16 text-[#f3e7d0]">
        <div className="mx-auto max-w-6xl">
          <h1 className="font-serif text-4xl text-[#e6c27a]">Cursos</h1>
          <p className="mt-6 rounded-2xl border border-red-900/40 bg-red-950/30 p-5 text-sm text-red-200">
            Ocorreu um erro ao carregar os cursos.
          </p>
        </div>
      </main>
    );
  }

  const listaCursos = (cursos ?? []) as Curso[];

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(166,120,61,0.16),transparent_30%),linear-gradient(180deg,#120907_0%,#1b0f0b_45%,#120907_100%)] text-[#f3e7d0]">
      <section className="mx-auto max-w-7xl px-6 py-16 md:px-8 lg:px-10">
        <div className="mb-12">
          <span className="inline-flex rounded-full border border-[#a6783d]/40 bg-[#2b160f]/70 px-4 py-1 text-xs uppercase tracking-[0.35em] text-[#d7b06f]">
            Regnum Noctis
          </span>

          <h1 className="mt-5 text-4xl font-semibold tracking-tight text-[#f4dfb3] md:text-5xl">
            Catálogo de Cursos
          </h1>

          <p className="mt-4 max-w-3xl text-base leading-7 text-[#dbc8a7]/90 md:text-lg">
            Explora os cursos atualmente disponíveis na plataforma. Cada formação
            foi pensada para proporcionar profundidade, estrutura e uma
            experiência de aprendizagem séria.
          </p>
        </div>

        {listaCursos.length === 0 ? (
          <div className="rounded-3xl border border-[#a6783d]/20 bg-[#1b0f0b]/80 p-8 shadow-[0_0_40px_rgba(0,0,0,0.35)]">
            <p className="text-base text-[#eadfcf]/90">
              Ainda não existem cursos publicados.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {listaCursos.map((curso) => {
              const capaSrc = construirCapaSrc(curso.capa_url ?? null, supabaseUrl);

              return (
                <article
                  key={curso.id}
                  className="group overflow-hidden rounded-[28px] border border-[#a6783d]/20 bg-[#1b0f0b]/85 shadow-[0_12px_50px_rgba(0,0,0,0.35)] transition duration-300 hover:-translate-y-1 hover:border-[#d7b06f]/45 hover:shadow-[0_18px_65px_rgba(166,120,61,0.18)]"
                >
                  <Link href={`/cursos/${curso.id}`} className="block">
                    <div className="relative h-60 w-full overflow-hidden bg-[#24120d]">
                      {capaSrc ? (
                        <Image
                          src={capaSrc}
                          alt={curso.titulo ?? "Curso"}
                          fill
                          className="object-cover transition duration-500 group-hover:scale-[1.03]"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(135deg,#2b160f_0%,#1a0c08_100%)] text-sm uppercase tracking-[0.3em] text-[#cda86a]/70">
                          Sem capa
                        </div>
                      )}

                      <div className="absolute inset-0 bg-gradient-to-t from-[#120907]/80 via-[#120907]/10 to-transparent" />
                    </div>

                    <div className="p-6">
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <span className="rounded-full border border-[#a6783d]/30 bg-[#2b160f]/80 px-3 py-1 text-xs uppercase tracking-[0.25em] text-[#ddb97a]">
                          {curso.tipo_produto || "Curso"}
                        </span>

                        <span className="text-sm font-medium text-[#f0d8a3]">
                          {formatarPreco(curso)}
                        </span>
                      </div>

                      <h2 className="text-2xl font-semibold text-[#f7e6c1] transition duration-300 group-hover:text-[#ffd78a]">
                        {curso.titulo || "Curso sem título"}
                      </h2>

                      <p className="mt-3 line-clamp-3 text-sm leading-6 text-[#ddcfb7]/85">
                        {curso.descricao || "Sem descrição disponível."}
                      </p>

                      <div className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-[#e6c27a]">
                        Ver detalhes
                        <span aria-hidden="true">→</span>
                      </div>
                    </div>
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