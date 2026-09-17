---
title: Writing a harness
sidebar_position: 1
---

A harness is a PowerShell binary module that adds a vocabulary and cmdlets on top of the PSLoom kernel. It compiles
against **Warp**, the contract assembly, and never against the kernel itself. Reed, the completion harness, is the
worked example throughout: every snippet here has a real counterpart under `src/PSLoom.Reed`.

`Thread <Name>` in a draft only loads first-party harnesses. A third-party harness is loaded with the user's own
`Import-Module`, which registers it with the kernel the same way.

## 1. The package-based project

Use [PSLoom/Reed](https://github.com/PSLoom/Reed) as the working example. The following XML excerpts preserve its package names, properties and reference metadata; test framework and package metadata sections are omitted for clarity.

Enable central package management and define the repository root in `Directory.Build.props`:

```xml
<Project>
  <PropertyGroup>
    <Nullable>enable</Nullable>
    <ImplicitUsings>enable</ImplicitUsings>
    <LangVersion>latest</LangVersion>
    <ManagePackageVersionsCentrally>true</ManagePackageVersionsCentrally>
    <RepositoryRoot>$(MSBuildThisFileDirectory)</RepositoryRoot>
  </PropertyGroup>
  <ItemGroup>
    <InternalsVisibleTo Include="$(AssemblyName).Tests" />
  </ItemGroup>
  <PropertyGroup Condition="'$(PSLoomVersion)' != '' and $(PSLoomVersion.StartsWith('0.0.0-local.'))">
    <RestoreConfigFile>$(RepositoryRoot)nuget.local.config</RestoreConfigFile>
    <PSLoomLocalPackageSource Condition="'$(PSLoomLocalPackageSource)' == ''">$([System.IO.Path]::Combine($([System.Environment]::GetFolderPath(SpecialFolder.UserProfile)), '.psloom', 'packages'))</PSLoomLocalPackageSource>
    <RestoreSources>$(PSLoomLocalPackageSource);https://api.nuget.org/v3/index.json</RestoreSources>
  </PropertyGroup>
</Project>
```

Pin the four SDK packages together in `Directory.Packages.props`. `PSLoom.Build` is a global package reference, so its build infrastructure reaches every project without shipping as a module dependency:

```xml
<Project>
  <PropertyGroup>
    <PSLoomVersion Condition="'$(PSLoomVersion)' == ''">0.1.0-alpha.1</PSLoomVersion>
  </PropertyGroup>
  <ItemGroup>
    <PackageVersion Include="PSLoom" Version="$(PSLoomVersion)" />
    <PackageVersion Include="PSLoom.TestKit" Version="$(PSLoomVersion)" />
    <PackageVersion Include="PSLoom.Warp" Version="$(PSLoomVersion)" />
    <GlobalPackageReference Include="PSLoom.Build" Version="$(PSLoomVersion)" />
    <PackageVersion Include="System.Management.Automation" Version="7.6.4" />
    <PackageVersion Include="Microsoft.PowerShell.SDK" Version="7.6.4" />
  </ItemGroup>
</Project>
```

The harness project compiles against Warp and PowerShell but excludes their runtime assets:

```xml
<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <TargetFramework>net10.0</TargetFramework>
    <VersionTagPrefix>reed</VersionTagPrefix>
    <PowerShellManifest>PSLoom.Reed.psd1</PowerShellManifest>
  </PropertyGroup>
  <ItemGroup>
    <Using Include="System.Management.Automation" />
    <PackageReference Include="System.Management.Automation" PrivateAssets="all" ExcludeAssets="runtime" />
    <PackageReference Include="PSLoom.Warp" PrivateAssets="all" ExcludeAssets="runtime" />
  </ItemGroup>
</Project>
```

`VersionTagPrefix` is `reed`, not `reed/v`: the build target constructs the tag pattern. `GeneratePowerShellManifest` replaces the manifest's `$version$` token and `PublishModule` produces `artifacts/modules/PSLoom.Reed/<version>/`. A harness must not ship `Warp.dll`; its manifest requires the kernel, which supplies the sole runtime copy. Copy Reed's full `PSLoom.Reed.psd1` when adapting the project, and keep `CmdletsToExport` synchronized with the actual cmdlets.

Hosted test projects reference the kernel package at runtime and the shared test kit:

```xml
<ItemGroup>
  <ProjectReference Include="..\..\src\PSLoom.Reed\PSLoom.Reed.csproj" />
  <PackageReference Include="PSLoom" />
  <PackageReference Include="PSLoom.TestKit" />
</ItemGroup>
```

Process integration projects need a module directory rather than an assembly reference:

```xml
<PropertyGroup>
  <RequiresKernelModule>true</RequiresKernelModule>
</PropertyGroup>
<ItemGroup>
  <PackageReference Include="PSLoom" GeneratePathProperty="true" ExcludeAssets="all" />
  <ProjectReference Include="..\..\src\PSLoom.Reed\PSLoom.Reed.csproj" ReferenceOutputAssembly="false" />
  <PackageReference Include="PSLoom.TestKit" />
</ItemGroup>
```

`GeneratePathProperty` exposes `PkgPSLoom`. `RestoreKernelModule` copies the package's module layout into `artifacts/modules/PSLoom/<version>/` before tests/build consumers need it. The fixture and harness module are built from their own project references. `RepositoryLayout` finds the nearest ancestor containing a `*.slnx` solution, so a harness does not need a solution named `PSLoom.slnx`.

Follow [development setup](development-setup.md) for authenticated release restores or the token-free local package loop. The kernel itself imports `PSLoom.Build` from source and restores only from nuget.org.

Reed's normal `nuget.config` maps `PSLoom` and `PSLoom.*` to `psloom` (GitHub Packages), with `*` mapped to `nuget.org`. The more specific patterns select the private feed for SDK packages and avoid the central-package-management multiple-source warning. Local versions select a separate `nuget.local.config` through `RestoreConfigFile`, clearing source mappings so the local `RestoreSources` override remains usable:

```xml
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <packageSources>
    <clear />
    <add key="nuget.org" value="https://api.nuget.org/v3/index.json" protocolVersion="3" />
  </packageSources>
  <packageSourceMapping>
    <clear />
  </packageSourceMapping>
</configuration>
```

## 2. Registering

The harness type carries its identity; the module initializer registers it with the runspace importing the module:

```csharp
[Harness("Reed", Description = "Declarative argument completion")]
public sealed class ReedHarness : IHarness {
  public void Compose(IHarnessBuilder builder) {
    builder.Verbs.Add<SleyVerb>();
    builder.Verbs.Add<CommandVerb>();
    // …
  }
}

public sealed class ReedModuleInitializer : IModuleAssemblyInitializer {
  public void OnImport() => HarnessHost.Register<ReedHarness>();
}
```

The name is a letter followed by letters or digits. `Register` refuses a type without `[Harness]` and a harness
compiled against another Warp major. `Compose` runs once per runspace; if it throws, everything it registered is
rolled back.

## 3. What `Compose` receives

`IHarnessBuilder` is scoped to your harness and to the runspace being composed:

| Member                                                  | Use                                                                                                                                     |
| ------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `Identity`                                              | name, description, module name and version, compiled Warp version                                                                       |
| `Verbs.Add<TVerb>()`                                    | contribute DSL verbs (§4)                                                                                                               |
| `Styles`                                                | read and write styles, watch them — configuration belongs here, not in a store of your own                                              |
| `Hooks.Subscribe(kind, handler, name)`                  | `DirectoryChanged`, `PrePrompt`, `PreExecute`, `CommandNotFound`, `Idle`, `SessionStarting`, `SessionExiting`; returns an `IDisposable` |
| `Storage.Resolve(relative)`                             | a `CreelPath` under `<creel>/harnesses/<Name>/`; directories are yours to create                                                        |
| `Diagnostics.CreateLog<TEntry>(capacity)`               | a bounded ring buffer for your `Trace-*` cmdlet                                                                                         |
| `PSReadLine.IsLoaded`, `HasOptionParameter(name)`       | probe before touching PSReadLine; warn and do nothing when the option is missing                                                        |
| `Harnesses.Publish<TApi>(api)`, `TryGet<TApi>(out api)` | offer or consume a typed API across harnesses; re-probe each time instead of caching                                                    |
| `Treadles`                                              | the read-only treadle catalog and its `Changed` event                                                                                   |

Keep per-runspace state keyed by `Runspace` (a `ConditionalWeakTable<Runspace, TState>`), never in a static field: the
same process can host many runspaces, and each composes your harness separately. Reed's `ReedSession` is the pattern.

## 4. Scopes, frames and verbs

A **scope** is a type token for one nesting level. Declare it abstract, with no members:

```csharp
public abstract class CompleterScope : DslScope;
public abstract class CommandScope : DslScope;
```

A **frame** holds the state of one active scope, and names its scope so it can never be pushed into the wrong one:

```csharp
public sealed class CommandFrame(CommandNode node) : IDslFrame<CommandScope> {
  public CommandNode Node { get; } = node;
}
```

A **verb** is a `LoomVerb` cmdlet. `[LoomVerb]` lists every scope it is valid in; parameters are ordinary PowerShell
parameters; the work goes in `Weave`:

```csharp
[LoomVerb("Command", typeof(CompleterScope), typeof(CommandScope))]
public sealed class CommandVerb : LoomVerb {
  [Parameter(Mandatory = true, Position = 0)]
  public string Name { get; set; } = null!;

  [Parameter(Position = 1)]
  [OpensScope(typeof(CommandScope))]
  public ScriptBlock? Body { get; set; }

  protected override void Weave() {
    var node = new CommandNode(Name, [], null);
    Declarations.Command(Loom).Commands.Add(node);   // Loom.Frame<CommandFrame>() / Loom.RequireFrame<CompleterFrame>()
    Loom.RunScoped(new CommandFrame(node), Body);
  }
}
```

- `Loom.RunScoped(frame, body)` pushes the frame, runs the body with that scope's verb table, and pops. Failures inside
  the body go to the run's error channel; the call returns normally.
- `Loom.Frame<TFrame>()` finds the nearest enclosing frame of a type; `RequireFrame` fails when there is none.
- `[OpensScope]` on the body parameter lets the kernel validate nesting **before** the draft runs.
- Fail by throwing a `PowerShellException` or calling `ReportError`; the draft continues either way.
- A verb's name must be unique within each of its scopes, across all harnesses.

### Verbs in a draft that users edit: `-Reweave`

`Invoke-Loom -Reweave` re-applies an edited draft without restarting the shell. Tell it how your top-level verb
behaves:

```csharp
[LoomVerb("Sley", typeof(DraftScope), Reweave = ReweaveBehavior.Replay)]
public sealed class SleyVerb : LoomVerb, IRevertibleVerb {
  [Parameter(Mandatory = true, Position = 0), ReweaveKey]
  public string Name { get; set; } = null!;

  public void Revert(ReweaveEntry previous) {
    if (previous.BoundParameters.GetValueOrDefault(nameof(Name)) is string name) {
      ReedSession.ForCurrent().Completers.Remove(name);
    }
  }
  // …
}
```

- `[ReweaveKey]` marks the parameters that identify an invocation. Without one, the invocation is identified by its
  fingerprint.
- `Replay` (the default) means running the verb again upserts. `Additive` means it cannot be undone, so removing it
  asks the user to restart.
- `IRevertibleVerb.Revert` undoes an invocation whose line was removed. It runs on a fresh instance outside any
  pipeline, so it reads everything from `previous.BoundParameters` and reaches the session through your own
  per-runspace state, not through cmdlet APIs.

## 5. The cmdlet surface

Draft verbs are one surface; ordinary cmdlets are the other, for scripts and for module authors who never write a
draft. A cmdlet reaches your harness's capabilities through `HarnessHost.Current<THarness>()`, and runs a DSL body
with the same scope machinery through `Dsl.Run`:

```csharp
var definition = new CompleterDefinition(Command, Alias, Description);
var errors = HarnessHost.Current<ReedHarness>().Dsl.Run(new CompleterFrame(definition), ScriptBlock);

foreach (var error in errors) {
  WriteError(error);
}
```

Let both surfaces share one code path for anything with rules — Reed's `Sley` and `Register-Completer` go through the
same validation gate and the same registration.

## 6. Errors

Derive one sealed exception type from `PowerShellException` with internal factories, and give every id your owner
prefix in SCREAMING_SNAKE:

```csharp
public sealed class ReedException : PowerShellException {
  internal const string COMPLETER_NAME_TAKEN = "REED_COMPLETER_NAME_TAKEN";

  private ReedException(string errorId, ErrorCategory category, string message, object? target, Exception? inner = null)
    : base(errorId, category, message, target, inner) { }

  internal static ReedException CompleterNameTaken(string name, string registeredCommand)
    => new(COMPLETER_NAME_TAKEN, ErrorCategory.ResourceExists, $"…", name);
}
```

- Cmdlets catch `PowerShellException` and `WriteError(exception.ToErrorRecord())`. They never tear down the caller's
  pipeline.
- Anything the engine or PSReadLine calls — a hook handler, an argument completer, an event subscriber — catches
  everything (except `OutOfMemoryException` and `StackOverflowException`) and never throws. Record the failure in your
  diagnostics log instead, so a `Trace-*` cmdlet can explain it.
- `ErrorIdConvention` in `PSLoom.TestKit` checks the prefix rule for an assembly in one line.

## 7. Wiring into PowerShell

When a harness installs something into the session — a native argument completer, a key handler — wire it once and
never unwind it; unregistering removes what the wiring dispatches to. Another tool may have wrapped the same thing after
you did, and some wiring (native completers) cannot be removed at all. Callbacks that may run on another thread capture
your per-runspace state when they are registered instead of reading `Runspace.DefaultRunspace` when they run.

## 8. Testing

- **Unit tests** exercise your model, validation and resolution directly (`InternalsVisibleTo` is set for
  `$(AssemblyName).Tests`).
- **Hosted tests** open a runspace with the kernel's and your cmdlets and compose your harness against it, without
  importing the published module — that would load a second copy of your assembly next to the one the test references:

  ```csharp
  var runspace = PowerShellHost.CreateRunspace(state => {
    state.AddCmdletsFrom(typeof(ModuleInitializer).Assembly);   // the kernel
    state.AddCmdletsFrom(typeof(ReedHarness).Assembly);
  });

  using (PowerShellHost.UseAsDefault(runspace)) {
    new ModuleInitializer().OnImport();                          // what Import-Module PSLoom does
    HarnessHost.Register<ReedHarness>();                         // what Import-Module PSLoom.Reed does
  }
  ```

  `Invoke-Loom { Thread Reed; … }` then finds the harness already composed. `tests/PSLoom.Reed.Tests/Utility/CompletionSession.cs`
  is the full helper; tab completion is driven through `TabExpansion2`, as a user's Tab press would.

- **Published-module tests** start a real `pwsh` against `artifacts/modules`: exported cmdlets, one loaded Warp, and
  anything that only happens in a real process (see `tests/PSLoom.Reed.Integration.Tests`).
- **Budgets.** If a code path runs on every keystroke or Tab press, give it a BenchmarkDotNet suite and a budget in
  `benchmarks/Assert-Budgets.ps1`. Work done inside a draft counts against the draft budget: prefer types whose first use
  is cheap over ones that only pay off after thousands of calls.
