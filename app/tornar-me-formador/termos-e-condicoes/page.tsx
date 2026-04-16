import Link from "next/link";

export const metadata = {
  title: "Termos e Condições do Formador | Regnum Noctis",
  description:
    "Termos e Condições aplicáveis aos candidatos e formadores da Regnum Noctis.",
};

export default function TermosECondicoesFormadorPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top, rgba(166,120,61,0.08), transparent 22%), #2b160f",
        color: "#e6c27a",
        padding: "clamp(40px, 6vw, 60px) clamp(14px, 4vw, 20px) clamp(70px, 8vw, 90px)",
        fontFamily: "Cormorant Garamond, serif",
      }}
    >
      <section
        style={{
          maxWidth: "980px",
          margin: "0 auto",
          border: "1px solid #8a5d31",
          padding: "clamp(24px, 4vw, 40px)",
          background:
            "linear-gradient(180deg, rgba(20,13,9,0.98) 0%, rgba(16,10,8,0.98) 100%)",
          boxShadow:
            "0 18px 42px rgba(0,0,0,0.24), inset 0 1px 0 rgba(255,225,170,0.03)",
        }}
      >
        <p
          style={{
            margin: "0 0 12px 0",
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            color: "#caa15a",
            fontSize: "clamp(13px, 2vw, 16px)",
            textAlign: "center",
          }}
        >
          Regnum Noctis
        </p>

        <h1
          style={{
            fontFamily: "Cinzel, serif",
            fontSize: "clamp(32px, 5vw, 54px)",
            margin: "0 0 18px 0",
            color: "#f0d79a",
            lineHeight: 1.1,
            textAlign: "center",
          }}
        >
          Termos e Condições do Formador
        </h1>

        <p
          style={{
            fontSize: "clamp(18px, 2.4vw, 22px)",
            color: "#d7b06c",
            maxWidth: "800px",
            margin: "0 auto 32px auto",
            lineHeight: 1.7,
            textAlign: "center",
          }}
        >
          Estes Termos regulam a candidatura, aprovação e atividade dos
          formadores na Regnum Noctis.
        </p>

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginBottom: "30px",
          }}
        >
          <Link
            href="/tornar-me-formador"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              border: "1px solid #a6783d",
              background: "linear-gradient(180deg, #24140f 0%, #1a100c 100%)",
              color: "#e6c27a",
              padding: "12px 18px",
              fontSize: "16px",
              textDecoration: "none",
              boxShadow: "0 0 14px rgba(166, 120, 61, 0.1)",
            }}
          >
            Voltar à candidatura
          </Link>
        </div>

        <div
          style={{
            color: "#d7b06c",
            fontSize: "clamp(18px, 2.2vw, 20px)",
            lineHeight: 1.9,
          }}
        >
          <Section
            title="1. Objeto"
            text="Os presentes Termos e Condições regulam a candidatura, aprovação e atividade de formadores na plataforma Regnum Noctis."
          />

          <Section
            title="2. Natureza da relação"
            text="O formador atua como profissional independente. Não existe qualquer vínculo laboral, relação de subordinação, sociedade ou exclusividade entre a Regnum Noctis e o formador, salvo acordo escrito em contrário. A Regnum Noctis atua como plataforma de intermediação, promoção, alojamento e gestão tecnológica dos conteúdos aprovados."
          />

          <Section
            title="3. Candidatura e aprovação"
            text="A candidatura a formador está sujeita a análise interna. A Regnum Noctis pode pedir documentos, comprovativos, informações curriculares, elementos fiscais e outros dados considerados necessários. A Regnum Noctis reserva-se o direito de aprovar, recusar, suspender ou cancelar candidaturas sem obrigação de aceitação."
          />

          <Section
            title="4. Comissão da plataforma"
            text="Salvo acordo escrito em contrário, a Regnum Noctis aplica uma comissão de 30% sobre o valor das vendas dos cursos de formadores externos. A plataforma pode definir condições específicas para determinados cursos, campanhas, parcerias, formadores ou categorias, desde que tal seja comunicado por escrito ou definido internamente na configuração aplicável."
          />

          <Section
            title="5. Pagamentos ao formador"
            text="Os pagamentos ao formador ficam dependentes da validação das vendas e do cumprimento dos procedimentos internos da plataforma. A Regnum Noctis pode reter temporariamente montantes em caso de reembolso, chargeback, suspeita de fraude, litígio, incumprimento destes Termos ou necessidade de verificação documental. O pagamento só poderá ser efetuado quando o formador tiver fornecido corretamente os seus dados e os elementos fiscais exigidos."
          />

          <Section
            title="6. Obrigações fiscais e legais do formador"
            text="O formador é o único responsável pela sua situação fiscal, contributiva e legal. O formador compromete-se a emitir a documentação fiscal legalmente exigida no seu país. A Regnum Noctis não é responsável por incumprimentos fiscais, contributivos ou declarativos do formador."
          />

          <Section
            title="7. Regras específicas para formadores em Portugal"
            text="O formador com atividade em Portugal declara estar legalmente apto a prestar serviços e a emitir a documentação fiscal aplicável. O formador é responsável por cumprir as obrigações legais, fiscais e contributivas que resultem da sua atividade."
          />

          <Section
            title="8. Regras específicas para formadores no Brasil"
            text="O formador com atividade no Brasil declara estar legalmente apto a prestar serviços e a emitir a documentação fiscal aplicável. O formador é responsável por cumprir as obrigações legais, fiscais e tributárias decorrentes da sua atividade."
          />

          <Section
            title="9. Conteúdos submetidos"
            text="O formador é integralmente responsável pelos conteúdos, cursos, aulas, textos, vídeos, PDFs, áudios, imagens e demais materiais que disponibilize na plataforma. O formador garante que os conteúdos são seus ou que possui autorização bastante para os utilizar. É proibida a submissão de conteúdos ilegais, enganadores, ofensivos, difamatórios, discriminatórios, plagiados ou que violem direitos de terceiros."
          />

          <Section
            title="10. Condutas proibidas"
            text="O formador não pode utilizar a Regnum Noctis para praticar fraude, manipulação, plágio, assédio, ameaça, coação ou qualquer conduta ilícita. O formador não pode fazer promessas falsas, garantias absolutas de resultados, alegações enganosas ou afirmações que possam induzir o aluno em erro. O formador não pode usar a plataforma para difundir conteúdos que violem a lei, a ordem pública ou direitos de terceiros."
          />

          <Section
            title="11. Proibição de desvio de alunos"
            text="O formador não pode captar alunos da Regnum Noctis para lhes vender fora da plataforma os mesmos cursos, cursos relacionados, serviços complementares ou outros produtos, sem autorização expressa da Regnum Noctis. O formador não pode usar contactos obtidos através da plataforma para fins comerciais externos não autorizados."
          />

          <Section
            title="12. Proteção de dados"
            text="O formador compromete-se a tratar os dados pessoais a que tenha acesso com total confidencialidade e apenas para as finalidades autorizadas. É proibido copiar, guardar, exportar, vender, partilhar ou reutilizar dados de alunos ou candidatos fora do âmbito autorizado pela plataforma. O formador compromete-se a cumprir a legislação de proteção de dados aplicável."
          />

          <Section
            title="13. Propriedade intelectual"
            text="O formador mantém os direitos sobre os conteúdos de sua autoria, sem prejuízo da licença necessária para a Regnum Noctis os alojar, promover e disponibilizar aos alunos. O formador não pode usar materiais de terceiros sem a devida autorização. Caso existam denúncias fundadas de violação de direitos de autor, a Regnum Noctis poderá suspender ou remover imediatamente o conteúdo."
          />

          <Section
            title="14. Qualidade e revisão"
            text="A Regnum Noctis pode solicitar correções, melhorias, alterações técnicas, ajustes descritivos ou remoção de conteúdos. A plataforma pode recusar conteúdos que não cumpram os seus padrões de qualidade, seriedade, clareza, legalidade ou adequação editorial."
          />

          <Section
            title="15. Reembolsos, litígios e chargebacks"
            text="O formador reconhece que as vendas online podem originar reembolsos, litígios, reclamações e chargebacks. Sempre que tal aconteça, a Regnum Noctis poderá suspender temporariamente pagamentos relacionados com a operação em causa até verificação interna."
          />

          <Section
            title="16. Suspensão ou exclusão"
            text="A Regnum Noctis pode suspender, limitar ou encerrar o acesso do formador à plataforma em caso de incumprimento destes Termos, da lei ou das políticas internas. A suspensão ou exclusão pode ocorrer, nomeadamente, em caso de fraude, comportamento abusivo, quebra de confiança, violação de dados, violação de direitos de autor, incumprimento fiscal documentado ou tentativa de desvio de alunos."
          />

          <Section
            title="17. Ausência de garantia de rendimento"
            text="A Regnum Noctis não garante qualquer número mínimo de vendas, alunos, lucros, notoriedade ou resultados financeiros ao formador."
          />

          <Section
            title="18. Alterações"
            text="A Regnum Noctis pode alterar os presentes Termos e Condições sempre que necessário. A continuação da utilização da plataforma após a entrada em vigor das alterações vale como aceitação das mesmas."
          />

          <Section
            title="19. Lei aplicável"
            text="Na ausência de norma imperativa em contrário, estes Termos regem-se pela lei portuguesa."
          />
        </div>
      </section>
    </main>
  );
}

function Section({
  title,
  text,
}: {
  title: string;
  text: string;
}) {
  return (
    <section style={{ marginBottom: "22px" }}>
      <h2
        style={{
          fontFamily: "Cinzel, serif",
          fontSize: "clamp(22px, 3vw, 28px)",
          color: "#f0d79a",
          margin: "0 0 10px 0",
        }}
      >
        {title}
      </h2>

      <p
        style={{
          margin: 0,
        }}
      >
        {text}
      </p>
    </section>
  );
}