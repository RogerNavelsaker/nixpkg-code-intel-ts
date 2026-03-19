# code-intel-ts

TypeScript code intelligence CLI with AST and LSP subcommands, packaged as a local Bun tool.

## Package

- Version: `0.1.0`
- Binary: `code-intel-ts`
- Entrypoint: `src/cli.ts`
- Description: TypeScript code intelligence CLI with AST and LSP subcommands

## What This Repo Does

- Packages the local Bun CLI with `bun2nix`
- Exposes the canonical `code-intel-ts` binary
- Keeps runtime code under `src/` and agent-facing guidance under `skills/`

Cross-tool flow:

```bash
repo-map query "**/*" --term auth --term token --lang ts --json
code-intel-ts ast outline src/auth/token.ts --repo-root /path/to/worktree
code-intel-ts lsp definition src/auth/token.ts 12 4 --repo-root /path/to/worktree
```

Use `repo-map` for discovery, then `code-intel-ts ast ...` for the first precise pass. Escalate to `lsp ...` when you need semantic definitions, references, hover, or diagnostics.
