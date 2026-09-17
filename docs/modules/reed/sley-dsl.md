---
title: The Sley DSL
sidebar_position: 2
---

A `Sley` body describes a native command's syntax. Quote option spellings (`'--help'`, `'-h'`) so PowerShell passes them as names rather than binding them as verb parameters.

| Verb                                    | Valid scopes                                   | Parameters                                           | Body scope       |
| --------------------------------------- | ---------------------------------------------- | ---------------------------------------------------- | ---------------- |
| [Sley](reference.md#sley)               | DraftScope                                     | `Name`, `Alias`, `Description`, mandatory `Body`     | CompleterScope   |
| [Command](reference.md#command)         | CompleterScope, CommandScope                   | `Name`, `Alias`, `Description`, optional `Body`      | CommandScope     |
| [Option](reference.md#option)           | CompleterScope, CommandScope, OptionGroupScope | `Name`, `Alias`, `Description`, optional `Body`      | OptionScope      |
| [OptionGroup](reference.md#optiongroup) | CompleterScope                                 | `Name`, mandatory `Body`                             | OptionGroupScope |
| [Use](reference.md#use)                 | CompleterScope, CommandScope                   | `Kind` (`OptionGroup`), `Name`                       | None             |
| [Argument](reference.md#argument)       | CompleterScope, CommandScope, OptionScope      | `Name`, `Variadic`, `Source`, `Provider`, `CacheKey` | None             |

The reference gives exact types, positions and mandatory flags for every parameter.

```powershell
Invoke-Loom {
    Thread Reed
    Sley tool -Alias tool.exe -Description 'Example native tool' {
        OptionGroup common {
            Option '--verbose' -Alias '-v'
            Option '--format' { Argument format -Source { 'json'; 'text' } }
        }
        Use OptionGroup common
        Command files {
            Use OptionGroup common
            Argument path -Variadic
        }
    }
}
```

`Command` nests to any depth. An `Option` without a value is a switch; one with `Argument` takes one value. `Argument` at command level adds a positional slot; a variadic slot consumes the remaining positions and must come last. The declaration validator checks duplicate names/aliases and malformed trees; errors prevent registration, warnings remain visible.

`OptionGroup` alone contributes no candidates. Declare it before `Use OptionGroup name`; use copies its options immediately into the target command. There is no implicit inheritance from parent command declarations.

Outside a draft, `New-Completer` accepts the same body as `Sley` and returns a definition:

```powershell
Import-Module PSLoom.Reed
$definition = New-Completer tool { Command files { Argument path -Variadic } }
$definition | Test-Completer
$definition | Register-Completer
```

Source scripts are ordinary scripts executed later, not DSL scope bodies. See [sources, providers and cache](sources-providers-cache.md).
