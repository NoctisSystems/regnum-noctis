import { headers } from "next/headers";

export type RegiaoCheckout = "EU" | "BR";

export type CursoComRegiao = {
  preco: number | null;
  preco_eur: number | null;
  preco_brl: number | null;
  checkout_eu_ativo: boolean | null;
  checkout_br_ativo: boolean | null;
};

export type PrecoCursoResolvido = {
  regiao: RegiaoCheckout;
  texto: string;
  subtexto: string;
  disponivel: boolean;
  moeda: "EUR" | "BRL" | null;
  valor: number | null;
};

export const COOKIE_REGIAO_CHECKOUT = "regiao_checkout";

export function normalizarRegiaoCheckout(
  valor: string | null | undefined
): RegiaoCheckout | null {
  const normalizada = (valor || "").trim().toUpperCase();

  if (normalizada === "EU") return "EU";
  if (normalizada === "BR") return "BR";

  return null;
}

export async function inferirRegiaoCheckoutPorHeaders(): Promise<RegiaoCheckout> {
  const headerStore = await headers();
  const acceptLanguage = headerStore.get("accept-language") || "";
  const normalizado = acceptLanguage.toLowerCase();

  if (normalizado.includes("pt-br") || normalizado.includes("br")) {
    return "BR";
  }

  return "EU";
}

export async function resolverRegiaoCheckout(
  regiaoQuery?: string | string[] | null,
  regiaoCookie?: string | null
): Promise<RegiaoCheckout> {
  const valorQuery = Array.isArray(regiaoQuery) ? regiaoQuery[0] : regiaoQuery;

  const regiaoNormalizadaQuery = normalizarRegiaoCheckout(valorQuery);
  if (regiaoNormalizadaQuery) {
    return regiaoNormalizadaQuery;
  }

  const regiaoNormalizadaCookie = normalizarRegiaoCheckout(regiaoCookie);
  if (regiaoNormalizadaCookie) {
    return regiaoNormalizadaCookie;
  }

  return inferirRegiaoCheckoutPorHeaders();
}

export function obterPrecoEur(curso: CursoComRegiao): number | null {
  if (typeof curso.preco_eur === "number") return curso.preco_eur;
  if (typeof curso.preco === "number") return curso.preco;
  return null;
}

export function obterPrecoBrl(curso: CursoComRegiao): number | null {
  if (typeof curso.preco_brl === "number") return curso.preco_brl;
  return null;
}

export function formatarMoeda(
  valor: number | null,
  moeda: "EUR" | "BRL"
): string {
  if (typeof valor !== "number") {
    return "Preço em atualização";
  }

  return new Intl.NumberFormat(moeda === "EUR" ? "pt-PT" : "pt-BR", {
    style: "currency",
    currency: moeda,
  }).format(valor);
}

export function obterPrecoCursoPorRegiao(
  curso: CursoComRegiao,
  regiao: RegiaoCheckout
): PrecoCursoResolvido {
  const precoEur = obterPrecoEur(curso);
  const precoBrl = obterPrecoBrl(curso);

  if (regiao === "BR") {
    if (curso.checkout_br_ativo && precoBrl !== null) {
      return {
        regiao,
        texto: formatarMoeda(precoBrl, "BRL"),
        subtexto:
          "Preço preparado para a região comercial BR. A validação final do checkout será feita no backend.",
        disponivel: true,
        moeda: "BRL",
        valor: precoBrl,
      };
    }

    if (curso.checkout_eu_ativo && precoEur !== null) {
      return {
        regiao,
        texto: formatarMoeda(precoEur, "EUR"),
        subtexto:
          "O checkout BR ainda não está ativo neste conteúdo. Neste momento existe apenas checkout europeu.",
        disponivel: false,
        moeda: "EUR",
        valor: precoEur,
      };
    }

    return {
      regiao,
      texto: "Preço em atualização",
      subtexto:
        "Este conteúdo ainda não tem checkout ativo para a região BR.",
      disponivel: false,
      moeda: null,
      valor: null,
    };
  }

  if (curso.checkout_eu_ativo && precoEur !== null) {
    return {
      regiao,
      texto: formatarMoeda(precoEur, "EUR"),
      subtexto:
        "Preço preparado para a região comercial EU. A validação final do checkout será feita no backend.",
      disponivel: true,
      moeda: "EUR",
      valor: precoEur,
    };
  }

  if (curso.checkout_br_ativo && precoBrl !== null) {
    return {
      regiao,
      texto: formatarMoeda(precoBrl, "BRL"),
      subtexto:
        "O checkout EU ainda não está ativo neste conteúdo. Neste momento existe apenas checkout BR.",
      disponivel: false,
      moeda: "BRL",
      valor: precoBrl,
    };
  }

  return {
    regiao,
    texto: "Preço em atualização",
    subtexto:
      "Este conteúdo ainda não tem checkout ativo para a região EU.",
    disponivel: false,
    moeda: null,
    valor: null,
  };
}

export function resolverCheckoutCurso(
  curso: CursoComRegiao,
  regiao: RegiaoCheckout
): {
  disponivel: boolean;
  erro: string | null;
  moeda: "EUR" | "BRL";
  valor: number | null;
} {
  const precoEur = obterPrecoEur(curso);
  const precoBrl = obterPrecoBrl(curso);

  if (regiao === "EU") {
    if (!curso.checkout_eu_ativo) {
      return {
        disponivel: false,
        erro: "Este curso não está disponível para checkout EU.",
        moeda: "EUR",
        valor: null,
      };
    }

    if (precoEur === null) {
      return {
        disponivel: false,
        erro: "Este curso não tem preço EUR configurado.",
        moeda: "EUR",
        valor: null,
      };
    }

    return {
      disponivel: true,
      erro: null,
      moeda: "EUR",
      valor: precoEur,
    };
  }

  if (!curso.checkout_br_ativo) {
    return {
      disponivel: false,
      erro: "Este curso não está disponível para checkout BR.",
      moeda: "BRL",
      valor: null,
    };
  }

  if (precoBrl === null) {
    return {
      disponivel: false,
      erro: "Este curso não tem preço BRL configurado.",
      moeda: "BRL",
      valor: null,
    };
  }

  return {
    disponivel: true,
    erro: null,
    moeda: "BRL",
    valor: precoBrl,
  };
}