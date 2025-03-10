import { OpenAI } from "openai";
import { Message, ToolModel } from "../types";
import { Tool } from "../tool";
import { LLMConnector } from "./types";
import { logger } from "../logger";
import dedent from "dedent";

export class OpenAIConnector implements LLMConnector {
  private readonly model: string;
  private readonly client: OpenAI;
  private tools: ToolModel[] = [];

  constructor({ model, options }: { model: string, options?: any }) {
    if (!process.env["OPENAI_API_KEY"]) {
      throw new Error("OPENAI_API_KEY is not set");
    }

    this.client = new OpenAI({
      apiKey: process.env["OPENAI_API_KEY"],
      baseURL: options?.url || "https://api.openai.com/v1",
    });
    this.model = model;
  }

  public setTools(tools: Tool<any>[]) {
    this.tools = tools.map((t) => t.model);
  }

  public async chat(messages: Message[]): Promise<Message> {
    const openAImessages = messages.map(
      (m) =>
        ({
          ...m,
          role: m.role === "system" ? "developer" : m.role,
        }) as OpenAI.Chat.Completions.ChatCompletionMessageParam,
    );

    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: openAImessages,
      tools: this.tools,
      tool_choice: "auto",
      store: true,
    });

    const choice = response.choices[0];

    this.logStats(response);

    return {
      role: choice!.message.role || "assistant",
      content: choice!.message.content || "",
      tool_calls: choice!.message.tool_calls || [],
    };
  }

  private logStats(response: OpenAI.Chat.Completions.ChatCompletion) {
    logger.debug(`Received response from ollama: ${JSON.stringify(response)}`);
    const { usage } = response;

    if (!usage) {
      return;
    }

    logger.info(dedent`Last response stats:
      choices:                   ${response.choices.length}
      completion_tokens:         ${usage.completion_tokens}
      prompt_tokens:             ${usage.prompt_tokens}
      total_tokens:              ${usage.total_tokens}
      completion_tokens_details: ${JSON.stringify(usage.completion_tokens_details)}
      prompt_tokens_details:     ${JSON.stringify(usage.prompt_tokens_details)}
    `);
  }
}
