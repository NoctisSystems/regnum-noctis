"use client";

import Link from "next/link";
import type { CSSProperties } from "react";

export default function AreaFormadorPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top, rgba(166,120,61,0.08), transparent 22%), #2b160f",
        color: "#e6c27a",
        fontFamily: "Cormorant Garamond, serif",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "40px 16px",
      }}
    >
      <section
        style={{
          width: "100%",
          maxWidth: "980px",
          border: "1px solid #a6783d",
          background:
            "linear-gradient(180deg, rgba(20,13,9,0.98) 0%, rgba(16,10,8,0.98) 100%)",
          padding: "clamp(24px, 4vw, 56px) clamp(18px, 4vw, 42px)",
          textAlign: "center",
          boxShadow:
            "0 18px 42px rgba(0,0,0,0.24), inset 0 1px 0 rgba(255,225,170,0.03)",
        }}
      >
        <p
          style={{
            margin: "0 0 10px 0",
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            color: "#caa15a",
            fontSize: "14px",
          }}
        >
          Regnum Noctis
        </p>

        <h1
          style={{
            fontFamily: "Cinzel, serif",
            fontSize: "clamp(34px, 6vw, 60px)",
            marginTop: 0,
            marginBottom: "18px",
            color: "#f0d79a",
            fontWeight: 500,
            lineHeight: 1.1,
          }}
        >
          Área do Formador
        </h1>

        <p
          style={{
            fontSize: "clamp(18px, 2.4vw, 24px)",
            lineHeight: "1.75",
            color: "#d7b06c",
            margin: "0 auto 34px auto",
            maxWidth: "860px",
          }}
        >
          Entra na tua área de formador para gerir cursos, acompanhar alunos,
          responder às comunidades internas e estruturar os teus conteúdos
          dentro da plataforma.
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: "18px",
            marginBottom: "28px",
          }}
        >
          <InfoCard
            titulo="Login"
            descricao="Acede à tua conta de formador e entra diretamente na dashboard."
            href="/formadores/login"
            textoBotao="Entrar como formador"
          />

          <InfoCard
            titulo="Primeiro login"
            descricao="Cria a tua palavra-passe inicial com o email que usaste na candidatura aprovada."
            href="/formadores/primeiro-login"
            textoBotao="Fazer primeiro login"
          />

          <InfoCard
            titulo="Candidatura"
            descricao="Submete a tua candidatura para integrares a plataforma como formador."
            href="/tornar-me-formador"
            textoBotao="Quero ser formador"
          />
        </div>

        <div
          style={{
            border: "1px solid rgba(166,120,61,0.22)",
            background: "rgba(32,18,13,0.45)",
            padding: "22px",
            textAlign: "left",
          }}
        >
          <h2
            style={{
              margin: "0 0 12px 0",
              fontFamily: "Cinzel, serif",
              fontSize: "clamp(24px, 3vw, 30px)",
              color: "#e6c27a",
              fontWeight: 500,
            }}
          >
            Nota importante
          </h2>

          <p
            style={{
              margin: 0,
              fontSize: "clamp(18px, 2.1vw, 20px)",
              lineHeight: "1.75",
              color: "#d7b06c",
            }}
          >
            O primeiro login deve ser feito com o email associado à candidatura
            aprovada. Depois de criares a tua palavra-passe, poderás entrar
            normalmente na área de formador sempre que quiseres.
          </p>
        </div>
      </section>
    </main>
  );
}

function InfoCard({
  titulo,
  descricao,
  href,
  textoBotao,
}: {
  titulo: string;
  descricao: string;
  href: string;
  textoBotao: string;
}) {
  return (
    <article
      style={{
        border: "1px solid rgba(166,120,61,0.22)",
        background: "rgba(32,18,13,0.45)",
        padding: "24px",
        display: "flex",
        flexDirection: "column",
        minHeight: "220px",
      }}
    >
      <h3
        style={{
          margin: "0 0 12px 0",
          fontFamily: "Cinzel, serif",
          fontSize: "clamp(24px, 3vw, 28px)",
          color: "#e6c27a",
          fontWeight: 500,
        }}
      >
        {titulo}
      </h3>

      <p
        style={{
          margin: "0 0 20px 0",
          fontSize: "clamp(18px, 2vw, 20px)",
          color: "#d7b06c",
          lineHeight: 1.7,
          flex: 1,
        }}
      >
        {descricao}
      </p>

      <Link href={href} style={botaoLink}>
        {textoBotao}
      </Link>
    </article>
  );
}

const botaoLink: CSSProperties = {
  textDecoration: "none",
  border: "1px solid #a6783d",
  color: "#e6c27a",
  padding: "14px 20px",
  fontSize: "16px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  background: "transparent",
  textAlign: "center",
};