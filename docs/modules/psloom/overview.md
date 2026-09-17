---
title: PSLoom kernel
sidebar_position: 1
---

The kernel composes harnesses, owns the scoped verb registry and draft lifecycle, and supplies shared services through Warp. Harness implementation code references the contract, not kernel internals.

| Per-runspace store            | Responsibility                                                    |
| ----------------------------- | ----------------------------------------------------------------- |
| `StyleStore`                  | Definitions, per-name resolution caches, watchers.                |
| `HookBus`                     | Handler snapshots, wiring state, trace log.                       |
| `LoomSession`                 | Verbs, harnesses, active runs, timings, reweave ledger and sheds. |
| `TreadleCatalog`              | Shortcut definitions and change notifications.                    |
| `ReedSession` (owned by Reed) | Completers, providers, cache, wired names and completion trace.   |

State is keyed by runspace in weak tables. `LoomSession` is initialized lazily to keep module import inexpensive. Warp's `HarnessHost` lets a harness register and access its services without referencing the kernel assembly. Composition failure rolls back contributed verbs and published APIs.

Read the [reference](reference.md) for all 19 exported cmdlets and the draft vocabulary. Guides cover [styles](../../guides/styles.md), [hooks](../../guides/hooks.md), [treadles](../../guides/treadles.md), [sheds](../../guides/sheds.md) and [measurement](../../guides/measuring.md). The [architecture](../../architecture/overview.md) explains the execution and error channels.
