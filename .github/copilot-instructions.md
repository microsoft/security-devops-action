# Copilot Instructions

## Build & Test

```bash
npm run build          # Gulp: clean → sideload → compile (src/ → lib/)
npm run buildAndTest   # Build + run tests
npm run buildTests     # Build including test compilation
npm test               # Run tests only (mocha **/*.tests.js)
npx mocha test/pre.tests.js  # Run a single test file
```

The `@microsoft/security-devops-actions-toolkit` package comes from GitHub Packages (configured in `.npmrc`). You need a GitHub token with `read:packages` scope to `npm install`.

## Architecture

This is a **GitHub Action** (node20) with a three-phase lifecycle defined in `action.yml`:

- **pre** (`pre.ts`) → runs `ContainerMapping.runPreJob()` — saves job start timestamp
- **main** (`main.ts`) → runs `MicrosoftSecurityDevOps.runMain()` — invokes the MSDO CLI with user-configured tools/categories/languages
- **post** (`post.ts`) → runs `ContainerMapping.runPostJob()` — collects Docker events/images since pre-job and reports to Defender for DevOps

Both `MicrosoftSecurityDevOps` and `ContainerMapping` implement the `IMicrosoftSecurityDevOps` interface. The factory function `getExecutor()` in `msdo-interface.ts` instantiates them. The `container-mapping` tool is special: it runs only in pre/post phases, not through the MSDO CLI. When it's the only tool specified, `main.ts` skips execution entirely.

The heavy lifting (CLI installation, execution, SARIF processing) lives in the `@microsoft/security-devops-actions-toolkit` package — this repo is the GitHub Action wrapper.

## Conventions

- **`lib/` is committed** — the official build workflow compiles TypeScript and commits the JS output to the branch. Don't add `lib/` to `.gitignore`.
- **Test files use `.tests.ts`** suffix (not `.test.ts`). Tests live in `test/` with a separate `tsconfig.json`. Compiled test JS is gitignored.
- **Testing stack**: Mocha + Sinon. Tests stub `@actions/core`, `@actions/exec`, and `https` to avoid real GitHub Action or network calls.
- **Sideloading**: Set `SECURITY_DEVOPS_ACTION_BUILD_SIDELOAD=true` to build and link a local clone of `security-devops-actions-toolkit` (expected as a sibling directory). This is handled in `gulpfile.js`.
