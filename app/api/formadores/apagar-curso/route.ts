import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { deleteFromBunny } from "@/lib/bunny-storage";

type Formador = {
  id: number;
  auth_id: string | null;
  email: string | null;
  status: string | null;
};

type Curso = {
  id: number;
  formador_id: number | null;
  capa_url: string | null;
  pdf_path: string | null;
  certificado_pronto_path: string | null;
  certificado_modelo_path: string | null;
};

type Aula = {
  id: number;
  bunny_video_id: string | null;
};

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

async function getAuthSupabase() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll().map((cookie) => ({
            name: cookie.name,
            value: cookie.value,
          }));
        },
        setAll(
          cookiesToSet: Array<{
            name: string;
            value: string;
            options?: CookieOptions;
          }>
        ) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Ignorar em contextos onde não é necessário escrever cookies.
          }
        },
      },
    }
  );
}

async function encontrarFormadorComRecuperacao(
  userId: string,
  userEmail: string | null | undefined
): Promise<Formador | null> {
  const supabaseAdmin = getSupabaseAdmin();

  const { data: porAuthId, error: porAuthIdError } = await supabaseAdmin
    .from("formadores")
    .select("id, auth_id, email, status")
    .eq("auth_id", userId)
    .maybeSingle();

  if (!porAuthIdError && porAuthId) {
    return porAuthId as Formador;
  }

  if (!userEmail) {
    return null;
  }

  const { data: porEmail, error: porEmailError } = await supabaseAdmin
    .from("formadores")
    .select("id, auth_id, email, status")
    .eq("email", userEmail)
    .maybeSingle();

  if (porEmailError || !porEmail) {
    return null;
  }

  if (!porEmail.auth_id) {
    const { error: updateError } = await supabaseAdmin
      .from("formadores")
      .update({ auth_id: userId })
      .eq("id", porEmail.id);

    if (!updateError) {
      return {
        ...(porEmail as Formador),
        auth_id: userId,
      };
    }
  }

  return porEmail as Formador;
}

async function apagarVideoNoBunnyStream(videoId: string) {
  const libraryId = process.env.BUNNY_LIBRARY_ID?.trim();
  const accessKey = process.env.BUNNY_API_KEY?.trim();

  if (!libraryId || !accessKey) {
    throw new Error("As credenciais do Bunny Stream não estão configuradas.");
  }

  const response = await fetch(
    `https://video.bunnycdn.com/library/${libraryId}/videos/${videoId}`,
    {
      method: "DELETE",
      headers: {
        AccessKey: accessKey,
        Accept: "application/json",
      },
      cache: "no-store",
    }
  );

  if (!response.ok) {
    const detalhe = (await response.text()).trim();
    throw new Error(detalhe || "Falha ao apagar o vídeo no Bunny Stream.");
  }
}

function extrairPathCursoCapa(capaUrl: string | null): string | null {
  if (!capaUrl) return null;

  const marcador = "/storage/v1/object/public/curso_capas/";

  if (capaUrl.includes(marcador)) {
    const [, path] = capaUrl.split(marcador);
    return path?.trim() || null;
  }

  const valor = capaUrl.trim();

  if (!valor) return null;
  if (valor.startsWith("http://") || valor.startsWith("https://")) return null;

  return valor.replace(/^\/+/, "");
}

function normalizarPathBunny(path: string | null): string | null {
  if (!path) return null;

  const valor = path.trim();

  if (!valor) return null;
  if (valor.startsWith("http://") || valor.startsWith("https://")) return null;

  const permitido =
    valor.startsWith("pdfs/") ||
    valor.includes("/pdfs/") ||
    valor.startsWith("certificados/") ||
    valor.includes("/certificados/") ||
    valor.startsWith("anexos/") ||
    valor.includes("/anexos/") ||
    valor.startsWith("levantamentos/") ||
    valor.includes("/levantamentos/");

  return permitido ? valor : null;
}

async function tentarApagarCapaSupabase(capaUrl: string | null) {
  const path = extrairPathCursoCapa(capaUrl);

  if (!path) return;

  const supabaseAdmin = getSupabaseAdmin();

  await supabaseAdmin.storage.from("curso_capas").remove([path]);
}

async function tentarApagarFicheiroBunny(path: string | null) {
  const pathNormalizado = normalizarPathBunny(path);

  if (!pathNormalizado) {
    return;
  }

  await deleteFromBunny(pathNormalizado);
}

export async function POST(request: Request) {
  const avisos: string[] = [];

  try {
    const supabaseAuth = await getAuthSupabase();
    const supabaseAdmin = getSupabaseAdmin();

    const {
      data: { user },
      error: userError,
    } = await supabaseAuth.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "Não foi possível validar a sessão do formador." },
        { status: 401 }
      );
    }

    const formador = await encontrarFormadorComRecuperacao(user.id, user.email);

    if (!formador) {
      return NextResponse.json(
        { error: "Não foi possível encontrar o registo do formador." },
        { status: 403 }
      );
    }

    if (formador.status !== "aprovado") {
      return NextResponse.json(
        { error: "A conta de formador não está aprovada." },
        { status: 403 }
      );
    }

    const body = (await request.json()) as {
      cursoId?: number | string;
    };

    const cursoId = Number(body?.cursoId || 0);

    if (!cursoId || Number.isNaN(cursoId)) {
      return NextResponse.json({ error: "Curso inválido." }, { status: 400 });
    }

    const { data: cursoData, error: cursoError } = await supabaseAdmin
      .from("cursos")
      .select(
        "id, formador_id, capa_url, pdf_path, certificado_pronto_path, certificado_modelo_path"
      )
      .eq("id", cursoId)
      .eq("formador_id", formador.id)
      .maybeSingle();

    if (cursoError || !cursoData) {
      return NextResponse.json(
        { error: "Curso não encontrado ou sem permissão de acesso." },
        { status: 404 }
      );
    }

    const curso = cursoData as Curso;

    const { data: aulasData, error: aulasError } = await supabaseAdmin
      .from("aulas")
      .select("id, bunny_video_id")
      .eq("curso_id", curso.id);

    if (aulasError) {
      return NextResponse.json(
        {
          error:
            aulasError.message ||
            "Não foi possível carregar as aulas do curso.",
        },
        { status: 500 }
      );
    }

    const aulas = (aulasData || []) as Aula[];

    const { data: comunidadesData, error: comunidadesError } =
      await supabaseAdmin
        .from("comunidades")
        .select("id")
        .eq("curso_id", curso.id);

    if (comunidadesError) {
      return NextResponse.json(
        {
          error:
            comunidadesError.message ||
            "Não foi possível carregar as comunidades do curso.",
        },
        { status: 500 }
      );
    }

    const comunidadeIds = (comunidadesData || [])
      .map((item) => item.id)
      .filter((id): id is number => typeof id === "number");

    if (comunidadeIds.length > 0) {
      const { error: topicosError } = await supabaseAdmin
        .from("comunidade_topicos")
        .delete()
        .in("comunidade_id", comunidadeIds);

      if (topicosError) {
        return NextResponse.json(
          {
            error:
              topicosError.message ||
              "Não foi possível apagar os tópicos das comunidades do curso.",
          },
          { status: 500 }
        );
      }

      const { error: comunidadesDeleteError } = await supabaseAdmin
        .from("comunidades")
        .delete()
        .eq("curso_id", curso.id);

      if (comunidadesDeleteError) {
        return NextResponse.json(
          {
            error:
              comunidadesDeleteError.message ||
              "Não foi possível apagar as comunidades do curso.",
          },
          { status: 500 }
        );
      }
    }

    const { error: aulasDeleteError } = await supabaseAdmin
      .from("aulas")
      .delete()
      .eq("curso_id", curso.id);

    if (aulasDeleteError) {
      return NextResponse.json(
        {
          error:
            aulasDeleteError.message ||
            "Não foi possível apagar as aulas do curso.",
        },
        { status: 500 }
      );
    }

    const { error: modulosDeleteError } = await supabaseAdmin
      .from("modulos")
      .delete()
      .eq("curso_id", curso.id);

    if (modulosDeleteError) {
      return NextResponse.json(
        {
          error:
            modulosDeleteError.message ||
            "Não foi possível apagar os módulos do curso.",
        },
        { status: 500 }
      );
    }

    const { error: cursoDeleteError } = await supabaseAdmin
      .from("cursos")
      .delete()
      .eq("id", curso.id)
      .eq("formador_id", formador.id);

    if (cursoDeleteError) {
      return NextResponse.json(
        {
          error: cursoDeleteError.message || "Não foi possível apagar o curso.",
        },
        { status: 500 }
      );
    }

    for (const aula of aulas) {
      const videoId = aula.bunny_video_id?.trim();

      if (!videoId) continue;

      try {
        await apagarVideoNoBunnyStream(videoId);
      } catch (error: unknown) {
        avisos.push(
          `Não foi possível apagar o vídeo da aula ${aula.id}: ${getErrorMessage(
            error,
            "erro desconhecido"
          )}`
        );
      }
    }

    try {
      await tentarApagarFicheiroBunny(curso.pdf_path);
    } catch (error: unknown) {
      avisos.push(
        `Não foi possível apagar o PDF do curso no Bunny: ${getErrorMessage(
          error,
          "erro desconhecido"
        )}`
      );
    }

    try {
      await tentarApagarFicheiroBunny(curso.certificado_pronto_path);
    } catch (error: unknown) {
      avisos.push(
        `Não foi possível apagar o certificado pronto no Bunny: ${getErrorMessage(
          error,
          "erro desconhecido"
        )}`
      );
    }

    try {
      await tentarApagarFicheiroBunny(curso.certificado_modelo_path);
    } catch (error: unknown) {
      avisos.push(
        `Não foi possível apagar o modelo do certificado no Bunny: ${getErrorMessage(
          error,
          "erro desconhecido"
        )}`
      );
    }

    try {
      await tentarApagarCapaSupabase(curso.capa_url);
    } catch (error: unknown) {
      avisos.push(
        `Não foi possível apagar a capa do curso: ${getErrorMessage(
          error,
          "erro desconhecido"
        )}`
      );
    }

    return NextResponse.json({
      success: true,
      avisos,
    });
  } catch (error: unknown) {
    return NextResponse.json(
      {
        error: getErrorMessage(
          error,
          "Ocorreu um erro inesperado ao apagar o curso."
        ),
        avisos,
      },
      { status: 500 }
    );
  }
}