import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { emailAdminRegnum, enviarEmail } from "@/lib/email";

type AlunoRegisto = {
  id: number;
  nome: string | null;
  email: string | null;
  auth_id: string | null;
};

type TicketRegisto = {
  id: number;
  aluno_id: number;
  curso_id: number | null;
  assunto: string | null;
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

  const { data: aluno } = await supabaseAdmin
    .from("alunos")
    .select("id, nome, email, auth_id")
    .eq("auth_id", user.id)
    .maybeSingle<AlunoRegisto>();

  if (aluno) {
    return {
      ok: true as const,
      status: 200,
      error: null,
      aluno,
    };
  }

  if (user.email) {
    const { data: porEmail } = await supabaseAdmin
      .from("alunos")
      .select("id, nome, email, auth_id")
      .ilike("email", user.email.trim().toLowerCase())
      .maybeSingle<AlunoRegisto>();

    if (porEmail) {
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

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const ticketId = Number(params.id);

    if (!ticketId || Number.isNaN(ticketId)) {
      return NextResponse.json(
        { ok: false, error: "Ticket inválido." },
        { status: 400 }
      );
    }

    const validacaoAluno = await validarAluno(request);

    if (!validacaoAluno.ok || !validacaoAluno.aluno) {
      return NextResponse.json(
        { ok: false, error: validacaoAluno.error },
        { status: validacaoAluno.status }
      );
    }

    const body = await request.json();
    const mensagem = normalizarTexto(body?.mensagem);

    if (!mensagem) {
      return NextResponse.json(
        { ok: false, error: "Escreve a mensagem." },
        { status: 400 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();

    const { data: ticket, error: ticketError } = await supabaseAdmin
      .from("suporte_tickets")
      .select("id, aluno_id, curso_id, assunto")
      .eq("id", ticketId)
      .maybeSingle<TicketRegisto>();

    if (ticketError || !ticket) {
      return NextResponse.json(
        { ok: false, error: "Ticket não encontrado." },
        { status: 404 }
      );
    }

    if (ticket.aluno_id !== validacaoAluno.aluno.id) {
      return NextResponse.json(
        { ok: false, error: "Sem permissão para responder a este ticket." },
        { status: 403 }
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
          error: mensagemError.message || "Não foi possível enviar a resposta.",
        },
        { status: 500 }
      );
    }

    await supabaseAdmin
      .from("suporte_tickets")
      .update({
        estado: "aguarda_resposta_admin",
        updated_at: new Date().toISOString(),
      })
      .eq("id", ticket.id);

    try {
      await enviarEmail({
        to: emailAdminRegnum(),
        subject: "Nova resposta de aluno num ticket",
        text: [
          "Foi enviada uma nova resposta de aluno num ticket.",
          "",
          `Ticket: #${ticket.id}`,
          "",
          "Acede à área de administração para consultar e responder.",
        ].join("\n"),
      });
    } catch (emailError) {
      console.error("Erro ao enviar alerta de resposta de aluno:", emailError);
    }

    return NextResponse.json({
      ok: true,
      mensagem: "Resposta enviada com sucesso.",
    });
  } catch (error: unknown) {
    return NextResponse.json(
      {
        ok: false,
        error: getErrorMessage(error, "Erro inesperado ao enviar resposta."),
      },
      { status: 500 }
    );
  }
}