export const normalizeMarkup = (h: string): string =>
  h.replace(/\son\w+\s*=\s*"[^"]*"/gi, "");
