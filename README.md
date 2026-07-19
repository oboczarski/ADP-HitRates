# Rookie ADP Hit Rates

A responsive fantasy-football dashboard that visualizes rookie hit rates by
draft range and position. The application uses the Next.js App Router, React,
TypeScript, Recharts, and Tailwind CSS.

## Requirements

- Node.js `>=22.13.0` (Node 24 is selected in `.nvmrc`)
- npm

## Local development

Install the locked dependencies and start the development server:

```bash
npm ci
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Validation

```bash
npm test
```

The test command runs ESLint and creates a production Next.js build. You can
also run those checks separately with `npm run lint` and `npm run build`.

To test the production server after building:

```bash
npm run start
```

## Repository layout

- `app/` contains the dashboard route, global styles, and metadata.
- `public/` contains static assets.
- `next.config.ts` contains Next.js configuration.
- `package-lock.json` pins the npm dependency tree.

Dependencies and generated output such as `node_modules/`, `.next/`, coverage,
logs, local environment files, and `.netlify/` are intentionally ignored by
Git.

## Netlify

This is a standard root-level Next.js application. When it is ready to publish,
connect this GitHub repository in Netlify; Netlify can detect modern Next.js
projects and apply its maintained adapter automatically. No Netlify site or
deployment is created as part of local setup.
