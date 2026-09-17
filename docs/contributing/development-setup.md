---
title: Development setup
sidebar_position: 2
---

## Prerequisites

Use .NET SDK **10.0.400**, with `rollForward: latestFeature` as declared by the code repositories' `global.json`; PowerShell **7.6+**; and Git. The test runner is Microsoft.Testing.Platform. The wiki additionally uses **Node 24** and **pnpm 11.18.0**, pinned by `.nvmrc` and `packageManager`.

The independent checkouts are `PSLoom`, `Reed` and `wiki`. Run commands from the repository named in each section. Code repositories keep READMEs; long-form documentation belongs here.

Once the repositories are published and you have access, clone the code from **develop** and the wiki from **main**:

```powershell
git clone --branch develop https://github.com/PSLoom/PSLoom.git
git clone --branch develop https://github.com/PSLoom/Reed.git
git clone --branch main https://github.com/PSLoom/wiki.git
```

The code repositories preserve `main` at their initial commit during migration; migration changes live only on `develop`. `main` remains their eventual default branch. Use the prepared local checkouts before publication.

## Kernel

The kernel's `nuget.config` contains **nuget.org only**. It builds `PSLoom.Build` from source and does not need GitHub Packages credentials for local development.

```powershell
dotnet build PSLoom.slnx -c Release
dotnet test --solution PSLoom.slnx -c Release --no-build
pwsh -NoProfile -File ./benchmarks/Measure-Startup.ps1
pwsh -NoProfile -File ./benchmarks/Measure-Startup.ps1 -DraftPath ./benchmarks/drafts/typical.ps1 -AllowHarness Fixture
dotnet run -c Release --project benchmarks/PSLoom.Benchmarks -- --filter '*StyleResolve*' '*HookDispatch*' --exporters json --job short
pwsh -NoProfile -File ./benchmarks/Assert-Budgets.ps1
```

The kernel owns Fixture startup drafts and hook/style benchmarks. Build first so the module layout exists. To import a source-built module in a fresh session:

```powershell
$moduleRoot = (Resolve-Path ./artifacts/modules).Path
$env:PSModulePath = $moduleRoot + [IO.Path]::PathSeparator + $env:PSModulePath
Import-Module PSLoom
```

## Token-free local SDK loop

In the kernel checkout:

```powershell
pwsh -NoProfile -File ./build/Pack-Local.ps1
```

The script packs and checks `PSLoom.Warp`, `PSLoom.Build`, `PSLoom.TestKit` and `PSLoom`, with one version `0.0.0-local.<yyyyMMddHHmmss>`, into `~/.psloom/packages`. It prints the version last. Use a fresh version each time; NuGet caches packages by version.

In Reed, replace the example timestamp with the printed version:

```powershell
$sdkVersion = '0.0.0-local.20260916120000'
dotnet build PSLoom.Reed.slnx -c Release "-p:PSLoomVersion=$sdkVersion"
dotnet test --solution PSLoom.Reed.slnx -c Release --no-build "-p:PSLoomVersion=$sdkVersion"
```

For a `0.0.0-local.*` command-line version, Reed conditionally selects `nuget.local.config` through `RestoreConfigFile`, clears source mappings, and sets `RestoreSources` to the local package directory plus nuget.org. It **does not contact the private feed and needs no token**. For a custom package directory, pass `-Output` to `Pack-Local.ps1` and the matching `-p:PSLoomLocalPackageSource=<absolute-directory>` to Reed's build/test commands.

Integration projects set `RequiresKernelModule` and restore the kernel's published module layout into Reed's own `artifacts/modules`. Do not copy Warp next to Reed manually.

## Released SDK packages

Reed defaults to `PSLoomVersion = 0.1.0-alpha.1`. Released versions come from `https://nuget.pkg.github.com/PSLoom/index.json`, alongside public dependencies from nuget.org. This path requires a GitHub personal access token (classic) with `read:packages` and access to the private packages. Follow [GitHub's NuGet registry authentication instructions](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-nuget-registry).

Normal `nuget.config` uses source mapping: `PSLoom` and `PSLoom.*` select the private `psloom` source, while `*` selects nuget.org for other packages. This keeps central package management unambiguous and avoids `NU1507`. Local restore uses the separate mapping-free configuration described above.

Set `GITHUB_PACKAGES_TOKEN` in your environment; `nuget.config` reads it without embedding a token in the repository. For example, prompt without writing the token into shell history:

```powershell
$env:GITHUB_PACKAGES_TOKEN = Read-Host 'GitHub Packages token' -MaskInput
dotnet build PSLoom.Reed.slnx -c Release
dotnet test --solution PSLoom.Reed.slnx -c Release --no-build
```

The initial package release must exist before this default restore can succeed. CI uses `secrets.GITHUB_TOKEN` with `packages: read`; the package settings must grant Reed Actions access to all four packages.

## Reed budgets

After building the whole Reed solution:

```powershell
pwsh -NoProfile -File ./benchmarks/Measure-Startup.ps1 -DraftPath ./benchmarks/drafts/typical.ps1
dotnet run -c Release --project benchmarks/PSLoom.Reed.Benchmarks -- --filter '*CompletionBenchmarks*' --exporters json --job short
pwsh -NoProfile -File ./benchmarks/Assert-Budgets.ps1
```

When testing a local SDK, add the same `-p:PSLoomVersion` to `dotnet run` **before** `--`. `--job short` is for a quick local budget check; CI runs the prescribed benchmark jobs. Reed owns the typical draft startup budget and three completion budgets. Its process tests enforce that only the kernel's Warp assembly is loaded.

## Wiki

```powershell
pnpm install --frozen-lockfile
pnpm start
pnpm typecheck
pnpm build
```

The production build checks relative Markdown links and generated site links and builds the local search index. See [repositories and release flow](repositories.md) and [harness authoring](harness-authoring.md).
