"use client";

import { CSSProperties, useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type PublicidadeParceiro = {
  id: number;
  nome: string;
  slug: string | null;
  tipo: string;
  plano: string;
  descricao_curta: string | null;
  descricao: string | null;
  imagem_url: string | null;
  link_url: string | null;
  email_contacto: string | null;
  whatsapp_contacto: string | null;
  estado: string;
  mostrar_na_home: boolean;
  ordem_home: number | null;
  destaque: boolean;
  data_inicio: string | null;
  data_fim: string | null;
  ativo: boolean;
  notas_admin: string | null;
  created_at: string;
  updated_at: string;
};

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

export default function AdminPublicidadePage() {
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [pesquisa, setPesquisa] = useState("");
  const [savingId, setSavingId] = useState<number | null>(null);
  const [registos, setRegistos] = useState<PublicidadeParceiro[]>([]);

  const carregarPublicidade = useCallback(async () => {
    setLoading(true);
    setErro("");
    setSucesso("");

    try {
      const { data, error } = await supabase
        .from("publicidade_parceiros")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setRegistos((data || []) as PublicidadeParceiro[]);
    } catch (err: unknown) {
      setErro(getErrorMessage(err, "Não foi possível carregar a publicidade."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void carregarPublicidade();
  }, [carregarPublicidade]);

  function atualizarCampo(
    id: number,
    campo: keyof PublicidadeParceiro,
    valor: string | number | boolean | null
  ) {
    setRegistos((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [campo]: valor } : item))
    );
  }

  async function guardarRegisto(item: PublicidadeParceiro) {
    setErro("");
    setSucesso("");

    try {
      setSavingId(item.id);

      const { error } = await supabase
        .from("publicidade_parceiros")
        .update({
          nome: item.nome?.trim(),
          slug: item.slug?.trim() || null,
          tipo: item.tipo,
          plano: item.plano,
          descricao_curta: item.descricao_curta?.trim() || null,
          descricao: item.descricao?.trim() || null,
          imagem_url: item.imagem_url?.trim() || null,
          link_url: item.link_url?.trim() || null,
          email_contacto: item.email_contacto?.trim() || null,
          whatsapp_contacto: item.whatsapp_contacto?.trim() || null,
          estado: item.estado,
          mostrar_na_home: !!item.mostrar_na_home,
          ordem_home:
            item.ordem_home === null || item.ordem_home === undefined
              ? null
              : Number(item.ordem_home),
          destaque: !!item.destaque,
          data_inicio: item.data_inicio?.trim() || null,
          data_fim: item.data_fim?.trim() || null,
          ativo: !!item.ativo,
          notas_admin: item.notas_admin?.trim() || null,
        })
        .eq("id", item.id);

      if (error) throw error;

      setSucesso(`Registo "${item.nome}" guardado com sucesso.`);
    } catch (err: unknown) {
      setErro(getErrorMessage(err, "Não foi possível guardar o registo."));
    } finally {
      setSavingId(null);
    }
  }

  const registosFiltrados = useMemo(() => {
    const termo = pesquisa.trim().toLowerCase();

    if (!termo) return registos;

    return registos.filter((item) => {
      return (
        (item.nome || "").toLowerCase().includes(termo) ||
        (item.tipo || "").toLowerCase().includes(termo) ||
        (item.plano || "").toLowerCase().includes(termo) ||
        (item.estado || "").toLowerCase().includes(termo) ||
        (item.email_contacto || "").toLowerCase().includes(termo)
      );
    });
  }, [registos, pesquisa]);

  const totalRegistos = registos.length;
  const totalAtivos = registos.filter((item) => item.estado === "ativo").length;
  const totalHome = registos.filter((item) => item.mostrar_na_home).length;
  const totalPendentes = registos.filter((item) => item.estado === "pendente").length;

  return (
    <main style={main}>
      <section style={topo}>
        <div style={topoTexto}>
          <p style={eyebrow}>Administração</p>
          <h1 style={titulo}>Publicidade e Parceiros</h1>
          <p style={descricao}>
            Gestão administrativa dos parceiros, anúncios, destaque na home e
            respetivos dados de contacto, plano e estado.
          </p>
        </div>
      </section>

      <section style={statsGrid}>
        <StatCard label="Total" value={loading ? "..." : String(totalRegistos)} />
        <StatCard label="Ativos" value={loading ? "..." : String(totalAtivos)} />
        <StatCard label="Na Home" value={loading ? "..." : String(totalHome)} />
        <StatCard label="Pendentes" value={loading ? "..." : String(totalPendentes)} />
      </section>

      {erro ? <MensagemErro texto={erro} /> : null}
      {sucesso ? <MensagemSucesso texto={sucesso} /> : null}

      <section style={barra}>
        <input
          type="text"
          placeholder="Pesquisar registo..."
          value={pesquisa}
          onChange={(e) => setPesquisa(e.target.value)}
          style={inputPesquisa}
        />

        <button
          type="button"
          style={botaoSecundario}
          onClick={() => void carregarPublicidade()}
        >
          Atualizar
        </button>
      </section>

      {loading ? (
        <EstadoBox texto="A carregar publicidade..." />
      ) : registosFiltrados.length === 0 ? (
        <EstadoBox texto="Ainda não existem registos de publicidade." />
      ) : (
        <section style={lista}>
          {registosFiltrados.map((item) => (
            <article key={item.id} style={card}>
              <div style={cardHeader}>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <p style={miniLabel}>Registo #{item.id}</p>
                  <h2 style={cardTitulo}>{item.nome}</h2>
                  <p style={subinfo}>
                    Tipo: {item.tipo} • Plano: {item.plano} • Estado: {item.estado}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => void guardarRegisto(item)}
                  disabled={savingId === item.id}
                  style={{
                    ...botaoPrimario,
                    opacity: savingId === item.id ? 0.7 : 1,
                    cursor: savingId === item.id ? "not-allowed" : "pointer",
                  }}
                >
                  {savingId === item.id ? "Guardar..." : "Guardar"}
                </button>
              </div>

              <div style={grid4}>
                <Campo
                  titulo="Nome"
                  value={item.nome || ""}
                  onChange={(v) => atualizarCampo(item.id, "nome", v)}
                />

                <SelectCampo
                  titulo="Tipo"
                  value={item.tipo}
                  onChange={(v) => atualizarCampo(item.id, "tipo", v)}
                  options={[
                    { value: "publicidade", label: "Publicidade" },
                    { value: "parceiro", label: "Parceiro" },
                  ]}
                />

                <SelectCampo
                  titulo="Plano"
                  value={item.plano}
                  onChange={(v) => atualizarCampo(item.id, "plano", v)}
                  options={[
                    { value: "base", label: "Base" },
                    { value: "destaque", label: "Destaque" },
                    { value: "home", label: "Home" },
                  ]}
                />

                <Campo
                  titulo="Slug"
                  value={item.slug || ""}
                  onChange={(v) => atualizarCampo(item.id, "slug", v)}
                />
              </div>

              <div style={grid3}>
                <Campo
                  titulo="Imagem URL"
                  value={item.imagem_url || ""}
                  onChange={(v) => atualizarCampo(item.id, "imagem_url", v)}
                />

                <Campo
                  titulo="Link URL"
                  value={item.link_url || ""}
                  onChange={(v) => atualizarCampo(item.id, "link_url", v)}
                />

                <Campo
                  titulo="Email contacto"
                  value={item.email_contacto || ""}
                  onChange={(v) => atualizarCampo(item.id, "email_contacto", v)}
                />
              </div>

              <div style={grid4}>
                <Campo
                  titulo="WhatsApp"
                  value={item.whatsapp_contacto || ""}
                  onChange={(v) =>
                    atualizarCampo(item.id, "whatsapp_contacto", v)
                  }
                />

                <SelectCampo
                  titulo="Estado"
                  value={item.estado}
                  onChange={(v) => atualizarCampo(item.id, "estado", v)}
                  options={[
                    { value: "pendente", label: "Pendente" },
                    { value: "ativo", label: "Ativo" },
                    { value: "expirado", label: "Expirado" },
                    { value: "rejeitado", label: "Rejeitado" },
                    { value: "pausado", label: "Pausado" },
                  ]}
                />

                <Campo
                  titulo="Ordem Home"
                  value={
                    item.ordem_home === null || item.ordem_home === undefined
                      ? ""
                      : String(item.ordem_home)
                  }
                  onChange={(v) =>
                    atualizarCampo(
                      item.id,
                      "ordem_home",
                      v.trim() === "" ? null : Number(v)
                    )
                  }
                />

                <div>
                  <label style={label}>Ativações</label>

                  <div style={checksBox}>
                    <label style={checkLabel}>
                      <input
                        type="checkbox"
                        checked={!!item.mostrar_na_home}
                        onChange={(e) =>
                          atualizarCampo(
                            item.id,
                            "mostrar_na_home",
                            e.target.checked
                          )
                        }
                        style={{ accentColor: "#a6783d" }}
                      />
                      Mostrar na Home
                    </label>

                    <label style={checkLabel}>
                      <input
                        type="checkbox"
                        checked={!!item.destaque}
                        onChange={(e) =>
                          atualizarCampo(item.id, "destaque", e.target.checked)
                        }
                        style={{ accentColor: "#a6783d" }}
                      />
                      Destaque
                    </label>

                    <label style={checkLabel}>
                      <input
                        type="checkbox"
                        checked={!!item.ativo}
                        onChange={(e) =>
                          atualizarCampo(item.id, "ativo", e.target.checked)
                        }
                        style={{ accentColor: "#a6783d" }}
                      />
                      Ativo
                    </label>
                  </div>
                </div>
              </div>

              <div style={grid2}>
                <AreaCampo
                  titulo="Descrição curta"
                  value={item.descricao_curta || ""}
                  onChange={(v) => atualizarCampo(item.id, "descricao_curta", v)}
                  rows={3}
                />

                <AreaCampo
                  titulo="Descrição"
                  value={item.descricao || ""}
                  onChange={(v) => atualizarCampo(item.id, "descricao", v)}
                  rows={3}
                />
              </div>

              <div style={grid2}>
                <AreaCampo
                  titulo="Notas admin"
                  value={item.notas_admin || ""}
                  onChange={(v) => atualizarCampo(item.id, "notas_admin", v)}
                  rows={3}
                />

                <div style={{ display: "grid", gap: "12px" }}>
                  <Campo
                    titulo="Data início"
                    value={item.data_inicio || ""}
                    onChange={(v) => atualizarCampo(item.id, "data_inicio", v)}
                  />

                  <Campo
                    titulo="Data fim"
                    value={item.data_fim || ""}
                    onChange={(v) => atualizarCampo(item.id, "data_fim", v)}
                  />
                </div>
              </div>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}

function Campo({
  titulo,
  value,
  onChange,
}: {
  titulo: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label style={label}>{titulo}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={input}
      />
    </div>
  );
}

function AreaCampo({
  titulo,
  value,
  onChange,
  rows,
}: {
  titulo: string;
  value: string;
  onChange: (v: string) => void;
  rows: number;
}) {
  return (
    <div>
      <label style={label}>{titulo}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        style={textarea}
      />
    </div>
  );
}

function SelectCampo({
  titulo,
  value,
  onChange,
  options,
}: {
  titulo: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <label style={label}>{titulo}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={input}
      >
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

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <article style={statCard}>
      <p style={statLabel}>{label}</p>
      <p style={statValue}>{value}</p>
    </article>
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
};

const topoTexto: CSSProperties = {
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

const subinfo: CSSProperties = {
  margin: 0,
  fontSize: "17px",
  color: "#d7b06c",
  lineHeight: 1.6,
};

const grid4: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
  gap: "12px",
  marginBottom: "12px",
};

const grid3: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
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

const checksBox: CSSProperties = {
  border: "1px solid rgba(166,120,61,0.28)",
  background: "rgba(38,20,15,0.35)",
  padding: "12px",
  display: "grid",
  gap: "10px",
};

const checkLabel: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  color: "#e6c27a",
  fontSize: "15px",
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