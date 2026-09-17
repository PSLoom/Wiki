---
title: Treadles
sidebar_position: 3
---

## Overview

A treadle is a global command shortcut with constant arguments baked in. `glog -n 3` below invokes `git log --oneline -n 3`.

## In a draft

```powershell
Invoke-Loom {
    Thread Reed
    Treadle glog { git log --oneline }
    Sley git {
        Command log {
            Option '--oneline'
            Option '--max-count' -Alias '-n' { Argument count }
        }
    }
}
```

## From the command line

```powershell
New-Treadle glog { git log --oneline } -PassThru
Get-Treadle 'g*'
Remove-Treadle glog
```

## Rules

The body is parsed once as a single command with constant arguments. It is not executed at declaration and captures no variables. Pipelines, computed arguments and multi-statement bodies are rejected. Names accept letters, digits, hyphen, underscore and dot, without spaces or wildcards.

Functions, aliases and cmdlets are checked for collisions without command discovery. `New-Treadle -Force` can replace a collision; the draft verb has no force parameter. Removal leaves an unrelated same-named command alone.

Reed observes the treadle catalog and prepends baked tokens before resolving completion. `glog` therefore completes from the `git log --oneline` context without a separate completer. The underlying command still needs a registered Reed completer.

## Reference

[Treadle](../modules/psloom/reference.md#treadle), [New-Treadle](../modules/psloom/reference.md#new-treadle), [Get-Treadle](../modules/psloom/reference.md#get-treadle), [Remove-Treadle](../modules/psloom/reference.md#remove-treadle).
