---
title: Measuring a draft
sidebar_position: 5
---

## Overview

`Measure-Loom` inspects recorded timings from the most recent executed draft in the current runspace. It warns if there has been no draft; it does not execute one itself.

## In a draft

There is no measurement verb. Run a draft, then inspect its timings:

```powershell
Invoke-Loom {
    Thread Reed
    Sley git { Command status }
}
Measure-Loom
```

## From the command line

```powershell
Measure-Loom | Format-Table Phase,Name,Harness,Line,Depth,Inclusive,Exclusive,Count
Measure-Loom -GroupBy Harness
Measure-Loom -GroupBy Verb
Get-Shed -State Failed
```

## Rules

Rows cover prepass, imports per harness, validation, verbs and total execution, together with staged application under `Deferred`. `Inclusive` includes nested verbs; `Exclusive` subtracts their time. `Line` and `Depth` identify an invocation; grouped rows use `Count`. Grouping aggregates **verb rows only**, ordered by exclusive duration, so use ungrouped output for imports and staged work. Do not sum nested inclusive rows as a wall-clock total.

The exact `Phase` values are `Prepass`, `Import`, `Install` (missing harnesses on first runs), `Validate`, `Verb`, `Capture` (staging/rewrite), `Deferred` and `Total`.

The steady-state budgets, with harnesses already installed, are kernel import under 50 ms and a typical Reed draft under 150 ms over import. CI uses median measurements with a 1.2 noise tolerance. First-call import/type initialization and gallery downloads should not be confused with a cached style lookup or Tab benchmark. Deferred work remains real startup work even when it runs after the initial total row.

See [development setup](../contributing/development-setup.md) for the independent startup and BenchmarkDotNet budget checks.

## Reference

[Measure-Loom](../modules/psloom/reference.md#measure-loom), [Invoke-Loom](../modules/psloom/reference.md#invoke-loom), [Get-Shed](../modules/psloom/reference.md#get-shed).
