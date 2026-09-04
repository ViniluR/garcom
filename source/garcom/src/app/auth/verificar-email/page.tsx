"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";

function EmailVerificationContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email");
  const [countdown, setCountdown] = useState(60);
  const [isResending, setIsResending] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleResendEmail = async () => {
    if (countdown > 0 || !email) return;

    setIsResending(true);
    setMessage("");

    try {
      const { error } = await authClient.sendVerificationEmail({ email, callbackURL: '/auth/entrar'});
      if (error) {
        toast.error(error.message || "Erro ao reenviar e-mail.");
      } else {
        toast.success("E-mail de verificação reenviado com sucesso!");
        setCountdown(60); 
      }
    } catch (error) {
      setMessage("Ocorreu um erro ao reenviar o e-mail.");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="grid min-h-screen grid-cols-1 md:grid-cols-[40%_60%]">
      <div className="scrollbar-thin scrollbar-thumb-[#f65c5c] scrollbar-thumb-rounded-full scrollbar-track-transparent flex h-full flex-col justify-center overflow-y-auto px-8 py-8 sm:px-16 md:px-24">
        <div className="mb-6 flex items-center justify-between">
          <Image src="/logo.svg" alt="Logo" width={90} height={20} />
          <Link href="/auth/cadastro">
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
            Verifique seu e-mail
          </h1>

          <div className="space-y-4">
            <p className="font-poppins text-[1.2em] font-medium text-[#9E9E9E]">
              Enviamos um e-mail para{" "}
              <span className="font-semibold text-[#f65c5c]">{email}</span>
            </p>

            <p className="font-poppins text-[1.2em] font-medium text-[#9E9E9E]">
              Por favor, verifique sua caixa de entrada e clique no link de
              confirmação para ativar sua conta.
            </p>

            <Button
              onClick={handleResendEmail}
              disabled={countdown > 0 || isResending}
              className="font-poppins w-full rounded-full bg-[#f65c5c] text-[1em] font-semibold text-[#FFE3CF] hover:bg-[#e25555]"
            >
              {isResending
                ? "Enviando..."
                : countdown > 0
                  ? `Reenviar em ${countdown}s`
                  : "Reenviar e-mail"}
            </Button>

            <p className="font-poppins text-[1em] font-medium text-[#9E9E9E]">
              Já verificou seu e-mail?{" "}
              <Link
                href="/auth/entrar"
                className="font-poppins font-medium text-[#f65c5c] hover:underline"
              >
                Faça login
              </Link>
            </p>
          </div>
        </div>
      </div>

      <div className="m-6 hidden items-center justify-center rounded-[40px] bg-[#f65c5c] md:flex">
        <Image
          src="/garcom-ilustracao.png"
          alt="Garçom"
          width={2000}
          height={2000}
          className="h-auto w-[70%] object-contain"
        />
        <Toaster position="bottom-left" />
      </div>
    </div>
  );
}

export default function EmailVerificationPage() {
  return (
    <Suspense>
      <EmailVerificationContent />
    </Suspense>
  );
}
