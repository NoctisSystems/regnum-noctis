import tls from "node:tls";

type EnviarEmailParams = {
  to: string;
  subject: string;
  text: string;
};

type SMTPConfig = {
  host: string;
  port: number;
  user: string;
  pass: string;
  from: string;
};

function obterSMTPConfig(): SMTPConfig {
  const host = process.env.SMTP_HOST || "smtp.gmail.com";
  const port = Number(process.env.SMTP_PORT || 465);
  const user = process.env.SMTP_USER || "";
  const pass = process.env.SMTP_PASS || "";
  const from = process.env.SMTP_FROM || user;

  if (!user || !pass || !from) {
    throw new Error("Configuração SMTP incompleta.");
  }

  return {
    host,
    port,
    user,
    pass,
    from,
  };
}

function codificarBase64(valor: string) {
  return Buffer.from(valor, "utf8").toString("base64");
}

function limparHeader(valor: string) {
  return valor.replace(/[\r\n]+/g, " ").trim();
}

function criarMensagemEmail(params: {
  from: string;
  to: string;
  subject: string;
  text: string;
}) {
  const from = limparHeader(params.from);
  const to = limparHeader(params.to);
  const subject = limparHeader(params.subject);

  return [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${subject}`,
    "MIME-Version: 1.0",
    'Content-Type: text/plain; charset="UTF-8"',
    "Content-Transfer-Encoding: 8bit",
    "",
    params.text,
  ].join("\r\n");
}

function lerResposta(socket: tls.TLSSocket): Promise<string> {
  return new Promise((resolve, reject) => {
    let buffer = "";

    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error("Timeout na resposta SMTP."));
    }, 15000);

    function cleanup() {
      clearTimeout(timeout);
      socket.off("data", onData);
      socket.off("error", onError);
    }

    function onError(error: Error) {
      cleanup();
      reject(error);
    }

    function onData(data: Buffer) {
      buffer += data.toString("utf8");

      const linhas = buffer.split(/\r?\n/).filter(Boolean);
      const ultimaLinha = linhas[linhas.length - 1];

      if (/^\d{3}\s/.test(ultimaLinha || "")) {
        cleanup();
        resolve(buffer);
      }
    }

    socket.on("data", onData);
    socket.on("error", onError);
  });
}

async function comando(socket: tls.TLSSocket, linha: string) {
  socket.write(`${linha}\r\n`);
  const resposta = await lerResposta(socket);

  if (!/^(2|3)\d{2}/.test(resposta)) {
    throw new Error(`Erro SMTP em "${linha}": ${resposta}`);
  }

  return resposta;
}

export async function enviarEmail(params: EnviarEmailParams) {
  const config = obterSMTPConfig();

  const socket = tls.connect({
    host: config.host,
    port: config.port,
    servername: config.host,
  });

  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error("Timeout ao ligar ao SMTP."));
    }, 15000);

    socket.once("secureConnect", () => {
      clearTimeout(timeout);
      resolve();
    });

    socket.once("error", (error) => {
      clearTimeout(timeout);
      reject(error);
    });
  });

  try {
    await lerResposta(socket);

    await comando(socket, `EHLO ${config.host}`);
    await comando(socket, "AUTH LOGIN");
    await comando(socket, codificarBase64(config.user));
    await comando(socket, codificarBase64(config.pass));
    await comando(socket, `MAIL FROM:<${config.from}>`);
    await comando(socket, `RCPT TO:<${params.to}>`);
    await comando(socket, "DATA");

    const mensagem = criarMensagemEmail({
      from: config.from,
      to: params.to,
      subject: params.subject,
      text: params.text,
    });

    socket.write(`${mensagem}\r\n.\r\n`);

    const respostaData = await lerResposta(socket);

    if (!/^250/.test(respostaData)) {
      throw new Error(`Erro SMTP ao enviar mensagem: ${respostaData}`);
    }

    await comando(socket, "QUIT");

    return {
      ok: true,
    };
  } finally {
    socket.end();
  }
}

export function emailAdminRegnum() {
  return process.env.ADMIN_ALERT_EMAIL || "geral.regnumnoctis@gmail.com";
}