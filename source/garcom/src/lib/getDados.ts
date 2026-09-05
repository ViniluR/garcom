import { headers } from "next/headers";

import { auth } from "@/lib/auth";

interface DadosUsuario {
  session: any;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    image?: string | null;
  };
  role: string;
  roleData: any;
}

export async function getDados(): Promise<DadosUsuario | null> {
  const headersList = await headers();
  const session = await auth.api.getSession({ headers: headersList });

  if (!session?.user?.id) return null;

  const forwardedHost = headersList.get("x-forwarded-host");
  const host = forwardedHost ?? headersList.get("host");
  const forwardedProto = headersList.get("x-forwarded-proto");
  const protocol = forwardedProto ?? (host?.startsWith("localhost") ? "http" : "https");
  const baseUrl = `${protocol}://${host}`;

  try {
    const userRes = await fetch(`${baseUrl}/api/user?id=${session.user.id}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        cookie: headersList.get("cookie") ?? "",
      },
      cache: "no-store",
    });

    console.log("Response from user API:", userRes);
    if (!userRes.ok) return null;
    const user = await userRes.json();
    console.log("User data:", user);

    let roleData = null;

    if (user.role === "restaurante") {
      const res = await fetch(`${baseUrl}/api/restaurante?user_id=${user.id}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      });
      if (res.ok) roleData = await res.json();
    } else if (user.role === "funcionario") {
      const res = await fetch(`${baseUrl}/api/funcionario?user_id=${user.id}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      });
      if (res.ok) roleData = await res.json();
    }

    return {
      session,
      user,
      role: user.role,
      roleData: {
        ...roleData,
        name: user.name,
        email: user.email,
        image: user.image,
      },
    };
  } catch (e) {
    console.error("Erro ao buscar dados do usuário:", e);
    return null;
  }
}