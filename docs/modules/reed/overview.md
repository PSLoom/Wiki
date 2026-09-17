---
title: Reed
sidebar_position: 1
---

Reed provides declarative argument completion for native commands. It depends on the PSLoom kernel and uses its Warp contract, scopes and treadle catalog.

```powershell
Import-Module PSLoom
Invoke-Loom {
    Thread Reed
    Sley git -Description 'Version control' {
        OptionGroup common { Option '--help' -Alias '-h' }
        Use OptionGroup common
        Command status -Description 'Show working tree status' {
            Option '--short' -Alias '-s'
        }
        Command log {
            Use OptionGroup common
            Option '--oneline'
            Option '--max-count' -Alias '-n' { Argument count }
        }
        Command switch {
            Argument branch -Source { 'main'; 'develop' }
        }
    }
}
TabExpansion2 'git st' 6
```

`Sley` builds a model, validates it and compiles lookup tables. Reed registers each command name once with `Register-ArgumentCompleter -Native`. PowerShell's `TabExpansion2` calls a shared bridge which classifies tokens, resolves the active subcommand/value slot, then produces candidates. `Treadle` shortcuts inherit their target's completion with baked arguments prepended.

Registration errors block that completer, while the rest of a draft can continue. Completion failures return no candidates and are recorded by `Trace-Completion`; the bridge never throws into a Tab press. The medium-completer Tab budget is under 5 ms.

Read [the DSL](sley-dsl.md), [sources and cache](sources-providers-cache.md), [JSON portability](import-export.md), and [the full reference](reference.md).
