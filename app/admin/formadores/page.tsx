"use client";

import { CSSProperties, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type Formador = {
  id: number;
  nome: string | null;
  email: string | null;
  foto_url: string | null;
  nif_cpf: string | null;
  dados_pagamento: string | null;
  payout_metodo: string | null;
  comissao_percentual: number | null;
  comissao_ativa: boolean | null;
  status: string | null;
  telefone: string | null;
  bio_curta: string | null;
  bio: string | null;
};

type FotosSelecionadasState = Record<number, File | null>;
type FotosPreviewState = Record<number, string | null>;

const BUCKET_FORMADORES_FOTOS = "formadores-fotos";

export default function FormadoresPage() {
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [pesquisa, setPesquisa] = useState("");
  const [savingId, setSavingId] = useState<number | null>(null);
  const [formadores, setFormadores] = useState<Formador[]>([]);
  const [fotosSelecionadas, setFotosSelecionadas] =
    useState<FotosSelecionadasState>({});
  const [fotosPreview, setFotosPreview] = useState<FotosPreviewState>({});

  useEffect(() => {
    carregarFormadores();
  }, []);

  useEffect(() => {
    return () => {
      Object.values(fotosPreview).forEach((url) => {
        if (url && url.startsWith("blob:")) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, [fotosPreview]);

  async function carregarFormadores() {
    setLoading(true);
    setErro("");
    setSucesso("");

    try {
      const { data, error } = await supabase
        .from("formadores")
        .select(
          "id, nome, email, foto_url, nif_cpf, dados_pagamento, payout_metodo, comissao_percentual, comissao_ativa, status, telefone, bio_curta, bio"
        )
        .eq("status", "aprovado")
        .order("nome", { ascending: true });

      if (error) {
        throw error;
      }

      setFormadores((data || []) as Formador[]);
    } catch (err: any) {
      setErro(err?.message || "Ocorreu um erro ao carregar os formadores.");
    } finally {
      setLoading(false);
    }
  }

  function atualizarCampo(
    id: number,
    campo:
      | "nome"
      | "email"
      | "telefone"
      | "nif_cpf"
      | "dados_pagamento"
      | "payout_metodo"
      | "comissao_percentual"
      | "comissao_ativa"
      | "bio_curta"
      | "bio",
    valor: string | number | boolean
  ) {
    setFormadores((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [campo]: valor } : item))
    );
  }

  function obterSrcFoto(formador: Formador) {
    const preview = fotosPreview[formador.id];
    if (preview) return preview;

    const foto = formador.foto_url?.trim();
    if (!foto) return "";

    if (foto.startsWith("http://") || foto.startsWith("https://")) {
      return foto;
    }

    const caminhoLimpo = foto.replace(/^\/+/, "");
    const { data } = supabase.storage
      .from(BUCKET_FORMADORES_FOTOS)
      .getPublicUrl(caminhoLimpo);

    return data.publicUrl;
  }

  function selecionarNovaFoto(formadorId: number, file: File | null) {
    const previewAnterior = fotosPreview[formadorId];
    if (previewAnterior && previewAnterior.startsWith("blob:")) {
      URL.revokeObjectURL(previewAnterior);
    }

    if (!file) {
      setFotosSelecionadas((prev) => ({ ...prev, [formadorId]: null }));
      setFotosPreview((prev) => ({ ...prev, [formadorId]: null }));
      return;
    }

    const tiposPermitidos = ["image/jpeg", "image/png", "image/webp"];
    if (!tiposPermitidos.includes(file.type)) {
      setErro("A foto tem de estar em JPG, PNG ou WEBP.");
      return;
    }

    const maxBytes = 5 * 1024 * 1024;
    if (file.size > maxBytes) {
      setErro("A foto não pode ultrapassar 5 MB.");
      return;
    }

    setErro("");

    const previewUrl = URL.createObjectURL(file);

    setFotosSelecionadas((prev) => ({ ...prev, [formadorId]: file }));
    setFotosPreview((prev) => ({ ...prev, [formadorId]: previewUrl }));
  }

  async function uploadFotoFormador(formador: Formador) {
    const ficheiro = fotosSelecionadas[formador.id];
    if (!ficheiro) {
      return formador.foto_url?.trim() || null;
    }

    const extensaoOriginal = ficheiro.name.split(".").pop()?.toLowerCase() || "jpg";
    const extensao =
      extensaoOriginal === "jpeg" ||
      extensaoOriginal === "jpg" ||
      extensaoOriginal === "png" ||
      extensaoOriginal === "webp"
        ? extensaoOriginal
        : "jpg";

    const nomeSeguro = (formador.nome || "formador")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60);

    const caminho = `${formador.id}/${Date.now()}-${nomeSeguro || "formador"}.${extensao}`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET_FORMADORES_FOTOS)
      .upload(caminho, ficheiro, {
        cacheControl: "3600",
        upsert: true,
      });

    if (uploadError) {
      throw uploadError;
    }

    const { data } = supabase.storage
      .from(BUCKET_FORMADORES_FOTOS)
      .getPublicUrl(caminho);

    return data.publicUrl;
  }

  async function guardarFormador(formador: Formador) {
    setErro("");
    setSucesso("");

    const comissao = Number(formador.comissao_percentual ?? 0);

    if (Number.isNaN(comissao) || comissao < 0 || comissao > 100) {
      setErro("A comissão tem de estar entre 0 e 100.");
      return;
    }

    try {
      setSavingId(formador.id);

      const novaFotoUrl = await uploadFotoFormador(formador);

      const { error } = await supabase
        .from("formadores")
        .update({
          nome: formador.nome?.trim() || null,
          email: formador.email?.trim() || null,
          telefone: formador.telefone?.trim() || null,
          nif_cpf: formador.nif_cpf?.trim() || null,
          dados_pagamento: formador.dados_pagamento?.trim() || null,
          payout_metodo: formador.payout_metodo || "transferencia_bancaria",
          comissao_percentual: comissao,
          comissao_ativa: !!formador.comissao_ativa,
          bio_curta: formador.bio_curta?.trim() || null,
          bio: formador.bio?.trim() || null,
          foto_url: novaFotoUrl,
        })
        .eq("id", formador.id);

      if (error) {
        throw error;
      }

      setFormadores((prev) =>
        prev.map((item) =>
          item.id === formador.id
            ? {
                ...item,
                foto_url: novaFotoUrl,
              }
            : item
        )
      );

      const previewAnterior = fotosPreview[formador.id];
      if (previewAnterior && previewAnterior.startsWith("blob:")) {
        URL.revokeObjectURL(previewAnterior);
      }

      setFotosSelecionadas((prev) => ({ ...prev, [formador.id]: null }));
      setFotosPreview((prev) => ({ ...prev, [formador.id]: null }));

      setSucesso(
        `Dados de ${formador.nome || "formador"} guardados com sucesso.`
      );
    } catch (err: any) {
      setErro(err?.message || "Não foi possível guardar os dados do formador.");
    } finally {
      setSavingId(null);
    }
  }

  const formadoresFiltrados = useMemo(() => {
    const termo = pesquisa.trim().toLowerCase();

    if (!termo) return formadores;

    return formadores.filter((formador) => {
      const nome = (formador.nome || "").toLowerCase();
      const email = (formador.email || "").toLowerCase();
      const nifCpf = (formador.nif_cpf || "").toLowerCase();

      return (
        nome.includes(termo) ||
        email.includes(termo) ||
        nifCpf.includes(termo)
      );
    });
  }, [formadores, pesquisa]);

  return (
    <main
      style={{
        minHeight: "100vh",
        color: "#e6c27a",
        fontFamily: "Cormorant Garamond, serif",
      }}
    >
      <section
        style={{
          maxWidth: "1280px",
          margin: "0 auto",
          padding: "10px 0 24px 0",
        }}
      >
        <p
          style={{
            letterSpacing: "3px",
            textTransform: "uppercase",
            color: "#caa15a",
            fontSize: "16px",
            marginBottom: "14px",
          }}
        >
          Administração
        </p>

        <h1
          style={{
            fontFamily: "Cinzel, serif",
            fontSize: "48px",
            fontWeight: 500,
            margin: "0 0 14px 0",
            color: "#e6c27a",
            lineHeight: 1.05,
          }}
        >
          Formadores
        </h1>

        <p
          style={{
            fontSize: "21px",
            lineHeight: "1.7",
            color: "#d7b06c",
            maxWidth: "980px",
            margin: 0,
          }}
        >
          Edição administrativa dos dados dos formadores aprovados, incluindo a
          fotografia pública de cada perfil.
        </p>
      </section>

      <section
        style={{
          maxWidth: "1280px",
          margin: "0 auto 16px auto",
        }}
      >
        <div
          style={{
            border: "1px solid #8a5d31",
            background:
              "linear-gradient(180deg, rgba(20,13,9,0.98) 0%, rgba(16,10,8,0.98) 100%)",
            padding: "14px",
            display: "grid",
            gridTemplateColumns: "1fr auto",
            gap: "12px",
            alignItems: "end",
          }}
        >
          <div>
            <label
              style={{
                display: "block",
                marginBottom: "8px",
                fontSize: "15px",
                color: "#caa15a",
              }}
            >
              Procurar formador
            </label>

            <input
              value={pesquisa}
              onChange={(e) => setPesquisa(e.target.value)}
              placeholder="Nome, email ou NIF/CPF"
              style={input}
            />
          </div>

          <button
            type="button"
            onClick={carregarFormadores}
            style={botaoSecundario}
          >
            Atualizar
          </button>
        </div>
      </section>

      <section
        style={{
          maxWidth: "1280px",
          margin: "0 auto",
        }}
      >
        {erro ? <ErrorBox texto={erro} /> : null}
        {sucesso ? <SuccessBox texto={sucesso} /> : null}

        {loading ? (
          <LoadingBox />
        ) : formadoresFiltrados.length === 0 ? (
          <div
            style={{
              border: "1px solid #8a5d31",
              background: "#140d09",
              padding: "28px",
              textAlign: "center",
            }}
          >
            <h2
              style={{
                fontFamily: "Cinzel, serif",
                fontSize: "30px",
                marginTop: 0,
                marginBottom: "12px",
                color: "#e6c27a",
                fontWeight: 500,
              }}
            >
              Não foram encontrados formadores
            </h2>

            <p
              style={{
                fontSize: "19px",
                lineHeight: "1.7",
                color: "#d7b06c",
                margin: 0,
              }}
            >
              Ajusta a pesquisa ou aprova novas candidaturas.
            </p>
          </div>
        ) : (
          <div style={{ display: "grid", gap: "10px" }}>
            {formadoresFiltrados.map((formador) => {
              const fotoSrc = obterSrcFoto(formador);

              return (
                <article
                  key={formador.id}
                  style={{
                    border: "1px solid #8a5d31",
                    background:
                      "linear-gradient(180deg, rgba(20,13,9,0.98) 0%, rgba(16,10,8,0.98) 100%)",
                    padding: "14px",
                    boxShadow:
                      "0 8px 18px rgba(0,0,0,0.16), inset 0 1px 0 rgba(255,225,170,0.03)",
                  }}
                >
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "220px 1fr",
                      gap: "14px",
                      alignItems: "start",
                      marginBottom: "12px",
                    }}
                  >
                    <div
                      style={{
                        border: "1px solid #8a5d31",
                        background: "#120b08",
                        padding: "12px",
                      }}
                    >
                      <label style={labelMini}>Fotografia do formador</label>

                      <div
                        style={{
                          width: "100%",
                          aspectRatio: "1 / 1",
                          border: "1px solid rgba(166,120,61,0.45)",
                          background:
                            "linear-gradient(180deg, rgba(36,21,15,0.9) 0%, rgba(22,13,10,0.95) 100%)",
                          overflow: "hidden",
                          marginBottom: "10px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {fotoSrc ? (
                          <img
                            src={fotoSrc}
                            alt={formador.nome || "Formador"}
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                              display: "block",
                            }}
                          />
                        ) : (
                          <span
                            style={{
                              color: "#b89356",
                              fontSize: "15px",
                              textAlign: "center",
                              padding: "14px",
                              lineHeight: 1.5,
                            }}
                          >
                            Sem fotografia carregada
                          </span>
                        )}
                      </div>

                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        onChange={(e) =>
                          selecionarNovaFoto(
                            formador.id,
                            e.target.files?.[0] || null
                          )
                        }
                        style={inputFicheiro}
                      />

                      <p
                        style={{
                          margin: "8px 0 0 0",
                          fontSize: "13px",
                          lineHeight: 1.5,
                          color: "#b89356",
                        }}
                      >
                        Formatos aceites: JPG, PNG ou WEBP. Máximo: 5 MB.
                      </p>
                    </div>

                    <div>
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns:
                            "minmax(180px, 220px) minmax(220px, 1fr) minmax(160px, 190px) minmax(260px, 1fr) minmax(180px, 220px) auto",
                          gap: "10px",
                          alignItems: "end",
                          marginBottom: "10px",
                        }}
                      >
                        <CampoCompacto
                          label="Nome"
                          value={formador.nome || ""}
                          onChange={(v) => atualizarCampo(formador.id, "nome", v)}
                          placeholder="Nome"
                        />

                        <CampoCompacto
                          label="Email"
                          value={formador.email || ""}
                          onChange={(v) => atualizarCampo(formador.id, "email", v)}
                          placeholder="Email"
                        />

                        <CampoCompacto
                          label="Telefone"
                          value={formador.telefone || ""}
                          onChange={(v) =>
                            atualizarCampo(formador.id, "telefone", v)
                          }
                          placeholder="Telefone"
                        />

                        <CampoCompacto
                          label="NIF / CPF"
                          value={formador.nif_cpf || ""}
                          onChange={(v) =>
                            atualizarCampo(formador.id, "nif_cpf", v)
                          }
                          placeholder="NIF / CPF"
                        />

                        <CampoCompacto
                          label="Dados de pagamento"
                          value={formador.dados_pagamento || ""}
                          onChange={(v) =>
                            atualizarCampo(formador.id, "dados_pagamento", v)
                          }
                          placeholder="IBAN, PayPal, Stripe ou outro"
                        />

                        <button
                          type="button"
                          onClick={() => guardarFormador(formador)}
                          disabled={savingId === formador.id}
                          style={{
                            ...botao,
                            opacity: savingId === formador.id ? 0.7 : 1,
                            cursor:
                              savingId === formador.id
                                ? "not-allowed"
                                : "pointer",
                          }}
                        >
                          {savingId === formador.id ? "Guardar..." : "Guardar"}
                        </button>
                      </div>

                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns:
                            "minmax(220px, 260px) minmax(220px, 260px) minmax(220px, 260px)",
                          gap: "10px",
                          alignItems: "end",
                          marginBottom: "10px",
                        }}
                      >
                        <SelectCompacto
                          label="Método"
                          value={
                            formador.payout_metodo || "transferencia_bancaria"
                          }
                          onChange={(v) =>
                            atualizarCampo(formador.id, "payout_metodo", v)
                          }
                          options={[
                            {
                              value: "transferencia_bancaria",
                              label: "Transferência",
                            },
                            { value: "manual", label: "Manual" },
                            { value: "stripe", label: "Stripe" },
                          ]}
                        />

                        <div>
                          <label style={labelMini}>Comissão %</label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.01"
                            value={String(formador.comissao_percentual ?? 0)}
                            onChange={(e) =>
                              atualizarCampo(
                                formador.id,
                                "comissao_percentual",
                                Number(e.target.value)
                              )
                            }
                            style={inputCompacto}
                          />
                        </div>

                        <label
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            fontSize: "15px",
                            color: "#d7b06c",
                            paddingBottom: "12px",
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={!!formador.comissao_ativa}
                            onChange={(e) =>
                              atualizarCampo(
                                formador.id,
                                "comissao_ativa",
                                e.target.checked
                              )
                            }
                            style={{ accentColor: "#a6783d" }}
                          />
                          Comissão ativa
                        </label>
                      </div>

                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr",
                          gap: "10px",
                        }}
                      >
                        <CampoArea
                          label="Biografia curta"
                          value={formador.bio_curta || ""}
                          onChange={(v) =>
                            atualizarCampo(formador.id, "bio_curta", v)
                          }
                          placeholder="Biografia curta"
                          rows={3}
                        />

                        <CampoArea
                          label="Biografia da página de formador"
                          value={formador.bio || ""}
                          onChange={(v) =>
                            atualizarCampo(formador.id, "bio", v)
                          }
                          placeholder="Biografia completa"
                          rows={3}
                        />
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}

function CampoCompacto({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label style={labelMini}>{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={inputCompacto}
      />
    </div>
  );
}

function CampoArea({
  label,
  value,
  onChange,
  placeholder,
  rows,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <div>
      <label style={labelMini}>{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows || 3}
        style={textareaCompacta}
      />
    </div>
  );
}

function SelectCompacto({
  label,
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
    <div>
      <label style={labelMini}>{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={inputCompacto}
      >
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
            style={{ background: "#1a100c", color: "#e6c27a" }}
          >
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function LoadingBox() {
  return (
    <section
      style={{
        border: "1px solid rgba(166,120,61,0.7)",
        background:
          "linear-gradient(180deg, rgba(15,9,7,0.96) 0%, rgba(28,16,12,0.98) 100%)",
        padding: "24px",
      }}
    >
      <h2
        style={{
          fontFamily: "Cinzel, serif",
          fontSize: "30px",
          margin: "0 0 14px 0",
          color: "#f0d79a",
          fontWeight: 500,
        }}
      >
        A carregar formadores
      </h2>

      <p
        style={{
          margin: 0,
          fontSize: "20px",
          lineHeight: "1.7",
          color: "#dfbe81",
        }}
      >
        A plataforma está a reunir os dados dos formadores aprovados.
      </p>
    </section>
  );
}

function ErrorBox({ texto }: { texto: string }) {
  return (
    <section
      style={{
        border: "1px solid rgba(255,107,107,0.35)",
        background: "rgba(120,20,20,0.12)",
        padding: "18px 20px",
        color: "#ffb4b4",
        fontSize: "18px",
        lineHeight: 1.7,
        marginBottom: "16px",
      }}
    >
      {texto}
    </section>
  );
}

function SuccessBox({ texto }: { texto: string }) {
  return (
    <section
      style={{
        border: "1px solid rgba(74,222,128,0.35)",
        background: "rgba(20,90,40,0.12)",
        padding: "18px 20px",
        color: "#bff1bf",
        fontSize: "18px",
        lineHeight: 1.7,
        marginBottom: "16px",
      }}
    >
      {texto}
    </section>
  );
}

const labelMini: CSSProperties = {
  display: "block",
  marginBottom: "6px",
  fontSize: "12px",
  textTransform: "uppercase",
  letterSpacing: "1px",
  color: "#caa15a",
};

const input: CSSProperties = {
  width: "100%",
  padding: "13px 14px",
  background: "#1a100c",
  border: "1px solid #8a5d31",
  color: "#e6c27a",
  fontSize: "17px",
  outline: "none",
};

const inputCompacto: CSSProperties = {
  width: "100%",
  padding: "10px 10px",
  background: "#1a100c",
  border: "1px solid #8a5d31",
  color: "#e6c27a",
  fontSize: "15px",
  outline: "none",
};

const textareaCompacta: CSSProperties = {
  width: "100%",
  padding: "10px 10px",
  background: "#1a100c",
  border: "1px solid #8a5d31",
  color: "#e6c27a",
  fontSize: "15px",
  outline: "none",
  resize: "vertical",
  fontFamily: "Cormorant Garamond, serif",
};

const inputFicheiro: CSSProperties = {
  width: "100%",
  padding: "8px",
  background: "#1a100c",
  border: "1px solid #8a5d31",
  color: "#e6c27a",
  fontSize: "14px",
  outline: "none",
};

const botao: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  textDecoration: "none",
  border: "1px solid #a6783d",
  color: "#e6c27a",
  padding: "10px 14px",
  fontSize: "15px",
  background: "transparent",
};

const botaoSecundario: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  textDecoration: "none",
  border: "1px solid rgba(166,120,61,0.6)",
  color: "#e6c27a",
  padding: "12px 16px",
  fontSize: "16px",
  background: "rgba(32,18,13,0.55)",
  cursor: "pointer",
};