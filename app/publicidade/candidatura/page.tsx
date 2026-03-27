"use client";

import { CSSProperties, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

const BUCKET_PUBLICIDADE_LOGOS = "publicidade-logos";

type EstadoFormulario = {
  nome: string;
  email: string;
  telefone: string;
  nomeMarca: string;
  websiteUrl: string;
  instagramUrl: string;
  whatsapp: string;
  planoInteresse: "base" | "destaque" | "home";
  tituloAnuncio: string;
  descricaoCurta: string;
  descricao: string;
  linkDestino: string;
  observacoes: string;
};

const estadoInicial: EstadoFormulario = {
  nome: "",
  email: "",
  telefone: "",
  nomeMarca: "",
  websiteUrl: "",
  instagramUrl: "",
  whatsapp: "",
  planoInteresse: "base",
  tituloAnuncio: "",
  descricaoCurta: "",
  descricao: "",
  linkDestino: "",
  observacoes: "",
};

export default function PublicidadeCandidaturaPage() {
  const [form, setForm] = useState<EstadoFormulario>(estadoInicial);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [previewLogo, setPreviewLogo] = useState<string>("");
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [aEnviar, setAEnviar] = useState(false);

  useEffect(() => {
    return () => {
      if (previewLogo && previewLogo.startsWith("blob:")) {
        URL.revokeObjectURL(previewLogo);
      }
    };
  }, [previewLogo]);

  const planoDescricao = useMemo(() => {
    if (form.planoInteresse === "base") {
      return "Plano Base — presença simples na página de publicidade e parceiros.";
    }

    if (form.planoInteresse === "destaque") {
      return "Plano Destaque — maior visibilidade dentro da página de publicidade e parceiros.";
    }

    return "Plano Home — presença premium na Home e inclusão adicional na página de publicidade.";
  }, [form.planoInteresse]);

  function atualizarCampo<K extends keyof EstadoFormulario>(
    campo: K,
    valor: EstadoFormulario[K]
  ) {
    setForm((prev) => ({
      ...prev,
      [campo]: valor,
    }));
  }

  function handleLogoChange(file: File | null) {
    setErro("");

    if (previewLogo && previewLogo.startsWith("blob:")) {
      URL.revokeObjectURL(previewLogo);
    }

    if (!file) {
      setLogoFile(null);
      setPreviewLogo("");
      return;
    }

    const tiposPermitidos = [
      "image/png",
      "image/jpeg",
      "image/webp",
      "image/svg+xml",
    ];

    if (!tiposPermitidos.includes(file.type)) {
      setErro("O logótipo tem de estar em PNG, JPG, WEBP ou SVG.");
      return;
    }

    const maxBytes = 5 * 1024 * 1024;
    if (file.size > maxBytes) {
      setErro("O logótipo não pode ultrapassar 5 MB.");
      return;
    }

    setLogoFile(file);

    const preview = URL.createObjectURL(file);
    setPreviewLogo(preview);
  }

  async function uploadLogo(): Promise<string | null> {
    if (!logoFile) return null;

    const extensaoOriginal =
      logoFile.name.split(".").pop()?.toLowerCase() || "png";
    const extensaoPermitida = ["png", "jpg", "jpeg", "webp", "svg"].includes(
      extensaoOriginal
    )
      ? extensaoOriginal
      : "png";

    const nomeMarcaSeguro = (form.nomeMarca || form.nome || "publicidade")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60);

    const caminho = `candidaturas/${Date.now()}-${
      nomeMarcaSeguro || "publicidade"
    }.${extensaoPermitida}`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET_PUBLICIDADE_LOGOS)
      .upload(caminho, logoFile, {
        cacheControl: "3600",
        upsert: true,
      });

    if (uploadError) {
      throw uploadError;
    }

    const { data } = supabase.storage
      .from(BUCKET_PUBLICIDADE_LOGOS)
      .getPublicUrl(caminho);

    return data.publicUrl;
  }

  async function submeterCandidatura(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErro("");
    setSucesso("");

    if (!form.nome.trim()) {
      setErro("Preenche o nome.");
      return;
    }

    if (!form.email.trim()) {
      setErro("Preenche o email.");
      return;
    }

    if (!form.nomeMarca.trim()) {
      setErro("Preenche o nome da marca, projeto ou serviço.");
      return;
    }

    if (!form.tituloAnuncio.trim()) {
      setErro("Preenche o título do anúncio.");
      return;
    }

    if (!form.descricaoCurta.trim()) {
      setErro("Preenche a descrição curta.");
      return;
    }

    if (!form.linkDestino.trim()) {
      setErro("Preenche o link de destino.");
      return;
    }

    try {
      setAEnviar(true);

      const logoUrl = await uploadLogo();

      const { error } = await supabase.from("publicidade_candidaturas").insert({
        nome: form.nome.trim(),
        email: form.email.trim().toLowerCase(),
        telefone: form.telefone.trim() || null,
        nome_marca: form.nomeMarca.trim() || null,
        website_url: form.websiteUrl.trim() || null,
        instagram_url: form.instagramUrl.trim() || null,
        whatsapp: form.whatsapp.trim() || null,
        plano_interesse: form.planoInteresse,
        titulo_anuncio: form.tituloAnuncio.trim() || null,
        descricao_curta: form.descricaoCurta.trim() || null,
        descricao: form.descricao.trim() || null,
        logo_url: logoUrl,
        link_destino: form.linkDestino.trim() || null,
        observacoes: form.observacoes.trim() || null,
        estado: "pendente",
      });

      if (error) {
        throw error;
      }

      setSucesso(
        "A tua candidatura de publicidade foi enviada com sucesso. Iremos analisar a proposta e entrar em contacto."
      );
      setForm(estadoInicial);
      setLogoFile(null);
      setPreviewLogo("");
    } catch (err: any) {
      setErro(err?.message || "Não foi possível enviar a candidatura.");
    } finally {
      setAEnviar(false);
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#2b160f",
        color: "#e6c27a",
        fontFamily: "Cormorant Garamond, serif",
        paddingTop: "clamp(40px, 6vw, 60px)",
        paddingRight: "clamp(14px, 4vw, 20px)",
        paddingBottom: "clamp(70px, 8vw, 90px)",
        paddingLeft: "clamp(14px, 4vw, 20px)",
      }}
    >
      <section
        style={{
          maxWidth: "1100px",
          margin: "0 auto 38px auto",
          textAlign: "center",
          padding: "10px clamp(10px, 3vw, 20px) 40px",
          background:
            "radial-gradient(circle at center, rgba(106,58,27,0.24) 0%, rgba(43,22,15,0) 68%)",
        }}
      >
        <p
          style={{
            letterSpacing: "3px",
            textTransform: "uppercase",
            color: "#caa15a",
            fontSize: "clamp(13px, 2vw, 16px)",
            margin: "0 0 16px 0",
          }}
        >
          Publicidade no Regnum Noctis
        </p>

        <h1
          style={{
            fontFamily: "Cinzel, serif",
            fontSize: "clamp(32px, 6vw, 60px)",
            fontWeight: 500,
            margin: "0 0 18px 0",
            color: "#e6c27a",
            lineHeight: 1.08,
          }}
        >
          Candidatura de Publicidade
        </h1>

        <p
          style={{
            fontSize: "clamp(18px, 2.8vw, 27px)",
            lineHeight: "1.75",
            color: "#d7b06c",
            maxWidth: "920px",
            margin: "0 auto",
          }}
        >
          Envia os dados da tua marca, projeto ou serviço, escolhe o plano que
          te interessa e submete a tua candidatura para análise.
        </p>
      </section>

      <section
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 320px), 1fr))",
          gap: "20px",
          alignItems: "start",
        }}
      >
        <article
          style={{
            border: "1px solid #8a5d31",
            background:
              "linear-gradient(180deg, rgba(20,13,9,0.98) 0%, rgba(16,10,8,0.98) 100%)",
            padding: "clamp(18px, 4vw, 30px)",
            boxShadow: "0 10px 30px rgba(0,0,0,0.22)",
          }}
        >
          <h2
            style={{
              fontFamily: "Cinzel, serif",
              fontSize: "clamp(24px, 4vw, 32px)",
              margin: "0 0 18px 0",
              color: "#e6c27a",
            }}
          >
            Formulário de candidatura
          </h2>

          {erro ? <div style={caixaErro}>{erro}</div> : null}
          {sucesso ? <div style={caixaSucesso}>{sucesso}</div> : null}

          <form onSubmit={submeterCandidatura}>
            <div style={grelha2}>
              <Campo
                label="Nome"
                value={form.nome}
                onChange={(v) => atualizarCampo("nome", v)}
                placeholder="O teu nome"
              />

              <Campo
                label="Email"
                value={form.email}
                onChange={(v) => atualizarCampo("email", v)}
                placeholder="Email de contacto"
                type="email"
              />
            </div>

            <div style={grelha2}>
              <Campo
                label="Telefone"
                value={form.telefone}
                onChange={(v) => atualizarCampo("telefone", v)}
                placeholder="Telefone"
              />

              <Campo
                label="WhatsApp"
                value={form.whatsapp}
                onChange={(v) => atualizarCampo("whatsapp", v)}
                placeholder="WhatsApp"
              />
            </div>

            <div style={grelha2}>
              <Campo
                label="Nome da marca, projeto ou serviço"
                value={form.nomeMarca}
                onChange={(v) => atualizarCampo("nomeMarca", v)}
                placeholder="Nome comercial"
              />

              <SelectCampo
                label="Plano de interesse"
                value={form.planoInteresse}
                onChange={(v) =>
                  atualizarCampo(
                    "planoInteresse",
                    v as EstadoFormulario["planoInteresse"]
                  )
                }
                options={[
                  { value: "base", label: "Plano Base — 29€/mês" },
                  { value: "destaque", label: "Plano Destaque — 69€/mês" },
                  { value: "home", label: "Plano Home — 149€/mês" },
                ]}
              />
            </div>

            <div style={grelha2}>
              <Campo
                label="Website"
                value={form.websiteUrl}
                onChange={(v) => atualizarCampo("websiteUrl", v)}
                placeholder="https://..."
              />

              <Campo
                label="Instagram"
                value={form.instagramUrl}
                onChange={(v) => atualizarCampo("instagramUrl", v)}
                placeholder="https://instagram.com/..."
              />
            </div>

            <Campo
              label="Título do anúncio"
              value={form.tituloAnuncio}
              onChange={(v) => atualizarCampo("tituloAnuncio", v)}
              placeholder="Título principal da presença publicitária"
            />

            <AreaCampo
              label="Descrição curta"
              value={form.descricaoCurta}
              onChange={(v) => atualizarCampo("descricaoCurta", v)}
              placeholder="Resumo curto para apresentação"
              rows={3}
            />

            <AreaCampo
              label="Descrição"
              value={form.descricao}
              onChange={(v) => atualizarCampo("descricao", v)}
              placeholder="Descrição mais completa da proposta"
              rows={5}
            />

            <Campo
              label="Link de destino"
              value={form.linkDestino}
              onChange={(v) => atualizarCampo("linkDestino", v)}
              placeholder="Link para onde o utilizador será enviado"
            />

            <AreaCampo
              label="Observações"
              value={form.observacoes}
              onChange={(v) => atualizarCampo("observacoes", v)}
              placeholder="Informações adicionais"
              rows={4}
            />

            <div style={{ marginBottom: "20px" }}>
              <label style={label}>Logótipo</label>

              <div
                style={{
                  border: "1px solid #8a5d31",
                  background: "#140d09",
                  padding: "16px",
                }}
              >
                <input
                  type="file"
                  accept=".png,.jpg,.jpeg,.webp,.svg,image/png,image/jpeg,image/webp,image/svg+xml"
                  onChange={(e) => handleLogoChange(e.target.files?.[0] || null)}
                  style={inputFicheiro}
                />

                <p
                  style={{
                    margin: "10px 0 0 0",
                    fontSize: "15px",
                    lineHeight: "1.6",
                    color: "#caa15a",
                  }}
                >
                  Formatos aceites: PNG, JPG, WEBP ou SVG. Tamanho máximo: 5 MB.
                </p>

                {previewLogo ? (
                  <div
                    style={{
                      marginTop: "16px",
                      border: "1px solid rgba(166,120,61,0.4)",
                      background: "#120b08",
                      padding: "16px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      minHeight: "180px",
                    }}
                  >
                    <img
                      src={previewLogo}
                      alt="Pré-visualização do logótipo"
                      style={{
                        maxWidth: "100%",
                        maxHeight: "140px",
                        objectFit: "contain",
                        display: "block",
                      }}
                    />
                  </div>
                ) : null}
              </div>
            </div>

            <button
              type="submit"
              disabled={aEnviar}
              style={{
                ...botaoPrincipal,
                opacity: aEnviar ? 0.7 : 1,
                cursor: aEnviar ? "not-allowed" : "pointer",
              }}
            >
              {aEnviar ? "A enviar candidatura..." : "Enviar candidatura"}
            </button>
          </form>
        </article>

        <aside
          style={{
            display: "grid",
            gap: "18px",
          }}
        >
          <article style={boxLateral}>
            <h2 style={tituloLateral}>Plano selecionado</h2>
            <p style={paragrafoLateral}>{planoDescricao}</p>
          </article>

          <article style={boxLateral}>
            <h2 style={tituloLateral}>O que analisarás connosco</h2>
            <ul style={listaLateral}>
              <li>compatibilidade da proposta com a plataforma;</li>
              <li>plano mais adequado ao tipo de presença;</li>
              <li>link, imagem e apresentação visual;</li>
              <li>duração, visibilidade e disponibilidade.</li>
            </ul>
          </article>

          <article style={boxLateral}>
            <h2 style={tituloLateral}>Planos disponíveis</h2>
            <div style={{ display: "grid", gap: "12px" }}>
              <PlanoMini
                titulo="Plano Base"
                valor="29€/mês"
                texto="Presença simples na página de publicidade e parceiros."
              />
              <PlanoMini
                titulo="Plano Destaque"
                valor="69€/mês"
                texto="Maior visibilidade dentro da página."
              />
              <PlanoMini
                titulo="Plano Home"
                valor="149€/mês"
                texto="Presença premium na Home e na página de publicidade."
              />
            </div>
          </article>
        </aside>
      </section>
    </main>
  );
}

function Campo({
  label: titulo,
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
    <div style={{ marginBottom: "18px" }}>
      <label style={label}>{titulo}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={input}
      />
    </div>
  );
}

function AreaCampo({
  label: titulo,
  value,
  onChange,
  placeholder,
  rows,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows: number;
}) {
  return (
    <div style={{ marginBottom: "18px" }}>
      <label style={label}>{titulo}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        style={textarea}
      />
    </div>
  );
}

function SelectCampo({
  label: titulo,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div style={{ marginBottom: "18px" }}>
      <label style={label}>{titulo}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} style={input}>
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
            style={{ background: "#140d09", color: "#e6c27a" }}
          >
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function PlanoMini({
  titulo,
  valor,
  texto,
}: {
  titulo: string;
  valor: string;
  texto: string;
}) {
  return (
    <div
      style={{
        border: "1px solid rgba(166,120,61,0.35)",
        background: "rgba(38,20,15,0.35)",
        padding: "14px 16px",
      }}
    >
      <p
        style={{
          margin: "0 0 6px 0",
          fontFamily: "Cinzel, serif",
          fontSize: "20px",
          color: "#f0d79a",
        }}
      >
        {titulo}
      </p>
      <p
        style={{
          margin: "0 0 8px 0",
          fontSize: "19px",
          color: "#e6c27a",
        }}
      >
        {valor}
      </p>
      <p
        style={{
          margin: 0,
          fontSize: "18px",
          lineHeight: "1.7",
          color: "#d7b06c",
        }}
      >
        {texto}
      </p>
    </div>
  );
}

const grelha2: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 240px), 1fr))",
  gap: "14px",
};

const boxLateral: CSSProperties = {
  border: "1px solid #8a5d31",
  background:
    "linear-gradient(180deg, rgba(20,13,9,0.98) 0%, rgba(16,10,8,0.98) 100%)",
  padding: "24px",
  boxShadow: "0 10px 30px rgba(0,0,0,0.22)",
};

const tituloLateral: CSSProperties = {
  fontFamily: "Cinzel, serif",
  fontSize: "clamp(24px, 4vw, 28px)",
  margin: "0 0 14px 0",
  color: "#e6c27a",
};

const paragrafoLateral: CSSProperties = {
  margin: 0,
  fontSize: "clamp(18px, 2.4vw, 20px)",
  lineHeight: "1.8",
  color: "#d7b06c",
};

const listaLateral: CSSProperties = {
  marginTop: 0,
  marginRight: 0,
  marginBottom: 0,
  marginLeft: "20px",
  padding: 0,
  color: "#d7b06c",
  fontSize: "clamp(18px, 2.4vw, 20px)",
  lineHeight: "1.8",
};

const label: CSSProperties = {
  display: "block",
  marginBottom: "8px",
  color: "#caa15a",
  fontSize: "15px",
  textTransform: "uppercase",
  letterSpacing: "1px",
};

const input: CSSProperties = {
  width: "100%",
  padding: "12px 14px",
  border: "1px solid #8a5d31",
  background: "#140d09",
  color: "#e6c27a",
  fontSize: "17px",
  outline: "none",
};

const textarea: CSSProperties = {
  width: "100%",
  padding: "12px 14px",
  border: "1px solid #8a5d31",
  background: "#140d09",
  color: "#e6c27a",
  fontSize: "17px",
  outline: "none",
  resize: "vertical",
  fontFamily: "Cormorant Garamond, serif",
};

const inputFicheiro: CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  border: "1px solid #8a5d31",
  background: "#140d09",
  color: "#e6c27a",
  fontSize: "15px",
  outline: "none",
};

const botaoPrincipal: CSSProperties = {
  textDecoration: "none",
  border: "1px solid #a6783d",
  color: "#140d09",
  padding: "12px 18px",
  fontSize: "clamp(16px, 2vw, 18px)",
  display: "inline-block",
  background: "#a6783d",
  width: "min(100%, 280px)",
  textAlign: "center",
};

const caixaErro: CSSProperties = {
  border: "1px solid rgba(255,107,107,0.35)",
  background: "rgba(120,20,20,0.12)",
  padding: "16px 18px",
  color: "#ffb4b4",
  fontSize: "18px",
  lineHeight: 1.6,
  marginBottom: "20px",
};

const caixaSucesso: CSSProperties = {
  border: "1px solid rgba(74,222,128,0.35)",
  background: "rgba(20,90,40,0.12)",
  padding: "16px 18px",
  color: "#bff1bf",
  fontSize: "18px",
  lineHeight: 1.6,
  marginBottom: "20px",
};