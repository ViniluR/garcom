"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";

const schema = z.object({
  email: z.email("Email inválido"),
  senha: z.string().min(1, "Insira sua senha"),
});

type FormData = z.infer<typeof schema>;

const knownErrorMsgs: Record<string, string> = {
  "auth/invalid-email": "Email inválido.",
  "auth/user-not-found": "Usuário não encontrado.",
  "auth/wrong-password": "Senha incorreta.",
  "auth/email-not-verified":
    "Por favor, verifique seu email para ativar sua conta.",
};

export default function LoginForm() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [redirecionando, setRedirecionando] = useState(false);

  const inputClass =
    "font-poppins rounded-full bg-[#EFEFEF] text-[1em] font-medium text-[#9E9E9E] placeholder:text-[#9E9E9E] placeholder:font-poppins placeholder:font-medium placeholder:text-[1em]";

const onSubmit = async (data: FormData) => {
  setFormError(null);
  setRedirecionando(true);
  try {
    const response = await authClient.signIn.email({
      email: data.email,
      password: data.senha,
    });

    if ("error" in response && response.error) {
      const error = response.error;

      const errosGenericos = [
        "INVALID_EMAIL",
        "USER_NOT_FOUND",
        "WRONG_PASSWORD",
        "INVALID_EMAIL_OR_PASSWORD",
      ];

      const code = error.code ?? "";
      let msg = "";
      if (errosGenericos.includes(code)) {
        msg = "Usuário e/ou senha incorreto(s). Por favor, verifique e tente novamente.";
        toast.error(msg);
      } else if (code == "EMAIL_NOT_VERIFIED") {
        msg = "Por favor, verifique seu email para ativar sua conta.";
        toast.warning(msg);
        setRedirecionando(false);
        return;
      } else if (code == "TOO_MANY_REQUESTS") {
        msg = "Muitas tentativas de login. Tente novamente mais tarde.";
        toast.error(msg);
        setRedirecionando(false);
        return;
      }
      else {
        msg = (code && knownErrorMsgs[code]) ||
          error.message ||
          "Erro ao tentar login. Tente novamente.";
        toast.error(msg);
      }

      setRedirecionando(false);
      return;
    }

    router.push("/perfil");
  } catch (err: any) {
    setRedirecionando(false);
    const msg =
      err instanceof Error
        ? err.message
        : "Erro inesperado ao tentar login. Tente novamente.";
    setFormError(msg);
    toast.error(msg);
  }
};

  if (redirecionando) {
    return (
      <div className="flex min-h-40 flex-col items-center justify-center gap-4">
        <p className="font-poppins font-medium text-[#F65C5C]">Carregando seu perfil...</p>
        <div className="h-2 w-full overflow-hidden rounded-full bg-[#FFE3CF]">
          <div className="h-full w-1/2 animate-pulse rounded-full bg-[#F65C5C]" />
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="font-poppins mb-[0.3em] block text-[1em] font-medium text-[#9E9E9E]">
          Email
        </label>
        <Input
          type="email"
          className={inputClass}
          placeholder="Digite seu email"
          {...register("email")}
        />
        {errors.email && (
          <p className="text-sm text-[#f65c5c]">{errors.email.message}</p>
        )}
      </div>

      <div>
        <label className="font-poppins mb-[0.3em] block text-[1em] font-medium text-[#9E9E9E]">
          Senha
        </label>
        <div className="relative">
          <Input
            type={mostrarSenha ? "text" : "password"}
            className={inputClass}
            placeholder="Digite sua senha"
            {...register("senha")}
          />
          <span
            className="text-muted-foreground absolute top-2.5 right-3 cursor-pointer"
            onClick={() => setMostrarSenha((prev) => !prev)}
          >
            {mostrarSenha ? <EyeOff size={18} /> : <Eye size={18} />}
          </span>
        </div>
        {errors.senha && (
          <p className="text-sm text-[#f65c5c]">{errors.senha.message}</p>
        )}
        <a href="/auth/redefinir-senha">
          <p className="mt-1 cursor-pointer text-sm font-medium text-[#f65c5c] hover:underline">
            Esqueceu sua senha?
          </p>
        </a>
      </div>

      {formError && <p className="text-sm text-[#f65c5c]">{formError}</p>}

      <Button
        type="submit"
        className="font-poppins w-full rounded-full bg-[#f65c5c] text-[1em] font-semibold text-[#FFE3CF] hover:bg-[#e25555]"
        disabled={isSubmitting}
      >
        {isSubmitting ? "Entrando..." : "Entrar"}
      </Button>
      <Toaster position="bottom-right" />
    </form>
  );
}
