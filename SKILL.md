---
name: code-intel-ts
description: Structural and semantic TypeScript code navigation via ast-grep and a typescript-language-server flox service.
---

# TypeScript Code Intelligence

Use this skill for TypeScript, TSX, and pi extension code. It provides quick outline/import/signature queries plus semantic LSP lookups.

## Commands

```bash
# Structural queries
.pi/skills/code-intel-ts/code-intel-ts ast outline <file> [--json]
.pi/skills/code-intel-ts/code-intel-ts ast symbols <file> [--json]
.pi/skills/code-intel-ts/code-intel-ts ast imports <file> [--json]
.pi/skills/code-intel-ts/code-intel-ts ast signature <file> <symbol> [--json]
.pi/skills/code-intel-ts/code-intel-ts ast scope <file> <line> [col] [--json]
.pi/skills/code-intel-ts/code-intel-ts ast search <pattern> [paths...] [--json]

# Semantic queries (requires flox service)
.pi/skills/code-intel-ts/code-intel-ts lsp definition <file> <line> <col> [--json]
.pi/skills/code-intel-ts/code-intel-ts lsp references <file> <line> <col> [--json]
.pi/skills/code-intel-ts/code-intel-ts lsp hover <file> <line> <col> [--json]
.pi/skills/code-intel-ts/code-intel-ts lsp diagnostics <file> [--json]
.pi/skills/code-intel-ts/code-intel-ts lsp calls <file> <line> <col> [--direction in|out] [--json]
```

## Notes
- Human-readable output is the default.
- Add `--json` for compact machine-readable output.
- `ast search` requires `ast-grep` in the flox environment.
- `lsp ...` commands require the `ts-code-intel` flox service to be running.
