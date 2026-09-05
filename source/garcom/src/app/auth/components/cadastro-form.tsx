"use client";

import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";

function validarCNPJ(cnpj: string) {
  cnpj = cnpj.replace(/[\.\-\/]/g, "");
  if (cnpj.length !== 14) return false;
  if (/^(\d)\1+$/.test(cnpj)) return false;
  let tamanho = cnpj.length - 2;
  let numeros = cnpj.substring(0, tamanho);
  let digitos = cnpj.substring(tamanho);
  let soma = 0;
  let pos = tamanho - 7;
  for (let i = tamanho; i >= 1; i--) {
    soma += parseInt(numeros.charAt(tamanho - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  let resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
  if (resultado !== parseInt(digitos.charAt(0))) return false;
  tamanho++;
  numeros = cnpj.substring(0, tamanho);
  soma = 0;
  pos = tamanho - 7;
  for (let i = tamanho; i >= 1; i--) {
    soma += parseInt(numeros.charAt(tamanho - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
  if (resultado !== parseInt(digitos.charAt(1))) return false;
  return true;
}

const schema = z
  .object({
    nome: z
      .string()
      .min(1, { message: "Insira o nome do restaurante" }),

    cnpj: z
      .string()
      .min(18, { message: "CNPJ deve ter 14 dígitos" })
      .refine((val) => validarCNPJ(val), {
        message: "CNPJ inválido",
      }),

    descricao: z.string().optional(),

    email: z.email({ message: "Email inválido" }),

    senha: z
      .string()
      .min(8, { message: "A senha deve ter pelo menos 8 caracteres" })
      .regex(/[a-z]/, {
        message: "A senha deve conter pelo menos uma letra minúscula",
      })
      .regex(/[A-Z]/, {
        message: "A senha deve conter pelo menos uma letra maiúscula",
      })
      .regex(/[0-9]/, {
        message: "A senha deve conter pelo menos um número",
      })
      .regex(/[^A-Za-z0-9]/, {
        message: "A senha deve conter pelo menos um caractere especial",
      }),

    confirmarSenha: z
      .string()
      .min(8, { message: "A senha deve ter pelo menos 8 caracteres" }),

    termos: z.boolean().refine((value) => value, {
      message: "Você deve aceitar os termos.",
    }),
  })
  .refine((data) => data.senha === data.confirmarSenha, {
    message: "As senhas não coincidem.",
    path: ["confirmarSenha"],
  });

type FormData = z.infer<typeof schema>;

export default function CadastroForm() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      termos: false,
    },
  });

  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [mostrarConfirmarSenha, setMostrarConfirmarSenha] = useState(false);

  function formatarCNPJ(value: string) {
    return value
      .replace(/\D/g, "")
      .replace(/^(\d{2})(\d)/, "$1.$2")
      .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/\.(\d{3})(\d)/, ".$1/$2")
      .replace(/(\d{4})(\d)/, "$1-$2")
      .replace(/(-\d{2})\d+?$/, "$1");
  }

  const inputClass =
    "font-poppins rounded-full bg-[#EFEFEF] text-[1em] font-medium text-[#9E9E9E] placeholder:text-[#9E9E9E]";


const knownErrorMsgs: Record<string, string> = {
  "EMAIL_ALREADY_EXISTS": "Email já cadastrado.",
  "USER_ALREADY_EXISTS": "Usuário já cadastrado.",
  "INVALID_EMAIL": "Email inválido.",
  "WEAK_PASSWORD": "Senha muito fraca.",
};
const onSubmit = async (data: FormData) => {
  try {
    const { data: resultData, error } = await authClient.signUp.email({
      name: data.nome,
      email: data.email,
      password: data.senha,
      callbackURL: "/auth/entrar",
    });

    if (error) {
      let msg =
        error.code && knownErrorMsgs[error.code]
          ? knownErrorMsgs[error.code]
          : error.message || "Erro ao registrar. Tente novamente.";

      if (msg.toLowerCase().includes("user already exists")) {
        msg = "Email já cadastrado. Por favor, faça login ou use outro email.";
      }
      toast.error(msg);
      return;
    }

    const userId = resultData.user.id;
    const rawCnpj = data.cnpj.replace(/\D/g, "");
    const restaurantePayload = {
      user_id: userId,
      cnpj: rawCnpj,
      descricao: data.descricao || "",
    };

    const res = await fetch("/api/restaurante", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(restaurantePayload),
    });

    if (!res.ok) {
      let msg = "Erro ao cadastrar restaurante.";
      const contentType = res.headers.get("Content-Type") || "";

      if (contentType.includes("application/json")) {
        const json = await res.json();
        // Corrigido para acessar json.error pois backend usa { error: "mensagem" }
        msg = json.error || msg;
      } else {
        const text = await res.text();
        msg = text || msg;
      }

      if (res.status === 409) {
        msg = "Este CNPJ já está cadastrado.";
      }

      toast.error(msg);

      try {
        await fetch(`/api/user?id=${userId}`, { method: "DELETE" });
      } catch (rollbackError: any) {
        console.error(
          "Erro ao deletar usuário após falhar cadastro de restaurante:",
          rollbackError,
        );
      }

      return;
    }

    router.push(
      `/auth/verificar-email?email=${encodeURIComponent(data.email)}`,
    );
  } catch (err: any) {
    console.error("Erro inesperado no registro:", err);
    const msg =
      err instanceof Error ? err.message : "Erro inesperado. Tente novamente.";
    toast.error(msg);
  }
};


  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="font-poppins mb-[0.3em] block text-[1em] font-medium text-[#9E9E9E]">
          Nome do restaurante
        </label>
        <Input
          className={inputClass}
          placeholder="Digite seu nome do restaurante"
          {...register("nome")}
        />
        {errors.nome && (
          <p className="text-sm text-[#f65c5c]">{errors.nome.message}</p>
        )}
      </div>

      <div>
        <label className="font-poppins mb-[0.3em] block text-[1em] font-medium text-[#9E9E9E]">
          CNPJ
        </label>
        <Input
          className={inputClass}
          placeholder="Digite o CNPJ"
          {...register("cnpj")}
          maxLength={18}
          onChange={(e) => {
            const masked = formatarCNPJ(e.target.value);
            setValue("cnpj", masked);
          }}
        />
        {errors.cnpj && (
          <p className="text-sm text-[#f65c5c]">{errors.cnpj.message}</p>
        )}
      </div>

      <div>
        <label className="font-poppins mb-[0.3em] block text-[1em] font-medium text-[#9E9E9E]">
          Descrição
        </label>
        <Input
          className={inputClass}
          placeholder="Breve texto apresentando a empresa"
          {...register("descricao")}
        />
      </div>

      <div>
        <label className="font-poppins mb-[0.3em] block text-[1em] font-medium text-[#9E9E9E]">
          Email
        </label>
        <Input
          type="email"
          className={inputClass}
          placeholder="Digite o email"
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
      </div>

      <div>
        <label className="font-poppins mb-[0.3em] block text-[1em] font-medium text-[#9E9E9E]">
          Confirmar Senha
        </label>
        <div className="relative">
          <Input
            type={mostrarConfirmarSenha ? "text" : "password"}
            className={inputClass}
            placeholder="Digite sua senha novamente"
            {...register("confirmarSenha")}
          />
          <span
            className="text-muted-foreground absolute top-2.5 right-3 cursor-pointer"
            onClick={() => setMostrarConfirmarSenha((prev) => !prev)}
          >
            {mostrarConfirmarSenha ? <EyeOff size={18} /> : <Eye size={18} />}
          </span>
        </div>
        {errors.confirmarSenha && (
          <p className="text-sm text-[#f65c5c]">
            {errors.confirmarSenha.message}
          </p>
        )}
      </div>

      <div className="flex items-center space-x-2">
        <Controller
          name="termos"
          control={control}
          rules={{ required: "Campo obrigatório" }}
          render={({ field }) => (
            <Checkbox
              id="termos"
              checked={field.value}
              onCheckedChange={field.onChange}
            />
          )}
        />
        <label
          htmlFor="termos"
          className="font-poppins text-[0.9em] leading-none font-medium text-[#9E9E9E]"
        >
          Li e aceito os termos de privacidade
        </label>
      </div>
      {errors.termos && (
        <p className="text-sm text-[#f65c5c]">{errors.termos.message}</p>
      )}

      <Button
        type="submit"
        className="font-poppins w-full rounded-full bg-[#f65c5c] text-[1em] font-semibold text-[#FFE3CF] hover:bg-[#e25555]"
        disabled={isSubmitting}
      >
        {isSubmitting ? "Registrando..." : "Registrar"}
      </Button>
      <Toaster position="bottom-left"/>
    </form>
  );
}
