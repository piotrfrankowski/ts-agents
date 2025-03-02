import { writeFileSync, appendFileSync, mkdirSync } from "fs";
import { randomUUID } from "crypto";
import { Agent } from "./agent";
import { logger } from "./logger";
import { config } from "dotenv";

config();

export class Flow {
  private readonly flow: Array<Agent | Agent[]>;
  private readonly runName: string;
  private readonly memory: Record<Agent["id"], string> = {};

  constructor(flow: Array<Agent | Agent[]>, runName?: string) {
    this.flow = flow;
    this.runName = runName || randomUUID();
    mkdirSync(`out/${this.runName}`, { recursive: true });
  }

  private async runAgent(agent: Agent) {
    logger.info(`Executing ${agent.name}...`);

    agent.setRunName(this.runName);
    const response = await agent.execute("", this.memory);

    writeFileSync(`out/${this.runName}/${agent.name}.md`, response.final);
    this.memory[agent.id] = response.withThoughts;

    logger.info(`${agent.name} response:`, response.final);
  }

  public async run() {
    logger.info(`Starting the run "${this.runName}"`);

    if (process.env["LOG_LEVEL"] === "DEBUG") {
      writeFileSync(`out/${this.runName}/debug.json`, "[\n");
    }

    for (const agents of this.flow) {
      if (Array.isArray(agents)) {
        await Promise.all(agents.map((agent) => this.runAgent(agent)));
      } else {
        await this.runAgent(agents);
      }
    }

    if (process.env["LOG_LEVEL"] === "DEBUG") {
      appendFileSync(`out/${this.runName}/debug.json`, "]");
    }

    logger.info(`Run "${this.runName}" completed`);
  }
}
