# Core Learn

Aplicativo desktop (Windows) — guia de estudos interativo para quem vai iniciar a faculdade de Medicina.

**Guia de uso (estudante):** ver [GUIA.md](GUIA.md).

**Download (instalador):** [Releases no GitHub](https://github.com/The-P-P/core-learn/releases/latest)

## Stack

- Tauri v2 + React + TypeScript + Vite
- SQLite (`tauri-plugin-sql`)
- Tailwind CSS + Zustand + lucide-react + recharts
- Auto-update via `tauri-plugin-updater` + GitHub Releases

## Para quem só quer usar

1. Baixe o instalador `.exe` (NSIS) da [última Release](https://github.com/The-P-P/core-learn/releases/latest).
2. Instale e abra o Core Learn.
3. Nas próximas versões, o app pergunta se deseja atualizar ao abrir (ou em **Configurações → Verificar atualizações**). Não é preciso baixar de novo manualmente.

O progresso fica em `%APPDATA%\com.corelearn.app\` e é preservado nas atualizações.

> Sem certificado Authenticode comercial, o Windows / SmartScreen pode avisar na **primeira** instalação. Updates seguintes são assinados pelo mecanismo do Tauri.

## Desenvolvimento

Pré-requisitos: Node.js, Rust (`rustup`), Visual Studio Build Tools (C++).

Neste ambiente com Smart App Control / Device Guard, o binário de debug precisa ser assinado. Use:

```bash
npm run app:dev
```

Isso compila, assina com o certificado local `Core Learn Dev` e inicia o app (com Vite).

Alternativa padrão Tauri (se o SO permitir executar o `.exe` sem bloqueio):

```bash
npm install
npm run tauri dev
```

## Build de produção (local)

```bash
npm run tauri build
```

O instalador NSIS fica em `src-tauri/target/release/bundle/nsis/`.

Para gerar artefatos de update assinados localmente, defina:

```powershell
$env:TAURI_SIGNING_PRIVATE_KEY = Get-Content -Raw .tauri/core-learn.key
# opcional, se a chave tiver senha:
# $env:TAURI_SIGNING_PRIVATE_KEY_PASSWORD = "..."
npm run tauri build
```

Opcional após o build (Authenticode local):

```bash
powershell -File scripts/sign-release.ps1
```

## Publicar uma versão (GitHub Releases + auto-update)

O workflow [`.github/workflows/release.yml`](.github/workflows/release.yml) roda em push de tag `v*` (ex.: `v0.1.1`), gera o instalador no Windows e publica a Release com `latest.json` para o updater.

### 1. Secrets (uma vez)

No GitHub: **Settings → Secrets and variables → Actions**:

| Secret | Conteúdo |
|--------|----------|
| `TAURI_SIGNING_PRIVATE_KEY` | Conteúdo completo de `.tauri/core-learn.key` (gerado localmente; nunca commitado) |
| `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` | Senha da chave, se houver; pode ficar vazio |

A chave pública já está em `src-tauri/tauri.conf.json` → `plugins.updater.pubkey`.

Se ainda não existir o par local:

```bash
npx tauri signer generate -w .tauri/core-learn.key
```

Cole a pubkey gerada em `tauri.conf.json` e configure o secret da privada no GitHub.

### 2. Bump de versão

Atualize a **mesma** versão em:

- `package.json`
- `src-tauri/Cargo.toml`
- `src-tauri/tauri.conf.json`

### 3. Tag e push

```bash
git add -A
git commit -m "Release v0.1.1"
git tag v0.1.1
git push origin master
git push origin v0.1.1
```

A Actions publica a Release. Quem já instalou recebe a atualização pelo app.

## Dados

- Banco local: `%APPDATA%\com.corelearn.app\core_learn.db`
- Conteúdo inicial via migration SQL (`src-tauri/seed.sql`)
- Progresso, anotações e histórico persistem offline entre sessões
