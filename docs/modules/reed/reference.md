---
title: Reed reference
sidebar_position: 5
---

Handwritten from `src/PSLoom.Reed/PSLoom.Reed.psd1`, `Cmdlets`, `Verbs` and `ReedException.cs` in [PSLoom/Reed](https://github.com/PSLoom/Reed). Cmdlets follow manifest order. Positions are zero-based; **named** means no positional binding. Common PowerShell parameters are omitted. Import `PSLoom.Reed` (which requires `PSLoom`) before standalone examples.

## Cmdlets

### New-Completer

Builds a completer definition from Reed's declaration body and writes it without registering it.

| Name        | Type        | Position | Mandatory | Description                                         |
| ----------- | ----------- | -------- | --------- | --------------------------------------------------- |
| Command     | string      | 0        | Yes       | Nonempty native command name.                       |
| ScriptBlock | ScriptBlock | 1        | Yes       | Non-null declaration body, run in `CompleterScope`. |
| Alias       | string[]    | named    | No        | Other command names, empty by default.              |
| Description | string      | named    | No        | Description of the command.                         |

```powershell
$definition = New-Completer git { Command status }
```

Declaration-body errors are reported. Model validation is a separate step: use `Test-Completer` or the registration gate.

### Register-Completer

Validates and registers a definition, wiring every command name and alias into native completion.

| Name      | Type                | Position | Mandatory | Description                                     |
| --------- | ------------------- | -------- | --------- | ----------------------------------------------- |
| Completer | CompleterDefinition | 0        | Yes       | Definition; accepts pipeline input.             |
| Force     | SwitchParameter     | named    | No        | Replace registrations holding any of its names. |
| PassThru  | SwitchParameter     | named    | No        | Emit `CompleterRegistration`.                   |

```powershell
New-Completer git { Command status } | Register-Completer -PassThru
```

### Get-Completer

Lists registrations or those matching command names or aliases.

| Name    | Type     | Position | Mandatory | Description                                  |
| ------- | -------- | -------- | --------- | -------------------------------------------- |
| Command | string[] | 0        | No        | Names or case-insensitive wildcard patterns. |

```powershell
Get-Completer 'git*'
```

### Unregister-Completer

Removes registrations; the native wiring remains but returns no candidates.

| Name    | Type     | Position | Mandatory | Description                                                                                        |
| ------- | -------- | -------- | --------- | -------------------------------------------------------------------------------------------------- |
| Command | string[] | 0        | Yes       | Nonempty names; aliases remove the whole owning registration; pipeline values/properties accepted. |

```powershell
Unregister-Completer git
```

### Test-Completer

Reports every model validation problem without registering the completer.

| Name      | Type                | Position | Mandatory | Description                                                         |
| --------- | ------------------- | -------- | --------- | ------------------------------------------------------------------- |
| Completer | CompleterDefinition | 0        | Yes       | Definition; accepts pipeline input.                                 |
| Quiet     | SwitchParameter     | named    | No        | Emit one boolean: true when there are no errors (warnings allowed). |

```powershell
New-Completer git { Command status } | Test-Completer -Quiet
```

### Export-Completer

Writes a registered completer or definition to a portable JSON file.

| Name      | Type                | Position | Mandatory          | Description                                       |
| --------- | ------------------- | -------- | ------------------ | ------------------------------------------------- |
| Command   | string              | 0        | Yes, Command set   | Registered name; default parameter set.           |
| Completer | CompleterDefinition | named    | Yes, Completer set | Definition from pipeline or explicit parameter.   |
| Path      | string              | 1        | Yes, both sets     | Nonempty output file path.                        |
| Force     | SwitchParameter     | named    | No                 | Permit export after dropping nonportable sources. |
| PassThru  | SwitchParameter     | named    | No                 | Emit `FileInfo`.                                  |

```powershell
New-Completer git { Command status } | Export-Completer -Path ./git.json
```

Inline sources and sources with a script-block cache key require `-Force`. Inline scripts and cache keys are omitted; a provider name survives even when its cache key is dropped. The current warning text says that such a slot completes nothing, but the serializer retains provider names. **The implementation uses `File.WriteAllText` and overwrites existing files regardless of `-Force`.** See [format and portability](import-export.md).

### Import-Completer

Reads a JSON file and returns a definition without registering it.

| Name | Type   | Position | Mandatory | Description                                                           |
| ---- | ------ | -------- | --------- | --------------------------------------------------------------------- |
| Path | string | 0        | Yes       | Nonempty path; alias `FullName`; pipeline values/properties accepted. |

```powershell
Import-Completer ./git.json | Register-Completer
```

### Trace-Completion

Shows every retained Tab press oldest first, including successful presses, or clears the log.

| Name  | Type            | Position | Mandatory | Description                         |
| ----- | --------------- | -------- | --------- | ----------------------------------- |
| Last  | int?            | 0        | No        | Most recent count; minimum 1.       |
| Clear | SwitchParameter | named    | No        | Clear instead of returning entries. |

```powershell
Trace-Completion -Last 10
```

### Register-CompletionProvider

Registers a named source resolved by `Argument -Provider` at completion time.

| Name        | Type            | Position | Mandatory | Description                                                                                      |
| ----------- | --------------- | -------- | --------- | ------------------------------------------------------------------------------------------------ |
| Name        | string          | 0        | Yes       | Nonempty provider name.                                                                          |
| ScriptBlock | ScriptBlock     | 1        | Yes       | Candidate-producing script receiving word, command path, bound options and positional arguments. |
| Description | string          | named    | No        | Provider description.                                                                            |
| Force       | SwitchParameter | named    | No        | Replace an existing provider name.                                                               |
| PassThru    | SwitchParameter | named    | No        | Emit `CompletionProvider`.                                                                       |

```powershell
Register-CompletionProvider environments { 'dev'; 'staging'; 'production' }
```

### Get-CompletionProvider

Lists registered providers, optionally matching supplied names.

| Name | Type     | Position | Mandatory | Description                                  |
| ---- | -------- | -------- | --------- | -------------------------------------------- |
| Name | string[] | 0        | No        | Names or case-insensitive wildcard patterns. |

```powershell
Get-CompletionProvider '*'
```

### Unregister-CompletionProvider

Removes providers; slots still naming them return no candidates.

| Name | Type     | Position | Mandatory | Description                                         |
| ---- | -------- | -------- | --------- | --------------------------------------------------- |
| Name | string[] | 0        | Yes       | Nonempty names; accepts pipeline values/properties. |

```powershell
Unregister-CompletionProvider environments
```

### Clear-CompletionCache

Forgets all cached source answers so the next Tab press asks sources again. No command-specific parameters.

```powershell
Clear-CompletionCache -Verbose
```

## Draft verbs

### Sley

Declares, validates and registers native completion in one step. Scope: `DraftScope`. `Body` opens `CompleterScope`. Reweave: `Replay`, key `Name`, supports removal via `IRevertibleVerb`.

| Name        | Type        | Position | Mandatory | Description                                              |
| ----------- | ----------- | -------- | --------- | -------------------------------------------------------- |
| Name        | string      | 0        | Yes       | Native command.                                          |
| Alias       | string[]    | named    | No        | Additional names wired to this completer.                |
| Description | string      | named    | No        | Command description.                                     |
| Body        | ScriptBlock | 1        | Yes       | `[OpensScope(typeof(CompleterScope))]` declaration body. |

```powershell
Invoke-Loom { Thread Reed; Sley git { Command status } }
```

### Command

Adds a subcommand. Scopes: `CompleterScope`, `CommandScope`. `Body` opens `CommandScope`; nesting is unlimited.

| Name        | Type        | Position | Mandatory | Description                                               |
| ----------- | ----------- | -------- | --------- | --------------------------------------------------------- |
| Name        | string      | 0        | Yes       | Subcommand name.                                          |
| Alias       | string[]    | named    | No        | Alternate spellings.                                      |
| Description | string      | named    | No        | Candidate description.                                    |
| Body        | ScriptBlock | 1        | No        | `[OpensScope(typeof(CommandScope))]` nested declarations. |

```powershell
New-Completer git { Command remote { Command add } }
```

### Option

Adds a switch or an option taking one value. Scopes: `CompleterScope`, `CommandScope`, `OptionGroupScope`. `Body` opens `OptionScope`.

| Name        | Type        | Position | Mandatory | Description                                                   |
| ----------- | ----------- | -------- | --------- | ------------------------------------------------------------- |
| Name        | string      | 0        | Yes       | Option spelling, e.g. `'--message'`.                          |
| Alias       | string[]    | named    | No        | Other spellings such as `'-m'`.                               |
| Description | string      | named    | No        | Candidate description.                                        |
| Body        | ScriptBlock | 1        | No        | `[OpensScope(typeof(OptionScope))]` body declaring its value. |

```powershell
New-Completer git { Command commit { Option '--message' -Alias '-m' { Argument message } } }
```

### OptionGroup

Declares a reusable option template. Scope: `CompleterScope` only. `Body` opens `OptionGroupScope`.

| Name | Type        | Position | Mandatory | Description                                                   |
| ---- | ----------- | -------- | --------- | ------------------------------------------------------------- |
| Name | string      | 0        | Yes       | Unique group name.                                            |
| Body | ScriptBlock | 1        | Yes       | `[OpensScope(typeof(OptionGroupScope))]` option declarations. |

```powershell
New-Completer git {
    OptionGroup output { Option '--quiet' -Alias '-q' }
    Command status { Use OptionGroup output }
}
```

### Use

Copies an already declared group's options into the current command. Scopes: `CompleterScope`, `CommandScope`. Opens no scope.

| Name | Type   | Position | Mandatory | Description                      |
| ---- | ------ | -------- | --------- | -------------------------------- |
| Kind | string | 0        | Yes       | Only valid value: `OptionGroup`. |
| Name | string | 1        | Yes       | Previously declared group.       |

```powershell
New-Completer git {
    OptionGroup common { Option '--help' }
    Use OptionGroup common
}
```

### Argument

Declares a positional argument or the enclosing option's value. Scopes: `CompleterScope`, `CommandScope`, `OptionScope`. No parameter opens a scope; source/cache scripts execute at completion time.

| Name     | Type            | Position | Mandatory | Description                                                 |
| -------- | --------------- | -------- | --------- | ----------------------------------------------------------- |
| Name     | string          | 0        | Yes       | Slot name for diagnostics and tooltips.                     |
| Variadic | SwitchParameter | named    | No        | Consume remaining positional arguments.                     |
| Source   | ScriptBlock     | named    | No        | Inline candidate source.                                    |
| Provider | string          | named    | No        | Named source, mutually exclusive with `Source`.             |
| CacheKey | ScriptBlock     | named    | No        | Key for reusing source answers; requires a source/provider. |

```powershell
New-Completer deploy { Argument environment -Source { 'dev'; 'production' } }
```

An option accepts at most one argument declaration. Validation rejects malformed or ambiguous declaration trees before registration; inspect `Test-Completer` diagnostics.

## Error ids

| Id                          | Raised when                                                                                                        |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| REED_INVALID_DECLARATION    | Invalid declaration, duplicate group, multiple option values, both source/provider, or cache key without a source. |
| REED_COMPLETER_INVALID      | Model validation errors block registration.                                                                        |
| REED_COMPLETER_NAME_TAKEN   | Command/alias already belongs to a registration and force was not specified.                                       |
| REED_OPTION_GROUP_NOT_FOUND | Use names a group not yet declared.                                                                                |
| REED_WIRING_FAILED          | Native argument-completer wiring fails.                                                                            |
| REED_NO_RUNSPACE            | No current runspace exists.                                                                                        |
| REED_PROVIDER_NAME_TAKEN    | Provider name already exists without force.                                                                        |
| REED_COMPLETER_NOT_PORTABLE | Export contains nonportable sources without force, or a file write fails.                                          |
| REED_COMPLETER_NOT_READABLE | File cannot be read, JSON is invalid or schema is unsupported.                                                     |
| REED_COMPLETER_NOT_FOUND    | Export names an unregistered command.                                                                              |
