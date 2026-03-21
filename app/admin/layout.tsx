export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        background: "#2b160f",
        color: "#e6c27a",
        fontFamily: "Cormorant Garamond, serif",
      }}
    >
      {/* SIDEBAR */}
      <aside
        style={{
          width: "260px",
          borderRight: "1px solid #a6783d",
          padding: "30px 20px",
          background: "#140d09",
        }}
      >
        <h2
          style={{
            fontFamily: "Cinzel, serif",
            fontSize: "26px",
            marginBottom: "30px",
          }}
        >
          Administração
        </h2>

        <nav
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "14px",
          }}
        >
          <a href="/admin" style={link}>
            Dashboard
          </a>

          <a href="/admin/cursos" style={link}>
            Cursos
          </a>

          <a href="/admin/formadores" style={link}>
            Formadores
          </a>

          <a href="/admin/alunos" style={link}>
            Alunos
          </a>

          <a href="/admin/vendas" style={link}>
            Vendas
          </a>

          <a href="/admin/levantamentos" style={link}>
            Levantamentos
          </a>
        </nav>
      </aside>

      {/* CONTEÚDO */}
      <section
        style={{
          flex: 1,
          padding: "40px",
        }}
      >
        {children}
      </section>
    </main>
  );
}

const link = {
  textDecoration: "none",
  color: "#e6c27a",
  border: "1px solid #a6783d",
  padding: "12px",
  display: "block",
  fontSize: "18px",
  transition: "all 0.2s ease",
};