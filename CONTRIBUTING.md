# Contributing to Rune

Thank you for your interest in Rune.

## Philosophy

Before contributing, please read:

- [README.md](./README.md) — Framework specification
- [Rune.md](./Rune.md) — AI agent skill document

Rune values simplicity. Every API should be justifiable. Every line should be readable by both humans and small language models.

## Development

```bash
# Clone
git clone https://github.com/Rune-UI/rune.git
cd rune

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

## Publishing

Rune is published to npm as `rune-ui`. Because npm requires two-factor authentication (2FA) for publishing, standard automated publishing with classic tokens will fail.

### Local Publishing (Manual)

If you are publishing manually:
1. Ensure your npm account has 2FA enabled.
2. Build the distributions:
   ```bash
   node scripts/build.js
   ```
3. Run the publish command and provide the OTP code when prompted:
   ```bash
   npm publish --otp=YOUR_OTP_CODE
   ```

### CI/CD Publishing (Automated)

We use a GitHub Actions workflow to automate package publishing using one of the following methods:

#### Method A: Trusted Publishing (Recommended)
This uses OpenID Connect (OIDC) to authenticate GitHub Actions directly with npm without managing static secrets:
1. Go to your package settings on **npmjs.com** -> **Publishing** -> **Trusted Publishers**.
2. Click **Add Provider** -> **GitHub**.
3. Configure:
   - **GitHub Organization/User**: `Rune-UI` (or your fork's owner)
   - **Repository**: `rune`
   - **Workflow Name**: `publish.yml`
4. The workflow in `.github/workflows/publish.yml` is configured with `permissions: id-token: write` and automatically publishes to npm using `--provenance` once a release is published on GitHub.

#### Method B: Granular Access Token
If you prefer using tokens instead of Trusted Publishing:
1. Go to npmjs.com -> **Access Tokens** -> **Generate New Token** -> **Granular Access Token**.
2. Select package permissions: **Read and write** for `rune-ui`.
3. In settings, make sure to set the **Require two-factor authentication (2FA)** option to **No (Bypass 2FA)**.
4. Save the token as a GitHub Repository Secret named `NPM_TOKEN`.

## License

MIT
