export default function Home() {
  return (
    <main className="home-page">
      <section className="home-banner">
        <img
          src="/banner-regnum-noctis.png"
          alt="Regnum Noctis"
          className="home-banner-image"
        />
      </section>

      <section className="home-hero">
        <div className="home-container">
          <h1 className="home-title fade-in-up">Regnum Noctis</h1>

          <div
            className="home-ornament fade-in-up fade-delay-1"
            aria-hidden="true"
          >
            <div className="home-ornament-line" />
            <div className="home-ornament-star">✦</div>
            <div className="home-ornament-line" />
          </div>

          <p className="home-lead fade-in-up fade-delay-2">
            Não é sobre aprender mais. É sobre aprender melhor.
          </p>

          <div className="home-divider fade-in-up fade-delay-2" />

          <p className="home-lead fade-in-up fade-delay-3">
            O Regnum Noctis é uma plataforma independente de educação espiritual
            criada para quem procura estrutura, profundidade e prática real —
            sem atalhos vazios, sem superficialidade e sem conteúdo feito apenas
            para consumo rápido.
          </p>

          <div className="home-actions fade-in-up fade-delay-4">
            <a href="/cursos" className="home-action-button">
              Explorar Cursos
            </a>

            <a
              href="https://www.sacraluna.pt"
              target="_blank"
              rel="noreferrer"
              className="home-action-button"
            >
              Consulta com a Alexandra
            </a>

            <a href="/sobre-nos" className="home-action-button">
              A Nossa Visão
            </a>
          </div>
        </div>
      </section>

      <section className="home-section">
        <div className="home-container">
          <article className="home-card home-card-premium fade-in-up">
            <p className="home-card-kicker center-title">
              Para além do superficial
            </p>

            <h2 className="home-section-title center-title">
              Aqui não vendemos ilusões
            </h2>

            <div className="home-card-content">
              <p className="home-text">
                O Regnum Noctis foi criado como resposta à superficialidade
                crescente no ensino espiritual.
              </p>

              <p className="home-text">
                Não seguimos tendências, não simplificamos o que é complexo e não
                ensinamos para consumo rápido.
              </p>

              <p className="home-text">
                Cada curso existe com um propósito claro: transmitir base,
                desenvolver compreensão e permitir aplicação real.
              </p>

              <p className="home-text">
                Os percursos presentes na plataforma são pensados com
                profundidade, continuidade e direção, para quem procura mais do
                que informação solta: procura compreensão, prática e integração
                real.
              </p>

              <p className="home-text">
                Este não é um espaço para acumular informação. É um espaço para
                transformar conhecimento em prática.
              </p>
            </div>
          </article>
        </div>
      </section>

      <section className="home-section">
        <div className="home-container">
          <article className="sacraluna-ad-card fade-in-up fade-delay-1">
            <div className="sacraluna-ad-logo">
              <img src="/logo-sacraluna.png" alt="SacraLuna" />
            </div>

            <div className="sacraluna-ad-content">
              <p className="sacraluna-ad-kicker">
                <a href="/publicidade">Destaque</a>
              </p>

              <h2 className="sacraluna-ad-title">Consulta-te na SacraLuna</h2>

              <p className="sacraluna-ad-text">
                Nova plataforma de atendimento de Tarot, com uma interface mais
                moderna e intuitiva a pensar no cliente. Com excelentes
                consultores disponíveis. Atendimentos 24 horas por dia, 7 dias
                por semana.
              </p>

              <div className="sacraluna-ad-actions">
                <a
                  href="https://www.sacraluna.pt"
                  target="_blank"
                  rel="noreferrer"
                  className="btn-ad-primary"
                >
                  Consultar agora
                </a>

                <a href="/publicidade" className="btn-ad-secondary">
                  Divulgar no Regnum Noctis
                </a>
              </div>
            </div>
          </article>
        </div>
      </section>

      <section className="home-section">
        <div className="home-container">
          <article className="home-card home-card-premium fade-in-up fade-delay-2">
            <p className="home-card-kicker center-title">
              Contactos da plataforma
            </p>

            <h2 className="home-section-title center-title">
              Fala com a Administração
            </h2>

            <p className="home-text center-title">
              Informações, suporte e candidaturas relacionadas com a plataforma.
            </p>

            <div className="contact-actions fade-in-up fade-delay-3">
              <a
                href="mailto:geral.regnumnoctis@gmail.com"
                className="home-action-button"
              >
                Enviar email
              </a>

              <a
                href="https://wa.me/351911842626?text=D%C3%BAvidas%20Regnum%20Noctis"
                target="_blank"
                rel="noreferrer"
                className="home-action-button"
              >
                Falar por WhatsApp
              </a>
            </div>
          </article>
        </div>
      </section>
    </main>
  );
}