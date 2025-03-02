import dedent from 'dedent';
import { Agent, LLM } from '../../lib'; 
import { tools } from './tools';

// const llm = new LLM({ model: 'deepseek-70b-tools', connector: 'ollama' })
// const llm = new LLM({ model: 'llama3.3', connector: 'ollama' })
// const llm = new LLM({ model: 'gpt-4o-mini', connector: 'openai' })
const llm = new LLM({ model: 'ds-tools-wide', connector: 'ollama' })

export const getAgents = (repository: string) => {

  const codingTool = new Agent({
    persona: {
      role: 'Coding Tool',
      background: 'You specialize in providing helpful code examples and code snippets to the user.',
      goal: dedent`Provide an answer in json format with content comprised of a markdown formatted text and a metadata section providing code snippet placement in the existing codebase. Content should have a link to the code snippet defined by metadata.
      Make sure that your json response follows the schema: { content: string, metadata: { [key: string]: { file: string, start: number, end: number } } } where key is a unique identifier for the code snippet appearing in the content, start and end are the line numbers of the code snippet in the file.
      Here is an example response that yours should be similar to: {
        "content": "Creating a new endpoint is *service* codebase like in [this](#link-1) example.",
        "metadata": {
          "link-1": {
            "file": "src/quest/quest.controller.ts",
            "start": 33,
            "end": 51
          }
        }
      }`,
    },
    tools,
    llm,
    context: [],
    task: dedent`Read the code of the ${repository} repository and provide a code snippet that is used to create a health endpoint.`,
  })

  return [codingTool];
}
