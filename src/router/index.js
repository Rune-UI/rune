/**
 * @rune/router - Client-Side Router
 *
 * Hash-based and History API routing for Rune apps.
 *
 * route()    - Define a route
 * navigate() - Navigate to a path
 * params()   - Get route parameters
 */

import { signal, computed, effect } from "../core/reactive.js";

// --- State ---

const _routes = [];
const _currentPath = signal(window.location.pathname);
const _currentParams = signal({});
const _currentQuery = signal({});
let _mode = "history"; // "history" or "hash"
let _base = "";

/**
 * Get current route parameters.
 *
 * @returns {Object} Route params
 *
 * @example
 * route("/user/:id", UserPage);
 * // URL: /user/42
 * params().id // "42"
 */
export function params() {
  return _currentParams();
}

/**
 * Get current query parameters.
 *
 * @returns {Object} Query params
 */
export function query() {
  return _currentQuery();
}

/**
 * Get current path as a signal.
 *
 * @returns {string}
 */
export function currentPath() {
  return _currentPath();
}

/**
 * Define a route.
 *
 * @param {string} pattern - URL pattern (e.g., "/user/:id")
 * @param {Function|Object} handler - Component function or view
 *
 * @example
 * route("/", Home);
 * route("/profile", Profile);
 * route("/user/:id", UserPage);
 */
export function route(pattern, handler) {
  const keys = [];
  const regexStr = pattern
    .replace(/:([^/]+)/g, (_, key) => {
      keys.push(key);
      return "([^/]+)";
    })
    .replace(/\*/g, "(.*)");

  const regex = new RegExp(`^${regexStr}$`);

  _routes.push({ pattern, regex, keys, handler });
}

/**
 * Navigate to a path.
 *
 * @param {string} path - Target path
 * @param {Object} [options]
 * @param {boolean} [options.replace] - Use replaceState instead of pushState
 *
 * @example
 * navigate("/profile");
 * navigate("/login", { replace: true });
 */
export function navigate(path, options = {}) {
  const fullPath = _base + path;

  if (_mode === "hash") {
    window.location.hash = "#" + fullPath;
  } else {
    if (options.replace) {
      window.history.replaceState(null, "", fullPath);
    } else {
      window.history.pushState(null, "", fullPath);
    }
    _handleRouteChange();
  }
}

/**
 * Initialize the router.
 *
 * @param {Object} [options]
 * @param {string} [options.mode] - "history" or "hash"
 * @param {string} [options.base] - Base path
 * @param {Element|string} [options.target] - Mount target for routed views
 *
 * @example
 * startRouter({ target: "#app" });
 */
export function startRouter(options = {}) {
  _mode = options.mode || "history";
  _base = options.base || "";

  if (_mode === "hash") {
    window.addEventListener("hashchange", _handleRouteChange);
  } else {
    window.addEventListener("popstate", _handleRouteChange);
  }

  // Intercept link clicks for SPA navigation
  document.addEventListener("click", (e) => {
    const anchor = e.target.closest("a[href]");
    if (!anchor) return;

    const href = anchor.getAttribute("href");
    if (!href || href.startsWith("http") || href.startsWith("//")) return;
    if (anchor.hasAttribute("target")) return;
    if (anchor.hasAttribute("download")) return;

    e.preventDefault();
    navigate(href);
  });

  // Initial route
  _handleRouteChange();

  // If a target is specified, set up reactive rendering
  if (options.target) {
    const container =
      typeof options.target === "string"
        ? document.querySelector(options.target)
        : options.target;

    if (container) {
      _setupRouterView(container);
    }
  }
}

function _handleRouteChange() {
  let path;
  if (_mode === "hash") {
    path = window.location.hash.slice(1) || "/";
  } else {
    path = window.location.pathname;
  }

  if (_base && path.startsWith(_base)) {
    path = path.slice(_base.length) || "/";
  }

  // Parse query string
  const search = window.location.search;
  const queryParams = {};
  if (search) {
    new URLSearchParams(search).forEach((value, key) => {
      queryParams[key] = value;
    });
  }

  _currentPath.set(path);
  _currentQuery.set(queryParams);

  // Match route
  for (const r of _routes) {
    const match = path.match(r.regex);
    if (match) {
      const routeParams = {};
      r.keys.forEach((key, i) => {
        routeParams[key] = match[i + 1];
      });
      _currentParams.set(routeParams);
      _currentRoute.set(r);
      return;
    }
  }

  // No match - 404
  _currentParams.set({});
  _currentRoute.set(null);
}

const _currentRoute = signal(null);

function _setupRouterView(container) {
  let _dispose = null;
  // Dynamic import for mount to avoid circular deps
  import("../core/view.js").then(({ mount: mountFn }) => {
    effect(() => {
    const r = _currentRoute();
    if (_dispose) _dispose();

    if (r && r.handler) {
      container.innerHTML = "";
      const viewObj =
        typeof r.handler === "function" ? r.handler() : r.handler;
      if (viewObj && viewObj._type === "view") {
        _dispose = mountFn(container, viewObj);
      }
    }
    });
  });
}

export { _currentRoute as currentRoute };
