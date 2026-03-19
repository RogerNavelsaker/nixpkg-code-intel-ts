# code-intel-ts

Nix packaging for the local `code-intel-ts` Bun CLI.

## Package

- Binary: `code-intel-ts`
- Entrypoint: `src/cli.ts`
- Current role: structural and semantic TypeScript code intelligence
- Planned direction: Bun CLI frontend for operator and agent queries, with direct commands or daemon-backed execution

## What this repo does

- Packages the local Bun CLI with `bun2nix`
- Exposes the canonical `code-intel-ts` binary
- Keeps runtime code under `src/` and agent-facing guidance under `skills/`

## Files

- `flake.nix`: flake entrypoint
- `nix/package.nix`: Nix derivation
- `nix/package-manifest.json`: pinned local package metadata and binary entrypoint

## Usage

```bash
nix build
./result/bin/code-intel-ts ast outline src/index.ts
./result/bin/code-intel-ts lsp serve
./result/bin/code-intel-ts lsp definition src/index.ts 12 4 --repo-root /path/to/worktree
```
