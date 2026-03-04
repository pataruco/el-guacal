# 2. Monorepo Management with Moon

## Status

Accepted

## Context

The project is structured as a monorepo containing a Rust backend (`apps/server`) and a React frontend (`apps/web`). Managing builds, tests, and dependencies across different environments and languages can become complex. We need a tool to orchestrate tasks, manage project dependencies, and ensure a consistent development experience across the entire stack.

## Decision

We have chosen [Moon](https://moonrepo.dev/) as our monorepo management tool and task runner. Moon provides a unified way to define and run tasks (like `build`, `test`, `lint`) across all projects in the monorepo, regardless of the language or framework used.

## Consequences

- Positive: Consistent task execution across different projects and languages.
- Positive: Optimised CI/CD pipelines through task caching and incremental builds.
- Positive: Explicit dependency management between projects in the monorepo.
- Negative: Requires developers to learn Moon's configuration and command-line interface.
