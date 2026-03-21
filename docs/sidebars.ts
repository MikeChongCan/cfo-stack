import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  docs: [
    'intro',
    {
      type: 'category',
      label: 'Framework',
      items: ['framework/clear'],
    },
    {
      type: 'category',
      label: 'Reference',
      items: ['reference/skills'],
    },
    {
      type: 'category',
      label: 'Roadmap',
      items: ['roadmap/tooling'],
    },
  ],
};

export default sidebars;
