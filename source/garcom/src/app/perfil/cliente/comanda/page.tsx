"use client";
import { Header } from "@/components/cliente-header";
import { Footer } from "@/components/cliente-footer";
import { CardPedido } from "./CardPedido";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Suspense } from "react";

function ClienteComandaContent() {
  const searchParams = useSearchParams();
  const mesa_id = searchParams?.get("mesa_id") ?? undefined;

  const [loading, setLoading] = useState(false);
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [pedidosComItems, setPedidosComItems] = useState<
    { pedido: any; items: any[] }[]
  >([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!mesa_id) {
      setPedidos([]);
      setPedidosComItems([]);
      return;
    }

    setLoading(true);
    setError(null);

    fetch(`/api/pedido?mesa_id=${mesa_id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Erro ao buscar pedidos");
        return res.json();
      })
      .then(async (data) => {
        const lista = Array.isArray(data) ? data : [];
        setPedidos(lista);

        const itemsPromises = lista.map(async (p: any) => {
          const r = await fetch(`/api/itemPedido?pedido_id=${p.id}`);
          if (!r.ok) return { pedido: p, items: [] };
          const items = await r.json();
          return { pedido: p, items: Array.isArray(items) ? items : [] };
        });

        const withItems = await Promise.all(itemsPromises);
        setPedidosComItems(withItems);
      })
      .catch((err) => {
        setError(String(err));
        setPedidos([]);
        setPedidosComItems([]);
      })
      .finally(() => setLoading(false));
  }, [mesa_id]);

  if (!mesa_id) {
    return ClienteComandaVazia();
  }
  const mainClass =
    "!pt-35 flex flex-col min-h-screen bg-white p-7 md:p-36 !pb-0 mt-10";

  return (
    <>
      <Header />
      <main className={mainClass}>
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-2xl font-bold text-[#F65C5C]">Minha Comanda</h1>
          <h3 className="font-semibold text-[#9E9E9E]">
            {pedidos.length} pedido(s)
          </h3>
        </div>
        <a href="/perfil/cliente"><Button className="w-40 mt-[5px]" variant="rosa">Fazer pedido</Button></a>

        {loading && (
          <p className="mt-4 text-[#9E9E9E]">Carregando pedidos...</p>
        )}
        {error && <p className="mt-4 text-red-500">{error}</p>}

        {!loading &&
          pedidosComItems.map(({ pedido, items }) => (
            <CardPedido key={pedido.id} pedido={pedido} items={items} />
          ))}

        {!loading && pedidos.length === 0 && (
          <div className="mt-6 text-[#616161]">
            Nenhum pedido encontrado para essa mesa.
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}

function ClienteComandaVazia() {
  const mainClass =
    "!pt-35 flex flex-col min-h-screen bg-white p-7 md:p-36 !pb-0 mt-10";
  return (
    <>
      <Header />
      <main className={mainClass}>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-[#F65C5C]">Minha Comanda</h1>
          <h3 className="font-semibold text-[#9E9E9E]">0 pedido(s)</h3>
        </div>
        <div className="flex flex-col items-center">
          <figure className="mt-15">
            <img src="/comanda_vazia.png" alt="Mulher com fome" />
          </figure>
          <p className="mt-5 text-center text-[#616161]">
            O que vai ser hoje? Clique e descubra<br></br>seu novo sabor
            preferido!
          </p>
          <a href="/perfil/cliente"><Button className="w-40 mt-[5px]" variant="rosa">Fazer pedido</Button></a>
        </div>
      </main>
      <Footer />
    </>
  );
}

export default function ClienteComanda() {
  return (
    <Suspense>
      <ClienteComandaContent />
    </Suspense>
  );
}
