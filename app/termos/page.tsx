export default function TermosPage() {
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
          maxWidth: "1100px",
          margin: "0 auto 36px auto",
          textAlign: "center",
          padding: "10px clamp(10px, 3vw, 20px) 40px",
          background:
            "radial-gradient(circle at center, rgba(106,58,27,0.24) 0%, rgba(43,22,15,0) 68%)",
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
            fontSize: "clamp(32px, 6vw, 60px)",
            fontWeight: 500,
            margin: "0 0 18px 0",
            color: "#e6c27a",
            lineHeight: 1.08,
          }}
        >
          Termos e Condições
        </h1>

        <p
          style={{
            fontSize: "clamp(18px, 2.8vw, 27px)",
            lineHeight: "1.75",
            color: "#d7b06c",
            maxWidth: "920px",
            margin: "0 auto",
          }}
        >
          Esta página regula a utilização geral da plataforma Regnum Noctis,
          incluindo regras aplicáveis a visitantes, alunos, formadores,
          publicidade, parceiros, conteúdos e serviços digitais.
        </p>
      </section>

      <section
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
          display: "grid",
          gap: "18px",
        }}
      >
        <Bloco
          titulo="1. Objeto e âmbito de aplicação"
          referenciaLegal="Decreto-Lei n.º 7/2004, de 7 de janeiro; Decreto-Lei n.º 24/2014, de 14 de fevereiro; Regulamento (UE) 2016/679."
          conteudo={
            <>
              <p style={paragrafo}>
                Os presentes Termos e Condições regulam o acesso, navegação e
                utilização da plataforma Regnum Noctis, bem como as condições
                gerais aplicáveis aos serviços, conteúdos digitais, cursos,
                espaços promocionais e demais funcionalidades disponibilizadas no
                website.
              </p>
              <p style={{ ...paragrafo, marginBottom: 0 }}>
                Ao utilizar a plataforma, o utilizador declara que leu,
                compreendeu e aceita estes Termos e Condições, sem prejuízo de
                condições específicas aplicáveis a determinadas áreas, serviços
                ou relações contratuais.
              </p>
            </>
          }
        />

        <Bloco
          titulo="2. Utilização da plataforma"
          referenciaLegal="Decreto-Lei n.º 7/2004, de 7 de janeiro."
          conteudo={
            <>
              <p style={paragrafo}>
                O utilizador compromete-se a utilizar o website de forma lícita,
                responsável e compatível com a finalidade da plataforma,
                abstendo-se de praticar atos que possam prejudicar o seu
                funcionamento, a sua segurança, os direitos da marca ou os
                direitos de terceiros.
              </p>
              <ul style={lista}>
                <li>Não utilizar identidades falsas ou dados enganosos.</li>
                <li>Não tentar aceder a áreas reservadas sem autorização.</li>
                <li>
                  Não introduzir conteúdos ilícitos, ofensivos, abusivos,
                  difamatórios ou contrários à boa-fé.
                </li>
                <li>
                  Não reproduzir ou distribuir conteúdos protegidos sem
                  autorização.
                </li>
              </ul>
            </>
          }
        />

        <Bloco
          titulo="3. Registo e contas de utilizador"
          referenciaLegal="Decreto-Lei n.º 7/2004, de 7 de janeiro; Regulamento (UE) 2016/679."
          conteudo={
            <>
              <p style={paragrafo}>
                O acesso a determinadas funcionalidades pode depender de registo
                prévio. O utilizador é responsável pela exatidão e atualização
                dos dados fornecidos, bem como pela confidencialidade das
                credenciais associadas à respetiva conta.
              </p>
              <p style={{ ...paragrafo, marginBottom: 0 }}>
                O Regnum Noctis poderá suspender, limitar ou encerrar contas
                sempre que existam indícios de fraude, abuso, incumprimento
                contratual, risco técnico ou violação destes Termos e Condições.
              </p>
            </>
          }
        />

        <Bloco
          titulo="4. Condições aplicáveis a alunos"
          referenciaLegal="Decreto-Lei n.º 24/2014, de 14 de fevereiro; Decreto-Lei n.º 7/2004, de 7 de janeiro."
          conteudo={
            <>
              <p style={paragrafo}>
                Os alunos podem adquirir cursos, conteúdos digitais e outros
                produtos disponibilizados na plataforma, de acordo com as
                condições apresentadas em cada oferta, sem prejuízo das regras
                legais aplicáveis aos contratos celebrados à distância.
              </p>
              <ul style={lista}>
                <li>
                  O acesso aos conteúdos depende da confirmação do pagamento ou
                  da atribuição manual de acesso pela administração, quando
                  aplicável.
                </li>
                <li>
                  Os conteúdos destinam-se ao uso pessoal do aluno, salvo
                  indicação expressa em sentido diferente.
                </li>
                <li>
                  É proibida a partilha indevida, reprodução, revenda ou
                  redistribuição não autorizada de materiais digitais.
                </li>
              </ul>
            </>
          }
        />

        <Bloco
          titulo="5. Condições aplicáveis a formadores"
          referenciaLegal="Decreto-Lei n.º 7/2004, de 7 de janeiro; Regulamento (UE) 2016/679."
          conteudo={
            <>
              <p style={paragrafo}>
                Os formadores que integrem a plataforma ficam sujeitos a
                aprovação prévia e às condições comerciais, operacionais,
                editoriais e técnicas definidas pelo Regnum Noctis.
              </p>
              <ul style={lista}>
                <li>
                  O formador é responsável pela legalidade, autoria e qualidade
                  dos conteúdos disponibilizados.
                </li>
                <li>
                  O formador compromete-se a fornecer dados verdadeiros,
                  incluindo dados de identificação, fiscais e de pagamento.
                </li>
                <li>
                  O Regnum Noctis poderá aplicar comissões, regras de
                  publicação, critérios de qualidade e mecanismos de controlo
                  editorial.
                </li>
              </ul>
            </>
          }
        />

        <Bloco
          titulo="6. Publicidade, parceiros e divulgação"
          referenciaLegal="Decreto-Lei n.º 7/2004, de 7 de janeiro; Decreto-Lei n.º 24/2014, de 14 de fevereiro, quando aplicável."
          conteudo={
            <>
              <p style={paragrafo}>
                A plataforma pode disponibilizar espaços de publicidade,
                promoção, parceria ou divulgação comercial, sujeitos a aceitação
                prévia e às condições aplicáveis a cada formato ou plano.
              </p>
              <ul style={lista}>
                <li>
                  A visibilidade atribuída pode variar consoante o plano, valor,
                  posição, formato e duração contratada.
                </li>
                <li>
                  O Regnum Noctis pode recusar conteúdos incompatíveis com a
                  linha editorial, com a lei aplicável ou com a imagem da
                  plataforma.
                </li>
                <li>
                  A aceitação de publicidade não implica endorsement automático
                  da entidade, produto ou serviço divulgado.
                </li>
              </ul>
            </>
          }
        />

        <Bloco
          titulo="7. Preços, pagamentos, comissões e acessos"
          referenciaLegal="Decreto-Lei n.º 24/2014, de 14 de fevereiro; Decreto-Lei n.º 7/2004, de 7 de janeiro."
          conteudo={
            <>
              <p style={paragrafo}>
                Os preços, condições de pagamento, comissões, modalidades de
                acesso e regras de atribuição podem variar consoante o tipo de
                curso, produto, serviço, publicidade, parceria ou relação
                comercial aplicável.
              </p>
              <p style={{ ...paragrafo, marginBottom: 0 }}>
                O Regnum Noctis reserva-se o direito de atualizar condições
                comerciais futuras, sem prejuízo dos direitos já adquiridos nos
                termos da lei.
              </p>
            </>
          }
        />

        <Bloco
          titulo="8. Propriedade intelectual e proteção de conteúdos"
          referenciaLegal="Decreto-Lei n.º 7/2004, de 7 de janeiro; regime geral de proteção da propriedade intelectual aplicável."
          conteudo={
            <>
              <p style={paragrafo}>
                Os conteúdos presentes na plataforma, incluindo vídeos, textos,
                fichas, imagens, design, identidade visual, manuais, aulas e
                materiais digitais, encontram-se protegidos pelas normas
                aplicáveis em matéria de propriedade intelectual.
              </p>
              <p style={{ ...paragrafo, marginBottom: 0 }}>
                O acesso a conteúdos pagos ou reservados não confere qualquer
                direito de exploração comercial, revenda, reprodução pública ou
                disponibilização a terceiros sem autorização expressa.
              </p>
            </>
          }
        />

        <Bloco
          titulo="9. Dados pessoais e privacidade"
          referenciaLegal="Regulamento (UE) 2016/679; Lei n.º 41/2004, de 18 de agosto, na redação em vigor."
          conteudo={
            <>
              <p style={paragrafo}>
                O tratamento de dados pessoais associado ao funcionamento da
                plataforma, registo de utilizadores, acessos, pagamentos,
                candidaturas, comunicações e utilização de funcionalidades deve
                ser lido em conjunto com a Política de Privacidade.
              </p>
              <p style={{ ...paragrafo, marginBottom: 0 }}>
                O utilizador compromete-se a fornecer apenas dados necessários,
                corretos e atualizados, reconhecendo que alguns elementos podem
                ser exigidos por razões de segurança, faturação, suporte,
                pagamentos ou cumprimento legal.
              </p>
            </>
          }
        />

        <Bloco
          titulo="10. Limitação de responsabilidade"
          referenciaLegal="Decreto-Lei n.º 7/2004, de 7 de janeiro."
          conteudo={
            <>
              <p style={paragrafo}>
                O Regnum Noctis procura assegurar o funcionamento regular da
                plataforma, mas não garante a ausência absoluta de interrupções,
                falhas técnicas, indisponibilidades temporárias, erros de
                terceiros ou limitações externas.
              </p>
              <p style={{ ...paragrafo, marginBottom: 0 }}>
                A plataforma não responde por danos resultantes de utilização
                indevida por parte do utilizador, falhas externas, comportamentos
                de terceiros, indisponibilidade de serviços integrados ou
                conteúdos submetidos por formadores, parceiros ou anunciantes,
                sem prejuízo dos direitos imperativamente protegidos por lei.
              </p>
            </>
          }
        />

        <Bloco
          titulo="11. Suspensão, remoção e encerramento de acesso"
          referenciaLegal="Decreto-Lei n.º 7/2004, de 7 de janeiro."
          conteudo={
            <>
              <p style={paragrafo}>
                O Regnum Noctis poderá suspender, limitar ou remover acessos,
                contas, conteúdos, cursos, anúncios, perfis ou funcionalidades
                sempre que existam indícios de incumprimento, fraude, abuso,
                risco técnico, violação legal ou infração destes Termos e
                Condições.
              </p>
              <p style={{ ...paragrafo, marginBottom: 0 }}>
                Sempre que adequado, a administração poderá solicitar
                esclarecimentos, documentação adicional ou regularizações antes
                de adotar uma decisão definitiva.
              </p>
            </>
          }
        />

        <Bloco
          titulo="12. Alterações aos Termos e Condições"
          referenciaLegal="Decreto-Lei n.º 7/2004, de 7 de janeiro; Decreto-Lei n.º 24/2014, de 14 de fevereiro, quando aplicável."
          conteudo={
            <>
              <p style={paragrafo}>
                O Regnum Noctis poderá alterar estes Termos e Condições sempre
                que tal se revele necessário por razões legais, operacionais,
                técnicas, comerciais ou editoriais.
              </p>
              <p style={{ ...paragrafo, marginBottom: 0 }}>
                A versão mais recente será a publicada nesta página, produzindo
                efeitos a partir da respetiva divulgação, salvo disposição legal
                em sentido diferente.
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
        padding: "clamp(18px, 4vw, 30px)",
        boxShadow: "0 10px 30px rgba(0,0,0,0.22)",
      }}
    >
      <h2
        style={{
          fontFamily: "Cinzel, serif",
          fontSize: "clamp(22px, 3vw, 34px)",
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
          fontSize: "clamp(14px, 2vw, 16px)",
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
        padding: "clamp(18px, 4vw, 30px)",
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
          fontSize: "clamp(24px, 4vw, 44px)",
          margin: "0 0 16px 0",
          color: "#e6c27a",
        }}
      >
        Fala com a Administração
      </h2>

      <p
        style={{
          fontSize: "clamp(18px, 2.5vw, 22px)",
          lineHeight: "1.8",
          color: "#d7b06c",
          maxWidth: "860px",
          margin: "0 auto 24px auto",
        }}
      >
        Informações, suporte e esclarecimentos relacionados com a plataforma,
        cursos, perfis, pagamentos, publicidade, privacidade, cookies e
        restantes matérias administrativas.
      </p>

      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "12px",
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
  fontSize: "clamp(18px, 2.4vw, 21px)",
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
  fontSize: "clamp(18px, 2.4vw, 21px)",
  lineHeight: "1.8",
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
};