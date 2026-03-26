import "./globals.css";
import RootShell from "@/components/RootShell";

export const metadata = {
  title: "Regnum Noctis — Onde o Conhecimento se Torna Poder",
  description:
    "Plataforma de formação espiritual avançada. Tarot, oráculos e conhecimento oculto com profundidade e estrutura.",
  icons: {
    icon: "/favicon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-PT">
      <body>
        <RootShell>{children}</RootShell>
      </body>
    </html>
  );
}