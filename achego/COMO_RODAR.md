# Como rodar o Achego

Guia rápido para ver o app funcionando na sua máquina.

## 1. Pré-requisitos

- **Node.js 18+** (recomendado 20 ou 22) — https://nodejs.org
- Opcional, para testar no celular: o app **Expo Go**
  ([iOS](https://apps.apple.com/app/expo-go/id982107779) /
  [Android](https://play.google.com/store/apps/details?id=host.exp.exponent))

## 2. Clonar e instalar

```bash
git clone https://github.com/hermesacjunior/achego
cd achego
npm install
```

## 3. Criar o arquivo `.env`

Na raiz do projeto, crie um arquivo chamado **`.env`** com este conteúdo
(a `anon key` é pública, pode ficar no cliente):

```
EXPO_PUBLIC_SUPABASE_URL=https://vjmgxwntihkbjpckzapf.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZqbWd4d250aWhrYmpwY2t6YXBmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM1MTMzMzUsImV4cCI6MjA5OTA4OTMzNX0.XCIRzMmfgvofWfuGqLw8GJ0kf93uZJI-QuRNgnLcvxU
```

## 4. Rodar

```bash
npm start
```

Depois, no terminal:

- **No navegador (mais rápido):** pressione a tecla **`w`**.
- **No celular:** abra o **Expo Go** e escaneie o **QR code** que aparece no
  terminal. (Celular e computador precisam estar no mesmo Wi-Fi. Se der
  problema de rede, rode `npx expo start --tunnel`.)

## 5. Contas de teste

Todas usam a senha **`achego123`**:

| Email | Observação |
|---|---|
| `tester@achego.app` | Já tem uma conversa aberta com a Marina |
| `marina@achego.app` | O outro lado dessa conversa |
| `beatriz@achego.app`, `rafael@achego.app`, `camila@achego.app`, `lucas@achego.app`, `ana@achego.app` | Perfis para descobrir |

## 6. Roteiro de teste

1. **Login** — entre como `tester@achego.app` / `achego123`.
2. **Descobrir** — veja os perfis por proximidade (a conta de teste já tem
   localização em SP). Toque em **Quero conhecer** em alguém.
3. **Chat em tempo real** — vá em **Conversas**, abra a conversa com a Marina.
   Para ver o tempo real: abra o app em **dois lugares** (ex.: navegador + celular),
   entre como `tester` num e `marina@achego.app` no outro, abram a mesma
   conversa e mandem mensagem — aparece nos dois na hora.
4. **Foto de perfil** — aba **Perfil** → toque no avatar → escolha uma imagem.
5. **Bloquear / Denunciar** — no card de um perfil (ou no chat), toque no **⋯**.
   Ao bloquear, a pessoa some da descoberta e das conversas.

## O que funciona onde

| Recurso | Navegador (web) | Celular (Expo Go) |
|---|---|---|
| Login, descoberta, conexões | ✅ | ✅ |
| Chat em tempo real | ✅ | ✅ |
| Foto de perfil | ✅ | ✅ |
| Bloqueio / denúncia | ✅ | ✅ |
| **Notificações push** | ❌ (só mobile) | ⚠️ exige build de dev (ver abaixo) |

### Push notifications

O Expo Go **não recebe mais push remoto**. Para testar push num celular de
verdade:

1. `npx eas init` (cria um `projectId` e adiciona em `app.json` →
   `extra.eas.projectId`; o código já lê isso automaticamente)
2. `npx eas build --profile development` e instale o build no aparelho

O resto do app funciona 100% sem isso.
