---
title: Importing and exporting completers
sidebar_position: 4
---

Separate building, storing and registering a completer:

```powershell
Import-Module PSLoom.Reed
New-Completer deploy {
    Argument environment -Provider environments
} | Export-Completer -Path ./deploy.json -PassThru

Register-CompletionProvider environments { 'dev'; 'production' }
Import-Completer ./deploy.json | Register-Completer
```

`Import-Completer` only returns a definition. `Register-Completer` runs the validation gate and registers it. `Export-Completer deploy ./deploy.json` instead exports an existing registration.

## Portability and overwrite behavior

Provider names travel; executable scripts do not. Inline `-Source` and any source with `-CacheKey` cause export to fail by default. `-Force` emits warnings and drops inline sources and cache keys. Inline-source slots then complete nothing; a provider-backed slot retains its provider name even when its cache key is omitted (the warning currently overstates what is dropped). A receiving session must register provider names independently. JSON contains no executable scripts.

:::caution Existing files
The current implementation overwrites the output file even without `-Force`. The switch permits loss of nonportable sources; do not use it as an overwrite guard.
:::

## Format

The current schema number is **1**. Unsupported schemas and invalid JSON produce `REED_COMPLETER_NOT_READABLE`. This complete minimal document describes a provider-backed positional argument:

```json
{
  "schema": 1,
  "command": "deploy",
  "aliases": [],
  "description": null,
  "root": {
    "name": "deploy",
    "aliases": [],
    "description": null,
    "commands": [],
    "options": [],
    "arguments": [
      { "name": "environment", "variadic": false, "provider": "environments" }
    ]
  }
}
```

| Object        | Fields                                                               |
| ------------- | -------------------------------------------------------------------- |
| Document      | `schema`, `command`, `aliases`, `description`, `root`                |
| Command node  | `name`, `aliases`, `description`, `commands`, `options`, `arguments` |
| Option node   | `name`, `aliases`, `description`, nullable `value` argument          |
| Argument node | `name`, `variadic`, nullable `provider`                              |

Groups have already been copied into command options and are not serialized as templates. See [Export-Completer](reference.md#export-completer) and [Import-Completer](reference.md#import-completer) for parameter sets and pipeline binding.
