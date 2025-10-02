import * as path from 'path';

const PATH_TRAVERSAL_ERROR = 'Path traversal attempt detected';

const ensureTrailingSeparator = (value: string): string =>
  value.endsWith(path.sep) ? value : `${value}${path.sep}`;

export const resolvePathInside = (basePath: string, ...segments: string[]): string => {
  const normalizedBase = path.resolve(basePath);
  const targetPath = path.resolve(normalizedBase, ...segments);
  const baseWithSep = ensureTrailingSeparator(normalizedBase);

  if (targetPath !== normalizedBase && !targetPath.startsWith(baseWithSep)) {
    throw new Error(PATH_TRAVERSAL_ERROR);
  }

  return targetPath;
};

export const assertPathInside = (basePath: string, targetPath: string): string => {
  const normalizedBase = path.resolve(basePath);
  const normalizedTarget = path.resolve(targetPath);
  const baseWithSep = ensureTrailingSeparator(normalizedBase);

  if (normalizedTarget !== normalizedBase && !normalizedTarget.startsWith(baseWithSep)) {
    throw new Error(PATH_TRAVERSAL_ERROR);
  }

  return normalizedTarget;
};

export const sanitizeFileName = (input: string, replacement: '-' | '_' = '-'): string => {
  const safeReplacement = replacement === '_' ? '_' : '-';
  const normalized = input
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, safeReplacement)
    .replace(new RegExp(`${safeReplacement}{2,}`, 'g'), safeReplacement)
    .replace(new RegExp(`^${safeReplacement}|${safeReplacement}$`, 'g'), '')
    .toLowerCase();

  return normalized || 'artifact';
};

export const isSubPath = (basePath: string, targetPath: string): boolean => {
  const normalizedBase = path.resolve(basePath);
  const normalizedTarget = path.resolve(targetPath);
  const baseWithSep = ensureTrailingSeparator(normalizedBase);
  return normalizedTarget === normalizedBase || normalizedTarget.startsWith(baseWithSep);
};

