# code-intel-ts

Nix packaging for the local `code-intel-ts` Bun CLI.

## Package

- Binary: `code-intel-ts`
- Entrypoints: `ast.ts`, `lsp.ts`
- Current role: structural and semantic TypeScript code intelligence
- Planned direction: Bun CLI frontend for operator and agent queries, with direct commands or daemon-backed execution

## What this repo does

- Packages the local Bun CLI with `bun2nix`
- Exposes the canonical `code-intel-ts` binary
- Preserves the `ast` and `lsp` subcommand surface for higher-level orchestration later

## Files

- `flake.nix`: flake entrypoint
- `nix/package.nix`: Nix derivation
- `nix/package-manifest.json`: pinned local package metadata and binary entrypoint

## Usage

```bash
nix build
./result/bin/code-intel-ts ast outline src/index.ts
./result/bin/code-intel-ts lsp serve
```
