import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function GET(request: NextRequest) {
  const supabaseAdmin = getSupabaseAdmin();

  try {
    const { searchParams } = new URL(request.url);
    const bucket = searchParams.get("bucket");
    const path = searchParams.get("path");

    if (!bucket || !path) {
      return NextResponse.json(
        { error: "Bucket ou path em falta." },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin.storage
      .from(bucket)
      .createSignedUrl(path, 120);

    if (error || !data?.signedUrl) {
      return NextResponse.json(
        { error: "Não foi possível gerar o link do documento." },
        { status: 500 }
      );
    }

    return NextResponse.redirect(data.signedUrl);
  } catch (error) {
    console.error("Erro ao abrir documento:", error);

    return NextResponse.json(
      { error: "Erro interno ao abrir documento." },
      { status: 500 }
    );
  }
}