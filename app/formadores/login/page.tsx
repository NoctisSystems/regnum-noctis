export default function LoginFormadorPage() {
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
          maxWidth: "520px",
          border: "1px solid #a6783d",
          background: "#140d09",
          padding: "40px",
        }}
      >
        <h1
          style={{
            fontFamily: "Cinzel, serif",
            fontSize: "42px",
            textAlign: "center",
            marginTop: 0,
            marginBottom: "12px",
          }}
        >
          Login Formador
        </h1>

        <p
          style={{
            textAlign: "center",
            fontSize: "20px",
            color: "#caa15a",
            marginBottom: "30px",
          }}
        >
          Entra na tua área de formador
        </p>

        <form style={{ display: "grid", gap: "18px" }}>
          <div>
            <label style={label}>Email</label>
            <input type="email" name="email" style={input} required />
          </div>

          <div>
            <label style={label}>Palavra-passe</label>
            <input type="password" name="password" style={input} required />
          </div>

          <button type="submit" style={button}>
            Entrar
          </button>
        </form>

        <div
          style={{
            marginTop: "24px",
            textAlign: "center",
            fontSize: "18px",
            color: "#caa15a",
            lineHeight: "1.6",
          }}
        >
          Ainda não és formador?
          <br />
          <a
            href="/tornar-me-formador"
            style={{
              color: "#e6c27a",
              textDecoration: "underline",
            }}
          >
            Submeter candidatura
          </a>
        </div>
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
  padding: "14px",
  border: "1px solid #a6783d",
  background: "transparent",
  color: "#e6c27a",
  fontSize: "20px",
  cursor: "pointer",
};