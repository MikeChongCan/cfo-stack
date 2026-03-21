import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'CPA Stack',
  tagline: 'AI-powered accounting on top of Beancount and the C.L.E.A.R. framework',
  favicon: 'img/logo.svg',

  future: {
    v4: true,
  },

  url: process.env.DOCS_URL ?? 'https://mikechongcan.github.io',
  baseUrl: process.env.DOCS_BASE_URL ?? '/cpa-stack/',
  organizationName: 'MikeChongCan',
  projectName: 'cpa-stack',

  onBrokenLinks: 'throw',
  markdown: {
    hooks: {
      onBrokenMarkdownLinks: 'warn',
    },
  },

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          path: 'content',
          routeBasePath: '/',
          sidebarPath: './sidebars.ts',
          editUrl:
            'https://github.com/MikeChongCan/cpa-stack/tree/main/docs/',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    image: 'img/logo.svg',
    colorMode: {
      respectPrefersColorScheme: true,
    },
    docs: {
      sidebar: {
        hideable: true,
        autoCollapseCategories: true,
      },
    },
    navbar: {
      title: 'CPA Stack',
      logo: {
        alt: 'CPA Stack',
        src: 'img/logo.svg',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'docs',
          position: 'left',
          label: 'Docs',
        },
        {to: '/framework/clear', label: 'CLEAR', position: 'left'},
        {to: '/roadmap/tooling', label: 'Roadmap', position: 'left'},
        {
          href: 'https://github.com/MikeChongCan/cpa-stack',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Docs',
          items: [
            {
              label: 'Overview',
              to: '/',
            },
            {
              label: 'CLEAR framework',
              to: '/framework/clear',
            },
          ],
        },
        {
          title: 'Build',
          items: [
            {
              label: 'Tooling roadmap',
              to: '/roadmap/tooling',
            },
            {
              label: 'Repository',
              href: 'https://github.com/MikeChongCan/cpa-stack',
            },
          ],
        },
        {
          title: 'More',
          items: [
            {
              label: 'License',
              href: 'https://github.com/MikeChongCan/cpa-stack/blob/main/LICENSE',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Mike Chong.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.oneDark,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
