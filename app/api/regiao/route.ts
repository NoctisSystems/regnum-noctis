import { NextRequest, NextResponse } from "next/server";

type RegiaoResposta = {
  ok: true;
  pais: string | null;
  regiao: "br" | "eu";
  origem: string;
};

function normalizarPais(valor: string | null) {
  if (!valor) return null;

  const limpo = valor.trim().toUpperCase();

  if (!limpo || limpo === "XX" || limpo === "UNKNOWN") {
    return null;
  }

  return limpo;
}

function obterPaisDoPedido(request: NextRequest) {
  const headers = request.headers;

  const candidatos = [
    headers.get("cf-ipcountry"),
    headers.get("x-vercel-ip-country"),
    headers.get("x-country-code"),
    headers.get("x-client-country"),
    headers.get("cloudfront-viewer-country"),
  ];

  for (const candidato of candidatos) {
    const pais = normalizarPais(candidato);

    if (pais) {
      return {
        pais,
        origem: "header",
      };
    }
  }

  return {
    pais: null,
    origem: "fallback",
  };
}

export async function GET(request: NextRequest) {
  const { pais, origem } = obterPaisDoPedido(request);

  const resposta: RegiaoResposta = {
    ok: true,
    pais,
    regiao: pais === "BR" ? "br" : "eu",
    origem,
  };

  return NextResponse.json(resposta, {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}