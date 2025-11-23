import * as path from 'path';

const PATH_TRAVERSAL_ERROR = 'Path traversal attempt detected';

const ensureTrailingSeparator = (value: string): string => {
  return value.endsWith(path.sep) ? value : value + path.sep;
};

export const resolvePathInside = (basePath: string, ...segments: string[]): string => {
  const resolved = path.resolve(basePath, ...segments);
  const normalizedBase = path.normalize(basePath + path.sep);
  const normalizedResolved = path.normalize(resolved + path.sep);
  
  if (!normalizedResolved.startsWith(normalizedBase)) {
    throw new Error(PATH_TRAVERSAL_ERROR);
  }
  
  return resolved;
};

export const assertPathInside = (basePath: string, targetPath: string): string => {
  const normalizedBase = path.normalize(basePath + path.sep);
  const normalizedTarget = path.normalize(targetPath + path.sep);
  
  if (!normalizedTarget.startsWith(normalizedBase)) {
    throw new Error(PATH_TRAVERSAL_ERROR);
  }
  
  return targetPath;
};

export const sanitizeFileName = (input: string, replacement: '-' | '_' = '-'): string => {
  return input.replace(/[^a-zA-Z0-9.-]/g, replacement).replace(/-+/g, '-');
};

export const isSubPath = (basePath: string, targetPath: string): boolean => {
  try {
    assertPathInside(basePath, targetPath);
    return true;
  } catch {
    return false;
  }
};
