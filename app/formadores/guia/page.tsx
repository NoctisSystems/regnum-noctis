"use client";

import Link from "next/link";

type GuiaCardProps = {
  titulo: string;
  descricao: string;
  explicacao: string;
  nota?: string;
};

export default function GuiaFormadorPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top, rgba(166,120,61,0.08), transparent 20%), #2b160f",
        color: "#e6c27a",
        fontFamily: "Cormorant Garamond, serif",
        padding: "50px 16px 90px",
      }}
    >
      <section
        style={{
          maxWidth: "1280px",
          margin: "0 auto",
        }}
      >
        <header style={{ marginBottom: "28px" }}>
          <p
            style={{
              margin: "0 0 10px 0",
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: "#caa15a",
              fontSize: "15px",
            }}
          >
            Área do Formador
          </p>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
              gap: "18px",
              flexWrap: "wrap",
            }}
          >
            <div>
              <h1
                style={{
                  margin: 0,
                  fontFamily: "Cinzel, serif",
                  fontSize: "clamp(34px, 6vw, 64px)",
                  lineHeight: 1.1,
                  color: "#f0d79a",
                  fontWeight: 500,
                }}
              >
                Guia do Formador
              </h1>

              <p
                style={{
                  margin: "14px 0 0 0",
                  maxWidth: "900px",
                  fontSize: "21px",
                  lineHeight: 1.75,
                  color: "#d7b06c",
                }}
              >
                Esta área foi pensada para te orientar na utilização da tua conta
                de formador e na melhor forma de apresentar, estruturar e
                valorizar os teus cursos dentro da plataforma.
              </p>
            </div>

            <div
              style={{
                display: "flex",
                gap: "12px",
                flexWrap: "wrap",
              }}
            >
              <Link href="/formadores/dashboard" style={botaoSecundario}>
                Voltar à dashboard
              </Link>

              <Link href="/formadores/criar-curso" style={botao}>
                Criar curso
              </Link>
            </div>
          </div>
        </header>

        <section
          style={{
            border: "1px solid #8a5d31",
            background:
              "linear-gradient(180deg, rgba(20,13,9,0.98) 0%, rgba(16,10,8,0.98) 100%)",
            padding: "clamp(20px, 3vw, 30px)",
            boxShadow:
              "0 18px 42px rgba(0,0,0,0.24), inset 0 1px 0 rgba(255,225,170,0.03)",
            marginBottom: "30px",
          }}
        >
          <SectionTitle
            titulo="Como tirar melhor partido da tua área de formador"
            subtitulo="Orientação geral"
          />

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: "18px",
            }}
          >
            <InfoPill texto="Podes organizar o teu curso por módulos, aulas e materiais." />
            <InfoPill texto="Uma aula introdutória clara ajuda o aluno a perceber o valor do curso." />
            <InfoPill texto="Sempre que fizer sentido, uma aula gratuita pode aumentar a confiança do potencial aluno." />
            <InfoPill texto="O curso pode ser gravado com câmara, slides narrados ou em formato misto." />
            <InfoPill texto="Uma boa capa, título e descrição ajudam a apresentar melhor o teu trabalho." />
            <InfoPill texto="A estrutura e a clareza do conteúdo também influenciam a decisão de compra." />
          </div>
        </section>

        <section style={{ marginBottom: "32px" }}>
          <SectionTitle
            titulo="Áreas principais da tua conta"
            subtitulo="Cards ilustrativos"
          />

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
              gap: "18px",
            }}
          >
            <GuiaCard
              titulo="Criar curso"
              descricao="Cria um novo curso e começa a estruturar módulos, aulas e materiais."
              explicacao="Aqui defines a base do teu curso. O ideal é começares com um título claro, uma descrição objetiva e uma ideia bem definida do que o aluno irá aprender."
              nota="Sempre que possível, pensa desde início na ordem lógica do conteúdo."
            />

            <GuiaCard
              titulo="Os meus cursos"
              descricao="Consulta os teus cursos, edita conteúdos e acompanha a estrutura de cada formação."
              explicacao="Nesta área podes rever os teus cursos, ajustar informações, melhorar descrições, afinar a apresentação e continuar o trabalho sempre que precisares."
              nota="É uma boa prática rever regularmente a apresentação do curso e a sua estrutura."
            />

            <GuiaCard
              titulo="Alunos inscritos"
              descricao="Acompanha quem comprou os teus cursos e consulta o progresso dos alunos."
              explicacao="Esta área ajuda-te a ter uma visão mais concreta da tua atividade formativa e do acompanhamento dos teus alunos dentro da plataforma."
            />

            <GuiaCard
              titulo="Comunidades"
              descricao="Entra nas comunidades internas dos teus cursos e responde às dúvidas das turmas."
              explicacao="As comunidades permitem manter proximidade com os alunos, responder a dúvidas e enriquecer a experiência formativa para além do conteúdo principal."
              nota="Uma comunidade ativa pode reforçar a confiança e o envolvimento dos alunos."
            />

            <GuiaCard
              titulo="Suporte interno"
              descricao="Fala diretamente com a administração para ausências, problemas técnicos, pagamentos ou apoio operacional."
              explicacao="Sempre que surja uma questão técnica, operacional ou administrativa, esta é a via mais indicada para contacto interno com a plataforma."
            />

            <GuiaCard
              titulo="Tickets"
              descricao="Consulta os tickets em que foste envolvido pela administração para esclarecer o aluno."
              explicacao="Quando a administração precisar da tua participação num assunto ligado a um aluno ou a um curso, essa comunicação ficará organizada nesta área."
            />

            <GuiaCard
              titulo="Levantamentos"
              descricao="Consulta saldos, acompanha pedidos enviados e trata do envio de documentação para levantamento."
              explicacao="Aqui acompanhas o estado dos teus saldos e pedidos de levantamento, bem como a documentação necessária para validação pela administração."
            />
          </div>
        </section>

        <section
          style={{
            border: "1px solid #8a5d31",
            background:
              "linear-gradient(180deg, rgba(20,13,9,0.98) 0%, rgba(16,10,8,0.98) 100%)",
            padding: "clamp(20px, 3vw, 30px)",
            boxShadow:
              "0 18px 42px rgba(0,0,0,0.24), inset 0 1px 0 rgba(255,225,170,0.03)",
            marginBottom: "30px",
          }}
        >
          <SectionTitle
            titulo="Apresentação do curso"
            subtitulo="Boas práticas"
          />

          <div
            style={{
              display: "grid",
              gap: "18px",
            }}
          >
            <TextoBloco
              titulo="Começa por uma introdução clara"
              texto="É recomendável que o curso tenha uma entrada clara e profissional. Uma primeira aula introdutória pode explicar o tema, a metodologia, o tipo de abordagem adotada e o que o aluno poderá esperar ao longo da formação."
            />

            <TextoBloco
              titulo="Explica o que o aluno vai aprender"
              texto="Um curso tende a ser mais apelativo quando o aluno percebe, de forma objetiva, quais são os conteúdos, as etapas e o propósito prático da aprendizagem. Quanto mais clara for essa perceção, maior tende a ser a confiança na compra."
            />

            <TextoBloco
              titulo="Usa a tua apresentação a teu favor"
              texto="A forma como apresentas o curso também comunica valor. Um título forte, uma descrição bem escrita, uma estrutura lógica e uma boa aula introdutória ajudam a transmitir profissionalismo e consistência."
            />
          </div>
        </section>

        <section
          style={{
            border: "1px solid #8a5d31",
            background:
              "linear-gradient(180deg, rgba(20,13,9,0.98) 0%, rgba(16,10,8,0.98) 100%)",
            padding: "clamp(20px, 3vw, 30px)",
            boxShadow:
              "0 18px 42px rgba(0,0,0,0.24), inset 0 1px 0 rgba(255,225,170,0.03)",
            marginBottom: "30px",
          }}
        >
          <SectionTitle
            titulo="Aula gratuita e demonstração"
            subtitulo="Apresentação comercial do curso"
          />

          <div
            style={{
              display: "grid",
              gap: "18px",
            }}
          >
            <TextoBloco
              titulo="Uma aula gratuita pode ajudar a converter"
              texto="Sempre que fizer sentido para o teu tipo de curso, disponibilizar uma aula de demonstração pode ser uma boa forma de apresentar o teu método, o teu tom de comunicação e a qualidade do conteúdo ao potencial aluno."
            />

            <TextoBloco
              titulo="A aula gratuita não precisa de revelar tudo"
              texto="A ideia não é entregar o conteúdo principal sem necessidade, mas sim permitir ao interessado perceber o estilo da formação, a clareza da explicação e a seriedade do curso."
            />

            <TextoBloco
              titulo="A introdução é muitas vezes a melhor escolha"
              texto="Em muitos casos, a aula introdutória é a melhor candidata para demonstração pública, porque enquadra o curso, apresenta o tema e cria proximidade sem comprometer o valor global do conteúdo pago."
            />
          </div>
        </section>

        <section
          style={{
            border: "1px solid #8a5d31",
            background:
              "linear-gradient(180deg, rgba(20,13,9,0.98) 0%, rgba(16,10,8,0.98) 100%)",
            padding: "clamp(20px, 3vw, 30px)",
            boxShadow:
              "0 18px 42px rgba(0,0,0,0.24), inset 0 1px 0 rgba(255,225,170,0.03)",
            marginBottom: "30px",
          }}
        >
          <SectionTitle
            titulo="Formatos possíveis para o conteúdo"
            subtitulo="Como podes gravar o teu curso"
          />

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: "18px",
            }}
          >
            <FormatoCard
              titulo="Vídeo com câmara"
              texto="Indicado para quem quer uma apresentação mais direta e pessoal, com maior proximidade visual com o aluno."
            />

            <FormatoCard
              titulo="Slides narrados"
              texto="Uma opção muito válida para conteúdos teóricos, estruturados e mais densos, mantendo clareza e organização."
            />

            <FormatoCard
              titulo="Formato misto"
              texto="Combina presença em vídeo com slides, imagens ou materiais de apoio, permitindo um equilíbrio entre explicação e estrutura visual."
            />

            <FormatoCard
              titulo="Outros formatos adequados"
              texto="O mais importante é que o formato escolhido sirva bem o conteúdo, a tua forma de ensinar e a experiência do aluno."
            />
          </div>
        </section>

        <section
          style={{
            border: "1px solid #8a5d31",
            background:
              "linear-gradient(180deg, rgba(20,13,9,0.98) 0%, rgba(16,10,8,0.98) 100%)",
            padding: "clamp(20px, 3vw, 30px)",
            boxShadow:
              "0 18px 42px rgba(0,0,0,0.24), inset 0 1px 0 rgba(255,225,170,0.03)",
          }}
        >
          <SectionTitle
            titulo="Resumo prático"
            subtitulo="Em termos simples"
          />

          <div
            style={{
              display: "grid",
              gap: "14px",
            }}
          >
            <ResumoLinha texto="Organiza o curso de forma clara e progressiva." />
            <ResumoLinha texto="Apresenta bem o conteúdo antes de vender." />
            <ResumoLinha texto="Considera usar uma aula introdutória como demonstração." />
            <ResumoLinha texto="Escolhe o formato de gravação mais adequado ao teu método." />
            <ResumoLinha texto="Usa a tua área de formador como ferramenta de organização e valorização do teu trabalho." />
          </div>

          <div
            style={{
              marginTop: "24px",
              display: "flex",
              gap: "12px",
              flexWrap: "wrap",
            }}
          >
            <Link href="/formadores/criar-curso" style={botao}>
              Criar novo curso
            </Link>

            <Link href="/formadores/cursos" style={botaoSecundario}>
              Ir para os meus cursos
            </Link>
          </div>
        </section>
      </section>
    </main>
  );
}

function SectionTitle({
  titulo,
  subtitulo,
}: {
  titulo: string;
  subtitulo: string;
}) {
  return (
    <div style={{ marginBottom: "18px" }}>
      <p
        style={{
          margin: "0 0 8px 0",
          fontSize: "14px",
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: "#caa15a",
        }}
      >
        {subtitulo}
      </p>

      <h2
        style={{
          margin: 0,
          fontFamily: "Cinzel, serif",
          fontSize: "clamp(28px, 4vw, 40px)",
          color: "#f0d79a",
          fontWeight: 500,
        }}
      >
        {titulo}
      </h2>
    </div>
  );
}

function GuiaCard({
  titulo,
  descricao,
  explicacao,
  nota,
}: GuiaCardProps) {
  return (
    <article
      style={{
        border: "1px solid #8a5d31",
        background:
          "linear-gradient(180deg, rgba(20,13,9,0.98) 0%, rgba(16,10,8,0.98) 100%)",
        padding: "22px",
        boxShadow:
          "0 12px 26px rgba(0,0,0,0.16), inset 0 1px 0 rgba(255,225,170,0.03)",
      }}
    >
      <div
        style={{
          border: "1px solid rgba(166,120,61,0.22)",
          background: "rgba(32,18,13,0.45)",
          padding: "22px",
          minHeight: "220px",
          display: "flex",
          flexDirection: "column",
          marginBottom: "18px",
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
            margin: 0,
            fontSize: "clamp(18px, 2vw, 20px)",
            color: "#d7b06c",
            lineHeight: 1.7,
            flex: 1,
          }}
        >
          {descricao}
        </p>

        <span style={botaoIlustrativo}>Exemplo ilustrativo</span>
      </div>

      <p
        style={{
          margin: "0 0 10px 0",
          fontSize: "20px",
          color: "#e2c68d",
          lineHeight: 1.75,
        }}
      >
        {explicacao}
      </p>

      {nota ? (
        <p
          style={{
            margin: 0,
            fontSize: "18px",
            color: "#caa15a",
            lineHeight: 1.7,
            fontStyle: "italic",
          }}
        >
          {nota}
        </p>
      ) : null}
    </article>
  );
}

function TextoBloco({
  titulo,
  texto,
}: {
  titulo: string;
  texto: string;
}) {
  return (
    <article
      style={{
        border: "1px solid rgba(166,120,61,0.22)",
        background: "rgba(32,18,13,0.45)",
        padding: "22px",
      }}
    >
      <h3
        style={{
          margin: "0 0 12px 0",
          fontFamily: "Cinzel, serif",
          fontSize: "clamp(24px, 3vw, 30px)",
          color: "#e6c27a",
          fontWeight: 500,
        }}
      >
        {titulo}
      </h3>

      <p
        style={{
          margin: 0,
          fontSize: "20px",
          color: "#d7b06c",
          lineHeight: 1.8,
        }}
      >
        {texto}
      </p>
    </article>
  );
}

function FormatoCard({
  titulo,
  texto,
}: {
  titulo: string;
  texto: string;
}) {
  return (
    <article
      style={{
        border: "1px solid rgba(166,120,61,0.22)",
        background: "rgba(32,18,13,0.45)",
        padding: "22px",
        minHeight: "180px",
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
          margin: 0,
          fontSize: "19px",
          color: "#d7b06c",
          lineHeight: 1.75,
        }}
      >
        {texto}
      </p>
    </article>
  );
}

function InfoPill({ texto }: { texto: string }) {
  return (
    <div
      style={{
        border: "1px solid rgba(166,120,61,0.28)",
        background: "rgba(32,18,13,0.45)",
        padding: "16px 18px",
        color: "#dfbe81",
        fontSize: "18px",
        lineHeight: 1.6,
      }}
    >
      {texto}
    </div>
  );
}

function ResumoLinha({ texto }: { texto: string }) {
  return (
    <div
      style={{
        border: "1px solid rgba(166,120,61,0.22)",
        background: "rgba(32,18,13,0.45)",
        padding: "18px 20px",
        color: "#dfbe81",
        fontSize: "20px",
        lineHeight: 1.7,
      }}
    >
      {texto}
    </div>
  );
}

const botao: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  textDecoration: "none",
  border: "1px solid #a6783d",
  color: "#e6c27a",
  padding: "14px 18px",
  fontSize: "16px",
  background: "transparent",
  textAlign: "center",
};

const botaoSecundario: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  textDecoration: "none",
  border: "1px solid rgba(166,120,61,0.6)",
  color: "#e6c27a",
  padding: "12px 16px",
  fontSize: "15px",
  background: "rgba(32,18,13,0.55)",
  cursor: "pointer",
  textAlign: "center",
};

const botaoIlustrativo: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  border: "1px solid #a6783d",
  color: "#e6c27a",
  padding: "14px 18px",
  fontSize: "16px",
  background: "transparent",
  textAlign: "center",
  opacity: 0.85,
};