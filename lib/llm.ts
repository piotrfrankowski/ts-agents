import { appendFileSync } from "fs";
import { OllamaConnector } from "./connectors/ollama";
import type { Message } from "./types";
import { Agent } from "./agent";
import { logger } from "./logger";
import { createHash } from "crypto";
import { OpenAIConnector } from "./connectors/openai";
import { LLMConnector } from "./connectors/types";
import { Tool } from "./tool";

export class LLM {
  private readonly connector: LLMConnector;
  private tools: Tool<any>[] = [];

  constructor({
    model,
    connector,
  }: {
    model: string;
    connector: LLMConnector | "ollama" | "openai";
  }) {
    if (connector === "ollama") {
      this.connector = new OllamaConnector({ model });
    } else if (connector === "openai") {
      this.connector = new OpenAIConnector({ model });
    } else {
      this.connector = connector;
    }
  }

  public setTools(tools: Tool<any>[]): void {
    this.tools = tools;
    this.connector.setTools(tools);
  }

  async execute(
    messages: Message[],
    agent: Agent,
    isGraph = false,
  ): Promise<{ final: string; withThoughts: string }> {
    let isDone = false;
    const finalResponse = {
      withThoughts: "",
      final: "",
    };
    const toolCallsMap: Record<string, string> = {};

    do {
      let message;
      try {
        message = await this.connector.chat(messages);
      } catch (error) {
        logger.error(`Agent ${agent.name}: Error executing LLM`, error);
        isDone = true;
        finalResponse.final = "Error: " + (error as Error).message;
        finalResponse.withThoughts = `Agent ${agent.name} encountered an error: ${(error as Error).message}`;
        break;
      }

      this.debugResponses(agent, message);

      // Add the model's response to the conversation history
      messages.push(message);

      if (!message.tool_calls || message.tool_calls.length === 0) {
        if (
          message.content.includes("</final>") ||
          message.content.includes("<final>") ||
          isGraph
        ) {
          const res = this.cleanupResponse(message.content);
          finalResponse.withThoughts += `${res.think}\n${res.final}`;
          finalResponse.final += res.final;

          if (finalResponse.final.trim()) {
            isDone = true;
            break;
          }

          messages.push({
            role: "user",
            content:
              "Please summarize your work and provide a final response with </final> tag.",
          });

          continue;
        }

        const res = this.cleanupResponse(message.content);
        finalResponse.withThoughts += `${res.think}\n${res.final}`;
        finalResponse.final += res.final;

        messages.push({
          role: "user",
          content:
            "Continue your work. Use the file reading tool if needed. Mark your final response with </final> tag if you no longer need to use the tools.",
        });

        continue;
      }

      // Process function calls made by the model
      for (const tool of message.tool_calls) {
        const id =
          tool.id ||
          createHash("md5").update(JSON.stringify(tool.function)).digest("hex");
        if (toolCallsMap[id]) {
          continue;
        }

        const functionToCall = this.tools.find(
          (t) => t.name === tool.function.name,
        );
        if (!functionToCall) {
          logger.warn(
            `Agent ${agent.name}: Tool not found`,
            tool.function.name,
          );
          messages.push({
            role: "tool",
            tool_call_id: id,
            content: `Tool ${tool.function.name} not found`,
          });
          continue;
        }

        logger.debug(`Agent ${agent.name}: Calling tool`, functionToCall.name);
        const args =
          typeof tool.function.arguments === "string"
            ? JSON.parse(tool.function.arguments)
            : tool.function.arguments;
        const functionResponse =
          (await functionToCall.call(args)) || "No response from the tool";

        // Add function response to the conversation
        messages.push({
          role: "tool",
          content: functionResponse,
          tool_call_id: id,
        });

        toolCallsMap[id] = functionResponse;
      }
    } while (!isDone);

    return finalResponse;
  }

  private cleanupResponse(response: string): { final: string; think: string } {
    if (response.includes("<final>") && response.includes("</final>")) {
      const finalPos = response.indexOf("<final>");
      const start = finalPos + "<final>".length;
      const end = response.indexOf("</final>");
      return {
        final: response.slice(start, end),
        think: finalPos ? response.slice(0, finalPos) : "",
      };
    }

    if (response.includes("</think>")) {
      const [think, final] = response.split("</think>");
      return {
        final: final?.replaceAll("</final>", "") || "",
        think: think?.replaceAll("</think>", "") || "",
      };
    }

    return {
      final: response
        .replaceAll("</think>", "")
        .replaceAll("</final>", "")
        .replaceAll("<final>", ""),
      think: "",
    };
  }

  private debugResponses(agent: Agent, message: Message): void {
    if (process.env["LOG_LEVEL"] === "DEBUG") {
      appendFileSync(
        `out/${agent.runName}/debug.json`,
        JSON.stringify(
          { time: Date.now(), agent: agent.name, message },
          null,
          2,
        ) + ",\n",
      );
    }
  }
}
