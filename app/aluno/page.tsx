export default function AlunoPage() {
  return (
    <main className="aluno-page">
      <section className="aluno-hero">
        <div
          className="home-container"
          style={{
            textAlign: "center",
            maxWidth: "900px",
            margin: "0 auto",
          }}
        >
          <p className="home-kicker"></p>

          <h1 className="home-title aluno-title">
            Entrar no teu percurso
          </h1>

          <div
            className="home-ornament"
            aria-hidden="true"
            style={{ justifyContent: "center" }}
          >
            <div className="home-ornament-line" />
            <div className="home-ornament-star">✦</div>
            <div className="home-ornament-line" />
          </div>

          <p
            className="home-lead"
            style={{
              margin: "0 auto",
              textAlign: "center",
            }}
          >
            Acede aos teus cursos, acompanha o teu progresso e organiza o teu
            percurso dentro do Regnum Noctis.
          </p>
        </div>
      </section>

      <section className="home-section">
        <div className="home-container">
          <div className="aluno-grid">
            <article className="home-card home-card-premium aluno-entry-card">
              <p className="home-card-kicker">Já tens conta?</p>
              <h2 className="home-section-title">Entrar</h2>

              <p className="home-text">
                Se já tens conta criada, entra diretamente na tua área para
                aceder aos teus cursos e conteúdos.
              </p>

              <div className="contact-actions">
                <a href="/aluno/login" className="home-action-button">
                  Entrar na Área do Aluno
                </a>
              </div>
            </article>

            <article className="home-card home-card-premium aluno-entry-card">
              <p className="home-card-kicker">Ainda não tens conta?</p>
              <h2 className="home-section-title">Criar conta</h2>

              <p className="home-text">
                Regista-te para poderes comprar cursos, acompanhar o teu
                progresso e construir o teu percurso na plataforma.
              </p>

              <div className="contact-actions">
                <a href="/aluno/registo" className="home-action-button">
                  Criar Conta de Aluno
                </a>
              </div>
            </article>
          </div>
        </div>
      </section>
    </main>
  );
}