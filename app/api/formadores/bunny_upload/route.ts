import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type FormadorRow = {
  id: number;
  auth_id: string | null;
  status: string | null;
};

type CursoRow = {
  id: number;
  titulo: string | null;
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

    const body = await request.formData();

    const file = body.get("file");
    const cursoIdRaw = body.get("cursoId");
    const aulaTituloRaw = body.get("aulaTitulo");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Nenhum ficheiro de vídeo foi enviado." },
        { status: 400 }
      );
    }

    const cursoId = Number(cursoIdRaw);
    const aulaTitulo =
      typeof aulaTituloRaw === "string" ? aulaTituloRaw.trim() : "";

    if (!cursoId || Number.isNaN(cursoId)) {
      return NextResponse.json(
        { error: "Curso inválido." },
        { status: 400 }
      );
    }

    if (!aulaTitulo) {
      return NextResponse.json(
        { error: "Indica o título da aula." },
        { status: 400 }
      );
    }

    if (!file.type.startsWith("video/")) {
      return NextResponse.json(
        { error: "O ficheiro enviado não é um vídeo válido." },
        { status: 400 }
      );
    }

    const maxBytes = 2 * 1024 * 1024 * 1024;
    if (file.size > maxBytes) {
      return NextResponse.json(
        { error: "O vídeo não pode ultrapassar 2 GB." },
        { status: 400 }
      );
    }

    const { data: cursoData, error: cursoError } = await supabase
      .from("cursos")
      .select("id, titulo, formador_id")
      .eq("id", cursoId)
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
        { error: "Não tens permissão para carregar vídeos neste curso." },
        { status: 403 }
      );
    }

    const libraryId = getEnv("BUNNY_STREAM_LIBRARY_ID");
    const accessKey = getEnv("BUNNY_STREAM_API_KEY");

    const tituloVideo = `${curso.titulo || "Curso"} - ${aulaTitulo}`;

    const createResponse = await fetch(
      `https://video.bunnycdn.com/library/${libraryId}/videos`,
      {
        method: "POST",
        headers: {
          AccessKey: accessKey,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: tituloVideo,
        }),
      }
    );

    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      return NextResponse.json(
        {
          error:
            errorText ||
            "Falha ao criar o registo do vídeo no Bunny Stream.",
        },
        { status: 502 }
      );
    }

    const createJson = await createResponse.json();
    const videoId = createJson?.guid;

    if (!videoId || typeof videoId !== "string") {
      return NextResponse.json(
        { error: "O Bunny não devolveu um identificador de vídeo válido." },
        { status: 502 }
      );
    }

    const fileBuffer = Buffer.from(await file.arrayBuffer());

    const uploadResponse = await fetch(
      `https://video.bunnycdn.com/library/${libraryId}/videos/${videoId}`,
      {
        method: "PUT",
        headers: {
          AccessKey: accessKey,
          Accept: "application/json",
          "Content-Type": "application/octet-stream",
        },
        body: fileBuffer,
      }
    );

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      return NextResponse.json(
        {
          error:
            errorText ||
            "Falha ao enviar o ficheiro de vídeo para o Bunny Stream.",
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      videoId,
      tituloVideo,
      originalFileName: file.name,
      size: file.size,
      mimeType: file.type,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error:
          error?.message ||
          "Ocorreu um erro inesperado no upload do vídeo.",
      },
      { status: 500 }
    );
  }
}