import { readFileSync, } from 'fs';
import dirTree from "directory-tree";

export const readFile = (path: string, { repoName, basePath }: { repoName?: string, basePath?: string } = {}) => {
  if (!path) {
    return 'No path provided';
  }
  const originalPath = path;
  
  if (basePath && !path.startsWith(basePath)) {
    if (!path.startsWith('/')) {
      path = `/${path}`;
    }
    if (repoName && !path.startsWith(`/${repoName}`)) {
      path = `/${repoName}${path}`;
    }
    path = `${basePath}${path}`;
  }
  try {
    const content = readFileSync(path, 'utf-8').toString();
    return content;
  } catch (error) {
    const suggestion = `${basePath ? basePath + '/': ''}${repoName ? repoName + '/': ''}path/to/file`;
    return `File does not exist or the path ${originalPath} is wrong. Should be in the format "${suggestion}"`;
  }
}

export const readRepository = (name: string, { basePath, exclude, limitToDir }: { basePath?: string, exclude?: RegExp, limitToDir?: string } = {}) => {
  if (!name) {
    return 'No repository name provided';
  }
  if (name.startsWith('/')) {
    name = name.slice(1);
  }

  const path = basePath ? `${basePath}/${name}${limitToDir ? `/${limitToDir}` : ''}` : name;
  const tree = dirTree(path, { exclude: exclude || [] });

  if (!tree) {
    return `Repository ${name} does not exist`;
  }

  return JSON.stringify(tree);
}
