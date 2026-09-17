---
title: Styles
sidebar_position: 1
---

## Overview

A style stores any value under a `(context pattern, name)` pair. Consumers resolve a concrete context; there is no fixed style schema. These examples use illustrative `:example:` contexts, not built-in feature switches.

## In a draft

```powershell
Invoke-Loom {
    Style ':example:*' enabled $true
    Style ':example:git:*' enabled $false
}
```

## From the command line

```powershell
Set-Style ':example:*' enabled $true
Get-Style ':example:git' enabled -Default $false
Test-Style ':example:git' enabled
Get-StyleDefinition -Name enabled
$watcher = Register-StyleWatcher ':example:git' enabled {
    param($change)
    $global:lastStyleChange = $change
} -Replay
Set-Style ':example:git' enabled $false
Trace-Style -Last 10
$watcher | Unregister-StyleWatcher
Remove-Style ':example:git' enabled
```

## Rules

Context matching uses case-sensitive PowerShell wildcard syntax. The longest literal prefix wins; equal specificity goes to the latest definition. Per-name resolution caches store the winning definition for each concrete context and are invalidated by writes.

`Get-StyleDefinition` filters exact stored patterns; `Get-Style` resolves them. `Remove-Style` removes an exact stored pair. Null and empty values are valid definitions.

Concrete watchers run when their resolved value changes; `-Pattern` watchers observe matching writes, even if resolution does not change. `-Replay` gives a concrete watcher its current value, or a pattern watcher each matching stored definition. Watchers run after commit, isolate failures, and bound recursion; a failing watcher does not roll back the write. `Trace-Style` exposes failures and duration.

## Reference

[Style](../modules/psloom/reference.md#style), [Set-Style](../modules/psloom/reference.md#set-style), [Get-Style](../modules/psloom/reference.md#get-style), [Test-Style](../modules/psloom/reference.md#test-style), [Remove-Style](../modules/psloom/reference.md#remove-style), [Get-StyleDefinition](../modules/psloom/reference.md#get-styledefinition), [Register-StyleWatcher](../modules/psloom/reference.md#register-stylewatcher), [Unregister-StyleWatcher](../modules/psloom/reference.md#unregister-stylewatcher), [Trace-Style](../modules/psloom/reference.md#trace-style).
