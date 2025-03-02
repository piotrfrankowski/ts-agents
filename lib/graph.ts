import { randomUUID } from "crypto";
import { appendFileSync, mkdirSync, writeFileSync } from "fs";
import { Agent } from "./agent";
import { logger } from "./logger";
import { Node, DecisionNode, StartNode } from "./nodes";

export class Graph {
  private readonly start: Node;
  private readonly maxDepth: number;
  private readonly runName: string;
  private readonly memory: Record<Agent['id'], string> = {};
  private nodes: Record<string, Node> = {};

  constructor({ start, maxDepth = 20, runName }: { start: Node, maxDepth?: number, runName?: string }) {
    if (start.type !== 'start') {
      throw new Error('Start node must be the first node in the graph');
    }
    this.start = start;
    this.maxDepth = maxDepth;
    this.runName = runName || randomUUID();
    this.validateGraph();
    mkdirSync(`out/${this.runName}`, { recursive: true });
  }

  private validateGraph() {
    const visitedDecisions = new Set<string>();
    const validateNode = (node: Node, depth = 0): boolean => {
      this.nodes[node.name] = node;
      if (node.type === 'end') {
        return true;
      }

      if (depth > this.maxDepth) {
        throw new Error('Graph depth limit exceeded');
      }

      if (node.type === 'decision') {
        if (visitedDecisions.has(node.name)) {
          return true
        }
        Object.entries((node as DecisionNode<any>).choices).forEach(([key, choice]) => {
          if (typeof choice === 'string') {
            const choiceNode = this.nodes[choice];
            if (!choiceNode) {
              throw new Error(`Node ${choice} not found`);
            }
            console.log((node as DecisionNode<any>).choices, key);
            (node as DecisionNode<any>).choices[key] = choiceNode;
          }
        });
        console.log((node as DecisionNode<any>).choices);
        visitedDecisions.add(node.name);
        return Object.values((node as DecisionNode<any>).choices)
          .every(choice => validateNode(choice as Node, depth + 1));
      }

      if (['task', 'start', 'map-reduce'].includes(node.type)) {
        return validateNode((node as StartNode).next, depth + 1);
      }

      return false;
    }

    if (!validateNode(this.start)) {
      throw new Error('Invalid graph');
    }
  }

  public async run(input: any) {
    logger.info(`Starting the run "${this.runName}"`);

    if (process.env['LOG_LEVEL'] === 'DEBUG') {
      writeFileSync(`out/${this.runName}/debug.json`, '[\n');
    }

    const result = await this.start.execute(input, this.memory, this.runName);

    if (process.env['LOG_LEVEL'] === 'DEBUG') {
      appendFileSync(`out/${this.runName}/debug.json`, ']');
    }

    logger.info(`Run "${this.runName}" completed`);

    return result;
  }
}
