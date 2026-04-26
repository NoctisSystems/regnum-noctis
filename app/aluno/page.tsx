"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Aluno = {
  id: number;
  nome: string | null;
  email: string | null;
};

export default function AlunoPage() {
  const [aluno, setAluno] = useState<Aluno | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function carregarAluno() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setAluno(null);
          return;
        }

        const { data } = await supabase
          .from("alunos")
          .select("id, nome, email")
          .eq("auth_id", user.id)
          .maybeSingle();

        if (data) {
          setAluno(data as Aluno);
          return;
        }

        if (user.email) {
          const { data: porEmail } = await supabase
            .from("alunos")
            .select("id, nome, email")
            .ilike("email", user.email)
            .maybeSingle();

          setAluno((porEmail as Aluno | null) || null);
        }
      } finally {
        setLoading(false);
      }
    }

    void carregarAluno();
  }, []);

  const nomeAluno =
    aluno?.nome?.trim() ||
    aluno?.email?.trim() ||
    "Aluno";

  return (
    <main style={pagina}>
      <section style={container}>
        <header style={header}>
          <div>
            <h1 style={titulo}>
              {loading ? "Área do aluno" : `Bem-vindo, ${nomeAluno}`}
            </h1>
          </div>

          <div style={acoesTopo}>
            <Link href="/aluno/login" style={botaoSecundario}>
              Login
            </Link>

            <Link href="/aluno/registo" style={botaoSecundario}>
              Registo
            </Link>
          </div>
        </header>

        <section style={grid}>
          <Card titulo="Dashboard" href="/aluno/dashboard" />
          <Card titulo="Cursos" href="/aluno/cursos" />
          <Card titulo="Tickets" href="/aluno/tickets" />
          <Card titulo="Recuperar acesso" href="/aluno/recuperar-password" />
        </section>

        <section style={barraInferior}>
          <Link href="/cursos" style={botaoSecundario}>
            Ver catálogo
          </Link>
        </section>
      </section>
    </main>
  );
}

function Card({ titulo, href }: { titulo: string; href: string }) {
  return (
    <Link href={href} style={card}>
      <span style={cardTitulo}>{titulo}</span>
      <span style={cardAcao}>Abrir</span>
    </Link>
  );
}

const pagina: React.CSSProperties = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at top, rgba(166,120,61,0.10), transparent 24%), #2b160f",
  color: "#e6c27a",
  fontFamily: "Cormorant Garamond, serif",
  padding: "clamp(28px, 5vw, 60px) 16px 90px",
};

const container: React.CSSProperties = {
  width: "100%",
  maxWidth: "980px",
  margin: "0 auto",
};

const header: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "16px",
  flexWrap: "wrap",
  marginBottom: "24px",
};

const titulo: React.CSSProperties = {
  margin: 0,
  fontFamily: "Cinzel, serif",
  fontSize: "clamp(34px, 7vw, 58px)",
  lineHeight: 1.1,
  color: "#f0d79a",
  fontWeight: 500,
};

const acoesTopo: React.CSSProperties = {
  display: "flex",
  gap: "10px",
  flexWrap: "wrap",
};

const grid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "16px",
};

const card: React.CSSProperties = {
  border: "1px solid #8a5d31",
  background:
    "linear-gradient(180deg, rgba(20,13,9,0.98) 0%, rgba(16,10,8,0.98) 100%)",
  padding: "22px",
  minHeight: "140px",
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
  gap: "18px",
  textDecoration: "none",
  color: "#e6c27a",
  boxShadow:
    "0 12px 28px rgba(0,0,0,0.20), inset 0 1px 0 rgba(255,225,170,0.03)",
};

const cardTitulo: React.CSSProperties = {
  fontFamily: "Cinzel, serif",
  fontSize: "clamp(24px, 4vw, 31px)",
  lineHeight: 1.2,
  color: "#f0d79a",
};

const cardAcao: React.CSSProperties = {
  alignSelf: "flex-start",
  border: "1px solid rgba(166,120,61,0.65)",
  padding: "10px 14px",
  fontSize: "15px",
  color: "#e6c27a",
  background: "rgba(32,18,13,0.55)",
};

const barraInferior: React.CSSProperties = {
  marginTop: "18px",
  display: "flex",
  justifyContent: "flex-start",
};

const botaoSecundario: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  textDecoration: "none",
  border: "1px solid rgba(166,120,61,0.75)",
  color: "#e6c27a",
  padding: "12px 16px",
  fontSize: "16px",
  background: "rgba(32,18,13,0.55)",
  textAlign: "center",
  minHeight: "44px",
};