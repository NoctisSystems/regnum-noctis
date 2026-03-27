export default function AdminCursosPage() {
  return (
    <main
      style={{
        display: "grid",
        gap: "24px",
      }}
    >
      <section>
        <p
          style={{
            margin: "0 0 10px 0",
            fontSize: "14px",
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "#caa15a",
          }}
        >
          Administração
        </p>

        <h1
          style={{
            fontFamily: "Cinzel, serif",
            fontSize: "clamp(34px, 5vw, 48px)",
            margin: "0 0 14px 0",
            color: "#e6c27a",
          }}
        >
          Cursos
        </h1>

        <p
          style={{
            margin: 0,
            color: "#d7b06c",
            fontSize: "clamp(18px, 2.2vw, 21px)",
            lineHeight: 1.7,
            maxWidth: "900px",
          }}
        >
          Visão geral da área de cursos da administração.
        </p>
      </section>

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "18px",
        }}
      >
        <div style={card}>
          <h3 style={cardTitle}>Total de cursos</h3>
          <p style={cardValue}>0</p>
        </div>

        <div style={card}>
          <h3 style={cardTitle}>Publicados</h3>
          <p style={cardValue}>0</p>
        </div>

        <div style={card}>
          <h3 style={cardTitle}>Pendentes</h3>
          <p style={cardValue}>0</p>
        </div>

        <div style={card}>
          <h3 style={cardTitle}>Rascunhos</h3>
          <p style={cardValue}>0</p>
        </div>
      </section>

      <section
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "stretch",
          gap: "12px",
          flexWrap: "wrap",
        }}
      >
        <input
          type="text"
          placeholder="Pesquisar curso..."
          style={inputPesquisa}
        />

        <div
          style={{
            display: "flex",
            gap: "12px",
            flexWrap: "wrap",
          }}
        >
          <button style={buttonSecundario}>Exportar</button>
          <a href="/formadores/criar-curso" style={buttonLink}>
            Criar curso
          </a>
        </div>
      </section>

      <section style={box}>
        <div
          style={{
            padding: "28px 18px",
            textAlign: "center",
            color: "#caa15a",
            fontSize: "21px",
            borderTop: "1px solid #8a5d31",
          }}
        >
          Ainda não existem cursos registados.
        </div>
      </section>
    </main>
  );
}

const card = {
  border: "1px solid #a6783d",
  padding: "20px",
  background: "linear-gradient(145deg, #1a0f0a, #140d09)",
  boxShadow: "0 0 20px rgba(166, 120, 61, 0.12)",
};

const cardTitle = {
  fontSize: "20px",
  marginBottom: "12px",
  color: "#e6c27a",
};

const cardValue = {
  fontSize: "clamp(30px, 5vw, 40px)",
  fontFamily: "Cinzel, serif",
  color: "#e6c27a",
};

const inputPesquisa = {
  minWidth: "260px",
  flex: 1,
  width: "100%",
  maxWidth: "100%",
  padding: "12px 14px",
  border: "1px solid #a6783d",
  background: "#140d09",
  color: "#e6c27a",
  fontSize: "17px",
  outline: "none",
};

const buttonSecundario = {
  padding: "12px 18px",
  border: "1px solid #a6783d",
  background: "transparent",
  color: "#e6c27a",
  fontSize: "17px",
  cursor: "pointer",
  minHeight: "46px",
};

const buttonLink = {
  padding: "12px 18px",
  border: "1px solid #a6783d",
  background: "#a6783d",
  color: "#140d09",
  fontSize: "17px",
  textDecoration: "none",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: "46px",
};

const box = {
  border: "1px solid #a6783d",
  background: "#140d09",
  overflow: "hidden",
};