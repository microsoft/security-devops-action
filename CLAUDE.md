# CLAUDE.md - Development Guidelines

## Core Principles (Karpathy-style)

### 1. Think Before Coding
State assumptions explicitly. If uncertain, ask. Surface confusion rather than proceeding with silent interpretations.

### 2. Simplicity First
Minimum code that solves the problem. Nothing speculative. No unrequested features, premature abstractions, or unnecessary error handling.

### 3. Surgical Changes
Touch only what you must. Clean up only your own mess. Preserve existing style. Don't refactor unrelated code.

### 4. Goal-Driven Execution
Define success criteria. Loop until verified. Transform requirements into testable goals with clear verification steps.

## Project Conventions
- Task under PBI == PR (each ADO task maps to exactly one pull request)
- ADO org: https://dev.azure.com/msazure, project: One
- Area path: One\Rome\ShiftLeft\DevSec\CodeSec
- Build: `npm run build` (uses gulp)
- Test: `npm test`
- TypeScript compiles to `lib/` directory
