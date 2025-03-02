import dedent from "dedent";
import { Agent, LLM } from "../../lib";
import { tools } from "./tools";

const llm = new LLM({ model: "deepseek-70b-tools", connector: "ollama" });

export const getAgents = (repository: string) => {
  const codeAnalyst = new Agent({
    persona: {
      role: "Code Analyst",
      background:
        "You specialize in node.js applications that use postgres as its database ",
      goal: dedent`Please, read through the database schema of the ${repository} application.
      Describe the schema and provide a list of tables and their relationships. 
      You are given a set of tools read_repo and read_file that allow you to read the file structure of the repository and content of files repectively. 
      In order to understand the database schema, you need to first understand the repository structureand then read the code from the files.`,
    },
    tools,
    llm,
    context: [],
    task: dedent`Read the code of the ${repository} repository and provide a description of the database architecture.
    By reading the code carefully, you can understand the relationships between the tables and the business logic of the application.
    Do not depend on the repositry structure alone, read the code for better understanding.
    Repository name is "${repository}" do not read any other repository.`,
  });

  const aiEngineer = new Agent({
    persona: {
      role: "AI Engineer",
      background:
        "You specialize in validating the work of AI agents that can help with the development of the application.",
      goal: dedent`You are given a response from the Code Analyst.
      Validate the response and provide a list of improvements that can be made to the response.
      The response is a description of the database schema of the ${repository} application.`,
    },
    tools,
    llm,
    context: [codeAnalyst],
    task: dedent`Validate the ${repository} database documentation created by the Code Analyst and provide a list of improvements to that documentation.
    Do not suggest changes to the code, only to the documentation.
    You can read the code for better understanding.
    Repository name is "${repository}" do not read any other repository.`,
  });

  const seniorDatabaseArchitect = new Agent({
    persona: {
      role: "Senior Database Architect",
      background: "You specialize in database architecture and design.",
      goal: dedent`You are given a work done by the Code Analyst, as well as, the response from the AI Engineer that validated that documentation.
      You are experienced in database design and architecture.
      You are also proficient in the database schema and relationships documentation.`,
    },
    tools,
    llm,
    context: [codeAnalyst, aiEngineer],
    task: dedent`Work on improving the response from the Code Analyst.
    Make sure to follow the instructions from the AI Engineer.
    This relates to the ${repository} application.
    Use as many tools as needed.
    Do not depend on the repositry structure alone, read the code for better understanding.
    Repository name is "${repository}" do not read any other repository.`,
  });

  const technicalWriter = new Agent({
    persona: {
      role: "Technical Writer",
      background: dedent`You are given a set of tools that allow you to read the code of the files and the repository structure. 
      You are also provided with the database architecture description and documentation of the application provided by the Senior Database Architect.`,
      goal: dedent`You are given a response from the Senior Database Architect.`,
    },
    tools,
    llm,
    context: [codeAnalyst, seniorDatabaseArchitect],
    task: dedent`Prepare a technical documentation for the ${repository} application. Create a database schema documentation for the rewards service.
    Add an UML diagram of the database schema to the documentation.
    Repository name is "${repository}" do not read any other repository.`,
  });

  return [codeAnalyst, aiEngineer, seniorDatabaseArchitect, technicalWriter];
};
