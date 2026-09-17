---
title: Kernel reference
sidebar_position: 2
---

Handwritten from `src/PSLoom/PSLoom.psd1`, `Cmdlets`, `Verbs` and runtime exception classes in [PSLoom/PSLoom](https://github.com/PSLoom/PSLoom). Cmdlets appear in manifest order. Positions are zero-based; **named** means no positional binding. Common PowerShell parameters are omitted. `SwitchParameter` values are switches; `?` denotes a nullable .NET value.

## Cmdlets

### Invoke-Loom

Provisions harnesses, validates and executes a draft once per session, then raises `SessionStarting`.

| Name     | Type            | Position | Mandatory | Description                                                            |
| -------- | --------------- | -------- | --------- | ---------------------------------------------------------------------- |
| Draft    | ScriptBlock     | 0        | Yes       | The complete draft.                                                    |
| Validate | SwitchParameter | named    | No        | Import installed harnesses and validate; no execution or installation. |
| Reweave  | SwitchParameter | named    | No        | Reapply an edited draft in an already woven session.                   |

```powershell
Invoke-Loom -Draft { Style ':example:*' enabled $true }
```

Prepass/provisioning/scope errors block execution. Verb failures are collected and written once as non-terminating errors. An ordinary terminating PowerShell statement can end the draft; verb isolation does not make arbitrary scripts transactional.

### Measure-Loom

Reports the last draft's phase and verb timings, plus staged-application timings.

| Name    | Type     | Position | Mandatory | Description                                                                 |
| ------- | -------- | -------- | --------- | --------------------------------------------------------------------------- |
| GroupBy | Grouping | 0        | No        | `None` (default), `Harness`, or `Verb`; grouping aggregates only verb rows. |

```powershell
Measure-Loom -GroupBy Harness
```

### Get-Shed

Lists staged statements, their timing, state, duration and failures.

| Name  | Type        | Position | Mandatory | Description                                                                                    |
| ----- | ----------- | -------- | --------- | ---------------------------------------------------------------------------------------------- |
| State | ShedState[] | 0        | No        | Filter by `Pending`, `Armed`, `Applied`, `Skipped`, `Failed`, `Superseded`; omitted means all. |

```powershell
Get-Shed -State Failed,Pending
```

`Armed` is reserved for on-demand application, which is not implemented.

### Update-Harness

Updates installed first-party harness modules from PSGallery for the next session.

| Name | Type     | Position | Mandatory | Description                                                       |
| ---- | -------- | -------- | --------- | ----------------------------------------------------------------- |
| Name | string[] | 0        | No        | Harness names; omitted means every installed first-party harness. |

Supports `-WhatIf` and `-Confirm`. Does not install absent harnesses.

```powershell
Update-Harness Reed -WhatIf
```

### Register-Hook

Registers a script handler and wires its hook kind on first use.

| Name   | Type        | Position | Mandatory | Description                                           |
| ------ | ----------- | -------- | --------- | ----------------------------------------------------- |
| Kind   | HookKind    | 0        | Yes       | Hook kind from the [guide](../../guides/hooks.md).    |
| Action | ScriptBlock | 1        | Yes       | Receives `HookInvocation` as `$_` and first argument. |
| Name   | string      | named    | No        | Same kind/name replaces its prior registration.       |

```powershell
Register-Hook PrePrompt { $global:lastPrompt = Get-Date } -Name clock
```

### Unregister-Hook

Removes a registration by identifier or kind/name; wiring stays installed.

| Name | Type     | Position | Mandatory   | Description                                          |
| ---- | -------- | -------- | ----------- | ---------------------------------------------------- |
| Id   | Guid     | 0        | Yes, ById   | Default parameter set; binds pipeline property `Id`. |
| Kind | HookKind | named    | Yes, ByName | Kind of the named registration.                      |
| Name | string   | named    | Yes, ByName | Name of the registration.                            |

```powershell
Unregister-Hook -Kind PrePrompt -Name clock
```

### Get-Hook

Lists registrations in registration order, optionally filtered by kind and case-insensitive name.

| Name | Type      | Position | Mandatory | Description               |
| ---- | --------- | -------- | --------- | ------------------------- |
| Kind | HookKind? | 0        | No        | Kind filter.              |
| Name | string    | named    | No        | Registration name filter. |

```powershell
Get-Hook PrePrompt
```

### Trace-Hook

Lists recent invocations oldest first, including duration, slow flag and exception.

| Name | Type | Position | Mandatory | Description                                                               |
| ---- | ---- | -------- | --------- | ------------------------------------------------------------------------- |
| Last | int? | 0        | No        | Most recent count, zero or greater; omitted returns all retained entries. |

```powershell
Trace-Hook -Last 10
```

### Set-Style

Defines or replaces a style value for a context pattern, then runs affected watchers.

| Name    | Type    | Position | Mandatory | Description                                     |
| ------- | ------- | -------- | --------- | ----------------------------------------------- |
| Context | string  | 0        | Yes       | Case-sensitive PowerShell wildcard pattern.     |
| Name    | string  | 1        | Yes       | Style name.                                     |
| Value   | object? | 2        | Yes       | Allows null, empty string and empty collection. |

```powershell
Set-Style ':example:*' enabled $true
```

### Get-Style

Resolves a style for a concrete context, writing nothing when no pattern matches unless a default was supplied.

| Name    | Type    | Position | Mandatory | Description                                     |
| ------- | ------- | -------- | --------- | ----------------------------------------------- |
| Context | string  | 0        | Yes       | Concrete context.                               |
| Name    | string  | 1        | Yes       | Style name.                                     |
| Default | object? | named    | No        | Value when no definition resolves; allows null. |

```powershell
Get-Style ':example:git' enabled -Default $false
```

### Test-Style

Tests whether a resolved value means enabled.

| Name    | Type   | Position | Mandatory | Description       |
| ------- | ------ | -------- | --------- | ----------------- |
| Context | string | 0        | Yes       | Concrete context. |
| Name    | string | 1        | Yes       | Style name.       |

True values include boolean true, nonzero integers, and strings `true`, `yes`, `1`, `on`, `enabled`.

```powershell
Test-Style ':example:git' enabled
```

### Remove-Style

Removes an exact stored context-pattern/name pair and runs affected watchers.

| Name    | Type   | Position | Mandatory | Description                                    |
| ------- | ------ | -------- | --------- | ---------------------------------------------- |
| Context | string | 0        | Yes       | Exact stored pattern; binds pipeline property. |
| Name    | string | 1        | Yes       | Style name; binds pipeline property.           |

```powershell
Remove-Style ':example:*' enabled
```

### Get-StyleDefinition

Lists stored definitions in definition order, without resolving a winning pattern.

| Name    | Type   | Position | Mandatory | Description                          |
| ------- | ------ | -------- | --------- | ------------------------------------ |
| Context | string | 0        | No        | Exact stored context-pattern filter. |
| Name    | string | 1        | No        | Name filter.                         |

```powershell
Get-StyleDefinition -Name enabled
```

### Register-StyleWatcher

Registers a script receiving `StyleChange` as `$_` and its first argument.

| Name    | Type            | Position | Mandatory | Description                                                                            |
| ------- | --------------- | -------- | --------- | -------------------------------------------------------------------------------------- |
| Context | string          | 0        | Yes       | Concrete context, or pattern with `-Pattern`.                                          |
| Name    | string          | 1        | Yes       | Style name.                                                                            |
| Action  | ScriptBlock     | 2        | Yes       | Handler after committed writes.                                                        |
| Pattern | SwitchParameter | named    | No        | Observe every matching written context pattern.                                        |
| Replay  | SwitchParameter | named    | No        | Immediately replay resolved value, or each matching stored definition in pattern mode. |

```powershell
$watcher = Register-StyleWatcher ':example:git' enabled { param($change) $global:lastStyleChange = $change } -Replay
```

### Unregister-StyleWatcher

Removes a style watcher by registration identifier.

| Name | Type | Position | Mandatory | Description                                       |
| ---- | ---- | -------- | --------- | ------------------------------------------------- |
| Id   | Guid | 0        | Yes       | Watcher identifier; binds pipeline property `Id`. |

```powershell
$watcher | Unregister-StyleWatcher
```

### Trace-Style

Lists recent watcher runs oldest first, with duration and exception.

| Name | Type | Position | Mandatory | Description                                                               |
| ---- | ---- | -------- | --------- | ------------------------------------------------------------------------- |
| Last | int? | 0        | No        | Most recent count, zero or greater; omitted returns all retained entries. |

```powershell
Trace-Style -Last 10
```

### New-Treadle

Defines a global function that invokes a command with baked arguments followed by caller arguments.

| Name     | Type            | Position | Mandatory | Description                                                      |
| -------- | --------------- | -------- | --------- | ---------------------------------------------------------------- |
| Name     | string          | 0        | Yes       | Nonempty treadle name.                                           |
| Command  | object          | 1        | Yes       | Non-null string or script block containing one constant command. |
| Force    | SwitchParameter | named    | No        | Replace a colliding command.                                     |
| PassThru | SwitchParameter | named    | No        | Emit the `TreadleDefinition`.                                    |

```powershell
New-Treadle glog { git log --oneline } -PassThru
```

### Get-Treadle

Lists all treadles or those matching supplied names.

| Name | Type     | Position | Mandatory | Description                                  |
| ---- | -------- | -------- | --------- | -------------------------------------------- |
| Name | string[] | 0        | No        | Case-insensitive names or wildcard patterns. |

```powershell
Get-Treadle 'g*'
```

### Remove-Treadle

Removes treadles and their installed functions while leaving unrelated same-named commands alone.

| Name | Type     | Position | Mandatory | Description                                             |
| ---- | -------- | -------- | --------- | ------------------------------------------------------- |
| Name | string[] | 0        | Yes       | Nonempty names; accepts pipeline values and properties. |

```powershell
Remove-Treadle glog
```

## Draft verbs

These are scoped vocabulary, not exported cmdlets. All three are valid in `DraftScope`; none opens a nested scope.

### Thread

Declares a first-party harness for provisioning before execution. Reweave behavior: `Additive`; key: `Name`.

| Name    | Type     | Position | Mandatory | Description                     |
| ------- | -------- | -------- | --------- | ------------------------------- |
| Name    | string   | 0        | Yes       | Top-level literal harness name. |
| Version | Version? | named    | No        | Literal pinned module version.  |

```powershell
Invoke-Loom { Thread Reed }
```

### Style

Defines a style as `Set-Style` does. Reweave behavior: `Replay`; keys: `Context`, `Name`; removed definitions can be reverted.

| Name    | Type    | Position | Mandatory | Description                                     |
| ------- | ------- | -------- | --------- | ----------------------------------------------- |
| Context | string  | 0        | Yes       | Context pattern.                                |
| Name    | string  | 1        | Yes       | Style name.                                     |
| Value   | object? | 2        | Yes       | Allows null, empty string and empty collection. |

```powershell
Invoke-Loom { Style ':example:*' enabled $true }
```

### Treadle

Defines a shortcut as `New-Treadle` does, without a force switch. Reweave behavior: `Replay`; key: `Name`; removal can be reverted.

| Name | Type        | Position | Mandatory | Description                                                       |
| ---- | ----------- | -------- | --------- | ----------------------------------------------------------------- |
| Name | string      | 0        | Yes       | Treadle name.                                                     |
| Body | ScriptBlock | 1        | Yes       | Single constant command template; **not** an `[OpensScope]` body. |

```powershell
Invoke-Loom { Treadle glog { git log --oneline } }
```

### Shed

The kernel parses this top-level modifier before execution; it is not a `[LoomVerb]` class and does not accept ordinary cmdlet common parameters. It applies to the **next statement**. No positional arguments and no modifiers are mandatory.

| Name            | Type           | Position | Mandatory | Description                                                  |
| --------------- | -------------- | -------- | --------- | ------------------------------------------------------------ |
| Wait            | switch         | named    | No        | Queue in default slot `0a`.                                  |
| Slot            | literal string | named    | No        | Queue in numeric slot plus `a`, `b` or `c`, e.g. `'1b'`.     |
| OnDemand        | switch         | named    | No        | Reserved; currently rejected for every statement.            |
| LoadIf          | ScriptBlock    | named    | No        | Evaluate a condition at application time.                    |
| RequiresCommand | literal string | named    | No        | Require a discoverable command at application time.          |
| Lucid           | switch         | named    | No        | Suppress success output.                                     |
| Silent          | switch         | named    | No        | Suppress the deferred failure summary warning at the prompt. |
| AtLoad          | ScriptBlock    | named    | No        | Run after successful application.                            |

```powershell
Invoke-Loom {
    Shed -Wait -Lucid
    Get-Date
}
Get-Shed
```

Only one of `Wait`, `Slot`, `OnDemand` is permitted. It cannot precede `Thread`, another `Shed`, or the end of a draft. See [sheds](../../guides/sheds.md).

## Error ids

Runtime exceptions use the following identifiers. PowerShell may append the cmdlet's type to `FullyQualifiedErrorId`. `LOOM_REWEAVE_REQUIRES_RESTART` is warning text rather than an exception.

| Id                              | Raised when                                                          |
| ------------------------------- | -------------------------------------------------------------------- |
| LOOM_NO_RUNSPACE                | No current runspace exists.                                          |
| LOOM_NO_ENGINE                  | Engine intrinsics are unavailable.                                   |
| LOOM_HARNESS_NAME_INVALID       | A harness name is not a letter followed by letters/digits.           |
| LOOM_HARNESS_DUPLICATE          | Another type already owns the harness name.                          |
| LOOM_HARNESS_COMPOSE_FAILED     | Harness composition throws; registrations are rolled back.           |
| LOOM_HARNESS_NOT_COMPOSED       | A harness is requested before composition.                           |
| LOOM_HARNESS_NOT_INSTALLED      | Required module/version is absent when it cannot be installed.       |
| LOOM_HARNESS_IMPORT_FAILED      | Module import fails.                                                 |
| LOOM_NOT_A_HARNESS              | Imported module did not register the expected harness.               |
| LOOM_API_DUPLICATE              | Another harness already published the API type.                      |
| LOOM_VERB_ATTRIBUTE_MISSING     | Registered verb lacks `[LoomVerb]`.                                  |
| LOOM_VERB_NAME_INVALID          | Invalid DSL verb identifier.                                         |
| LOOM_VERB_NO_SCOPE              | Verb attribute lists no scope.                                       |
| LOOM_VERB_DUPLICATE             | Name already registered in a scope.                                  |
| LOOM_VERB_OUT_OF_SCOPE          | Verb is used outside its allowed scopes.                             |
| LOOM_THREAD_NOT_TOP_LEVEL       | Thread is nested.                                                    |
| LOOM_THREAD_NAME_NOT_LITERAL    | Thread name is computed.                                             |
| LOOM_THREAD_NOT_PREPARED        | Harness was not loaded before execution.                             |
| LOOM_DRAFT_STATEMENT_FAILED     | Statement failure has no more specific PowerShell error record.      |
| LOOM_HARNESS_NOT_FIRST_PARTY    | Thread/update names a harness outside the allowlist.                 |
| LOOM_HARNESS_INSTALL_FAILED     | Missing module cannot be installed.                                  |
| LOOM_HARNESS_UPDATE_FAILED      | Explicit update fails.                                               |
| LOOM_HARNESS_VERSION_CONFLICT   | Requested harness version differs from the loaded version.           |
| LOOM_THREAD_VERSION_NOT_LITERAL | Version is not a valid literal.                                      |
| LOOM_THREAD_VERSION_CONFLICT    | Duplicate thread declarations request differing versions.            |
| LOOM_REWEAVE_REQUIRES_RESTART   | Removed invocation cannot be reverted (warning).                     |
| LOOM_REWEAVE_REVERT_FAILED      | Reverting a removed invocation fails.                                |
| LOOM_SHED_NOT_TOP_LEVEL         | Shed is nested.                                                      |
| LOOM_SHED_DANGLING              | No statement follows Shed.                                           |
| LOOM_SHED_STACKED               | Two Shed statements occur consecutively.                             |
| LOOM_SHED_NOT_LITERAL           | Modifier value has the wrong literal/script-block form.              |
| LOOM_SHED_TIMING_CONFLICT       | Multiple timing modifiers are supplied.                              |
| LOOM_SHED_NOT_ON_DEMAND         | Target does not support on-demand application (all current targets). |
| LOOM_SHED_NOT_APPLICABLE        | Target cannot be staged, such as Thread.                             |
| LOOM_SHED_UNKNOWN_MODIFIER      | Modifier is unknown or ambiguous.                                    |
| LOOM_SHED_APPLY_FAILED          | Staged application fails outside a more specific error channel.      |
| STYLE_INVALID_KEY               | Empty context or style name.                                         |
| STYLE_WATCHER_RECURSION         | Watcher nesting exceeds the limit.                                   |
| STYLE_WATCHER_FAILED            | Watcher throws after a committed write.                              |
| HOOK_WIRING_FAILED              | Wiring a hook kind fails.                                            |
| HOOK_UNKNOWN_KIND               | Invalid hook enum value.                                             |
| HOOK_HANDLER_FAILED             | Hook handler throws.                                                 |
| TREADLE_BODY_NOT_SINGLE_COMMAND | Body contains nonconstant arguments or is not one command.           |
| TREADLE_NAME_COLLISION          | Existing command collides without `-Force`.                          |
| TREADLE_INVALID_NAME            | Name contains unsupported characters.                                |
| TREADLE_SUBSCRIBER_FAILED       | Catalog subscriber fails after a change.                             |

The contract assembly can additionally report these identifiers during kernel/harness use:

| Id                             | Raised when                                                                    |
| ------------------------------ | ------------------------------------------------------------------------------ |
| WARP_CONTRACT_MISMATCH         | Harness lacks a Warp reference or targets another contract major.              |
| WARP_HARNESS_ATTRIBUTE_MISSING | Harness type lacks `[Harness]`.                                                |
| WARP_KERNEL_UNAVAILABLE        | No kernel is attached.                                                         |
| WARP_KERNEL_ALREADY_ATTACHED   | A different kernel is already attached to the process.                         |
| WARP_FRAME_MISSING             | Required enclosing DSL frame is absent.                                        |
| WARP_VERB_OUTSIDE_LOOM         | A verb runs outside a loom/DSL invocation.                                     |
| WARP_VERB_UNHANDLED_EXCEPTION  | Verb throws an exception without a more specific contract error.               |
| WARP_SCOPE_INVALID             | Referenced scope type does not satisfy DSL scope rules.                        |
| CREEL_PATH_ESCAPE              | Storage path is rooted, invalid, escapes the root or crosses an escaping link. |
