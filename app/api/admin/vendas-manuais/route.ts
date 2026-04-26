import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

type AdminRegisto = {
  id: number;
  auth_id: string | null;
  email: string | null;
};

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

function normalizarTexto(valor: unknown) {
  if (valor === null || valor === undefined) return null;

  const texto = String(valor).trim();

  return texto || null;
}

function normalizarEmail(valor: unknown) {
  const texto = normalizarTexto(valor);

  return texto ? texto.toLowerCase() : null;
}

function normalizarNumero(valor: unknown) {
  if (valor === null || valor === undefined || valor === "") return null;

  const numero = Number(String(valor).replace(",", "."));

  if (Number.isNaN(numero)) return null;

  return numero;
}

function validarEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
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

export async function POST(request: NextRequest) {
  try {
    const validacaoAdmin = await validarAdmin(request);

    if (!validacaoAdmin.ok) {
      return NextResponse.json(
        { ok: false, error: validacaoAdmin.error },
        { status: validacaoAdmin.status }
      );
    }

    const body = await request.json();

    const cursoId = Number(body?.curso_id || body?.cursoId || 0);
    const alunoEmail = normalizarEmail(body?.aluno_email || body?.alunoEmail);
    const alunoNome = normalizarTexto(body?.aluno_nome || body?.alunoNome);
    const valorTotal = normalizarNumero(body?.valor_total || body?.valorTotal);
    const moeda = normalizarTexto(body?.moeda || "eur")?.toLowerCase() || "eur";
    const regiaoCheckout =
      normalizarTexto(body?.regiao_checkout || body?.regiaoCheckout || "eu")
        ?.toLowerCase() || "eu";
    const metodoPagamento =
      normalizarTexto(body?.metodo_pagamento || body?.metodoPagamento) ||
      "pagamento_direto";
    const referenciaPagamento = normalizarTexto(
      body?.referencia_pagamento || body?.referenciaPagamento
    );
    const observacoes = normalizarTexto(body?.observacoes);
    const comissaoOverride = normalizarNumero(
      body?.comissao_percentual_override || body?.comissaoPercentualOverride
    );

    if (!cursoId || Number.isNaN(cursoId)) {
      return NextResponse.json(
        { ok: false, error: "Curso inválido." },
        { status: 400 }
      );
    }

    if (!alunoEmail || !validarEmail(alunoEmail)) {
      return NextResponse.json(
        { ok: false, error: "Email do aluno inválido." },
        { status: 400 }
      );
    }

    if (valorTotal !== null && valorTotal <= 0) {
      return NextResponse.json(
        { ok: false, error: "O valor total tem de ser superior a zero." },
        { status: 400 }
      );
    }

    if (!["eur", "brl"].includes(moeda)) {
      return NextResponse.json(
        { ok: false, error: "Moeda inválida. Usa eur ou brl." },
        { status: 400 }
      );
    }

    if (!["eu", "br"].includes(regiaoCheckout)) {
      return NextResponse.json(
        { ok: false, error: "Região inválida. Usa eu ou br." },
        { status: 400 }
      );
    }

    if (
      comissaoOverride !== null &&
      (comissaoOverride < 0 || comissaoOverride > 100)
    ) {
      return NextResponse.json(
        {
          ok: false,
          error: "A comissão manual tem de estar entre 0 e 100.",
        },
        { status: 400 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();

    const { data: vendaId, error } = await supabaseAdmin.rpc(
      "registar_venda_manual_curso",
      {
        p_curso_id: cursoId,
        p_aluno_email: alunoEmail,
        p_aluno_nome: alunoNome,
        p_valor_total: valorTotal,
        p_moeda: moeda,
        p_regiao_checkout: regiaoCheckout,
        p_metodo_pagamento: metodoPagamento,
        p_referencia_pagamento: referenciaPagamento,
        p_comissao_percentual_override: comissaoOverride,
        p_observacoes:
          observacoes ||
          `Venda manual registada pela administração: ${
            validacaoAdmin.admin.email || "admin"
          }.`,
      }
    );

    if (error) {
      return NextResponse.json(
        {
          ok: false,
          error: error.message || "Não foi possível registar a venda manual.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      venda_id: vendaId,
      mensagem:
        "Venda manual registada com sucesso. O acesso do aluno e o saldo do formador foram atualizados.",
    });
  } catch (error: unknown) {
    return NextResponse.json(
      {
        ok: false,
        error: getErrorMessage(
          error,
          "Ocorreu um erro inesperado ao registar a venda manual."
        ),
      },
      { status: 500 }
    );
  }
}