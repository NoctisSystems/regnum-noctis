"use server";

import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase-admin";

type ActionState = {
  success?: boolean;
  error?: string;
};

export async function aprovarCandidatura(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const candidaturaId = String(formData.get("candidaturaId") || "");

    if (!candidaturaId) {
      return { error: "ID da candidatura em falta." };
    }

    const { data: candidatura, error: candidaturaError } = await supabaseAdmin
      .from("candidaturas_formadores")
      .select("*")
      .eq("id", candidaturaId)
      .single();

    if (candidaturaError || !candidatura) {
      return { error: "Candidatura não encontrada." };
    }

    const { error: updateError } = await supabaseAdmin
      .from("candidaturas_formadores")
      .update({ estado: "aprovado" })
      .eq("id", candidaturaId);

    if (updateError) {
      return { error: `Erro ao aprovar candidatura: ${updateError.message}` };
    }

    const { data: formadorExistente, error: formadorExistenteError } =
      await supabaseAdmin
        .from("formadores")
        .select("id")
        .eq("email", candidatura.email)
        .maybeSingle();

    if (formadorExistenteError) {
      return {
        error: `Erro ao verificar formador existente: ${formadorExistenteError.message}`,
      };
    }

    const formadorPayload = {
      candidatura_id: candidatura.id,
      nome: candidatura.nome,
      email: candidatura.email,
      telefone: candidatura.telefone || null,
      bio: candidatura.experiencia || null,
      area_ensino: candidatura.area_ensino || null,
      portfolio: candidatura.portfolio || null,
      redes_sociais: candidatura.redes_sociais || null,
      disponibilidade: candidatura.disponibilidade || null,
      status: "aprovado",
    };

    if (!formadorExistente) {
      const { error: createFormadorError } = await supabaseAdmin
        .from("formadores")
        .insert([formadorPayload]);

      if (createFormadorError) {
        return {
          error: `Candidatura aprovada, mas falhou a criação do formador: ${createFormadorError.message}`,
        };
      }
    } else {
      const { error: updateFormadorError } = await supabaseAdmin
        .from("formadores")
        .update(formadorPayload)
        .eq("email", candidatura.email);

      if (updateFormadorError) {
        return {
          error: `Candidatura aprovada, mas falhou a atualização do formador: ${updateFormadorError.message}`,
        };
      }
    }

    revalidatePath("/admin/formadores");

    return { success: true };
  } catch (error) {
    console.error("Erro inesperado ao aprovar candidatura:", error);
    return { error: "Erro interno ao aprovar candidatura." };
  }
}

export async function rejeitarCandidatura(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const candidaturaId = String(formData.get("candidaturaId") || "");

    if (!candidaturaId) {
      return { error: "ID da candidatura em falta." };
    }

    const { data: candidatura, error: candidaturaError } = await supabaseAdmin
      .from("candidaturas_formadores")
      .select("*")
      .eq("id", candidaturaId)
      .single();

    if (candidaturaError || !candidatura) {
      return { error: "Candidatura não encontrada." };
    }

    const { error: updateError } = await supabaseAdmin
      .from("candidaturas_formadores")
      .update({ estado: "rejeitado" })
      .eq("id", candidaturaId);

    if (updateError) {
      return { error: `Erro ao rejeitar candidatura: ${updateError.message}` };
    }

    const { data: formadorExistente, error: formadorExistenteError } =
      await supabaseAdmin
        .from("formadores")
        .select("id")
        .eq("email", candidatura.email)
        .maybeSingle();

    if (formadorExistenteError) {
      return {
        error: `Candidatura rejeitada, mas houve erro ao verificar formador: ${formadorExistenteError.message}`,
      };
    }

    if (formadorExistente) {
      const { error: updateFormadorError } = await supabaseAdmin
        .from("formadores")
        .update({
          status: "rejeitado",
        })
        .eq("email", candidatura.email);

      if (updateFormadorError) {
        return {
          error: `Candidatura rejeitada, mas falhou a atualização do formador: ${updateFormadorError.message}`,
        };
      }
    }

    revalidatePath("/admin/formadores");

    return { success: true };
  } catch (error) {
    console.error("Erro inesperado ao rejeitar candidatura:", error);
    return { error: "Erro interno ao rejeitar candidatura." };
  }
}