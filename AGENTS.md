# AGENTS.md

Orientation for coding agents working in this repository. Read this before
changing anything.

## What this repository is — and is not

**whisp-app** serves the Whisp web application: the user interface, the HTTP
API, the job workers, and the database and deployment behind them.

Two things Whisp users routinely ask about live elsewhere, and are not yours to
change from here:

| Concern | Where it actually lives |
|---|---|
| Earth Engine datasets, risk indicators, the analysis itself | `openforis-whisp`, a separate Python library (version pinned in `api/pyproject.toml`) |
| The map viewer at whisp.earthmap.org | A separate Earth Map application |

This repository owns the *button* that opens the map viewer, not the viewer.
It calls the analysis library, it does not implement the analysis.

When a problem traces to either of them, say so and stop. That is a complete
answer, not a failure to fix something.

## Layout

- `app/` — Next.js user interface (TypeScript, npm)
- `api/` — FastAPI service and Celery workers (Python ≥ 3.11, uv)
- `db/` — PostgreSQL migrations, applied by a Node script
- `infra/` — GKE manifests, GCP setup, monitoring
- `tests/` — Playwright end-to-end tests
- `docs/` — project documentation
- `.github/workflows/` — CI, deployment, and forum automation

The three deployed images are `app`, `api`, and `db-migrate`.

## Verifying a change

Run the check that covers what you touched. Do not skip it because the change
looks trivial.

```
cd app && npx tsc --noEmit     # type check
cd app && npm run lint         # eslint
cd app && npm run build        # production build
npx playwright test            # end-to-end; needs a reachable database
```

`api/` has no automated test suite. If you change Python, read the surrounding
code carefully and say plainly that you could not verify it by running
anything — do not imply a check you did not perform.

## Constraints

- Do not edit `.github/workflows/` unless that is the task you were given.
- Do not touch `infra/`, credentials, or anything holding a secret.
  `api/credentials.json` is a local service-account file: never read it, print
  it, or commit it.
- Do not change public API shapes, the database schema, or authentication as a
  side effect of some other fix. Each of those is its own decision, and needs
  to be raised rather than slipped in.
- Prefer the smallest change that resolves the issue. If the fix you believe
  in is large, describe it and stop rather than applying it uninvited.

## Conventions

- Comments record *why*, not *what*. A comment that restates the line beneath
  it should be deleted; one that captures a constraint, a gotcha, or the
  reason behind a non-obvious choice should stay. When an explanation belongs
  in a user-visible field — a CLI description, a workflow input description —
  put it there instead of duplicating it in a comment above.
- Match the idiom, naming, and comment density of the surrounding code rather
  than importing conventions from elsewhere.
- Report outcomes honestly. If a check fails, say so and show the output; if
  you skipped a step, say which.
