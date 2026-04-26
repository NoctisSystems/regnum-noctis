import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { enviarEmail } from "@/lib/email";

type AdminRegisto = {
  id: number;
  auth_id: string | null;
  email: string | null;
};

type TicketRegisto = {
  id: number;
  aluno_id: number;
  curso_id: number | null;
  assunto: string | null;
};

type AlunoRegisto = {
  id: number;
  nome: string | null;
  email: string | null;
};

function normalizarTexto(valor: unknown) {
  if (valor === null || valor === undefined) return "";
  return String(valor).trim();
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

async function validarAdmin(request: NextRequest) {
  const supabaseAdmin = getSupabaseAdmin();

  const authHeader = request.headers.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.replace("Bearer ", "").trim()
    : "";

  if (!token) {
    return {
      ok: false as const,
      status: 401,
      error: "Sessão administrativa em falta.",
      admin: null,
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
      error: "Não foi possível validar a sessão administrativa.",
      admin: null,
    };
  }

  const { data: adminData, error: adminError } = await supabaseAdmin
    .from("admin")
    .select("id, auth_id, email")
    .eq("auth_id", user.id)
    .maybeSingle<AdminRegisto>();

  if (adminError || !adminData) {
    return {
      ok: false as const,
      status: 403,
      error: "Esta conta não tem permissões de administração.",
      admin: null,
    };
  }

  return {
    ok: true as const,
    status: 200,
    error: null,
    admin: adminData,
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

    const validacaoAdmin = await validarAdmin(request);

    if (!validacaoAdmin.ok || !validacaoAdmin.admin) {
      return NextResponse.json(
        { ok: false, error: validacaoAdmin.error },
        { status: validacaoAdmin.status }
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

    const { error: mensagemError } = await supabaseAdmin
      .from("suporte_ticket_mensagens")
      .insert({
        ticket_id: ticket.id,
        autor_tipo: "admin",
        autor_id: validacaoAdmin.admin.id,
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
        estado: "aguarda_resposta_aluno",
        updated_at: new Date().toISOString(),
      })
      .eq("id", ticket.id);

    const { data: aluno } = await supabaseAdmin
      .from("alunos")
      .select("id, nome, email")
      .eq("id", ticket.aluno_id)
      .maybeSingle<AlunoRegisto>();

    if (aluno?.email) {
      try {
        await enviarEmail({
          to: aluno.email,
          subject: "Resposta ao teu ticket na Regnum Noctis",
          text: [
            "Tens uma nova resposta a um ticket na Regnum Noctis.",
            "",
            `Ticket: #${ticket.id}`,
            "",
            "Acede à tua área de aluno para consultar e responder.",
          ].join("\n"),
        });
      } catch (emailError) {
        console.error("Erro ao enviar alerta ao aluno:", emailError);
      }
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