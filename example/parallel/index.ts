import { Flow } from "../../lib";
import { getAgents } from "./agents";

const coinName = process.argv[2];
if (!coinName) {
  console.error("Please provide a coin name");
  process.exit(1);
}

const runName = process.argv[3] || coinName;
const agents = getAgents(coinName);
const execution = new Flow(agents, runName);

execution.run();
