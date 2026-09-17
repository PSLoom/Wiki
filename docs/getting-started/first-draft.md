---
title: Your first draft
sidebar_position: 2
---

With both modules installed, put this in your PowerShell profile:

```powershell
Import-Module PSLoom
Invoke-Loom -Draft {
    Thread Reed
    Style ':completion:*' enabled $true
    Treadle glog { git log --oneline }
    Sley git {
        Command log {
            Option '--oneline' -Description 'Show one line per commit'
            Option '--max-count' -Alias '-n' { Argument count }
        }
        Command status
    }
}
```

`Thread` provisions Reed before execution. `Style` stores a context-pattern value (styles only affect a feature when that feature reads them). `Treadle` defines a global shortcut that appends your arguments. `Sley` registers completion for `git`, including the baked `git log --oneline` context of `glog`.

`Thread` must be a top-level statement with a literal name, and a literal `-Version` if supplied. Do not hide it in a loop, condition or nested block.

## Validate and measure

```powershell
Invoke-Loom -Validate -Draft {
    Thread Reed
    Sley git { Command status }
}
Measure-Loom
Measure-Loom -GroupBy Verb
```

Validation imports installed harnesses and checks scopes without executing the draft or installing missing modules. `Measure-Loom` reads the **last executed draft**; it does not run a benchmark or execute its own draft.

A second ordinary `Invoke-Loom` is a no-op. Use `Invoke-Loom -Reweave -Draft { ... }` with the full edited draft to skip unchanged verbs, replay changed ones and revert removed supported verbs. Arbitrary PowerShell statements run again. See [the pipeline](../architecture/overview.md) and [staged application](../guides/sheds.md).
