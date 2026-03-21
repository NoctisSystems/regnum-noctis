export default function AdminDashboard() {
  return (
    <>
      <h1
        style={{
          fontFamily: "Cinzel, serif",
          fontSize: "52px",
          marginBottom: "42px",
          color: "#e6c27a",
        }}
      >
        Dashboard
      </h1>

      {/* CARDS */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "28px",
        }}
      >
        <div style={card}>
          <h3 style={cardTitle}>Cursos</h3>
          <p style={cardValue}>0</p>
        </div>

        <div style={card}>
          <h3 style={cardTitle}>Formadores</h3>
          <p style={cardValue}>0</p>
        </div>

        <div style={card}>
          <h3 style={cardTitle}>Alunos</h3>
          <p style={cardValue}>0</p>
        </div>

        <div style={card}>
          <h3 style={cardTitle}>Vendas</h3>
          <p style={cardValue}>0 €</p>
        </div>
      </div>

      {/* ACTIVIDADE */}
      <div
        style={{
          marginTop: "52px",
          borderTop: "1px solid #a6783d",
          paddingTop: "30px",
        }}
      >
        <h2
          style={{
            fontFamily: "Cinzel, serif",
            fontSize: "32px",
            marginBottom: "18px",
            color: "#e6c27a",
          }}
        >
          Actividade recente
        </h2>

        <p
          style={{
            fontSize: "22px",
            opacity: 0.88,
            color: "#e6c27a",
          }}
        >
          Ainda não existem actividades registadas.
        </p>
      </div>
    </>
  );
}

const card = {
  border: "1px solid #a6783d",
  padding: "28px",
  textAlign: "center" as const,
  background: "linear-gradient(145deg, #1a0f0a, #140d09)",
  boxShadow: "0 0 20px rgba(166, 120, 61, 0.12)",
};

const cardTitle = {
  fontSize: "22px",
  marginBottom: "14px",
  color: "#e6c27a",
};

const cardValue = {
  fontSize: "42px",
  fontFamily: "Cinzel, serif",
  color: "#e6c27a",
};