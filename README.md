# Hub Frontend

App web do Hub (Next.js) para dashboards, performance e operacoes. Este repositorio e um submodulo do projeto principal.

## Stack
- Next.js 16 (App Router)
- React 19
- TypeScript 5
- TailwindCSS 4
- shadcn/ui, Recharts

## Setup rapido (dev)
Requisitos: Node.js 20+.

```bash
npm install
```

Crie o arquivo de ambiente local:
```bash
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:3001
```

Inicie o app:
```bash
npm run dev
```

Acesso: `http://localhost:3000`

## Scripts
- `npm run dev`
- `npm run build`
- `npm run start`
- `npm run lint`

## Notas
- Este repo e referenciado pelo projeto principal como submodulo.
