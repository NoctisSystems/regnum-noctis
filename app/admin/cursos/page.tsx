export default function AdminCursosPage() {
  return (
    <>
      <h1
        style={{
          fontFamily: "Cinzel, serif",
          fontSize: "48px",
          marginBottom: "24px",
          color: "#e6c27a",
        }}
      >
        Cursos
      </h1>

      {/* CARDS */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "24px",
          marginBottom: "32px",
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
      </div>

      {/* BARRA SUPERIOR */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "16px",
          flexWrap: "wrap",
          marginBottom: "24px",
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
          <a href="/formador/criar-curso" style={buttonLink}>
            Criar curso
          </a>
        </div>
      </div>

      {/* LISTA */}
      <div style={box}>
        <div style={headerTabela}>
          <span style={colunaTitulo}>Título</span>
          <span style={coluna}>Formador</span>
          <span style={coluna}>Tipo</span>
          <span style={coluna}>Estado</span>
        </div>

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
      </div>
    </>
  );
}

const card = {
  border: "1px solid #a6783d",
  padding: "24px",
  background: "linear-gradient(145deg, #1a0f0a, #140d09)",
  boxShadow: "0 0 20px rgba(166, 120, 61, 0.12)",
};

const cardTitle = {
  fontSize: "22px",
  marginBottom: "14px",
  color: "#e6c27a",
};

const cardValue = {
  fontSize: "40px",
  fontFamily: "Cinzel, serif",
  color: "#e6c27a",
};

const inputPesquisa = {
  minWidth: "280px",
  flex: 1,
  maxWidth: "420px",
  padding: "12px 14px",
  border: "1px solid #a6783d",
  background: "#140d09",
  color: "#e6c27a",
  fontSize: "18px",
  outline: "none",
};

const buttonSecundario = {
  padding: "12px 18px",
  border: "1px solid #a6783d",
  background: "transparent",
  color: "#e6c27a",
  fontSize: "18px",
  cursor: "pointer",
};

const buttonLink = {
  padding: "12px 18px",
  border: "1px solid #a6783d",
  background: "#a6783d",
  color: "#140d09",
  fontSize: "18px",
  textDecoration: "none",
  display: "inline-block",
};

const box = {
  border: "1px solid #a6783d",
  background: "#140d09",
  overflow: "hidden",
};

const headerTabela = {
  display: "grid",
  gridTemplateColumns: "2fr 1.5fr 1fr 1fr",
  gap: "16px",
  padding: "16px 18px",
  background: "#1b110c",
  color: "#e6c27a",
  fontSize: "18px",
  borderBottom: "1px solid #8a5d31",
};

const colunaTitulo = {
  fontWeight: "600",
};

const coluna = {
  fontWeight: "600",
};