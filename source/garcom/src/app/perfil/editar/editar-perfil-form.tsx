'use client'

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { MdOutlineEdit } from "react-icons/md";
import { Progress } from "@/components/ui/progress";
import { useRouter } from "next/navigation";

interface Props {
  restauranteId: string;
  dadosIniciais: any;
}

type Horario = {
  id?: string;
  dia: string;
  inicio: string;
  fim: string;
  aberto: boolean;
};

const diasSemana = [
  "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"
];

const diasSemanaMap: Record<string, number> = {
  "Dom": 0, "Seg": 1, "Ter": 2, "Qua": 3, "Qui": 4, "Sex": 5, "Sáb": 6
};

export function EditarPerfilForm({ restauranteId, dadosIniciais }: Props) {


  const { register, handleSubmit, reset } = useForm({
    defaultValues: {
      name: "",
      descricao: "",
      cnpj: "",
      email: "",
      senha: "",
      confirmarSenha: "",
      cep: "",
      logradouro: "",
      numero: "",
      complemento: "",
      bairro: "",
      cidade: "",
      estado: "",
    }
  });
  const router = useRouter();

  // Estado para animação de carregamento
  const [carregandoForm, setCarregandoForm] = useState(true);
  const [progress, setProgress] = useState(10);

  // Controla tempo mínimo de exibição do Progress
  useEffect(() => {
    setProgress(10);
    setCarregandoForm(true);
    const minTimeout = setTimeout(() => setProgress(80), 300);
    let hideTimeout: NodeJS.Timeout;
    if (dadosIniciais) {
      reset({
        name: dadosIniciais.name,
        descricao: dadosIniciais.descricao,
        cnpj: dadosIniciais.cnpj,
        email: dadosIniciais.email,
        senha: "",
        confirmarSenha: "",
        cep: dadosIniciais.endereco?.cep || "",
        logradouro: dadosIniciais.endereco?.logradouro || "",
        numero: dadosIniciais.endereco?.numero || "",
        complemento: dadosIniciais.endereco?.complemento || "",
        bairro: dadosIniciais.endereco?.bairro || "",
        cidade: dadosIniciais.endereco?.cidade || "",
        estado: dadosIniciais.endereco?.estado || "",
      });
      // Garante que o Progress fique visível por pelo menos 800ms
      hideTimeout = setTimeout(() => setCarregandoForm(false), 800);
    }
    return () => {
      clearTimeout(minTimeout);
      if (hideTimeout) clearTimeout(hideTimeout);
    };
  }, [dadosIniciais, reset]);

  const [fotoPerfil, setFotoPerfil] = useState<string | null>(dadosIniciais.fotoPerfil || null);
  const [fotoBanner, setFotoBanner] = useState<string | null>(dadosIniciais.fotoBanner || null);

  function montarHorarios(data: any[]): Horario[] {
    return diasSemana.map((dia) => {
      const registros = data.filter(
        (horario) => horario.dia_semana === diasSemanaMap[dia],
      );
      const encontrado = registros.find((horario) => horario.aberto) ?? registros[0];

      return encontrado
        ? {
            id: encontrado.id,
            dia,
            inicio: encontrado.horario_inicio?.slice(0, 5) ?? "08:00",
            fim: encontrado.horario_fim?.slice(0, 5) ?? "18:00",
            aberto: Boolean(encontrado.aberto),
          }
        : { dia, inicio: "08:00", fim: "18:00", aberto: false };
    });
  }

  const [horarios, setHorarios] = useState<Horario[]>(() =>
    montarHorarios(dadosIniciais?.horarios ?? []),
  );
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    async function fetchHorarios() {
      if (!restauranteId) return;
      try {
        const res = await fetch(`/api/horarioFuncionamento?restaurante_id=${restauranteId}`);
        let data: any[] = [];
        if (res.ok) {
          data = await res.json();
        }
        setHorarios(montarHorarios(data));
      } catch (err) {
        setHorarios(diasSemana.map(dia => ({
          dia, inicio: "08:00", fim: "18:00", aberto: false
        })));
      }
    }
    fetchHorarios();
  }, [restauranteId]);

  async function atualizarHorariosRestaurante() {
    if (!restauranteId) return;
    try {
      const res = await fetch(`/api/horarioFuncionamento?restaurante_id=${restauranteId}`);
      let data: any[] = [];
      if (res.ok) {
        data = await res.json();
      }
      setHorarios(montarHorarios(data));
    } catch (err) {
      setHorarios(diasSemana.map(dia => ({
        dia, inicio: "08:00", fim: "18:00", aberto: false
      })));
    }
  }

  function mudarFotoPerfil(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) setFotoPerfil(URL.createObjectURL(file));
  }

  function mudarFotoBanner(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) setFotoBanner(URL.createObjectURL(file));
  }

  function toggleDia(index: number) {
    setHorarios((prev: Horario[]) =>
      prev.map((dia: Horario, i: number) =>
        i === index ? { ...dia, aberto: !dia.aberto } : dia
      )
    );
  }

  function alterarHorario(index: number, campo: "inicio" | "fim", valor: string) {
    setHorarios((prev: Horario[]) =>
      prev.map((dia: Horario, i: number) =>
        i === index ? { ...dia, [campo]: valor } : dia
      )
    );
  }

  

  async function editar(data: any) {
  setCarregando(true);
  try {
    const enderecoPayload = {
      cep: data.cep,
      logradouro: data.logradouro,
      numero: data.numero,
      complemento: data.complemento,
      bairro: data.bairro,
      cidade: data.cidade,
      estado: data.estado,
    };

    let enderecoId = dadosIniciais.endereco?.id;

    if (!enderecoId) {
      const res = await fetch('/api/endereco', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(enderecoPayload),
      });
      const result = await res.json();
      enderecoId = result.id;
      await fetch('/api/restaurante', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: restauranteId, endereco_id: enderecoId }),
      });
    } else {
      await fetch('/api/endereco', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: enderecoId, ...enderecoPayload }),
      });
    }

    const dadosRestaurante = {
      id: restauranteId,
      ...data,
      horarios,
      fotoPerfil,
      fotoBanner,
      endereco_id: enderecoId,
    };

    await fetch('/api/restaurante', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dadosRestaurante),
    });

    await fetch('/api/user', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: dadosIniciais.user_id,
        name: data.name,
      }),
    });

    // Buscar horários existentes antes de salvar
    const resExistentes = await fetch(`/api/horarioFuncionamento?restaurante_id=${restauranteId}`);
    let existentes: any[] = [];
    if (resExistentes.ok) {
      existentes = await resExistentes.json();
    }

    // Para cada dia, atualiza apenas o primeiro registro encontrado (se houver), nunca cria duplicado
    await Promise.all(horarios.map(async (horario) => {
      const payload = {
        dia_semana: diasSemanaMap[horario.dia],
        horario_inicio: horario.inicio,
        horario_fim: horario.fim,
        aberto: horario.aberto,
        restaurante_id: restauranteId
      };
      const existentesDia = existentes.filter((h) => h.dia_semana === diasSemanaMap[horario.dia] && h.restaurante_id === restauranteId);
      if (existentesDia.length > 0) {
        await fetch('/api/horarioFuncionamento', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: existentesDia[0].id, ...payload }),
        });
        for (let i = 1; i < existentesDia.length; i++) {
          await fetch(`/api/horarioFuncionamento?id=${existentesDia[i].id}`, {
            method: 'DELETE',
          });
        }
      } else {
        await fetch('/api/horarioFuncionamento', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }
    }));

    await atualizarHorariosRestaurante();
    router.back();

  } catch (err) {
    console.error("Erro:", err);
    alert("Erro ao atualizar");
  } finally {
    setCarregando(false);
  }
}

  const tituloClass = "text-[23px] font-bold mb-6 text-[#F65C5C]";
  const inputClass = "rounded-full bg-[#EFEFEF] text-[1em] font-medium text-[#9E9E9E] placeholder:text-[#9E9E9E] placeholder:font-medium placeholder:text-[1em]";
  const labelClass = "text-[20px] font-medium text-[#9E9E9E] mb-[7px]";

  return (
    <form onSubmit={handleSubmit(editar)}>
      <section className="flex align-center gap-10 mb-10 h-auto">
        <div className="flex flex-col items-center relative justify-center w-50 h-50">
          <img src={fotoPerfil || "/default-profile.png"} alt="Foto do perfil"
            className="w-50 h-50 rounded-full object-cover" />
          <input type="file" accept="image/*" onChange={mudarFotoPerfil} id="foto-perfil" className="hidden" />
          <label htmlFor="foto-perfil"
            className="absolute bottom-[10px] right-[10px] bg-[#FFE3CF] hover:brightness-95 transition-all cursor-pointer w-9 h-9 flex items-center justify-center rounded-full shadow-md">
            <MdOutlineEdit className="text-[#F65C5C] text-lg" />
          </label>
        </div>
        <div className="flex flex-col items-center relative justify-center w-full flex-2 h-50">
          <img src={fotoBanner || "/default-banner.png"} alt="banner"
            className="w-full h-50  object-cover" />
          <input type="file" accept="image/*" onChange={mudarFotoBanner} id="banner" className="hidden" />
          <label htmlFor="banner"
            className="absolute bottom-[10px] right-[10px] bg-[#FFE3CF] hover:brightness-95 transition-all cursor-pointer w-9 h-9 flex items-center rounded-full justify-center shadow-md">
            <MdOutlineEdit className="text-[#F65C5C] text-lg" />
          </label>
        </div>
      </section>

      <div className="grid grid-cols-3 gap-0 md:gap-10">
        <div className="col-span-3 md:col-span-2">
          <section className="flex flex-col">
            <Accordion type="single" collapsible>
              <AccordionItem value="item-1">
                <AccordionTrigger className="cursor-pointer !no-underline border-b rounded-none h-[65.84px]  border-[#D9D9D9] ">
                  <h2 className={tituloClass}>Informações do Restaurante</h2>
                </AccordionTrigger>
                <AccordionContent className=" flex flex-col mt-9 w-full gap-4">
                  <div>
                    <label className={labelClass}>Nome do restaurante</label>
                    <Input
                      className={inputClass}
                      type="text"
                      placeholder="Nome do Restaurante"
                      {...register("name")}
                    />
                  </div>
                  <div className="flex flex-col">
                    <label className={labelClass}>Descrição</label>
                    <textarea
                      className="font-poppins rounded-[18px] bg-[#EFEFEF] text-[1em] p-3 font-medium text-[#9E9E9E] placeholder:text-[#9E9E9E] placeholder:font-poppins placeholder:font-medium transition-all placeholder:text-[1em]"
                      placeholder="Digite uma descrição"
                      {...register("descricao")}
                      onInput={(e) => {
                        const el = e.target as HTMLTextAreaElement;
                        el.style.height = 'auto';
                        el.style.height = el.scrollHeight + 'px';
                      }}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="w-full">
                      <label className={labelClass}>CNPJ</label>
                      <Input
                        className={inputClass}
                        type="text"
                        placeholder="Digite"
                        readOnly
                        aria-readonly="true"
                        {...register("cnpj")}
                      />
                    </div>
                    <div className="w-full">
                      <label className={labelClass}>Email</label>
                      <Input
                        className={inputClass}
                        type="text"
                        placeholder="Digite"
                        {...register("email")}
                      />
                    </div>
                    <div className="w-full h-fit">
                      <label className={labelClass}>Senha Atual</label>
                      <Input
                        className={inputClass}
                        type="password"
                        placeholder="*********"
                        {...register("senha")}
                      />
                    </div>
                    <div className="w-full h-fit">
                      <label className={labelClass}>Nova senha</label>
                      <Input
                        className={inputClass}
                        type="password"
                        placeholder="Digite sua nova senha"
                        {...register("confirmarSenha")}
                      />
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </section>

          <section className="flex flex-col">
            <Accordion type="single" collapsible>
              <AccordionItem value="item-2">
                <AccordionTrigger className="cursor-pointer !no-underline border-b rounded-none h-[65.84px] mb-5  border-[#D9D9D9] ">
                  <h2 className={tituloClass}>Localização</h2>
                </AccordionTrigger>
                <AccordionContent className="mt-9">
                  <div className="grid grid-cols-4 gap-6">
                    <div className="w-full h-fit">
                      <label className={labelClass}>CEP</label>
                      <Input className={inputClass} type="text" 
                      placeholder="Digite" {...register("cep")} />
                    </div>
                    <div className="w-full h-fit col-span-2">
                      <label className={labelClass}>Logradouro</label>
                      <Input className={inputClass} type="text" 
                      placeholder="Digite" {...register("logradouro")} />
                    </div>
                    <div className="w-full h-fit">
                      <label className={labelClass}>Nº</label>
                      <Input className={inputClass} type="text" 
                      placeholder="digite" {...register("numero")} />
                    </div>
                    <div className="w-full h-fit col-span-3">
                      <label className={labelClass}>Complemento</label>
                      <Input className={inputClass} type="text" 
                      placeholder="Digite" {...register("complemento")}/>
                    </div>
                    <div className="w-full h-fit">
                      <label className={labelClass}>Bairro</label>
                      <Input className={inputClass} type="text" 
                      placeholder="Digite" {...register("bairro")}/>
                    </div>
                    <div className="w-full h-fit col-span-2">
                      <label className={labelClass}>Cidade</label>
                      <Input className={inputClass} type="text" 
                      placeholder="Digite" {...register("cidade")}/>
                    </div>
                    <div className="w-full h-fit col-span-2">
                      <label className={labelClass}>Estado</label>
                      <Input className={inputClass} type="text" 
                      placeholder="Digite" {...register("estado")}/>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </section>
        </div>

        <section className="flex flex-col col-span-3 md:col-span-1 mb-10">
          <Accordion type="single" collapsible>
            <AccordionItem value="item-3">
              <AccordionTrigger className="cursor-pointer !no-underline border-b rounded-none border-[#D9D9D9] ">
                <h2 className={`${tituloClass} !mb-0`}>Horários de Funcionamento</h2>
              </AccordionTrigger>
              <AccordionContent className="mt-9">
                <div className="flex flex-col gap-4">
                  {horarios.map((dia, index) => (
                    <div key={dia.dia} className="flex items-center justify-between gap-2 mb-4">
                      <span className="w-29 font-medium text-[15px]  text-[#9E9E9E]">{dia.dia}</span>
                      <label className="flex items-center gap-2">
                        <Switch checked={dia.aberto} onCheckedChange={() => toggleDia(index)} />
                        <span className="text-[#9E9E9E] font-medium text-[13px]"> {dia.aberto ? "Aberto" : "Fechado"}</span>
                      </label>
                      <div className="flex gap-2 items-center">
                        <input
                          type="time"
                          value={dia.inicio.slice(0,5)}
                          disabled={!dia.aberto}
                          onChange={(e) => alterarHorario(index, "inicio", e.target.value)}
                          className={`${inputClass} h-8 w-19 no-clock border-blocked p-[4px]`}
                        />
                        <span className="text-gray-500">-</span>
                        <input
                          type="time"
                          value={dia.fim.slice(0,5)}
                          disabled={!dia.aberto}
                          onChange={(e) => alterarHorario(index, "fim", e.target.value)}
                          className={`${inputClass} h-8 w-19 no-clock border-blocked p-[4px]`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </section>
      </div>
      <Button type="submit" variant="rosa" disabled={carregando}>
        {carregando ? "Salvando..." : "Salvar Alterações"}
      </Button>
    </form>
  );
}
