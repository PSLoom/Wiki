---
title: Staged application with Shed
sidebar_position: 4
---

## Overview

`Shed` changes when and under what conditions the next top-level statement applies. It is parsed by the draft analyzer, not exported as a command. Deferred work runs on the shell thread; it is not a background task.

## In a draft

```powershell
Invoke-Loom {
    Thread Reed
    Shed -Slot '0b' -RequiresCommand git -Lucid
    Sley git { Command status }

    Shed -Wait -LoadIf { $true } -AtLoad { $global:stagedReady = $true }
    Style ':example:*' enabled $true
}
```

| Modifier               | Meaning                                                                               |
| ---------------------- | ------------------------------------------------------------------------------------- |
| `-Wait`                | Queue at default slot `0a`.                                                           |
| `-Slot '1b'`           | Queue at the explicit numeric/letter slot.                                            |
| `-LoadIf { ... }`      | Check truth at application time; false means skipped.                                 |
| `-RequiresCommand git` | Require that literal command to exist when applying.                                  |
| `-Lucid`               | Suppress success output.                                                              |
| `-Silent`              | Suppress the queued failure summary warning at the prompt; errors remain inspectable. |
| `-AtLoad { ... }`      | Run after successful application.                                                     |
| `-OnDemand`            | Reserved: currently fails validation for all statements.                              |

Conditions/output modifiers without a timing modifier wrap an immediate statement. Conditions are checked at application time, not during initial capture.

## From the command line

```powershell
Get-Shed
Get-Shed -State Pending,Failed
Measure-Loom
```

There is no standalone staging cmdlet. Entries expose the original statement, location, slot, state, elapsed duration and errors. `Pending`, `Applied`, `Skipped`, `Failed` and `Superseded` describe current behavior; `Armed` is reserved for future on-demand support.

## Rules

`Shed` must precede exactly one statement at draft top level. It cannot be stacked, dangling or placed before `Thread`. Choose at most one of `-Wait`, `-Slot` and `-OnDemand`. Slots are literal digits followed by `a`, `b` or `c`, case-insensitively.

The queue orders `0a` before `0b`, then `0c`, then `1a`, with draft order breaking ties. `PrePrompt` and `Idle` drain 15 ms slices, always applying at least one statement; a single slow statement may exceed the slice. A missed command drains the entire queue before retrying lookup. Non-interactive hosts drain at draft end. No later slot jumps ahead of earlier work.

Set `$env:LOOM_INTERACTIVE = '1'` or `'0'` to override host detection. Otherwise ConsoleHost sessions are interactive unless explicitly non-interactive or executing a command/file without `-NoExit`; other hosts default to non-interactive.

Failures are recorded and warned once at a later prompt without throwing through the callback. Reweave can supersede pending work. Delayed arbitrary statements execute in global scope, so do not assume draft-local variables survive until application.

## Reference

[Shed modifiers](../modules/psloom/reference.md#shed), [Get-Shed](../modules/psloom/reference.md#get-shed), [Measure-Loom](../modules/psloom/reference.md#measure-loom).
