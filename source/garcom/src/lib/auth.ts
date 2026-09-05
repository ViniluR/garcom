import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/db";
import { loadEmailTemplate, sendMail } from "@/lib/email";
import * as schema from "@/db/schema";

function getOrigin(value: string | undefined): string | undefined {
  if (!value) return undefined;

  try {
    return new URL(value).origin;
  } catch {
    return undefined;
  }
}

function getVercelOrigin(value: string | undefined): string | undefined {
  return getOrigin(value ? `https://${value}` : undefined);
}

const authBaseURL = getOrigin(process.env.BETTER_AUTH_URL);
const emailBaseURL = getOrigin(process.env.BASE_URL) ?? authBaseURL;
const trustedOrigins = [
  authBaseURL,
  getOrigin(process.env.BASE_URL),
  getOrigin(process.env.NEXT_PUBLIC_BASE_URL),
  getOrigin(process.env.NEXT_PUBLIC_APP_URL),
  getVercelOrigin(process.env.VERCEL_PROJECT_PRODUCTION_URL),
  getVercelOrigin(process.env.VERCEL_BRANCH_URL),
  getVercelOrigin(process.env.VERCEL_URL),
].filter((origin): origin is string => Boolean(origin));

export const auth = betterAuth({
  baseURL: authBaseURL,
  trustedOrigins,
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    autoSignIn: false,
    sendResetPassword: async ({ user, url, token }: any, _request: any) => {
      const updatedUrl = url.replace(
        process.env.BETTER_AUTH_URL,
        emailBaseURL ?? "",
      );
      await sendMail({
        to: user.email,
        subject: "Redefina sua senha em Garçom.",
        html: loadEmailTemplate("reset-password.html", {
          url: updatedUrl,
        }),
      });
    },
  },
  emailVerification: {
    sendVerificationEmail: async ({ user, url, token }: any, _request: any) => {
      const updatedUrl = url.replace(
        process.env.BETTER_AUTH_URL,
        emailBaseURL ?? "",
      );
      await sendMail({
        to: user.email,
        subject: "Verifique seu endereço de email em Garçom.",
        html: loadEmailTemplate("confirm-email.html", {
          url: updatedUrl,
        }),
      });
    },
  },
  logger: console,
  user: {
    modelName: "user",
  },
  session: {
    modelName: "session",
  },
  account: {
    modelName: "account",
  },
  verification: {
    modelName: "verification",
  },
});
