
"use client";
import { Suspense } from "react";
import { useState, useEffect } from "react";
import { Header } from "@/components/cliente-header";
import { Footer } from "@/components/cliente-footer";
import { useSearchParams } from "next/navigation";
import { useItens } from "@/app/cardapio/useItens";
import { Item } from "@/app/cardapio/types";
import Link from "next/link";
import { Button } from "@/components/ui/button";


type ItemCardapio = {
  id: number;
  nome: string;
  descricao: string;
  preco: number;
  imagem: string;
};

const ClienteCardapioContent = () => {
  const { itens, carregando, categorias, restauranteId } = useItens();
  const [formAberto, setFormAberto] = useState(false);
  const [itemSelecionado, setItemSelecionado] = useState<Item | null>(null);
  const [quantidade, setQuantidade] = useState<number>(1);
  const [observacao, setObservacao] = useState<string>("");

  const searchParams = useSearchParams();
  const mesaId = searchParams.get("mesa_id") || "";
  const restauranteIdUrl = searchParams.get("restaurante_id") || "";

 
  const [itensCarrinho, setItensCarrinho] = useState<number>(0);
  const [restauranteNome, setRestauranteNome] = useState<string>("Nome restaurante");
  const [restauranteLocal, setRestauranteLocal] = useState<string>("Natal - RN");

 
  useEffect(() => {

    const buscarItensCarrinho = async () => {
      const resPedido = await fetch(`/api/pedido?mesa_id=${mesaId}&status=aberto`);
      if (resPedido.ok) {
        const pedidos = await resPedido.json();
        if (pedidos.length > 0) {
          const pedidoId = pedidos[0].id;
          const resItens = await fetch(`/api/itemPedido?pedido_id=${pedidoId}`);
          if (resItens.ok) {
            const itens = await resItens.json();
            // Soma todas as quantidades dos itens
            const total = itens.reduce((acc: any, item: any) => acc + (item.quantidade || 1), 0);
            setItensCarrinho(total);
            return;
          }
        }
      }
      setItensCarrinho(0);
    };
    buscarItensCarrinho();
  }, [formAberto]);

  // Buscar dados do restaurante (nome e localização) quando soubermos o restauranteId
  useEffect(() => {
    const buscarRestaurante = async () => {
      if (!restauranteId) return;
      try {
        const res = await fetch(`/api/restaurante?id=${restauranteId}`);
        if (!res.ok) return;
        const data = await res.json();

        let nome = data.descricao || "";
        if (data.user_id) {
          try {
            const resUser = await fetch(`/api/user?id=${data.user_id}`);
            if (resUser.ok) {
              const userData = await resUser.json();
              if (userData.name) nome = userData.name;
            }
          } catch (e) {
            console.error("Erro ao buscar usuário do restaurante:", e);
          }
        }
        setRestauranteNome(nome || "Nome restaurante");

        const cidade = data.endereco?.cidade;
        const estado = data.endereco?.estado;
        setRestauranteLocal(cidade && estado ? `${cidade} - ${estado}` : "Sem localização");
      } catch (error) {
        console.error("Erro ao buscar restaurante:", error);
      }
    };
    buscarRestaurante();
  }, [restauranteId]);


  const categoriasRestaurante = categorias
    ? categorias.filter((cat: any) => cat.restaurante_id === restauranteId).map((cat: any) => cat.id)
    : [];


  const itensFiltrados = itens.filter((item: any) => categoriasRestaurante.includes(item.categoria_id));

  const abrirForm = (item: Item) => {
    setItemSelecionado(item);
    setFormAberto(true);
    setQuantidade(1);
    setObservacao("");

  };

  const fecharForm = () => {
    setFormAberto(false);
    setItemSelecionado(null);
  };

  const adicionarAoPedido = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!itemSelecionado || !mesaId) return;

    let pedidoId = null;

    const resPedido = await fetch(`/api/pedido?mesa_id=${mesaId}&status=aberto`);
    let pedido = null;
    if (resPedido.ok) {
      const pedidos = await resPedido.json();
      if (pedidos.length > 0) {
        pedido = pedidos[0];
        pedidoId = pedido.id;
      }
    }

    if (!pedidoId) {
      const resNovo = await fetch("/api/pedido", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          datahora: new Date().toISOString(),
          status: "aberto",
          funcionario_id: "07372168-94db-4ca9-bb16-513c53844123",
          mesa_id: mesaId,
        }),
      });
      if (resNovo.ok) {
        const novoPedido = await resNovo.json();
        pedidoId = novoPedido.id;
      } else {
        return;
      }
    }

    const resItem = await fetch("/api/itemPedido", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pedido_id: pedidoId,
        item_id: itemSelecionado.id,
        quantidade,
        observacao,
      }),
    });
    if (resItem.ok) {
      alert(`Item adicionado ao pedido da mesa ${mesaId}`);
      fecharForm();
    }
  };
  const mainClass =
    "!pt-35 flex flex-col items-start min-h-screen bg-white p-7 md:p-36 !pb-0 mt-10";


  return (
    <div>
      <Header />
      <main className={mainClass}>
        <img src="/default-banner.png" alt="Banner" />
        <section className="w-full mt-8">
          <div className="flex flex-row items-center justify-left">
            <img className="w-16 h-16 rounded-full object-cover mr-5" src="/default-profile.png" alt="Perfil" />
            <div className="mr-5">
          <h2 className="text-[25px] font-bold text-[#F65C5C]">{restauranteNome}</h2>
          <p className="text-[12px] text-[#F65C5C]">{restauranteLocal}</p>
          </div>

          </div>
          <section className="mt-8">
            <div className="flex items-center mb-4 place-content-between">
              <h2 className="text-[20px] font-bold text-[#F65C5C] mr-4 ">Cardápio</h2>
              <a href="/perfil/cliente/comanda"><Button className="w-40 mt-[5px]" variant="rosa">Minha comanda</Button></a>
            </div>
            {!carregando && categoriasRestaurante.length === 0 && (
              <p className="text-[#616161]">Nenhuma categoria disponível para este restaurante.</p>
            )}
            {!carregando && categoriasRestaurante.map((catId: string) => {
              const categoria = categorias.find((c: any) => c.id === catId);
              const itensDaCategoria = itensFiltrados.filter((item: any) => item.categoria_id === catId);
              if (itensDaCategoria.length === 0) return null;
              return (
                <div key={catId} className="mb-8">
                  <h3 className="text-[20px] font-bold text-[#F65C5C] mb-2">
                    {categoria?.nome && categoria.nome.trim() !== "" ? categoria.nome : "Categoria sem nome"}
                  </h3>
                  <ul>
                    {itensDaCategoria.map((item: any) => (
                      <li key={item.id} className="flex items-center mb-6">
                        <img className="w-24 h-24 rounded-[5vw] object-cover mr-5" src={item.foto} alt={item.nome} />
                        <div className="flex-1">
                          <h3 className="text-[18px] font-bold text-[#F65C5C]">{item.nome}</h3>
                          <p className="text-[#464646] max-w-[100%]">{item.descricao}</p>
                          <div className="flex items-center place-content-between max-w-[100%] mt-2">
                            <p className="!text-[18px] min-w-[10%] font-extrabold text-[#F65C5C]">
                              <span className="text-[14px] font-bold text-[#F65C5C]">R$</span> {Number(item.preco_unitario).toFixed(2)}
                            </p>
                            <button
                              className="ml-2 bg-[#F65C5C] font-bold text-white px-8 py-2 rounded-full cursor-pointer text-[12px]"
                              onClick={() => abrirForm(item)}
                            >
                              Adicionar
                            </button>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </section>
        </section>

        {formAberto && itemSelecionado && (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/15 backdrop-blur-[2px]">
            <form
              className="!m-5 !mt-25 bg-white p-8 rounded-3xl shadow-2xl w-full max-w-md mx-auto z-50"
              onSubmit={adicionarAoPedido}
            >
              <img
                src={itemSelecionado.foto}
                alt={itemSelecionado.nome}
                className="h-40 w-full rounded-3xl object-cover mb-4"
              />
              <div className="mb-3">
                <h2 className="text-[20px] font-semibold text-[#F65C5C]">{itemSelecionado.nome}</h2>
                <p className="text-[14px] text-[#616161]">{itemSelecionado.descricao}</p>
              </div>

              <div>
                <h2 className="text-[18px] font-semibold text-[#616161]">Observação</h2>
                <input
                  type="text"
                  placeholder="Digite sua observação"
                  className="rounded-4xl mt-2 bg-[#EFEFEF] p-4 text-[#9E9E9E] w-full outline-none ring-0 focus:outline-none focus:ring-0"
                  value={observacao}
                  onChange={e => setObservacao(e.target.value)}
                />
              </div>
              <div>
                <div className="flex items-center gap-4 mt-4">
                  <h2 className="text-[18px] font-semibold text-[#616161] mr-2">Quantidade</h2>
                  <div className="flex items-center gap-2 ml-auto">
                    <button
                      type="button"
                      className="w-8 h-8 flex items-center justify-center rounded-full text-lg cursor-pointer bg-[#EFEFEF]"
                      onClick={() => setQuantidade(q => Math.max(1, q - 1))}
                    >-</button>
                    <span className="w-10 h-10 flex items-center justify-center rounded-full bg-[#EFEFEF] text-lg text-[#616161]">{quantidade}</span>
                    <button
                      type="button"
                      className="w-8 h-8 flex items-center justify-center rounded-full text-lg cursor-pointer bg-[#EFEFEF]"
                      onClick={() => setQuantidade(q => q + 1)}
                    >+</button>
                  </div>
                </div>
              </div>
              <div className="flex">
                <button
                  type="button"
                  className="mt-6 w-1/3 bg-[#FFC300] py-3 rounded-full hover:bg-[#F0B700] mr-2"
                  onClick={fecharForm}
                >Cancelar</button>
                <button
                  type="submit"
                  className="mt-6 w-2/3 bg-[#F65C5C] text-white py-3 rounded-full hover:bg-[#e05555]"
                >Adicionar ao pedido</button>
              </div>
            </form>
          </div>
        )}
      </main>

      {itensCarrinho > 0 && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-4 bg-[#F65C5C] text-white px-6 py-3 rounded-full shadow-lg animate-fade-in">
          <span className="font-bold text-lg">{itensCarrinho} item{itensCarrinho > 1 ? "s" : ""} no carrinho</span>
          <Link 
            href={`cliente/pedido?mesa_id=${mesaId}&restaurante_id=${restauranteIdUrl}`} 
            className="bg-white text-[#F65C5C] font-bold px-4 py-2 rounded-full hover:bg-[#FFE3CF] transition"
          >
            Ver pedido
          </Link>
        </div>
      )}
      <Footer />
    </div>
  );
};

export default function ClienteCardapio() {
  return (
    <Suspense>
      <ClienteCardapioContent />
    </Suspense>
  );
}