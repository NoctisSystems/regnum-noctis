import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { uploadCertificado, uploadPdfCurso } from "@/lib/bunny-storage";

type Formador = {
  id: number;
  auth_id: string | null;
  email: string | null;
  status: string | null;
};

function getSupabaseFromRoute(
  cookieStore: Awaited<ReturnType<typeof cookies>>
) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set() {},
        remove() {},
      },
    }
  );
}

async function encontrarFormadorComRecuperacao(
  supabase: ReturnType<typeof getSupabaseFromRoute>,
  userId: string,
  userEmail: string | null | undefined
): Promise<Formador | null> {
  const { data: porAuthId } = await supabase
    .from("formadores")
    .select("id, auth_id, email, status")
    .eq("auth_id", userId)
    .maybeSingle();

  if (porAuthId) {
    return porAuthId as Formador;
  }

  if (!userEmail) {
    return null;
  }

  const { data: porEmail } = await supabase
    .from("formadores")
    .select("id, auth_id, email, status")
    .eq("email", userEmail)
    .maybeSingle();

  if (!porEmail) {
    return null;
  }

  if (!porEmail.auth_id) {
    const { error: updateError } = await supabase
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

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = getSupabaseFromRoute(cookieStore);

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

    const formador = await encontrarFormadorComRecuperacao(
      supabase,
      user.id,
      user.email
    );

    if (!formador || formador.status !== "aprovado") {
      return NextResponse.json(
        { error: "A conta de formador não está aprovada." },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");
    const kind = String(formData.get("kind") || "");
    const cursoIdRaw = formData.get("cursoId");

    const cursoId =
      typeof cursoIdRaw === "string" && cursoIdRaw.trim()
        ? Number(cursoIdRaw)
        : null;

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Não foi enviado nenhum ficheiro válido." },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const fileName = file.name;

    if (kind === "pdf_curso") {
      if (file.type !== "application/pdf") {
        return NextResponse.json(
          { error: "O ficheiro principal do conteúdo tem de estar em PDF." },
          { status: 400 }
        );
      }

      const resultado = await uploadPdfCurso({
        formadorAuthId: user.id,
        cursoId,
        fileName,
        content: arrayBuffer,
      });

      return NextResponse.json({
        ok: true,
        storagePath: resultado.storagePath,
      });
    }

    if (kind === "certificado_pronto" || kind === "certificado_modelo") {
      const tiposPermitidos = ["application/pdf", "image/png"];

      if (!tiposPermitidos.includes(file.type)) {
        return NextResponse.json(
          { error: "O certificado tem de estar em PDF ou PNG." },
          { status: 400 }
        );
      }

      const resultado = await uploadCertificado({
        formadorAuthId: user.id,
        cursoId,
        fileName,
        content: arrayBuffer,
        contentType: file.type || "application/octet-stream",
      });

      return NextResponse.json({
        ok: true,
        storagePath: resultado.storagePath,
      });
    }

    return NextResponse.json(
      { error: "Tipo de upload inválido." },
      { status: 400 }
    );
  } catch (error: unknown) {
    const mensagem =
      error instanceof Error && error.message
        ? error.message
        : "Ocorreu um erro inesperado ao enviar o ficheiro.";

    return NextResponse.json({ error: mensagem }, { status: 500 });
  }
}