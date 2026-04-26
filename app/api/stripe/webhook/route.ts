import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

function obterStripe() {
  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!secretKey) {
    throw new Error("STRIPE_SECRET_KEY não está configurada.");
  }

  return new Stripe(secretKey);
}

export async function POST(request: NextRequest) {
  const stripe = obterStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    return NextResponse.json(
      { error: "STRIPE_WEBHOOK_SECRET não está configurado." },
      { status: 500 }
    );
  }

  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Assinatura Stripe em falta." },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    const rawBody = await request.text();

    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      webhookSecret
    );
  } catch (error: unknown) {
    return NextResponse.json(
      {
        error: getErrorMessage(
          error,
          "Não foi possível validar o webhook da Stripe."
        ),
      },
      { status: 400 }
    );
  }

  try {
    if (event.type === "checkout.session.completed") {
      await processarCheckoutConcluido(
        event.data.object as Stripe.Checkout.Session
      );
    }

    if (event.type === "checkout.session.expired") {
      await processarCheckoutExpirado(
        event.data.object as Stripe.Checkout.Session
      );
    }

    return NextResponse.json({ received: true });
  } catch (error: unknown) {
    return NextResponse.json(
      {
        error: getErrorMessage(
          error,
          "Ocorreu um erro ao processar o webhook da Stripe."
        ),
      },
      { status: 500 }
    );
  }
}

async function processarCheckoutConcluido(session: Stripe.Checkout.Session) {
  const supabaseAdmin = getSupabaseAdmin();

  const cursoId = Number(session.metadata?.curso_id || 0);
  const alunoEmail =
    session.customer_details?.email ||
    session.customer_email ||
    session.metadata?.aluno_email ||
    "";
  const alunoNome =
    session.customer_details?.name || session.metadata?.aluno_nome || null;

  const regiaoCheckout = normalizarRegiao(
    session.metadata?.regiao_checkout || "eu"
  );

  const moeda = String(
    session.currency || session.metadata?.moeda || "eur"
  ).toLowerCase();

  const valorTotalCentavos =
    typeof session.amount_total === "number"
      ? session.amount_total
      : Number(session.metadata?.valor_total_centavos || 0);

  const valorTotal = Number((valorTotalCentavos / 100).toFixed(2));

  const paymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id || "";

  const customerId =
    typeof session.customer === "string"
      ? session.customer
      : session.customer?.id || null;

  if (!cursoId || Number.isNaN(cursoId)) {
    throw new Error("Webhook sem curso_id válido.");
  }

  if (!alunoEmail) {
    throw new Error("Webhook sem email de aluno.");
  }

  if (!session.id) {
    throw new Error("Webhook sem checkout session id.");
  }

  await supabaseAdmin
    .from("stripe_checkout_sessoes")
    .update({
      stripe_payment_intent_id: paymentIntentId || null,
      status: "paga",
      updated_at: new Date().toISOString(),
      metadata: {
        stripe_event: "checkout.session.completed",
        stripe_session_id: session.id,
        stripe_customer_id: customerId,
        payment_status: session.payment_status,
      },
    })
    .eq("stripe_checkout_session_id", session.id);

  const { data: vendaId, error: ativarError } = await supabaseAdmin.rpc(
    "ativar_acesso_compra_curso",
    {
      p_stripe_checkout_session_id: session.id,
      p_stripe_payment_intent_id: paymentIntentId || null,
      p_curso_id: cursoId,
      p_aluno_email: alunoEmail,
      p_aluno_nome: alunoNome,
      p_regiao_checkout: regiaoCheckout,
      p_moeda: moeda,
      p_valor_total: valorTotal,
      p_valor_total_centavos: valorTotalCentavos,
      p_stripe_customer_id: customerId,
      p_metadata: {
        stripe_session_id: session.id,
        stripe_payment_status: session.payment_status,
        stripe_currency: session.currency,
        stripe_customer_id: customerId,
      },
    }
  );

  if (ativarError) {
    throw new Error(
      ativarError.message || "Não foi possível ativar o acesso ao curso."
    );
  }

  await supabaseAdmin
    .from("stripe_checkout_sessoes")
    .update({
      status: "paga",
      updated_at: new Date().toISOString(),
      metadata: {
        stripe_event: "checkout.session.completed",
        venda_id: vendaId,
      },
    })
    .eq("stripe_checkout_session_id", session.id);
}

async function processarCheckoutExpirado(session: Stripe.Checkout.Session) {
  const supabaseAdmin = getSupabaseAdmin();

  await supabaseAdmin
    .from("stripe_checkout_sessoes")
    .update({
      status: "expirada",
      updated_at: new Date().toISOString(),
      metadata: {
        stripe_event: "checkout.session.expired",
        stripe_session_id: session.id,
      },
    })
    .eq("stripe_checkout_session_id", session.id);
}

function normalizarRegiao(valor: string) {
  const normalizado = valor.trim().toLowerCase();

  if (normalizado === "br") return "br";
  return "eu";
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}