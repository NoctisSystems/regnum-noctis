"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type AdminRegisto = {
  id: number;
  auth_id: string | null;
  email: string | null;
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [aValidarAcesso, setAValidarAcesso] = useState(true);

  useEffect(() => {
    let ativo = true;

    async function validarAcessoAdmin() {
      try {
        setAValidarAcesso(true);

        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError || !session?.user) {
          if (ativo) {
            router.replace("/admin-login");
          }
          return;
        }

        const { data: adminData, error: adminError } = await supabase
          .from("admin")
          .select("id, auth_id, email")
          .eq("auth_id", session.user.id)
          .maybeSingle<AdminRegisto>();

        if (adminError || !adminData) {
          await supabase.auth.signOut();

          if (ativo) {
            router.replace("/admin-login");
          }
          return;
        }

        if (ativo) {
          setAValidarAcesso(false);
        }
      } catch {
        if (ativo) {
          router.replace("/admin-login");
        }
      }
    }

    validarAcessoAdmin();

    return () => {
      ativo = false;
    };
  }, [router]);

  if (aValidarAcesso) {
    return (
      <main
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
          background:
            "radial-gradient(circle at top, rgba(128,72,38,0.14) 0%, rgba(43,22,15,1) 30%, rgba(18,10,8,1) 100%)",
          color: "#e6c27a",
          fontFamily: "Cormorant Garamond, serif",
        }}
      >
        <section
          style={{
            width: "100%",
            maxWidth: "620px",
            border: "1px solid rgba(166, 120, 61, 0.7)",
            background:
              "linear-gradient(180deg, rgba(15,9,7,0.96) 0%, rgba(28,16,12,0.98) 100%)",
            padding: "clamp(22px, 4vw, 34px)",
            boxShadow:
              "0 16px 40px rgba(0,0,0,0.26), inset 0 1px 0 rgba(255,225,170,0.04)",
          }}
        >
          <p
            style={{
              margin: "0 0 8px 0",
              textTransform: "uppercase",
              letterSpacing: "0.14em",
              fontSize: "14px",
              color: "#caa15a",
            }}
          >
            Regnum Noctis
          </p>

          <h1
            style={{
              fontFamily: "Cinzel, serif",
              fontSize: "clamp(28px, 5vw, 40px)",
              lineHeight: 1.15,
              margin: "0 0 14px 0",
              color: "#f0d79a",
              fontWeight: 500,
            }}
          >
            A validar acesso à administração
          </h1>

          <p
            style={{
              margin: 0,
              fontSize: "clamp(18px, 2.2vw, 22px)",
              lineHeight: 1.7,
              color: "#dfbe81",
            }}
          >
            Estamos a confirmar as credenciais e permissões de administrador.
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className="admin-layout-clean">
      <section className="admin-layout-inner">{children}</section>
    </main>
  );
}