import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

type RegiaoCheckout = "eu" | "br";

type CursoCheckout = {
  id: number;
  titulo: string | null;
  descricao: string | null;
  publicado: boolean | null;
  preco: number | null;
  preco_eur: number | null;
  preco_brl: number | null;
  checkout_ativo: boolean | null;
  checkout_eu_ativo: boolean | null;
  checkout_br_ativo: boolean | null;
  formador_id: number | null;
};

function obterStripe() {
  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!secretKey) {
    throw new Error("STRIPE_SECRET_KEY não está configurada.");
  }

  return new Stripe(secretKey);
}

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type") || "";

    let cursoIdRaw: string | null = null;
    let emailRaw: string | null = null;
    let nomeRaw: string | null = null;
    let regiaoRaw: string | null = null;

    if (contentType.includes("application/json")) {
      const body = await request.json();

      cursoIdRaw =
        body?.cursoId !== undefined && body?.cursoId !== null
          ? String(body.cursoId)
          : null;

      emailRaw =
        body?.email !== undefined && body?.email !== null
          ? String(body.email)
          : null;

      nomeRaw =
        body?.nome !== undefined && body?.nome !== null
          ? String(body.nome)
          : null;

      regiaoRaw =
        body?.regiao !== undefined && body?.regiao !== null
          ? String(body.regiao)
          : null;
    } else {
      const formData = await request.formData();

      cursoIdRaw = formData.get("cursoId")
        ? String(formData.get("cursoId"))
        : null;

      emailRaw = formData.get("email") ? String(formData.get("email")) : null;

      nomeRaw = formData.get("nome") ? String(formData.get("nome")) : null;

      regiaoRaw = formData.get("regiao")
        ? String(formData.get("regiao"))
        : null;
    }

    const cursoId = Number(cursoIdRaw || 0);
    const email = normalizarEmail(emailRaw);
    const nome = normalizarTexto(nomeRaw);
    const regiao = normalizarRegiao(regiaoRaw);

    if (!cursoId || Number.isNaN(cursoId)) {
      return responderErro(request, "Curso inválido.", 400);
    }

    if (!email || !validarEmail(email)) {
      return responderErro(request, "Indica um email válido para a compra.", 400);
    }

    if (!regiao) {
      return responderErro(request, "Região de checkout inválida.", 400);
    }

    const supabaseAdmin = getSupabaseAdmin();

    const { data: cursoData, error: cursoError } = await supabaseAdmin
      .from("cursos")
      .select(
        "id, titulo, descricao, publicado, preco, preco_eur, preco_brl, checkout_ativo, checkout_eu_ativo, checkout_br_ativo, formador_id"
      )
      .eq("id", cursoId)
      .maybeSingle();

    if (cursoError) {
      return responderErro(
        request,
        cursoError.message || "Não foi possível validar o curso.",
        500
      );
    }

    if (!cursoData) {
      return responderErro(request, "Curso não encontrado.", 404);
    }

    const curso = cursoData as CursoCheckout;

    if (!curso.publicado) {
      return responderErro(request, "Este curso ainda não está publicado.", 409);
    }

    if (curso.checkout_ativo === false) {
      return responderErro(request, "O checkout deste curso não está ativo.", 409);
    }

    const checkout = resolverCheckoutCurso(curso, regiao);

    if (!checkout.disponivel || !checkout.valor) {
      return responderErro(
        request,
        checkout.erro || "Este checkout não está disponível.",
        409
      );
    }

    const valorCentavos = Math.round(checkout.valor * 100);
    const stripe = obterStripe();

    const siteUrl = normalizarSiteUrl(
      request.headers.get("origin") ||
        process.env.NEXT_PUBLIC_SITE_URL ||
        "http://localhost:3000"
    );

    const successUrl = `${siteUrl}/cursos/${curso.id}?checkout=sucesso&session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${siteUrl}/cursos/${curso.id}?checkout=cancelado`;

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: email,
      success_url: successUrl,
      cancel_url: cancelUrl,
      payment_method_types: ["card"],
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: checkout.moeda,
            unit_amount: valorCentavos,
            product_data: {
              name: curso.titulo || `Curso #${curso.id}`,
              description:
                curso.descricao?.slice(0, 450) ||
                "Curso adquirido através do Regnum Noctis.",
            },
          },
        },
      ],
      metadata: {
        curso_id: String(curso.id),
        formador_id: curso.formador_id ? String(curso.formador_id) : "",
        aluno_email: email,
        aluno_nome: nome || "",
        regiao_checkout: regiao,
        moeda: checkout.moeda,
        valor_total: String(checkout.valor),
        valor_total_centavos: String(valorCentavos),
      },
    });

    const { data: alunoExistente } = await supabaseAdmin
      .from("alunos")
      .select("id, email, nome")
      .ilike("email", email)
      .maybeSingle();

    await supabaseAdmin.from("stripe_checkout_sessoes").insert({
      stripe_checkout_session_id: session.id,
      stripe_payment_intent_id:
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : null,
      curso_id: curso.id,
      aluno_id: alunoExistente?.id || null,
      aluno_email: email,
      aluno_nome: nome || alunoExistente?.nome || null,
      regiao_checkout: regiao,
      moeda: checkout.moeda,
      valor_total: checkout.valor,
      valor_total_centavos: valorCentavos,
      status: "aberta",
      metadata: {
        curso_id: curso.id,
        formador_id: curso.formador_id,
        aluno_email: email,
        aluno_nome: nome,
        regiao_checkout: regiao,
      },
    });

    if (!session.url) {
      return responderErro(
        request,
        "A Stripe não devolveu URL de checkout.",
        500
      );
    }

    if (querHtml(request) && !contentType.includes("application/json")) {
      return NextResponse.redirect(session.url, 303);
    }

    return NextResponse.json({
      ok: true,
      checkout_url: session.url,
      stripe_checkout_session_id: session.id,
    });
  } catch (error: unknown) {
    return responderErro(
      request,
      getErrorMessage(error, "Ocorreu um erro inesperado no checkout."),
      500
    );
  }
}

function resolverCheckoutCurso(curso: CursoCheckout, regiao: RegiaoCheckout) {
  if (regiao === "eu") {
    const valor =
      typeof curso.preco_eur === "number"
        ? curso.preco_eur
        : typeof curso.preco === "number"
          ? curso.preco
          : null;

    if (!curso.checkout_eu_ativo) {
      return {
        disponivel: false,
        erro: "Este curso não está disponível para checkout EU.",
        moeda: "eur" as const,
        valor: null,
      };
    }

    if (!valor || valor <= 0) {
      return {
        disponivel: false,
        erro: "Este curso não tem preço EUR válido.",
        moeda: "eur" as const,
        valor: null,
      };
    }

    return {
      disponivel: true,
      erro: null,
      moeda: "eur" as const,
      valor,
    };
  }

  const valor = typeof curso.preco_brl === "number" ? curso.preco_brl : null;

  if (!curso.checkout_br_ativo) {
    return {
      disponivel: false,
      erro: "Este curso não está disponível para checkout BR.",
      moeda: "brl" as const,
      valor: null,
    };
  }

  if (!valor || valor <= 0) {
    return {
      disponivel: false,
      erro: "Este curso não tem preço BRL válido.",
      moeda: "brl" as const,
      valor: null,
    };
  }

  return {
    disponivel: true,
    erro: null,
    moeda: "brl" as const,
    valor,
  };
}

function normalizarEmail(valor: string | null) {
  return (valor || "").trim().toLowerCase();
}

function normalizarTexto(valor: string | null) {
  const texto = (valor || "").trim();
  return texto || null;
}

function normalizarRegiao(valor: string | null): RegiaoCheckout | null {
  const normalizada = (valor || "").trim().toLowerCase();

  if (normalizada === "eu") return "eu";
  if (normalizada === "br") return "br";

  return null;
}

function validarEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function normalizarSiteUrl(valor: string) {
  const limpo = valor.trim().replace(/\/$/, "");

  if (limpo.startsWith("http://") || limpo.startsWith("https://")) {
    return limpo;
  }

  return `https://${limpo}`;
}

function querHtml(request: NextRequest) {
  const accept = request.headers.get("accept") || "";
  return accept.includes("text/html");
}

function responderErro(
  request: NextRequest,
  mensagem: string,
  status: number
) {
  if (querHtml(request)) {
    const html = `
      <!DOCTYPE html>
      <html lang="pt">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>Checkout Regnum Noctis</title>
        </head>
        <body style="margin:0;background:#2b160f;color:#e6c27a;font-family:serif;padding:40px;">
          <main style="max-width:760px;margin:0 auto;">
            <div style="border:1px solid rgba(255,107,107,0.35);background:rgba(120,20,20,0.12);padding:24px;">
              <h1 style="margin:0 0 14px 0;">Não foi possível iniciar a compra</h1>
              <p style="margin:0 0 18px 0;line-height:1.7;">${escapeHtml(
                mensagem
              )}</p>
              <a href="/cursos" style="display:inline-block;border:1px solid #a6783d;color:#e6c27a;text-decoration:none;padding:12px 16px;">Voltar aos cursos</a>
            </div>
          </main>
        </body>
      </html>
    `;

    return new NextResponse(html, {
      status,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
      },
    });
  }

  return NextResponse.json(
    {
      ok: false,
      error: mensagem,
    },
    { status }
  );
}

function escapeHtml(valor: string) {
  return valor
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}