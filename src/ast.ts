#!/usr/bin/env bun
import { readFileSync } from "node:fs";
import { basename } from "node:path";
import process from "node:process";
import { getAstGrepBinary, parseCommonArgs, printOutput, rel, requireFile, runCommand, fail } from "./shared.ts";

const { args, json, repoRoot } = parseCommonArgs(process.argv.slice(2));
const [command, ...rest] = args;

if (!command) fail("usage", "Usage: bun ast.ts <outline|symbols|imports|signature|scope|search> ...", json);

switch (command) {
  case "outline":
  case "symbols":
    outline(rest[0]);
    break;
  case "imports":
    imports(rest[0]);
    break;
  case "signature":
    signature(rest[0], rest.slice(1).join(" "));
    break;
  case "scope":
    scope(rest[0], Number(rest[1]), Number(rest[2] ?? 1));
    break;
  case "search":
    await search(rest);
    break;
  default:
    fail("usage", `Unknown ast command: ${command}`, json);
}

function outline(fileArg?: string) {
  const file = requireFile(fileArg ?? "", repoRoot);
  const text = readFileSync(file, "utf8");
  const lines = text.split(/\r?\n/);
  const items: any[] = [];
  const patterns = [
    { kind: "function", regex: /^\s*export\s+(async\s+)?function\s+([A-Za-z_$][A-Za-z0-9_$]*)/ },
    { kind: "function", regex: /^\s*(async\s+)?function\s+([A-Za-z_$][A-Za-z0-9_$]*)/ },
    { kind: "class", regex: /^\s*export\s+class\s+([A-Za-z_$][A-Za-z0-9_$]*)/ },
    { kind: "class", regex: /^\s*class\s+([A-Za-z_$][A-Za-z0-9_$]*)/ },
    { kind: "interface", regex: /^\s*export\s+interface\s+([A-Za-z_$][A-Za-z0-9_$]*)/ },
    { kind: "interface", regex: /^\s*interface\s+([A-Za-z_$][A-Za-z0-9_$]*)/ },
    { kind: "type", regex: /^\s*export\s+type\s+([A-Za-z_$][A-Za-z0-9_$]*)/ },
    { kind: "type", regex: /^\s*type\s+([A-Za-z_$][A-Za-z0-9_$]*)/ },
    { kind: "const", regex: /^\s*export\s+const\s+([A-Za-z_$][A-Za-z0-9_$]*)/ },
    { kind: "const", regex: /^\s*const\s+([A-Za-z_$][A-Za-z0-9_$]*)/ },
  ];
  for (let index = 0; index < lines.length; index++) {
    const line = lines[index];
    const matched = patterns.find((pattern) => pattern.regex.test(line));
    if (!matched) continue;
    const name = matched.regex.exec(line)?.at(-1) ?? "anonymous";
    items.push({
      kind: matched.kind,
      name,
      exported: /(^|\s)export\s/.test(line),
      file: rel(file, repoRoot),
      line: index + 1,
      endLine: findBlockEnd(lines, index + 1),
      signature: line.trim(),
    });
  }
  printOutput(items, json);
}

function imports(fileArg?: string) {
  const file = requireFile(fileArg ?? "", repoRoot);
  const lines = readFileSync(file, "utf8").split(/\r?\n/);
  const items = lines
    .map((line, index) => ({ line: index + 1, text: line.trim() }))
    .filter((entry) => entry.text.startsWith("import ") || entry.text.startsWith("export * from "));
  printOutput(items, json);
}

function signature(fileArg?: string, symbol?: string) {
  if (!symbol) fail("usage", "Usage: bun ast.ts signature <file> <symbol>", json);
  const file = requireFile(fileArg ?? "", repoRoot);
  const lines = readFileSync(file, "utf8").split(/\r?\n/);
  const regex = new RegExp(`^\\s*(export\\s+)?(async\\s+)?(function|const|class|interface|type)\\s+${escapeRegExp(symbol)}\\b|^\\s*export\\s+const\\s+${escapeRegExp(symbol)}\\b`);
  for (let index = 0; index < lines.length; index++) {
    if (regex.test(lines[index])) {
      printOutput({ file: rel(file, repoRoot), line: index + 1, signature: lines[index].trim() }, json);
      return;
    }
  }
  fail("not_found", `Symbol not found: ${symbol}`, json);
}

function scope(fileArg?: string, line?: number, col?: number) {
  if (!line) fail("usage", "Usage: bun ast.ts scope <file> <line> [col]", json);
  const file = requireFile(fileArg ?? "", repoRoot);
  const lines = readFileSync(file, "utf8").split(/\r?\n/);
  const items = lines
    .map((entry, index) => ({ entry, index }))
    .filter(({ entry }) => /^\s*(export\s+)?(async\s+)?(function|class|interface|type|const)\s+/.test(entry))
    .map(({ entry, index }) => ({ line: index + 1, endLine: findBlockEnd(lines, index + 1), signature: entry.trim() }))
    .filter((item) => line >= item.line && line <= item.endLine)
    .sort((a, b) => b.line - a.line);
  const selected = items[0] ?? { line: 1, endLine: lines.length, signature: basename(file) };
  printOutput({ file: rel(file, repoRoot), line, col: col ?? 1, scope: selected }, json);
}

async function search(searchArgs: string[]) {
  if (searchArgs.length === 0) fail("usage", "Usage: bun ast.ts search <pattern> [paths...]", json);
  const binary = getAstGrepBinary();
  const [pattern, ...paths] = searchArgs;
  const inlineRules = `id: ts-search\nlanguage: TypeScript\nrule:\n  pattern: '${pattern.replace(/'/g, "''")}'`;
  const command = [binary, "scan", "--inline-rules", inlineRules, "--json=stream"];
  if (paths.length > 0) command.push(...paths);
  else command.push(repoRoot);
  const result = await runCommand(command, repoRoot);
  if (result.code !== 0) fail("ast_grep_failed", result.stderr.trim() || "ast-grep search failed", json);
  const entries = result.stdout
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => JSON.parse(line))
    .flatMap((entry) => entry?.file ? [entry] : Array.isArray(entry) ? entry : [])
    .map((entry) => ({
      file: rel(entry.file ?? entry.path, repoRoot),
      line: entry.range?.start?.line + 1,
      col: entry.range?.start?.column + 1,
      text: entry.lines?.trim?.() ?? entry.text?.trim?.() ?? "",
    }));
  printOutput(entries, json);
}

function findBlockEnd(lines: string[], startLine: number) {
  let depth = 0;
  let seenOpen = false;
  for (let index = startLine - 1; index < lines.length; index++) {
    for (const char of lines[index]) {
      if (char === "{") {
        depth++;
        seenOpen = true;
      } else if (char === "}") {
        depth--;
        if (seenOpen && depth <= 0) return index + 1;
      }
    }
    if (!seenOpen && /[;,]$/.test(lines[index].trimEnd())) return index + 1;
  }
  return lines.length;
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
