import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { IoQrCode } from "react-icons/io5";
import { getDados } from "@/lib/getDados";
import { FormMesas } from "./components/FormMesas";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";

const perfil = async () => {

  const dados = await getDados();

  if (!dados) {
    return (
      <Progress value={33} />
    );
  }

  const { role, roleData, user } = dados;

  let debugHorariosApi = null;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  if (roleData?.id) {
    try {
      const horariosApi = await fetch(`${baseUrl}/api/horarioFuncionamento?restaurante_id=${roleData.id}`, { cache: "no-store" });
      debugHorariosApi = horariosApi.ok ? await horariosApi.json() : [];
    } catch (err) {
      debugHorariosApi = { error: String(err) };
    }
  }

  const tituloClass = "text-[23px] font-bold mb-6 text-[#F65C5C]";
  const mainClass = "!pt-35 flex flex-col min-h-screen bg-white p-7 md:p-36 !pb-0";

  type DiaSemana =
    | 'Segunda-feira'
    | 'Terça-feira'
    | 'Quarta-feira'
    | 'Quinta-feira'
    | 'Sexta-feira'
    | 'Sábado'
    | 'Domingo';

  type HorarioFuncionamento = {
    aberto: boolean;
    horarioAbertura: string;
    horarioFechamento: string;
  };

  const dias: DiaSemana[] = [
    'Segunda-feira',
    'Terça-feira',
    'Quarta-feira',
    'Quinta-feira',
    'Sexta-feira',
    'Sábado',
    'Domingo',
  ];

  // Mapeamento entre backend e frontend
  const mapDiaBackendToFrontend: Record<number | string, DiaSemana> = {
    1: 'Segunda-feira',
    2: 'Terça-feira',
    3: 'Quarta-feira',
    4: 'Quinta-feira',
    5: 'Sexta-feira',
    6: 'Sábado',
    0: 'Domingo',
    'Seg': 'Segunda-feira',
    'Ter': 'Terça-feira',
    'Qua': 'Quarta-feira',
    'Qui': 'Quinta-feira',
    'Sex': 'Sexta-feira',
    'Sáb': 'Sábado',
    'Dom': 'Domingo',
  };

  let horarios: Record<DiaSemana, HorarioFuncionamento> = dias.reduce((acc, dia) => {
    acc[dia] = { aberto: false, horarioAbertura: '', horarioFechamento: '' };
    return acc;
  }, {} as Record<DiaSemana, HorarioFuncionamento>);

  if (roleData?.id) {
    try {
      const horariosApi = await fetch(`${baseUrl}/api/horarioFuncionamento?restaurante_id=${roleData.id}`, { cache: "no-store" });
      const horariosData = horariosApi.ok ? await horariosApi.json() : [];
      if (!Array.isArray(horariosData) || horariosData.length === 0) {
        {roleData.endereco?.cidade || "sem endereço"};
      } else {
        console.log('Horários recebidos da API:', horariosData);
      }
      // Para cada dia, pega o primeiro registro aberto, ou o primeiro registro se não houver nenhum aberto
      dias.forEach((dia) => {
        const registrosDia = horariosData.filter((h: any) => mapDiaBackendToFrontend[h.dia_semana] === dia);
        let registro = registrosDia.find((h: any) => h.aberto === true || h.aberto === 'true');
        if (!registro) registro = registrosDia[0];
        if (registro) {
          horarios[dia] = {
            aberto: registro.aberto === true || registro.aberto === 'true' ? true : false,
            horarioAbertura: registro.horario_inicio ?? registro.horarioAbertura ?? '',
            horarioFechamento: registro.horario_fim ?? registro.horarioFechamento ?? '',
          };
        }
      });
    } catch (err) {

    }
  }

    return (
    <div>
      <Header />
      <main className={mainClass}>
        <section className="relative mb-10 pb-6 border-b border-[#F65C5C]">
          <div className="flex flex-col items-center relative justify-center w-full h-auto">
            <img src={roleData?.foto_banner || "/default-banner.png"} alt="banner"
            className="w-full h-50  object-cover"/>
          </div>

          <div className="flex sm:items-center items-start sm:flex-row flex-col  justify-between w-full h-auto  ">
              <div>
                <img src={roleData?.foto_perfil || "/default-profile.png"} alt="avatar" className="w-[150px] h-[150px] rounded-full absolute left-0 top-[131px]"/>

                <div className="flex items-start gap-5 mt-24">
                  <div>
                    <h1 className={`${tituloClass} !m-0 !text-[#616161] !text-[27px]`}>{user.name}</h1>
                    <p className="!text-[14px] text-medium mp-[-10px] text-[#B2B2B2] ">
                      {roleData?.endereco?.cidade || "sem endereço"}
                    </p>
                  </div>
                  <a href="/perfil/editar"><Button className="w-40 mt-[5px]" variant="rosa">Editar Perfil</Button></a>
                </div>

                <div className="flex items-center w-auto gap-5 pt-2">  
                  <Button className="w-40" variant="branco">Cardápio</Button>
                  <Button className="w-40" variant="branco">Funcionarios</Button>
                </div>
              </div>
              <ul className="flex flex-col gap-2 pt-5">
                {dias.map((dia) => {
                  const { aberto, horarioAbertura, horarioFechamento } = horarios[dia];
                  return (
                    <li key={dia} className="flex items-center gap-4">
                      <span
                        className={`w-3 h-3 rounded-full ${
                          aberto ? 'bg-[#F65C5C]' : 'bg-[#5C5C5C]'
                        }`}
                      ></span>
                      <span className="text-[#5C5C5C] min-w-[130px]">{dia}</span>
                      <span className="text-[#5C5C5C] font-medium">
                        {aberto ? `${horarioAbertura.slice(0,5)} - ${horarioFechamento.slice(0,5)}` : 'Fechado'}
                      </span>
                    </li>
                  );
                })}
              </ul>
          </div>
        </section>
        <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 w-full">
          <p className="md:col-span-2 sm:col-span-2 col-span-1 pb-3 md:pb-0 !text-[#9E9E9E] w-full">{roleData?.descricao || "sem descrição"}</p>
          
          <div
            className="bg-[#FEE9E7] flex flex-col rounded-[11.01px] p-5 pl-8 pr-8 min-w-[213px] min-h-[169px] relative w-full">
            <p className="!text-[22px] font-medium text-[#303030]">Gerar QRcode das mesas</p>
            <Link href={'/perfil/qr-codes'}>
              <span className="rounded-full flex items-center justify-center w-[50px] min-h-[50px] bg-[#F65C5C] text-white cursor-pointer hover:bg-[#E54747] transition-all absolute right-8 top-[110px]">
                <IoQrCode size={24} />
              </span>
            </Link>
          </div>

          <FormMesas restauranteId={roleData?.id ?? ""} />

        </section>
        <section className="mt-10">
          <h1 className={tituloClass}>Churrascos</h1>
          <div className="flex gap-2 bg-[#F5F5F5] p-4 rounded-[27px] box-border w-[360px] h-[170px]">
            <img src="/default-banner.png" alt="Churrasco" className="w-[140px] h-[140px] object-cover rounded-[20px]"/>
            <div className="flex flex-col justify-between items-start gap-4">
              <div className="flex flex-col gap-2">
                <h2 className={`${tituloClass} !text-[16px] !m-0`}>Churrascunho de besta</h2>
                <p className="!text-[15px] text-[#464646] font-medium">Espeto de carne de calma calabreso chama chama</p>
              </div>
              <p className={`${tituloClass} !text-[14px] !m-0`}>R$
                <span className={`${tituloClass} !text-[20px] !m-0`}>39,99</span></p>
            </div>
          </div>
          
        </section>
      </main>
      <Footer />
    </div>
  )
}
export default perfil;