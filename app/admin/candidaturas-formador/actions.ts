"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function aprovarCandidatura(formData: FormData) {
  const supabaseAdmin = getSupabaseAdmin();

  const candidaturaId = String(formData.get("candidaturaId") || "");

  if (!candidaturaId) {
    throw new Error("ID da candidatura em falta.");
  }

  const { data: candidatura, error: candidaturaError } = await supabaseAdmin
    .from("formador_candidaturas")
    .select("*")
    .eq("id", candidaturaId)
    .single();

  if (candidaturaError || !candidatura) {
    throw new Error("Candidatura não encontrada.");
  }

  const { error: updateError } = await supabaseAdmin
    .from("formador_candidaturas")
    .update({ estado: "aprovado" })
    .eq("id", candidaturaId);

  if (updateError) {
    throw new Error(`Erro ao aprovar candidatura: ${updateError.message}`);
  }

  const { data: formadorExistente, error: formadorExistenteError } =
    await supabaseAdmin
      .from("formadores")
      .select("id")
      .eq("email", candidatura.email)
      .maybeSingle();

  if (formadorExistenteError) {
    throw new Error(
      `Erro ao verificar formador existente: ${formadorExistenteError.message}`
    );
  }

  const formadorPayload = {
    candidatura_id: candidatura.id,
    nome: candidatura.nome,
    email: candidatura.email,
    telefone: candidatura.numero_contacto || null,
    bio_curta: candidatura.biografia_curta || null,
    bio: candidatura.biografia_pagina_formador || null,
    area_ensino: candidatura.cursos_pretendidos || null,
    foto_url: candidatura.foto_url || null,
    status: "aprovado",
  };

  if (!formadorExistente) {
    const { error: createFormadorError } = await supabaseAdmin
      .from("formadores")
      .insert([formadorPayload]);

    if (createFormadorError) {
      throw new Error(
        `Candidatura aprovada, mas falhou a criação do formador: ${createFormadorError.message}`
      );
    }
  } else {
    const { error: updateFormadorError } = await supabaseAdmin
      .from("formadores")
      .update(formadorPayload)
      .eq("email", candidatura.email);

    if (updateFormadorError) {
      throw new Error(
        `Candidatura aprovada, mas falhou a atualização do formador: ${updateFormadorError.message}`
      );
    }
  }

  revalidatePath("/admin/candidaturas-formador");
  revalidatePath("/admin/candidaturas-formador/historico");
  revalidatePath("/admin/formadores");
  revalidatePath("/vitrine-formadores");

  try {
    const redirectBaseUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      process.env.RAILWAY_STATIC_URL ||
      "http://localhost:3000";

    const baseNormalizada = redirectBaseUrl.startsWith("http")
      ? redirectBaseUrl.replace(/\/$/, "")
      : `https://${redirectBaseUrl.replace(/\/$/, "")}`;

    const redirectTo = `${baseNormalizada}/formadores/primeiro-login`;

    const { error: inviteError } =
      await supabaseAdmin.auth.admin.inviteUserByEmail(candidatura.email, {
        redirectTo,
      });

    if (inviteError) {
      console.error("Convite por email falhou:", inviteError.message);
    }
  } catch (error) {
    console.error("Erro inesperado ao enviar convite:", error);
  }
}

export async function rejeitarCandidatura(formData: FormData) {
  const supabaseAdmin = getSupabaseAdmin();

  const candidaturaId = String(formData.get("candidaturaId") || "");

  if (!candidaturaId) {
    throw new Error("ID da candidatura em falta.");
  }

  const { error: updateError } = await supabaseAdmin
    .from("formador_candidaturas")
    .update({ estado: "rejeitado" })
    .eq("id", candidaturaId);

  if (updateError) {
    throw new Error(`Erro ao rejeitar candidatura: ${updateError.message}`);
  }

  revalidatePath("/admin/candidaturas-formador");
  revalidatePath("/admin/candidaturas-formador/historico");
}