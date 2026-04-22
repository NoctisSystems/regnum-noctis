import "server-only";

type BunnyDirKey =
  | "pdfs"
  | "certificados"
  | "anexos"
  | "pdfsCursos"
  | "pdfsManuais"
  | "comprovativos"
  | "auditoria";

type UploadInput = {
  fileName: string;
  content: Buffer | ArrayBuffer | Uint8Array;
  contentType?: string;
  directory?: string;
};

type UploadResult = {
  ok: true;
  storagePath: string;
  fileName: string;
  directory: string;
};

const HOSTNAME = obterEnvObrigatoria("BUNNY_STORAGE_HOSTNAME");
const ZONE = obterEnvObrigatoria("BUNNY_STORAGE_ZONE");
const PASSWORD = obterEnvObrigatoria("BUNNY_STORAGE_PASSWORD");
const BASE_URL =
  process.env.BUNNY_STORAGE_BASE_URL?.trim() || `https://${HOSTNAME}`;

const DIRS: Record<BunnyDirKey, string> = {
  pdfs: process.env.BUNNY_STORAGE_PDFS_DIR?.trim() || "pdfs",
  certificados:
    process.env.BUNNY_STORAGE_CERTIFICADOS_DIR?.trim() || "certificados",
  anexos: process.env.BUNNY_STORAGE_ANEXOS_DIR?.trim() || "anexos",
  pdfsCursos:
    process.env.BUNNY_STORAGE_PDFS_CURSOS_DIR?.trim() || "pdfs/cursos",
  pdfsManuais:
    process.env.BUNNY_STORAGE_PDFS_MANUAIS_DIR?.trim() || "pdfs/manuais",
  comprovativos:
    process.env.BUNNY_STORAGE_COMPROVATIVOS_DIR?.trim() ||
    "levantamentos/comprovativos",
  auditoria:
    process.env.BUNNY_STORAGE_AUDITORIA_DIR?.trim() ||
    "auditoria/logs-exportados",
};

function obterEnvObrigatoria(nome: string): string {
  const valor = process.env[nome]?.trim();

  if (!valor) {
    throw new Error(`Variável de ambiente em falta: ${nome}`);
  }

  return valor;
}

function normalizarSegmento(valor: string): string {
  return valor
    .trim()
    .replace(/\\/g, "/")
    .replace(/^\/+/, "")
    .replace(/\/+/g, "/")
    .replace(/\/+$/, "");
}

function normalizarNomeFicheiro(valor: string): string {
  const base = valor
    .trim()
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, "-")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

  if (!base) {
    throw new Error("Nome de ficheiro inválido.");
  }

  return base;
}

function construirStoragePath(directory: string, fileName: string): string {
  const dirNormalizada = normalizarSegmento(directory);
  const ficheiroNormalizado = normalizarNomeFicheiro(fileName);

  return dirNormalizada
    ? `${dirNormalizada}/${ficheiroNormalizado}`
    : ficheiroNormalizado;
}

function construirUrlApi(storagePath: string): string {
  const path = normalizarSegmento(storagePath);
  return `${BASE_URL.replace(/\/+$/, "")}/${ZONE}/${path}`;
}

function contentParaArrayBuffer(
  content: Buffer | ArrayBuffer | Uint8Array
): ArrayBuffer {
  if (content instanceof ArrayBuffer) {
    return content;
  }

  if (Buffer.isBuffer(content)) {
    return content.buffer.slice(
      content.byteOffset,
      content.byteOffset + content.byteLength
    ) as ArrayBuffer;
  }

  return content.buffer.slice(
    content.byteOffset,
    content.byteOffset + content.byteLength
  ) as ArrayBuffer;
}

function contentParaBlob(
  content: Buffer | ArrayBuffer | Uint8Array,
  contentType: string
): Blob {
  const arrayBuffer = contentParaArrayBuffer(content);
  return new Blob([arrayBuffer], { type: contentType });
}

function obterDirectoryPorChave(key: BunnyDirKey): string {
  return DIRS[key];
}

export function gerarCaminhoPdfCurso(params: {
  formadorAuthId: string;
  cursoId?: number | string | null;
  fileName: string;
}) {
  const cursoSegmento =
    params.cursoId !== null && params.cursoId !== undefined
      ? `curso-${String(params.cursoId)}`
      : "curso-sem-id";

  return construirStoragePath(
    `${DIRS.pdfsCursos}/formadores/${normalizarSegmento(
      params.formadorAuthId
    )}/${cursoSegmento}`,
    params.fileName
  );
}

export function gerarCaminhoPdfManual(params: {
  formadorAuthId: string;
  cursoId?: number | string | null;
  fileName: string;
}) {
  const cursoSegmento =
    params.cursoId !== null && params.cursoId !== undefined
      ? `curso-${String(params.cursoId)}`
      : "curso-sem-id";

  return construirStoragePath(
    `${DIRS.pdfsManuais}/formadores/${normalizarSegmento(
      params.formadorAuthId
    )}/${cursoSegmento}`,
    params.fileName
  );
}

export function gerarCaminhoCertificado(params: {
  formadorAuthId: string;
  cursoId?: number | string | null;
  fileName: string;
}) {
  const cursoSegmento =
    params.cursoId !== null && params.cursoId !== undefined
      ? `curso-${String(params.cursoId)}`
      : "curso-sem-id";

  return construirStoragePath(
    `${DIRS.certificados}/formadores/${normalizarSegmento(
      params.formadorAuthId
    )}/${cursoSegmento}`,
    params.fileName
  );
}

export function gerarCaminhoAnexoAula(params: {
  formadorAuthId: string;
  cursoId?: number | string | null;
  aulaId?: number | string | null;
  fileName: string;
}) {
  const cursoSegmento =
    params.cursoId !== null && params.cursoId !== undefined
      ? `curso-${String(params.cursoId)}`
      : "curso-sem-id";

  const aulaSegmento =
    params.aulaId !== null && params.aulaId !== undefined
      ? `aula-${String(params.aulaId)}`
      : "aula-sem-id";

  return construirStoragePath(
    `${DIRS.anexos}/formadores/${normalizarSegmento(
      params.formadorAuthId
    )}/${cursoSegmento}/${aulaSegmento}`,
    params.fileName
  );
}

export async function uploadToBunny({
  fileName,
  content,
  contentType = "application/octet-stream",
  directory = "",
}: UploadInput): Promise<UploadResult> {
  const storagePath = construirStoragePath(directory, fileName);
  const url = construirUrlApi(storagePath);
  const body = contentParaBlob(content, contentType);

  const response = await fetch(url, {
    method: "PUT",
    headers: {
      AccessKey: PASSWORD,
      "Content-Type": contentType,
    },
    body,
    cache: "no-store",
  });

  if (!response.ok) {
    const detalhe = await tentarLerTexto(response);
    throw new Error(
      `Falha no upload para Bunny Storage (${response.status}). ${detalhe}`
    );
  }

  return {
    ok: true,
    storagePath,
    fileName: normalizarNomeFicheiro(fileName),
    directory: normalizarSegmento(directory),
  };
}

export async function uploadPdfCurso(params: {
  formadorAuthId: string;
  cursoId?: number | string | null;
  fileName: string;
  content: Buffer | ArrayBuffer | Uint8Array;
}) {
  const storagePath = gerarCaminhoPdfCurso({
    formadorAuthId: params.formadorAuthId,
    cursoId: params.cursoId,
    fileName: params.fileName,
  });

  return uploadToBunny({
    fileName: storagePath.split("/").pop() || params.fileName,
    directory: storagePath.split("/").slice(0, -1).join("/"),
    content: params.content,
    contentType: "application/pdf",
  });
}

export async function uploadPdfManual(params: {
  formadorAuthId: string;
  cursoId?: number | string | null;
  fileName: string;
  content: Buffer | ArrayBuffer | Uint8Array;
}) {
  const storagePath = gerarCaminhoPdfManual({
    formadorAuthId: params.formadorAuthId,
    cursoId: params.cursoId,
    fileName: params.fileName,
  });

  return uploadToBunny({
    fileName: storagePath.split("/").pop() || params.fileName,
    directory: storagePath.split("/").slice(0, -1).join("/"),
    content: params.content,
    contentType: "application/pdf",
  });
}

export async function uploadCertificado(params: {
  formadorAuthId: string;
  cursoId?: number | string | null;
  fileName: string;
  content: Buffer | ArrayBuffer | Uint8Array;
  contentType?: string;
}) {
  const storagePath = gerarCaminhoCertificado({
    formadorAuthId: params.formadorAuthId,
    cursoId: params.cursoId,
    fileName: params.fileName,
  });

  return uploadToBunny({
    fileName: storagePath.split("/").pop() || params.fileName,
    directory: storagePath.split("/").slice(0, -1).join("/"),
    content: params.content,
    contentType: params.contentType || "application/octet-stream",
  });
}

export async function uploadAnexoAula(params: {
  formadorAuthId: string;
  cursoId?: number | string | null;
  aulaId?: number | string | null;
  fileName: string;
  content: Buffer | ArrayBuffer | Uint8Array;
  contentType?: string;
}) {
  const storagePath = gerarCaminhoAnexoAula({
    formadorAuthId: params.formadorAuthId,
    cursoId: params.cursoId,
    aulaId: params.aulaId,
    fileName: params.fileName,
  });

  return uploadToBunny({
    fileName: storagePath.split("/").pop() || params.fileName,
    directory: storagePath.split("/").slice(0, -1).join("/"),
    content: params.content,
    contentType: params.contentType || "application/octet-stream",
  });
}

export async function deleteFromBunny(storagePath: string): Promise<void> {
  const pathNormalizado = normalizarSegmento(storagePath);
  const url = construirUrlApi(pathNormalizado);

  const response = await fetch(url, {
    method: "DELETE",
    headers: {
      AccessKey: PASSWORD,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const detalhe = await tentarLerTexto(response);
    throw new Error(
      `Falha ao apagar ficheiro do Bunny Storage (${response.status}). ${detalhe}`
    );
  }
}

export function getBunnyStoragePathUrl(storagePath: string): string {
  return construirUrlApi(storagePath);
}

export function getBunnyDirectory(key: BunnyDirKey): string {
  return obterDirectoryPorChave(key);
}

async function tentarLerTexto(response: Response): Promise<string> {
  try {
    const texto = (await response.text()).trim();
    return texto || "Sem detalhe adicional.";
  } catch {
    return "Sem detalhe adicional.";
  }
}