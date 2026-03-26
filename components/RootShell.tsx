"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function RootShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const esconderHeaderFooter =
    pathname.startsWith("/admin") || pathname === "/admin-login";

  if (esconderHeaderFooter) {
    return <>{children}</>;
  }

  return (
    <>
      <header className="site-header">
        <nav className="main-nav" aria-label="Navegação principal">
          <Link href="/" className="nav-button">
            Home
          </Link>

          <Link href="/sobre-nos" className="nav-button">
            Sobre Nós
          </Link>

          <Link href="/cursos" className="nav-button">
            Cursos
          </Link>

          <Link href="/publicidade-e-parceiros" className="nav-button">
            Publicidade e Parceiros
          </Link>

          <Link href="/tornar-me-formador" className="nav-button">
            Torna-te Formador
          </Link>

          <Link href="/aluno" className="nav-button">
            Área do Aluno
          </Link>

          <Link href="/formadores/login" className="nav-button">
            Área do Formador
          </Link>
        </nav>
      </header>

      {children}

      <footer className="site-footer">
        <div className="footer-inner">
          <div className="footer-line" />
          <div className="footer-text">
            © 2026 Regnum Noctis • Powered by{" "}
            <a
              href="https://www.noctissystems.pt"
              target="_blank"
              rel="noreferrer"
              className="footer-link"
            >
              Noctis Systems
            </a>
          </div>
          <div className="footer-line" />
        </div>

        <div className="footer-links-legal">
          <a
            href="https://www.livroreclamacoes.pt/inicio/reclamacao"
            target="_blank"
            rel="noreferrer"
            className="footer-legal-link"
          >
            Livro de Reclamações
          </a>

          <a
            href="https://www.consumidor.gov.pt/ral-mapa-e-lista-de-entidades"
            target="_blank"
            rel="noreferrer"
            className="footer-legal-link"
          >
            Resolução de Litígios
          </a>

          <Link href="/privacidade" className="footer-legal-link">
            Política de Privacidade
          </Link>

          <Link href="/cookies" className="footer-legal-link">
            Política de Cookies
          </Link>

          <Link href="/termos" className="footer-legal-link">
            Termos e Condições
          </Link>

          <Link href="/publicidade" className="footer-legal-link">
            Publicidade e Parceiros
          </Link>
        </div>
      </footer>
    </>
  );
}