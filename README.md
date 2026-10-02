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
    layout/     PetLayout (sidebar das secoes do pet)
    ui/         Button, Card, Field, PageHeader, SectionPlaceholder, Spinner, MockBanner
  features/     Codigo por dominio
    auth/       AuthProvider, useAuth, ProtectedRoute
    pets/       types.ts, api.ts (acesso a dados), queries.ts (hooks), components/PetAvatar
  lib/          env.ts, supabase.ts, queryClient.ts, utils.ts
  pages/        Login, SelectPet, NewPet, NotFound
    pet/        Secoes de dentro de um pet (visao geral, agenda, peso, ...)
  types/        database.ts (tipos gerados do Supabase)
```

Convencao: import absoluto com o alias `@/` (ex.: `import { Button } from '@/components/ui/Button'`).

Cada dominio novo segue o padrao de `features/pets`: `types.ts` (modelo) → `api.ts` (acesso a dados) → `queries.ts` (hooks React Query) → paginas consomem so os hooks.

## Navegacao

O **pet e o "perfil"** da app: depois do login voce escolhe um pet (estilo seletor de
perfis do Netflix) e todas as secoes vivem dentro do contexto dele.

```
/login  →  /  (seletor de pets)  →  /pets/:petId/...  (sidebar com as secoes)
                  ↓
              /pets/novo
```

| Rota                      | Pagina               | Layout            |
| ------------------------- | -------------------- | ----------------- |
| `/login`                  | LoginPage            | tela cheia        |
| `/`                       | SelectPetPage        | tela cheia escura |
| `/pets/novo`              | NewPetPage           | formulario        |
| `/pets/:petId`            | PetOverviewPage      | PetLayout         |
| `/pets/:petId/agenda`     | PetAgendaPage        | PetLayout         |
| `/pets/:petId/peso`       | PetWeightPage        | PetLayout         |
| `/pets/:petId/consultas`  | PetAppointmentsPage  | PetLayout         |
| `/pets/:petId/vacinas`    | PetVaccinesPage      | PetLayout         |
| `/pets/:petId/historico`  | PetHistoryPage       | PetLayout         |
| `*`                       | NotFoundPage         | tela cheia        |

Tudo fora de `/login` exige sessao (`ProtectedRoute`).

### Adicionando uma secao nova ao pet

1. Criar a pagina em `src/pages/pet/`.
2. Adicionar a rota filha em `src/app/router.tsx`.
3. Adicionar o item em `navItems` no `PetLayout`.

O avatar do pet usa a inicial do nome com uma cor derivada do `id`; quando `photoUrl`
existir, a foto entra no lugar sem mexer no layout.

### Dominios e views

Tres dominios tem dados proprios, no mesmo padrao (`types.ts` → `api.ts` → `queries.ts`):
**weights**, **vaccines** e **appointments**.

Agenda, Historico e os cards da Visao geral **nao tem dados proprios**. As duas primeiras
leem `features/timeline/useTimeline`, que junta os tres dominios numa lista de
`TimelineEvent` (passado e futuro) e nao tem api nem cache proprios — reusa as queries de
cada dominio, entao o que for registrado numa secao aparece nas outras na hora.

Um dominio novo aparece na Agenda e no Historico so adicionando a conversao em
`useTimeline`; nenhuma das duas telas precisa mudar.

Peso e vacina sao registros imutaveis (sem editar, sem remover). Consulta e a excecao:
nasce agendada e recebe o desfecho depois, entao tem status e update.

## Modo mock (fallback)

Sem as variaveis do Supabase definidas, `src/lib/supabase.ts` exporta `null` e a app roda
inteira em mock — util para rodar o projeto sem criar um projeto Supabase:

- login aceita qualquer e-mail/senha e guarda a sessao no `localStorage`;
- cada `features/*/api.ts` devolve dados fixos em memoria — o que for registrado aparece
  na hora, mas some ao recarregar a pagina;
- as datas dos mocks sao relativas a hoje, para os estados (vacina em atraso, consulta
  agendada) nao envelhecerem;
- uma faixa amarela no topo avisa que o Supabase nao esta configurado.

## Supabase

A troca entre mock e banco real e automatica: basta `.env.local` (ou `.env`) ter as duas
variaveis. O `AuthProvider` tambem alterna sozinho para o Supabase Auth.

Para montar um ambiente do zero:

1. Criar o projeto no Supabase, regiao **South America (Sao Paulo)**.
2. Copiar `.env.example` para `.env.local` e preencher com Project URL + chave **anon**
   (Settings → API). Apenas variaveis `VITE_*` chegam ao browser — a `service_role`
   **nunca** entra aqui.
3. Rodar [`supabase/migrations/0001_initial_schema.sql`](supabase/migrations/0001_initial_schema.sql)
   no SQL Editor. Cria as quatro tabelas com RLS.
4. Authentication → Providers → Email: desligar "Confirm email" em desenvolvimento.
5. Criar a conta pela propria tela de login da app.

### Seguranca

A anon key e publica — ela identifica o projeto, nao autoriza nada. Toda a protecao esta
nas policies de RLS, e o papel `anon` nao tem privilegio em nenhuma tabela: tudo exige
login. Cada usuario enxerga apenas os proprios pets, e as tabelas filhas sao alcancadas
atraves de `pets`.

As regras de produto estao no banco, nao so na interface: `weights` e `vaccines` tem
policy apenas de SELECT e INSERT (registro historico nao se altera), e `appointments`
ganha UPDATE porque recebe o desfecho depois — nenhuma das tres aceita DELETE.

### Tipos

`src/types/database.ts` foi escrito a mao a partir da migration. Depois de qualquer
mudanca de esquema, regerar (exige `npx supabase login` antes):

```bash
npx supabase gen types typescript --project-id <project-ref> > src/types/database.ts
```

### snake_case x camelCase

O banco usa `snake_case` e a app `camelCase`. A conversao vive **apenas** nos
`features/*/api.ts`, em dois mapeadores por dominio (`toX` / `toRow`). Nenhum hook ou
tela conhece o formato das colunas.
