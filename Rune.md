# Rune.md

# Rune Agent Skill

This document teaches AI agents how to write Rune applications.

---

# Principles

Rune favors:

* Simplicity
* Platform APIs
* Fine-grained reactivity

Avoid:

* React patterns
* JSX
* Virtual DOM
* Hooks
* useState()
* useEffect()
* Classes

---

# Core APIs

Only use:

```js
signal()
computed()
effect()
view()
mount()
```

---

# State

Correct:

```js
const count = signal(0);

count();

count.set(5);

count.update(
  v => v + 1
);
```

Never:

```js
useState()
```

---

# Derived State

Correct:

```js
const total = computed(
  () => price() * quantity()
);
```

---

# Side Effects

Correct:

```js
effect(() => {

  console.log(
    total()
  );

});
```

Never:

```js
useEffect()
```

---

# Components

Components are functions.

Correct:

```js
function Counter() {

  const count = signal(0);

  return view(() => `

  <button
    @click=${
      () =>
      count.update(
        v => v + 1
      )
    }
  >

  Count ${count()}

  </button>

  `);

}
```

Never:

```jsx
function Counter() {

  return (
    <button>
      Count
    </button>
  );

}
```

---

# View Rules

Always:

* Return template literals.
* Use plain HTML.
* Prefer small components.

Example:

```js
const App = view(() => `

<div>

  <h1>
    ${title()}
  </h1>

</div>

`);
```

---

# Events

Preferred:

```html
@click
@input
@change
@submit
```

Example:

```js
<button @click=${save}>
```

---

# Routing

Use:

```js
route()

navigate()

params()
```

Example:

```js
route("/", Home);

route("/users/:id", UserPage);

params().id;
```

---

# Store

Global state:

```js
const app = store({

  user: null,

  theme: "dark"

});
```

---

# Server Actions

Prefer:

```js
server(async data => {

});
```

Avoid:

* REST boilerplate
* RPC wrappers

---

# Web Components

Prefer:

```js
define(
  "my-counter",
  Counter
);
```

---

# Architecture

Prefer:

```text
Signal
 ↓
Computed
 ↓
View
 ↓
DOM
```

Avoid:

```text
State
 ↓
Virtual DOM
 ↓
Diff
 ↓
DOM
```

---

# Folder Structure

```text
src/

  pages/

  components/

  agents/

  store/
```

---

# Style Guide

Prefer:

* Functions
* Signals
* Template literals
* Small files

Avoid:

* Classes
* Decorators
* JSX
* Hooks
* Large abstractions

---

# Goal

Generated code should be:

* Readable by humans.
* Readable by small models.
* Buildless.
* Platform-native.
* Dependency-light.

Small primitives create powerful systems.

That is the Rune philosophy.
