/**
 * @rune/core - View & Template System
 *
 * view()  - Creates a reactive view from a render function
 * html``  - Tagged template literal for templates with event handlers
 * mount() - Attaches a view to the DOM
 */

import { effect, onCleanup, getObserver, untrack } from "./reactive.js";

// --- Handler Capture ---

let _capturing = false;
let _handlers = new Map();
let _handlerId = 0;
const _origToString = Function.prototype.toString;

/**
 * Start capturing function-to-string conversions.
 * During capture, functions interpolated in template literals
 * produce marker IDs instead of source code.
 */
function _startCapture() {
  _capturing = true;
  _handlers = new Map();
  _handlerId = 0;
}

function _endCapture() {
  _capturing = false;
  const result = _handlers;
  _handlers = new Map();
  return result;
}

// Override Function.prototype.toString to capture handlers in templates
const _patchedToString = function () {
  if (_capturing) {
    const id = `__rh${_handlerId++}`;
    _handlers.set(id, this);
    return id;
  }
  return _origToString.call(this);
};

Function.prototype.toString = _patchedToString;

// --- html Tagged Template ---

/**
 * Tagged template literal for HTML with event handler support.
 *
 * @example
 * html`<button @click=${handler}>Label</button>`
 *
 * @returns {{ _html: string, _handlers: Map }}
 */
export function html(strings, ...values) {
  const handlers = new Map();
  let result = "";

  for (let i = 0; i < strings.length; i++) {
    result += strings[i];
    if (i < values.length) {
      const val = values[i];
      if (typeof val === "function") {
        const id = `__rh${_handlerId++}`;
        handlers.set(id, val);
        result += id;
      } else if (Array.isArray(val)) {
        result += val.join("");
      } else if (val == null) {
        result += "";
      } else {
        result += String(val);
      }
    }
  }

  return { _html: result, _handlers: handlers, _type: "template" };
}

// --- View ---

/**
 * Create a reactive view.
 *
 * @param {Function} renderFn - Returns template string or html`` result
 * @returns {{ _renderFn: Function, _type: string }}
 *
 * @example
 * const App = view(() => `
 *   <h1>Count: ${count()}</h1>
 *   <button @click=${increment}>+1</button>
 * `);
 */
export function view(renderFn) {
  return {
    _renderFn: renderFn,
    _type: "view",
  };
}

// --- Mount ---

/**
 * Mount a view to a DOM element.
 *
 * @param {Element|string} target - DOM element or CSS selector
 * @param {Object} viewObj - View created by view()
 * @returns {Function} Unmount/dispose function
 *
 * @example
 * mount(document.body, App);
 * mount("#app", App);
 */
export function mount(target, viewObj) {
  const container =
    typeof target === "string" ? document.querySelector(target) : target;

  if (!container) {
    throw new Error(`Rune: mount target not found: ${target}`);
  }

  // Component function - call it to get the view
  if (typeof viewObj === "function") {
    viewObj = viewObj();
  }

  if (!viewObj || viewObj._type !== "view") {
    throw new Error("Rune: mount expects a view()");
  }

  let firstRender = true;

  const dispose = effect(() => {
    // Render
    _startCapture();
    const result = viewObj._renderFn();
    const capturedHandlers = _endCapture();

    let htmlStr;
    let handlers;

    if (result && result._type === "template") {
      // html`` tagged template result
      htmlStr = result._html;
      handlers = new Map([...capturedHandlers, ...result._handlers]);
    } else {
      // Plain string
      htmlStr = String(result);
      handlers = capturedHandlers;
    }

    // Trim whitespace
    htmlStr = htmlStr.trim();

    if (firstRender) {
      container.innerHTML = htmlStr;
      firstRender = false;
    } else {
      // Morph existing DOM to match new HTML
      _morph(container, htmlStr);
    }

    // Bind event handlers
    _bindEvents(container, handlers);
  });

  return dispose;
}

// --- Event Binding ---

const EVENT_RE = /^@(.+)$/;

/**
 * Scan the DOM tree for @event attributes and bind handlers.
 */
function _bindEvents(root, handlers) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT);
  const elements = [root];

  let node;
  while ((node = walker.nextNode())) {
    elements.push(node);
  }

  for (const el of elements) {
    const attrs = [...el.attributes];
    for (const attr of attrs) {
      const match = attr.name.match(EVENT_RE);
      if (match) {
        const eventName = match[1];
        const handlerId = attr.value;
        const handler = handlers.get(handlerId);

        if (handler) {
          // Remove old listener if exists
          if (el._runeHandlers && el._runeHandlers[eventName]) {
            el.removeEventListener(eventName, el._runeHandlers[eventName]);
          }
          if (!el._runeHandlers) el._runeHandlers = {};
          el._runeHandlers[eventName] = handler;
          el.addEventListener(eventName, handler);
        }

        el.removeAttribute(attr.name);
      }
    }
  }
}

// --- DOM Morphing ---

/**
 * Lightweight DOM morphing algorithm.
 * Updates existing DOM to match new HTML string with minimal mutations.
 */
function _morph(container, newHTML) {
  const template = document.createElement("template");
  template.innerHTML = newHTML;
  const newNodes = template.content;

  _morphChildren(container, newNodes);
}

function _morphChildren(existing, incoming) {
  const existingChildren = [...existing.childNodes];
  const incomingChildren = [...incoming.childNodes];

  const max = Math.max(existingChildren.length, incomingChildren.length);

  for (let i = 0; i < max; i++) {
    const existingChild = existingChildren[i];
    const incomingChild = incomingChildren[i];

    if (!existingChild && incomingChild) {
      // Add new node
      existing.appendChild(incomingChild.cloneNode(true));
    } else if (existingChild && !incomingChild) {
      // Remove extra node
      existing.removeChild(existingChild);
    } else if (existingChild && incomingChild) {
      _morphNode(existingChild, incomingChild);
    }
  }
}

function _morphNode(existing, incoming) {
  // Different node types
  if (existing.nodeType !== incoming.nodeType) {
    existing.replaceWith(incoming.cloneNode(true));
    return;
  }

  // Text nodes
  if (existing.nodeType === Node.TEXT_NODE) {
    if (existing.textContent !== incoming.textContent) {
      existing.textContent = incoming.textContent;
    }
    return;
  }

  // Comment nodes
  if (existing.nodeType === Node.COMMENT_NODE) {
    if (existing.textContent !== incoming.textContent) {
      existing.textContent = incoming.textContent;
    }
    return;
  }

  // Element nodes
  if (existing.nodeType === Node.ELEMENT_NODE) {
    // Different tag names - replace entirely
    if (existing.tagName !== incoming.tagName) {
      existing.replaceWith(incoming.cloneNode(true));
      return;
    }

    // Preserve rune event handlers
    const runeHandlers = existing._runeHandlers;

    // Update attributes
    _morphAttributes(existing, incoming);

    // Restore handlers reference
    if (runeHandlers) existing._runeHandlers = runeHandlers;

    // Special elements - update value directly
    if (existing.tagName === "INPUT" || existing.tagName === "TEXTAREA") {
      if (existing.value !== incoming.value) {
        existing.value = incoming.value || "";
      }
      if (existing.checked !== incoming.checked) {
        existing.checked = incoming.checked;
      }
    }

    if (existing.tagName === "SELECT") {
      if (existing.value !== incoming.value) {
        existing.value = incoming.value || "";
      }
    }

    // Recurse into children
    _morphChildren(existing, incoming);
  }
}

function _morphAttributes(existing, incoming) {
  // Remove attributes not in incoming (skip @event attrs)
  const existingAttrs = [...existing.attributes];
  for (const attr of existingAttrs) {
    if (!attr.name.startsWith("@") && !incoming.hasAttribute(attr.name)) {
      existing.removeAttribute(attr.name);
    }
  }

  // Add/update attributes from incoming
  const incomingAttrs = [...incoming.attributes];
  for (const attr of incomingAttrs) {
    if (existing.getAttribute(attr.name) !== attr.value) {
      existing.setAttribute(attr.name, attr.value);
    }
  }
}
