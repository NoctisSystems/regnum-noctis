"use client";

import Link from "next/link";

export default function AdminDashboard() {
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
          value="0"
          subtitle="Cursos registados na plataforma"
          href="/admin/cursos"
        />

        <DashboardCard
          title="Candidaturas"
          value="0"
          subtitle="Candidaturas de formadores pendentes"
          href="/admin/candidaturas-formador"
        />

        <DashboardCard
          title="Formadores"
          value="0"
          subtitle="Perfis de formadores aprovados"
          href="/admin/formadores"
        />

        <DashboardCard
          title="Alunos"
          value="0"
          subtitle="Contas de alunos registadas"
          href="/admin/alunos"
        />

        <DashboardCard
          title="Vendas"
          value="0 €"
          subtitle="Total atual de vendas registadas"
          href="/admin/vendas"
        />

        <DashboardCard
          title="Levantamentos"
          value="0"
          subtitle="Pedidos de levantamento em análise"
          href="/admin/levantamentos"
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
            }}
          >
            Actividade recente
          </h2>

          <div
            style={{
              border: "1px dashed rgba(166, 120, 61, 0.4)",
              padding: "24px",
              background: "rgba(38, 20, 15, 0.35)",
            }}
          >
            <p
              style={{
                margin: 0,
                fontSize: "23px",
                lineHeight: 1.65,
                color: "#dfbe81",
              }}
            >
              Ainda não existem actividades registadas. Quando houver novas
              candidaturas, vendas, aprovações ou alterações relevantes, esta
              área passará a mostrar o histórico recente da administração.
            </p>
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
              href="/admin/vendas"
              label="Aceder ao resumo de vendas"
            />
          </div>
        </article>
      </section>
    </>
  );
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