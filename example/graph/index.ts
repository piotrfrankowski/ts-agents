import { Graph } from '../../lib';
import { start } from './graph';

const repository = process.argv[2];
if (!repository) {
  console.error('Please provide a repository name');
  process.exit(1);
}

const runName = process.argv[3] || repository;
const execution = new Graph({ start, maxDepth: 10, runName });

execution.run(JSON.stringify({ repo_name: repository }));
