"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type FormData = {
  nome: string;
  email: string;
  numero_contacto: string;
  nif_cpf: string;
  morada_fiscal: string;
  dados_pagamento: string;
  biografia_curta: string;
  biografia_pagina_formador: string;
  cursos_pretendidos: string;
  aceitou_termos: boolean;
};

const TERMOS_VERSAO = "2026-04-16";

const initialForm: FormData = {
  nome: "",
  email: "",
  numero_contacto: "",
  nif_cpf: "",
  morada_fiscal: "",
  dados_pagamento: "",
  biografia_curta: "",
  biografia_pagina_formador: "",
  cursos_pretendidos: "",
  aceitou_termos: false,
};

export default function TornaTeFormadorPage() {
  const [form, setForm] = useState<FormData>(initialForm);
  const [foto, setFoto] = useState<File | null>(null);
  const [comprovativo, setComprovativo] = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    return () => {
      if (fotoPreview && fotoPreview.startsWith("blob:")) {
        URL.revokeObjectURL(fotoPreview);
      }
    };
  }, [fotoPreview]);

  const isConfigured = useMemo(() => {
    return Boolean(
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
  }, []);

  function update(field: keyof FormData, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleFotoChange(file: File | null) {
    if (fotoPreview && fotoPreview.startsWith("blob:")) {
      URL.revokeObjectURL(fotoPreview);
    }

    setFoto(file);

    if (!file) {
      setFotoPreview("");
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setFotoPreview(objectUrl);
  }

  function handleComprovativoChange(file: File | null) {
    setComprovativo(file);
  }

  function validate() {
    if (!form.nome.trim()) return "Indica o teu nome.";
    if (!form.email.trim()) return "Indica o teu email.";
    if (!form.numero_contacto.trim()) return "Indica o teu número de contacto.";
    if (!form.nif_cpf.trim()) return "Indica o teu NIF ou CPF.";
    if (!form.morada_fiscal.trim()) return "Indica a tua morada fiscal.";
    if (!form.dados_pagamento.trim()) {
      return "Indica os teus dados de pagamento.";
    }
    if (!form.biografia_curta.trim()) {
      return "Preenche a biografia curta.";
    }
    if (!form.biografia_pagina_formador.trim()) {
      return "Preenche a biografia da página do formador.";
    }
    if (!form.cursos_pretendidos.trim()) {
      return "Indica os cursos pretendidos.";
    }
    if (!foto) {
      return "Tens de enviar a tua foto de perfil.";
    }
    if (!comprovativo) {
      return "Tens de enviar o comprovativo em ficheiro.";
    }
    if (!form.aceitou_termos) {
      return "Tens de ler e aceitar os Termos e Condições da plataforma antes de enviar a candidatura.";
    }
    return "";
  }

  async function uploadFile(
    bucket: string,
    file: File,
    folder: string
  ): Promise<string> {
    const extension = file.name.split(".").pop()?.toLowerCase() || "bin";
    const fileName = `${folder}/${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      throw uploadError;
    }

    return fileName;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    const validation = validate();
    if (validation) {
      setError(validation);
      return;
    }

    if (!isConfigured) {
      setError("O Supabase não está configurado corretamente.");
      return;
    }

    try {
      setLoading(true);

      const fotoPath = foto
        ? await uploadFile("formadores-fotos", foto, "perfis")
        : null;

      const comprovativoPath = comprovativo
        ? await uploadFile(
            "formadores-documentos",
            comprovativo,
            "candidaturas"
          )
        : null;

      const { error: insertError } = await supabase
        .from("formador_candidaturas")
        .insert([
          {
            nome: form.nome.trim(),
            email: form.email.trim(),
            numero_contacto: form.numero_contacto.trim(),
            nif_cpf: form.nif_cpf.trim(),
            morada_fiscal: form.morada_fiscal.trim(),
            dados_pagamento: form.dados_pagamento.trim(),
            foto_url: fotoPath,
            comprovativo_url: comprovativoPath,
            biografia_curta: form.biografia_curta.trim(),
            biografia_pagina_formador: form.biografia_pagina_formador.trim(),
            cursos_pretendidos: form.cursos_pretendidos.trim(),
            aceitou_termos: form.aceitou_termos,
            aceitou_termos_em: form.aceitou_termos
              ? new Date().toISOString()
              : null,
            versao_termos: TERMOS_VERSAO,
            estado: "pendente",
          },
        ]);

      if (insertError) {
        throw insertError;
      }

      setSuccess("Candidatura enviada com sucesso.");
      setForm(initialForm);
      setFoto(null);
      setComprovativo(null);
      setFotoPreview("");
    } catch (err: any) {
      setError(err?.message || "Erro ao enviar candidatura.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top, rgba(166,120,61,0.08), transparent 22%), #2b160f",
        color: "#e6c27a",
        padding: "clamp(40px, 6vw, 60px) clamp(14px, 4vw, 20px) clamp(70px, 8vw, 90px)",
        fontFamily: "Cormorant Garamond, serif",
      }}
    >
      <section
        style={{
          maxWidth: "1180px",
          margin: "0 auto",
        }}
      >
        <div
          style={{
            textAlign: "center",
            marginBottom: "40px",
          }}
        >
          <p
            style={{
              margin: "0 0 12px 0",
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: "#caa15a",
              fontSize: "clamp(13px, 2vw, 16px)",
            }}
          >
            Regnum Noctis
          </p>

          <h1
            style={{
              fontFamily: "Cinzel, serif",
              fontSize: "clamp(34px, 6vw, 60px)",
              margin: "0 0 18px 0",
              color: "#f0d79a",
              lineHeight: 1.1,
            }}
          >
            Torna-te Formador
          </h1>

          <p
            style={{
              fontSize: "clamp(18px, 2.8vw, 24px)",
              color: "#d7b06c",
              maxWidth: "880px",
              margin: "0 auto",
              lineHeight: 1.7,
            }}
          >
            Apresenta a tua candidatura de forma séria, estruturada e
            profissional para integrares o Regnum Noctis como formador.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(min(100%, 320px), 1fr))",
            gap: "24px",
            alignItems: "start",
          }}
        >
          <form
            onSubmit={handleSubmit}
            style={{
              border: "1px solid #8a5d31",
              padding: "clamp(20px, 4vw, 34px)",
              background:
                "linear-gradient(180deg, rgba(20,13,9,0.98) 0%, rgba(16,10,8,0.98) 100%)",
              display: "flex",
              flexDirection: "column",
              gap: "18px",
              boxShadow:
                "0 18px 42px rgba(0,0,0,0.24), inset 0 1px 0 rgba(255,225,170,0.03)",
            }}
          >
            <Input
              label="Nome"
              value={form.nome}
              onChange={(v) => update("nome", v)}
            />

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(min(100%, 220px), 1fr))",
                gap: "18px",
              }}
            >
              <Input
                label="Email"
                value={form.email}
                onChange={(v) => update("email", v)}
                type="email"
              />

              <Input
                label="Número de contacto"
                value={form.numero_contacto}
                onChange={(v) => update("numero_contacto", v)}
              />
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(min(100%, 220px), 1fr))",
                gap: "18px",
              }}
            >
              <Input
                label="NIF / CPF"
                value={form.nif_cpf}
                onChange={(v) => update("nif_cpf", v)}
              />

              <Input
                label="Dados de pagamento"
                value={form.dados_pagamento}
                onChange={(v) => update("dados_pagamento", v)}
                placeholder="IBAN, PayPal ou outro dado necessário"
              />
            </div>

            <Textarea
              label="Morada fiscal"
              value={form.morada_fiscal}
              onChange={(v) => update("morada_fiscal", v)}
              rows={3}
            />

            <Textarea
              label="Biografia curta"
              value={form.biografia_curta}
              onChange={(v) => update("biografia_curta", v)}
              rows={3}
              placeholder="Texto curto para aparecer no card do formador."
            />

            <Textarea
              label="Biografia página formador"
              value={form.biografia_pagina_formador}
              onChange={(v) => update("biografia_pagina_formador", v)}
              rows={6}
              placeholder="Texto mais completo para a página individual do formador."
            />

            <Textarea
              label="Cursos pretendidos"
              value={form.cursos_pretendidos}
              onChange={(v) => update("cursos_pretendidos", v)}
              rows={4}
              placeholder="Indica os cursos, áreas ou formações que pretendes lecionar."
            />

            <FileField
              label="Foto de perfil"
              accept="image/png,image/jpeg,image/jpg,image/webp"
              onChange={handleFotoChange}
              helper="Esta foto será usada no card e na página pública do formador após aprovação."
            />

            {fotoPreview && (
              <div
                style={{
                  width: "min(100%, 180px)",
                  height: "220px",
                  border: "1px solid #8a5d31",
                  overflow: "hidden",
                  background: "#1a100c",
                  boxShadow: "0 8px 20px rgba(0,0,0,0.22)",
                }}
              >
                <img
                  src={fotoPreview}
                  alt="Pré-visualização da foto"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    display: "block",
                  }}
                />
              </div>
            )}

            <FileField
              label="Comprovativo"
              accept=".pdf,image/png,image/jpeg,image/jpg,image/webp"
              onChange={handleComprovativoChange}
              helper="Envia um comprovativo da tua atividade profissional em ficheiro. Exemplos: em Portugal, comprovativo de início de atividade ou documento equivalente; no Brasil, comprovativo de MEI ou documento equivalente. Não é aceite por URL."
            />

            <div
              style={{
                border: "1px solid rgba(166,120,61,0.35)",
                background: "rgba(166,120,61,0.06)",
                padding: "16px 16px",
                color: "#d7b06c",
                lineHeight: 1.7,
              }}
            >
              <p
                style={{
                  margin: "0 0 10px 0",
                  fontSize: "18px",
                  color: "#f0d79a",
                  fontFamily: "Cinzel, serif",
                }}
              >
                Antes de submeter
              </p>

              <p
                style={{
                  margin: "0 0 10px 0",
                  fontSize: "17px",
                }}
              >
                A Regnum Noctis aplica, por defeito, uma comissão de{" "}
                <strong style={{ color: "#f0d79a" }}>30%</strong> sobre as vendas
                dos cursos de formadores externos, salvo acordo escrito em
                contrário ou configuração específica definida pela
                administração.
              </p>

              <p
                style={{
                  margin: 0,
                  fontSize: "17px",
                }}
              >
                A tua candidatura só será analisada após o envio completo dos
                dados e da aceitação dos Termos e Condições da plataforma.
              </p>
            </div>

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "12px",
                alignItems: "center",
              }}
            >
              <Link
                href="/tornar-me-formador/termos-e-condicoes"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "1px solid #a6783d",
                  background:
                    "linear-gradient(180deg, #24140f 0%, #1a100c 100%)",
                  color: "#e6c27a",
                  padding: "12px 18px",
                  fontSize: "16px",
                  textDecoration: "none",
                  boxShadow: "0 0 14px rgba(166, 120, 61, 0.1)",
                }}
              >
                Ler Termos e Condições
              </Link>

              <span
                style={{
                  fontSize: "16px",
                  color: "#caa15a",
                  lineHeight: 1.6,
                }}
              >
                A leitura dos termos é obrigatória antes da submissão da
                candidatura.
              </span>
            </div>

            <label
              style={{
                fontSize: "17px",
                color: "#d7b06c",
                display: "flex",
                alignItems: "flex-start",
                gap: "10px",
                lineHeight: 1.6,
                marginTop: "4px",
              }}
            >
              <input
                type="checkbox"
                checked={form.aceitou_termos}
                onChange={(e) => update("aceitou_termos", e.target.checked)}
                style={{
                  marginTop: "5px",
                  accentColor: "#a6783d",
                }}
              />
              <span>
                Declaro que li e aceito os Termos e Condições da plataforma,
                compreendo a comissão aplicável e confirmo que os dados enviados
                são verdadeiros.
              </span>
            </label>

            {error && (
              <div
                style={{
                  color: "#ffb4b4",
                  border: "1px solid rgba(255,107,107,0.35)",
                  background: "rgba(120,20,20,0.12)",
                  padding: "14px 16px",
                  fontSize: "18px",
                }}
              >
                {error}
              </div>
            )}

            {success && (
              <div
                style={{
                  color: "#bff1bf",
                  border: "1px solid rgba(74,222,128,0.35)",
                  background: "rgba(20,90,40,0.12)",
                  padding: "14px 16px",
                  fontSize: "18px",
                }}
              >
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                border: "1px solid #c4914d",
                padding: "16px 22px",
                background:
                  "linear-gradient(180deg, #c4914d 0%, #a6783d 100%)",
                color: "#140d09",
                cursor: loading ? "not-allowed" : "pointer",
                fontSize: "17px",
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                boxShadow:
                  "0 0 24px rgba(230, 194, 122, 0.18), inset 0 1px 0 rgba(255,255,255,0.18)",
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? "A enviar candidatura..." : "Enviar candidatura"}
            </button>
          </form>

          <div
            style={{
              border: "1px solid #8a5d31",
              padding: "clamp(20px, 4vw, 34px)",
              background:
                "linear-gradient(180deg, rgba(20,13,9,0.98) 0%, rgba(16,10,8,0.98) 100%)",
              boxShadow:
                "0 18px 42px rgba(0,0,0,0.24), inset 0 1px 0 rgba(255,225,170,0.03)",
            }}
          >
            <h2
              style={{
                fontFamily: "Cinzel, serif",
                fontSize: "clamp(26px, 4vw, 34px)",
                marginTop: 0,
                marginBottom: "20px",
                color: "#f0d79a",
              }}
            >
              Informação importante
            </h2>

            <ul
              style={{
                margin: "0 0 24px 0",
                paddingLeft: "22px",
                lineHeight: 1.9,
                fontSize: "clamp(18px, 2.5vw, 21px)",
                color: "#d7b06c",
              }}
            >
              <li>As candidaturas são analisadas manualmente.</li>
              <li>
                A Regnum Noctis aplica, por defeito, uma comissão de 30% sobre
                as vendas dos cursos de formadores externos, salvo acordo
                escrito em contrário ou configuração específica definida pela
                administração.
              </li>
              <li>
                O comprovativo deve ser enviado em ficheiro e deve demonstrar a
                tua atividade profissional.
              </li>
              <li>A foto será usada no perfil público após aprovação.</li>
              <li>Os dados privados ficam reservados à administração.</li>
              <li>A aprovação não é automática.</li>
            </ul>

            <div
              style={{
                borderTop: "1px solid rgba(166,120,61,0.35)",
                paddingTop: "22px",
                marginBottom: "22px",
              }}
            >
              <p
                style={{
                  margin: "0 0 12px 0",
                  fontSize: "19px",
                  color: "#caa15a",
                }}
              >
                O que conta como comprovativo
              </p>

              <p
                style={{
                  margin: "0 0 10px 0",
                  fontSize: "clamp(18px, 2.3vw, 19px)",
                  lineHeight: 1.8,
                  color: "#d7b06c",
                }}
              >
                O comprovativo serve para demonstrar que exerces atividade de
                forma regular. Pode ser, por exemplo, comprovativo de atividade
                aberta, documento equivalente ou comprovativo de MEI, conforme o
                teu país e situação.
              </p>

              <p
                style={{
                  margin: 0,
                  fontSize: "clamp(18px, 2.3vw, 19px)",
                  lineHeight: 1.8,
                  color: "#d7b06c",
                }}
              >
                O ficheiro deve ser enviado diretamente no formulário, em PDF ou
                imagem.
              </p>
            </div>

            <div
              style={{
                borderTop: "1px solid rgba(166,120,61,0.35)",
                paddingTop: "22px",
              }}
            >
              <p
                style={{
                  margin: "0 0 12px 0",
                  fontSize: "19px",
                  color: "#caa15a",
                }}
              >
                Dados reservados
              </p>

              <p
                style={{
                  margin: 0,
                  fontSize: "clamp(18px, 2.3vw, 19px)",
                  lineHeight: 1.8,
                  color: "#d7b06c",
                }}
              >
                O número de contacto, NIF/CPF, morada fiscal, dados de
                pagamento e comprovativo não serão mostrados publicamente.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function Input({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>
      <label
        style={{
          display: "block",
          fontSize: "18px",
          marginBottom: "8px",
          color: "#e6c27a",
        }}
      >
        {label}
      </label>

      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: "100%",
          padding: "14px 14px",
          background: "#1a100c",
          border: "1px solid #8a5d31",
          color: "#e6c27a",
          fontSize: "17px",
          outline: "none",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03)",
        }}
      />
    </div>
  );
}

function Textarea({
  label,
  value,
  onChange,
  rows = 4,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  placeholder?: string;
}) {
  return (
    <div>
      <label
        style={{
          display: "block",
          fontSize: "18px",
          marginBottom: "8px",
          color: "#e6c27a",
        }}
      >
        {label}
      </label>

      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        placeholder={placeholder}
        style={{
          width: "100%",
          padding: "14px 14px",
          background: "#1a100c",
          border: "1px solid #8a5d31",
          color: "#e6c27a",
          fontSize: "17px",
          outline: "none",
          resize: "vertical",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03)",
          fontFamily: "Cormorant Garamond, serif",
        }}
      />
    </div>
  );
}

function FileField({
  label,
  accept,
  onChange,
  helper,
}: {
  label: string;
  accept: string;
  onChange: (file: File | null) => void;
  helper?: string;
}) {
  return (
    <div>
      <label
        style={{
          display: "block",
          fontSize: "18px",
          marginBottom: "8px",
          color: "#e6c27a",
        }}
      >
        {label}
      </label>

      <label
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          border: "1px solid #a6783d",
          background: "linear-gradient(180deg, #24140f 0%, #1a100c 100%)",
          color: "#e6c27a",
          padding: "12px 18px",
          fontSize: "16px",
          cursor: "pointer",
          boxShadow: "0 0 14px rgba(166, 120, 61, 0.1)",
          width: "min(100%, 240px)",
          textAlign: "center",
        }}
      >
        Selecionar ficheiro
        <input
          type="file"
          accept={accept}
          onChange={(e) => onChange(e.target.files?.[0] || null)}
          style={{ display: "none" }}
        />
      </label>

      {helper && (
        <p
          style={{
            margin: "10px 0 0 0",
            fontSize: "16px",
            color: "#caa15a",
            lineHeight: 1.6,
          }}
        >
          {helper}
        </p>
      )}
    </div>
  );
}