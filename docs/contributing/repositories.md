---
title: Repositories and releases
sidebar_position: 3
---

## Repository map

| Repository                                        | Owns                                                                                     | Tag prefix      |
| ------------------------------------------------- | ---------------------------------------------------------------------------------------- | --------------- |
| [PSLoom/PSLoom](https://github.com/PSLoom/PSLoom) | Kernel, Warp contract, build SDK, test kit, Fixture, kernel tests and budgets            | `psloom/v*`     |
| [PSLoom/Reed](https://github.com/PSLoom/Reed)     | Completion harness, its unit/process tests, typical startup draft and completion budgets | `reed/v*`       |
| [PSLoom/wiki](https://github.com/PSLoom/wiki)     | This documentation site                                                                  | None required   |
| `PSLoom/Colorway` (future)                        | Command-aware syntax highlighting                                                        | Not established |
| `PSLoom/Weft` (future)                            | Plugin management                                                                        | Not established |
| `PSLoom/Shuttle` (future)                         | Release assets, binaries and shims                                                       | Not established |

The repository split keeps the kernel independent of Reed. Runtime APIs and integration assertions that specifically thread Reed live in Reed's repository. Local design records and plans remain outside the repositories; they are not site inputs. Legacy repositories are not modified by this split.

During migration, kernel and Reed changes live exclusively on `develop`; each `main` stays at its initial commit and remains the eventual default branch. Wiki development uses `main`. Clone the code repositories with `--branch develop` as shown in [development setup](development-setup.md).

## Packages

All four SDK packages share one version:

| Package          | Content                                                                                       | Consumer                                                    |
| ---------------- | --------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| `PSLoom.Warp`    | Compile-time `Warp.dll` contract                                                              | Harness with `PrivateAssets="all" ExcludeAssets="runtime"`. |
| `PSLoom.Build`   | Transitive versioning, manifest generation, module publication and kernel restoration targets | Harness projects via `GlobalPackageReference`.              |
| `PSLoom.TestKit` | `PowerShellHost`, `RepositoryLayout`, `ErrorIdConvention`                                     | Harness tests.                                              |
| `PSLoom`         | Kernel assemblies and published PowerShell module layout, including runtime Warp              | Hosted tests, process integration and harness benchmarks.   |

The kernel imports its build targets from source and restores public dependencies only. Reed pins the shared SDK version through `PSLoomVersion`. The [local loop](development-setup.md#token-free-local-sdk-loop) uses local packages and nuget.org, without credentials; released versions use the organization's GitHub Packages feed.

## Release flow

1. Validate the kernel build, tests and performance budgets.
2. A `psloom/v*` tag triggers CI publication of all four packages with the same version.
3. Grant consuming repositories Actions access to the packages.
4. Bump `PSLoomVersion` in each harness and validate its independent build/tests/budgets.
5. `reed/v*` builds the Reed artifact; this split does not publish it to PSGallery.

The bootstrap version is `0.1.0-alpha.1`. A bad published package is superseded with a new version, never overwritten. Package publication and PowerShell Gallery publication are separate operations.

## Visibility and documentation deployment

New repositories are initially private. Repository links require access and may not resolve until creation/publication has been completed. The planned harness repositories do not exist yet.

Wiki CI builds pushes to `main` and pull requests. GitHub Pages deployment is **manual only**, using `workflow_dispatch`, and remains disabled operationally until repository visibility/plan supports Pages. The organization's Free plan does not provide Pages for private repositories. The intended site address is `https://psloom.github.io/wiki/`; it is not a claim that the site has been deployed. See [GitHub Pages availability](https://docs.github.com/en/pages/getting-started-with-github-pages/about-github-pages).
