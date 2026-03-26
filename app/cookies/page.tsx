export default function CookiesPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#2b160f",
        color: "#e6c27a",
        fontFamily: "Cormorant Garamond, serif",
        paddingTop: "60px",
        paddingRight: "20px",
        paddingBottom: "90px",
        paddingLeft: "20px",
      }}
    >
      <section
        style={{
          maxWidth: "1100px",
          margin: "0 auto 36px auto",
          textAlign: "center",
          padding: "10px 20px 40px 20px",
          background:
            "radial-gradient(circle at center, rgba(106,58,27,0.24) 0%, rgba(43,22,15,0) 68%)",
        }}
      >
        <p
          style={{
            letterSpacing: "3px",
            textTransform: "uppercase",
            color: "#caa15a",
            fontSize: "16px",
            margin: "0 0 16px 0",
          }}
        >
          Regnum Noctis
        </p>

        <h1
          style={{
            fontFamily: "Cinzel, serif",
            fontSize: "clamp(38px, 5vw, 60px)",
            fontWeight: 500,
            margin: "0 0 18px 0",
            color: "#e6c27a",
            lineHeight: 1.08,
          }}
        >
          Política de Cookies
        </h1>

        <p
          style={{
            fontSize: "clamp(21px, 2.3vw, 27px)",
            lineHeight: "1.75",
            color: "#d7b06c",
            maxWidth: "920px",
            margin: "0 auto",
          }}
        >
          Esta página explica o que são cookies, para que podem ser utilizados
          no Regnum Noctis, como podem ser geridos pelo utilizador e qual o
          enquadramento legal aplicável à sua utilização na plataforma.
        </p>
      </section>

      <section
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
          display: "grid",
          gap: "22px",
        }}
      >
        <Bloco
          titulo="1. O que são cookies"
          referenciaLegal="Lei n.º 41/2004, de 18 de agosto, na redação em vigor; Regulamento (UE) 2016/679."
          conteudo={
            <>
              <p style={paragrafo}>
                Cookies são pequenos ficheiros de texto armazenados no
                equipamento do utilizador quando este visita um website. Estes
                ficheiros permitem reconhecer o navegador, conservar certas
                preferências, reforçar a segurança da sessão e melhorar a
                experiência de navegação.
              </p>
              <p style={{ ...paragrafo, marginBottom: 0 }}>
                A utilização de cookies pode estar associada a informação de
                navegação, preferências e interações realizadas na plataforma,
                devendo o respetivo tratamento obedecer às regras aplicáveis em
                matéria de privacidade e proteção de dados.
              </p>
            </>
          }
        />

        <Bloco
          titulo="2. Finalidade da utilização de cookies"
          referenciaLegal="Lei n.º 41/2004, de 18 de agosto, na redação em vigor; Regulamento (UE) 2016/679; Decreto-Lei n.º 7/2004, de 7 de janeiro."
          conteudo={
            <>
              <p style={paragrafo}>
                O Regnum Noctis poderá utilizar cookies para assegurar o
                funcionamento técnico da plataforma, manter sessões autenticadas,
                memorizar preferências do utilizador, melhorar a experiência de
                navegação, reforçar a segurança e recolher informação estatística
                sobre a utilização do website.
              </p>
              <p style={{ ...paragrafo, marginBottom: 0 }}>
                Sempre que aplicável, os cookies podem também servir para medir
                desempenho, analisar tráfego, suportar funcionalidades
                específicas da plataforma e adaptar certos elementos da
                experiência digital ao comportamento do utilizador.
              </p>
            </>
          }
        />

        <Bloco
          titulo="3. Tipos de cookies que podem ser utilizados"
          referenciaLegal="Lei n.º 41/2004, de 18 de agosto, na redação em vigor; Regulamento (UE) 2016/679."
          conteudo={
            <>
              <ul style={lista}>
                <li>
                  <strong>Cookies estritamente necessários:</strong> essenciais
                  ao funcionamento da plataforma, navegação, autenticação,
                  segurança e utilização das funcionalidades base.
                </li>
                <li>
                  <strong>Cookies de preferência:</strong> permitem recordar
                  definições como idioma, escolhas de interface ou outras
                  preferências do utilizador.
                </li>
                <li>
                  <strong>Cookies analíticos ou estatísticos:</strong> ajudam a
                  compreender como o website é utilizado, medindo visitas,
                  páginas consultadas, tempos médios de navegação e padrões
                  gerais de utilização.
                </li>
                <li>
                  <strong>Cookies funcionais:</strong> servem para otimizar a
                  experiência de utilização e o comportamento de determinadas
                  áreas do website.
                </li>
                <li>
                  <strong>Cookies publicitários ou de personalização:</strong>{" "}
                  quando aplicável, podem ser usados para gerir conteúdos
                  promocionais, campanhas, publicidade interna ou integrações com
                  serviços de terceiros.
                </li>
              </ul>
            </>
          }
        />

        <Bloco
          titulo="4. Cookies próprios e cookies de terceiros"
          referenciaLegal="Lei n.º 41/2004, de 18 de agosto, na redação em vigor; Regulamento (UE) 2016/679; Decreto-Lei n.º 7/2004, de 7 de janeiro."
          conteudo={
            <>
              <p style={paragrafo}>
                A plataforma pode utilizar cookies próprios, definidos
                diretamente pelo Regnum Noctis, bem como cookies de terceiros
                associados a serviços externos integrados no website.
              </p>
              <p style={paragrafo}>
                Esses terceiros podem incluir, por exemplo, ferramentas de
                análise, serviços de autenticação, meios de pagamento, serviços
                de vídeo, integrações técnicas, formulários, sistemas de apoio
                ao utilizador ou outras soluções necessárias ao funcionamento da
                plataforma.
              </p>
              <p style={{ ...paragrafo, marginBottom: 0 }}>
                Sempre que existam cookies de terceiros, o respetivo tratamento
                poderá ficar também sujeito às políticas dessas entidades.
              </p>
            </>
          }
        />

        <Bloco
          titulo="5. Consentimento e base de utilização"
          referenciaLegal="Lei n.º 41/2004, de 18 de agosto, na redação em vigor; Regulamento (UE) 2016/679."
          conteudo={
            <>
              <p style={paragrafo}>
                Os cookies estritamente necessários podem ser utilizados quando
                sejam indispensáveis ao funcionamento técnico da plataforma.
              </p>
              <p style={paragrafo}>
                Os restantes cookies, designadamente os de análise,
                personalização ou publicidade, dependem do consentimento do
                utilizador sempre que a legislação aplicável assim o exija.
              </p>
              <p style={{ ...paragrafo, marginBottom: 0 }}>
                O consentimento poderá ser dado, recusado ou ajustado através do
                mecanismo de gestão de cookies disponibilizado pela plataforma,
                quando esse mecanismo estiver implementado.
              </p>
            </>
          }
        />

        <Bloco
          titulo="6. Gestão de cookies pelo utilizador"
          referenciaLegal="Lei n.º 41/2004, de 18 de agosto, na redação em vigor; Regulamento (UE) 2016/679."
          conteudo={
            <>
              <p style={paragrafo}>
                O utilizador pode, a qualquer momento, configurar o navegador
                para bloquear, limitar, apagar ou notificar a utilização de
                cookies. Também poderá rever preferências de consentimento,
                sempre que a plataforma disponibilize um gestor específico para o
                efeito.
              </p>
              <p style={paragrafo}>
                A desativação de certos cookies pode afetar o funcionamento
                normal do website, impedir o uso de algumas funcionalidades ou
                reduzir a qualidade da experiência de navegação.
              </p>
              <p style={{ ...paragrafo, marginBottom: 0 }}>
                A gestão de cookies pode ser feita diretamente nas definições do
                navegador utilizado pelo visitante.
              </p>
            </>
          }
        />

        <Bloco
          titulo="7. Duração e conservação"
          referenciaLegal="Regulamento (UE) 2016/679; princípios gerais de necessidade, minimização e limitação da conservação."
          conteudo={
            <>
              <p style={paragrafo}>
                Os cookies podem ter duração variável. Alguns permanecem apenas
                durante a sessão de navegação e são eliminados quando o navegador
                é encerrado. Outros podem permanecer armazenados durante um
                período adicional, até serem automaticamente removidos ou
                apagados pelo utilizador.
              </p>
              <p style={{ ...paragrafo, marginBottom: 0 }}>
                O período de conservação depende da finalidade do cookie, da sua
                natureza técnica e das configurações aplicáveis ao serviço em
                causa.
              </p>
            </>
          }
        />

        <Bloco
          titulo="8. Cookies e dados pessoais"
          referenciaLegal="Regulamento (UE) 2016/679; Lei n.º 41/2004, de 18 de agosto, na redação em vigor."
          conteudo={
            <>
              <p style={paragrafo}>
                Sempre que a utilização de cookies envolva tratamento de dados
                pessoais, esse tratamento deve ser lido em conjunto com a
                Política de Privacidade da plataforma.
              </p>
              <p style={{ ...paragrafo, marginBottom: 0 }}>
                O Regnum Noctis compromete-se a tratar os dados relacionados com
                a navegação na medida necessária ao funcionamento da plataforma,
                à sua melhoria técnica, à segurança e às restantes finalidades
                legítimas aplicáveis.
              </p>
            </>
          }
        />

        <Bloco
          titulo="9. Relação com serviços digitais e contratação à distância"
          referenciaLegal="Decreto-Lei n.º 7/2004, de 7 de janeiro; Decreto-Lei n.º 24/2014, de 14 de fevereiro, na redação em vigor."
          conteudo={
            <>
              <p style={paragrafo}>
                Sempre que a plataforma disponibilize cursos, conteúdos digitais,
                serviços, espaços publicitários, áreas reservadas ou outras
                funcionalidades suscetíveis de contratação online, a utilização
                de cookies pode surgir associada ao funcionamento técnico do
                serviço, ao processo de autenticação, à gestão da sessão e ao
                suporte da experiência contratual à distância.
              </p>
              <p style={{ ...paragrafo, marginBottom: 0 }}>
                A informação prestada nesta página complementa, sem substituir,
                os demais deveres de informação pré-contratual e contratual
                aplicáveis ao website.
              </p>
            </>
          }
        />

        <Bloco
          titulo="10. Alterações à Política de Cookies"
          referenciaLegal="Lei n.º 41/2004, de 18 de agosto, na redação em vigor; Regulamento (UE) 2016/679; Decreto-Lei n.º 7/2004, de 7 de janeiro."
          conteudo={
            <>
              <p style={paragrafo}>
                O Regnum Noctis poderá atualizar esta Política de Cookies sempre
                que ocorram alterações legais, técnicas, operacionais ou
                funcionais relevantes.
              </p>
              <p style={{ ...paragrafo, marginBottom: 0 }}>
                A versão mais recente será a publicada nesta página e produzirá
                efeitos a partir da respetiva divulgação, salvo disposição legal
                em contrário.
              </p>
            </>
          }
        />

        <BlocoContactos />
      </section>
    </main>
  );
}

function Bloco({
  titulo,
  conteudo,
  referenciaLegal,
}: {
  titulo: string;
  conteudo: React.ReactNode;
  referenciaLegal: string;
}) {
  return (
    <article
      style={{
        border: "1px solid #8a5d31",
        background:
          "linear-gradient(180deg, rgba(20,13,9,0.98) 0%, rgba(16,10,8,0.98) 100%)",
        padding: "30px",
        boxShadow: "0 10px 30px rgba(0,0,0,0.22)",
      }}
    >
      <h2
        style={{
          fontFamily: "Cinzel, serif",
          fontSize: "clamp(24px, 3vw, 34px)",
          margin: "0 0 18px 0",
          color: "#e6c27a",
          lineHeight: 1.2,
        }}
      >
        {titulo}
      </h2>

      {conteudo}

      <div
        style={{
          marginTop: "18px",
          paddingTop: "14px",
          borderTop: "1px solid rgba(166,120,61,0.32)",
          fontSize: "16px",
          lineHeight: "1.7",
          color: "#caa15a",
        }}
      >
        <strong>Base legal indicativa:</strong> {referenciaLegal}
      </div>
    </article>
  );
}

function BlocoContactos() {
  return (
    <article
      style={{
        border: "1px solid #8a5d31",
        background:
          "linear-gradient(180deg, rgba(20,13,9,0.98) 0%, rgba(16,10,8,0.98) 100%)",
        padding: "30px",
        boxShadow: "0 10px 30px rgba(0,0,0,0.22)",
        textAlign: "center",
      }}
    >
      <p
        style={{
          letterSpacing: "2px",
          textTransform: "uppercase",
          color: "#caa15a",
          fontSize: "14px",
          margin: "0 0 12px 0",
        }}
      >
        Contactos da plataforma
      </p>

      <h2
        style={{
          fontFamily: "Cinzel, serif",
          fontSize: "clamp(28px, 4vw, 44px)",
          margin: "0 0 16px 0",
          color: "#e6c27a",
        }}
      >
        Fala com a Administração
      </h2>

      <p
        style={{
          fontSize: "22px",
          lineHeight: "1.8",
          color: "#d7b06c",
          maxWidth: "860px",
          margin: "0 auto 24px auto",
        }}
      >
        Informações, suporte e esclarecimentos relacionados com a plataforma,
        cookies, privacidade, termos, publicidade e restantes matérias
        administrativas.
      </p>

      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "16px",
          flexWrap: "wrap",
        }}
      >
        <a href="mailto:geral.regnumnoctis@gmail.com" style={botaoContacto}>
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
  );
}

const paragrafo: React.CSSProperties = {
  fontSize: "21px",
  lineHeight: "1.8",
  color: "#d7b06c",
  marginTop: 0,
  marginRight: 0,
  marginBottom: "16px",
  marginLeft: 0,
};

const lista: React.CSSProperties = {
  marginTop: 0,
  marginRight: 0,
  marginBottom: 0,
  marginLeft: "22px",
  padding: 0,
  color: "#d7b06c",
  fontSize: "21px",
  lineHeight: "1.8",
};

const botaoContacto: React.CSSProperties = {
  textDecoration: "none",
  border: "1px solid #a6783d",
  color: "#e6c27a",
  paddingTop: "12px",
  paddingRight: "18px",
  paddingBottom: "12px",
  paddingLeft: "18px",
  fontSize: "18px",
  display: "inline-block",
  background: "transparent",
};