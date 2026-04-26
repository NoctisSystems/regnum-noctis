import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

type AdminRegisto = {
  id: number;
  auth_id: string | null;
  email: string | null;
};

type FormadorRegisto = {
  id: number;
  nome: string | null;
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

function normalizarNumero(valor: unknown) {
  if (valor === null || valor === undefined || valor === "") return null;

  const numero = Number(String(valor).replace(",", "."));

  if (Number.isNaN(numero)) return null;

  return numero;
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

    const formadorId = Number(body?.formador_id || body?.formadorId || 0);
    const valor = normalizarNumero(body?.valor);
    const moeda = normalizarTexto(body?.moeda || "eur")?.toLowerCase() || "eur";
    const operacao =
      normalizarTexto(body?.operacao || body?.tipo_operacao || "credito")
        ?.toLowerCase() || "credito";
    const saldoDestino =
      normalizarTexto(body?.saldo_destino || body?.saldoDestino || "disponivel")
        ?.toLowerCase() || "disponivel";
    const descricao = normalizarTexto(body?.descricao);
    const referencia = normalizarTexto(body?.referencia);
    const vendaIdRaw = normalizarNumero(body?.venda_id || body?.vendaId);
    const cursoIdRaw = normalizarNumero(body?.curso_id || body?.cursoId);
    const alunoIdRaw = normalizarNumero(body?.aluno_id || body?.alunoId);

    const vendaId =
      vendaIdRaw !== null && vendaIdRaw > 0 ? Number(vendaIdRaw) : null;
    const cursoId =
      cursoIdRaw !== null && cursoIdRaw > 0 ? Number(cursoIdRaw) : null;
    const alunoId =
      alunoIdRaw !== null && alunoIdRaw > 0 ? Number(alunoIdRaw) : null;

    if (!formadorId || Number.isNaN(formadorId)) {
      return NextResponse.json(
        { ok: false, error: "Formador inválido." },
        { status: 400 }
      );
    }

    if (valor === null || valor <= 0) {
      return NextResponse.json(
        { ok: false, error: "O valor tem de ser superior a zero." },
        { status: 400 }
      );
    }

    if (!["eur", "brl"].includes(moeda)) {
      return NextResponse.json(
        { ok: false, error: "Moeda inválida. Usa eur ou brl." },
        { status: 400 }
      );
    }

    if (!["credito", "debito"].includes(operacao)) {
      return NextResponse.json(
        { ok: false, error: "Operação inválida. Usa credito ou debito." },
        { status: 400 }
      );
    }

    if (!["disponivel", "retido"].includes(saldoDestino)) {
      return NextResponse.json(
        {
          ok: false,
          error: "Destino inválido. Usa disponivel ou retido.",
        },
        { status: 400 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();

    const { data: formador, error: formadorError } = await supabaseAdmin
      .from("formadores")
      .select("id, nome, email")
      .eq("id", formadorId)
      .maybeSingle<FormadorRegisto>();

    if (formadorError || !formador) {
      return NextResponse.json(
        { ok: false, error: "Formador não encontrado." },
        { status: 404 }
      );
    }

    const tipo =
      operacao === "credito"
        ? saldoDestino === "retido"
          ? "saldo_formador_retido"
          : "saldo_formador_disponivel"
        : "ajuste_manual";

    const direcao = operacao === "credito" ? "entrada" : "saida";

    const estado =
      operacao === "credito"
        ? saldoDestino === "retido"
          ? "retido"
          : "disponivel"
        : "registado";

    const descricaoFinal =
      descricao ||
      (operacao === "credito"
        ? `Crédito manual lançado pela administração para o formador ${
            formador.nome || formador.email || formador.id
          }.`
        : `Débito manual lançado pela administração ao formador ${
            formador.nome || formador.email || formador.id
          }.`);

    const { data: movimento, error } = await supabaseAdmin
      .from("movimentos_financeiros")
      .insert({
        venda_id: vendaId,
        curso_id: cursoId,
        formador_id: formadorId,
        aluno_id: alunoId,
        tipo,
        direcao,
        moeda,
        valor,
        estado,
        descricao: descricaoFinal,
        metadata: {
          origem: "ajuste_manual_admin",
          operacao,
          saldo_destino: saldoDestino,
          referencia,
          admin_email: validacaoAdmin.admin.email,
          formador_email: formador.email,
        },
      })
      .select("id")
      .single();

    if (error) {
      return NextResponse.json(
        {
          ok: false,
          error:
            error.message ||
            "Não foi possível lançar o movimento financeiro manual.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      movimento_id: movimento.id,
      mensagem:
        operacao === "credito"
          ? "Crédito manual lançado com sucesso no saldo do formador."
          : "Débito manual lançado com sucesso no saldo do formador.",
    });
  } catch (error: unknown) {
    return NextResponse.json(
      {
        ok: false,
        error: getErrorMessage(
          error,
          "Ocorreu um erro inesperado ao ajustar o saldo do formador."
        ),
      },
      { status: 500 }
    );
  }
}