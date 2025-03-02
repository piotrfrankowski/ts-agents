import { logger } from "./logger";
import { ToolModel, ToolParams } from "./types";

export class Tool<T extends Record<string, any>> {
  public readonly name: string;
  public readonly description: string;
  public readonly hint: string;
  public readonly model: ToolModel;
  private readonly fn: (args: T) => Promise<string>;
  private readonly requiredParams: string[];

  constructor({
    name,
    description,
    hint,
    params,
    fn,
  }: {
    name: string;
    description: string;
    hint: string;
    params: ToolParams[];
    fn: (args: T) => Promise<string>;
  }) {
    this.name = name;
    this.description = description;
    this.hint = hint;
    this.requiredParams = params
      .filter((param) => param.required)
      .map((param) => param.name);
    this.fn = fn;
    this.model = {
      type: "function",
      function: {
        name,
        description,
        parameters: {
          type: "object",
          properties: params.reduce(
            (acc, param) => ({
              ...acc,
              [param.name]: {
                type: param.type,
                description: param.description,
              },
            }),
            {},
          ),
          required: this.requiredParams,
        },
      },
    };
  }

  public async call(args: T): Promise<string> {
    for (const param of this.requiredParams) {
      if (!(param in args)) {
        const error = `Missing required parameter "${param}" in "${this.name}" tool call.`;
        logger.warn(error, args);
        return error;
      }
    }
    return this.fn(args);
  }
}
