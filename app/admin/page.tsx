import Link from "next/link";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

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

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const supabaseAdmin = getSupabaseAdmin();

  let erro = "";
  let avisoFinanceiro = "";

  let totalCursos = 0;
  let totalCandidaturasPendentes = 0;
  let totalFormadores = 0;
  let totalAlunos = 0;
  let totalInscricoes = 0;
  let totalLevantamentosPendentes = 0;
  let totalPublicidade = 0;
  let totalPublicidadeHome = 0;
  let totalPublicidadeCandidaturas = 0;
  let totalPublicidadeCandidaturasPendentes = 0;
  let financeiro: AdminResumoFinanceiro = resumoFinanceiroVazio;

  try {
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
      financeiroRes,
    ] = await Promise.all([
      supabaseAdmin.from("cursos").select("id", { count: "exact", head: true }),

      supabaseAdmin
        .from("formador_candidaturas")
        .select("id", { count: "exact", head: true })
        .eq("estado", "pendente"),

      supabaseAdmin
        .from("formadores")
        .select("id", { count: "exact", head: true })
        .eq("status", "aprovado"),

      supabaseAdmin.from("alunos").select("id", { count: "exact", head: true }),

      supabaseAdmin
        .from("inscricoes")
        .select("id", { count: "exact", head: true }),

      supabaseAdmin
        .from("levantamentos_formador")
        .select("id", { count: "exact", head: true })
        .in("estado", ["aguarda_fatura", "fatura_enviada", "validado_admin"]),

      supabaseAdmin
        .from("publicidade_parceiros")
        .select("id", { count: "exact", head: true }),

      supabaseAdmin
        .from("publicidade_parceiros")
        .select("id", { count: "exact", head: true })
        .eq("mostrar_na_home", true)
        .eq("ativo", true),

      supabaseAdmin
        .from("publicidade_candidaturas")
        .select("id", { count: "exact", head: true }),

      supabaseAdmin
        .from("publicidade_candidaturas")
        .select("id", { count: "exact", head: true })
        .eq("estado", "pendente"),

      supabaseAdmin
        .from("admin_resumo_financeiro")
        .select("*")
        .limit(1)
        .maybeSingle(),
    ]);

    if (cursosRes.error) throw cursosRes.error;
    if (candidaturasRes.error) throw candidaturasRes.error;
    if (formadoresRes.error) throw formadoresRes.error;
    if (alunosRes.error) throw alunosRes.error;
    if (inscricoesRes.error) throw inscricoesRes.error;
    if (levantamentosRes.error) throw levantamentosRes.error;
    if (publicidadeRes.error) throw publicidadeRes.error;
    if (publicidadeHomeRes.error) throw publicidadeHomeRes.error;
    if (publicidadeCandidaturasRes.error)
      throw publicidadeCandidaturasRes.error;
    if (publicidadeCandidaturasPendentesRes.error)
      throw publicidadeCandidaturasPendentesRes.error;

    totalCursos = cursosRes.count || 0;
    totalCandidaturasPendentes = candidaturasRes.count || 0;
    totalFormadores = formadoresRes.count || 0;
    totalAlunos = alunosRes.count || 0;
    totalInscricoes = inscricoesRes.count || 0;
    totalLevantamentosPendentes = levantamentosRes.count || 0;
    totalPublicidade = publicidadeRes.count || 0;
    totalPublicidadeHome = publicidadeHomeRes.count || 0;
    totalPublicidadeCandidaturas = publicidadeCandidaturasRes.count || 0;
    totalPublicidadeCandidaturasPendentes =
      publicidadeCandidaturasPendentesRes.count || 0;

    if (financeiroRes.error) {
      console.error(
        "Erro ao carregar admin_resumo_financeiro:",
        financeiroRes.error
      );
      financeiro = resumoFinanceiroVazio;
      avisoFinanceiro = `Resumo financeiro temporariamente indisponível: ${financeiroRes.error.message}`;
    } else {
      financeiro =
        (financeiroRes.data as AdminResumoFinanceiro | null) ||
        resumoFinanceiroVazio;
    }
  } catch (err: any) {
    erro =
      err?.message ||
      "Ocorreu um erro ao carregar a dashboard da administração.";
  }

  const totalVendas = Number(financeiro?.total_vendido || 0);
  const totalComissoes = Number(financeiro?.total_comissoes_plataforma || 0);
  const totalLiquidoFormadores = Number(
    financeiro?.total_liquido_formadores || 0
  );
  const totalPendenteFormadores = Number(
    financeiro?.total_pendente_formadores || 0
  );
  const totalDisponivelFormadores = Number(
    financeiro?.total_disponivel_formadores || 0
  );
  const totalPagoFormadores = Number(financeiro?.total_pago_formadores || 0);

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
            <h2 className="admin-summary-title">Resumo financeiro</h2>

            <div className="admin-summary-grid">
              <ResumoLinha
                label="Total vendido"
                value={formatarEuro(totalVendas)}
              />
              <ResumoLinha
                label="Comissões da plataforma"
                value={formatarEuro(totalComissoes)}
              />
              <ResumoLinha
                label="Líquido formadores"
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
            </div>
          </section>

          <section className="admin-dashboard-grid fade-in-up fade-delay-2">
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
              title="Publicidade"
              value={String(totalPublicidade)}
              subtitle={`Total de anúncios e parceiros. Home ativa: ${totalPublicidadeHome}`}
              href="/admin/publicidade"
            />

            <DashboardCard
              title="Pedidos publicidade"
              value={String(totalPublicidadeCandidaturasPendentes)}
              subtitle={`Total recebidos: ${totalPublicidadeCandidaturas}`}
              href="/admin/publicidade-candidaturas"
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