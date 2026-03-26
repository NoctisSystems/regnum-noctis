"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type AdminResumoFinanceiro = {
  total_vendido: number | null;
  total_comissoes_plataforma: number | null;
  total_liquido_formadores: number | null;
  total_pendente_formadores: number | null;
  total_disponivel_formadores: number | null;
  total_pago_formadores: number | null;
};

const resumoFinanceiroVazio: AdminResumoFinanceiro = {
  total_vendido: 0,
  total_comissoes_plataforma: 0,
  total_liquido_formadores: 0,
  total_pendente_formadores: 0,
  total_disponivel_formadores: 0,
  total_pago_formadores: 0,
};

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [avisoFinanceiro, setAvisoFinanceiro] = useState("");

  const [totalCursos, setTotalCursos] = useState(0);
  const [totalCandidaturasPendentes, setTotalCandidaturasPendentes] = useState(0);
  const [totalFormadores, setTotalFormadores] = useState(0);
  const [totalAlunos, setTotalAlunos] = useState(0);
  const [totalInscricoes, setTotalInscricoes] = useState(0);
  const [totalLevantamentosPendentes, setTotalLevantamentosPendentes] = useState(0);

  const [financeiro, setFinanceiro] =
    useState<AdminResumoFinanceiro>(resumoFinanceiroVazio);

  useEffect(() => {
    carregarDashboard();
  }, []);

  async function carregarDashboard() {
    setLoading(true);
    setErro("");
    setAvisoFinanceiro("");

    try {
      const [
        cursosRes,
        candidaturasRes,
        formadoresRes,
        alunosRes,
        inscricoesRes,
        levantamentosRes,
      ] = await Promise.all([
        supabase.from("cursos").select("id", { count: "exact", head: true }),
        supabase
          .from("formador_candidaturas")
          .select("id", { count: "exact", head: true })
          .eq("estado", "pendente"),
        supabase
          .from("formadores")
          .select("id", { count: "exact", head: true })
          .eq("status", "aprovado"),
        supabase.from("alunos").select("id", { count: "exact", head: true }),
        supabase.from("inscricoes").select("id", { count: "exact", head: true }),
        supabase
          .from("levantamentos_formador")
          .select("id", { count: "exact", head: true })
          .in("estado", ["aguarda_fatura", "fatura_enviada", "validado_admin"]),
      ]);

      if (cursosRes.error) throw cursosRes.error;
      if (candidaturasRes.error) throw candidaturasRes.error;
      if (formadoresRes.error) throw formadoresRes.error;
      if (alunosRes.error) throw alunosRes.error;
      if (inscricoesRes.error) throw inscricoesRes.error;
      if (levantamentosRes.error) throw levantamentosRes.error;

      setTotalCursos(cursosRes.count || 0);
      setTotalCandidaturasPendentes(candidaturasRes.count || 0);
      setTotalFormadores(formadoresRes.count || 0);
      setTotalAlunos(alunosRes.count || 0);
      setTotalInscricoes(inscricoesRes.count || 0);
      setTotalLevantamentosPendentes(levantamentosRes.count || 0);

      const financeiroRes = await supabase
        .from("admin_resumo_financeiro")
        .select("*")
        .limit(1)
        .maybeSingle();

      if (financeiroRes.error) {
        console.error("Erro ao carregar admin_resumo_financeiro:", financeiroRes.error);
        setFinanceiro(resumoFinanceiroVazio);
        setAvisoFinanceiro(
          `Resumo financeiro temporariamente indisponível: ${financeiroRes.error.message}`
        );
      } else {
        setFinanceiro(financeiroRes.data || resumoFinanceiroVazio);
      }
    } catch (err: any) {
      setErro(
        err?.message || "Ocorreu um erro ao carregar a dashboard da administração."
      );
    } finally {
      setLoading(false);
    }
  }

  const totalVendas = Number(financeiro?.total_vendido || 0);
  const totalComissoes = Number(financeiro?.total_comissoes_plataforma || 0);
  const totalPendenteFormadores = Number(
    financeiro?.total_pendente_formadores || 0
  );
  const totalDisponivelFormadores = Number(
    financeiro?.total_disponivel_formadores || 0
  );
  const totalPagoFormadores = Number(financeiro?.total_pago_formadores || 0);

  return (
    <>
      <section
        style={{
          marginBottom: "34px",
          paddingBottom: "24px",
          borderBottom: "1px solid rgba(166, 120, 61, 0.4)",
        }}
      >
        <p
          style={{
            margin: "0 0 10px 0",
            textTransform: "uppercase",
            letterSpacing: "0.14em",
            fontSize: "16px",
            color: "#caa15a",
          }}
        >
          Painel central
        </p>

        <h1
          style={{
            fontFamily: "Cinzel, serif",
            fontSize: "clamp(40px, 5vw, 58px)",
            lineHeight: 1.08,
            margin: "0 0 16px 0",
            color: "#f0d79a",
            fontWeight: 500,
          }}
        >
          Dashboard da Administração
        </h1>

        <p
          style={{
            maxWidth: "980px",
            margin: 0,
            fontSize: "25px",
            lineHeight: 1.6,
            color: "#dfbe81",
          }}
        >
          Aqui tens a visão geral da plataforma, o acesso rápido às áreas de
          gestão e o controlo administrativo principal do Regnum Noctis.
        </p>
      </section>

      {loading ? (
        <LoadingBox />
      ) : erro ? (
        <ErrorBox texto={erro} />
      ) : (
        <>
          {avisoFinanceiro ? <WarningBox texto={avisoFinanceiro} /> : null}

          <section
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
              gap: "22px",
              marginBottom: "38px",
            }}
          >
            <DashboardCard
              title="Cursos"
              value={String(totalCursos)}
              subtitle="Cursos registados na plataforma"
              href="/admin/cursos"
            />

            <DashboardCard
              title="Candidaturas"
              value={String(totalCandidaturasPendentes)}
              subtitle="Candidaturas de formadores pendentes"
              href="/admin/candidaturas-formador"
            />

            <DashboardCard
              title="Formadores"
              value={String(totalFormadores)}
              subtitle="Perfis de formadores aprovados"
              href="/admin/formadores"
            />

            <DashboardCard
              title="Alunos"
              value={String(totalAlunos)}
              subtitle="Contas de alunos registadas"
              href="/admin/alunos"
            />

            <DashboardCard
              title="Inscrições"
              value={String(totalInscricoes)}
              subtitle="Relações ativas e históricas entre alunos e cursos"
              href="/admin/inscricoes"
            />

            <DashboardCard
              title="Vendas"
              value={formatarEuro(totalVendas)}
              subtitle="Total atual de vendas registadas"
              href="/admin/vendas"
            />

            <DashboardCard
              title="Levantamentos"
              value={String(totalLevantamentosPendentes)}
              subtitle="Pedidos de levantamento em análise"
              href="/admin/levantamentos"
            />
          </section>

          <section
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
              gap: "22px",
              marginBottom: "38px",
            }}
          >
            <DashboardCardStatic
              title="Comissões da plataforma"
              value={formatarEuro(totalComissoes)}
              subtitle="Valor acumulado da comissão administrativa"
            />

            <DashboardCardStatic
              title="Pendente formadores"
              value={formatarEuro(totalPendenteFormadores)}
              subtitle="Saldo ainda dentro do prazo de 14 dias"
            />

            <DashboardCardStatic
              title="Disponível formadores"
              value={formatarEuro(totalDisponivelFormadores)}
              subtitle="Saldo pronto para levantamento"
            />

            <DashboardCardStatic
              title="Pago a formadores"
              value={formatarEuro(totalPagoFormadores)}
              subtitle="Montante já liquidado"
            />
          </section>

          <section
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0, 1.35fr) minmax(320px, 0.9fr)",
              gap: "22px",
            }}
          >
            <article
              style={{
                border: "1px solid rgba(166, 120, 61, 0.7)",
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
                  fontSize: "34px",
                  margin: "0 0 18px 0",
                  color: "#f0d79a",
                  fontWeight: 500,
                }}
              >
                Resumo financeiro
              </h2>

              <div
                style={{
                  display: "grid",
                  gap: "14px",
                }}
              >
                <ResumoLinha
                  label="Total vendido"
                  value={formatarEuro(totalVendas)}
                />
                <ResumoLinha
                  label="Comissões da plataforma"
                  value={formatarEuro(totalComissoes)}
                />
                <ResumoLinha
                  label="Pendente para formadores"
                  value={formatarEuro(totalPendenteFormadores)}
                />
                <ResumoLinha
                  label="Disponível para formadores"
                  value={formatarEuro(totalDisponivelFormadores)}
                />
                <ResumoLinha
                  label="Já pago a formadores"
                  value={formatarEuro(totalPagoFormadores)}
                />
              </div>
            </article>

            <article
              style={{
                border: "1px solid rgba(166, 120, 61, 0.7)",
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
                  fontSize: "34px",
                  margin: "0 0 18px 0",
                  color: "#f0d79a",
                  fontWeight: 500,
                }}
              >
                Acesso rápido
              </h2>

              <div
                style={{
                  display: "grid",
                  gap: "14px",
                }}
              >
                <QuickLink
                  href="/admin/candidaturas-formador"
                  label="Analisar candidaturas de formadores"
                />
                <QuickLink
                  href="/admin/cursos"
                  label="Gerir cursos da plataforma"
                />
                <QuickLink
                  href="/admin/formadores"
                  label="Ver lista de formadores"
                />
                <QuickLink
                  href="/admin/alunos"
                  label="Consultar alunos registados"
                />
                <QuickLink
                  href="/admin/inscricoes"
                  label="Gerir inscrições manuais e estados"
                />
                <QuickLink
                  href="/admin/vendas"
                  label="Aceder ao resumo de vendas"
                />
                <QuickLink
                  href="/admin/levantamentos"
                  label="Gerir pedidos de levantamento"
                />
              </div>
            </article>
          </section>
        </>
      )}
    </>
  );
}

function formatarEuro(valor: number) {
  return new Intl.NumberFormat("pt-PT", {
    style: "currency",
    currency: "EUR",
  }).format(valor || 0);
}

function DashboardCard({
  title,
  value,
  subtitle,
  href,
}: {
  title: string;
  value: string;
  subtitle: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      style={{
        textDecoration: "none",
        border: "1px solid rgba(166, 120, 61, 0.75)",
        padding: "26px 24px",
        background:
          "linear-gradient(145deg, rgba(26,15,10,0.98), rgba(20,13,9,0.98))",
        boxShadow:
          "0 0 24px rgba(166, 120, 61, 0.09), inset 0 1px 0 rgba(255,225,170,0.04)",
        display: "block",
      }}
    >
      <h3
        style={{
          margin: "0 0 14px 0",
          fontSize: "24px",
          color: "#e6c27a",
        }}
      >
        {title}
      </h3>

      <p
        style={{
          margin: "0 0 12px 0",
          fontSize: "44px",
          lineHeight: 1,
          fontFamily: "Cinzel, serif",
          color: "#f0d79a",
        }}
      >
        {value}
      </p>

      <p
        style={{
          margin: 0,
          fontSize: "20px",
          lineHeight: 1.55,
          color: "#d8b36f",
        }}
      >
        {subtitle}
      </p>
    </Link>
  );
}

function DashboardCardStatic({
  title,
  value,
  subtitle,
}: {
  title: string;
  value: string;
  subtitle: string;
}) {
  return (
    <article
      style={{
        border: "1px solid rgba(166, 120, 61, 0.75)",
        padding: "26px 24px",
        background:
          "linear-gradient(145deg, rgba(26,15,10,0.98), rgba(20,13,9,0.98))",
        boxShadow:
          "0 0 24px rgba(166, 120, 61, 0.09), inset 0 1px 0 rgba(255,225,170,0.04)",
      }}
    >
      <h3
        style={{
          margin: "0 0 14px 0",
          fontSize: "24px",
          color: "#e6c27a",
        }}
      >
        {title}
      </h3>

      <p
        style={{
          margin: "0 0 12px 0",
          fontSize: "40px",
          lineHeight: 1,
          fontFamily: "Cinzel, serif",
          color: "#f0d79a",
        }}
      >
        {value}
      </p>

      <p
        style={{
          margin: 0,
          fontSize: "20px",
          lineHeight: 1.55,
          color: "#d8b36f",
        }}
      >
        {subtitle}
      </p>
    </article>
  );
}

function QuickLink({
  href,
  label,
}: {
  href: string;
  label: string;
}) {
  return (
    <Link
      href={href}
      style={{
        textDecoration: "none",
        border: "1px solid rgba(166, 120, 61, 0.65)",
        padding: "14px 16px",
        fontSize: "21px",
        color: "#e6c27a",
        background: "rgba(38, 20, 15, 0.35)",
        display: "block",
      }}
    >
      {label}
    </Link>
  );
}

function ResumoLinha({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div
      style={{
        border: "1px solid rgba(166, 120, 61, 0.35)",
        background: "rgba(38, 20, 15, 0.35)",
        padding: "16px 18px",
      }}
    >
      <p
        style={{
          margin: "0 0 8px 0",
          fontSize: "16px",
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          color: "#caa15a",
        }}
      >
        {label}
      </p>

      <p
        style={{
          margin: 0,
          fontSize: "24px",
          lineHeight: 1.4,
          color: "#f0d79a",
          fontFamily: "Cinzel, serif",
        }}
      >
        {value}
      </p>
    </div>
  );
}

function LoadingBox() {
  return (
    <section
      style={{
        border: "1px solid rgba(166, 120, 61, 0.7)",
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
          fontSize: "34px",
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
          fontSize: "22px",
          lineHeight: 1.7,
          color: "#dfbe81",
        }}
      >
        A plataforma está a reunir dados administrativos, financeiros e operacionais.
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

function WarningBox({ texto }: { texto: string }) {
  return (
    <section
      style={{
        border: "1px solid rgba(230,194,122,0.35)",
        background: "rgba(120,90,20,0.12)",
        padding: "18px 20px",
        color: "#f0d79a",
        fontSize: "18px",
        lineHeight: 1.7,
        marginBottom: "24px",
      }}
    >
      {texto}
    </section>
  );
}