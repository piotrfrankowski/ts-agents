import { Tool } from "../tool";
import { Message } from "../types";

export interface LLMConnector {
  setTools(tools: Tool<any>[]): void;
  chat(messages: Message[]): Promise<Message>;
}