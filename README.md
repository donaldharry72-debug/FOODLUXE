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

## Order confirmation email setup

FOODLUXE sends the order confirmation through Mailgun only after Paystack verifies a successful payment. Paystack webhook retries are checked against the order's email status to avoid sending the same confirmation again.

Before deploying this feature:

1. Run `supabase/migrations/20261002140000_order_confirmation_email.sql` in the Supabase SQL Editor.
2. Add these server-only environment variables to `.env.local` for local development and to Vercel's Production environment:

   ```text
   MAILGUN_API_KEY=your-mailgun-sending-key
   MAILGUN_DOMAIN=your-mailgun-sending-domain
   MAILGUN_FROM=FOODLUXE <postmaster@your-mailgun-sending-domain>
   MAILGUN_REGION=us
   ```

   Set `MAILGUN_REGION` to `eu` if your Mailgun sending domain is in the EU. Never use a `NEXT_PUBLIC_` prefix for Mailgun credentials.
3. In Paystack's webhook settings, set the webhook URL to `https://foodluxe.vercel.app/api/paystack/webhook`.
4. Redeploy after adding Vercel environment variables. For a Mailgun sandbox domain, authorize the recipient address in Mailgun before placing a test order.
