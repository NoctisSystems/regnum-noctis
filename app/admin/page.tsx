"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type AdminResumoFinanceiro = {
  total_vendido: number | null;
  total_comissoes_plataforma: number | null;
  total_liquido_formadores: number | null;
  total_pendente_formadores: number | null;
  total_disponivel_formadores: number | null;
  total_pago_formadores: number | null;
  total_taxas_stripe?: number | null;
  total_recebido_liquido?: number | null;
  total_afiliados_bruto?: number | null;
  total_taxa_plataforma_afiliados?: number | null;
  total_afiliados_liquido?: number | null;
};

type DashboardContagens = {
  totalCursos: number;
  totalCandidaturasPendentes: number;
  totalFormadores: number;
  totalAlunos: number;
  totalInscricoes: number;
  totalLevantamentosPendentes: number;
  totalPublicidade: number;
  totalPublicidadeHome: number;
  totalPublicidadeCandidaturas: number;
  totalPublicidadeCandidaturasPendentes: number;
};

const resumoFinanceiroVazio: AdminResumoFinanceiro = {
  total_vendido: 0,
  total_comissoes_plataforma: 0,
  total_liquido_formadores: 0,
  total_pendente_formadores: 0,
  total_disponivel_formadores: 0,
  total_pago_formadores: 0,
  total_taxas_stripe: 0,
  total_recebido_liquido: 0,
  total_afiliados_bruto: 0,
  total_taxa_plataforma_afiliados: 0,
  total_afiliados_liquido: 0,
};

const contagensVazias: DashboardContagens = {
  totalCursos: 0,
  totalCandidaturasPendentes: 0,
  totalFormadores: 0,
  totalAlunos: 0,
  totalInscricoes: 0,
  totalLevantamentosPendentes: 0,
  totalPublicidade: 0,
  totalPublicidadeHome: 0,
  totalPublicidadeCandidaturas: 0,
  totalPublicidadeCandidaturasPendentes: 0,
};

const menuAdmin = [
  { href: "/admin/cursos", label: "Cursos" },
  { href: "/admin/candidaturas-formador", label: "Candidaturas" },
  { href: "/admin/formadores", label: "Formadores" },
  { href: "/admin/alunos", label: "Alunos" },
  { href: "/admin/inscricoes", label: "Inscrições" },
  { href: "/admin/publicidade", label: "Publicidade" },
  { href: "/admin/publicidade-candidaturas", label: "Pedidos publicidade" },
  { href: "/admin/vendas", label: "Vendas" },
  { href: "/admin/levantamentos", label: "Levantamentos" },
  { href: "/admin/tickets", label: "Tickets" },
  { href: "/admin/chat-formadores", label: "Chat formadores" },
];

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [avisoFinanceiro, setAvisoFinanceiro] = useState("");
  const [contagens, setContagens] = useState<DashboardContagens>(contagensVazias);
  const [financeiro, setFinanceiro] =
    useState<AdminResumoFinanceiro>(resumoFinanceiroVazio);
  const [aAtualizarResumo, setAAtualizarResumo] = useState(false);
  const [ultimaAtualizacaoResumo, setUltimaAtualizacaoResumo] = useState<Date | null>(
    null
  );

  const carregarResumoFinanceiro = useCallback(async () => {
    try {
      setAAtualizarResumo(true);
      setAvisoFinanceiro("");

      const { data, error } = await supabase
        .from("admin_resumo_financeiro")
        .select("*")
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error("Erro ao carregar admin_resumo_financeiro:", error);
        setFinanceiro(resumoFinanceiroVazio);
        setAvisoFinanceiro(
          `Resumo financeiro temporariamente indisponível: ${error.message}`
        );
        return;
      }

      setFinanceiro((data as AdminResumoFinanceiro | null) || resumoFinanceiroVazio);
      setUltimaAtualizacaoResumo(new Date());
    } catch (err: any) {
      console.error(err);
      setFinanceiro(resumoFinanceiroVazio);
      setAvisoFinanceiro(
        err?.message || "Resumo financeiro temporariamente indisponível."
      );
    } finally {
      setAAtualizarResumo(false);
    }
  }, []);

  const carregarContagens = useCallback(async () => {
    const [
      cursosRes,
      candidaturasRes,
      formadoresRes,
      alunosRes,
      inscricoesRes,
      levantamentosRes,
      publicidadeRes,
      publicidadeHomeRes,
      publicidadeCandidaturasRes,
      publicidadeCandidaturasPendentesRes,
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

      supabase
        .from("publicidade_parceiros")
        .select("id", { count: "exact", head: true }),

      supabase
        .from("publicidade_parceiros")
        .select("id", { count: "exact", head: true })
        .eq("mostrar_na_home", true)
        .eq("ativo", true),

      supabase
        .from("publicidade_candidaturas")
        .select("id", { count: "exact", head: true }),

      supabase
        .from("publicidade_candidaturas")
        .select("id", { count: "exact", head: true })
        .eq("estado", "pendente"),
    ]);

    if (cursosRes.error) throw cursosRes.error;
    if (candidaturasRes.error) throw candidaturasRes.error;
    if (formadoresRes.error) throw formadoresRes.error;
    if (alunosRes.error) throw alunosRes.error;
    if (inscricoesRes.error) throw inscricoesRes.error;
    if (levantamentosRes.error) throw levantamentosRes.error;
    if (publicidadeRes.error) throw publicidadeRes.error;
    if (publicidadeHomeRes.error) throw publicidadeHomeRes.error;
    if (publicidadeCandidaturasRes.error) throw publicidadeCandidaturasRes.error;
    if (publicidadeCandidaturasPendentesRes.error) {
      throw publicidadeCandidaturasPendentesRes.error;
    }

    setContagens({
      totalCursos: cursosRes.count || 0,
      totalCandidaturasPendentes: candidaturasRes.count || 0,
      totalFormadores: formadoresRes.count || 0,
      totalAlunos: alunosRes.count || 0,
      totalInscricoes: inscricoesRes.count || 0,
      totalLevantamentosPendentes: levantamentosRes.count || 0,
      totalPublicidade: publicidadeRes.count || 0,
      totalPublicidadeHome: publicidadeHomeRes.count || 0,
      totalPublicidadeCandidaturas: publicidadeCandidaturasRes.count || 0,
      totalPublicidadeCandidaturasPendentes:
        publicidadeCandidaturasPendentesRes.count || 0,
    });
  }, []);

  const carregarDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setErro("");

      await Promise.all([carregarContagens(), carregarResumoFinanceiro()]);
    } catch (err: any) {
      setErro(
        err?.message || "Ocorreu um erro ao carregar a dashboard da administração."
      );
    } finally {
      setLoading(false);
    }
  }, [carregarContagens, carregarResumoFinanceiro]);

  useEffect(() => {
    carregarDashboard();
  }, [carregarDashboard]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      carregarResumoFinanceiro();
    }, 60000);

    return () => window.clearInterval(interval);
  }, [carregarResumoFinanceiro]);

  const totalVendas = Number(financeiro.total_vendido || 0);
  const totalComissoes = Number(financeiro.total_comissoes_plataforma || 0);
  const totalLiquidoFormadores = Number(financeiro.total_liquido_formadores || 0);
  const totalPendenteFormadores = Number(
    financeiro.total_pendente_formadores || 0
  );
  const totalDisponivelFormadores = Number(
    financeiro.total_disponivel_formadores || 0
  );
  const totalPagoFormadores = Number(financeiro.total_pago_formadores || 0);
  const totalTaxasStripe = Number(financeiro.total_taxas_stripe || 0);
  const totalRecebidoLiquido = Number(financeiro.total_recebido_liquido || 0);
  const totalAfiliadosBruto = Number(financeiro.total_afiliados_bruto || 0);
  const totalTaxaPlataformaAfiliados = Number(
    financeiro.total_taxa_plataforma_afiliados || 0
  );
  const totalAfiliadosLiquido = Number(financeiro.total_afiliados_liquido || 0);

  const textoUltimaAtualizacao = useMemo(() => {
    if (!ultimaAtualizacaoResumo) return "Ainda sem atualização registada.";

    return `Última atualização: ${ultimaAtualizacaoResumo.toLocaleTimeString(
      "pt-PT"
    )}`;
  }, [ultimaAtualizacaoResumo]);

  return (
    <>
      <section className="admin-top-nav-card fade-in-up">
        <div className="admin-top-nav-grid">
          {menuAdmin.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`admin-top-nav-link ${
                item.href === "/admin" ? "active" : ""
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </section>

      {erro ? (
        <ErrorBox texto={erro} />
      ) : (
        <>
          {avisoFinanceiro ? <WarningBox texto={avisoFinanceiro} /> : null}

          <section className="admin-summary-panel fade-in-up fade-delay-1">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: "16px",
                alignItems: "flex-end",
                flexWrap: "wrap",
                marginBottom: "18px",
              }}
            >
              <div>
                <h2 className="admin-summary-title" style={{ marginBottom: "8px" }}>
                  Resumo financeiro
                </h2>

                <p
                  style={{
                    margin: 0,
                    color: "#caa15a",
                    fontSize: "15px",
                    lineHeight: 1.6,
                  }}
                >
                  Atualização automática a cada 60 segundos.
                </p>
              </div>

              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  alignItems: "center",
                  flexWrap: "wrap",
                }}
              >
                <span
                  style={{
                    color: "#caa15a",
                    fontSize: "14px",
                  }}
                >
                  {aAtualizarResumo ? "A atualizar resumo..." : textoUltimaAtualizacao}
                </span>

                <button
                  type="button"
                  onClick={carregarDashboard}
                  style={{
                    border: "1px solid rgba(166,120,61,0.6)",
                    background: "rgba(32,18,13,0.55)",
                    color: "#e6c27a",
                    padding: "10px 14px",
                    cursor: loading ? "not-allowed" : "pointer",
                    fontSize: "15px",
                    opacity: loading ? 0.7 : 1,
                  }}
                  disabled={loading}
                >
                  Atualizar dashboard
                </button>
              </div>
            </div>

            <div className="admin-summary-grid">
              <ResumoLinha
                label="Total vendido"
                value={formatarEuro(totalVendas)}
              />
              <ResumoLinha
                label="Taxas Stripe"
                value={formatarEuro(totalTaxasStripe)}
              />
              <ResumoLinha
                label="Total recebido líquido"
                value={formatarEuro(totalRecebidoLiquido)}
              />
              <ResumoLinha
                label="Comissão líquida da plataforma"
                value={formatarEuro(totalComissoes)}
              />
              <ResumoLinha
                label="Líquido para formadores"
                value={formatarEuro(totalLiquidoFormadores)}
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
              <ResumoLinha
                label="Afiliados bruto"
                value={formatarEuro(totalAfiliadosBruto)}
              />
              <ResumoLinha
                label="Taxa plataforma afiliados"
                value={formatarEuro(totalTaxaPlataformaAfiliados)}
              />
              <ResumoLinha
                label="Afiliados líquido"
                value={formatarEuro(totalAfiliadosLiquido)}
              />
            </div>
          </section>

          <section className="admin-dashboard-grid fade-in-up fade-delay-2">
            <DashboardCard
              title="Cursos"
              value={loading ? "..." : String(contagens.totalCursos)}
              subtitle="Cursos registados na plataforma"
              href="/admin/cursos"
            />

            <DashboardCard
              title="Candidaturas"
              value={loading ? "..." : String(contagens.totalCandidaturasPendentes)}
              subtitle="Candidaturas de formadores pendentes"
              href="/admin/candidaturas-formador"
            />

            <DashboardCard
              title="Formadores"
              value={loading ? "..." : String(contagens.totalFormadores)}
              subtitle="Perfis de formadores aprovados"
              href="/admin/formadores"
            />

            <DashboardCard
              title="Alunos"
              value={loading ? "..." : String(contagens.totalAlunos)}
              subtitle="Contas de alunos registadas"
              href="/admin/alunos"
            />

            <DashboardCard
              title="Inscrições"
              value={loading ? "..." : String(contagens.totalInscricoes)}
              subtitle="Relações ativas e históricas entre alunos e cursos"
              href="/admin/inscricoes"
            />

            <DashboardCard
              title="Publicidade"
              value={loading ? "..." : String(contagens.totalPublicidade)}
              subtitle={`Total de anúncios e parceiros. Home ativa: ${contagens.totalPublicidadeHome}`}
              href="/admin/publicidade"
            />

            <DashboardCard
              title="Pedidos publicidade"
              value={
                loading ? "..." : String(contagens.totalPublicidadeCandidaturasPendentes)
              }
              subtitle={`Total recebidos: ${contagens.totalPublicidadeCandidaturas}`}
              href="/admin/publicidade-candidaturas"
            />

            <DashboardCard
              title="Vendas"
              value={loading ? "..." : formatarEuro(totalVendas)}
              subtitle="Total bruto de vendas registadas"
              href="/admin/vendas"
            />

            <DashboardCard
              title="Levantamentos"
              value={loading ? "..." : String(contagens.totalLevantamentosPendentes)}
              subtitle="Pedidos de levantamento em análise"
              href="/admin/levantamentos"
            />
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
    <Link href={href} className="admin-card-link">
      <h3 className="admin-card-title">{title}</h3>
      <p className="admin-card-value">{value}</p>
      <p className="admin-card-subtitle">{subtitle}</p>
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
    <div className="admin-summary-item">
      <p className="admin-summary-label">{label}</p>
      <p className="admin-summary-value">{value}</p>
    </div>
  );
}

function ErrorBox({ texto }: { texto: string }) {
  return <section className="admin-error-box fade-in-up">{texto}</section>;
}

function WarningBox({ texto }: { texto: string }) {
  return <section className="admin-warning-box fade-in-up">{texto}</section>;
}