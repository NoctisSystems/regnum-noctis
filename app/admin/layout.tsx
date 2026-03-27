"use client";

import type { CSSProperties } from "react";
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
    { href: "/admin/publicidade-candidaturas", label: "Pedidos publicidade" },
    { href: "/admin/vendas", label: "Vendas" },
    { href: "/admin/levantamentos", label: "Levantamentos" },
  ];

  return (
    <main className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-top">
          <p className="admin-sidebar-kicker">Regnum Noctis</p>

          <h2 className="admin-sidebar-title">Administração</h2>

          <p className="admin-sidebar-text">
            Gestão central da plataforma, finanças, formadores, alunos,
            inscrições, publicidade, candidaturas e vendas.
          </p>
        </div>

        <nav className="admin-sidebar-nav">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`admin-sidebar-link ${isActive ? "active" : ""}`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="admin-sidebar-bottom">
          <Link href="/" className="admin-sidebar-secondary-link">
            Voltar ao site
          </Link>

          <Link
            href="/admin-login"
            className="admin-sidebar-secondary-link"
          >
            Área de login admin
          </Link>
        </div>
      </aside>

      <section className="admin-content">{children}</section>
    </main>
  );
}