"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const menuItems = [
    { href: "/admin", label: "Dashboard" },
    { href: "/admin/cursos", label: "Cursos" },
    { href: "/admin/candidaturas-formador", label: "Candidaturas" },
    { href: "/admin/formadores", label: "Formadores" },
    { href: "/admin/alunos", label: "Alunos" },
    { href: "/admin/inscricoes", label: "Inscrições" },
    { href: "/admin/publicidade", label: "Publicidade" },
    { href: "/admin/vendas", label: "Vendas" },
    { href: "/admin/levantamentos", label: "Levantamentos" },
  ];

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        background:
          "radial-gradient(circle at top, rgba(128,72,38,0.14) 0%, rgba(43,22,15,1) 30%, rgba(18,10,8,1) 100%)",
        color: "#e6c27a",
        fontFamily: "Cormorant Garamond, serif",
      }}
    >
      <aside
        style={{
          width: "255px",
          minWidth: "255px",
          borderRight: "1px solid rgba(166, 120, 61, 0.55)",
          padding: "22px 14px",
          background:
            "linear-gradient(180deg, rgba(20,13,9,0.98) 0%, rgba(14,9,7,0.98) 100%)",
          boxShadow: "inset -1px 0 0 rgba(255,225,170,0.04)",
          position: "sticky",
          top: 0,
          height: "100vh",
          overflowY: "auto",
        }}
      >
        <div
          style={{
            marginBottom: "22px",
            paddingBottom: "18px",
            borderBottom: "1px solid rgba(166, 120, 61, 0.35)",
          }}
        >
          <p
            style={{
              margin: "0 0 6px 0",
              textTransform: "uppercase",
              letterSpacing: "0.14em",
              fontSize: "13px",
              color: "#caa15a",
            }}
          >
            Regnum Noctis
          </p>

          <h2
            style={{
              fontFamily: "Cinzel, serif",
              fontSize: "26px",
              lineHeight: 1.15,
              margin: 0,
              color: "#f0d79a",
              fontWeight: 500,
            }}
          >
            Administração
          </h2>

          <p
            style={{
              margin: "10px 0 0 0",
              fontSize: "16px",
              lineHeight: 1.55,
              color: "#d8b36f",
            }}
          >
            Gestão central da plataforma, finanças, formadores, alunos,
            inscrições, publicidade, candidaturas e vendas.
          </p>
        </div>

        <nav
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "9px",
          }}
        >
          {menuItems.map((item) => {
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  textDecoration: "none",
                  color: isActive ? "#140d09" : "#e6c27a",
                  border: `1px solid ${
                    isActive ? "#c4914d" : "rgba(166, 120, 61, 0.65)"
                  }`,
                  background: isActive
                    ? "linear-gradient(180deg, #c4914d 0%, #a6783d 100%)"
                    : "linear-gradient(180deg, rgba(34,20,15,0.88) 0%, rgba(20,13,9,0.88) 100%)",
                  padding: "10px 12px",
                  display: "block",
                  fontSize: "18px",
                  lineHeight: 1.15,
                  boxShadow: isActive
                    ? "0 0 14px rgba(230, 194, 122, 0.12)"
                    : "0 4px 14px rgba(0,0,0,0.14)",
                  transition: "all 0.22s ease",
                }}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div
          style={{
            marginTop: "24px",
            paddingTop: "18px",
            borderTop: "1px solid rgba(166, 120, 61, 0.35)",
            display: "grid",
            gap: "10px",
          }}
        >
          <Link
            href="/"
            style={{
              textDecoration: "none",
              color: "#caa15a",
              fontSize: "16px",
            }}
          >
            Voltar ao site
          </Link>

          <Link
            href="/admin-login"
            style={{
              textDecoration: "none",
              color: "#caa15a",
              fontSize: "16px",
            }}
          >
            Área de login admin
          </Link>
        </div>
      </aside>

      <section
        style={{
          flex: 1,
          padding: "36px 34px 44px",
        }}
      >
        {children}
      </section>
    </main>
  );
}