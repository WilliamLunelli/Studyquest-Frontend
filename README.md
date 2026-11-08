# StudyQuest Frontend

Aplicação web de planejamento e acompanhamento de estudos, construída com Next.js App Router, React, TypeScript e Tailwind CSS. A interface consome a API REST dedicada do StudyQuest. Regras de negócio, autenticação, XP, ciclos, revisões e persistência são responsabilidade dessa API.

## Executar

Com Node.js e npm instalados, execute:

```sh
npm install
npm run dev
```

O frontend abre em `http://localhost:3000`. A API deve estar em execução separadamente, com banco e catálogo configurados conforme o README do backend.

Configure `.env` a partir de `.env.example`. A integração utiliza:

```env
NEXT_PUBLIC_API_URL=http://localhost:3333/api
```

O navegador também acessa diretamente essa URL nas sessões. Em outro ambiente, configure a URL pública correta e a origem permitida pelo CORS do backend.

```sh
npm test
npm run build
npm start
```

Os testes usam o executor nativo do Node e remoção de tipos TypeScript (`--experimental-strip-types`); utilize Node 22.18 ou superior para esse comando. O build utiliza Google Fonts e requer acesso de rede para buscar as fontes.

## Percurso do usuário

1. Criar conta ou entrar.
2. Configurar objetivo, instituição, pesos, disponibilidade e dificuldades no onboarding.
3. Gerar o ciclo e iniciar um bloco pela Home ou pela página de ciclo.
4. Pausar, retomar, recuperar e encerrar a sessão com autoavaliação.
5. Registrar opcionalmente questões e consultar o desempenho.
6. Abrir revisões, realizar a recuperação ativa e iniciar uma sessão de revisão.
7. Ajustar preferências, atualizar o ciclo quando desejado ou sair da conta.

Sessões de menos de cinco minutos ficam no histórico, mas a API não concede XP de estudo, não avança o bloco e não agenda revisão. O resultado final mostra os valores e a data de revisão efetivamente retornados pelo servidor. Questões são gravadas em uma segunda chamada; se ela falhar, o formulário pendente permite repetir somente esse registro.

## Organização e integração

- `app/`: páginas e rotas intermediárias do Next.js.
- `components/`: navegação, temas, autenticação e onboarding.
- `lib/services/`: clientes HTTP e contratos da API.
- `lib/frontend/session.ts`: normalização temporal e validação das questões.
- `lib/user-storage.ts`: estado local separado por usuário.
- `scripts/frontend-regressions.test.mjs`: regressões do cronômetro e da validação de questões.

As rotas `/api/...` do Next.js encaminham autenticação, configurações, ciclo, Home, desempenho, revisões e questões à API. O dashboard agrega dados do usuário e de desempenho, preservando falhas do backend. `/api/me` consulta a conta atual. O detalhe de revisão é complementado com os IDs presentes nas listas de revisões de hoje e dos próximos 60 dias, sem depender do ciclo atual. A lista `/api/reviews` também permite atualizar a data exibida após as questões, quando o desempenho antecipa uma revisão.

O JWT é armazenado no navegador e enviado como `Authorization: Bearer`. A saída da conta remove a autenticação local. Preferências, rascunhos e contexto das sessões são separados por usuário.


O cronômetro mantém separadamente os minutos confirmados pela API e os segundos exibidos nesta tela. Os segundos locais são preservados ao pausar, retomar e recuperar a mesma sessão neste navegador. Eles nunca são enviados como duração nem usados para conceder XP. A conclusão de revisão confirma o mínimo de cinco minutos por uma consulta atualizada ao servidor.

Existe uma pendência de contabilização no backend: cada pausa descarta a parte incompleta do minuto. O relógio visual evita o reset, mas não recupera esses segundos no banco. A tela identifica essa diferença. Blocos de 25/50 minutos selecionam os presets correspondentes; as demais durações usam timer livre com o alvo planejado.

## Limitações da API a acompanhar

- Não há leitura dos sete horários nem das dificuldades salvas. Configurações identifica o último estado deste navegador e exige preenchimento explícito quando ele não existe.
- A sessão ativa não retorna IDs de matéria/assunto. O contexto local permite recuperar sessões iniciadas neste navegador; em outro aparelho, a sessão pode ser retomada/encerrada, mas o registro de questões fica indisponível sem esses IDs.
- O backend ainda descarta segundos parciais em cada pausa. A duração precisa ser acumulada com maior precisão no serviço; o relógio visual não substitui a contabilização do servidor.
- O detalhe individual de revisão não retorna os IDs. As listas existentes atendem revisões pendentes e próximas; outros casos ainda dependem de ampliar esse contrato.
- Não há fluxo de recuperação de senha nem listagem completa de assuntos dominados. A interface informa os limites.
- A API não oferece chave de idempotência para questões. Após uma perda de conexão com resultado incerto, confira o desempenho antes de repetir o registro.

O service worker mantém o carregamento básico em cache. Novas gravações não são enfileiradas offline nem apresentadas como salvas sem confirmação do servidor. A fila legada pode concluir pedidos pendentes da versão anterior.

Os documentos de auditoria e de correções na pasta de documentação registram o escopo acadêmico, as verificações e as pendências do backend.
