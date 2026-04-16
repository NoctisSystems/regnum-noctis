import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type FormadorRow = {
  id: number;
  auth_id: string | null;
  status: string | null;
};

type AulaRow = {
  id: number;
  curso_id: number;
  video_url: string | null;
};

type CursoRow = {
  id: number;
  formador_id: number | null;
};

function getEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Falta configurar a variável de ambiente ${name}.`);
  }

  return value;
}

function getSupabaseFromBearerToken(token: string) {
  const supabaseUrl = getEnv("NEXT_PUBLIC_SUPABASE_URL");
  const supabaseAnonKey = getEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");

  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });
}

function getBearerToken(request: NextRequest) {
  const authHeader = request.headers.get("authorization") || "";

  if (!authHeader.startsWith("Bearer ")) {
    return "";
  }

  return authHeader.slice(7).trim();
}

async function apagarVideoNoBunny(videoId: string) {
  const libraryId = getEnv("BUNNY_STREAM_LIBRARY_ID");
  const accessKey = getEnv("BUNNY_STREAM_API_KEY");

  const response = await fetch(
    `https://video.bunnycdn.com/library/${libraryId}/videos/${videoId}`,
    {
      method: "DELETE",
      headers: {
        AccessKey: accessKey,
        Accept: "application/json",
      },
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      errorText || "Falha ao apagar o vídeo no Bunny Stream."
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const bearerToken = getBearerToken(request);

    if (!bearerToken) {
      return NextResponse.json(
        { error: "Sessão inválida. Token de autenticação em falta." },
        { status: 401 }
      );
    }

    const supabase = getSupabaseFromBearerToken(bearerToken);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "Não foi possível validar a sessão do formador." },
        { status: 401 }
      );
    }

    const { data: formadorData, error: formadorError } = await supabase
      .from("formadores")
      .select("id, auth_id, status")
      .eq("auth_id", user.id)
      .single();

    if (formadorError || !formadorData) {
      return NextResponse.json(
        { error: "Não foi possível encontrar o registo do formador." },
        { status: 403 }
      );
    }

    const formador = formadorData as FormadorRow;

    if (formador.status !== "aprovado") {
      return NextResponse.json(
        { error: "A conta de formador não está aprovada." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const aulaId = Number(body?.aulaId || 0);
    const apagarAula = Boolean(body?.apagarAula);

    if (!aulaId || Number.isNaN(aulaId)) {
      return NextResponse.json(
        { error: "Aula inválida." },
        { status: 400 }
      );
    }

    const { data: aulaData, error: aulaError } = await supabase
      .from("aulas")
      .select("id, curso_id, video_url")
      .eq("id", aulaId)
      .single();

    if (aulaError || !aulaData) {
      return NextResponse.json(
        { error: "Aula não encontrada." },
        { status: 404 }
      );
    }

    const aula = aulaData as AulaRow;

    const { data: cursoData, error: cursoError } = await supabase
      .from("cursos")
      .select("id, formador_id")
      .eq("id", aula.curso_id)
      .single();

    if (cursoError || !cursoData) {
      return NextResponse.json(
        { error: "Curso não encontrado." },
        { status: 404 }
      );
    }

    const curso = cursoData as CursoRow;

    if (curso.formador_id !== formador.id) {
      return NextResponse.json(
        { error: "Não tens permissão para alterar esta aula." },
        { status: 403 }
      );
    }

    if (aula.video_url) {
      await apagarVideoNoBunny(aula.video_url);
    }

    if (apagarAula) {
      const { error: deleteAulaError } = await supabase
        .from("aulas")
        .delete()
        .eq("id", aula.id);

      if (deleteAulaError) {
        return NextResponse.json(
          { error: deleteAulaError.message || "Não foi possível apagar a aula." },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        apagouVideo: true,
        apagouAula: true,
      });
    }

    const { error: updateAulaError } = await supabase
      .from("aulas")
      .update({
        video_url: null,
      })
      .eq("id", aula.id);

    if (updateAulaError) {
      return NextResponse.json(
        {
          error:
            updateAulaError.message ||
            "Não foi possível remover o vídeo da aula.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      apagouVideo: true,
      apagouAula: false,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error:
          error?.message ||
          "Ocorreu um erro inesperado ao apagar o vídeo no Bunny.",
      },
      { status: 500 }
    );
  }
}