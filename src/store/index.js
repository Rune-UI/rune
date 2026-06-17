/**
 * @rune/store - Global Reactive Store
 *
 * Creates a store with reactive properties from a plain object.
 *
 * store() - Create reactive store
 */

import { signal, batch } from "../core/reactive.js";

/**
 * Create a global reactive store.
 *
 * Each property becomes a signal with getter/setter.
 *
 * @param {Object} initialState - Plain object with initial values
 * @returns {Object} Store with reactive properties
 *
 * @example
 * const app = store({
 *   theme: "dark",
 *   user: null
 * });
 *
 * app.theme();            // "dark"
 * app.theme.set("light"); // update
 * app.user.set({ name: "John" });
 */
export function store(initialState) {
  const _store = {};
  const _signals = {};

  for (const [key, value] of Object.entries(initialState)) {
    const s = signal(value);
    _signals[key] = s;

    // Create a callable property that acts like a signal
    _store[key] = s;
  }

  /**
   * Reset all properties to initial values.
   */
  _store.$reset = function () {
    batch(() => {
      for (const [key, value] of Object.entries(initialState)) {
        _signals[key].set(value);
      }
    });
  };

  /**
   * Get a snapshot of all current values.
   */
  _store.$snapshot = function () {
    const snap = {};
    for (const key of Object.keys(_signals)) {
      snap[key] = _signals[key].peek();
    }
    return snap;
  };

  /**
   * Batch-update multiple properties.
   */
  _store.$patch = function (updates) {
    batch(() => {
      for (const [key, value] of Object.entries(updates)) {
        if (_signals[key]) {
          _signals[key].set(value);
        }
      }
    });
  };

  _store._type = "store";

  return _store;
}
