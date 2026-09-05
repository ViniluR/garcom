import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/db";
import { loadEmailTemplate, sendMail } from "@/lib/email";
import * as schema from "@/db/schema";

export const auth = betterAuth({
  trustedOrigins: [
    process.env.BETTER_AUTH_URL,
    process.env.BASE_URL,
    process.env.NEXT_PUBLIC_BASE_URL,
    process.env.NEXT_PUBLIC_APP_URL,
  ].filter((origin): origin is string => Boolean(origin)),
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
        process.env.BASE_URL,
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
        process.env.BASE_URL,
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
