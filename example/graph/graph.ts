import { StartNode, TaskNode, EndNode, DecisionNode } from "../../lib";
import { codingTool, responseValidator } from "./agents";
import { logger } from "../../lib/logger";

const end = new EndNode({ name: 'end' });
const decision = new DecisionNode({
  name: 'confidence',
  choices: {
    'yes': end,
    'no': 'analysis',
  },
  selector: async (input) => {
    if (!input) {
      return 'no'
    }
    try {
      const obj = JSON.parse(input)
      if (!obj.confidence) {
        return 'no'
      }
      logger.info(`\n\n\n\nconfidence: ${obj.confidence}\n\n\n\n`)
      return obj.confidence >= 0.8 ? 'yes' : 'no' 
    } catch (e) {
      return 'no'
    }
  }
});
const validation = new TaskNode({ name: 'validation', agent: responseValidator, next: decision });
const analysis = new TaskNode({ name: 'analysis', agent: codingTool, next: validation });

export const start = new StartNode(analysis);