import { themes as prismThemes } from "prism-react-renderer";
import type { Config } from "@docusaurus/types";
import type * as Preset from "@docusaurus/preset-classic";

const config: Config = {
  title: "PSLoom",
  tagline: "The shell-ergonomics layer PowerShell never shipped with",
  url: "https://psloom.github.io",
  baseUrl: "/wiki/",
  organizationName: "PSLoom",
  projectName: "wiki",
  trailingSlash: false,
  onBrokenLinks: "throw",
  i18n: { defaultLocale: "en", locales: ["en"] },
  markdown: {
    mermaid: true,
    hooks: { onBrokenMarkdownLinks: "throw", onBrokenMarkdownImages: "throw" },
  },
  themes: [
    "@docusaurus/theme-mermaid",
    [
      "@easyops-cn/docusaurus-search-local",
      {
        hashed: true,
        docsRouteBasePath: "/",
        indexBlog: false,
        highlightSearchTermsOnTargetPage: true,
      },
    ],
  ],
  presets: [
    [
      "classic",
      {
        docs: {
          routeBasePath: "/",
          sidebarPath: "./sidebars.ts",
          editUrl: "https://github.com/PSLoom/wiki/edit/main/",
        },
        blog: false,
        theme: { customCss: "./src/css/custom.css" },
      } satisfies Preset.Options,
    ],
  ],
  themeConfig: {
    navbar: {
      title: "PSLoom",
      items: [
        {
          type: "docSidebar",
          sidebarId: "docs",
          position: "left",
          label: "Docs",
        },
        {
          href: "https://github.com/PSLoom",
          label: "GitHub",
          position: "right",
        },
      ],
    },
    footer: {
      style: "dark",
      links: [
        {
          title: "Repositories",
          items: [
            { label: "PSLoom", href: "https://github.com/PSLoom/PSLoom" },
            { label: "Reed", href: "https://github.com/PSLoom/Reed" },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Bruno Sales. MIT License.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ["powershell", "csharp"],
    },
  } satisfies Preset.ThemeConfig,
};
export default config;
