/**
 * @rune/agent - AI Agent Integration
 *
 * First-class AI agent support for Rune applications.
 *
 * agent() - Create an AI agent
 * tool()  - Define a tool for agents
 */

import { signal } from "../core/reactive.js";

/**
 * Define a tool for an agent.
 *
 * @param {Object} config
 * @param {string} config.name - Tool name
 * @param {string} config.description - Tool description for the AI
 * @param {Object} [config.parameters] - JSON Schema for parameters
 * @param {Function} config.execute - Tool implementation
 * @returns {Object} Tool definition
 *
 * @example
 * const weatherTool = tool({
 *   name: "weather",
 *   description: "Get current weather for a city",
 *   parameters: {
 *     type: "object",
 *     properties: {
 *       city: { type: "string" }
 *     }
 *   },
 *   execute: async ({ city }) => {
 *     const res = await fetch(`/api/weather?city=${city}`);
 *     return res.json();
 *   }
 * });
 */
export function tool(config) {
  if (!config.name) throw new Error("Rune agent: tool requires a name");
  if (!config.execute) throw new Error("Rune agent: tool requires execute()");

  return {
    name: config.name,
    description: config.description || "",
    parameters: config.parameters || {},
    execute: config.execute,
    _type: "tool",
  };
}

/**
 * Create an AI agent.
 *
 * @param {Object} config
 * @param {string} config.model - Model identifier (e.g., "qwen3-4b")
 * @param {Object[]} [config.tools] - Array of tool definitions
 * @param {string} [config.system] - System prompt
 * @param {string} [config.endpoint] - API endpoint for the model
 * @param {Object} [config.options] - Model-specific options
 * @returns {Object} Agent instance
 *
 * @example
 * const assistant = agent({
 *   model: "qwen3-4b",
 *   tools: [weatherTool, calendarTool],
 *   system: "You are a helpful assistant."
 * });
 *
 * const response = await assistant.ask("What's the weather?");
 */
export function agent(config) {
  if (!config.model) throw new Error("Rune agent: model is required");

  const _messages = signal([]);
  const _loading = signal(false);
  const _tools = new Map();

  // Register tools
  if (config.tools) {
    for (const t of config.tools) {
      _tools.set(t.name, t);
    }
  }

  /**
   * Send a message to the agent.
   *
   * @param {string} prompt - User message
   * @param {Object} [options]
   * @param {boolean} [options.stream] - Enable streaming
   * @returns {Promise<string>} Agent response
   */
  async function ask(prompt, options = {}) {
    _loading.set(true);

    const messages = [
      ...(config.system
        ? [{ role: "system", content: config.system }]
        : []),
      ..._messages.peek(),
      { role: "user", content: prompt },
    ];

    // Add user message to history
    _messages.update((m) => [...m, { role: "user", content: prompt }]);

    try {
      const endpoint =
        config.endpoint || "/api/agent";

      const toolDefs = [..._tools.values()].map((t) => ({
        type: "function",
        function: {
          name: t.name,
          description: t.description,
          parameters: t.parameters,
        },
      }));

      const body = {
        model: config.model,
        messages,
        ...(toolDefs.length > 0 ? { tools: toolDefs } : {}),
        ...(config.options || {}),
      };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error(`Agent error: ${response.statusText}`);
      }

      const data = await response.json();

      // Handle tool calls
      if (data.tool_calls && data.tool_calls.length > 0) {
        const toolResults = [];

        for (const call of data.tool_calls) {
          const t = _tools.get(call.function.name);
          if (t) {
            const args =
              typeof call.function.arguments === "string"
                ? JSON.parse(call.function.arguments)
                : call.function.arguments;
            const result = await t.execute(args);
            toolResults.push({
              role: "tool",
              tool_call_id: call.id,
              content: JSON.stringify(result),
            });
          }
        }

        // Continue conversation with tool results
        if (toolResults.length > 0) {
          _messages.update((m) => [
            ...m,
            { role: "assistant", content: data.content, tool_calls: data.tool_calls },
            ...toolResults,
          ]);
          // Recursive call to get final response
          return ask("", options);
        }
      }

      const content = data.content || data.choices?.[0]?.message?.content || "";

      _messages.update((m) => [
        ...m,
        { role: "assistant", content },
      ]);

      return content;
    } catch (err) {
      throw err;
    } finally {
      _loading.set(false);
    }
  }

  /**
   * Clear conversation history.
   */
  function clear() {
    _messages.set([]);
  }

  return {
    ask,
    clear,
    messages: _messages,
    loading: _loading,
    _type: "agent",
  };
}
