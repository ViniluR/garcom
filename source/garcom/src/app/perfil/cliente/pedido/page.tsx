"use client";
import { Suspense } from "react";
import { useState, useEffect } from "react";
import { Header } from "@/components/cliente-header";
import { Footer } from "@/components/cliente-footer";
import { Input } from "@/components/ui/input";
import { useSearchParams, useRouter } from "next/navigation";

type ItemPedido = {
  pedido_id: string;
  item_id: string;
  quantidade: number;
  observacao: string;
  item_cardapio: {
    id: string;
    nome: string;
    descricao: string;
    foto: string;
    preco_unitario: number;
  }
};

const ClientePedidoContent = () => {
  const [itensPedido, setItensPedido] = useState<ItemPedido[]>([]);
  const [pedidoId, setPedidoId] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [total, setTotal] = useState(0);
  const [observacoesGerais, setObservacoesGerais] = useState("");

  const searchParams = useSearchParams();
  const router = useRouter();
  const mesaId = searchParams.get("mesa_id");

  // EFEITO PARA BUSCAR OS ITENS DO PEDIDO NA API
  useEffect(() => {
    if (!mesaId) return;

    const buscarItensDoPedido = async () => {
      setCarregando(true);
      try {
        const resPedido = await fetch(`/api/pedido?mesa_id=${mesaId}&status=aberto`);
        
        if (!resPedido.ok) throw new Error("Pedido não encontrado");

        const pedidos = await resPedido.json();
        if (pedidos.length === 0) {
          setItensPedido([]);
          setCarregando(false);
          return;
        }
        
        const pedidoAtual = pedidos[0];
        setPedidoId(pedidoAtual.id);

        const resItens = await fetch(`/api/itemPedido?pedido_id=${pedidoAtual.id}`);
        if (!resItens.ok) throw new Error("Itens do pedido não encontrados");

        const itens = await resItens.json();
        function mergeItens(itensRaw: ItemPedido[]) {
          const map = new Map<string, ItemPedido>();

          for (const it of itensRaw) {
            const key = `${it.pedido_id}-${it.item_id}`;
            if (!map.has(key)) {
              // clone pra não mutar o original
              map.set(key, { ...it });
            } else {
              // se já existe, somar quantidade e juntar observação (opcional)
              const existing = map.get(key)!;
              existing.quantidade = (existing.quantidade ?? 0) + (it.quantidade ?? 0);
              // opcional: concatenar observações sem duplicar
              if (it.observacao) {
                existing.observacao = existing.observacao
                  ? `${existing.observacao} | ${it.observacao}`
                  : it.observacao;
              }
              map.set(key, existing);
            }
          }

          return Array.from(map.values());
        }

        const itensMesclados = mergeItens(itens);
        setItensPedido(itensMesclados);

      } catch (error) {
        console.error("Erro ao buscar pedido:", error);
        setItensPedido([]); // Limpa em caso de erro
      } finally {
        setCarregando(false);
      }
    };

    buscarItensDoPedido();
  }, [mesaId]);

  // EFEITO PARA CALCULAR O TOTAL SEMPRE QUE OS ITENS MUDAREM
  useEffect(() => {
    const calcularTotal = () => {
      const novoTotal = itensPedido.reduce((acc, item) => {
        return acc + (item.item_cardapio.preco_unitario * item.quantidade);
      }, 0);
      setTotal(novoTotal);
    };
    calcularTotal();
  }, [itensPedido]);
  
  // FUNÇÕES PARA MANIPULAR O PEDIDO (ex: remover, confirmar)
  const handleRemoverItem = async (pedidoIdParam: string, itemIdParam: string) => {
  if(!confirm("Tem certeza que deseja remover este item?")) return;

  const res = await fetch(`/api/itemPedido?pedido_id=${encodeURIComponent(pedidoIdParam)}&item_id=${encodeURIComponent(itemIdParam)}`, { method: "DELETE" });
  if (res.ok) {
        setItensPedido(prevItens => prevItens.filter(i => !(i.pedido_id === pedidoIdParam && i.item_id === itemIdParam)));
        alert("Item removido com sucesso!");
  } else {
        const json = await res.json().catch(()=>null);
        console.error("Erro ao remover item:", json);
        alert("Erro ao remover item.");
  }
  };

  const handleConfirmarPedido = async () => {
    console.log("handleConfirmarPedido: pedidoId (antes de confirmar) =", pedidoId);
    if (!pedidoId) {
      alert("Erro: pedidoId não está definido.");
      return;
    }

    if (!confirm("Deseja confirmar e enviar o pedido para a cozinha?")) return;

    try {
      const payload = { pedido_id: pedidoId, status: 'confirmado', observacao: observacoesGerais };

      console.log("Enviando PUT /api/pedido com payload:", payload, "e query id:", pedidoId);

      const res = await fetch(`/api/pedido?id=${encodeURIComponent(pedidoId)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: pedidoId, status: "em_preparacao" }),
      });

      let json = null;
      try { json = await res.json(); } catch (e) { console.warn("Resposta não JSON:", e); }

      console.log("PUT /api/pedido response:", res.status, json);

      if (res.ok) {
        alert("Pedido confirmado e enviado para a cozinha!");
        // navegar para a página da comanda enviando o pedidoId e mesaId como query
        // ajustamos o caminho para o diretório real: /perfil/cliente/comanda
        router.push(
          `/perfil/cliente/comanda?pedido_id=${encodeURIComponent(pedidoId)}&mesa_id=${encodeURIComponent(mesaId ?? "")}`
        );
      } else {
        alert("Erro ao confirmar o pedido: " + (json?.error ?? `status ${res.status}`));
      }
    } catch (err) {
      console.error("Erro no fetch PUT /api/pedido:", err);
      alert("Erro de rede ao confirmar pedido.");
    }
  };

  console.log("ITENS DO PEDIDO RECEBIDOS PELA API:", itensPedido);

  if (carregando) {
    return (
        <div>
            <Header />
            <main className="!pt-26 flex items-center justify-center min-h-screen bg-white">
                <p className="text-[#F65C5C] font-bold">Carregando seu pedido...</p>
            </main>
            <Footer />
        </div>
    );
  }

  return (
    <div>
      <Header />
      <main className="!pt-26 flex items-center flex-col min-h-screen bg-white">
        <section>
          <section className="m-[5vw]">
            <div className="flex items-center mb-4 place-content-between">
              <h2 className="text-[20px] font-bold text-[#F65C5C] mr-4 ">Seu Pedido</h2>
            </div>

            {itensPedido.length > 0 ? (
                <div className="mb-8">
                    <h3 className="text-[20px] font-bold text-[#F65C5C] mb-2">Itens do pedido</h3>
                    <ul>
                      {itensPedido.map((item) => (
                        <li key={`${item.pedido_id}-${item.item_id}`} className="flex items-center mb-6">
                          <img className="w-24 h-24 rounded-[5vw] object-cover mr-5" src={item.item_cardapio.foto} alt={item.item_cardapio.nome} />
                          <div className="flex-1">
                            <h3 className="text-[18px] font-bold text-[#F65C5C]">{item.item_cardapio.nome}</h3>
                            <p className="text-[#464646] max-w-[100%]">{item.item_cardapio.descricao}</p>
                            <div className="flex items-center place-content-between max-w-[100%] mt-2">
                              <p className="!text-[18px] min-w-[10%] font-extrabold text-[#F65C5C]">
                                <span className="text-[14px] font-bold text-[#F65C5C]">R$</span> {Number(item.item_cardapio.preco_unitario).toFixed(2)}
                              </p>
                              <div className="flex items-center gap-2 ml-auto">
                                <span className="font-bold text-[#616161]">Qtd: {item.quantidade}</span>
                              </div>
                              <img 
                                onClick={() => handleRemoverItem(item.pedido_id, item.item_id)} 
                                className="w-4 h-4 ml-4 cursor-pointer" 
                                src="/excluir_f.svg" 
                                alt="Remover item" 
                              />
                            </div>
                            {item.observacao && <p className="text-sm text-gray-500 mt-1">Obs: {item.observacao}</p>}
                          </div>
                        </li>
                      ))}
                    </ul>
                    <div className="flex justify-end mt-6">
                        <span className="text-[18px] font-bold text-[#F65C5C]">Total: R$ {total.toFixed(2)}</span>
                    </div>
                </div>
            ) : (
                <p className="text-center text-[#616161]">Seu carrinho está vazio.</p>
            )}
            
            <h2 className="text-[15px] font-bold text-[#9E9E9E] mr-4 mb-5">Observações Gerais do Pedido</h2>
            <Input
              type="text"
              placeholder="Ex: alergia a camarão, sem cebola, etc."
              value={observacoesGerais} 
              onChange={(e) => setObservacoesGerais(e.target.value)} 
              className="rounded-4xl border-1 border-[#83546A] bg-[#EFEFEF] p-5 text-[#83546A] text-[16px] mb-2"
            />
          </section>
        </section>

        {itensPedido.length > 0 && (
            <div className="fixed bottom-6 flex items-center gap-4 bg-[#F65C5C] text-white px-6 py-3 rounded-full shadow-lg animate-fade-in">
                <button onClick={() => router.back()} className="text-white !border-2 border-white font-bold px-4 py-2 rounded-full hover:bg-[#E15050] cursor-pointer">Voltar</button>
                <button onClick={handleConfirmarPedido} className="bg-white text-[#F65C5C] font-bold px-4 py-2 rounded-full hover:bg-[#FFE3CF] cursor-pointer">Confirmar pedido</button>
            </div>
        )}

      </main>
      <Footer />
    </div>
  );
};

export default function ClientePedido() {
  return (
    <Suspense>
      <ClientePedidoContent />
    </Suspense>
  );
}
