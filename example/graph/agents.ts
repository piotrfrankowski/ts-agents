import dedent from 'dedent';
import { Agent, LLM } from '../../lib'; 
import { tools } from './tools';

const llm = new LLM({ model: 'llama3.3', connector: 'ollama' })

const responseSpec = `Make sure that your json response follows the schema:
{ repo_name: string, content: string, metadata: { [key: string]: { file: string, start: number, end: number } } } 
where:
- repo_name is the name of the repository from original request
- key is a unique identifier for the code snippet appearing in the content, 
- start and end are the line numbers of the code snippet in the source file.
Here is an example response that yours should be similar to:
{
  "repo_name": "quest-service",
  "content": "Creating a new endpoint is *service* codebase like in [this](#link-1) example.",
  "metadata": {
    "link-1": {
      "file": "src/quest/quest.controller.ts",
      "start": 33,
      "end": 51
    }
  }
}`
export const codingTool = new Agent({
  persona: {
    role: 'Coding Tool',
    background: 'You specialize in providing helpful code examples and code snippets to the user.',
    goal: dedent`Provide an answer in json format with content comprised of a markdown formatted text and a metadata section providing code snippet placement in the existing codebase. Content should have a link to the code snippet defined by metadata.
    ${responseSpec}`,
  },
  tools,
  llm,
  context: [],
  task: dedent`You are given a repository name as an input and optionally previous attempt at the task and suggestions for improvements.
  Read the code of that repository and provide a code snippet that is used to create a health endpoint.`,
})

export const responseValidator = new Agent({
  persona: {
    role: 'Response Validator',
    background: 'You specialize in validating the work of AI agents that can help with the development of the application.',
    goal: dedent`Provide an answer in json format containing a list of suggestions for improvements, previous attempt and original repository name.
    Make sure that your json response follows the schema: { repo_name: string, suggestions: string[], previous_attempt: string, confidence: number }.
    Where repo_name is the name of the repository from original request,
    suggestions is an array of suggestions for improvements,
    previous_attempt is the previous attempt at the task and
    confidence is a score between 0 and 1.
    Here is an example response that yours should be similar to: '{
      "repo_name": "quest-service",
      "suggestions": ["content should be more detailed", "metadata field is misnamed", "lines position is not correct"],
      "previous_attempt": "{\"repo_name\": \"quest-service\", \"content\": \"This is a [snippet](#link-1)\", \"metadata\": {\"link-1\": {\"file\": \"src/quest/quest.controller.ts\", \"start\": 33, \"end\": 51}}}",
      "confidence": 0.8
    }'
    Make sure that your response is a valid json object.`,
  },
  tools: [],
  llm,
  context: [],
  task: `As your input your are given a response from coding tool agent.
They have been asked to provide an answer in this format: ${responseSpec}
Your task is to validate the response with confidence score between 0 and 1 and provide a list of suggestions for improvements, previous attempt and original repository name.`,
})
