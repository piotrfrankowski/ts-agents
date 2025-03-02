## A bit about DeepSeek

DeepSeek being available to be run locally was the original inspiration to start this project. However, as I added tooling, I've realized that Ollama DeepSeek model does not support tool calls OOTB. I've managed to work around it by creating a custom template based on `llama3.3` one. While it's not a perfect solution, it seems to work well enough for now.
That model file is located in models folder.

## How to use this model

You can tweak the base model by changing the `FROM` line in the `deepseek-70b-tools.model` file.
You might also want to consider changing the context window size by adjusting the `num_ctx` parameter.

## Adding model to Ollama

You can name the model whatever you want. Model name if the first parameter in the `ollama create` command. For example:

```bash
ollama create deepseek-70b-tools -f ./deepseek-70b-tools.model
```

## Using the model

You can use the model by passing it to the `LLM` class. For example:

```typescript
const llm = new LLM({ model: 'deepseek-70b-tools' });
```
