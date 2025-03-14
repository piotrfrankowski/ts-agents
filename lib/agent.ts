import { randomUUID } from "crypto";
import { LLM } from "./llm";
import { Message, Persona } from "./types";
import { Tool } from "./tool";
import dedent from "dedent";

export class Agent {
  public readonly name: string;
  public readonly id = randomUUID();
  public runName: string = "";
  private messages: Message[];
  private llm: LLM;
  private context: Agent[];

  constructor({
    persona,
    task,
    tools,
    llm,
    context,
  }: {
    persona: Persona;
    task: string;
    tools: Tool<any>[];
    llm: LLM;
    context: Agent[];
  }) {
    const toolsList = tools
      .map((t) => `${t.name}: ${t.description}`)
      .join(", ");
    const toolHints = tools
      .filter((t) => t.hint)
      .map((t) => `When using the ${t.name} tool ${t.hint}`)
      .join(".\n");
    this.name = persona.role;
    this.messages = [
      {
        role: "system",
        content: dedent`You are a ${persona.role}. ${persona.background}.
        ${persona.goal}.
        You have access to the following tools: ${toolsList}.
        ${toolHints}.
        
        You should think step by step in order to complete the task with reasoning devided in Thought/Action/Observation that can repeat multiple times if needed.
        You should first reflect with '<thought/>: {your_thoughts}', then if necessary, use the tools to get the information you need and print your final response with '<final/>: {your_final_response}'.
        Mark your final response with </final> tag if you have finished the task and no longer need to use the tools.
        Go back and forth between the tools and the context until you have a complete understanding of the task.
        Do not repeat the same tool call in consecutive calls
        Now begin! Reminder to ALWAYS use the exact characters <final/> when you provide a definitive answer.`,
      },
    ];

    this.llm = llm;
    this.context = context;

    this.llm.setTools(tools);

    this.messages.push({
      role: "user",
      content: task,
    });
  }

  public setRunName(runName: string) {
    this.runName = runName;
  }

  public async execute(
    input: any,
    memory: Record<Agent["id"], string>,
    isGraph = false,
  ): Promise<{ final: string; withThoughts: string }> {
    if (input) {
      this.messages.push({
        role: "user",
        content: `You received the following input: ${typeof input === "string" ? input : JSON.stringify(input)}`,
      });
    }

    if (this.context?.length) {
      for (const { id, name } of this.context) {
        const memoryItem = memory[id];
        if (memoryItem) {
          this.messages.push({
            role: "system",
            content: `Additional context provided by the ${name}: ${memoryItem}`,
          });
        }
      }
    }

    return this.llm.execute(this.messages, this, isGraph);
  }
}
