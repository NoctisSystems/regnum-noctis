export default function PrivacidadePage() {
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
          Política de Privacidade
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
          Esta página explica como podem ser recolhidos, utilizados,
          conservados e protegidos os dados pessoais tratados no contexto da
          utilização da plataforma Regnum Noctis.
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
          titulo="1. Responsável pelo tratamento"
          referenciaLegal="Regulamento (UE) 2016/679."
          conteudo={
            <>
              <p style={paragrafo}>
                O Regnum Noctis, enquanto entidade responsável pela gestão da
                plataforma, atua como responsável pelo tratamento dos dados
                pessoais recolhidos no contexto da navegação no website,
                registo, utilização de funcionalidades, candidaturas, compras,
                pagamentos, comunicações e relações administrativas associadas à
                plataforma.
              </p>
              <p style={{ ...paragrafo, marginBottom: 0 }}>
                Os elementos de identificação e contacto do responsável pelo
                tratamento podem ser complementados ou densificados noutras
                páginas institucionais, formulários ou documentos legais da
                plataforma.
              </p>
            </>
          }
        />

        <Bloco
          titulo="2. Categorias de dados pessoais"
          referenciaLegal="Regulamento (UE) 2016/679."
          conteudo={
            <>
              <p style={paragrafo}>
                O Regnum Noctis poderá tratar, consoante a relação estabelecida
                com o utilizador, dados como nome, email, telefone, dados de
                conta, dados de faturação, dados de pagamento, dados fiscais,
                identificadores técnicos, histórico de acessos, interações na
                plataforma, informações de candidatura, dados de formador,
                elementos de publicidade/parceria e outros dados necessários ao
                funcionamento da plataforma.
              </p>
              <p style={{ ...paragrafo, marginBottom: 0 }}>
                Apenas serão tratados os dados adequados, pertinentes e
                necessários às finalidades concretas aplicáveis.
              </p>
            </>
          }
        />

        <Bloco
          titulo="3. Finalidades do tratamento"
          referenciaLegal="Regulamento (UE) 2016/679; Decreto-Lei n.º 7/2004, de 7 de janeiro; Decreto-Lei n.º 24/2014, de 14 de fevereiro, quando aplicável."
          conteudo={
            <>
              <ul style={lista}>
                <li>Gestão de contas e autenticação de utilizadores.</li>
                <li>Gestão de alunos, formadores e candidaturas.</li>
                <li>
                  Processamento de compras, acessos, pagamentos, comissões,
                  levantamentos e obrigações administrativas associadas.
                </li>
                <li>
                  Disponibilização de cursos, conteúdos digitais, materiais,
                  certificados e serviços relacionados.
                </li>
                <li>Prestação de apoio, resposta a contactos e suporte.</li>
                <li>
                  Gestão de publicidade, parcerias e comunicações relacionadas
                  com a plataforma.
                </li>
                <li>
                  Segurança, prevenção de fraude, controlo técnico e melhoria do
                  funcionamento do website.
                </li>
              </ul>
            </>
          }
        />

        <Bloco
          titulo="4. Fundamentos de licitude"
          referenciaLegal="Regulamento (UE) 2016/679."
          conteudo={
            <>
              <p style={paragrafo}>
                O tratamento de dados pessoais pode assentar, consoante o caso,
                na execução de diligências pré-contratuais, na execução de um
                contrato, no cumprimento de obrigações legais, em interesses
                legítimos prosseguidos pelo responsável pelo tratamento ou no
                consentimento do titular dos dados, quando este seja exigível.
              </p>
              <p style={{ ...paragrafo, marginBottom: 0 }}>
                Sempre que o tratamento assente em consentimento, este poderá
                ser retirado nos termos legalmente aplicáveis, sem comprometer a
                licitude do tratamento efetuado até esse momento.
              </p>
            </>
          }
        />

        <Bloco
          titulo="5. Partilha e destinatários de dados"
          referenciaLegal="Regulamento (UE) 2016/679; Decreto-Lei n.º 7/2004, de 7 de janeiro."
          conteudo={
            <>
              <p style={paragrafo}>
                Os dados podem ser comunicados a prestadores de serviços que
                apoiem tecnicamente a operação da plataforma, incluindo
                alojamento, autenticação, base de dados, vídeo, pagamentos,
                comunicações, suporte, proteção técnica de conteúdos, gestão
                operacional e outras integrações estritamente necessárias ao
                funcionamento do Regnum Noctis.
              </p>
              <p style={{ ...paragrafo, marginBottom: 0 }}>
                A comunicação de dados também pode ocorrer quando tal seja
                exigido por lei, autoridade competente ou obrigação jurídica
                aplicável.
              </p>
            </>
          }
        />

        <Bloco
          titulo="6. Conservação dos dados"
          referenciaLegal="Regulamento (UE) 2016/679."
          conteudo={
            <>
              <p style={paragrafo}>
                Os dados pessoais serão conservados apenas durante o período
                necessário às finalidades que justificaram a sua recolha,
                durante o tempo exigido por obrigações legais, fiscais,
                contabilísticas, contratuais ou de defesa de direitos, ou
                enquanto subsistir fundamento legítimo para a respetiva
                conservação.
              </p>
              <p style={{ ...paragrafo, marginBottom: 0 }}>
                Findo o prazo de conservação aplicável, os dados poderão ser
                eliminados, anonimizados ou conservados apenas na medida
                estritamente necessária ao cumprimento de obrigações legais.
              </p>
            </>
          }
        />

        <Bloco
          titulo="7. Direitos dos titulares dos dados"
          referenciaLegal="Regulamento (UE) 2016/679."
          conteudo={
            <>
              <p style={paragrafo}>
                O titular dos dados pode exercer, nos termos legalmente
                aplicáveis, os direitos de acesso, retificação, apagamento,
                limitação do tratamento, oposição, portabilidade e retirada do
                consentimento quando este constitua fundamento de licitude.
              </p>
              <p style={{ ...paragrafo, marginBottom: 0 }}>
                O exercício destes direitos poderá depender da verificação da
                identidade do requerente e da inexistência de fundamento legal
                que imponha ou legitime a conservação dos dados.
              </p>
            </>
          }
        />

        <Bloco
          titulo="8. Segurança do tratamento"
          referenciaLegal="Regulamento (UE) 2016/679."
          conteudo={
            <>
              <p style={paragrafo}>
                O Regnum Noctis procura adotar medidas técnicas e organizativas
                adequadas à proteção dos dados pessoais, tendo em conta a
                natureza dos dados tratados, os riscos inerentes ao tratamento e
                o estado da técnica aplicável.
              </p>
              <p style={{ ...paragrafo, marginBottom: 0 }}>
                Apesar dos esforços de segurança, nenhum sistema digital pode
                garantir risco zero, pelo que a utilização da plataforma deve
                também ser acompanhada de condutas prudentes por parte dos
                utilizadores.
              </p>
            </>
          }
        />

        <Bloco
          titulo="9. Cookies, identificadores técnicos e navegação"
          referenciaLegal="Lei n.º 41/2004, de 18 de agosto, na redação em vigor; Regulamento (UE) 2016/679."
          conteudo={
            <>
              <p style={paragrafo}>
                A utilização de cookies, identificadores técnicos e mecanismos
                de sessão pode ocorrer no contexto do funcionamento do website,
                da autenticação, da segurança, da medição estatística e da
                melhoria da experiência de navegação.
              </p>
              <p style={{ ...paragrafo, marginBottom: 0 }}>
                Para informação detalhada sobre esta matéria, deve ser consultada
                a Política de Cookies da plataforma.
              </p>
            </>
          }
        />

        <Bloco
          titulo="10. Transferências e serviços de terceiros"
          referenciaLegal="Regulamento (UE) 2016/679."
          conteudo={
            <>
              <p style={paragrafo}>
                Sempre que a operação da plataforma envolva serviços de terceiros
                ou infraestruturas tecnológicas externas, o tratamento de dados
                associado será enquadrado nos termos legais aplicáveis,
                incluindo, quando necessário, mecanismos adequados de proteção
                contratual e técnica.
              </p>
              <p style={{ ...paragrafo, marginBottom: 0 }}>
                O utilizador reconhece que alguns serviços digitais necessários
                ao funcionamento da plataforma podem assentar em soluções
                técnicas externas integradas no ecossistema do website.
              </p>
            </>
          }
        />

        <Bloco
          titulo="11. Alterações à Política de Privacidade"
          referenciaLegal="Regulamento (UE) 2016/679; Decreto-Lei n.º 7/2004, de 7 de janeiro."
          conteudo={
            <>
              <p style={paragrafo}>
                O Regnum Noctis poderá atualizar esta Política de Privacidade
                sempre que ocorram alterações legais, técnicas, operacionais ou
                funcionais relevantes.
              </p>
              <p style={{ ...paragrafo, marginBottom: 0 }}>
                A versão mais recente será a publicada nesta página e produzirá
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
        dados pessoais, acessos, cursos, pagamentos, publicidade, cookies e
        restantes matérias administrativas.
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