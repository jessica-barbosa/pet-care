# pet-care

Aplicacao web (frontend only) para gestao de cuidados com pets.
Stack: **React 19 + TypeScript + Vite + Tailwind CSS v4 + React Router + TanStack Query**, preparada para usar **Supabase** como backend (auth + banco), sem servidor proprio.

## Rodando

```bash
npm install
npm run dev
```

App em http://localhost:5173

| Script              | O que faz                          |
| ------------------- | ---------------------------------- |
| `npm run dev`       | Servidor de desenvolvimento (HMR)  |
| `npm run build`     | Typecheck + build de producao      |
| `npm run preview`   | Serve o build de producao          |
| `npm run lint`      | ESLint                             |
| `npm run typecheck` | Apenas checagem de tipos           |
| `npm run format`    | Prettier em `src/`                 |

## Estrutura

```
src/
  app/          App.tsx (providers) e router.tsx (rotas)
  components/
    layout/     AppLayout (sidebar + header)
    ui/         Button, Card, Spinner, PageHeader
  features/     Codigo por dominio
    auth/       AuthProvider, useAuth, ProtectedRoute
    pets/       types.ts, api.ts (acesso a dados), queries.ts (hooks)
  lib/          env.ts, supabase.ts, queryClient.ts, utils.ts
  pages/        Uma pagina por rota
  types/        database.ts (tipos gerados do Supabase)
```

Convencao: import absoluto com o alias `@/` (ex.: `import { Button } from '@/components/ui/Button'`).

Cada dominio novo segue o padrao de `features/pets`: `types.ts` (modelo) → `api.ts` (acesso a dados) → `queries.ts` (hooks React Query) → paginas consomem so os hooks.

## Rotas

| Rota          | Pagina          | Acesso   |
| ------------- | --------------- | -------- |
| `/login`      | LoginPage       | publica  |
| `/`           | DashboardPage   | privada  |
| `/pets`       | PetsPage        | privada  |
| `/pets/:petId`| PetDetailPage   | privada  |
| `/agenda`     | AgendaPage      | privada  |
| `*`           | NotFoundPage    | publica  |

## Modo mock (estado atual)

Sem as variaveis do Supabase definidas, `src/lib/supabase.ts` exporta `null` e a app roda inteira em mock:

- login aceita qualquer e-mail/senha e guarda a sessao no `localStorage`;
- `features/pets/api.ts` devolve uma lista fixa de pets;
- uma faixa amarela no topo avisa que o Supabase nao esta configurado.

## Ligando o Supabase

1. Criar o projeto no Supabase e copiar URL + anon key.
2. `cp .env.example .env.local` e preencher `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`.
   Apenas variaveis `VITE_*` chegam ao browser — nunca colocar a `service_role` aqui.
3. Criar as tabelas e habilitar **RLS** (a anon key e publica; a seguranca fica nas policies).
4. Gerar os tipos por cima do placeholder:
   ```bash
   npx supabase gen types typescript --project-id <project-id> > src/types/database.ts
   ```
5. Trocar o corpo das funcoes em `features/*/api.ts` pelas queries reais (`supabase.from('pets').select('*')`). Os hooks e as paginas nao mudam.

O `AuthProvider` ja alterna sozinho para o fluxo real do Supabase Auth (`signInWithPassword`, `onAuthStateChange`) assim que as variaveis existirem.
