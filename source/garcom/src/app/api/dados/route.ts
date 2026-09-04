import { NextResponse } from "next/server";
import { getDados } from "@/lib/getDados";

export async function GET() {
  const dados = await getDados();
  if (!dados) {
    return NextResponse.json({ erro: "Não autenticado" }, { status: 401 });
  }
  return NextResponse.json(dados);
}
