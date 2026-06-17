# Contributing to Rune

Thank you for your interest in Rune.

## Philosophy

Before contributing, please read:

- [SPEC.md](./SPEC.md) — Framework specification
- [Rune.md](./Rune.md) — AI agent skill document

Rune values simplicity. Every API should be justifiable. Every line should be readable by both humans and small language models.

## Development

```bash
# Clone
git clone https://github.com/user/rune-ui.git
cd rune-ui

# Run tests
node --test tests/

# Build distributions
node scripts/build.js

# Serve examples locally
npx serve . -l 3000
# Then visit http://localhost:3000/examples/counter/
```

## Guidelines

1. **No external dependencies** — Rune has zero runtime dependencies.
2. **No build step** — Source files are valid ES Modules. No transpilation.
3. **Small API surface** — Every new export must be carefully considered.
4. **Platform APIs** — Use DOM, Fetch, ES Modules. No custom abstractions when the platform has a solution.
5. **AI-readable** — Code should be understandable by a small language model (~4B parameters).

## Code Style

- Functions over classes
- Template literals over JSX
- Signals over hooks
- Named exports
- JSDoc comments for all public APIs

## Testing

Tests use the Node.js built-in test runner. No test framework dependencies.

```bash
node --test tests/core.test.js
```

## Pull Requests

1. Fork the repository
2. Create a feature branch
3. Write tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## License

MIT
