/**
 * @rune/server - Server Actions
 *
 * RPC-style server function calls. No REST boilerplate.
 *
 * server() - Define a server action
 */

/**
 * Create a server action.
 *
 * Wraps an async function so it can be called from the client
 * via a simple function call. The framework handles serialization
 * and transport.
 *
 * @param {Function} handler - Async function to execute on server
 * @param {Object} [options]
 * @param {string} [options.endpoint] - Custom API endpoint
 * @param {string} [options.method] - HTTP method (default: "POST")
 * @returns {Function} Client-callable async function
 *
 * @example
 * // Define
 * const createTodo = server(async (data) => {
 *   // This runs on the server
 *   return await db.insert("todos", data);
 * });
 *
 * // Call from client
 * await createTodo({ text: "Buy milk" });
 */
export function server(handler, options = {}) {
  const {
    endpoint = "/api/rune/" + _generateId(),
    method = "POST",
  } = options;

  // In a server environment, register the handler
  if (typeof globalThis.__RUNE_SERVER__ !== "undefined") {
    globalThis.__RUNE_SERVER__.register(endpoint, handler);
  }

  // Return a client-callable function
  async function action(data) {
    // If running on server (SSR), call handler directly
    if (typeof globalThis.__RUNE_SERVER__ !== "undefined") {
      return handler(data);
    }

    // Client: send as fetch request
    const response = await fetch(endpoint, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Server action failed: ${error}`);
    }

    return response.json();
  }

  action._endpoint = endpoint;
  action._type = "server_action";

  return action;
}

/**
 * Create a server-side API handler (for use with Node.js/Deno/Bun).
 *
 * @param {Object} actions - Map of action functions
 * @returns {Function} Request handler
 */
export function createHandler(actions) {
  const routes = new Map();

  for (const [name, action] of Object.entries(actions)) {
    if (action._endpoint) {
      routes.set(action._endpoint, action);
    }
  }

  return async function handler(request) {
    const url = new URL(request.url);
    const action = routes.get(url.pathname);

    if (!action) {
      return new Response("Not Found", { status: 404 });
    }

    try {
      const body = await request.json();
      const result = await action(body);
      return new Response(JSON.stringify(result), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  };
}

let _idCounter = 0;
function _generateId() {
  return `action_${Date.now().toString(36)}_${(_idCounter++).toString(36)}`;
}
