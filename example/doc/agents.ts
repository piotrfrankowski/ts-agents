import dedent from "dedent";
import { Agent, LLM } from "../../lib";
import { tools } from "./tools";

const llm = new LLM({ model: "ds-tools-wide", connector: "ollama" });

const readme = `
# TS-Agents 🤖

**TS-Agents** is an agentic framework for TypeScript. It allows you to build multi-agent systems with ease. It allows creating agents, providing them with tools and memory and creating flows to orchestrate them.
Graph based flows allow you to create complex multi-step / decision trees are the next step.

## Why?

I became interested in creating custom agent flows and running them locally with recent advancements in LLMs and new models, like DeepSeek that seemed lightweight enough to run on my MacBook.

While there are multiple Python 🐍 based frameworks, JS and TS specifically were less mature. I took that as an opportunity to learn more about the field, build something of my own, and deepen my understanding by getting my hands dirty.

By no means I consider this project production ready, it's more of a proof of concept and a playground for me to learn more about the field. However, I'll be happy to receive feedback and contributions and improve the project.

## How Does It Work? ⚙️

The framework is built around the concept of agents. Agents are the main building blocks of the framework. They are responsible for performing tasks and using tools.

Building a flow is done by passing a list of agents to be executed. Each agent is passed an LLM instance and a list of tools. They can also have previous agents passed as context. Flow can utilize different LLMs to execute different agents.

LLM class is using a conncetor to connect to the LLM provider. Currently OpenAI and Ollama 🦙 are supported, but you can also pass a custom LLM connector.

## Examples:

- [OpenAI](./example/openai/index.ts) - Simple example of using OpenAI
- [Parallel](./example/parallel/index.ts) - Example of executing multiple agents in parallel
- [Multiagent](./example/multiagent/index.ts) - Example of using multiple agents that feed into each other in a flow

All of the examples are using one LLM instance for all agents. You can tweak it by changing \`model\` parameter in the \`LLM\` class constructor located in each \`agents.ts\` file.

## Project Goals 🚀

- ✅ Create a basic framework to connect with LLMs and execute simple tasks
- ✅ Create an agent that can be instructed to perform a task using provided LLM as a base
- ✅ Give the agent access to tools and performing tool calls
- ✅ Add example tools
- ✅ Create a flow where one multiple agents can be executed in series
- ✅ Add the ability to use previous agents' repsonses as context for the next one
- ✅ Add an option to execute multiple agents in parallel
- 🛠️ Crate a graph based flow to orchestrate complex agent flows
- 🛠️ Add a memory that agents can reach into for context in graph flows
- 🛠️ Add a fine-tuning ability

## Next Steps 🚧

- Add graph based flows (start, end, task)
- Add decision making nodes
- Add map-reduce nodes
- Add memory for graph flows
- Add a way to pass fine-tuning data to LLM models
- Add a way to generate training data for LLM models
- Add more tooling
- Add more examples
- Add more LLM connectors

## How to Get Started

If you want to use OpenAI, copy the \`.env.example\` file to \`.env\` and add your API key.
If you want to use Ollama, make sure it is running and the model(s) you want to use is downloaded.

Install dependencies:
\`\`\`bash
yarn install
\`\`\`

Run the example:
\`\`\`bash
yarn example:openai
yarn example:parallel
yarn example:multiagent
\`\`\`

## Structure

\`\`\`
ts-agents
├── lib
│   ├── connectors/      - Connectors for the LLM providers
│   ├── agent.ts         - Agent class
│   ├── flow.ts          - Flow class (orchestrator)
│   ├── llm.ts           - LLM class
│   ├── tool.ts          - Tool class
│   └── types.ts         - Types for the framework
├── models/              - Custom models for Ollama
├── tools/               - Custom tools for the agents
└── example              - Example flows
    ├── openai/
    ├── parallel/
    ├── multiagent/
    └── metadata/
\`\`\`

## Contributions

TS-Agents is open for contributions and feedback! By no means am I the expert in the field and I'll be happy to take suggestions.
If you have ideas, improvements, or bug reports, feel free to create an issue or open a pull request.
`

export const getAgents = (project: string) => {
  const techincalWriter = new Agent({
    persona: {
      role: "Technical Writer",
      background:
        "You specialize in writing technical articles describing new projects.",
      goal: dedent`Writing a technical article utilizing the provided project README.md file.
      You are given a set of tools read_file and read_repo that allow you to read the file structure of the repository and content of files repectively. 
      In order to better understand the ${project} project, you can read the code from the files.`,
    },
    tools,
    llm,
    context: [],
    task: `Write a technical article describing the new ${project} project. Be verbose and detailed.
You can look into the code, but base it on the README.md file which content is provide below:
${readme}
`,
  });

  const redactor = new Agent({
    persona: {
      role: "Editor",
      background: "You specialize in redacting and editing documents.",
      goal: dedent`Redacting and editing documents for a technical article.
      You are given a article created by technical writer.
      Review the article and provide feedback on the article.`,
    },
    tools: [],
    llm,
    context: [techincalWriter],
    task: dedent`You are given an article created by technical writer on the ${project} project.
    Review the article and provide feedback on the article. The article is mainly based on the README.md file which content is provide below:
    ${readme}
    `,
  });

  const seniorWriter = new Agent({
    persona: {
      role: "Senior Writer",
      background:
        "You specialize in writing technical articles",
      goal: `Helping to write an engaging technical article on the ${project} project.
      You are given a set of tools read_file and read_repo that allow you to read the file structure of the repository and content of files repectively. 
      In order to better understand the ${project} project, you can read the code from the files.`,
    },
    tools,
    llm,
    context: [techincalWriter, redactor],
    task: dedent`You are given a technical article created by technical writer and a review of the article created by the Editor.
    Review the article and implement the changes suggested by the Editor.
    Make sure to include motivation for starting the project and the call for feedback from the community.
    Be verbose and detailed.
    The article is mainly based on the README.md file which content is provide below:
    ${readme}
    `,
  });

  return [techincalWriter, redactor, seniorWriter];
};
