import dedent from "dedent";
import { Agent, LLM } from "../../lib";
import { tools } from "./tools";

const openai = new LLM({ model: "gpt-4o-mini", connector: "openai" });

export const getAgents = (repository: string) => {
  const codeAnalyst = new Agent({
    persona: {
      role: "Code Analyst",
      background:
        "You specialize in node.js applications that use postgres as its database ",
      goal: dedent`Please, read through the database schema of the ${repository} application.
      Describe the schema and provide a list of tables and their relationships. 
      You are given a set of tools read_repo and read_file that allow you to read the file structure of the repository and content of files repectively. 
      In order to understand the database schema, you need to first understand the repository structure and then read the code from the files.`,
    },
    tools,
    llm: openai,
    context: [],
    task: dedent`Read the code of the ${repository} repository and provide a description of the database architecture.
    Do not assume anything without reading the code.
    By reading the code carefully, you can understand the relationships between the tables and the business logic of the application.
    Do not depend on the repositry structure alone, read the code for better understanding.
    Repository name is "${repository}" do not read any other repository.`,
  });

  return [codeAnalyst];
};
