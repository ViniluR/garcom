"use client";

import { Suspense, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { authClient } from "@/lib/auth-client";
import { useSearchParams } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";

// Schema de validação
const schema = z
  .object({
    senha: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
    confirmarSenha: z
      .string()
      .min(6, "A senha deve ter pelo menos 6 caracteres"),
  })
  .refine((data) => data.senha === data.confirmarSenha, {
    message: "As senhas não coincidem",
    path: ["confirmarSenha"],
  });

type FormData = z.infer<typeof schema>;

function NovaSenhaForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [mostrarConfirmarSenha, setMostrarConfirmarSenha] = useState(false);
  const [message, setMessage] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    if (!token) {
      setMessage({
        text: "Token inválido ou expirado",
        type: "error",
      });
      return;
    }

    setMessage(null);
    try {
      const { error } = await authClient.resetPassword({
        token,
        newPassword: data.senha,
      });

      if (error) {
        setMessage({
          text: error.message || "Erro ao redefinir senha",
          type: "error",
        });
      } else {
        setMessage({
          text: "Senha redefinida com sucesso! Você será redirecionado para o login.",
          type: "success",
        });
        // Redirecionar após 3 segundos
        setTimeout(() => (window.location.href = "/auth/entrar"), 3000);
      }
    } catch (error) {
      setMessage({
        text: "Ocorreu um erro inesperado. Tente novamente mais tarde.",
        type: "error",
      });
    }
  };

  const inputClass =
    "font-poppins rounded-full bg-[#EFEFEF] text-[1em] font-medium text-[#9E9E9E] placeholder:text-[#9E9E9E]";

  return (
    <div className="grid min-h-screen grid-cols-1 md:grid-cols-[60%_40%]">
      <div className="m-6 hidden items-center justify-center rounded-[40px] bg-[#f65c5c] md:flex">
        <Image
          src="/garcom-ilustracao.png"
          alt="Garçom"
          width={2000}
          height={2000}
          className="h-auto w-[70%] object-contain"
        />
      </div>
      <div className="scrollbar-thin scrollbar-thumb-[#f65c5c] scrollbar-thumb-rounded-full scrollbar-track-transparent flex h-full flex-col justify-center overflow-y-auto px-8 py-8 sm:px-16 md:px-24">
        <div className="mb-6 flex items-center justify-between">
          <Image src="/logo.svg" alt="Logo" width={90} height={20} />
          <Link href="/auth/entrar">
            <Image
              width={30}
              height={30}
              src="/seta-voltar.svg"
              alt="Voltar"
              className="h-8 w-8 cursor-pointer"
            />
          </Link>
        </div>

        <div className="mb-6">
          <h1 className="font-poppins text-[2.5em] font-semibold text-[#E55F4B]">
            Nova senha
          </h1>
          <p className="font-poppins text-[1.2em] font-medium text-[#9E9E9E]">
            Crie uma nova senha para sua conta
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {message && (
            <p
              className={`font-poppins rounded-lg p-3 text-center text-[1em] font-medium ${
                message.type === "success"
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-[#f65c5c]"
              }`}
            >
              {message.text}
            </p>
          )}

          <div>
            <label className="font-poppins mb-[0.3em] block text-[1em] font-medium text-[#9E9E9E]">
              Nova senha
            </label>
            <div className="relative">
              <Input
                type={mostrarSenha ? "text" : "password"}
                className={inputClass}
                placeholder="Digite sua nova senha"
                {...register("senha")}
              />
              <span
                className="text-muted-foreground absolute top-2.5 right-3 cursor-pointer"
                onClick={() => setMostrarSenha((prev) => !prev)}
              >
                {mostrarSenha ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </span>
            </div>
            {errors.senha && (
              <p className="text-sm text-[#f65c5c]">{errors.senha.message}</p>
            )}
          </div>

          <div>
            <label className="font-poppins mb-[0.3em] block text-[1em] font-medium text-[#9E9E9E]">
              Confirmar senha
            </label>
            <div className="relative">
              <Input
                type={mostrarConfirmarSenha ? "text" : "password"}
                className={inputClass}
                placeholder="Confirme sua nova senha"
                {...register("confirmarSenha")}
              />
              <span
                className="text-muted-foreground absolute top-2.5 right-3 cursor-pointer"
                onClick={() => setMostrarConfirmarSenha((prev) => !prev)}
              >
                {mostrarConfirmarSenha ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </span>
            </div>
            {errors.confirmarSenha && (
              <p className="text-sm text-[#f65c5c]">
                {errors.confirmarSenha.message}
              </p>
            )}
          </div>

          <Button
            type="submit"
            className="font-poppins w-full rounded-full bg-[#f65c5c] text-[1em] font-semibold text-[#FFE3CF] hover:bg-[#e25555]"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Redefinindo..." : "Redefinir senha"}
          </Button>
        </form>

        <p className="font-poppins mt-4 text-center text-[1em] font-medium text-[#9E9E9E]">
          Lembrou sua senha?{" "}
          <Link
            href="/auth/entrar"
            className="font-poppins font-medium text-[#f65c5c] hover:underline"
          >
            Faça login
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function NovaSenhaPage() {
  return (
    <Suspense>
      <NovaSenhaForm />
    </Suspense>
  );
}
