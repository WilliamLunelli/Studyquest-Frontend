# StudyQuest Frontend

Frontend e camada de API no estilo BFF do StudyQuest, construídos com Next.js App Router, React, TypeScript, Tailwind CSS, Prisma e SQLite.

Este repositório inclui:
- Landing page pública
- Fluxo de login com sessão baseada em cookie
- Dashboard de progresso, ranking e matérias pendentes
- Página de matérias com modal local para criação temporária de matéria
- Rotas de API no app router do Next.js

## 1. Status do Projeto

Status atual deste frontend:
- API de autenticação ativa para login e consulta do usuário atual.
- API do dashboard ativa com métricas agregadas via Prisma.
- API de matérias ativa para listagem e fluxo de adição temporária.
- Páginas de UI conectadas às camadas compartilhadas em lib/frontend e lib/services.
- Build de produção e validação do Prisma estão passando.

## 2. Stack Tecnológica

- Next.js 15 (App Router)
- React 19
- TypeScript 5
- Tailwind CSS 3
- Prisma 6.15
- SQLite (desenvolvimento)
- bcryptjs (comparação de senha no login)

## 3. Requisitos

Instale estes requisitos antes de executar:
- Node.js 20 ou superior
- npm 10 ou superior

Recomendado:
- VS Code
- Extensões do Prisma e Tailwind CSS

## 4. Variáveis de Ambiente

Crie um arquivo local de variáveis de ambiente na raiz do projeto:

Arquivo: .env

Exemplo:

```env
DATABASE_URL="file:./prisma/dev.db"
SESSION_SECRET="replace-with-a-long-random-secret"
```

Observações:
- DATABASE_URL é obrigatório para validação do schema Prisma e geração do client.
- SESSION_SECRET é obrigatório para assinar e validar os cookies de autenticação.

## 5. Configuração e Execução

1. Instale as dependências:

```bash
npm install
```

2. Gere o Prisma client:

```bash
npm run prisma:generate
```

3. Execute as migrations:

```bash
npm run prisma:migrate
```

4. Popule o banco local com dados de exemplo (usuários, áreas, matérias, sessões e badges):

```bash
npm run prisma:seed
```

5. Inicie o servidor de desenvolvimento:

```bash
npm run dev
```

Acesse http://localhost:3000

## 6. Scripts Disponíveis

- npm run dev: inicia o servidor local de desenvolvimento
- npm run build: gera build de produção com checagens de tipos e lint
- npm run start: executa a aplicação já buildada
- npm run prisma:generate: regenera o Prisma client
- npm run prisma:migrate: cria/aplica migration em desenvolvimento
- npm run prisma:seed: popula dados de exemplo

## 7. Login de Teste Local

Após rodar o seed, estes usuários ficam disponíveis:

- andre@emailteste.com / 123456
- ana@emailteste.com / 123456
- guilherme@emailteste.com / 123456
- william@emailteste.com / 123456

## 8. Rotas Principais

Páginas:
- /: landing page
- /login: página de login
- /dashboard: dashboard autenticado
- /subjects: página de matérias autenticada

Rotas de API:
- POST /api/auth/login: valida credenciais e define cookie de sessão
- GET /api/auth/me: retorna o usuário autenticado atual
- GET /api/dashboard: retorna estatísticas do usuário, matérias pendentes e ranking
- GET /api/subjects: retorna os cards de matérias do usuário logado
- POST /api/subjects: valida o payload e retorna objeto temporário de matéria

## 9. Visão Geral da Arquitetura

Estrutura em alto nível:
- app: páginas e handlers das rotas de API
- components: componentes de UI reutilizáveis
- lib/frontend: helpers e mapeadores puros de frontend
- lib/services: wrappers client-side para chamadas de API das páginas
- lib/session e lib/auth-session: assinatura e extração do token de cookie
- prisma: schema e script de seed

As telas de dashboard e matérias são organizadas em camadas para evitar lógica duplicada:
- As páginas de UI cuidam da renderização e da orquestração de estado.
- Os serviços cuidam da comunicação com API e da normalização das respostas.
- Os helpers de frontend cuidam de transformações, filtros e armazenamento temporário local.

## 10. Notas de Autenticação e Sessão

- O login define um cookie httpOnly chamado studyquest_session.
- O formato do token é userId + assinatura HMAC.
- Rotas de API que exigem autenticação leem o cookie da requisição e validam a assinatura.
- Em respostas não autorizadas, as páginas de dashboard e matérias redirecionam para /login.

## 11. Checklist Pré-Push

Execute estes comandos antes de fazer push:

```bash
npm run build
npx prisma validate
npm run prisma:generate
```

Se os três passarem, o repositório está pronto para push no que diz respeito a build e Prisma.

## 12. Solução de Problemas

### Aviso de datasource do Prisma no VS Code

Neste projeto, o Prisma CLI 6.15 exige datasource url em schema.prisma, enquanto alguns diagnósticos do editor podem sugerir o estilo do Prisma 7 (config-only datasource).

A mitigação atual no workspace está em .vscode/settings.json, desabilitando localmente os diagnósticos do Prisma.

### Erro EPERM no Windows durante prisma generate

Se ocorrer erro de rename EPERM em query_engine-windows.dll.node:
- Feche processos em execução de Next.js/Node.
- Feche o Prisma Studio ou terminais que possam estar com lock no arquivo.
- Exclua .next e rode novamente prisma generate.
- Se necessário, reinicie o VS Code ou a máquina.

