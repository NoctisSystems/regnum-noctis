"use client";

import { CSSProperties, useEffect, useMemo, useState } from "react";
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

export default function AdminPublicidadePage() {
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [pesquisa, setPesquisa] = useState("");
  const [savingId, setSavingId] = useState<number | null>(null);
  const [registos, setRegistos] = useState<PublicidadeParceiro[]>([]);

  useEffect(() => {
    carregarPublicidade();
  }, []);

  async function carregarPublicidade() {
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
    } catch (err: any) {
      setErro(err?.message || "Não foi possível carregar a publicidade.");
    } finally {
      setLoading(false);
    }
  }

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
    } catch (err: any) {
      setErro(err?.message || "Não foi possível guardar o registo.");
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
    <>
      <h1
        style={{
          fontFamily: "Cinzel, serif",
          fontSize: "48px",
          marginBottom: "24px",
          color: "#e6c27a",
        }}
      >
        Publicidade e Parceiros
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
          <p style={cardValue}>{loading ? "..." : totalRegistos}</p>
        </div>

        <div style={card}>
          <h3 style={cardTitle}>Ativos</h3>
          <p style={cardValue}>{loading ? "..." : totalAtivos}</p>
        </div>

        <div style={card}>
          <h3 style={cardTitle}>Na Home</h3>
          <p style={cardValue}>{loading ? "..." : totalHome}</p>
        </div>

        <div style={card}>
          <h3 style={cardTitle}>Pendentes</h3>
          <p style={cardValue}>{loading ? "..." : totalPendentes}</p>
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
          placeholder="Pesquisar registo..."
          value={pesquisa}
          onChange={(e) => setPesquisa(e.target.value)}
          style={inputPesquisa}
        />

        <button
          type="button"
          style={buttonSecundario}
          onClick={carregarPublicidade}
        >
          Atualizar
        </button>
      </div>

      {loading ? (
        <div style={linhaVazia}>A carregar publicidade...</div>
      ) : registosFiltrados.length === 0 ? (
        <div style={linhaVazia}>Ainda não existem registos de publicidade.</div>
      ) : (
        <div style={{ display: "grid", gap: "14px" }}>
          {registosFiltrados.map((item) => (
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
                    "minmax(180px, 220px) minmax(180px, 220px) minmax(180px, 220px) minmax(220px, 1fr) auto",
                  gap: "12px",
                  alignItems: "end",
                  marginBottom: "12px",
                }}
              >
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

                <button
                  type="button"
                  onClick={() => guardarRegisto(item)}
                  disabled={savingId === item.id}
                  style={{
                    ...button,
                    opacity: savingId === item.id ? 0.7 : 1,
                    cursor: savingId === item.id ? "not-allowed" : "pointer",
                  }}
                >
                  {savingId === item.id ? "Guardar..." : "Guardar"}
                </button>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "minmax(220px, 1fr) minmax(220px, 1fr) minmax(220px, 1fr)",
                  gap: "12px",
                  marginBottom: "12px",
                }}
              >
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
                  onChange={(v) =>
                    atualizarCampo(item.id, "email_contacto", v)
                  }
                />
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "minmax(220px, 1fr) minmax(220px, 1fr) minmax(180px, 220px) minmax(180px, 220px)",
                  gap: "12px",
                  marginBottom: "12px",
                }}
              >
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
                    item.ordem_home === null ? "" : String(item.ordem_home)
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
                  <div style={{ display: "grid", gap: "8px", paddingTop: "6px" }}>
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

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "12px",
                  marginBottom: "12px",
                }}
              >
                <AreaCampo
                  titulo="Descrição curta"
                  value={item.descricao_curta || ""}
                  onChange={(v) =>
                    atualizarCampo(item.id, "descricao_curta", v)
                  }
                  rows={3}
                />

                <AreaCampo
                  titulo="Descrição"
                  value={item.descricao || ""}
                  onChange={(v) => atualizarCampo(item.id, "descricao", v)}
                  rows={3}
                />
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "12px",
                }}
              >
                <AreaCampo
                  titulo="Notas admin"
                  value={item.notas_admin || ""}
                  onChange={(v) => atualizarCampo(item.id, "notas_admin", v)}
                  rows={3}
                />

                <div style={{ display: "grid", gap: "10px" }}>
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
        </div>
      )}
    </>
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

const checkLabel: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  color: "#e6c27a",
  fontSize: "16px",
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