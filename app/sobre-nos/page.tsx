"use client";

export default function SobreNosPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top, rgba(128,72,38,0.18) 0%, rgba(43,22,15,1) 28%, rgba(18,10,8,1) 100%)",
        color: "#e6c27a",
        fontFamily: "Cormorant Garamond, serif",
        paddingTop: "64px",
        paddingRight: "20px",
        paddingBottom: "110px",
        paddingLeft: "20px",
        overflow: "hidden",
      }}
    >
      <style jsx>{`
        .fade-up {
          opacity: 0;
          transform: translateY(30px);
          animation: fadeUp 0.9s ease forwards;
        }

        .delay-1 {
          animation-delay: 0.12s;
        }

        .delay-2 {
          animation-delay: 0.26s;
        }

        .delay-3 {
          animation-delay: 0.4s;
        }

        @keyframes fadeUp {
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .about-shell {
          max-width: 1180px;
          margin: 0 auto;
        }

        .hero {
          max-width: 1080px;
          margin: 0 auto 44px auto;
          text-align: center;
          padding: 22px 20px 8px 20px;
          position: relative;
        }

        .hero::before {
          content: "";
          position: absolute;
          inset: -40px -20px auto -20px;
          height: 320px;
          background: radial-gradient(
            circle at center,
            rgba(155, 92, 54, 0.2) 0%,
            rgba(155, 92, 54, 0.08) 35%,
            rgba(155, 92, 54, 0) 72%
          );
          pointer-events: none;
          z-index: 0;
        }

        .hero > * {
          position: relative;
          z-index: 1;
        }

        .eyebrow {
          margin: 0 0 18px 0;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: #ddb56f;
          font-size: clamp(19px, 2vw, 28px);
          font-weight: 600;
          text-align: center;
        }

        .hero-title {
          font-family: "Cinzel, serif";
          font-size: clamp(46px, 6vw, 76px);
          line-height: 1.06;
          font-weight: 500;
          margin: 0 0 20px 0;
          color: #f3deb0;
          text-shadow: 0 0 18px rgba(214, 168, 93, 0.08);
          text-align: center;
        }

        .hero-divider {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 16px;
          margin: 0 0 28px 0;
        }

        .hero-line {
          width: min(180px, 18vw);
          height: 1px;
          background: linear-gradient(
            90deg,
            rgba(166, 120, 61, 0) 0%,
            rgba(166, 120, 61, 1) 100%
          );
        }

        .hero-line.reverse {
          background: linear-gradient(
            90deg,
            rgba(166, 120, 61, 1) 0%,
            rgba(166, 120, 61, 0) 100%
          );
        }

        .hero-symbol {
          color: #ddb56f;
          font-size: 26px;
        }

        .hero-text {
          font-size: clamp(24px, 2.7vw, 33px);
          line-height: 1.7;
          color: #f0d9ab;
          max-width: 980px;
          margin: 0 auto;
          text-align: center;
        }

        .main-card {
          max-width: 1080px;
          margin: 0 auto 40px auto;
          border: 1px solid rgba(166, 120, 61, 0.78);
          background: linear-gradient(
            180deg,
            rgba(15, 9, 7, 0.96) 0%,
            rgba(28, 16, 12, 0.98) 100%
          );
          padding: 46px 44px;
          box-shadow:
            0 18px 50px rgba(0, 0, 0, 0.34),
            inset 0 1px 0 rgba(255, 225, 170, 0.05);
          position: relative;
          text-align: center;
        }

        .main-title {
          margin: 0 0 28px 0;
          font-family: "Cinzel, serif";
          font-size: clamp(32px, 4vw, 48px);
          color: #f2dbab;
          text-align: center;
        }

        .main-paragraph {
          margin: 0 0 24px 0;
          font-size: clamp(23px, 2.25vw, 29px);
          line-height: 1.75;
          color: #e4be7f;
          text-align: center;
        }

        .highlight-panel {
          margin: 34px auto;
          max-width: 860px;
          border: 1px solid rgba(166, 120, 61, 0.52);
          background: linear-gradient(
            180deg,
            rgba(113, 59, 32, 0.12) 0%,
            rgba(65, 34, 20, 0.12) 100%
          );
          padding: 28px 24px;
          text-align: center;
        }

        .highlight-title {
          margin: 0 0 16px 0;
          font-family: "Cinzel, serif";
          font-size: clamp(27px, 3vw, 36px);
          color: #f0d79a;
        }

        .highlight-text {
          font-size: clamp(22px, 2.15vw, 27px);
          line-height: 1.7;
          color: #e7c684;
        }

        .closing {
          max-width: 980px;
          margin: 0 auto;
          text-align: center;
        }

        .closing-title {
          margin: 0 0 16px 0;
          font-family: "Cinzel, serif";
          font-size: clamp(36px, 4.8vw, 56px);
          color: #f4dfb3;
        }

        .closing-text {
          font-size: clamp(24px, 2.4vw, 31px);
          line-height: 1.7;
          color: #deb976;
        }
      `}</style>

      <section className="about-shell">
        {/* HERO */}
        <div className="hero fade-up">
          <p className="eyebrow">A identidade do Regnum Noctis</p>

          <h1 className="hero-title">Sobre o Regnum Noctis</h1>

          <div className="hero-divider">
            <div className="hero-line reverse" />
            <div className="hero-symbol">✦</div>
            <div className="hero-line" />
          </div>

          <p className="hero-text fade-up delay-1">
            O Regnum Noctis é uma plataforma independente de educação espiritual,
            criada para reunir ensino sério, estruturado e exigente nas áreas
            dos oráculos, métodos divinatórios, práticas mágicas, caminhos
            devocionais, sacerdócios e desenvolvimento energético.
          </p>
        </div>

        {/* BLOCO PRINCIPAL */}
        <section className="fade-up delay-2">
          <div className="main-card">
            <h2 className="main-title">
              Uma plataforma criada para estrutura, profundidade e prática real
            </h2>

            <p className="main-paragraph">
              O Regnum Noctis nasce como resposta à falta de espaços
              verdadeiramente dedicados ao ensino espiritual com seriedade. Não
              foi criado para seguir tendências, alimentar consumo rápido de
              informação ou transformar conhecimento em conteúdo vazio.
            </p>

            <p className="main-paragraph">
              Foi pensado para acolher percursos com base, direção e aplicação
              concreta — para quem quer compreender, integrar e praticar, em vez
              de acumular noções soltas sem profundidade nem sustentação.
            </p>

            <p className="main-paragraph">
              O que distingue esta plataforma é o compromisso com a qualidade do
              ensino, a escolha criteriosa de formadores e uma aprendizagem
              orientada para desenvolver clareza, maturidade e autonomia real no
              percurso espiritual de cada aluno.
            </p>

            <div className="highlight-panel">
              <h3 className="highlight-title">
                O que sustenta o Regnum Noctis
              </h3>

              <p className="highlight-text">
                Estrutura real no conteúdo. Seleção séria de formadores. Ensino
                orientado para compreensão, autonomia e prática. Uma plataforma
                construída com respeito pelo conhecimento e pelo valor da
                transmissão.
              </p>
            </div>

            <p className="main-paragraph">
              Os percursos presentes na plataforma podem abranger áreas como
              Tarot, Lenormand, cartomancia, runas, práticas mágicas, sistemas
              devocionais, trabalho energético, sacerdócios e outros caminhos
              ligados ao desenvolvimento espiritual. O que os une não é uma
              estética vazia nem um discurso genérico, mas a intenção de ensinar
              com fundamento, coerência e aplicação real.
            </p>
          </div>
        </section>

        {/* FECHO */}
        <section className="closing fade-up delay-3">
          <h2 className="closing-title">
            Conhecimento. Estrutura. Autonomia.
          </h2>

          <p className="closing-text">
            O Regnum Noctis existe para oferecer uma base séria ao ensino
            espiritual — um espaço onde tradição, prática e transmissão possam
            coexistir com profundidade, organização e identidade própria.
          </p>
        </section>
      </section>
    </main>
  );
}