import dedent from "dedent";
import { Agent, LLM } from "../../lib";

const llm = new LLM({ model: "llama3.1", connector: "ollama" });

export const getAgents = (coinName: string) => {
  const blockchainDeveloper = new Agent({
    persona: {
      role: "Blockchain Developer",
      background:
        "You specialize in developing smart contracts and dapps on the blockchain.",
      goal: `Writing smart contracts in solidity for EVM compatible blockchains.`,
    },
    tools: [],
    llm,
    context: [],
    task: dedent`Write a smart contract for the new ERC20 token called ${coinName}.
    This token should have the following features:
    - It should be an ERC20 token
    - It should have a name
    - It should have a symbol
    - It should have a decimals
    - It should have a total supply
    - It should have a mint function that is only available to the owner
    - It should have a burn function that is only available to the owner
    - It should have a transfer function
    - It should have a balanceOf function
    - It should have a totalSupply function
    - It should have a owner function
    - It should have a approve function
    - It should have a allowance function
    - It should have a transferFrom function
    `,
  });

  const solidityDeveloper = new Agent({
    persona: {
      role: "Solidity Developer",
      background: "You specialize in developing smart contracts in Solidity.",
      goal: dedent`Writing smart contracts in solidity for EVM compatible blockchains.
      Doing code reviews of Solidity code and providing feedback on the code.
      Suggesting code improvements and best practices.`,
    },
    tools: [],
    llm,
    context: [blockchainDeveloper],
    task: dedent`You are given a smart contract in Solidity.
    Review the code and provide feedback on the code.
    Implement code improvements and best practices.
    The smart contract is for the new ERC20 token called MeowCoin.
    `,
  });

  const blockchainSecurityExpert = new Agent({
    persona: {
      role: "Blockchain Security Expert",
      background:
        "You specialize in securing smart contracts on the blockchain.",
      goal: `Securing smart contracts on the blockchain.`,
    },
    tools: [],
    llm,
    context: [blockchainDeveloper],
    task: dedent`You are given a smart contract in Solidity.
    The smart contract is for the new ERC20 token called MeowCoin.
    Review the code taking into account the security of the contract.
    Suggest code improvements and best practices.
    Implement the code improvements.
    `,
  });

  return [blockchainDeveloper, [solidityDeveloper, blockchainSecurityExpert]];
};
