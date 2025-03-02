import { Agent } from './agent';
import { logger } from './logger';
import { writeFileSync } from 'fs';

export abstract class Node {
  public readonly type: 'task' | 'decision' | 'end' | 'start' | 'map-reduce';
  public readonly name: string;
  protected runName: string = '';

  constructor({ type, name }: { type: Node['type'], name: string }) {
    this.type = type;
    this.name = name;
  }

  public abstract execute(input: any, memory: Record<Agent['id'], string>, runName: string): Promise<any>;

  protected async runAgent(agent: Agent, input: any,memory: Record<Agent['id'], string>) {
    logger.info(`Executing ${agent.name}...`);

    agent.setRunName(this.runName);
    const response = await agent.execute(input, memory, true);
  
    writeFileSync(`out/${this.runName}/${agent.name}.md`, response.final);
    memory[agent.id] = response.withThoughts;
  
    logger.info(`${agent.name} response:`, response.final);

    return response.final;
  }
}

export class TaskNode extends Node {
  public readonly next: Node;
  private readonly agent: Agent;

  constructor({ agent, next, name }: { agent: Agent, next: Node, name: string }) {
    super({ type: 'task', name });
    this.agent = agent;
    this.next = next;
  }
  
  public async execute(input: any, memory: Record<Agent['id'], string>, runName: string) {
    this.runName = runName;
    logger.info(`Executing node ${this.name}...`);
    logger.debug(`Input: ${JSON.stringify(input)}`);
    const output = await this.runAgent(this.agent, input, memory);
    return this.next.execute(output, memory, runName);
  }
}

export class MapReduceNode<T extends string> extends Node {
  public readonly next: Node;
  private readonly agents: Record<T, Agent>;
  private readonly map: (input: any) => Promise<{ agent: T, input: any }[]>;
  private readonly reduce: (outputs: Record<T, any>) => Promise<any>;

  constructor({ agents, next, map, reduce, name }: { agents: Record<T, Agent>, next: Node, map: (input: any) => Promise<{ agent: T, input: any }[]>, reduce: (outputs: Record<T, any>) => Promise<any>, name: string }) {
    super({ type: 'map-reduce', name });
    this.agents = agents;
    this.next = next;
    this.map = map;
    this.reduce = reduce;
  }

  public async execute(input: any, memory: Record<Agent['id'], string>, runName: string) {
    this.runName = runName;
    logger.info(`Executing node ${this.name}...`);
    logger.debug(`Input: ${JSON.stringify(input)}`);
    const tasks = await this.map(input);

    const validAgents = Object.keys(this.agents);
    const hasAllAgents = tasks.every(task => validAgents.includes(task.agent));
    if (!hasAllAgents) {
      throw new Error('Not all tasks map to valid agents!');
    }

    const results = await Promise.all(
      tasks.map(task => this.runAgent(this.agents[task.agent], task.input, memory))
    );
    const outputs = results.reduce((acc, result, index) => {
      const task = tasks[index]!;
      acc[task.agent] = result;
      return acc;
    }, {} as Record<T, any>);

    const output = await this.reduce(outputs);

    return this.next.execute(output, memory, runName);
  }
}

export class DecisionNode<T extends string> extends Node {
  public readonly choices: Record<T, Node | string>;
  private readonly selector: (input: any) => Promise<T>;
  private nodes: Record<string, Node> = {};

  constructor({ choices, selector, name }: { choices: Record<T, Node | string>, selector: (input: any) => Promise<T>, name: string }) {
    super({ type: 'decision', name });
    this.choices = choices;
    this.selector = selector;
  }

  public setNodes(nodes: Record<string, Node>) {
    this.nodes = nodes;
  }

  public async execute(input: any, memory: Record<Agent['id'], string>, runName: string) {
    this.runName = runName;
    logger.info(`Executing node ${this.name}...`);
    logger.debug(`Input: ${JSON.stringify(input)}`);
    const option = await this.selector(input);
    const choice = this.choices[option];
    if (typeof choice === 'string') {
      const node = this.nodes[choice];
      if (!node) {
        throw new Error('Invalid choice');
      }
      return node.execute(input, memory, runName);
    }
    if (!choice) {
      throw new Error('Invalid choice');
    }

    return choice.execute(input, memory, runName);
  }
}

export class EndNode extends Node {
  constructor({ name }: { name?: string }) {
    super({ type: 'end', name: name || 'End' });
  }

  public async execute(input: any, _memory: Record<Agent['id'], string>, runName: string) {
    this.runName = runName;
    logger.info(`Run ${runName} ended with node "${this.name}"!`);
    return input;
  }
}

export class StartNode extends Node {
  public readonly next: Node;

  constructor(next: Node) {
    super({ type: 'start', name: 'Start' });
    this.next = next;
  }

  public async execute(input: any, memory: Record<Agent['id'], string>, runName: string) {
    this.runName = runName;
    logger.info(`Executing node ${this.name}...`);
    logger.debug(`Input: ${JSON.stringify(input)}`);
    return this.next.execute(input, memory, runName);
  }
}