import type { CSSProperties } from "react";
import Link from "next/link";
import { eliminarCandidaturaRejeitada } from "../actions";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

type Candidatura = {
  id: number;
  nome: string;
  email: string;
  numero_contacto: string | null;
  cursos_pretendidos: string | null;
  estado: string | null;
  biografia_curta: string | null;
  created_at?: string | null;
};

export default async function HistoricoCandidaturasPage() {
  const supabaseAdmin = getSupabaseAdmin();

  const { data, error } = await supabaseAdmin
    .from("formador_candidaturas")
    .select(
      "id, nome, email, numero_contacto, cursos_pretendidos, estado, biografia_curta, created_at"
    )
    .in("estado", ["aprovado", "rejeitado"])
    .order("id", { ascending: false });

  const candidaturas = (data || []) as Candidatura[];

  return (
    <main style={pagina}>
      <section style={hero}>
        <div style={heroWrap}>
          <div style={heroTexto}>
            <p style={kicker}>Administração</p>

            <h1 style={titulo}>Histórico de Candidaturas</h1>

            <p style={descricao}>
              Candidaturas já analisadas: aprovadas e rejeitadas.
            </p>
          </div>

          <Link href="/admin/candidaturas-formador" style={botaoTopo}>
            Ver pendentes
          </Link>
        </div>
      </section>

      <section style={conteudo}>
        {error ? (
          <div style={caixaErro}>Erro ao carregar histórico.</div>
        ) : candidaturas.length === 0 ? (
          <div style={caixaVazia}>
            <h2 style={tituloVazio}>Ainda não existe histórico</h2>
            <p style={textoVazio}>
              As candidaturas aprovadas e rejeitadas aparecerão aqui.
            </p>
          </div>
        ) : (
          <div style={lista}>
            {candidaturas.map((candidatura) => (
              <article key={candidatura.id} style={card}>
                <div style={cardHeader}>
                  <div style={cardHeaderTexto}>
                    <h2 style={nome}>{candidatura.nome}</h2>

                    <p style={email}>{candidatura.email}</p>
                  </div>

                  <div style={acoesHistorico}>
                    <div
                      style={{
                        ...estadoBadge,
                        color:
                          candidatura.estado === "aprovado"
                            ? "#bff1bf"
                            : "#ffb4b4",
                      }}
                    >
                      {candidatura.estado}
                    </div>

                    {candidatura.estado === "rejeitado" ? (
                      <form action={eliminarCandidaturaRejeitada}>
                        <input
                          type="hidden"
                          name="candidaturaId"
                          value={candidatura.id}
                        />
                        <button type="submit" style={botaoEliminar}>
                          Eliminar rejeitada
                        </button>
                      </form>
                    ) : null}
                  </div>
                </div>

                <div style={gridInfo}>
                  <MiniBox
                    label="Número de contacto"
                    value={candidatura.numero_contacto || "Não indicado"}
                  />
                  <MiniBox
                    label="Cursos pretendidos"
                    value={candidatura.cursos_pretendidos || "Não indicados"}
                  />
                </div>

                <InfoBlock
                  label="Biografia curta"
                  value={candidatura.biografia_curta || "Não indicada"}
                />

                {candidatura.created_at && (
                  <p style={rodapeData}>
                    Registo:{" "}
                    {new Date(candidatura.created_at).toLocaleString("pt-PT")}
                  </p>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

function MiniBox({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div style={miniBox}>
      <p style={miniLabel}>{label}</p>
      <p style={miniValor}>{value}</p>
    </div>
  );
}

function InfoBlock({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div style={infoBlock}>
      <p style={miniLabel}>{label}</p>
      <p style={infoValor}>{value}</p>
    </div>
  );
}

const pagina: CSSProperties = {
  minHeight: "100vh",
  color: "#e6c27a",
  fontFamily: "Cormorant Garamond, serif",
  padding: "20px 0 40px",
};

const hero: CSSProperties = {
  maxWidth: "1240px",
  margin: "0 auto",
  padding: "6px 16px 24px",
};

const heroWrap: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-end",
  flexWrap: "wrap",
  gap: "18px",
};

const heroTexto: CSSProperties = {
  flex: "1 1 720px",
  minWidth: "280px",
};

const kicker: CSSProperties = {
  letterSpacing: "3px",
  textTransform: "uppercase",
  color: "#caa15a",
  fontSize: "14px",
  margin: "0 0 12px 0",
};

const titulo: CSSProperties = {
  fontFamily: "Cinzel, serif",
  fontSize: "clamp(32px, 5vw, 52px)",
  fontWeight: 500,
  margin: "0 0 14px 0",
  color: "#f0d79a",
  lineHeight: 1.1,
};

const descricao: CSSProperties = {
  fontSize: "clamp(18px, 2.2vw, 22px)",
  lineHeight: 1.7,
  color: "#d7b06c",
  maxWidth: "920px",
  margin: 0,
};

const conteudo: CSSProperties = {
  maxWidth: "1240px",
  margin: "0 auto",
  padding: "0 16px",
};

const lista: CSSProperties = {
  display: "grid",
  gap: "16px",
};

const card: CSSProperties = {
  border: "1px solid #8a5d31",
  background:
    "linear-gradient(180deg, rgba(20,13,9,0.98) 0%, rgba(16,10,8,0.98) 100%)",
  padding: "clamp(16px, 2vw, 22px)",
  boxShadow:
    "0 12px 26px rgba(0,0,0,0.16), inset 0 1px 0 rgba(255,225,170,0.03)",
};

const cardHeader: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: "18px",
  flexWrap: "wrap",
  marginBottom: "14px",
};

const cardHeaderTexto: CSSProperties = {
  minWidth: "220px",
  flex: "1 1 320px",
};

const nome: CSSProperties = {
  fontFamily: "Cinzel, serif",
  fontSize: "clamp(24px, 3vw, 28px)",
  margin: "0 0 8px 0",
  color: "#e6c27a",
};

const email: CSSProperties = {
  margin: "0 0 6px 0",
  fontSize: "clamp(17px, 2vw, 19px)",
  color: "#d7b06c",
  wordBreak: "break-word",
};

const acoesHistorico: CSSProperties = {
  display: "flex",
  gap: "12px",
  flexWrap: "wrap",
  alignItems: "flex-start",
};

const estadoBadge: CSSProperties = {
  border: "1px solid rgba(166,120,61,0.35)",
  padding: "10px 14px",
  alignSelf: "flex-start",
  fontSize: "14px",
  textTransform: "uppercase",
  letterSpacing: "1px",
};

const gridInfo: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "14px",
  marginBottom: "14px",
};

const miniBox: CSSProperties = {
  border: "1px solid rgba(166, 120, 61, 0.22)",
  background: "rgba(32, 18, 13, 0.45)",
  padding: "14px 16px",
};

const miniLabel: CSSProperties = {
  margin: "0 0 6px 0",
  fontSize: "14px",
  textTransform: "uppercase",
  letterSpacing: "1px",
  color: "#caa15a",
};

const miniValor: CSSProperties = {
  margin: 0,
  fontSize: "clamp(17px, 2vw, 18px)",
  lineHeight: 1.55,
  color: "#d7b06c",
  whiteSpace: "pre-line",
  wordBreak: "break-word",
};

const infoBlock: CSSProperties = {
  border: "1px solid rgba(166, 120, 61, 0.22)",
  background: "rgba(32, 18, 13, 0.45)",
  padding: "16px 18px",
};

const infoValor: CSSProperties = {
  margin: 0,
  fontSize: "clamp(18px, 2.1vw, 20px)",
  lineHeight: 1.7,
  color: "#d7b06c",
  whiteSpace: "pre-line",
  wordBreak: "break-word",
};

const rodapeData: CSSProperties = {
  marginTop: "14px",
  marginBottom: 0,
  fontSize: "14px",
  color: "#caa15a",
};

const caixaErro: CSSProperties = {
  border: "1px solid rgba(255,107,107,0.35)",
  background: "rgba(120,20,20,0.12)",
  padding: "20px",
  color: "#ffb4b4",
  fontSize: "18px",
};

const caixaVazia: CSSProperties = {
  border: "1px solid #8a5d31",
  background: "#140d09",
  padding: "28px",
  textAlign: "center",
};

const tituloVazio: CSSProperties = {
  fontFamily: "Cinzel, serif",
  fontSize: "clamp(26px, 4vw, 32px)",
  margin: "0 0 14px 0",
  color: "#e6c27a",
};

const textoVazio: CSSProperties = {
  margin: 0,
  fontSize: "clamp(18px, 2.1vw, 21px)",
  lineHeight: 1.7,
  color: "#d7b06c",
};

const botaoTopo: CSSProperties = {
  textDecoration: "none",
  border: "1px solid #a6783d",
  color: "#e6c27a",
  padding: "12px 18px",
  fontSize: "14px",
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  background: "rgba(32, 18, 13, 0.55)",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: "46px",
};

const botaoEliminar: CSSProperties = {
  textDecoration: "none",
  border: "1px solid rgba(255,107,107,0.45)",
  padding: "12px 16px",
  background: "rgba(120,20,20,0.12)",
  color: "#ffb4b4",
  cursor: "pointer",
  fontSize: "14px",
  fontWeight: 700,
  letterSpacing: "0.05em",
  textTransform: "uppercase",
  minHeight: "46px",
};