/**
 * @rune/core - Web Component Bridge
 *
 * Convert Rune components into native Web Components.
 */

import { mount } from "./view.js";

/**
 * Register a Rune component as a custom element.
 *
 * @param {string} tagName - Custom element name (must contain hyphen)
 * @param {Function} componentFn - Component function that returns a view
 * @param {Object} [options]
 * @param {string[]} [options.observedAttributes] - Attributes to observe
 * @param {boolean} [options.shadow] - Use Shadow DOM (default: true)
 *
 * @example
 * define("my-counter", Counter);
 * // <my-counter></my-counter>
 */
export function define(tagName, componentFn, options = {}) {
  const { observedAttributes = [], shadow = true } = options;

  class RuneElement extends HTMLElement {
    static get observedAttributes() {
      return observedAttributes;
    }

    constructor() {
      super();
      this._dispose = null;
      this._props = {};
    }

    connectedCallback() {
      const root = shadow ? this.attachShadow({ mode: "open" }) : this;

      // Collect initial attribute values
      for (const attr of this.attributes) {
        this._props[attr.name] = attr.value;
      }

      // Create and mount the component
      const viewResult = componentFn(this._props);
      this._dispose = mount(root, viewResult);
    }

    disconnectedCallback() {
      if (this._dispose) {
        this._dispose();
        this._dispose = null;
      }
    }

    attributeChangedCallback(name, oldValue, newValue) {
      this._props[name] = newValue;
    }
  }

  customElements.define(tagName, RuneElement);
}
