import "./globals.css";

export const metadata = {
  title: "Regnum Noctis — Onde o Conhecimento se Torna Poder",
  description:
    "Plataforma de formação espiritual avançada. Tarot, oráculos e conhecimento oculto com profundidade e estrutura.",
  icons: {
    icon: "/favicon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-PT">
      <body>
        <header className="site-header">
          <nav className="main-nav" aria-label="Navegação principal">
            <a href="/" className="nav-button">
              Home
            </a>

            <a href="/sobre-nos" className="nav-button">
              Sobre Nós
            </a>

            <a href="/cursos" className="nav-button">
              Cursos
            </a>

            <a href="/publicidade-e-parceiros" className="nav-button">
              Publicidade e Parceiros
            </a>

            <a href="/tornar-me-formador" className="nav-button">
              Torna-te Formador
            </a>

            <a href="/aluno" className="nav-button">
              Área do Aluno
            </a>

            <a href="/formadores/login" className="nav-button">
              Área do Formador
            </a>
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

            <a href="/privacidade" className="footer-legal-link">
              Política de Privacidade
            </a>

            <a href="/cookies" className="footer-legal-link">
              Política de Cookies
            </a>

            <a href="/termos" className="footer-legal-link">
              Termos e Condições
            </a>

            <a href="/publicidade" className="footer-legal-link">
              Publicidade e Parceiros
            </a>
          </div>
        </footer>
      </body>
    </html>
  );
}