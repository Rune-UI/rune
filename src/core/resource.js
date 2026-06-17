/**
 * @rune/core - Resource (Async State)
 *
 * Manages async data fetching with reactive loading/error/data states.
 */

import { signal, effect } from "./reactive.js";

/**
 * Create an async resource.
 *
 * @param {Function} fetcher - Async function that returns data
 * @param {Object} [options]
 * @param {*} [options.initialValue] - Initial data value
 * @returns {{ data: Function, loading: Function, error: Function, refetch: Function }}
 *
 * @example
 * const users = resource(() => fetch("/api/users").then(r => r.json()));
 * users.data();    // array of users
 * users.loading(); // true/false
 * users.error();   // null or Error
 * users.refetch(); // re-fetch
 */
export function resource(fetcher, options = {}) {
  const data = signal(options.initialValue ?? null);
  const loading = signal(true);
  const error = signal(null);
  let _version = 0;

  async function _fetch() {
    const version = ++_version;
    loading.set(true);
    error.set(null);

    try {
      const result = await fetcher();
      // Only update if this is still the latest fetch
      if (version === _version) {
        data.set(result);
        loading.set(false);
      }
    } catch (err) {
      if (version === _version) {
        error.set(err);
        loading.set(false);
      }
    }
  }

  // Initial fetch
  _fetch();

  // Read shorthand - returns data
  function read() {
    return data();
  }

  read.data = data;
  read.loading = loading;
  read.error = error;
  read.refetch = _fetch;
  read._type = "resource";

  return read;
}
