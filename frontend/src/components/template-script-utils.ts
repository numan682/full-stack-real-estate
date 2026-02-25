export function dedupeScripts(scripts: string[]): string[] {
  return Array.from(new Set(scripts.filter((script) => script.trim() !== "")));
}
