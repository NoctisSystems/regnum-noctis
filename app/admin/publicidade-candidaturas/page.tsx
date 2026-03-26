"use client";

import { CSSProperties, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type PublicidadeCandidatura = {
  id: number;
  nome: string;
  email: string;
  telefone: string | null;
  nome_marca: string | null;
  website_url: string | null;
  instagram_url: string | null;
  whatsapp: string | null;
  plano_interesse: string;
  titulo_anuncio: string | null;
  descricao_curta: string | null;
  descricao: string | null;
  logo_url: string | null;
  link_destino: string | null;
  observacoes: string | null;
  estado: string;
  notas_admin: string | null;
  created_at: string;
  updated_at: string;
};

export default function AdminPublicidadeCandidaturasPage() {
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [pesquisa, setPesquisa] = useState("");
  const [savingId, setSavingId] = useState<number | null>(null);
  const [candidaturas, setCandidaturas] = useState<PublicidadeCandidatura[]>([]);

  useEffect(() => {
    carregarCandidaturas();
  }, []);

  async function carregarCandidaturas() {
    setLoading(true);
    setErro("");
    setSucesso("");

    try {
      const { data, error } = await supabase
        .from("publicidade_candidaturas")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setCandidaturas((data || []) as PublicidadeCandidatura[]);
    } catch (err: any) {
      setErro(err?.message || "Não foi possível carregar as candidaturas.");
    } finally {
      setLoading(false);
    }
  }

  function atualizarCampo(
    id: number,
    campo: keyof PublicidadeCandidatura,
    valor: string | null
  ) {
    setCandidaturas((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [campo]: valor } : item))
    );
  }

  async function guardarEstado(item: PublicidadeCandidatura) {
    setErro("");
    setSucesso("");

    try {
      setSavingId(item.id);

      const { error } = await supabase
        .from("publicidade_candidaturas")
        .update({
          estado: item.estado,
          notas_admin: item.notas_admin?.trim() || null,
        })
        .eq("id", item.id);

      if (error) throw error;

      setSucesso(`Candidatura #${item.id} atualizada com sucesso.`);
    } catch (err: any) {
      setErro(err?.message || "Não foi possível atualizar a candidatura.");
    } finally {
      setSavingId(null);
    }
  }

  async function aprovarECriarPublicidade(item: PublicidadeCandidatura) {
    setErro("");
    setSucesso("");

    try {
      setSavingId(item.id);

      const payloadPublicidade = {
        nome: item.nome_marca?.trim() || item.nome.trim(),
        slug: criarSlug(item.nome_marca || item.titulo_anuncio || item.nome),
        tipo: "publicidade",
        plano: item.plano_interesse,
        descricao_curta: item.descricao_curta?.trim() || null,
        descricao: item.descricao?.trim() || null,
        imagem_url: item.logo_url?.trim() || null,
        link_url: item.link_destino?.trim() || null,
        email_contacto: item.email?.trim().toLowerCase() || null,
        whatsapp_contacto: item.whatsapp?.trim() || null,
        estado: "ativo",
        mostrar_na_home: item.plano_interesse === "home",
        ordem_home: item.plano_interesse === "home" ? 99 : null,
        destaque:
          item.plano_interesse === "destaque" || item.plano_interesse === "home",
        ativo: true,
        notas_admin: item.notas_admin?.trim() || null,
      };

      const { error: publicidadeError } = await supabase
        .from("publicidade_parceiros")
        .insert(payloadPublicidade);

      if (publicidadeError) throw publicidadeError;

      const { error: candidaturaError } = await supabase
        .from("publicidade_candidaturas")
        .update({
          estado: "convertida",
          notas_admin: item.notas_admin?.trim() || null,
        })
        .eq("id", item.id);

      if (candidaturaError) throw candidaturaError;

      setCandidaturas((prev) =>
        prev.map((c) =>
          c.id === item.id ? { ...c, estado: "convertida" } : c
        )
      );

      setSucesso(
        `Candidatura #${item.id} aprovada e convertida em publicidade ativa.`
      );
    } catch (err: any) {
      setErro(
        err?.message ||
          "Não foi possível aprovar e converter a candidatura."
      );
    } finally {
      setSavingId(null);
    }
  }

  const candidaturasFiltradas = useMemo(() => {
    const termo = pesquisa.trim().toLowerCase();

    if (!termo) return candidaturas;

    return candidaturas.filter((item) => {
      return (
        String(item.id).includes(termo) ||
        (item.nome || "").toLowerCase().includes(termo) ||
        (item.email || "").toLowerCase().includes(termo) ||
        (item.nome_marca || "").toLowerCase().includes(termo) ||
        (item.plano_interesse || "").toLowerCase().includes(termo) ||
        (item.estado || "").toLowerCase().includes(termo)
      );
    });
  }, [candidaturas, pesquisa]);

  const total = candidaturas.length;
  const pendentes = candidaturas.filter((item) => item.estado === "pendente").length;
  const emAnalise = candidaturas.filter((item) => item.estado === "em_analise").length;
  const convertidas = candidaturas.filter((item) => item.estado === "convertida").length;

  return (
    <>
      <h1
        style={{
          fontFamily: "Cinzel, serif",
          fontSize: "48px",
          marginBottom: "24px",
          color: "#e6c27a",
        }}
      >
        Candidaturas de Publicidade
      </h1>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "24px",
          marginBottom: "32px",
        }}
      >
        <div style={card}>
          <h3 style={cardTitle}>Total</h3>
          <p style={cardValue}>{loading ? "..." : total}</p>
        </div>

        <div style={card}>
          <h3 style={cardTitle}>Pendentes</h3>
          <p style={cardValue}>{loading ? "..." : pendentes}</p>
        </div>

        <div style={card}>
          <h3 style={cardTitle}>Em análise</h3>
          <p style={cardValue}>{loading ? "..." : emAnalise}</p>
        </div>

        <div style={card}>
          <h3 style={cardTitle}>Convertidas</h3>
          <p style={cardValue}>{loading ? "..." : convertidas}</p>
        </div>
      </div>

      {erro ? <div style={caixaErro}>{erro}</div> : null}
      {sucesso ? <div style={caixaSucesso}>{sucesso}</div> : null}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "16px",
          flexWrap: "wrap",
          marginBottom: "24px",
        }}
      >
        <input
          type="text"
          placeholder="Pesquisar candidatura..."
          value={pesquisa}
          onChange={(e) => setPesquisa(e.target.value)}
          style={inputPesquisa}
        />

        <button
          type="button"
          style={buttonSecundario}
          onClick={carregarCandidaturas}
        >
          Atualizar
        </button>
      </div>

      {loading ? (
        <div style={linhaVazia}>A carregar candidaturas...</div>
      ) : candidaturasFiltradas.length === 0 ? (
        <div style={linhaVazia}>
          Ainda não existem candidaturas de publicidade.
        </div>
      ) : (
        <div style={{ display: "grid", gap: "14px" }}>
          {candidaturasFiltradas.map((item) => (
            <article
              key={item.id}
              style={{
                border: "1px solid #a6783d",
                background: "linear-gradient(145deg, #1a0f0a, #140d09)",
                boxShadow: "0 0 20px rgba(166, 120, 61, 0.12)",
                padding: "20px",
              }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "minmax(240px, 1fr) minmax(240px, 1fr) minmax(220px, 260px) minmax(240px, 1fr)",
                  gap: "12px",
                  marginBottom: "12px",
                }}
              >
                <div>
                  <h3
                    style={{
                      margin: "0 0 8px 0",
                      fontFamily: "Cinzel, serif",
                      fontSize: "28px",
                      color: "#f0d79a",
                    }}
                  >
                    {item.nome_marca || item.nome}
                  </h3>
                  <p style={subtexto}>Candidatura #{item.id}</p>
                  <p style={subtexto}>Nome: {item.nome}</p>
                  <p style={subtexto}>Email: {item.email}</p>
                  <p style={subtexto}>Telefone: {item.telefone || "—"}</p>
                </div>

                <div>
                  <p style={subtexto}>Plano: {item.plano_interesse}</p>
                  <p style={subtexto}>Título: {item.titulo_anuncio || "—"}</p>
                  <p style={subtexto}>Website: {item.website_url || "—"}</p>
                  <p style={subtexto}>Instagram: {item.instagram_url || "—"}</p>
                  <p style={subtexto}>WhatsApp: {item.whatsapp || "—"}</p>
                </div>

                <div>
                  <label style={label}>Estado</label>
                  <select
                    value={item.estado}
                    onChange={(e) =>
                      atualizarCampo(item.id, "estado", e.target.value)
                    }
                    style={input}
                  >
                    <option value="pendente">Pendente</option>
                    <option value="em_analise">Em análise</option>
                    <option value="aprovada">Aprovada</option>
                    <option value="rejeitada">Rejeitada</option>
                    <option value="convertida">Convertida</option>
                  </select>

                  <div style={{ marginTop: "12px" }}>
                    {item.logo_url ? (
                      <a
                        href={item.logo_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={linkMini}
                      >
                        Ver logótipo
                      </a>
                    ) : (
                      <span style={subtexto}>Sem logótipo</span>
                    )}
                  </div>
                </div>

                <div>
                  <label style={label}>Notas admin</label>
                  <textarea
                    value={item.notas_admin || ""}
                    onChange={(e) =>
                      atualizarCampo(item.id, "notas_admin", e.target.value)
                    }
                    rows={5}
                    style={textarea}
                  />
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "12px",
                  marginBottom: "14px",
                }}
              >
                <div>
                  <label style={label}>Descrição curta</label>
                  <div style={boxTexto}>{item.descricao_curta || "—"}</div>
                </div>

                <div>
                  <label style={label}>Link destino</label>
                  <div style={boxTexto}>
                    {item.link_destino ? (
                      <a
                        href={item.link_destino}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={linkMini}
                      >
                        Abrir link
                      </a>
                    ) : (
                      "—"
                    )}
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: "14px" }}>
                <label style={label}>Descrição</label>
                <div style={boxTextoGrande}>{item.descricao || "—"}</div>
              </div>

              <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                <button
                  type="button"
                  onClick={() => guardarEstado(item)}
                  disabled={savingId === item.id}
                  style={{
                    ...buttonSecundario,
                    opacity: savingId === item.id ? 0.7 : 1,
                    cursor: savingId === item.id ? "not-allowed" : "pointer",
                  }}
                >
                  {savingId === item.id ? "A guardar..." : "Guardar estado"}
                </button>

                <button
                  type="button"
                  onClick={() => aprovarECriarPublicidade(item)}
                  disabled={savingId === item.id || item.estado === "convertida"}
                  style={{
                    ...button,
                    opacity:
                      savingId === item.id || item.estado === "convertida"
                        ? 0.7
                        : 1,
                    cursor:
                      savingId === item.id || item.estado === "convertida"
                        ? "not-allowed"
                        : "pointer",
                  }}
                >
                  {savingId === item.id
                    ? "A processar..."
                    : item.estado === "convertida"
                    ? "Já convertida"
                    : "Aprovar e criar publicidade"}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  );
}

function criarSlug(valor: string) {
  return valor
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);
}

const card: CSSProperties = {
  border: "1px solid #a6783d",
  padding: "24px",
  background: "linear-gradient(145deg, #1a0f0a, #140d09)",
  boxShadow: "0 0 20px rgba(166, 120, 61, 0.12)",
};

const cardTitle: CSSProperties = {
  fontSize: "22px",
  marginBottom: "14px",
  color: "#e6c27a",
};

const cardValue: CSSProperties = {
  fontSize: "40px",
  fontFamily: "Cinzel, serif",
  color: "#e6c27a",
};

const inputPesquisa: CSSProperties = {
  minWidth: "280px",
  flex: 1,
  maxWidth: "420px",
  padding: "12px 14px",
  border: "1px solid #a6783d",
  background: "#140d09",
  color: "#e6c27a",
  fontSize: "18px",
  outline: "none",
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

const label: CSSProperties = {
  display: "block",
  marginBottom: "8px",
  color: "#caa15a",
  fontSize: "15px",
  textTransform: "uppercase",
  letterSpacing: "1px",
};

const button: CSSProperties = {
  padding: "12px 18px",
  border: "1px solid #a6783d",
  background: "#a6783d",
  color: "#140d09",
  fontSize: "18px",
  cursor: "pointer",
};

const buttonSecundario: CSSProperties = {
  padding: "12px 18px",
  border: "1px solid #a6783d",
  background: "transparent",
  color: "#e6c27a",
  fontSize: "18px",
  cursor: "pointer",
};

const linhaVazia: CSSProperties = {
  border: "1px solid #a6783d",
  background: "#140d09",
  padding: "28px 18px",
  textAlign: "center",
  color: "#caa15a",
  fontSize: "21px",
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

const subtexto: CSSProperties = {
  margin: "0 0 6px 0",
  fontSize: "17px",
  lineHeight: "1.6",
  color: "#d7b06c",
};

const boxTexto: CSSProperties = {
  border: "1px solid rgba(166,120,61,0.35)",
  background: "rgba(38,20,15,0.35)",
  padding: "14px 16px",
  color: "#e6c27a",
  fontSize: "18px",
  lineHeight: "1.7",
  minHeight: "56px",
};

const boxTextoGrande: CSSProperties = {
  border: "1px solid rgba(166,120,61,0.35)",
  background: "rgba(38,20,15,0.35)",
  padding: "14px 16px",
  color: "#e6c27a",
  fontSize: "18px",
  lineHeight: "1.8",
  minHeight: "110px",
  whiteSpace: "pre-wrap",
};

const linkMini: CSSProperties = {
  color: "#f0d79a",
  textDecoration: "none",
  border: "1px solid rgba(166, 120, 61, 0.55)",
  padding: "8px 10px",
  display: "inline-block",
  fontSize: "15px",
};