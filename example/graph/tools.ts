import { Tool } from '../../lib';
import { readFile, readRepository } from '../../tools/fs';

const readFileTool: Tool<{ path: string }> = new Tool({
  name: 'read_file',
  description: 'Read content of a source code file',
  hint: 'make sure to provide the name of the repository you have been asked to read and only that repository',
  params: [{ name: 'path', type: 'string', description: 'The absolute path to the file to be read', required: true }],
  fn: async (args) => {
    return readFile(args.path, { repoName: 'tx-receipt', basePath: '/Users/piotr/code/k2' })
  }
});

const readRepoTool: Tool<{ repo_name: string }> = new Tool({
  name: 'read_repo',
  description: 'Read file tree of a code repository',
  hint: 'use read_repo tool first, do not assume file names. Make sure to provide the absolute path to the file. Use only files that paths you know from read_repo tool',
  params: [{ name: 'repo_name', type: 'string', description: 'The name of the repository', required: true }],
  fn: async (args) => {
    return readRepository(args.repo_name, { basePath: '/Users/piotr/code/k2', limitToDir: 'src' });
  },
});

export const tools = [
  readFileTool,
  readRepoTool,
];
