import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { emailAdminRegnum, enviarEmail } from "@/lib/email";

type AlunoRegisto = {
  id: number;
  nome: string | null;
  email: string | null;
  auth_id: string | null;
};

type CursoRegisto = {
  id: number;
  titulo: string | null;
  formador_id: number | null;
};

function normalizarTexto(valor: unknown) {
  if (valor === null || valor === undefined) return "";
  return String(valor).trim();
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

async function validarAluno(request: NextRequest) {
  const supabaseAdmin = getSupabaseAdmin();

  const authHeader = request.headers.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.replace("Bearer ", "").trim()
    : "";

  if (!token) {
    return {
      ok: false as const,
      status: 401,
      error: "Sessão de aluno em falta.",
      aluno: null,
    };
  }

  const {
    data: { user },
    error: userError,
  } = await supabaseAdmin.auth.getUser(token);

  if (userError || !user) {
    return {
      ok: false as const,
      status: 401,
      error: "Não foi possível validar a sessão do aluno.",
      aluno: null,
    };
  }

  const { data: porAuthId } = await supabaseAdmin
    .from("alunos")
    .select("id, nome, email, auth_id")
    .eq("auth_id", user.id)
    .maybeSingle<AlunoRegisto>();

  if (porAuthId) {
    return {
      ok: true as const,
      status: 200,
      error: null,
      aluno: porAuthId,
    };
  }

  if (user.email) {
    const email = user.email.trim().toLowerCase();

    const { data: porEmail, error: porEmailError } = await supabaseAdmin
      .from("alunos")
      .select("id, nome, email, auth_id")
      .ilike("email", email)
      .maybeSingle<AlunoRegisto>();

    if (porEmailError) {
      return {
        ok: false as const,
        status: 500,
        error: porEmailError.message,
        aluno: null,
      };
    }

    if (porEmail) {
      if (!porEmail.auth_id) {
        await supabaseAdmin
          .from("alunos")
          .update({ auth_id: user.id })
          .eq("id", porEmail.id);

        return {
          ok: true as const,
          status: 200,
          error: null,
          aluno: {
            ...porEmail,
            auth_id: user.id,
          },
        };
      }

      return {
        ok: true as const,
        status: 200,
        error: null,
        aluno: porEmail,
      };
    }
  }

  return {
    ok: false as const,
    status: 403,
    error: "Não foi possível encontrar o registo do aluno.",
    aluno: null,
  };
}

export async function POST(request: NextRequest) {
  try {
    const validacaoAluno = await validarAluno(request);

    if (!validacaoAluno.ok || !validacaoAluno.aluno) {
      return NextResponse.json(
        { ok: false, error: validacaoAluno.error },
        { status: validacaoAluno.status }
      );
    }

    const body = await request.json();

    const cursoId = Number(body?.curso_id || body?.cursoId || 0);
    const razao = normalizarTexto(body?.razao || body?.motivo || "suporte");
    const assunto = normalizarTexto(body?.assunto);
    const mensagem = normalizarTexto(body?.mensagem);

    if (!cursoId || Number.isNaN(cursoId)) {
      return NextResponse.json(
        { ok: false, error: "Curso inválido." },
        { status: 400 }
      );
    }

    if (!assunto) {
      return NextResponse.json(
        { ok: false, error: "Indica o assunto do ticket." },
        { status: 400 }
      );
    }

    if (!mensagem) {
      return NextResponse.json(
        { ok: false, error: "Escreve a mensagem do ticket." },
        { status: 400 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();

    const { data: curso, error: cursoError } = await supabaseAdmin
      .from("cursos")
      .select("id, titulo, formador_id")
      .eq("id", cursoId)
      .maybeSingle<CursoRegisto>();

    if (cursoError || !curso) {
      return NextResponse.json(
        { ok: false, error: "Curso não encontrado." },
        { status: 404 }
      );
    }

    const { data: inscricao, error: inscricaoError } = await supabaseAdmin
      .from("inscricoes")
      .select("id")
      .eq("aluno_id", validacaoAluno.aluno.id)
      .eq("curso_id", cursoId)
      .maybeSingle();

    if (inscricaoError || !inscricao) {
      return NextResponse.json(
        {
          ok: false,
          error: "Este aluno não tem inscrição ativa neste curso.",
        },
        { status: 403 }
      );
    }

    const { data: ticket, error: ticketError } = await supabaseAdmin
      .from("suporte_tickets")
      .insert({
        aluno_id: validacaoAluno.aluno.id,
        curso_id: curso.id,
        formador_id: curso.formador_id,
        formador_envolvido: false,
        razao,
        assunto,
        estado: "aberto",
        prioridade: "normal",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (ticketError || !ticket) {
      return NextResponse.json(
        {
          ok: false,
          error: ticketError?.message || "Não foi possível criar o ticket.",
        },
        { status: 500 }
      );
    }

    const { error: mensagemError } = await supabaseAdmin
      .from("suporte_ticket_mensagens")
      .insert({
        ticket_id: ticket.id,
        autor_tipo: "aluno",
        autor_id: validacaoAluno.aluno.id,
        mensagem,
        visivel_aluno: true,
        visivel_formador: false,
        created_at: new Date().toISOString(),
      });

    if (mensagemError) {
      return NextResponse.json(
        {
          ok: false,
          error:
            mensagemError.message ||
            "O ticket foi criado, mas a mensagem não foi guardada.",
        },
        { status: 500 }
      );
    }

    try {
      await enviarEmail({
        to: emailAdminRegnum(),
        subject: "Novo ticket na Regnum Noctis",
        text: [
          "Foi aberto um novo ticket na plataforma.",
          "",
          `Ticket: #${ticket.id}`,
          `Curso: ${curso.titulo || `#${curso.id}`}`,
          "",
          "Acede à área de administração para consultar e responder.",
        ].join("\n"),
      });
    } catch (emailError) {
      console.error("Erro ao enviar alerta de ticket:", emailError);
    }

    return NextResponse.json({
      ok: true,
      ticket_id: ticket.id,
      mensagem: "Ticket criado com sucesso.",
    });
  } catch (error: unknown) {
    return NextResponse.json(
      {
        ok: false,
        error: getErrorMessage(error, "Erro inesperado ao criar ticket."),
      },
      { status: 500 }
    );
  }
}