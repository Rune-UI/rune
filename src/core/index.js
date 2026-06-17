/**
 * @rune/core - Public API
 *
 * All core exports in one place.
 *
 * signal()   - Reactive state
 * computed() - Derived state
 * effect()   - Reactive side effects
 * view()     - Create UI from templates
 * mount()    - Attach view to DOM
 * html``     - Tagged template for event handlers
 * resource() - Async state
 * define()   - Web Component bridge
 * batch()    - Batch updates
 * untrack()  - Read without tracking
 * onMount()  - Lifecycle: after mount
 * onCleanup()- Lifecycle: cleanup
 */

export {
  signal,
  computed,
  effect,
  batch,
  untrack,
  onMount,
  onCleanup,
} from "./reactive.js";

export { view, html, mount } from "./view.js";

export { resource } from "./resource.js";

export { define } from "./component.js";
