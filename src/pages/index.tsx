import type { ReactNode } from "react";
import Link from "@docusaurus/Link";
import useBaseUrl from "@docusaurus/useBaseUrl";
import Layout from "@theme/Layout";
import CodeBlock from "@theme/CodeBlock";
import styles from "./index.module.css";

const draft = `Import-Module PSLoom

Invoke-Loom -Draft {
    Thread Reed
    Treadle glog { git log --oneline }

    Sley git {
        Command log {
            Option '--oneline'
        }
        Command status
    }
}`;

const harnesses = [
  {
    name: "Reed",
    role: "Native command completion",
    description:
      "Describe commands, options and arguments in PowerShell. Let Reed handle completion.",
    href: "/modules/reed/overview",
    ready: true,
  },
  {
    name: "Colorway",
    role: "Command-aware highlighting",
    description: "Syntax highlighting shaped by the command you are writing.",
    href: "/modules/colorway",
    ready: false,
  },
  {
    name: "Weft",
    role: "Plugin management",
    description: "A home for managing the plugins that make your shell yours.",
    href: "/modules/weft",
    ready: false,
  },
  {
    name: "Shuttle",
    role: "Binaries and shims",
    description: "Release assets and native tools, brought into your workflow.",
    href: "/modules/shuttle",
    ready: false,
  },
];

export default function Home(): ReactNode {
  return (
    <Layout
      title="Weave your PowerShell"
      description="A declarative profile, command shortcuts, lifecycle hooks and native completion. Build your PowerShell workflow with PSLoom."
    >
      <main className={styles.home}>
        <section className={styles.hero} aria-labelledby="hero-title">
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>
              <span aria-hidden="true">PS &gt;_</span> YOUR SHELL. YOUR THREADS.
            </p>
            <h1 id="hero-title">
              A little structure.
              <br />A shell that feels
              <br />
              <span>like yours.</span>
            </h1>
            <p className={styles.lead}>
              Weave profiles, shortcuts and native completion into one
              declarative PowerShell workflow.
            </p>
            <div className={styles.actions}>
              <Link
                className="button button--primary button--lg"
                to="/getting-started/installation"
              >
                Get started <span aria-hidden="true">↗</span>
              </Link>
              <Link className={styles.textLink} to="/intro">
                Explore the docs <span aria-hidden="true">→</span>
              </Link>
            </div>
            <p className={styles.compatibility}>
              PowerShell 7.6+ <span aria-hidden="true">/</span> Windows · Linux
              · macOS
            </p>
          </div>
          <div className={styles.heroArtwork}>
            <img
              src={useBaseUrl("/img/logo.png")}
              alt="PowerShell Hero weaving luminous cyan threads on a loom"
              width={1024}
              height={1024}
              fetchPriority="high"
            />
          </div>
        </section>
        <div className={styles.releaseNote}>
          <span className={styles.releaseLabel}>BUILD FROM SOURCE</span>
          <p>
            PSLoom and Reed are implemented. PowerShell Gallery releases are
            pending.
          </p>
          <Link to="/contributing/development-setup">
            Development setup <span aria-hidden="true">→</span>
          </Link>
        </div>
        <section className={styles.draftSection} aria-labelledby="draft-title">
          <div>
            <p className={styles.eyebrow}>FROM THREADS TO A WORKFLOW</p>
            <h2 id="draft-title">Your shell, woven together.</h2>
            <p className={styles.lead}>
              A draft connects the pieces of your profile. Load Reed, define a
              shortcut and describe the commands you use every day.
            </p>
            <Link className={styles.textLink} to="/getting-started/first-draft">
              Learn how a draft works <span aria-hidden="true">→</span>
            </Link>
          </div>
          <div className={styles.example}>
            <div className={styles.fileBar}>
              <span>
                <span className={styles.fileIcon} aria-hidden="true">
                  &gt;_
                </span>{" "}
                Microsoft.PowerShell_profile.ps1
              </span>
              <span className={styles.fileType}>POWERSHELL</span>
            </div>
            <CodeBlock language="powershell">{draft}</CodeBlock>
            <div className={styles.exampleCaption}>
              <span>One draft. Your everyday workflow.</span>
              <Link to="/getting-started/first-draft">
                Walk through it <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </section>
        <section className={styles.section} aria-labelledby="workflow-title">
          <div className={styles.sectionHeading}>
            <p className={styles.eyebrow}>LESS GLUE. MORE FLOW.</p>
            <h2 id="workflow-title">Give your profile a common thread.</h2>
          </div>
          <div className={styles.principles}>
            <article>
              <span className={styles.number}>01 / DECLARE</span>
              <h3>A profile you can read.</h3>
              <p>
                Bring your configuration together in a draft. The kernel
                coordinates its lifecycle, once per session.
              </p>
              <Link to="/getting-started/first-draft">
                Write your first draft <span aria-hidden="true">→</span>
              </Link>
            </article>
            <article>
              <span className={styles.number}>02 / CONNECT</span>
              <h3>Shortcuts with context.</h3>
              <p>
                Define command shortcuts with Treadle. Reed carries the target
                command’s completion through to your shortcut.
              </p>
              <Link to="/guides/treadles">
                Make a shortcut <span aria-hidden="true">→</span>
              </Link>
            </article>
            <article>
              <span className={styles.number}>03 / REFINE</span>
              <h3>Room to make it yours.</h3>
              <p>
                Use context-sensitive styles and lifecycle hooks to adapt your
                workflow as your shell grows.
              </p>
              <Link to="/guides/hooks">
                Explore lifecycle hooks <span aria-hidden="true">→</span>
              </Link>
            </article>
          </div>
        </section>
        <section
          className={`${styles.section} ${styles.ecosystem}`}
          aria-labelledby="ecosystem-title"
        >
          <div className={styles.ecosystemIntro}>
            <p className={styles.eyebrow}>THE LOOM & THE THREADS</p>
            <h2 id="ecosystem-title">
              One kernel.
              <br />
              Purposeful extensions.
            </h2>
            <p>
              PSLoom owns the lifecycle and shared services. Harnesses add
              focused capabilities through the Warp contract.
            </p>
            <Link className={styles.textLink} to="/architecture/overview">
              Understand the architecture <span aria-hidden="true">→</span>
            </Link>
          </div>
          <div className={styles.harnesses}>
            {harnesses.map((harness) => (
              <Link
                key={harness.name}
                to={harness.href}
                className={styles.harness}
              >
                <div className={styles.harnessHeading}>
                  <h3>{harness.name}</h3>
                  <span
                    className={harness.ready ? styles.ready : styles.planned}
                  >
                    {harness.ready ? "Implemented · unreleased" : "Planned"}
                  </span>
                  <span className={styles.harnessArrow} aria-hidden="true">
                    ↗
                  </span>
                </div>
                <p className={styles.harnessRole}>{harness.role}</p>
                <p className={styles.harnessDescription}>
                  {harness.description}
                </p>
              </Link>
            ))}
          </div>
        </section>
        <section className={styles.closing} aria-labelledby="start-title">
          <div>
            <p className={styles.eyebrow}>START WITH A SINGLE THREAD</p>
            <h2 id="start-title">Make your next session yours.</h2>
          </div>
          <Link
            className="button button--primary button--lg"
            to="/getting-started/first-draft"
          >
            Write your first draft <span aria-hidden="true">→</span>
          </Link>
        </section>
      </main>
    </Layout>
  );
}
