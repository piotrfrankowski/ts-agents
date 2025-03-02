import { Flow } from '../../lib';
import { getAgents } from './agents';

const repository = process.argv[2];
if (!repository) {
  console.error('Please provide a repository name');
  process.exit(1);
}

const runName = process.argv[3] || repository;
const agents = getAgents(repository)
const execution = new Flow(agents, runName);

execution.run();
