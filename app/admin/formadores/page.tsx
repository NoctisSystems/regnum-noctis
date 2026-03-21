"use client";

import { FormEvent, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

type FormData = {
  nome: string;
  email: string;
  telefone: string;
  area_ensino: string;
  experiencia: string;
  motivacao: string;
  portfolio: string;
  redes_sociais: string;
  disponibilidade: string;
  aceitou_termos: boolean;
};

const initialForm: FormData = {
  nome: "",
  email: "",
  telefone: "",
  area_ensino: "",
  experiencia: "",
  motivacao: "",
  portfolio: "",
  redes_sociais: "",
  disponibilidade: "",
  aceitou_termos: false,
};

export default function TornaTeFormadorAdminPage() {
  const [form, setForm] = useState<FormData>(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const isConfigured = useMemo(() => !!supabase, []);

  function updateField<K extends keyof FormData>(field: K, value: FormData[K]) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function validateForm() {
    if (!form.nome.trim()) return "Por favor, indica o teu nome.";
    if (!form.email.trim()) return "Por favor, indica o teu email.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      return "Por favor, indica um email válido.";
    }
    if (!form.area_ensino.trim()) {
      return "Por favor, indica a área que pretendes ensinar.";
    }
    if (!form.experiencia.trim()) {
      return "Por favor, descreve a tua experiência.";
    }
    if (!form.motivacao.trim()) {
      return "Por favor, explica porque queres integrar a plataforma.";
    }
    if (!form.aceitou_termos) {
      return "Tens de aceitar os termos antes de enviar a candidatura.";
    }

    return "";
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSuccessMessage("");
    setErrorMessage("");

    const validationError = validateForm();
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    if (!supabase) {
      setErrorMessage(
        "O Supabase não está configurado. Verifica as variáveis NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY."
      );
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        nome: form.nome.trim(),
        email: form.email.trim(),
        telefone: form.telefone.trim() || null,
        area_ensino: form.area_ensino.trim(),
        experiencia: form.experiencia.trim(),
        motivacao: form.motivacao.trim(),
        portfolio: form.portfolio.trim() || null,
        redes_sociais: form.redes_sociais.trim() || null,
        disponibilidade: form.disponibilidade.trim() || null,
        aceitou_termos: form.aceitou_termos,
        estado: "pendente",
        created_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("candidaturas_formadores")
        .insert([payload]);

      if (error) {
        throw error;
      }

      setSuccessMessage(
        "A candidatura foi enviada com sucesso. Será analisada pela administração."
      );
      setForm(initialForm);
    } catch (error: any) {
      setErrorMessage(
        error?.message ||
          "Ocorreu um erro ao enviar a candidatura. Tenta novamente."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#0b0b10] text-white">
      <section className="relative overflow-hidden border-b border-yellow-500/15 bg-[radial-gradient(circle_at_top,_rgba(212,175,55,0.14),_transparent_35%),linear-gradient(180deg,#0f0f15_0%,#09090d_100%)]">
        <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(120deg,transparent_0%,rgba(212,175,55,0.05)_35%,transparent_70%)]" />

        <div className="mx-auto max-w-7xl px-6 py-16 md:px-10 md:py-20">
          <div className="max-w-3xl">
            <span className="inline-flex items-center rounded-full border border-yellow-500/30 bg-yellow-500/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-yellow-300">
              Administração
            </span>

            <h1 className="mt-6 text-4xl font-semibold leading-tight md:text-6xl">
              Candidatura a{" "}
              <span className="bg-gradient-to-r from-yellow-200 via-yellow-400 to-yellow-200 bg-clip-text text-transparent">
                Formador
              </span>
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-7 text-zinc-300 md:text-lg">
              Esta área permite submeter uma candidatura interna para entrada de
              formadores na plataforma. O foco está na qualidade, profundidade e
              alinhamento com a visão do Regnum Noctis.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-12 md:px-10 md:py-14">
        <div className="grid gap-8 xl:grid-cols-[1.08fr_0.92fr]">
          <div className="rounded-3xl border border-yellow-500/15 bg-white/5 p-6 shadow-[0_0_40px_rgba(212,175,55,0.08)] backdrop-blur-xl md:p-8">
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-white">
                Enviar candidatura
              </h2>
              <p className="mt-3 text-sm leading-6 text-zinc-400">
                Preenche o formulário com clareza e profundidade. Quanto mais
                consistente for a informação, mais fácil será avaliar a tua
                proposta formativa.
              </p>
            </div>

            {!isConfigured && (
              <div className="mb-6 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                O Supabase não está configurado neste projeto. Adiciona as
                variáveis de ambiente antes de testar o envio.
              </div>
            )}

            {successMessage && (
              <div className="mb-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                {successMessage}
              </div>
            )}

            {errorMessage && (
              <div className="mb-6 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid gap-5 md:grid-cols-2">
                <Field
                  label="Nome completo"
                  required
                  value={form.nome}
                  onChange={(value) => updateField("nome", value)}
                  placeholder="O teu nome"
                />

                <Field
                  label="Email"
                  type="email"
                  required
                  value={form.email}
                  onChange={(value) => updateField("email", value)}
                  placeholder="teuemail@exemplo.com"
                />
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <Field
                  label="Telefone"
                  value={form.telefone}
                  onChange={(value) => updateField("telefone", value)}
                  placeholder="+351 ..."
                />

                <Field
                  label="Área de ensino"
                  required
                  value={form.area_ensino}
                  onChange={(value) => updateField("area_ensino", value)}
                  placeholder="Ex.: Tarot, Runas, Hoodoo..."
                />
              </div>

              <TextAreaField
                label="Experiência"
                required
                value={form.experiencia}
                onChange={(value) => updateField("experiencia", value)}
                placeholder="Descreve a tua experiência, formação, anos de prática e áreas em que trabalhas."
                rows={5}
              />

              <TextAreaField
                label="Motivação"
                required
                value={form.motivacao}
                onChange={(value) => updateField("motivacao", value)}
                placeholder="Porque queres fazer parte do Regnum Noctis?"
                rows={5}
              />

              <Field
                label="Portfólio / Website"
                value={form.portfolio}
                onChange={(value) => updateField("portfolio", value)}
                placeholder="Link opcional"
              />

              <Field
                label="Redes sociais"
                value={form.redes_sociais}
                onChange={(value) => updateField("redes_sociais", value)}
                placeholder="Instagram, TikTok, YouTube, etc."
              />

              <TextAreaField
                label="Disponibilidade"
                value={form.disponibilidade}
                onChange={(value) => updateField("disponibilidade", value)}
                placeholder="Indica a tua disponibilidade para gravar cursos, responder a alunos ou colaborar."
                rows={4}
              />

              <label className="flex items-start gap-3 rounded-2xl border border-yellow-500/10 bg-black/20 px-4 py-4 text-sm text-zinc-300">
                <input
                  type="checkbox"
                  checked={form.aceitou_termos}
                  onChange={(e) =>
                    updateField("aceitou_termos", e.target.checked)
                  }
                  className="mt-1 h-4 w-4 rounded border-zinc-600 bg-zinc-900 text-yellow-500 focus:ring-yellow-500"
                />
                <span>
                  Confirmo que as informações prestadas são verdadeiras e
                  autorizo o Regnum Noctis a analisar esta candidatura.
                </span>
              </label>

              <button
                type="submit"
                disabled={submitting}
                className="group relative inline-flex w-full items-center justify-center overflow-hidden rounded-2xl border border-yellow-500/35 bg-gradient-to-r from-yellow-700 via-yellow-500 to-yellow-700 px-6 py-4 text-sm font-semibold uppercase tracking-[0.18em] text-black transition duration-300 hover:scale-[1.01] hover:shadow-[0_0_30px_rgba(212,175,55,0.35)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span className="absolute inset-0 bg-[linear-gradient(120deg,transparent_0%,rgba(255,255,255,0.35)_35%,transparent_70%)] opacity-0 transition duration-500 group-hover:opacity-100" />
                <span className="relative">
                  {submitting ? "A enviar..." : "Enviar candidatura"}
                </span>
              </button>
            </form>
          </div>

          <aside className="space-y-6">
            <div className="rounded-3xl border border-yellow-500/15 bg-white/5 p-6 backdrop-blur-xl md:p-8">
              <h3 className="text-xl font-semibold text-white">
                O que valorizamos
              </h3>
              <ul className="mt-5 space-y-4 text-sm leading-6 text-zinc-300">
                <li className="rounded-2xl border border-yellow-500/10 bg-black/20 px-4 py-4">
                  Experiência real e conhecimento sólido na área que ensinas.
                </li>
                <li className="rounded-2xl border border-yellow-500/10 bg-black/20 px-4 py-4">
                  Capacidade de transmitir conteúdos com clareza, profundidade e
                  seriedade.
                </li>
                <li className="rounded-2xl border border-yellow-500/10 bg-black/20 px-4 py-4">
                  Alinhamento com a visão do Regnum Noctis e respeito pelo
                  trabalho espiritual.
                </li>
              </ul>
            </div>

            <div className="rounded-3xl border border-yellow-500/15 bg-white/5 p-6 backdrop-blur-xl md:p-8">
              <h3 className="text-xl font-semibold text-white">
                Informação importante
              </h3>
              <p className="mt-4 text-sm leading-6 text-zinc-300">
                O envio da candidatura não garante entrada imediata na
                plataforma. Cada proposta será analisada individualmente, com
                base na experiência, qualidade da proposta formativa e
                alinhamento com o projeto.
              </p>
            </div>

            <div className="rounded-3xl border border-yellow-500/15 bg-white/5 p-6 backdrop-blur-xl md:p-8">
              <h3 className="text-xl font-semibold text-white">
                Estado inicial
              </h3>
              <p className="mt-4 text-sm leading-6 text-zinc-300">
                Todas as candidaturas entram com estado{" "}
                <span className="font-semibold text-yellow-300">pendente</span>{" "}
                e ficam disponíveis para análise na área de administração de
                formadores.
              </p>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  required = false,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-zinc-200">
        {label} {required && <span className="text-yellow-400">*</span>}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-yellow-500/10 bg-black/20 px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-500 focus:border-yellow-500/40 focus:bg-black/30"
      />
    </label>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
  placeholder,
  required = false,
  rows = 4,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  rows?: number;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-zinc-200">
        {label} {required && <span className="text-yellow-400">*</span>}
      </span>
      <textarea
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full resize-none rounded-2xl border border-yellow-500/10 bg-black/20 px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-500 focus:border-yellow-500/40 focus:bg-black/30"
      />
    </label>
  );
}