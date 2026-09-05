import { NextResponse } from "next/server";
import { db } from "@/db";
import { pedido } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { mesa } from "@/db/schema/mesa";

const pedidoStatuses = [
  "aberto",
  "em_preparacao",
  "pronto",
  "finalizado",
] as const;
type PedidoStatus = (typeof pedidoStatuses)[number];

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log("[API PEDIDO] Body recebido:", body);
    const { id, ...rest } = body;
    await db.insert(pedido).values(rest);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API PEDIDO] Erro ao inserir pedido:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor.", details: String(error) },
      { status: 500 },
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const mesa_id = searchParams.get("mesa_id");
    const statusParam = searchParams.get("status");
    const status = pedidoStatuses.includes(statusParam as PedidoStatus)
      ? (statusParam as PedidoStatus)
      : null;
    let result;

    if (id) {
      result = await db
        .select({
          id: pedido.id,
          datahora: pedido.datahora,
          status: pedido.status,
          funcionario_id: pedido.funcionario_id,
          mesa_id: pedido.mesa_id,
          mesa_numero: mesa.numero,
        })
        .from(pedido)
        .leftJoin(mesa, eq(pedido.mesa_id, mesa.id))
        .where(eq(pedido.id, id));

      if (!result.length) {
        return NextResponse.json(
          { error: "Pedido não encontrado." },
          { status: 404 },
        );
      }
      return NextResponse.json(result[0]);
    } else if (mesa_id && status) {
      result = await db
        .select({
          id: pedido.id,
          datahora: pedido.datahora,
          status: pedido.status,
          funcionario_id: pedido.funcionario_id,
          mesa_id: pedido.mesa_id,
          mesa_numero: mesa.numero,
        })
        .from(pedido)
        .leftJoin(mesa, eq(pedido.mesa_id, mesa.id))
        .where(and(eq(pedido.mesa_id, mesa_id), eq(pedido.status, status)));
      return NextResponse.json(result);
    } else if (mesa_id) {
      result = await db
        .select({
          id: pedido.id,
          datahora: pedido.datahora,
          status: pedido.status,
          funcionario_id: pedido.funcionario_id,
          mesa_id: pedido.mesa_id,
          mesa_numero: mesa.numero,
        })
        .from(pedido)
        .leftJoin(mesa, eq(pedido.mesa_id, mesa.id))
        .where(eq(pedido.mesa_id, mesa_id));
      return NextResponse.json(result);
    } else if (status) {
      result = await db
        .select({
          id: pedido.id,
          datahora: pedido.datahora,
          status: pedido.status,
          funcionario_id: pedido.funcionario_id,
          mesa_id: pedido.mesa_id,
          mesa_numero: mesa.numero,
        })
        .from(pedido)
        .leftJoin(mesa, eq(pedido.mesa_id, mesa.id))
        .where(eq(pedido.status, status));
      return NextResponse.json(result);
    } else {
      result = await db
        .select({
          id: pedido.id,
          datahora: pedido.datahora,
          status: pedido.status,
          funcionario_id: pedido.funcionario_id,
          mesa_id: pedido.mesa_id,
          mesa_numero: mesa.numero,
        })
        .from(pedido)
        .leftJoin(mesa, eq(pedido.mesa_id, mesa.id));
      return NextResponse.json(result);
    }
  } catch (error) {
    return NextResponse.json(
      { error: "Erro interno do servidor." },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, ...rest } = body;

    console.log("[PUT /api/pedido] Corpo recebido:", body);

    if (!id) {
      console.warn("Nenhum ID foi fornecido no body da requisição.");
      return NextResponse.json({ error: "ID obrigatório." }, { status: 400 });
    }

    const pedidoExistente = await db
      .select()
      .from(pedido)
      .where(eq(pedido.id, id));

    if (pedidoExistente.length === 0) {
      console.warn(`⚠️ Pedido com ID ${id} não encontrado no banco.`);
      return NextResponse.json(
        { error: "Pedido não encontrado." },
        { status: 404 },
      );
    }

    console.log("🛠️ Atualizando pedido:", { id, campos: rest });

    const resultado = await db
      .update(pedido)
      .set(rest)
      .where(eq(pedido.id, id))
      .returning();

    console.log("✅ Pedido atualizado com sucesso:", resultado[0]);

    return NextResponse.json(resultado[0]);
  } catch (error: any) {
    console.error("[ERRO PUT /api/pedido]:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor.", detalhes: String(error) },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "ID obrigatório." }, { status: 400 });
    }
    await db.delete(pedido).where(eq(pedido.id, id));
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Erro interno do servidor." },
      { status: 500 },
    );
  }
}
