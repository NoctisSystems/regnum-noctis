import Link from "next/link";

export default function PublicidadePage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#2b160f",
        color: "#e6c27a",
        fontFamily: "Cormorant Garamond, serif",
        paddingTop: "clamp(40px, 6vw, 60px)",
        paddingRight: "clamp(14px, 4vw, 20px)",
        paddingBottom: "clamp(70px, 8vw, 90px)",
        paddingLeft: "clamp(14px, 4vw, 20px)",
      }}
    >
      <section
        style={{
          maxWidth: "1150px",
          margin: "0 auto 42px auto",
          textAlign: "center",
          padding: "10px clamp(10px, 3vw, 20px) 44px",
          background:
            "radial-gradient(circle at center, rgba(106,58,27,0.26) 0%, rgba(43,22,15,0) 68%)",
        }}
      >
        <p
          style={{
            letterSpacing: "3px",
            textTransform: "uppercase",
            color: "#caa15a",
            fontSize: "clamp(13px, 2vw, 16px)",
            margin: "0 0 16px 0",
          }}
        >
          Regnum Noctis
        </p>

        <h1
          style={{
            fontFamily: "Cinzel, serif",
            fontSize: "clamp(34px, 6vw, 62px)",
            fontWeight: 500,
            margin: "0 0 18px 0",
            color: "#e6c27a",
            lineHeight: 1.08,
          }}
        >
          Publicidade e Parceiros
        </h1>

        <p
          style={{
            fontSize: "clamp(18px, 2.8vw, 28px)",
            lineHeight: "1.75",
            color: "#d7b06c",
            maxWidth: "980px",
            margin: "0 auto 26px auto",
          }}
        >
          Divulga a tua marca, projeto, serviço ou espaço formativo dentro do
          ecossistema do Regnum Noctis. A visibilidade atribuída depende do
          plano escolhido e da validação da plataforma.
        </p>

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "12px",
            flexWrap: "wrap",
          }}
        >
          <a href="#planos" style={botaoPrincipal}>
            Ver planos
          </a>

          <Link href="/publicidade/candidatura" style={botaoSecundario}>
            Enviar candidatura
          </Link>

          <a href="#contactos" style={botaoSecundario}>
            Pedir informações
          </a>
        </div>
      </section>

      <section
        style={{
          maxWidth: "1150px",
          margin: "0 auto 28px auto",
          display: "grid",
          gap: "18px",
        }}
      >
        <article style={bloco}>
          <h2 style={tituloBloco}>Como funciona</h2>

          <p style={textoBloco}>
            O Regnum Noctis pode receber publicidade e parcerias selecionadas,
            desde que compatíveis com a identidade da plataforma, com o público
            e com a linha editorial do projeto.
          </p>

          <p style={textoBloco}>
            Consoante o plano, a tua presença poderá ficar:
          </p>

          <ul style={lista}>
            <li>numa página própria de publicidade e parceiros;</li>
            <li>em posição de maior destaque dentro dessa página;</li>
            <li>ou diretamente na Home, com visibilidade premium.</li>
          </ul>

          <p style={{ ...textoBloco, margin: "16px 0 18px 0" }}>
            Todos os pedidos ficam sujeitos a validação prévia. O Regnum Noctis
            reserva-se o direito de recusar conteúdos, marcas ou serviços que
            não estejam alinhados com a plataforma.
          </p>

          <Link href="/publicidade/candidatura" style={botaoPlano}>
            Avançar para candidatura
          </Link>
        </article>
      </section>

      <section
        id="planos"
        style={{
          maxWidth: "1150px",
          margin: "0 auto 30px auto",
        }}
      >
        <div
          style={{
            textAlign: "center",
            marginBottom: "24px",
          }}
        >
          <p style={kicker}>Planos de divulgação</p>

          <h2 style={tituloSecao}>Escolhe o nível de visibilidade</h2>

          <p style={textoSecao}>
            Estrutura simples, clara e ajustada ao valor real da montra da
            plataforma.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 260px), 1fr))",
            gap: "20px",
          }}
        >
          <PlanoCard
            titulo="Plano Base"
            preco="29€/mês"
            subtitulo="Presença simples e profissional"
            destaque={false}
            itens={[
              "Card na página de Publicidade e Parceiros",
              "Nome, imagem e descrição resumida",
              "Botão de acesso externo ou contacto",
              "Ideal para presença contínua a custo acessível",
            ]}
          />

          <PlanoCard
            titulo="Plano Destaque"
            preco="69€/mês"
            subtitulo="Mais visibilidade dentro da página"
            destaque={true}
            itens={[
              "Card em posição de maior destaque",
              "Maior presença visual dentro da página",
              "Mais espaço para apresentação",
              "Ideal para marcas e projetos que querem sobressair",
            ]}
          />

          <PlanoCard
            titulo="Plano Home"
            preco="149€/mês"
            subtitulo="Visibilidade premium"
            destaque={false}
            itens={[
              "Presença na Home do Regnum Noctis",
              "Inclusão adicional na página de Publicidade e Parceiros",
              "Maior valor de exposição e autoridade",
              "Indicado para campanhas premium e presença estratégica",
            ]}
          />
        </div>
      </section>

      <section
        style={{
          maxWidth: "1150px",
          margin: "0 auto 30px auto",
          display: "grid",
          gap: "18px",
        }}
      >
        <article style={bloco}>
          <h2 style={tituloBloco}>O que pode ser divulgado</h2>

          <ul style={lista}>
            <li>marcas e projetos compatíveis com a linha da plataforma;</li>
            <li>serviços, espaços formativos ou iniciativas parceiras;</li>
            <li>negócios ligados às áreas trabalhadas pelo Regnum Noctis;</li>
            <li>parcerias comerciais ou promocionais sujeitas a aprovação.</li>
          </ul>
        </article>

        <article style={bloco}>
          <h2 style={tituloBloco}>Regras de aceitação</h2>

          <p style={textoBloco}>
            A presença publicitária não é automática. Antes de qualquer
            publicação, a administração valida o conteúdo, a identidade visual,
            o destino do link e a compatibilidade geral com o Regnum Noctis.
          </p>

          <ul style={lista}>
            <li>
              não serão aceites conteúdos enganosos, abusivos ou incompatíveis
              com a imagem da plataforma;
            </li>
            <li>
              a administração pode recusar pedidos sem obrigação de publicação;
            </li>
            <li>
              a publicação depende de validação prévia e de acordo sobre o plano
              aplicável;
            </li>
            <li>
              o pagamento e a duração da presença serão combinados antes da
              ativação do espaço.
            </li>
          </ul>
        </article>
      </section>

      <section
        id="contactos"
        style={{
          maxWidth: "1150px",
          margin: "0 auto",
        }}
      >
        <article
          style={{
            ...bloco,
            textAlign: "center",
          }}
        >
          <p style={kicker}>Contacto comercial</p>

          <h2 style={tituloSecao}>Pede informações sobre publicidade</h2>

          <p
            style={{
              fontSize: "clamp(18px, 2.6vw, 22px)",
              lineHeight: "1.8",
              color: "#d7b06c",
              maxWidth: "860px",
              margin: "0 auto 24px auto",
            }}
          >
            Se queres divulgar a tua marca, projeto ou serviço no Regnum
            Noctis, entra em contacto para receberes condições, disponibilidade e
            validação da proposta.
          </p>

          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "12px",
              flexWrap: "wrap",
            }}
          >
            <Link href="/publicidade/candidatura" style={botaoPrincipal}>
              Enviar candidatura
            </Link>

            <a
              href="mailto:geral.regnumnoctis@gmail.com"
              style={botaoContacto}
            >
              Enviar email
            </a>

            <a
              href="https://wa.me/351911842626"
              target="_blank"
              rel="noopener noreferrer"
              style={botaoContacto}
            >
              Falar por WhatsApp
            </a>
          </div>
        </article>
      </section>
    </main>
  );
}

function PlanoCard({
  titulo,
  preco,
  subtitulo,
  itens,
  destaque,
}: {
  titulo: string;
  preco: string;
  subtitulo: string;
  itens: string[];
  destaque: boolean;
}) {
  return (
    <article
      style={{
        border: destaque ? "1px solid #c4914d" : "1px solid #8a5d31",
        background: destaque
          ? "linear-gradient(180deg, rgba(34,20,15,1) 0%, rgba(18,10,8,1) 100%)"
          : "linear-gradient(180deg, rgba(20,13,9,1) 0%, rgba(16,10,8,1) 100%)",
        padding: "24px 22px",
        boxShadow: destaque
          ? "0 0 24px rgba(230,194,122,0.10), 0 10px 30px rgba(0,0,0,0.22)"
          : "0 10px 30px rgba(0,0,0,0.22)",
        display: "flex",
        flexDirection: "column",
        minHeight: "100%",
      }}
    >
      <p style={miniMeta}>
        {destaque ? "Mais procurado" : "Plano disponível"}
      </p>

      <h3
        style={{
          fontFamily: "Cinzel, serif",
          fontSize: "clamp(24px, 3vw, 30px)",
          margin: "0 0 10px 0",
          color: "#e6c27a",
        }}
      >
        {titulo}
      </h3>

      <p
        style={{
          fontSize: "clamp(34px, 4vw, 42px)",
          lineHeight: 1,
          color: "#f0d79a",
          margin: "0 0 14px 0",
          fontFamily: "Cinzel, serif",
        }}
      >
        {preco}
      </p>

      <p
        style={{
          fontSize: "clamp(18px, 2.3vw, 20px)",
          lineHeight: "1.7",
          color: "#d7b06c",
          margin: "0 0 18px 0",
        }}
      >
        {subtitulo}
      </p>

      <ul style={{ ...lista, marginLeft: "20px", marginBottom: "22px" }}>
        {itens.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>

      <div style={{ marginTop: "auto" }}>
        <Link href="/publicidade/candidatura" style={botaoPlano}>
          Pedir este plano
        </Link>
      </div>
    </article>
  );
}

const bloco: React.CSSProperties = {
  border: "1px solid #8a5d31",
  background:
    "linear-gradient(180deg, rgba(20,13,9,0.98) 0%, rgba(16,10,8,0.98) 100%)",
  padding: "clamp(20px, 4vw, 32px) clamp(18px, 4vw, 30px)",
  boxShadow: "0 10px 30px rgba(0,0,0,0.22)",
};

const tituloBloco: React.CSSProperties = {
  fontFamily: "Cinzel, serif",
  fontSize: "clamp(24px, 4vw, 40px)",
  margin: "0 0 16px 0",
  color: "#e6c27a",
};

const textoBloco: React.CSSProperties = {
  fontSize: "clamp(18px, 2.5vw, 22px)",
  lineHeight: "1.8",
  color: "#d7b06c",
  margin: "0 0 16px 0",
};

const kicker: React.CSSProperties = {
  letterSpacing: "2px",
  textTransform: "uppercase",
  color: "#caa15a",
  fontSize: "14px",
  margin: "0 0 10px 0",
};

const tituloSecao: React.CSSProperties = {
  fontFamily: "Cinzel, serif",
  fontSize: "clamp(26px, 4vw, 44px)",
  margin: "0 0 12px 0",
  color: "#e6c27a",
};

const textoSecao: React.CSSProperties = {
  fontSize: "clamp(18px, 2.5vw, 21px)",
  lineHeight: "1.75",
  color: "#d7b06c",
  maxWidth: "860px",
  margin: "0 auto",
};

const miniMeta: React.CSSProperties = {
  letterSpacing: "1.5px",
  textTransform: "uppercase",
  color: "#caa15a",
  fontSize: "13px",
  margin: "0 0 8px 0",
};

const lista: React.CSSProperties = {
  marginTop: 0,
  marginRight: 0,
  marginBottom: 0,
  marginLeft: "22px",
  padding: 0,
  color: "#d7b06c",
  fontSize: "clamp(18px, 2.4vw, 21px)",
  lineHeight: "1.8",
};

const botaoPrincipal: React.CSSProperties = {
  textDecoration: "none",
  border: "1px solid #a6783d",
  color: "#140d09",
  padding: "12px 18px",
  fontSize: "clamp(16px, 2vw, 18px)",
  display: "inline-block",
  background: "#a6783d",
  width: "min(100%, 260px)",
  textAlign: "center",
};

const botaoSecundario: React.CSSProperties = {
  textDecoration: "none",
  border: "1px solid #a6783d",
  color: "#e6c27a",
  padding: "12px 18px",
  fontSize: "clamp(16px, 2vw, 18px)",
  display: "inline-block",
  background: "transparent",
  width: "min(100%, 260px)",
  textAlign: "center",
};

const botaoPlano: React.CSSProperties = {
  textDecoration: "none",
  border: "1px solid #a6783d",
  color: "#e6c27a",
  padding: "12px 18px",
  fontSize: "clamp(16px, 2vw, 18px)",
  display: "inline-block",
  background: "transparent",
  width: "min(100%, 260px)",
  textAlign: "center",
};

const botaoContacto: React.CSSProperties = {
  textDecoration: "none",
  border: "1px solid #a6783d",
  color: "#e6c27a",
  padding: "12px 18px",
  fontSize: "clamp(16px, 2vw, 18px)",
  display: "inline-block",
  background: "transparent",
  width: "min(100%, 260px)",
  textAlign: "center",
};