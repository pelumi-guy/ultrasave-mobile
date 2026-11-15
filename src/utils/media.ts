export function bytesLabel(bytes: number) {
  if (!Number.isFinite(bytes) || bytes < 0) return 'Size unknown';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
}
export function stableName(id: string, name: string) {
  let hash = 2166136261;
  for (const c of id) hash = Math.imul(hash ^ c.charCodeAt(0), 16777619);
  return `${(hash >>> 0).toString(16)}-${name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(-110)}`;
}
export function message(error: unknown) { return error instanceof Error ? error.message : 'Something went wrong. Please try again.'; }
