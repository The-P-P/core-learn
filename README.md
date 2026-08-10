# Core Learn

Aplicativo desktop (Windows) — guia de estudos interativo para quem vai iniciar a faculdade de Medicina.

**Guia de uso (estudante):** ver [GUIA.md](GUIA.md).

## Stack

- Tauri v2 + React + TypeScript + Vite
- SQLite (`tauri-plugin-sql`)
- Tailwind CSS + Zustand + lucide-react + recharts

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

## Build de produção

```bash
npm run tauri build
```

O instalador NSIS fica em `src-tauri/target/release/bundle/nsis/`.

Opcional após o build:

```bash
powershell -File scripts/sign-release.ps1
```

## Dados

- Banco local: `%APPDATA%\com.corelearn.app\core_learn.db`
- Conteúdo inicial via migration SQL (`src-tauri/seed.sql`)
- Progresso, anotações e histórico persistem offline entre sessões
