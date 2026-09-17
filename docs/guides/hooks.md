---
title: Hooks
sidebar_position: 2
---

## Overview

Hooks run scripts at shell lifecycle events. A handler receives an invocation as `$_` and its first positional argument.

| Kind             | Trigger                                                                   |
| ---------------- | ------------------------------------------------------------------------- |
| DirectoryChanged | Working directory changes.                                                |
| PrePrompt        | Before rendering the prompt.                                              |
| PreExecute       | PSReadLine accepts a command line, when its required option is available. |
| CommandNotFound  | Command lookup misses.                                                    |
| Idle             | PowerShell's idle event.                                                  |
| SessionStarting  | Initial draft completes.                                                  |
| SessionExiting   | Engine exits.                                                             |

## In a draft

There is no `Hook` draft verb. Use the ordinary cmdlet inside the draft:

```powershell
Invoke-Loom {
    Register-Hook SessionStarting { $global:profileReady = $true } -Name ready
}
```

## From the command line

```powershell
$hook = Register-Hook DirectoryChanged {
    param($invocation)
    $global:lastDirectoryChange = $invocation
} -Name directory
Get-Hook DirectoryChanged
Trace-Hook -Last 10
$hook | Unregister-Hook
```

## Rules

Handlers run from an immutable registration snapshot. Reusing a kind/name replaces that registration; an unnamed registration gets its own identifier. Removing it does not unwind prompt, location or event wiring. Engine-facing bridges never throw handler failures into PowerShell; inspect `Trace-Hook`. Startup-handler failures can also be reported through the draft error channel.

`SessionStarting` belongs to the first completed weave, not module import. Kernel import subscribes `SessionExiting` using the engine event's actual source identifier. At exit the runspace is closing and cannot auto-load modules: use .NET or cmdlets already loaded in that session.

`PreExecute` probes for the PSReadLine `LineAcceptedHandler` parameter. Missing capability produces a warning and no handler wiring, rather than a parameter-binding exception. `KeystrokeTick` is deferred and is not a public hook kind.

## Reference

[Register-Hook](../modules/psloom/reference.md#register-hook), [Unregister-Hook](../modules/psloom/reference.md#unregister-hook), [Get-Hook](../modules/psloom/reference.md#get-hook), [Trace-Hook](../modules/psloom/reference.md#trace-hook).
