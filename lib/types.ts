export type ToolCall = {
  id?: string,
  type?: 'function',
  function: {
    name: string;
    arguments: string | object;
  };
}

export type Message = {
  role: 'system' | 'user' | 'assistant' | 'tool' | 'developer';
  content: string;
  tool_calls?: ToolCall[];
  tool_call_id?: string;
}

export type ToolModel = {
    type: 'function';
    function: {
        name: string;
        description: string;
        parameters: {
            type: string;
            properties: Record<string, {
                type: string;
                description: string;
            }>;
            required: string[];
        },
    },
}

export type ToolParams = {
  name: string;
  description: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  required: boolean;
}

export type Persona = {
  role: string;
  background: string;
  goal: string;
}
