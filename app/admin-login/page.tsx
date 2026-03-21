export default function AdminLoginPage() {
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
          maxWidth: "460px",
          border: "1px solid #a6783d",
          background: "#140d09",
          padding: "36px",
        }}
      >
        <h1
          style={{
            fontFamily: "Cinzel, serif",
            fontSize: "38px",
            textAlign: "center",
            marginBottom: "12px",
          }}
        >
          Administração
        </h1>

        <p
          style={{
            textAlign: "center",
            marginBottom: "28px",
            fontSize: "20px",
            color: "#caa15a",
          }}
        >
          Entrada reservada à equipa de administração do Regnum Noctis.
        </p>

        <form style={{ display: "grid", gap: "18px" }}>
          <div>
            <label style={label}>Email</label>
            <input type="email" style={input} />
          </div>

          <div>
            <label style={label}>Palavra-passe</label>
            <input type="password" style={input} />
          </div>

          <button type="submit" style={button}>
            Entrar
          </button>
        </form>
      </section>
    </main>
  );
}

const label = {
  display: "block",
  marginBottom: "8px",
  fontSize: "18px",
  color: "#e6c27a",
};

const input = {
  width: "100%",
  padding: "12px",
  border: "1px solid #a6783d",
  background: "#2b160f",
  color: "#e6c27a",
  fontSize: "18px",
  outline: "none",
};

const button = {
  marginTop: "10px",
  padding: "12px 18px",
  border: "1px solid #a6783d",
  background: "transparent",
  color: "#e6c27a",
  fontSize: "20px",
  cursor: "pointer",
};