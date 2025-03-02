import { createHash } from "crypto";
import axios, { AxiosInstance } from "axios";
import { Message, ToolCall, ToolModel } from "../types";
import { Tool } from "../tool";
import { LLMConnector } from "./types";
import { logger } from "../logger";
import dedent from "dedent";

type OllamaResponse = {
  message: Message;
  tool_calls: ToolCall[];
} & (
  | {
      done: true;
      total_duration: number;
      load_duration: number;
      prompt_eval_count: number;
      prompt_eval_duration: number;
      eval_count: number;
      eval_duration: number;
    }
  | {
      done: false;
    }
);

export class OllamaConnector implements LLMConnector {
  private readonly model: string;
  private readonly client: AxiosInstance;
  private tools: ToolModel[] = [];

  constructor({ model }: { model: string }) {
    this.client = axios.create({
      baseURL: "http://localhost:11434/",
      headers: {
        "Content-Type": "application/json",
      },
    });
    this.model = model;
  }

  public setTools(tools: Tool<any>[]) {
    this.tools = tools.map((t) => t.model);
  }

  public async chat(messages: Message[]): Promise<Message> {
    const message: Message = {
      role: "assistant",
      content: "",
      tool_calls: [],
    };
    const toolCallsMap: Record<string, boolean> = {};
    let isDone = false;

    do {
      const response = await this.client.post<string | object>("/api/chat", {
        model: this.model,
        messages: messages,
        tools: this.tools,
        keep_alive: "30m",
        stream: true,
      });

      const data =
        typeof response.data === "string"
          ? response.data.includes("\n")
            ? response.data.split("\n")
            : [response.data]
          : [response.data];
      const parts: OllamaResponse[] = data
        .filter((p) => !!p)
        .map((p) => (typeof p === "string" ? JSON.parse(p) : p));

      for (const part of parts) {
        if (!part) continue;

        this.logStats(part);

        if (part.message.tool_calls) {
          const toolCallHash = createHash("md5")
            .update(JSON.stringify(part.message.tool_calls))
            .digest("hex");
          if (!toolCallsMap[toolCallHash]) {
            toolCallsMap[toolCallHash] = true;
            message.tool_calls!.push(...part.message.tool_calls);
          }
        }

        if (part.message.content) {
          message.content += part.message.content;
        }

        if (part.message.role) {
          message.role = part.message.role;
        }

        isDone = part.done;
      }
    } while (!isDone);

    return message;
  }

  private logStats(part: OllamaResponse) {
    logger.debug(`Received response from ollama: ${JSON.stringify(part)}`);

    if (!part.done) return;

    logger.info(dedent`Last response stats:
      total duration:       ${part.total_duration / 10 ** 9}s
      load duration:        ${part.load_duration / 10 ** 6}ms
      prompt eval count:    ${part.prompt_eval_count} token(s)
      prompt eval duration: ${part.prompt_eval_duration / 10 ** 6}ms
      prompt eval rate:     ${part.prompt_eval_count / (part.prompt_eval_duration / 10 ** 9)} tokens/s
      eval count:           ${part.eval_count} token(s)
      eval duration:        ${part.eval_duration / 10 ** 9}s
      eval rate:            ${part.eval_count / (part.eval_duration / 10 ** 9)} tokens/s
    `);
  }
}
