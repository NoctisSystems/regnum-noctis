import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

type RegiaoCheckout = "EU" | "BR";

type CursoCheckout = {
  id: number;
  titulo: string | null;
  publicado: boolean | null;
  preco: number | null;
  preco_eur: number | null;
  preco_brl: number | null;
  checkout_eu_ativo: boolean | null;
  checkout_br_ativo: boolean | null;
};

type AlunoExistente = {
  id: number;
  email: string | null;
  pais: string | null;
  regiao_checkout: string | null;
};

type CheckoutResolvido = {
  disponivel: boolean;
  erro: string | null;
  moeda: "EUR" | "BRL";
  valor: number | null;
};

function obterStripe() {
  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!secretKey) {
    return null;
  }

  return new Stripe(secretKey, {
    apiVersion: "2026-03-25.dahlia",
  });
}

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type") || "";

    let cursoIdRaw: string | null = null;
    let emailRaw: string | null = null;
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

      regiaoRaw =
        body?.regiao !== undefined && body?.regiao !== null
          ? String(body.regiao)
          : null;
    } else {
      const formData = await request.formData();

      cursoIdRaw = formData.get("cursoId")
        ? String(formData.get("cursoId"))
        : null;

      emailRaw = formData.get("email")
        ? String(formData.get("email"))
        : null;

      regiaoRaw = formData.get("regiao")
        ? String(formData.get("regiao"))
        : null;
    }

    const cursoId = Number(cursoIdRaw || 0);
    const email = normalizarEmail(emailRaw);
    const regiao = normalizarRegiao(regiaoRaw);

    if (!cursoId || Number.isNaN(cursoId)) {
      return responderErro(request, "Curso inválido.", 400);
    }

    if (!email || !validarEmail(email)) {
      return responderErro(
        request,
        "Indica um email válido para a compra.",
        400
      );
    }

    if (!regiao) {
      return responderErro(request, "Região de checkout inválida.", 400);
    }

    const supabaseAdmin = getSupabaseAdmin();

    const { data: cursoData, error: cursoError } = await supabaseAdmin
      .from("cursos")
      .select(
        "id, titulo, publicado, preco, preco_eur, preco_brl, checkout_eu_ativo, checkout_br_ativo"
      )
      .eq("id", cursoId)
      .eq("publicado", true)
      .maybeSingle();

    if (cursoError) {
      return responderErro(
        request,
        cursoError.message || "Não foi possível validar o curso.",
        500
      );
    }

    if (!cursoData) {
      return responderErro(
        request,
        "Curso não encontrado ou não publicado.",
        404
      );
    }

    const curso = cursoData as CursoCheckout;
    const checkoutResolvido = resolverCheckoutCurso(curso, regiao);

    if (!checkoutResolvido.disponivel) {
      return responderErro(
        request,
        checkoutResolvido.erro || "Este checkout não está disponível.",
        409
      );
    }

    const { data: alunoData, error: alunoError } = await supabaseAdmin
      .from("alunos")
      .select("id, email, pais, regiao_checkout")
      .ilike("email", email)
      .maybeSingle();

    if (alunoError) {
      return responderErro(
        request,
        alunoError.message || "Não foi possível validar o aluno.",
        500
      );
    }

    const aluno = (alunoData as AlunoExistente | null) || null;

    if (aluno?.regiao_checkout && aluno.regiao_checkout !== regiao) {
      return responderErro(
        request,
        `Este email já está associado à região ${aluno.regiao_checkout}. Para continuar, usa a mesma região da conta ou outro email.`,
        409
      );
    }

    const valor = checkoutResolvido.valor;
    const moeda = checkoutResolvido.moeda;

    if (valor === null) {
      return responderErro(
        request,
        "Não foi possível resolver o valor deste checkout.",
        500
      );
    }

    const stripe = obterStripe();

    if (!stripe) {
      return responderSucesso(request, {
        ok: true,
        stripe_configurado: false,
        mensagem:
          "Validação concluída com sucesso. A STRIPE_SECRET_KEY ainda não está configurada, por isso a sessão Stripe não foi criada.",
        compra: {
          curso_id: curso.id,
          curso_titulo: curso.titulo,
          email,
          regiao_checkout: regiao,
          moeda,
          valor,
        },
        aluno_existente: aluno
          ? {
              id: aluno.id,
              email: aluno.email,
              pais: aluno.pais,
              regiao_checkout: aluno.regiao_checkout,
            }
          : null,
      });
    }

    const origin =
      request.headers.get("origin") ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      "http://localhost:3000";

    const successUrl = `${origin}/cursos/${curso.id}?checkout=sucesso`;
    const cancelUrl = `${origin}/cursos/${curso.id}?checkout=cancelado&regiao=${regiao}`;

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
            currency: moeda.toLowerCase(),
            unit_amount: converterParaStripeAmount(valor, moeda),
            product_data: {
              name: curso.titulo || `Curso #${curso.id}`,
              description: `Compra de curso na região comercial ${regiao}`,
            },
          },
        },
      ],
      metadata: {
        curso_id: String(curso.id),
        email_compra: email,
        regiao_checkout: regiao,
        moeda_checkout: moeda,
      },
    });

    return responderSucesso(request, {
      ok: true,
      stripe_configurado: true,
      mensagem: "Sessão Stripe criada com sucesso.",
      checkout: {
        session_id: session.id,
        url: session.url,
      },
      compra: {
        curso_id: curso.id,
        curso_titulo: curso.titulo,
        email,
        regiao_checkout: regiao,
        moeda,
        valor,
      },
    });
  } catch (error: any) {
    return responderErro(
      request,
      error?.message || "Ocorreu um erro inesperado no checkout.",
      500
    );
  }
}

function resolverCheckoutCurso(
  curso: CursoCheckout,
  regiao: RegiaoCheckout
): CheckoutResolvido {
  const precoEur =
    typeof curso.preco_eur === "number"
      ? curso.preco_eur
      : typeof curso.preco === "number"
      ? curso.preco
      : null;

  const precoBrl =
    typeof curso.preco_brl === "number" ? curso.preco_brl : null;

  if (regiao === "EU") {
    if (!curso.checkout_eu_ativo) {
      return {
        disponivel: false,
        erro: "Este curso não está disponível para checkout EU.",
        moeda: "EUR",
        valor: null,
      };
    }

    if (precoEur === null) {
      return {
        disponivel: false,
        erro: "Este curso não tem preço EUR configurado.",
        moeda: "EUR",
        valor: null,
      };
    }

    return {
      disponivel: true,
      erro: null,
      moeda: "EUR",
      valor: precoEur,
    };
  }

  if (!curso.checkout_br_ativo) {
    return {
      disponivel: false,
      erro: "Este curso não está disponível para checkout BR.",
      moeda: "BRL",
      valor: null,
    };
  }

  if (precoBrl === null) {
    return {
      disponivel: false,
      erro: "Este curso não tem preço BRL configurado.",
      moeda: "BRL",
      valor: null,
    };
  }

  return {
    disponivel: true,
    erro: null,
    moeda: "BRL",
    valor: precoBrl,
  };
}

function converterParaStripeAmount(valor: number, moeda: "EUR" | "BRL") {
  const moedasSemCentavos = new Set([
    "BIF",
    "CLP",
    "DJF",
    "GNF",
    "JPY",
    "KMF",
    "KRW",
    "MGA",
    "PYG",
    "RWF",
    "UGX",
    "VND",
    "VUV",
    "XAF",
    "XOF",
    "XPF",
  ]);

  if (moedasSemCentavos.has(moeda)) {
    return Math.round(valor);
  }

  return Math.round(valor * 100);
}

function normalizarEmail(valor: string | null) {
  return (valor || "").trim().toLowerCase();
}

function normalizarRegiao(valor: string | null): RegiaoCheckout | null {
  const normalizada = (valor || "").trim().toUpperCase();

  if (normalizada === "EU") return "EU";
  if (normalizada === "BR") return "BR";

  return null;
}

function validarEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
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
          <title>Validação de compra</title>
        </head>
        <body style="margin:0;background:#2b160f;color:#e6c27a;font-family:serif;padding:40px;">
          <main style="max-width:760px;margin:0 auto;">
            <div style="border:1px solid rgba(255,107,107,0.35);background:rgba(120,20,20,0.12);padding:24px;">
              <h1 style="margin:0 0 14px 0;">Validação de compra</h1>
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

function responderSucesso(request: NextRequest, data: unknown) {
  if (querHtml(request)) {
    const json = data as {
      ok: boolean;
      stripe_configurado?: boolean;
      mensagem?: string;
      checkout?: { url?: string | null };
    };

    const checkoutUrl = json?.checkout?.url || null;

    const html = `
      <!DOCTYPE html>
      <html lang="pt">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>Validação de compra</title>
        </head>
        <body style="margin:0;background:#2b160f;color:#e6c27a;font-family:serif;padding:40px;">
          <main style="max-width:860px;margin:0 auto;">
            <div style="border:1px solid rgba(74,222,128,0.35);background:rgba(20,90,40,0.12);padding:24px;">
              <h1 style="margin:0 0 14px 0;">Validação de compra concluída</h1>
              <p style="margin:0 0 18px 0;line-height:1.7;">${escapeHtml(
                json?.mensagem || "Operação concluída."
              )}</p>
              ${
                checkoutUrl
                  ? `<p style="margin:0 0 18px 0;"><a href="${escapeHtml(
                      checkoutUrl
                    )}" style="display:inline-block;border:1px solid #c4914d;background:linear-gradient(180deg,#c4914d 0%, #a6783d 100%);color:#140d09;text-decoration:none;padding:14px 18px;font-weight:700;">Abrir checkout Stripe</a></p>`
                  : ""
              }
              <pre style="white-space:pre-wrap;word-break:break-word;background:rgba(20,13,9,0.55);padding:16px;border:1px solid rgba(166,120,61,0.25);overflow:auto;">${escapeHtml(
                JSON.stringify(data, null, 2)
              )}</pre>
              <div style="margin-top:18px;">
                <a href="/cursos" style="display:inline-block;border:1px solid #a6783d;color:#e6c27a;text-decoration:none;padding:12px 16px;">Voltar aos cursos</a>
              </div>
            </div>
          </main>
        </body>
      </html>
    `;
    return new NextResponse(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
      },
    });
  }

  return NextResponse.json(data);
}

function escapeHtml(valor: string) {
  return valor
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}