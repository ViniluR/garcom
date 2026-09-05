This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Deploy no Vercel

Configure o projeto Vercel com `source/garcom` como **Root Directory**. O arquivo `vercel.json` dessa pasta instala as dependências com `npm ci`, aplica as migrations Drizzle e executa o build Next.js.

### Variáveis de ambiente

Cadastre no Vercel, para `Production`, `Preview` e `Development` quando necessário:

- `DATABASE_URL`: URL do PostgreSQL acessível pelo Vercel, preferencialmente uma conexão pooled/serverless.
- `BETTER_AUTH_SECRET`: segredo aleatório longo, diferente por ambiente.
- `BETTER_AUTH_URL` e `BASE_URL`: URL pública do ambiente, sem `/` no final.
- `BREVO_SMTP_HOST`, `BREVO_SMTP_PORT`, `BREVO_SMTP_USER`, `BREVO_SMTP_PASSWORD` e `BREVO_SMTP_SENDER`: credenciais SMTP usadas nos emails de autenticação.
- `NEXT_PUBLIC_BASE_URL` e `NEXT_PUBLIC_APP_URL`: mesma URL pública, usada nos QR codes.

Use [`.env.example`](.env.example) como modelo. Nunca versione `.env.local` ou credenciais reais.

### Banco de dados

Com uma `DATABASE_URL` local configurada, gere e aplique a migration inicial:

```bash
cp .env.example .env.local
# edite .env.local
npm ci
npm run db:generate
npm run db:migrate
```

Depois, versione a pasta `drizzle/` gerada. O deploy executa apenas o build da aplicação; migrations não devem rodar automaticamente durante o build do Vercel.

Execute `npm run db:migrate` uma vez, manualmente, contra o banco de produção depois de confirmar que o schema atual está alinhado com a migration. Se o banco já tiver tabelas ou tipos criados, não remova dados: faça um backup e alinhe/baselineie o schema antes de aplicar a migration inicial.
