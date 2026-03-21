"use client";

import { FormEvent, useState } from "react";
import { supabase } from "@/lib/supabase";

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

export default function TornaTeFormadorPage() {
  const [form, setForm] = useState<FormData>(initialForm);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  function update(field: keyof FormData, value: any) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function validate() {
    if (!form.nome) return "Indica o teu nome.";
    if (!form.email) return "Indica o teu email.";
    if (!form.area_ensino) return "Indica a área de ensino.";
    if (!form.experiencia) return "Descreve a tua experiência.";
    if (!form.motivacao) return "Indica a tua motivação.";
    if (!form.aceitou_termos) return "Tens de aceitar os termos.";
    return "";
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

    try {
      setLoading(true);

      const { error } = await supabase.from("candidaturas_formadores").insert([
        {
          ...form,
          estado: "pendente",
          created_at: new Date().toISOString(),
        },
      ]);

      if (error) throw error;

      setSuccess("Candidatura enviada com sucesso.");
      setForm(initialForm);
    } catch (err: any) {
      setError(err.message || "Erro ao enviar candidatura.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#2b160f",
        color: "#e6c27a",
        padding: "60px 20px",
        fontFamily: "Cormorant Garamond, serif",
      }}
    >
      <section
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
        }}
      >
        {/* HEADER */}
        <div style={{ textAlign: "center", marginBottom: "50px" }}>
          <h1
            style={{
              fontFamily: "Cinzel, serif",
              fontSize: "56px",
              marginBottom: "20px",
            }}
          >
            Torna-te Formador
          </h1>

          <p style={{ fontSize: "22px", color: "#d7b06c" }}>
            Junta-te ao Regnum Noctis e partilha conhecimento real, estruturado e
            com profundidade.
          </p>
        </div>

        {/* CONTAINER */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "40px",
          }}
        >
          {/* FORM */}
          <form
            onSubmit={handleSubmit}
            style={{
              border: "1px solid #8a5d31",
              padding: "30px",
              background: "#140d09",
              display: "flex",
              flexDirection: "column",
              gap: "18px",
            }}
          >
            <Input label="Nome" value={form.nome} onChange={(v) => update("nome", v)} />
            <Input label="Email" value={form.email} onChange={(v) => update("email", v)} />
            <Input label="Telefone" value={form.telefone} onChange={(v) => update("telefone", v)} />
            <Input label="Área de ensino" value={form.area_ensino} onChange={(v) => update("area_ensino", v)} />

            <Textarea label="Experiência" value={form.experiencia} onChange={(v) => update("experiencia", v)} />
            <Textarea label="Motivação" value={form.motivacao} onChange={(v) => update("motivacao", v)} />

            <Input label="Portfolio" value={form.portfolio} onChange={(v) => update("portfolio", v)} />
            <Input label="Redes sociais" value={form.redes_sociais} onChange={(v) => update("redes_sociais", v)} />

            <Textarea
              label="Disponibilidade"
              value={form.disponibilidade}
              onChange={(v) => update("disponibilidade", v)}
            />

            <label style={{ fontSize: "16px" }}>
              <input
                type="checkbox"
                checked={form.aceitou_termos}
                onChange={(e) => update("aceitou_termos", e.target.checked)}
              />{" "}
              Confirmo que os dados são verdadeiros
            </label>

            {error && <div style={{ color: "#ff6b6b" }}>{error}</div>}
            {success && <div style={{ color: "#4ade80" }}>{success}</div>}

            <button
              type="submit"
              disabled={loading}
              style={{
                border: "1px solid #a6783d",
                padding: "14px",
                background: "#1a100c",
                color: "#e6c27a",
                cursor: "pointer",
                fontSize: "18px",
              }}
            >
              {loading ? "A enviar..." : "Enviar candidatura"}
            </button>
          </form>

          {/* INFO */}
          <div
            style={{
              border: "1px solid #8a5d31",
              padding: "30px",
              background: "#140d09",
            }}
          >
            <h2 style={{ fontFamily: "Cinzel, serif", fontSize: "32px" }}>
              O que procuramos
            </h2>

            <ul style={{ marginTop: "20px", lineHeight: "1.8", fontSize: "20px" }}>
              <li>Conhecimento real e consistente</li>
              <li>Capacidade de ensinar com clareza</li>
              <li>Experiência prática</li>
              <li>Alinhamento com a visão da plataforma</li>
            </ul>

            <p style={{ marginTop: "30px", fontSize: "18px", color: "#caa15a" }}>
              Todas as candidaturas são analisadas manualmente.
            </p>
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
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label style={{ fontSize: "18px" }}>{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: "100%",
          padding: "10px",
          marginTop: "6px",
          background: "#1a100c",
          border: "1px solid #8a5d31",
          color: "#e6c27a",
        }}
      />
    </div>
  );
}

function Textarea({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label style={{ fontSize: "18px" }}>{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={4}
        style={{
          width: "100%",
          padding: "10px",
          marginTop: "6px",
          background: "#1a100c",
          border: "1px solid #8a5d31",
          color: "#e6c27a",
        }}
      />
    </div>
  );
}