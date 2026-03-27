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
    <main style={main}>
      <section style={topo}>
        <p style={eyebrow}>Administração</p>
        <h1 style={titulo}>Candidaturas de Publicidade</h1>
        <p style={descricao}>
          Gestão das candidaturas recebidas para publicidade e parceiros, com
          análise, atualização de estado e conversão para registo ativo.
        </p>
      </section>

      <section style={statsGrid}>
        <StatCard label="Total" value={loading ? "..." : String(total)} />
        <StatCard label="Pendentes" value={loading ? "..." : String(pendentes)} />
        <StatCard label="Em análise" value={loading ? "..." : String(emAnalise)} />
        <StatCard label="Convertidas" value={loading ? "..." : String(convertidas)} />
      </section>

      {erro ? <MensagemErro texto={erro} /> : null}
      {sucesso ? <MensagemSucesso texto={sucesso} /> : null}

      <section style={barra}>
        <input
          type="text"
          placeholder="Pesquisar candidatura..."
          value={pesquisa}
          onChange={(e) => setPesquisa(e.target.value)}
          style={inputPesquisa}
        />

        <button
          type="button"
          style={botaoSecundario}
          onClick={carregarCandidaturas}
        >
          Atualizar
        </button>
      </section>

      {loading ? (
        <EstadoBox texto="A carregar candidaturas..." />
      ) : candidaturasFiltradas.length === 0 ? (
        <EstadoBox texto="Ainda não existem candidaturas de publicidade." />
      ) : (
        <section style={lista}>
          {candidaturasFiltradas.map((item) => (
            <article key={item.id} style={card}>
              <div style={cardHeader}>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <p style={miniLabel}>Candidatura #{item.id}</p>
                  <h2 style={cardTitulo}>{item.nome_marca || item.nome}</h2>
                  <p style={subtextoBloco}>
                    Estado atual: {item.estado} • Plano: {item.plano_interesse}
                  </p>
                </div>
              </div>

              <div style={grid4}>
                <InfoTexto titulo="Nome" valor={item.nome} />
                <InfoTexto titulo="Email" valor={item.email} />
                <InfoTexto titulo="Telefone" valor={item.telefone || "—"} />
                <InfoTexto titulo="Marca" valor={item.nome_marca || "—"} />
              </div>

              <div style={grid4}>
                <InfoTexto titulo="Website" valor={item.website_url || "—"} />
                <InfoTexto titulo="Instagram" valor={item.instagram_url || "—"} />
                <InfoTexto titulo="WhatsApp" valor={item.whatsapp || "—"} />
                <InfoTexto titulo="Título anúncio" valor={item.titulo_anuncio || "—"} />
              </div>

              <div style={grid2}>
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
                </div>

                <div>
                  <label style={label}>Logótipo</label>
                  <div style={boxTexto}>
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
                      "Sem logótipo"
                    )}
                  </div>
                </div>
              </div>

              <div style={grid2}>
                <AreaSomenteLeitura
                  titulo="Descrição curta"
                  value={item.descricao_curta || "—"}
                />

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

              <AreaSomenteLeitura
                titulo="Descrição"
                value={item.descricao || "—"}
              />

              <AreaSomenteLeitura
                titulo="Observações do candidato"
                value={item.observacoes || "—"}
              />

              <div style={{ marginTop: "12px" }}>
                <label style={label}>Notas admin</label>
                <textarea
                  value={item.notas_admin || ""}
                  onChange={(e) =>
                    atualizarCampo(item.id, "notas_admin", e.target.value)
                  }
                  rows={4}
                  style={textarea}
                />
              </div>

              <div style={acoes}>
                <button
                  type="button"
                  onClick={() => guardarEstado(item)}
                  disabled={savingId === item.id}
                  style={{
                    ...botaoSecundario,
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
                    ...botaoPrimario,
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
        </section>
      )}
    </main>
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

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <article style={statCard}>
      <p style={statLabel}>{label}</p>
      <p style={statValue}>{value}</p>
    </article>
  );
}

function InfoTexto({ titulo, valor }: { titulo: string; valor: string }) {
  return (
    <div>
      <label style={label}>{titulo}</label>
      <div style={boxTexto}>{valor}</div>
    </div>
  );
}

function AreaSomenteLeitura({
  titulo,
  value,
}: {
  titulo: string;
  value: string;
}) {
  return (
    <div style={{ marginTop: "12px" }}>
      <label style={label}>{titulo}</label>
      <div style={boxTextoGrande}>{value}</div>
    </div>
  );
}

function EstadoBox({ texto }: { texto: string }) {
  return <div style={estadoBox}>{texto}</div>;
}

function MensagemErro({ texto }: { texto: string }) {
  return <div style={caixaErro}>{texto}</div>;
}

function MensagemSucesso({ texto }: { texto: string }) {
  return <div style={caixaSucesso}>{texto}</div>;
}

const main: CSSProperties = {
  color: "#e6c27a",
  fontFamily: "Cormorant Garamond, serif",
};

const topo: CSSProperties = {
  marginBottom: "24px",
  maxWidth: "980px",
};

const eyebrow: CSSProperties = {
  margin: "0 0 10px 0",
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  fontSize: "14px",
  color: "#caa15a",
};

const titulo: CSSProperties = {
  margin: "0 0 12px 0",
  fontFamily: "Cinzel, serif",
  fontSize: "clamp(32px, 5vw, 48px)",
  color: "#f0d79a",
  lineHeight: 1.08,
  fontWeight: 500,
};

const descricao: CSSProperties = {
  margin: 0,
  color: "#d7b06c",
  fontSize: "clamp(18px, 2.3vw, 22px)",
  lineHeight: 1.7,
};

const statsGrid: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
  gap: "16px",
  marginBottom: "24px",
};

const statCard: CSSProperties = {
  border: "1px solid #a6783d",
  padding: "20px",
  background: "linear-gradient(145deg, #1a0f0a, #140d09)",
  boxShadow: "0 0 20px rgba(166, 120, 61, 0.12)",
};

const statLabel: CSSProperties = {
  margin: "0 0 10px 0",
  fontSize: "18px",
  color: "#e6c27a",
};

const statValue: CSSProperties = {
  margin: 0,
  fontSize: "34px",
  lineHeight: 1.1,
  fontFamily: "Cinzel, serif",
  color: "#f0d79a",
};

const barra: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "12px",
  flexWrap: "wrap",
  marginBottom: "24px",
};

const inputPesquisa: CSSProperties = {
  minWidth: "260px",
  flex: 1,
  width: "100%",
  maxWidth: "520px",
  padding: "12px 14px",
  border: "1px solid #a6783d",
  background: "#140d09",
  color: "#e6c27a",
  fontSize: "17px",
  outline: "none",
};

const lista: CSSProperties = {
  display: "grid",
  gap: "16px",
};

const card: CSSProperties = {
  border: "1px solid #a6783d",
  background: "linear-gradient(145deg, #1a0f0a, #140d09)",
  boxShadow: "0 0 20px rgba(166, 120, 61, 0.12)",
  padding: "clamp(16px, 2vw, 20px)",
};

const cardHeader: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "14px",
  flexWrap: "wrap",
  marginBottom: "16px",
};

const miniLabel: CSSProperties = {
  margin: "0 0 8px 0",
  fontSize: "13px",
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  color: "#caa15a",
};

const cardTitulo: CSSProperties = {
  margin: "0 0 8px 0",
  fontFamily: "Cinzel, serif",
  fontSize: "clamp(24px, 3vw, 30px)",
  color: "#f0d79a",
  lineHeight: 1.15,
};

const subtextoBloco: CSSProperties = {
  margin: 0,
  fontSize: "17px",
  lineHeight: 1.6,
  color: "#d7b06c",
};

const grid4: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
  gap: "12px",
  marginBottom: "12px",
};

const grid2: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
  gap: "12px",
  marginBottom: "12px",
};

const input: CSSProperties = {
  width: "100%",
  padding: "12px 14px",
  border: "1px solid #8a5d31",
  background: "#140d09",
  color: "#e6c27a",
  fontSize: "16px",
  outline: "none",
};

const textarea: CSSProperties = {
  width: "100%",
  padding: "12px 14px",
  border: "1px solid #8a5d31",
  background: "#140d09",
  color: "#e6c27a",
  fontSize: "16px",
  outline: "none",
  resize: "vertical",
  fontFamily: "Cormorant Garamond, serif",
};

const label: CSSProperties = {
  display: "block",
  marginBottom: "8px",
  color: "#caa15a",
  fontSize: "14px",
  textTransform: "uppercase",
  letterSpacing: "1px",
};

const acoes: CSSProperties = {
  display: "flex",
  gap: "12px",
  flexWrap: "wrap",
  marginTop: "14px",
};

const botaoPrimario: CSSProperties = {
  padding: "12px 18px",
  border: "1px solid #a6783d",
  background: "#a6783d",
  color: "#140d09",
  fontSize: "16px",
  cursor: "pointer",
  minHeight: "46px",
};

const botaoSecundario: CSSProperties = {
  padding: "12px 18px",
  border: "1px solid #a6783d",
  background: "transparent",
  color: "#e6c27a",
  fontSize: "16px",
  cursor: "pointer",
  minHeight: "46px",
};

const estadoBox: CSSProperties = {
  border: "1px solid #a6783d",
  background: "#140d09",
  padding: "24px 18px",
  textAlign: "center",
  color: "#caa15a",
  fontSize: "20px",
  marginBottom: "20px",
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

const boxTexto: CSSProperties = {
  border: "1px solid rgba(166,120,61,0.35)",
  background: "rgba(38,20,15,0.35)",
  padding: "14px 16px",
  color: "#e6c27a",
  fontSize: "17px",
  lineHeight: "1.7",
  minHeight: "54px",
  wordBreak: "break-word",
};

const boxTextoGrande: CSSProperties = {
  border: "1px solid rgba(166,120,61,0.35)",
  background: "rgba(38,20,15,0.35)",
  padding: "14px 16px",
  color: "#e6c27a",
  fontSize: "17px",
  lineHeight: "1.8",
  minHeight: "90px",
  whiteSpace: "pre-wrap",
  wordBreak: "break-word",
};

const linkMini: CSSProperties = {
  color: "#f0d79a",
  textDecoration: "none",
  border: "1px solid rgba(166, 120, 61, 0.55)",
  padding: "8px 10px",
  display: "inline-block",
  fontSize: "15px",
};