---
title: Sources, providers and cache
sidebar_position: 3
---

## Inline sources

An `Argument -Source` script receives four positional values: the word being completed, command path, already bound options, and positional arguments already typed. It can return strings or `System.Management.Automation.CompletionResult` objects. Other nonempty values are converted to strings; null/empty output is ignored.

The command path includes the root command and selected subcommands. Bound options are a set of encountered option **names**, not a dictionary of their values. Positional arguments belong to the active command; selecting a subcommand resets that list.

```powershell
New-Completer deploy {
    Argument environment -Source {
        param($word, $commandPath, $boundOptions, $positionalArguments)
        'dev'; 'staging'; 'production'
    }
} | Register-Completer
```

Reed filters the returned candidates for the current word. A throwing source completes nothing and is traced. Keep work small: synchronous sources run during Tab completion.

## Providers

```powershell
Register-CompletionProvider environments {
    param($word, $commandPath, $boundOptions, $positionalArguments)
    'dev'; 'staging'; 'production'
} -Description 'Deployment environments'
New-Completer deploy { Argument environment -Provider environments } | Register-Completer
Get-CompletionProvider
```

A slot accepts either `-Source` or `-Provider`. Provider names resolve at Tab time; missing providers give an empty result, so imported definitions remain usable when an optional provider is absent. Re-register with `-Force` to replace a provider; use `Unregister-CompletionProvider` to remove it. [Export](import-export.md) stores the name, not the provider's script.

## Cache keys

`-CacheKey` receives the same four arguments. The first nonempty string-convertible result is the key. An absent/empty key means the source runs again. Answers are cached by source identity and key for the session, with no time-to-live.

```powershell
New-Completer deploy {
    Argument environment -Provider environments -CacheKey { 'environment-list-v1' }
} | Register-Completer -Force
Clear-CompletionCache
Trace-Completion -Last 10
```

This constant key is appropriate only for the fixed provider above. A dynamic source must include every input that can change its answer in the key (for example current directory or repository state); include the word if the source prefilters by word. Reed caches unfiltered source answers, then applies its candidate filtering. Redeclaring a completer invalidates its old source entries. Clear the cache when the key was too coarse or external state changed without changing the key.

`-CacheKey` without a source/provider is invalid. Script-block keys are not portable; see [the reference](reference.md#export-completer).
