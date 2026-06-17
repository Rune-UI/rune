/**
 * @rune/core - Reactive Primitives
 *
 * Fine-grained reactivity system.
 * signal → dependency graph → effect → DOM node
 */

// --- Dependency Tracking ---

let _observer = null;
const _stack = [];
let _batchDepth = 0;
let _pendingEffects = new Set();

/**
 * Get the current tracking observer.
 */
export function getObserver() {
  return _observer;
}

/**
 * Batch multiple state changes into a single update.
 *
 * @param {Function} fn
 */
export function batch(fn) {
  _batchDepth++;
  try {
    fn();
  } finally {
    _batchDepth--;
    if (_batchDepth === 0) {
      const effects = [..._pendingEffects];
      _pendingEffects.clear();
      for (const effect of effects) {
        effect._execute();
      }
    }
  }
}

/**
 * Run a function without tracking dependencies.
 *
 * @param {Function} fn
 * @returns {*}
 */
export function untrack(fn) {
  const prev = _observer;
  _observer = null;
  try {
    return fn();
  } finally {
    _observer = prev;
  }
}

// --- Signal ---

let _signalId = 0;

/**
 * Create a reactive signal.
 *
 * @param {*} initialValue
 * @returns {Function} Getter function with .set(), .update(), .peek()
 *
 * @example
 * const count = signal(0);
 * count();           // read (tracked)
 * count.set(5);      // write
 * count.update(v => v + 1); // update
 * count.peek();      // read (untracked)
 */
export function signal(initialValue) {
  let _value = initialValue;
  const _subscribers = new Set();
  const _id = _signalId++;

  // Getter - reads value and tracks dependency
  function read() {
    if (_observer) {
      _subscribers.add(_observer);
      _observer._sources.add(read);
    }
    return _value;
  }

  // Set a new value
  read.set = function set(newValue) {
    if (Object.is(_value, newValue)) return;
    _value = newValue;
    _notify(_subscribers);
  };

  // Update value via function
  read.update = function update(fn) {
    read.set(fn(_value));
  };

  // Read without tracking
  read.peek = function peek() {
    return _value;
  };

  // Subscribe to changes (for external consumers)
  read.subscribe = function subscribe(fn) {
    const e = _createEffect(() => fn(read()));
    return () => _disposeEffect(e);
  };

  // Internal
  read._subscribers = _subscribers;
  read._id = _id;
  read._type = "signal";

  return read;
}

/**
 * Notify all subscribers of a signal.
 */
function _notify(subscribers) {
  const subs = [...subscribers];
  for (const sub of subs) {
    if (_batchDepth > 0) {
      _pendingEffects.add(sub);
    } else {
      sub._execute();
    }
  }
}

// --- Computed ---

/**
 * Create a derived reactive value.
 *
 * @param {Function} fn - Derivation function
 * @returns {Function} Read-only getter
 *
 * @example
 * const fullName = computed(() => `${first()} ${last()}`);
 * fullName(); // "John Doe"
 */
export function computed(fn) {
  let _value;
  let _dirty = true;
  const _subscribers = new Set();
  const _id = _signalId++;

  const _inner = _createEffect(() => {
    const newValue = fn();
    if (!Object.is(_value, newValue)) {
      _value = newValue;
      _dirty = false;
      _notify(_subscribers);
    }
  });

  function read() {
    if (_observer) {
      _subscribers.add(_observer);
      _observer._sources.add(read);
    }
    return _value;
  }

  read.peek = function peek() {
    return _value;
  };

  read._subscribers = _subscribers;
  read._id = _id;
  read._type = "computed";

  return read;
}

// --- Effect ---

/**
 * Create a reactive side effect.
 *
 * @param {Function} fn - Effect function, re-runs when dependencies change
 * @returns {Function} Dispose function
 *
 * @example
 * const dispose = effect(() => {
 *   console.log(count());
 * });
 * dispose(); // stop
 */
export function effect(fn) {
  const e = _createEffect(fn);
  return () => _disposeEffect(e);
}

function _createEffect(fn) {
  const e = {
    _fn: fn,
    _sources: new Set(),
    _cleanups: [],
    _disposed: false,
    _execute() {
      if (e._disposed) return;
      _cleanupEffect(e);
      const prev = _observer;
      _observer = e;
      _stack.push(e);
      try {
        e._fn();
      } finally {
        _stack.pop();
        _observer = prev;
      }
    },
  };
  e._execute();
  return e;
}

function _cleanupEffect(e) {
  // Remove from all source subscriber lists
  for (const source of e._sources) {
    if (source._subscribers) {
      source._subscribers.delete(e);
    }
  }
  e._sources.clear();
  // Run cleanup functions
  for (const cleanup of e._cleanups) {
    cleanup();
  }
  e._cleanups = [];
}

function _disposeEffect(e) {
  e._disposed = true;
  _cleanupEffect(e);
}

// --- Lifecycle ---

/**
 * Register a callback to run after the component mounts.
 *
 * @param {Function} fn
 */
export function onMount(fn) {
  queueMicrotask(fn);
}

/**
 * Register a cleanup function for the current effect.
 *
 * @param {Function} fn
 */
export function onCleanup(fn) {
  if (_observer) {
    _observer._cleanups.push(fn);
  }
}
