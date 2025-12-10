# Contexto Live

Jogo multiplayer de dedução de palavras baseado em proximidade semântica. Os jogadores tentam descobrir uma palavra secreta recebendo feedback sobre quão "próximas" semanticamente suas tentativas estão do alvo.

## Mecânicas do Jogo

- **Ranking Semântico:** Rank 1 = Palavra Secreta. Quanto menor o número, mais próximo o significado.
- **Fog of War:** Você vê seus próprios chutes e rankings, mas o conteúdo dos oponentes é oculto.
- **Colisão (Reveal):** Se dois ou mais jogadores chutarem a mesma palavra, ela se torna pública.
- **Vitória:** Ganha quem acertar a palavra #1 primeiro.

## Stack Tecnológica

- **Frontend:** Next.js 16 (App Router), TypeScript, Tailwind CSS, shadcn/ui
- **Backend:** Supabase (Database, Auth, Realtime, Vector)
- **Embeddings:** OpenAI text-embedding-3-small + pgvector

## Configuração

### 1. Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz do projeto:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# OpenAI (for seed script)
OPENAI_API_KEY=your_openai_api_key_here
```

### 2. Configurar Banco de Dados

Execute o SQL do arquivo `supabase/migrations/001_initial_schema.sql` no SQL Editor do Supabase.

Este script irá:
- Habilitar a extensão `pgvector`
- Criar as tabelas: `dictionary`, `rooms`, `room_players`, `guesses`
- Criar as funções RPC: `create_room`, `join_room`, `start_game`, `submit_guess`, `get_room_details`
- Habilitar Realtime nas tabelas necessárias

### 3. Popular o Dicionário

Execute o script de seed para popular a tabela `dictionary` com palavras e embeddings:

```bash
npm run seed
```

**Nota:** Este script consome a API da OpenAI para gerar embeddings. O custo estimado para ~500 palavras é menos de $0.10 USD.

### 4. Iniciar o Servidor de Desenvolvimento

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000)

## Scripts Disponíveis

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Inicia o servidor de desenvolvimento |
| `npm run build` | Compila o projeto para produção |
| `npm run start` | Inicia o servidor de produção |
| `npm run lint` | Executa o linter |
| `npm run seed` | Popula o dicionário com embeddings |

## Estrutura do Projeto

```
contexto-live/
├── src/
│   ├── app/
│   │   ├── layout.tsx          # Layout global
│   │   ├── page.tsx            # Lobby
│   │   ├── providers.tsx       # Context providers
│   │   └── room/[id]/
│   │       └── page.tsx        # Arena de jogo
│   ├── components/
│   │   ├── GuessInput.tsx      # Input de palpites
│   │   ├── MyGuesses.tsx       # Lista de meus palpites
│   │   ├── RoomFeed.tsx        # Feed da sala (multiplayer)
│   │   ├── RoomHeader.tsx      # Header com info da sala
│   │   ├── RankBadge.tsx       # Badge visual do ranking
│   │   └── ui/                 # Componentes shadcn/ui
│   ├── hooks/
│   │   └── useRoom.ts          # Hook de Realtime
│   └── lib/
│       ├── supabase.ts         # Cliente Supabase
│       ├── types.ts            # Tipos TypeScript
│       ├── rank-utils.ts       # Utilitários de ranking
│       └── utils.ts            # Utilitários gerais
├── scripts/
│   └── seed-dictionary.ts      # Script de seed
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql
└── .env.local                  # Variáveis de ambiente
```

## Como Jogar

1. **Lobby:** Digite seu nickname e clique em "Criar Sala" ou use um código para "Entrar"
2. **Sala de Espera:** Compartilhe o código da sala com amigos. O host clica em "Iniciar Jogo"
3. **Arena:** Digite palavras para tentar descobrir a palavra secreta
4. **Feedback:** 
   - 🏆 Verde Neon = Vitória (#1)
   - 🔥 Verde = Quente (#2-100)
   - 🟨 Amarelo = Morno (#101-1000)
   - 🟥 Vermelho = Frio (#1000+)

## Testando Multiplayer

Para testar sozinho:
1. Abra uma aba normal e uma aba anônima
2. Crie uma sala em uma aba
3. Entre com o código na outra aba
4. Jogue contra você mesmo para validar Realtime e Colisão

## Licença

MIT
