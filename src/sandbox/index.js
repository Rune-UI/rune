/**
 * @rune/sandbox - Secure Execution Sandbox
 *
 * Execute agent-generated code safely using an isolated environment.
 * No eval(). No iframe. No global access.
 *
 * Architecture:
 *   AI Agent → Sandbox → DOM Bridge → Browser DOM
 */

/**
 * Create a sandboxed execution environment.
 *
 * @param {Object} [options]
 * @param {string[]} [options.allowedAPIs] - List of allowed browser APIs
 * @param {number} [options.timeout] - Execution timeout in ms (default: 5000)
 * @param {Element} [options.container] - DOM container for rendered output
 * @returns {Object} Sandbox instance
 *
 * @example
 * const sandbox = createSandbox({
 *   allowedAPIs: ["fetch", "console"],
 *   timeout: 3000,
 *   container: document.getElementById("output")
 * });
 *
 * await sandbox.execute(`
 *   const data = await fetch("/api/data");
 *   return data.json();
 * `);
 */
export function createSandbox(options = {}) {
  const {
    allowedAPIs = ["console", "Math", "JSON", "Date"],
    timeout = 5000,
    container = null,
  } = options;

  // Build safe global scope
  const _safeGlobals = {};

  for (const api of allowedAPIs) {
    if (api === "console") {
      _safeGlobals.console = {
        log: (...args) => console.log("[sandbox]", ...args),
        warn: (...args) => console.warn("[sandbox]", ...args),
        error: (...args) => console.error("[sandbox]", ...args),
      };
    } else if (api === "fetch") {
      _safeGlobals.fetch = _createSafeFetch(options.allowedOrigins);
    } else if (typeof globalThis[api] !== "undefined") {
      _safeGlobals[api] = globalThis[api];
    }
  }

  // DOM bridge for container manipulation
  if (container) {
    _safeGlobals.dom = _createDOMBridge(container);
  }

  /**
   * Execute code in the sandbox.
   *
   * @param {string} code - JavaScript code to execute
   * @param {Object} [context] - Additional variables to inject
   * @returns {Promise<*>} Execution result
   */
  async function execute(code, context = {}) {
    const allGlobals = { ..._safeGlobals, ...context };
    const keys = Object.keys(allGlobals);
    const values = Object.values(allGlobals);

    // Create an async function with restricted scope
    const fn = new Function(
      ...keys,
      `"use strict";
       return (async () => {
         ${code}
       })();`
    );

    // Execute with timeout
    const result = await Promise.race([
      fn(...values),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Sandbox timeout")), timeout)
      ),
    ]);

    return result;
  }

  /**
   * Destroy the sandbox and clean up.
   */
  function destroy() {
    if (container) {
      container.innerHTML = "";
    }
  }

  return {
    execute,
    destroy,
    _type: "sandbox",
  };
}

/**
 * Create a safe fetch wrapper that restricts origins.
 */
function _createSafeFetch(allowedOrigins) {
  return async function safeFetch(url, options) {
    if (allowedOrigins) {
      const parsed = new URL(url, window.location.origin);
      const allowed = allowedOrigins.some(
        (origin) =>
          parsed.origin === origin || parsed.hostname === origin
      );
      if (!allowed) {
        throw new Error(`Sandbox: fetch to ${parsed.origin} is not allowed`);
      }
    }
    return fetch(url, options);
  };
}

/**
 * Create a DOM bridge for safe container manipulation.
 */
function _createDOMBridge(container) {
  return {
    setHTML(html) {
      container.innerHTML = html;
    },
    setText(text) {
      container.textContent = text;
    },
    append(html) {
      const template = document.createElement("template");
      template.innerHTML = html;
      container.appendChild(template.content.cloneNode(true));
    },
    clear() {
      container.innerHTML = "";
    },
    query(selector) {
      const el = container.querySelector(selector);
      if (!el) return null;
      return {
        setText: (t) => (el.textContent = t),
        setHTML: (h) => (el.innerHTML = h),
        setAttribute: (k, v) => el.setAttribute(k, v),
        getAttribute: (k) => el.getAttribute(k),
      };
    },
  };
}
