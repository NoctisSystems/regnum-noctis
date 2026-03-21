export default function AreaFormadorPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#2b160f",
        color: "#e6c27a",
        fontFamily: "Cormorant Garamond, serif",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "40px 20px",
      }}
    >
      <section
        style={{
          width: "100%",
          maxWidth: "900px",
          border: "1px solid #a6783d",
          background: "#140d09",
          padding: "50px 40px",
          textAlign: "center",
        }}
      >
        <h1
          style={{
            fontFamily: "Cinzel, serif",
            fontSize: "48px",
            marginTop: 0,
            marginBottom: "18px",
          }}
        >
          Área do Formador
        </h1>

        <p
          style={{
            fontSize: "24px",
            lineHeight: "1.6",
            color: "#d7b06c",
            marginBottom: "30px",
          }}
        >
          Acede ao teu painel de formador para gerir cursos, alunos e conteúdos.
        </p>

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "18px",
            flexWrap: "wrap",
          }}
        >
          <a href="/formadores/login" style={botaoLink}>
            Entrar como Formador
          </a>

          <a href="/tornar-me-formador" style={botaoLink}>
            Quero ser Formador
          </a>
        </div>
      </section>
    </main>
  );
}

const botaoLink = {
  textDecoration: "none",
  border: "1px solid #a6783d",
  color: "#e6c27a",
  padding: "14px 24px",
  fontSize: "20px",
  display: "inline-block",
  background: "transparent",
};