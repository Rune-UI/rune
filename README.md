<div align="center">

# ᚱ Rune

### Small primitives for the agentic web.

AI-native UI framework built on platform primitives.

No JSX. No compiler. No Virtual DOM.

[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)
[![Zero Dependencies](https://img.shields.io/badge/dependencies-0-brightgreen.svg)](#)
[![Bundle Size](https://img.shields.io/badge/core-~5KB_gzip-purple.svg)](#)

</div>

---

## Why Rune?

Modern frameworks optimize for developers. Rune optimizes for:

| Audience | Benefit |
|----------|---------|
| **Developers** | Tiny API surface. Five core functions. |
| **AI Agents** | Entire docs fit in <10K tokens. |
| **Browsers** | Zero build step. Native ES Modules. |

```
Developer + AI Agent + Browser
```

Instead of:

```
Developer + Compiler + Bundler + Virtual DOM
```

---

## Installation

```bash
npm install rune-ui
```

Or use directly via ES Modules (no build step):

```html
<script type="module">
  import { signal, view, mount } from "./src/core/index.js";
</script>
```

---

## Quick Start

```js
import { signal, view, mount } from "rune-ui";

const count = signal(0);

function increment() {
  count.update(v => v + 1);
}

const App = view(() => `

<h1>Rune</h1>

<button @click=${increment}>
  Count: ${count()}
</button>

`);

mount(document.body, App);
```

That's it. No JSX. No compiler. No build step.

---

## Core APIs

Rune exposes only **five** core primitives:

```js
signal()    // Reactive state
computed()  // Derived state
effect()    // Side effects
view()      // Create UI
mount()     // Attach to DOM
```

### Signal

```js
const count = signal(0);

count();              // read (tracked)
count.set(5);         // write
count.update(v => v + 1); // update
count.peek();         // read (untracked)
```

### Computed

```js
const first = signal("John");
const last  = signal("Doe");

const fullName = computed(
  () => `${first()} ${last()}`
);
```

### Effect

```js
effect(() => {
  console.log(count());
});
// Dependencies tracked automatically.
```

### View

```js
const App = view(() => `
  <h1>Count: ${count()}</h1>
  <button @click=${increment}>+1</button>
`);
```

### Mount

```js
mount(document.body, App);
mount("#app", App);
```

---

## Components

Components are plain functions.

```js
function Counter() {
  const count = signal(0);

  return view(() => `
    <button @click=${() => count.update(v => v + 1)}>
      Count ${count()}
    </button>
  `);
}

mount("#app", Counter);
```

---

## Event Binding

```js
<button @click=${handler}>      // click
<input  @input=${onInput}>      // input
<form   @submit=${onSubmit}>    // submit
<input  @change=${onChange}>    // change
<input  @keydown=${onKeyDown}>  // keydown
```

---

## Packages

```
rune-ui             Core: signal, computed, effect, view, mount
rune-ui/router      Client-side routing
rune-ui/store       Global reactive store
rune-ui/server      Server actions (RPC)
rune-ui/agent       AI agent integration
rune-ui/sandbox     Secure code execution
```

### Router

```js
import { route, navigate, params } from "rune-ui/router";

route("/", Home);
route("/user/:id", UserPage);

navigate("/user/42");

// Inside UserPage:
params().id // "42"
```

### Store

```js
import { store } from "rune-ui/store";

const app = store({
  theme: "dark",
  user: null
});

app.theme();            // "dark"
app.theme.set("light"); // update
app.$patch({ theme: "dark", user: { name: "John" } });
app.$reset();
```

### Agent

```js
import { agent, tool } from "rune-ui/agent";

const weatherTool = tool({
  name: "weather",
  description: "Get weather for a city",
  execute: async ({ city }) => fetch(`/api/weather?city=${city}`)
});

const assistant = agent({
  model: "qwen3-4b",
  tools: [weatherTool]
});

await assistant.ask("What's the weather in Tokyo?");
```

### Server Actions

```js
import { server } from "rune-ui/server";

const createTodo = server(async (data) => {
  return await db.insert("todos", data);
});

// Client-side call — no REST boilerplate
await createTodo({ text: "Buy milk" });
```

---

## Lifecycle

```js
onMount(() => {
  // After component mounts
});

onCleanup(() => {
  // Cleanup on disposal
});
```

---

## Web Components

```js
import { define } from "rune-ui";

define("my-counter", Counter);
```

```html
<my-counter></my-counter>
```

---

## Design Goals

| Goal         | Target   |
|------------- |----------|
| Runtime      | <10 KB   |
| Dependencies | 0        |
| Compiler     | No       |
| Virtual DOM  | No       |
| Build Step   | No       |
| SSR          | Optional |
| Hydration    | Partial  |

---

## Architecture

```
signal → dependency graph → effect → DOM node
```

No Virtual DOM. No diffing algorithm. Signals directly update the DOM nodes that depend on them.

---

## Folder Structure

```
src/
  main.js
  pages/
    home.js
    profile.js
  components/
    navbar.js
    card.js
  agents/
    assistant.js
  store/
    app.js
```

---

## Examples

See the [`examples/`](./examples/) directory:

- **[Counter](./examples/counter/)** — Basic reactivity and events
- **[Todo](./examples/todo/)** — Lists, computed state, and components

---

## Inspiration

- [SolidJS](https://solidjs.com) — Fine-grained reactivity
- [ArrowJS](https://arrow.js.org) — Tagged template approach
- [AlpineJS](https://alpinejs.dev) — Minimal footprint
- [HTMX](https://htmx.org) — HTML-first philosophy
- Web Components — Platform standard
- QuickJS — Embeddable runtime
- MCP — Model Context Protocol

---

## Status

Rune is in **v0.1 (experimental)**.

The long-term goal is to provide an AI-native foundation for the agentic web.

---

## License

[MIT](./LICENSE)
