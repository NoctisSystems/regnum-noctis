"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type AlunoRegisto = {
  id: number;
  email: string | null;
  nome: string | null;
  auth_id: string | null;
};

type Inscricao = {
  id: number;
  aluno_id: number;
  curso_id: number;
  status: string | null;
  created_at?: string | null;
  concluido?: boolean | null;
  estado_acesso?: string | null;
  renunciou_14_dias?: boolean | null;
  renuncia_14_dias_em?: string | null;
  prazo_legal_ate?: string | null;
  acesso_integral_liberado_em?: string | null;
};

type Curso = {
  id: number;
  titulo: string | null;
  descricao: string | null;
  preco: number | null;
  capa_url: string | null;
  tipo_produto: string | null;
  publicado: boolean | null;
  tem_certificado: boolean | null;
  created_at?: string | null;
  modo_acesso_14_dias?: string | null;
  dias_prazo_legal?: number | null;
};

type Aula = {
  id: number;
  curso_id: number;
  titulo: string | null;
  video_url: string | null;
  ordem: number | null;
  created_at?: string | null;
  publica?: boolean | null;
  liberada_pre_renuncia?: boolean | null;
  modulo_id?: number | null;
};

type Modulo = {
  id: number;
  curso_id: number;
  titulo: string | null;
  ordem: number | null;
  liberado_pre_renuncia?: boolean | null;
};

type AulaRender = Aula & {
  bloqueada: boolean;
  motivo_bloqueio: string | null;
  moduloTitulo: string | null;
};

export default function AlunoCursoDetalhePage() {
  const router = useRouter();
  const params = useParams<{ cursoId: string }>();

  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [aluno, setAluno] = useState<AlunoRegisto | null>(null);
  const [inscricao, setInscricao] = useState<Inscricao | null>(null);
  const [curso, setCurso] = useState<Curso | null>(null);
  const [aulas, setAulas] = useState<Aula[]>([]);
  const [modulos, setModulos] = useState<Modulo[]>([]);

  const cursoId = Number(params?.cursoId || 0);

  useEffect(() => {
    carregarDados();
  }, [params?.cursoId]);

  async function carregarDados() {
    setLoading(true);
    setErro("");

    try {
      if (!cursoId || Number.isNaN(cursoId)) {
        setErro("Curso inválido.");
        setLoading(false);
        return;
      }

      const {
        data: { user: authUser },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      if (!authUser) {
        router.push("/aluno/login");
        return;
      }

      const { data: alunoData, error: alunoError } = await supabase
        .from("alunos")
        .select("id, email, nome, auth_id")
        .eq("auth_id", authUser.id)
        .maybeSingle();

      if (alunoError) {
        throw alunoError;
      }

      const alunoEncontrado = (alunoData as AlunoRegisto | null) || null;

      if (!alunoEncontrado) {
        setErro("A tua conta ainda não está ligada a um registo de aluno.");
        setLoading(false);
        return;
      }

      setAluno(alunoEncontrado);

      const { data: inscricaoData, error: inscricaoError } = await supabase
        .from("inscricoes")
        .select(
          "id, aluno_id, curso_id, status, created_at, concluido, estado_acesso, renunciou_14_dias, renuncia_14_dias_em, prazo_legal_ate, acesso_integral_liberado_em"
        )
        .eq("aluno_id", alunoEncontrado.id)
        .eq("curso_id", cursoId)
        .maybeSingle();

      if (inscricaoError) {
        throw inscricaoError;
      }

      if (!inscricaoData) {
        setErro("Este curso não está associado à tua conta.");
        setLoading(false);
        return;
      }

      setInscricao(inscricaoData as Inscricao);

      const { data: cursoData, error: cursoError } = await supabase
        .from("cursos")
        .select(
          "id, titulo, descricao, preco, capa_url, tipo_produto, publicado, tem_certificado, created_at, modo_acesso_14_dias, dias_prazo_legal"
        )
        .eq("id", cursoId)
        .maybeSingle();

      if (cursoError) {
        throw cursoError;
      }

      if (!cursoData) {
        setErro("Curso não encontrado.");
        setLoading(false);
        return;
      }

      setCurso(cursoData as Curso);

      const { data: modulosData, error: modulosError } = await supabase
        .from("modulos")
        .select("id, curso_id, titulo, ordem, liberado_pre_renuncia")
        .eq("curso_id", cursoId)
        .order("ordem", { ascending: true });

      if (modulosError) {
        throw modulosError;
      }

      setModulos((modulosData || []) as Modulo[]);

      const { data: aulasData, error: aulasError } = await supabase
        .from("aulas")
        .select(
          "id, curso_id, titulo, video_url, ordem, created_at, publica, liberada_pre_renuncia, modulo_id"
        )
        .eq("curso_id", cursoId)
        .order("ordem", { ascending: true });

      if (aulasError) {
        throw aulasError;
      }

      setAulas((aulasData || []) as Aula[]);
    } catch (error: any) {
      setErro(error?.message || "Não foi possível carregar este curso.");
    } finally {
      setLoading(false);
    }
  }

  const estadoInscricao = useMemo(() => {
    const valor = (inscricao?.status || "").trim().toLowerCase();

    if (valor === "ativo" || valor === "activa") return "Ativo";
    if (valor === "concluido") return "Concluído";
    if (valor === "cancelado") return "Cancelado";
    if (valor === "inativo") return "Inativo";

    return "Sem estado";
  }, [inscricao]);

  const prazoAtivo = useMemo(() => {
    if (!inscricao?.prazo_legal_ate) return false;

    const fim = new Date(inscricao.prazo_legal_ate);
    if (Number.isNaN(fim.getTime())) return false;

    return new Date().getTime() < fim.getTime();
  }, [inscricao]);

  const acessoIntegral = useMemo(() => {
    return (inscricao?.estado_acesso || "").trim().toLowerCase() === "integral";
  }, [inscricao]);

  const modulosMap = useMemo(() => {
    return new Map<number, Modulo>(
      modulos.map((modulo) => [modulo.id, modulo])
    );
  }, [modulos]);

  const aulasRender = useMemo<AulaRender[]>(() => {
    return aulas.map((aula, index) => {
      const modulo = aula.modulo_id ? modulosMap.get(aula.modulo_id) : null;

      let bloqueada = false;
      let motivo_bloqueio: string | null = null;

      if (!acessoIntegral) {
        const aulaPublica = aula.publica === true;
        const aulaPreRenuncia = aula.liberada_pre_renuncia === true;
        const moduloPreRenuncia = modulo?.liberado_pre_renuncia === true;
        const modoCurso = (curso?.modo_acesso_14_dias || "").trim();

        if (aulaPublica) {
          bloqueada = false;
        } else if (modoCurso === "sem_acesso_ate_renuncia") {
          bloqueada = true;
          motivo_bloqueio =
            "Conteúdo bloqueado até renúncia aos 14 dias ou fim do prazo legal.";
        } else if (modoCurso === "acesso_modulo_1") {
          const modulo1Id = modulos[0]?.id || null;
          const estaNoModulo1 =
            modulo1Id !== null ? aula.modulo_id === modulo1Id : index === 0;

          bloqueada = !estaNoModulo1;

          if (bloqueada) {
            motivo_bloqueio =
              "Esta aula só fica disponível após renúncia aos 14 dias ou fim do prazo legal.";
          }
        } else if (modoCurso === "acesso_conteudo_marcado") {
          bloqueada = !(aulaPreRenuncia || moduloPreRenuncia);

          if (bloqueada) {
            motivo_bloqueio =
              "Esta aula não foi marcada para acesso antes da renúncia aos 14 dias.";
          }
        } else {
          bloqueada = true;
          motivo_bloqueio =
            "Conteúdo bloqueado até renúncia aos 14 dias ou fim do prazo legal.";
        }
      }

      return {
        ...aula,
        bloqueada,
        motivo_bloqueio,
        moduloTitulo: modulo?.titulo || null,
      };
    });
  }, [aulas, acessoIntegral, curso, modulos, modulosMap]);

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top, rgba(166,120,61,0.08), transparent 22%), #2b160f",
        color: "#e6c27a",
        fontFamily: "Cormorant Garamond, serif",
        padding: "40px 16px 90px",
      }}
    >
      <section
        style={{
          maxWidth: "1240px",
          margin: "0 auto",
          display: "grid",
          gap: "24px",
        }}
      >
        {loading ? (
          <EstadoBox texto="A carregar curso..." />
        ) : erro ? (
          <>
            <ErroBox texto={erro} />

            <div style={{ display: "flex", justifyContent: "center" }}>
              <Link href="/aluno/cursos" style={botaoSecundario}>
                Voltar aos meus cursos
              </Link>
            </div>
          </>
        ) : curso ? (
          <>
            <header
              style={{
                display: "grid",
                gap: "18px",
                border: "1px solid #8a5d31",
                background:
                  "linear-gradient(180deg, rgba(20,13,9,0.98) 0%, rgba(16,10,8,0.98) 100%)",
                padding: "24px",
                boxShadow:
                  "0 12px 26px rgba(0,0,0,0.16), inset 0 1px 0 rgba(255,225,170,0.03)",
              }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: curso.capa_url
                    ? "minmax(180px, 260px) minmax(0, 1fr)"
                    : "1fr",
                  gap: "18px",
                  alignItems: "start",
                }}
              >
                {curso.capa_url ? (
                  <div
                    style={{
                      border: "1px solid rgba(166,120,61,0.24)",
                      background: "rgba(20,13,9,0.4)",
                      overflow: "hidden",
                    }}
                  >
                    <img
                      src={curso.capa_url}
                      alt={curso.titulo || "Curso"}
                      style={{
                        width: "100%",
                        aspectRatio: "4 / 3",
                        objectFit: "cover",
                        display: "block",
                      }}
                    />
                  </div>
                ) : null}

                <div style={{ display: "grid", gap: "10px" }}>
                  <p
                    style={{
                      margin: 0,
                      fontSize: "14px",
                      color: "#caa15a",
                      textTransform: "uppercase",
                      letterSpacing: "0.12em",
                    }}
                  >
                    {traduzirTipoProduto(curso.tipo_produto)}
                  </p>

                  <h1
                    style={{
                      margin: 0,
                      fontFamily: "Cinzel, serif",
                      fontSize: "clamp(34px, 5vw, 52px)",
                      color: "#f0d79a",
                      lineHeight: 1.1,
                      fontWeight: 500,
                    }}
                  >
                    {curso.titulo || "Curso sem título"}
                  </h1>

                  <p
                    style={{
                      margin: 0,
                      color: "#d7b06c",
                      fontSize: "clamp(18px, 2.2vw, 21px)",
                      lineHeight: 1.7,
                    }}
                  >
                    {curso.descricao || "Descrição em atualização."}
                  </p>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                      gap: "12px",
                      marginTop: "6px",
                    }}
                  >
                    <MiniInfo label="Estado" value={estadoInscricao} />
                    <MiniInfo
                      label="Acesso"
                      value={acessoIntegral ? "Integral" : "Limitado"}
                    />
                    <MiniInfo
                      label="Certificado"
                      value={curso.tem_certificado ? "Sim" : "Não"}
                    />
                    <MiniInfo label="Aulas" value={String(aulas.length)} />
                  </div>
                </div>
              </div>

              <div
                style={{
                  border: "1px solid rgba(166,120,61,0.18)",
                  background: "rgba(20,13,9,0.35)",
                  padding: "16px",
                }}
              >
                {acessoIntegral ? (
                  <p style={textoLegal}>
                    Tens <strong>acesso integral ativo</strong> a este curso.
                    {inscricao?.renunciou_14_dias
                      ? " A renúncia ao prazo legal foi registada."
                      : " O prazo legal já terminou ou o acesso integral já foi libertado."}
                  </p>
                ) : prazoAtivo ? (
                  <p style={textoLegal}>
                    Estás dentro do <strong>prazo legal de 14 dias</strong>. O
                    acesso integral ainda não está disponível. Neste período,
                    apenas podes ver o conteúdo permitido para pré-renúncia.
                  </p>
                ) : (
                  <p style={textoLegal}>
                    O acesso continua em modo limitado neste momento. Se isto não
                    for esperado, confirma o estado da inscrição na
                    administração.
                  </p>
                )}
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  flexWrap: "wrap",
                  gap: "12px",
                }}
              >
                <Link href="/aluno/cursos" style={botaoSecundario}>
                  Voltar aos meus cursos
                </Link>
              </div>
            </header>

            <section
              style={{
                border: "1px solid #8a5d31",
                background:
                  "linear-gradient(180deg, rgba(20,13,9,0.98) 0%, rgba(16,10,8,0.98) 100%)",
                padding: "24px",
                boxShadow:
                  "0 12px 26px rgba(0,0,0,0.16), inset 0 1px 0 rgba(255,225,170,0.03)",
                display: "grid",
                gap: "18px",
              }}
            >
              <div>
                <p
                  style={{
                    margin: "0 0 8px 0",
                    fontSize: "14px",
                    color: "#caa15a",
                    textTransform: "uppercase",
                    letterSpacing: "0.12em",
                  }}
                >
                  Conteúdo do curso
                </p>

                <h2
                  style={{
                    margin: 0,
                    fontFamily: "Cinzel, serif",
                    fontSize: "clamp(28px, 4vw, 38px)",
                    color: "#f0d79a",
                    fontWeight: 500,
                  }}
                >
                  Aulas disponíveis
                </h2>
              </div>

              {aulasRender.length === 0 ? (
                <EstadoBox texto="Este curso ainda não tem aulas registadas." />
              ) : (
                <div style={{ display: "grid", gap: "14px" }}>
                  {aulasRender.map((aula, index) => (
                    <article
                      key={aula.id}
                      style={{
                        border: `1px solid ${
                          aula.bloqueada
                            ? "rgba(255,107,107,0.20)"
                            : "rgba(166,120,61,0.18)"
                        }`,
                        background: aula.bloqueada
                          ? "rgba(60,20,20,0.18)"
                          : "rgba(20,13,9,0.45)",
                        padding: "18px",
                        display: "grid",
                        gap: "10px",
                        opacity: aula.bloqueada ? 0.78 : 1,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          gap: "12px",
                          flexWrap: "wrap",
                          alignItems: "center",
                        }}
                      >
                        <div>
                          <p
                            style={{
                              margin: "0 0 6px 0",
                              fontSize: "13px",
                              color: "#caa15a",
                              textTransform: "uppercase",
                              letterSpacing: "1px",
                            }}
                          >
                            {aula.moduloTitulo
                              ? `${aula.moduloTitulo} • Aula ${index + 1}`
                              : `Aula ${index + 1}`}
                          </p>

                          <h3
                            style={{
                              margin: 0,
                              fontSize: "24px",
                              lineHeight: 1.3,
                              color: "#f0d79a",
                              fontFamily: "Cinzel, serif",
                              fontWeight: 500,
                            }}
                          >
                            {aula.titulo || "Aula sem título"}
                          </h3>
                        </div>

                        <span
                          style={{
                            border: "1px solid rgba(166,120,61,0.35)",
                            background: "rgba(38,20,15,0.35)",
                            padding: "8px 12px",
                            fontSize: "14px",
                            color: "#e6c27a",
                          }}
                        >
                          {aula.bloqueada ? "Bloqueada" : "Disponível"}
                        </span>
                      </div>

                      {aula.bloqueada ? (
                        <p
                          style={{
                            margin: 0,
                            fontSize: "18px",
                            lineHeight: 1.7,
                            color: "#ffcccc",
                          }}
                        >
                          {aula.motivo_bloqueio}
                        </p>
                      ) : (
                        <p
                          style={{
                            margin: 0,
                            fontSize: "18px",
                            lineHeight: 1.7,
                            color: "#d7b06c",
                          }}
                        >
                          {aula.video_url
                            ? "A aula está desbloqueada e pronta para reprodução quando ligarmos o player interno."
                            : "Esta aula está desbloqueada, mas ainda não tem vídeo associado."}
                        </p>
                      )}
                    </article>
                  ))}
                </div>
              )}
            </section>
          </>
        ) : null}
      </section>
    </main>
  );
}

function traduzirTipoProduto(tipo: string | null) {
  if (tipo === "curso_video") return "Curso em vídeo";
  if (tipo === "pdf_digital") return "PDF digital";
  return "Conteúdo";
}

function MiniInfo({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div
      style={{
        border: "1px solid rgba(166,120,61,0.18)",
        background: "rgba(20,13,9,0.45)",
        padding: "14px 16px",
      }}
    >
      <p
        style={{
          margin: "0 0 8px 0",
          fontSize: "13px",
          color: "#caa15a",
          textTransform: "uppercase",
          letterSpacing: "1px",
        }}
      >
        {label}
      </p>

      <p
        style={{
          margin: 0,
          color: "#e6c27a",
          fontSize: "17px",
          lineHeight: 1.6,
        }}
      >
        {value}
      </p>
    </div>
  );
}

function EstadoBox({ texto }: { texto: string }) {
  return (
    <section
      style={{
        border: "1px solid #8a5d31",
        background:
          "linear-gradient(180deg, rgba(20,13,9,0.98) 0%, rgba(16,10,8,0.98) 100%)",
        padding: "28px",
        textAlign: "center",
        color: "#d7b06c",
        fontSize: "21px",
        lineHeight: 1.7,
      }}
    >
      {texto}
    </section>
  );
}

function ErroBox({ texto }: { texto: string }) {
  return (
    <section
      style={{
        border: "1px solid rgba(255,107,107,0.35)",
        background: "rgba(120,20,20,0.12)",
        padding: "18px 20px",
        color: "#ffb4b4",
        fontSize: "18px",
        lineHeight: 1.7,
      }}
    >
      {texto}
    </section>
  );
}

const botaoSecundario: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  textDecoration: "none",
  border: "1px solid rgba(166,120,61,0.6)",
  color: "#e6c27a",
  padding: "12px 16px",
  fontSize: "15px",
  background: "rgba(32,18,13,0.55)",
  minHeight: "46px",
};

const textoLegal: React.CSSProperties = {
  margin: 0,
  fontSize: "18px",
  lineHeight: 1.75,
  color: "#d7b06c",
};