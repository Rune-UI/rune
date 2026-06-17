/**
 * Rune Core - Unit Tests
 *
 * Run: node --test tests/core.test.js
 */

import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";

import {
  signal,
  computed,
  effect,
  batch,
  untrack,
  onCleanup,
} from "../src/core/reactive.js";

describe("signal", () => {
  it("should create a signal with initial value", () => {
    const count = signal(0);
    assert.equal(count(), 0);
  });

  it("should set a new value", () => {
    const count = signal(0);
    count.set(5);
    assert.equal(count(), 5);
  });

  it("should update value via function", () => {
    const count = signal(10);
    count.update((v) => v + 5);
    assert.equal(count(), 15);
  });

  it("should peek without tracking", () => {
    const count = signal(42);
    assert.equal(count.peek(), 42);
  });

  it("should not notify if value is the same (Object.is)", () => {
    const count = signal(0);
    let runs = 0;
    effect(() => {
      count();
      runs++;
    });
    assert.equal(runs, 1);
    count.set(0); // Same value
    assert.equal(runs, 1);
  });

  it("should work with object values", () => {
    const user = signal({ name: "John" });
    assert.deepEqual(user(), { name: "John" });
    user.set({ name: "Jane" });
    assert.deepEqual(user(), { name: "Jane" });
  });

  it("should work with null and undefined", () => {
    const val = signal(null);
    assert.equal(val(), null);
    val.set(undefined);
    assert.equal(val(), undefined);
    val.set("hello");
    assert.equal(val(), "hello");
  });
});

describe("computed", () => {
  it("should derive value from signals", () => {
    const a = signal(2);
    const b = signal(3);
    const sum = computed(() => a() + b());
    assert.equal(sum(), 5);
  });

  it("should update when dependencies change", () => {
    const first = signal("John");
    const last = signal("Doe");
    const full = computed(() => `${first()} ${last()}`);

    assert.equal(full(), "John Doe");
    first.set("Jane");
    assert.equal(full(), "Jane Doe");
  });

  it("should chain computeds", () => {
    const a = signal(1);
    const b = computed(() => a() * 2);
    const c = computed(() => b() + 10);
    assert.equal(c(), 12);
    a.set(5);
    assert.equal(c(), 20);
  });

  it("should have peek", () => {
    const a = signal(10);
    const b = computed(() => a() * 2);
    assert.equal(b.peek(), 20);
  });
});

describe("effect", () => {
  it("should run immediately", () => {
    let ran = false;
    effect(() => {
      ran = true;
    });
    assert.equal(ran, true);
  });

  it("should re-run when dependency changes", () => {
    const count = signal(0);
    let observed = -1;
    effect(() => {
      observed = count();
    });
    assert.equal(observed, 0);
    count.set(42);
    assert.equal(observed, 42);
  });

  it("should track multiple dependencies", () => {
    const a = signal(1);
    const b = signal(2);
    let sum = 0;
    effect(() => {
      sum = a() + b();
    });
    assert.equal(sum, 3);
    a.set(10);
    assert.equal(sum, 12);
    b.set(20);
    assert.equal(sum, 30);
  });

  it("should return a dispose function", () => {
    const count = signal(0);
    let observed = 0;
    const dispose = effect(() => {
      observed = count();
    });
    assert.equal(observed, 0);
    count.set(5);
    assert.equal(observed, 5);

    dispose();
    count.set(100);
    assert.equal(observed, 5); // Should NOT update after dispose
  });

  it("should clean up old subscriptions on re-run", () => {
    const cond = signal(true);
    const a = signal("A");
    const b = signal("B");
    let result = "";

    effect(() => {
      result = cond() ? a() : b();
    });

    assert.equal(result, "A");
    cond.set(false);
    assert.equal(result, "B");

    // Now only `b` and `cond` should be tracked
    a.set("A2");
    assert.equal(result, "B"); // `a` change should NOT trigger
  });
});

describe("batch", () => {
  it("should batch multiple updates", () => {
    const a = signal(1);
    const b = signal(2);
    let runs = 0;

    effect(() => {
      a();
      b();
      runs++;
    });

    assert.equal(runs, 1);

    batch(() => {
      a.set(10);
      b.set(20);
    });

    assert.equal(runs, 2); // Only ONE additional run
  });
});

describe("untrack", () => {
  it("should read without creating dependency", () => {
    const a = signal(0);
    const b = signal(0);
    let runs = 0;

    effect(() => {
      a(); // tracked
      untrack(() => b()); // NOT tracked
      runs++;
    });

    assert.equal(runs, 1);
    b.set(10);
    assert.equal(runs, 1); // b change should NOT trigger
    a.set(10);
    assert.equal(runs, 2); // a change should trigger
  });
});

describe("onCleanup", () => {
  it("should run cleanup when effect re-runs", () => {
    const count = signal(0);
    let cleaned = 0;

    effect(() => {
      count();
      onCleanup(() => {
        cleaned++;
      });
    });

    assert.equal(cleaned, 0);
    count.set(1);
    assert.equal(cleaned, 1);
    count.set(2);
    assert.equal(cleaned, 2);
  });
});

describe("store integration", async () => {
  const { store } = await import("../src/store/index.js");

  it("should create reactive store", () => {
    const app = store({ theme: "dark", count: 0 });
    assert.equal(app.theme(), "dark");
    assert.equal(app.count(), 0);
  });

  it("should update store properties", () => {
    const app = store({ theme: "dark" });
    app.theme.set("light");
    assert.equal(app.theme(), "light");
  });

  it("should reset to initial values", () => {
    const app = store({ a: 1, b: 2 });
    app.a.set(100);
    app.b.set(200);
    app.$reset();
    assert.equal(app.a(), 1);
    assert.equal(app.b(), 2);
  });

  it("should patch multiple values", () => {
    const app = store({ x: 0, y: 0 });
    app.$patch({ x: 10, y: 20 });
    assert.equal(app.x(), 10);
    assert.equal(app.y(), 20);
  });

  it("should snapshot current values", () => {
    const app = store({ name: "Rune", version: 1 });
    const snap = app.$snapshot();
    assert.deepEqual(snap, { name: "Rune", version: 1 });
  });
});
