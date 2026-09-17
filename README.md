# PSLoom documentation

The shared documentation for the [PSLoom kernel](https://github.com/PSLoom/PSLoom), [Reed](https://github.com/PSLoom/Reed), and future harnesses. Built with Docusaurus 3, TypeScript, Mermaid and local search.

## Run locally

Use **Node 24** and **pnpm 11.18.0** (pinned in `.nvmrc` and `package.json`).

```powershell
pnpm install --frozen-lockfile
pnpm start
```

For production validation and preview:

```powershell
pnpm typecheck
pnpm build
pnpm serve
```

The site lives under `/wiki/`. The build writes `build/`, checks Markdown/site links and creates the local search index. Search is available in the production preview; it does not need an external indexing service.

## Content map

| Path                                                         | Content                                         |
| ------------------------------------------------------------ | ----------------------------------------------- |
| [docs/intro.md](docs/intro.md)                               | Kernel and harness model                        |
| [docs/getting-started](docs/getting-started/installation.md) | Installation and first draft                    |
| [docs/guides](docs/guides/styles.md)                         | Styles, hooks, treadles, sheds and measurement  |
| [docs/modules/psloom](docs/modules/psloom/reference.md)      | Kernel overview and handwritten reference       |
| [docs/modules/reed](docs/modules/reed/reference.md)          | Reed DSL, sources/cache, JSON and reference     |
| [docs/modules](docs/modules/colorway.md)                     | Planned Colorway, Weft and Shuttle harnesses    |
| [docs/architecture](docs/architecture/overview.md)           | Architecture diagrams and invariants            |
| [docs/contributing](docs/contributing/development-setup.md)  | Harness authoring, SDK setup and repository map |

## Writing documentation

Write in English. Give every content page a `title` and `sidebar_position` in front matter. Copy cmdlet/verb/parameter names, scopes and error identifiers from current source; references are maintained by hand, with no reference generator. Check implementation behavior as well as XML comments. Keep planned behavior clearly marked.

Use relative `.md` links between pages and `powershell` / `csharp` fenced code blocks. Run `pnpm build` after edits: broken Markdown links, images and site links fail the build. Configuration follows the [Docusaurus configuration reference](https://docusaurus.io/docs/api/docusaurus-config), with Markdown checks under `markdown.hooks`.

## Deployment

CI builds pull requests and pushes to `main`. The Pages workflow is **manual only** (`workflow_dispatch`). Repositories start private and the organization's Free plan does not serve Pages from private repositories; publication must wait until visibility/plan permits it. The intended URL is `https://psloom.github.io/wiki/`.

> [!NOTE]
> Gallery installation and the site URL describe the intended release path. This repository does not publish PowerShell modules or imply that a gallery release or Pages deployment already exists.
