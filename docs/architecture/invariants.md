---
title: Invariants
sidebar_position: 2
---

Rules that must stay true whatever else changes. Each one says why it exists and names the tests that hold it in place;
a change that breaks one fails those tests, not a later bug report. Test names are `Project.Namespace.Class.Method`.

## 1. Style resolution: the longest literal prefix wins

Among the definitions whose context pattern matches a concrete context, the one with the longest literal
(non-wildcard) prefix wins, regardless of registration order; ties go to the highest `Sequence`.

**Why:** a profile declares broad defaults first and specific overrides later — or the other way round. Registration
order cannot be what decides, or moving a line would silently change the shell.

- `PSLoom.Tests.Runtime.Styles.StyleResolutionTests.Resolve_LongerLiteralPrefixWins_RegardlessOfRegistrationOrder`
- `PSLoom.Tests.Runtime.Styles.StyleResolutionTests.Resolve_LongerLiteralPrefixWins_EvenWhenDefinedFirst`
- `PSLoom.Tests.Runtime.Styles.StyleResolutionTests.Resolve_EqualSpecificity_MostRecentSequenceWins`

## 2. Errors inside nested `InvokeWithContext` surface exactly once

A failure raised inside a verb body — however deep the nesting — reaches the user once, as a non-terminating error,
and the rest of the draft still runs.

**Why:** `InvokeWithContext` inside a running cmdlet executes as a nested pipeline. An exception there can be written to
the ambient error stream and swallowed, or reported again at every level on its way out. The loom run's error channel
exists so neither happens.

- `PSLoom.Tests.Cmdlets.Loom.InvokeLoomCmdletTests.FailingVerb_DoesNotAbortTheDraft_AndIsReportedOnce`
- `PSLoom.Tests.Cmdlets.Loom.InvokeLoomCmdletTests.TerminatingStatement_EndsTheDraftAndIsReportedOnce`
- `PSLoom.Reed.Tests.Verbs.SleyVerbTests.AnErrorThreeScopesDeepIsReportedExactlyOnce` (draft → `Sley` → `Command` → `Command`)
- `PSLoom.Reed.Tests.Cmdlets.CompleterCmdletTests.AnErrorThreeScopesDeepIsReportedExactlyOnce` (the same body through `New-Completer`)
- `PSLoom.Integration.Tests.PublishedModuleTests.AFailingVerbNeverTearsDownTheCallersScript` (a real `pwsh` process)

## 3. Callbacks close over the runspace captured at registration

A handler PSReadLine or the engine may call on another thread reaches the runspace it was registered in, never
whatever `Runspace.DefaultRunspace` happens to be on that thread.

**Why:** `Runspace.DefaultRunspace` is thread-static. PSReadLine callbacks and engine events such as `Exiting` can run
on threads where it is null or belongs to something else.

- `PSLoom.Tests.Cmdlets.Hooks.HookWiringTests.PreExecute_HandlerCalledFromAnotherThread_DispatchesToTheCapturedRunspace`
- `PSLoom.Tests.ModuleInitializerTests.OnEngineExiting_FromThreadWithoutDefaultRunspace_RunsScriptHandlers`

## 4. Keystroke wiring chains a custom binding and refuses `EditMode Vi` — deferred

**Status:** not implemented. The internal `KeystrokeTick` hook was deferred in section 3 of the design until a harness
needs it, so there is no wiring to hold to this rule and no test pretends otherwise. The rule applies as written the
day it lands: it must chain a binding the user already set, and refuse to install under `EditMode Vi`, whose modal
keys it would break.

## 5. PSReadLine-dependent paths probe, warn and no-op

Before using a PSReadLine option, PSLoom checks that `Set-PSReadLineOption` exists and takes the parameter. When it
does not, the user gets one warning and nothing else; a `ParameterBindingException` never reaches them.

**Why:** the parameters PSLoom relies on (`-LineAcceptedHandler`) exist only in some PSReadLine builds, and PSReadLine
may not be loaded at all — in a remote session, in `pwsh -NonInteractive`, or in a test host.

- `PSLoom.Tests.Cmdlets.Hooks.HookWiringTests.PreExecute_WithoutPSReadLine_WritesWarningAndIsRetriedLater`
- `PSLoom.Tests.Cmdlets.Hooks.HookWiringTests.PreExecute_PSReadLineWithoutTheParameter_WarnsAndNeverRaisesABindingError`
- `PSLoom.Tests.Runtime.PSReadLine.PSReadLineProbeTests.Probe_WithoutPSReadLine_ReportsNothingAndDoesNotThrow`

## 6. Wiring is never unwound; unregistering flips state

Once PSLoom wraps `prompt`, sets `LocationChangedAction`, or registers a native completer, that wiring stays for the
life of the session. Unregistering removes the handler or the registration behind it, so the wiring finds nothing to
do.

**Why:** another tool may have wrapped the same thing after PSLoom did. Unwinding would drop that tool's wrapper, or
put back a function it already replaced. PowerShell also offers no way to remove a native argument completer from a
live session.

- `PSLoom.Tests.Cmdlets.Hooks.HookWiringTests.Unregister_LeavesTheWrappedPromptInPlace_AndItRunsNoHandler`
- `PSLoom.Tests.Cmdlets.Hooks.HookWiringTests.Unregister_LeavesTheLocationChangedActionInPlace_AndItRunsNoHandler`
- `PSLoom.Reed.Tests.Cmdlets.CompleterCmdletTests.UnregisteringLeavesTheNativeWiringInPlace`

## 7. The completer bridge never throws

`ReedBridge.Complete` returns candidates or nothing. Every failure — no runspace, a missing command AST, a source
that throws — is caught, recorded for `Trace-Completion`, and turned into an empty result.

**Why:** it runs on every Tab press. An exception there breaks completion for the whole command line the user is
typing, not just one suggestion.

- `PSLoom.Reed.Tests.Runtime.ReedBridgeTests.WithoutARunspaceItReturnsNothingInsteadOfThrowing`
- `PSLoom.Reed.Tests.Runtime.ReedBridgeTests.AMissingCommandAstCompletesNothing`
- `PSLoom.Reed.Tests.Completion.CompletionSourceTests.AFailingSourceCompletesNothing_AndIsTraced`

## 8. Every public cmdlet is exported by its module manifest

`CmdletsToExport` in each published manifest lists exactly the cmdlets its assembly implements.

**Why:** a cmdlet missing from the manifest builds, passes every in-process test, and is invisible to a user who
imports the module.

- `PSLoom.Tests.Architecture.KernelModuleLayoutTests.PublishedKernelManifestExportsEveryCmdletExactly`
- `PSLoom.Reed.Tests.Architecture.ReedModuleLayoutTests.PublishedManifestExportsEveryCmdletExactly`
- `PSLoom.Integration.Tests.PublishedModuleTests.EveryExportedCmdletIsTheManifestsList` (what `Get-Command` sees after `Import-Module`)

## 9. `SessionExiting` needs no wiring call and fires when the engine exits

Importing the kernel subscribes the engine's `Exiting` event; a registered `SessionExiting` hook runs when the
process shuts down.

**Why:** the predecessor subscribed `Exiting` with a custom source identifier, which subscribes to an event the
engine never raises. The hook existed and never fired.

**Note for handler authors:** by the time `Exiting` runs, the runspace is `Closing`, so PowerShell can no longer
auto-load modules. A handler calling a cmdlet from a module not yet loaded in the session (`Set-Content`, for one)
fails quietly. This is PowerShell's behavior for any `Exiting` handler, PSLoom's or not; use .NET APIs or cmdlets
already loaded.

- `PSLoom.Tests.ModuleInitializerTests.OnImport_SubscribesToEngineExitingEvent`
- `PSLoom.Tests.ModuleInitializerTests.EngineRaisingExiting_ReachesSubscription_AndScriptHandlersGetTheirRunspace`
- `PSLoom.Tests.ModuleInitializerTests.ASourceIdentifierOtherThanTheEventName_NeverSeesExiting` (the predecessor's defect, kept as proof)
- `PSLoom.Integration.Tests.PublishedModuleTests.SessionExitingFiresWhenTheEngineExits` (a real `pwsh` process exiting)

## 10. Staged statements apply in slot order

A statement staged with `Shed -Wait` or `-Slot` never applies before one in an earlier slot, nor before an earlier statement of
the same slot, however the work is split across prompt draws and idle ticks.

**Why:** a draft orders its loads on purpose — a prompt theme after the module it configures. Applying out of order would break
that silently, and only sometimes.

- `PSLoom.Tests.Runtime.Sheds.ShedQueueTests.EntriesDrainBySlotThenDraftOrder`
- `PSLoom.Tests.Cmdlets.Loom.ShedInvariantTests.StagedStatementsNeverApplyOutOfSlotOrder_EvenAcrossFirings`

## 11. Applying a staged statement never throws

Whether it runs from a prompt draw, an idle tick or a command lookup, a staged statement that fails becomes a record in
`Get-Shed` and a one-line warning at the next prompt. The prompt, the idle tick and the lookup carry on.

**Why:** these callbacks run inside PowerShell's own machinery. An exception there breaks prompt rendering, or turns a typo into a
crash, far from the draft line that caused it.

- `PSLoom.Tests.Cmdlets.Loom.ShedInvariantTests.ApplyingFromAPromptAnIdleTickOrAMissedCommandNeverThrows`
- `PSLoom.Tests.Cmdlets.Loom.ShedInteractiveTests.AFailureIsWarnedAboutOnceAtThePrompt`

## Conventions held by tests

These are not in the invariant list of the design, but they are enforced the same way.

- **Error ids** are SCREAMING_SNAKE with an owner prefix, and the prefix belongs to the assembly declaring it
  (`WARP_`/`CREEL_` in Warp; `LOOM_`/`STYLE_`/`HOOK_`/`TREADLE_` in the kernel; `REED_` in Reed).
  `PSLoom.Tests.Architecture.ErrorIdConventionTests`, `PSLoom.Reed.Tests.Architecture.ErrorIdConventionTests`.
- **One contract assembly.** A harness references Warp at compile time only and ships no `Warp.dll`; at runtime every
  harness binds to the kernel's copy. `PSLoom.Reed.Tests.Architecture.HarnessDependencyTests`,
  `PSLoom.Reed.Integration.Tests.PublishedModuleTests.OnlyTheKernelsCopyOfWarpIsLoaded`.

## Harvested predecessor behavior

Section 6 of the design requires the behavioral assertions of the predecessor's Hooks, ContextOptions and Completion
suites to be ported. Each assertion was mapped to a test here:

- **Already covered** — most of them: resolution, watcher semantics, hook wiring, dispatch isolation, cmdlet behavior.
- **Ported**, marked `// Harvested: <predecessor test>` in the test itself: pattern-watcher replay, empty `Trace-Hook` and
  `Trace-Style`, every `CommandNotFound` hook running when none resolves, dispatch in registration order, the
  source-identifier defect, and a failing `SessionStarting` handler written as an error. Two of these were behaviors the
  rewrite had lost, and they are restored.
- **Deliberately different**, stated in the test where one exists and in the design's decisions table: no style schema,
  no trace gate, no harness-owned cleanup, no unwiring on module removal, no `AddToHistoryHandler` fallback, and `Guid`
  registration ids.
- **Deferred** — the keystroke hook suites, with `KeystrokeTick` (invariant 4).

Completion had no suite to harvest: it existed only as a design document, so Reed's tests were written from that design.

## Repository ownership

Types prefixed PSLoom.Reed belong to [PSLoom/Reed](https://github.com/PSLoom/Reed); the other kernel and Warp tests belong to [PSLoom/PSLoom](https://github.com/PSLoom/PSLoom). The exported-manifest process assertion also runs as PSLoom.Reed.Integration.Tests.PublishedModuleTests.EveryExportedCmdletIsTheManifestsList for Reed. [Architecture overview](overview.md).
