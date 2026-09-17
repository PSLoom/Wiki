---
title: Installation
sidebar_position: 1
---

Use **PowerShell 7.6 or later** (`pwsh`), on Windows, Linux or macOS. Both manifests declare `CompatiblePSEditions = @('Core')`; Windows PowerShell 5.1 is not supported.

```powershell
Install-PSResource PSLoom -Scope CurrentUser
Import-Module PSLoom
```

:::note Gallery release pending
These are the intended installation commands after publication. The repository split does not publish to PowerShell Gallery. For now, use the [source build](../contributing/development-setup.md) and its `artifacts/modules` layout.
:::

`Thread Reed` asks the kernel to import `PSLoom.Reed` before executing your draft. If missing, a normal run installs it from PSGallery for the current user under a cross-session lock. Validation with `Invoke-Loom -Validate` never installs. Installed harnesses are **never updated implicitly**:

```powershell
Update-Harness Reed -WhatIf
Update-Harness Reed
```

Updates take effect in the next PowerShell session. `FirstPartyHarnesses.Names` contains `Reed`, `Colorway`, `Weft` and `Shuttle`; allowlisting is not a claim that all four have been implemented or published.

## Storage

Set `$env:LOOM_HOME` before importing/using PSLoom to override the Creel storage root. Otherwise it uses `%LOCALAPPDATA%\Loom` on Windows, `$XDG_DATA_HOME/loom` on Unix when set, or `~/.local/share/loom`. The kernel owns `kernel/`; each harness owns `harnesses/<Name>/`.

Continue with [your first draft](first-draft.md).
