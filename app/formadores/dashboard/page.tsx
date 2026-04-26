"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type Formador = {
  id: number;
  nome: string | null;
  email: string | null;
  auth_id: string | null;
  status: string | null;
};

type Curso = {
  id: number;
  titulo: string | null;
  publicado: boolean | null;
};

type Inscricao = {
  id: number;
  curso_id: number;
  aluno_id: number;
  concluido: boolean | null;
};

type Comunidade = {
  id: number;
  curso_id: number;
};

type Topico = {
  id: number;
  comunidade_id: number;
  fechado: boolean | null;
};

type ConversaSuporte = {
  id: number;
  estado: string;
};

type TicketFormador = {
  id: number;
  estado: string;
};

type ResumoFinanceiroFormador = {
  saldo_disponivel: number | null;
  saldo_retido: number | null;
  saldo_em_analise: number | null;
  saldo_chargeback: number | null;
  total_pago: number | null;
};

const resumoFinanceiroInicial: ResumoFinanceiroFormador = {
  saldo_disponivel: 0,
  saldo_retido: 0,
  saldo_em_analise: 0,
  saldo_chargeback: 0,
  total_pago: 0,
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizarNumero(valor: unknown) {
  if (typeof valor === "number" && !Number.isNaN(valor)) return valor;

  if (typeof valor === "string") {
    const convertido = Number(valor);
    if (!Number.isNaN(convertido)) return convertido;
  }

  return 0;
}

function formatarEuro(valor: number | null | undefined) {
  return new Intl.NumberFormat("pt-PT", {
    style: "currency",
    currency: "EUR",
  }).format(normalizarNumero(valor));
}

export default function DashboardFormadorPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [inscricoes, setInscricoes] = useState<Inscricao[]>([]);
  const [comunidades, setComunidades] = useState<Comunidade[]>([]);
  const [topicos, setTopicos] = useState<Topico[]>([]);
  const [conversasSuporte, setConversasSuporte] = useState<ConversaSuporte[]>(
    []
  );
  const [ticketsFormador, setTicketsFormador] = useState<TicketFormador[]>([]);
  const [resumoFinanceiro, setResumoFinanceiro] =
    useState<ResumoFinanceiroFormador>(resumoFinanceiroInicial);

  const obterUtilizadorAutenticado = useCallback(async () => {
    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (!userError && userData.user) {
      return userData.user;
    }

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (!sessionError && session?.user) {
      return session.user;
    }

    await sleep(250);

    const { data: userRetryData, error: userRetryError } =
      await supabase.auth.getUser();

    if (!userRetryError && userRetryData.user) {
      return userRetryData.user;
    }

    return null;
  }, []);

  const encontrarFormadorComRecuperacao = useCallback(
    async (userId: string, userEmail: string | null | undefined) => {
      const { data: porAuthId, error: erroPorAuthId } = await supabase
        .from("formadores")
        .select("id, nome, email, auth_id, status")
        .eq("auth_id", userId)
        .maybeSingle();

      if (erroPorAuthId) {
        throw erroPorAuthId;
      }

      if (porAuthId) {
        return porAuthId as Formador;
      }

      if (!userEmail) {
        return null;
      }

      const emailNormalizado = userEmail.trim().toLowerCase();

      const { data: porEmail, error: erroPorEmail } = await supabase
        .from("formadores")
        .select("id, nome, email, auth_id, status")
        .ilike("email", emailNormalizado)
        .maybeSingle();

      if (erroPorEmail) {
        throw erroPorEmail;
      }

      if (!porEmail) {
        return null;
      }

      if (porEmail.auth_id && porEmail.auth_id !== userId) {
        return null;
      }

      if (!porEmail.auth_id) {
        const { error: updateError } = await supabase
          .from("formadores")
          .update({ auth_id: userId })
          .eq("id", porEmail.id);

        if (updateError) {
          throw updateError;
        }

        return {
          ...(porEmail as Formador),
          auth_id: userId,
        };
      }

      return porEmail as Formador;
    },
    []
  );

  const carregarResumoFinanceiro = useCallback(async (formadorId: number) => {
    try {
      const tentativas = [
        supabase
          .from("formadores_resumo_financeiro")
          .select(
            "saldo_disponivel, saldo_retido, saldo_em_analise, saldo_chargeback, total_pago"
          )
          .eq("formador_id", formadorId)
          .maybeSingle(),

        supabase
          .from("formador_resumo_financeiro")
          .select(
            "saldo_disponivel, saldo_retido, saldo_em_analise, saldo_chargeback, total_pago"
          )
          .eq("formador_id", formadorId)
          .maybeSingle(),

        supabase
          .from("vw_formador_resumo_financeiro")
          .select(
            "saldo_disponivel, saldo_retido, saldo_em_analise, saldo_chargeback, total_pago"
          )
          .eq("formador_id", formadorId)
          .maybeSingle(),
      ];

      for (const tentativa of tentativas) {
        const { data, error } = await tentativa;

        if (!error && data) {
          setResumoFinanceiro({
            saldo_disponivel: normalizarNumero(data.saldo_disponivel),
            saldo_retido: normalizarNumero(data.saldo_retido),
            saldo_em_analise: normalizarNumero(data.saldo_em_analise),
            saldo_chargeback: normalizarNumero(data.saldo_chargeback),
            total_pago: normalizarNumero(data.total_pago),
          });
          return;
        }
      }

      setResumoFinanceiro(resumoFinanceiroInicial);
    } catch {
      setResumoFinanceiro(resumoFinanceiroInicial);
    }
  }, []);

  const carregarDados = useCallback(async () => {
    setLoading(true);
    setErro("");

    try {
      const user = await obterUtilizadorAutenticado();

      if (!user) {
        router.replace("/formadores/login");
        return;
      }

      const formadorData = await encontrarFormadorComRecuperacao(
        user.id,
        user.email
      );

      if (!formadorData) {
        setErro(
          "Não foi possível encontrar o registo do formador associado a esta conta."
        );
        setLoading(false);
        return;
      }

      if (formadorData.status !== "aprovado") {
        setErro("A conta de formador ainda não está aprovada.");
        setLoading(false);
        return;
      }

      await carregarResumoFinanceiro(formadorData.id);

      const { data: cursosData, error: cursosError } = await supabase
        .from("cursos")
        .select("id, titulo, publicado")
        .eq("formador_id", formadorData.id)
        .order("id", { ascending: false });

      if (cursosError) {
        setErro(cursosError.message || "Erro ao carregar cursos.");
        setLoading(false);
        return;
      }

      const cursosLista = (cursosData || []) as Curso[];
      setCursos(cursosLista);

      if (cursosLista.length > 0) {
        const cursoIds = cursosLista.map((curso) => curso.id);

        const { data: inscricoesData } = await supabase
          .from("inscricoes")
          .select("id, curso_id, aluno_id, concluido")
          .in("curso_id", cursoIds);

        setInscricoes((inscricoesData || []) as Inscricao[]);

        const { data: comunidadesData } = await supabase
          .from("comunidades")
          .select("id, curso_id")
          .in("curso_id", cursoIds);

        const comunidadesLista = (comunidadesData || []) as Comunidade[];
        setComunidades(comunidadesLista);

        if (comunidadesLista.length > 0) {
          const comunidadeIds = comunidadesLista.map(
            (comunidade) => comunidade.id
          );

          const { data: topicosData } = await supabase
            .from("comunidade_topicos")
            .select("id, comunidade_id, fechado")
            .in("comunidade_id", comunidadeIds);

          setTopicos((topicosData || []) as Topico[]);
        } else {
          setTopicos([]);
        }
      } else {
        setInscricoes([]);
        setComunidades([]);
        setTopicos([]);
      }

      const { data: conversasData, error: conversasError } = await supabase
        .from("chat_admin_formador_conversas")
        .select("id, estado")
        .eq("formador_id", formadorData.id)
        .order("updated_at", { ascending: false });

      if (conversasError) {
        throw conversasError;
      }

      setConversasSuporte((conversasData || []) as ConversaSuporte[]);

      const { data: ticketsData, error: ticketsError } = await supabase
        .from("suporte_tickets")
        .select("id, estado")
        .eq("formador_id", formadorData.id)
        .eq("formador_envolvido", true)
        .order("updated_at", { ascending: false });

      if (ticketsError) {
        throw ticketsError;
      }

      setTicketsFormador((ticketsData || []) as TicketFormador[]);
    } catch (error: unknown) {
      const mensagem =
        error instanceof Error
          ? error.message
          : "Ocorreu um erro inesperado ao carregar a dashboard.";

      setErro(mensagem);
    } finally {
      setLoading(false);
    }
  }, [
    carregarResumoFinanceiro,
    encontrarFormadorComRecuperacao,
    obterUtilizadorAutenticado,
    router,
  ]);

  useEffect(() => {
    void carregarDados();
  }, [carregarDados]);

  const totalCursos = cursos.length;

  const totalAlunos = useMemo(
    () => new Set(inscricoes.map((inscricao) => inscricao.aluno_id)).size,
    [inscricoes]
  );

  const totalComunidades = comunidades.length;

  const totalDuvidasPendentes = topicos.filter((topico) => !topico.fechado)
    .length;

  const totalConversasAbertas = conversasSuporte.filter((item) =>
    ["aberto", "em_analise", "aguarda_formador", "aguarda_admin"].includes(
      item.estado
    )
  ).length;

  const totalTicketsPendentes = ticketsFormador.filter((item) =>
    [
      "aberto",
      "em_analise",
      "aguarda_resposta_formador",
      "aguarda_resposta_admin",
      "aguarda_resposta_aluno",
    ].includes(item.estado)
  ).length;

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top, rgba(166,120,61,0.08), transparent 20%), #2b160f",
        color: "#e6c27a",
        fontFamily: "Cormorant Garamond, serif",
        padding: "50px 16px 90px",
      }}
    >
      <section
        style={{
          maxWidth: "1280px",
          margin: "0 auto",
        }}
      >
        <header style={{ marginBottom: "28px" }}>
          <p
            style={{
              margin: "0 0 10px 0",
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: "#caa15a",
              fontSize: "15px",
            }}
          >
            Área do Formador
          </p>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
              gap: "18px",
              flexWrap: "wrap",
            }}
          >
            <h1
              style={{
                margin: 0,
                fontFamily: "Cinzel, serif",
                fontSize: "clamp(34px, 6vw, 64px)",
                lineHeight: 1.1,
                color: "#f0d79a",
                fontWeight: 500,
              }}
            >
              Dashboard do Formador
            </h1>

            <div
              style={{
                display: "flex",
                gap: "12px",
                flexWrap: "wrap",
                alignItems: "center",
              }}
            >
              <button
                type="button"
                onClick={() => void carregarDados()}
                style={botaoSecundario}
              >
                Atualizar dashboard
              </button>

              <Link href="/formadores/sair" style={botaoSecundario}>
                Sair
              </Link>
            </div>
          </div>
        </header>

        {loading ? (
          <LoadingBox />
        ) : erro ? (
          <ErrorBox texto={erro} />
        ) : (
          <>
            <section
              style={{
                border: "1px solid #8a5d31",
                background:
                  "linear-gradient(180deg, rgba(20,13,9,0.98) 0%, rgba(16,10,8,0.98) 100%)",
                padding: "clamp(20px, 3vw, 30px)",
                boxShadow:
                  "0 18px 42px rgba(0,0,0,0.24), inset 0 1px 0 rgba(255,225,170,0.03)",
                marginBottom: "30px",
              }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                  gap: "18px",
                }}
              >
                <ShortcutCard
                  titulo="Criar curso"
                  descricao="Cria um novo curso e começa a estruturar módulos, aulas e materiais."
                  href="/formadores/criar-curso"
                  textoBotao="Abrir"
                />
                <ShortcutCard
                  titulo="Os meus cursos"
                  descricao="Consulta os teus cursos, entra em cada card e gere a estrutura, conteúdos e publicação."
                  href="/formadores/cursos"
                  textoBotao="Ver cursos"
                />
                <ShortcutCard
                  titulo="Alunos inscritos"
                  descricao="Acompanha quem comprou os teus cursos e consulta o progresso dos alunos."
                  href="/formadores/alunos"
                  textoBotao="Ver alunos"
                />
                <ShortcutCard
                  titulo="Comunidades"
                  descricao="Entra nas comunidades internas dos teus cursos e responde às dúvidas das turmas."
                  href="/formadores/comunidades"
                  textoBotao="Abrir comunidades"
                />
                <ShortcutCard
                  titulo="Guia do formador"
                  descricao="Consulta boas práticas, orientação geral e sugestões para estruturar e valorizar melhor os teus cursos."
                  href="/formadores/guia"
                  textoBotao="Abrir guia"
                />
                <ShortcutCard
                  titulo="Suporte interno"
                  descricao="Fala diretamente com a administração para ausências, problemas técnicos, pagamentos ou apoio operacional."
                  href="/formadores/suporte"
                  textoBotao="Abrir suporte"
                />
                <ShortcutCard
                  titulo="Tickets"
                  descricao="Consulta os tickets em que foste envolvido pela administração para esclarecer o aluno."
                  href="/formadores/tickets"
                  textoBotao="Ver tickets"
                />
                <ShortcutCard
                  titulo="Levantamentos"
                  descricao="Consulta saldos, acompanha pedidos enviados e trata do envio de documentação para levantamento."
                  href="/formadores/levantamentos"
                  textoBotao="Abrir levantamentos"
                />
              </div>
            </section>

            <section style={{ marginBottom: "32px" }}>
              <SectionTitle
                titulo="Resumo operacional"
                subtitulo="Visão rápida da atividade do formador"
              />

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                  gap: "18px",
                }}
              >
                <MetricCard
                  titulo="Cursos"
                  valor={String(totalCursos)}
                  subtitulo="Cursos criados"
                />
                <MetricCard
                  titulo="Alunos"
                  valor={String(totalAlunos)}
                  subtitulo="Inscritos ativos"
                />
                <MetricCard
                  titulo="Comunidades"
                  valor={String(totalComunidades)}
                  subtitulo="Por curso"
                />
                <MetricCard
                  titulo="Dúvidas"
                  valor={String(totalDuvidasPendentes)}
                  subtitulo="Tópicos abertos"
                />
                <MetricCard
                  titulo="Suporte"
                  valor={String(totalConversasAbertas)}
                  subtitulo="Conversas abertas"
                />
                <MetricCard
                  titulo="Tickets"
                  valor={String(totalTicketsPendentes)}
                  subtitulo="A aguardar resposta"
                />
              </div>
            </section>

            <section>
              <SectionTitle
                titulo="Resumo financeiro"
                subtitulo="Valores do formador e estado dos saldos"
              />

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                  gap: "18px",
                  marginBottom: "20px",
                }}
              >
                <MoneyCard
                  titulo="Saldo disponível"
                  valor={formatarEuro(resumoFinanceiro.saldo_disponivel)}
                  subtitulo="Pode seguir para levantamento"
                />
                <MoneyCard
                  titulo="Saldo retido"
                  valor={formatarEuro(resumoFinanceiro.saldo_retido)}
                  subtitulo="Valor ainda cativo"
                />
                <MoneyCard
                  titulo="Em análise"
                  valor={formatarEuro(resumoFinanceiro.saldo_em_analise)}
                  subtitulo="Aguarda validação"
                />
                <MoneyCard
                  titulo="Chargeback / bloqueios"
                  valor={formatarEuro(resumoFinanceiro.saldo_chargeback)}
                  subtitulo="Valor sob retenção"
                />
                <MoneyCard
                  titulo="Total já pago"
                  valor={formatarEuro(resumoFinanceiro.total_pago)}
                  subtitulo="Histórico liquidado"
                />
              </div>

              <section
                style={{
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
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: "18px",
                    flexWrap: "wrap",
                  }}
                >
                  <div style={{ maxWidth: "840px" }}>
                    <h2
                      style={{
                        margin: "0 0 10px 0",
                        fontFamily: "Cinzel, serif",
                        fontSize: "clamp(26px, 4vw, 36px)",
                        color: "#f0d79a",
                        fontWeight: 500,
                      }}
                    >
                      Levantamentos e documentação
                    </h2>

                    <p
                      style={{
                        margin: 0,
                        fontSize: "19px",
                        color: "#d7b06c",
                        lineHeight: 1.75,
                      }}
                    >
                      Nenhum valor é libertado sem a documentação exigida pela
                      plataforma. O pedido de levantamento deve seguir com o
                      comprovativo ou fatura correspondente para validação pela
                      administração.
                    </p>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      gap: "12px",
                      flexWrap: "wrap",
                    }}
                  >
                    <Link href="/formadores/levantamentos" style={botao}>
                      Pedir levantamento
                    </Link>

                    <Link
                      href="/formadores/levantamentos"
                      style={botaoSecundario}
                    >
                      Ver histórico
                    </Link>
                  </div>
                </div>
              </section>
            </section>
          </>
        )}
      </section>
    </main>
  );
}

function SectionTitle({
  titulo,
  subtitulo,
}: {
  titulo: string;
  subtitulo: string;
}) {
  return (
    <div style={{ marginBottom: "18px" }}>
      <p
        style={{
          margin: "0 0 8px 0",
          fontSize: "14px",
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: "#caa15a",
        }}
      >
        {subtitulo}
      </p>

      <h2
        style={{
          margin: 0,
          fontFamily: "Cinzel, serif",
          fontSize: "clamp(28px, 4vw, 40px)",
          color: "#f0d79a",
          fontWeight: 500,
        }}
      >
        {titulo}
      </h2>
    </div>
  );
}

function MetricCard({
  titulo,
  valor,
  subtitulo,
}: {
  titulo: string;
  valor: string;
  subtitulo: string;
}) {
  return (
    <article
      style={{
        border: "1px solid #8a5d31",
        background:
          "linear-gradient(180deg, rgba(20,13,9,0.98) 0%, rgba(16,10,8,0.98) 100%)",
        padding: "22px",
        boxShadow:
          "0 12px 26px rgba(0,0,0,0.16), inset 0 1px 0 rgba(255,225,170,0.03)",
      }}
    >
      <p
        style={{
          margin: "0 0 10px 0",
          fontSize: "15px",
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: "#caa15a",
        }}
      >
        {titulo}
      </p>

      <p
        style={{
          margin: "0 0 8px 0",
          fontFamily: "Cinzel, serif",
          fontSize: "44px",
          color: "#f0d79a",
          lineHeight: 1,
        }}
      >
        {valor}
      </p>

      <p
        style={{
          margin: 0,
          fontSize: "19px",
          color: "#d7b06c",
          lineHeight: 1.6,
        }}
      >
        {subtitulo}
      </p>
    </article>
  );
}

function MoneyCard({
  titulo,
  valor,
  subtitulo,
}: {
  titulo: string;
  valor: string;
  subtitulo: string;
}) {
  return (
    <article
      style={{
        border: "1px solid #8a5d31",
        background:
          "linear-gradient(180deg, rgba(20,13,9,0.98) 0%, rgba(16,10,8,0.98) 100%)",
        padding: "22px",
        boxShadow:
          "0 12px 26px rgba(0,0,0,0.16), inset 0 1px 0 rgba(255,225,170,0.03)",
      }}
    >
      <p
        style={{
          margin: "0 0 10px 0",
          fontSize: "15px",
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: "#caa15a",
        }}
      >
        {titulo}
      </p>

      <p
        style={{
          margin: "0 0 8px 0",
          fontFamily: "Cinzel, serif",
          fontSize: "30px",
          color: "#f0d79a",
          lineHeight: 1.2,
          wordBreak: "break-word",
        }}
      >
        {valor}
      </p>

      <p
        style={{
          margin: 0,
          fontSize: "18px",
          color: "#d7b06c",
          lineHeight: 1.6,
        }}
      >
        {subtitulo}
      </p>
    </article>
  );
}

function ShortcutCard({
  titulo,
  descricao,
  href,
  textoBotao,
}: {
  titulo: string;
  descricao: string;
  href: string;
  textoBotao: string;
}) {
  return (
    <article
      style={{
        border: "1px solid rgba(166,120,61,0.22)",
        background: "rgba(32,18,13,0.45)",
        padding: "22px",
        minHeight: "220px",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <h3
        style={{
          margin: "0 0 12px 0",
          fontFamily: "Cinzel, serif",
          fontSize: "clamp(24px, 3vw, 28px)",
          color: "#e6c27a",
          fontWeight: 500,
        }}
      >
        {titulo}
      </h3>

      <p
        style={{
          margin: "0 0 20px 0",
          fontSize: "clamp(18px, 2vw, 20px)",
          color: "#d7b06c",
          lineHeight: 1.7,
          flex: 1,
        }}
      >
        {descricao}
      </p>

      <Link href={href} style={botao}>
        {textoBotao}
      </Link>
    </article>
  );
}

function LoadingBox() {
  return (
    <section
      style={{
        border: "1px solid rgba(166,120,61,0.7)",
        background:
          "linear-gradient(180deg, rgba(15,9,7,0.96) 0%, rgba(28,16,12,0.98) 100%)",
        padding: "30px",
        boxShadow:
          "0 16px 40px rgba(0,0,0,0.26), inset 0 1px 0 rgba(255,225,170,0.04)",
      }}
    >
      <h2
        style={{
          fontFamily: "Cinzel, serif",
          fontSize: "clamp(26px, 4vw, 34px)",
          margin: "0 0 18px 0",
          color: "#f0d79a",
          fontWeight: 500,
        }}
      >
        A carregar dashboard
      </h2>

      <p
        style={{
          margin: 0,
          fontSize: "clamp(18px, 2.2vw, 22px)",
          lineHeight: 1.7,
          color: "#dfbe81",
        }}
      >
        A plataforma está a reunir cursos, alunos, comunidades, suporte e
        resumo financeiro do formador.
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
        padding: "24px",
        color: "#ffb4b4",
        fontSize: "20px",
        lineHeight: 1.7,
      }}
    >
      {texto}
    </section>
  );
}

const botao: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  textDecoration: "none",
  border: "1px solid #a6783d",
  color: "#e6c27a",
  padding: "14px 18px",
  fontSize: "16px",
  background: "transparent",
  textAlign: "center",
};

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
  cursor: "pointer",
  textAlign: "center",
};