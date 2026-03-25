import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase-admin";

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
  const { data, error } = await supabaseAdmin
    .from("formador_candidaturas")
    .select(
      "id, nome, email, numero_contacto, cursos_pretendidos, estado, biografia_curta, created_at"
    )
    .in("estado", ["aprovado", "rejeitado"])
    .order("id", { ascending: false });

  const candidaturas = (data || []) as Candidatura[];

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
          maxWidth: "1240px",
          margin: "0 auto",
          padding: "10px 0 30px 0",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            flexWrap: "wrap",
            gap: "18px",
          }}
        >
          <div>
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
                fontSize: "52px",
                fontWeight: 500,
                margin: "0 0 16px 0",
                color: "#f0d79a",
              }}
            >
              Histórico de Candidaturas
            </h1>

            <p
              style={{
                fontSize: "22px",
                lineHeight: "1.7",
                color: "#d7b06c",
                maxWidth: "920px",
                margin: 0,
              }}
            >
              Candidaturas já analisadas: aprovadas e rejeitadas.
            </p>
          </div>

          <Link href="/admin/candidaturas-formador" style={botaoTopo}>
            Ver pendentes
          </Link>
        </div>
      </section>

      <section
        style={{
          maxWidth: "1240px",
          margin: "0 auto",
        }}
      >
        {error ? (
          <div
            style={{
              border: "1px solid rgba(255,107,107,0.35)",
              background: "rgba(120,20,20,0.12)",
              padding: "24px",
              color: "#ffb4b4",
              fontSize: "20px",
            }}
          >
            Erro ao carregar histórico.
          </div>
        ) : candidaturas.length === 0 ? (
          <div
            style={{
              border: "1px solid #8a5d31",
              background: "#140d09",
              padding: "34px",
              textAlign: "center",
            }}
          >
            <h2
              style={{
                fontFamily: "Cinzel, serif",
                fontSize: "32px",
                margin: "0 0 14px 0",
                color: "#e6c27a",
              }}
            >
              Ainda não existe histórico
            </h2>

            <p
              style={{
                margin: 0,
                fontSize: "21px",
                lineHeight: "1.7",
                color: "#d7b06c",
              }}
            >
              As candidaturas aprovadas e rejeitadas aparecerão aqui.
            </p>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gap: "16px",
            }}
          >
            {candidaturas.map((candidatura) => (
              <article
                key={candidatura.id}
                style={{
                  border: "1px solid #8a5d31",
                  background:
                    "linear-gradient(180deg, rgba(20,13,9,0.98) 0%, rgba(16,10,8,0.98) 100%)",
                  padding: "22px",
                  boxShadow:
                    "0 12px 26px rgba(0,0,0,0.16), inset 0 1px 0 rgba(255,225,170,0.03)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: "18px",
                    flexWrap: "wrap",
                    marginBottom: "14px",
                  }}
                >
                  <div>
                    <h2
                      style={{
                        fontFamily: "Cinzel, serif",
                        fontSize: "28px",
                        margin: "0 0 8px 0",
                        color: "#e6c27a",
                      }}
                    >
                      {candidatura.nome}
                    </h2>

                    <p
                      style={{
                        margin: "0 0 6px 0",
                        fontSize: "19px",
                        color: "#d7b06c",
                      }}
                    >
                      {candidatura.email}
                    </p>
                  </div>

                  <div
                    style={{
                      border: "1px solid rgba(166,120,61,0.35)",
                      padding: "10px 14px",
                      alignSelf: "flex-start",
                      fontSize: "16px",
                      color:
                        candidatura.estado === "aprovado"
                          ? "#bff1bf"
                          : "#ffb4b4",
                      textTransform: "uppercase",
                      letterSpacing: "1px",
                    }}
                  >
                    {candidatura.estado}
                  </div>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                    gap: "14px",
                    marginBottom: "14px",
                  }}
                >
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
                  <p
                    style={{
                      marginTop: "14px",
                      marginBottom: 0,
                      fontSize: "15px",
                      color: "#caa15a",
                    }}
                  >
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
    <div
      style={{
        border: "1px solid rgba(166, 120, 61, 0.22)",
        background: "rgba(32, 18, 13, 0.45)",
        padding: "14px 16px",
      }}
    >
      <p
        style={{
          margin: "0 0 6px 0",
          fontSize: "15px",
          textTransform: "uppercase",
          letterSpacing: "1px",
          color: "#caa15a",
        }}
      >
        {label}
      </p>

      <p
        style={{
          margin: 0,
          fontSize: "18px",
          lineHeight: "1.55",
          color: "#d7b06c",
          whiteSpace: "pre-line",
        }}
      >
        {value}
      </p>
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
    <div
      style={{
        border: "1px solid rgba(166, 120, 61, 0.22)",
        background: "rgba(32, 18, 13, 0.45)",
        padding: "16px 18px",
      }}
    >
      <p
        style={{
          margin: "0 0 8px 0",
          fontSize: "16px",
          textTransform: "uppercase",
          letterSpacing: "1px",
          color: "#caa15a",
        }}
      >
        {label}
      </p>

      <p
        style={{
          margin: 0,
          fontSize: "20px",
          lineHeight: "1.7",
          color: "#d7b06c",
          whiteSpace: "pre-line",
        }}
      >
        {value}
      </p>
    </div>
  );
}

const botaoTopo: React.CSSProperties = {
  textDecoration: "none",
  border: "1px solid #a6783d",
  color: "#e6c27a",
  padding: "12px 18px",
  fontSize: "16px",
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  background: "rgba(32, 18, 13, 0.55)",
};