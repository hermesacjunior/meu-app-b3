# Achego

**Gente de verdade, pertinho de você.**

Achego é um app de relacionamento por **proximidade, região e conexões em comum**,
para iOS e Android. A ideia é ajudar pessoas solteiras (ou recém-separadas) a se
encontrarem perto de onde vivem — do jeito certo: **todo mundo entra porque quer
ser encontrado.**

---

## O princípio: consentimento por design

Este é o ponto que separa o Achego de um raspador de dados. Toda informação
sensível — gênero, orientação, situação de relacionamento, localização — é
**declarada pela própria pessoa, com opt-in**, e nunca inferida ou coletada de
terceiros.

- A pessoa cria o perfil e declara que está solteira/recém-separada.
- A descoberta por proximidade só liga se a pessoa **ativar** a localização.
- Aparecer na busca é um botão que a pessoa liga e desliga quando quiser.
- Nenhuma coordenada crua de terceiros é exposta: a API retorna só **distância
  aproximada**, calculada no servidor (`discover_nearby`).

### Por que não existe a extensão de Instagram

O pedido original incluía uma extensão de Chrome para "captar no Instagram"
pessoas solteiras por região. **Isso não foi construído, de propósito**, porque:

1. Viola os Termos de Uso do Instagram (raspagem de perfis/amigos é proibida).
2. Viola a LGPD — processaria dados pessoais de gente que nunca consentiu, e
   "situação de relacionamento" é dado sensível.
3. É predatório: identificar quem está "recém-separado" sem essa pessoa pedir,
   para abordagem romântica, atinge alguém num momento vulnerável.

**Alternativa legal e sustentável** (roadmap): conectar o Instagram **da própria
pessoa** via login oficial (OAuth / Instagram Basic Display API). Assim dá para
mostrar amigos e interesses em comum — porque cada lado autorizou o próprio dado.

---

## Stack

- **App:** [Expo](https://expo.dev) + expo-router (um código para iOS e Android)
- **Backend:** [Supabase](https://supabase.com) — Auth, Postgres, PostGIS, RLS
- **Linguagem:** TypeScript

## Rodando localmente

```bash
cd achego
npm install
cp .env.example .env      # preencha com as chaves do seu projeto Supabase
npm start                 # abra no Expo Go (iOS/Android) ou emulador
```

### Configurando o Supabase

1. Crie um projeto em [supabase.com](https://supabase.com).
2. Rode a migração `supabase/migrations/0001_init.sql` no SQL Editor
   (ela cria tabelas, triggers, RLS e a função de descoberta por proximidade).
3. Em **Project Settings > API**, copie a URL e a `anon key` para o `.env`.

## Estrutura

```
achego/
├── app/                    # rotas (expo-router)
│   ├── (auth)/sign-in.tsx  # login / cadastro
│   ├── (tabs)/
│   │   ├── discover.tsx    # descoberta por gênero/região/proximidade
│   │   ├── connections.tsx # pedidos de conexão recebidos
│   │   └── profile.tsx     # perfil, consentimento, toggles de privacidade
│   └── _layout.tsx         # controle de sessão / redirecionamento
├── components/             # UI (Button, ProfileCard, tema)
├── lib/                    # cliente Supabase + tipos de domínio
└── supabase/migrations/    # schema + RLS + RPC de proximidade
```

## Roadmap

- [ ] Reciprocidade → chat quando os dois aceitam
- [ ] Conexões em comum via login oficial do Instagram (OAuth)
- [ ] Verificação de perfil (reduzir fake/catfish)
- [ ] Denúncia e bloqueio
- [ ] Notificações push (novos pedidos e matches)

## Licença

Privado. Todos os direitos reservados.
